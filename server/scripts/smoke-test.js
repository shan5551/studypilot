/**
 * Integration test harness using an in-memory MongoDB.
 * Verifies the core API flow: auth, CRUD, data isolation.
 *
 * Run:  node scripts/smoke-test.js
 */
process.env.JWT_SECRET = 'test-secret-0123456789-abcdefghijklmnop';
process.env.JWT_EXPIRE = '7d';
process.env.AI_API_KEY = '';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function main() {
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  // Start server (connectDB reads MONGODB_URI from env)
  const app = require('../server'); // will call connectDB and listen

  await waitForServer();

  const base = `http://localhost:${process.env.PORT || 5000}/api`;
  let passed = 0;
  let failed = 0;

  const check = (name, cond, extra = '') => {
    if (cond) { passed++; console.log(`  PASS: ${name}`); }
    else { failed++; console.log(`  FAIL: ${name} ${extra}`); }
  };

  // ---- 1. Register ----
  console.log('\n[Auth]');
  const regRes = await request(`${base}/auth/register`, {
    method: 'POST',
    body: { name: 'Test User', email: 'test@example.com', password: 'password123' }
  });
  check('register returns token', regRes.status === 201 && regRes.data.token, JSON.stringify(regRes.data));
  const user1token = regRes.data.token;

  // ---- 2. Duplicate email rejected ----
  const dupRes = await request(`${base}/auth/register`, {
    method: 'POST',
    body: { name: 'Test User', email: 'test@example.com', password: 'password123' }
  });
  check('duplicate email rejected', dupRes.status === 400);

  // ---- 3. Login ----
  const loginRes = await request(`${base}/auth/login`, {
    method: 'POST',
    body: { email: 'test@example.com', password: 'password123' }
  });
  check('login returns token', loginRes.status === 200 && loginRes.data.token);

  // ---- 4. Wrong password ----
  const badLogin = await request(`${base}/auth/login`, {
    method: 'POST',
    body: { email: 'test@example.com', password: 'wrongpass123' }
  });
  check('wrong password rejected', badLogin.status === 401);

  // ---- 5. Register second user for isolation test ----
  const reg2 = await request(`${base}/auth/register`, {
    method: 'POST',
    body: { name: 'User Two', email: 'two@example.com', password: 'password456' }
  });
  const user2token = reg2.data.token;

  // ---- 6. Get me ----
  const meRes = await request(`${base}/auth/me`, { token: user1token });
  check('get me returns user', meRes.status === 200 && meRes.data.user.email === 'test@example.com');

  // ---- 7. Unauthorized access ----
  const noAuth = await request(`${base}/subjects`);
  check('no token rejected', noAuth.status === 401);

  // ---- 8. Subjects CRUD ----
  console.log('\n[Subjects]');
  const subRes = await request(`${base}/subjects`, {
    method: 'POST', token: user1token,
    body: { name: 'Computer Networks', color: '#6366f1', semester: 'Sem 4' }
  });
  check('create subject', subRes.status === 201 && subRes.data.subject._id);
  const subjectId = subRes.data.subject._id;

  const subs = await request(`${base}/subjects`, { token: user1token });
  check('list subjects', subs.status === 200 && subs.data.subjects.length === 1);

  const upRes = await request(`${base}/subjects/${subjectId}`, {
    method: 'PUT', token: user1token, body: { description: 'Networking fundamentals' }
  });
  check('update subject', upRes.status === 200 && upRes.data.subject.description === 'Networking fundamentals');

  // ---- 9. Data isolation on subjects ----
  const subByUser2 = await request(`${base}/subjects/${subjectId}`, { token: user2token });
  check('user cannot access other subject', subByUser2.status === 404);

  // ---- 10. Tasks CRUD ----
  console.log('\n[Tasks]');
  const taskRes = await request(`${base}/tasks`, {
    method: 'POST', token: user1token,
    body: { title: 'Study TCP/IP', subject: subjectId, priority: 'high', dueDate: '2026-09-15' }
  });
  check('create task', taskRes.status === 201);
  const taskId = taskRes.data.task._id;

  const tasks = await request(`${base}/tasks?subject=${subjectId}`, { token: user1token });
  check('filter tasks by subject', tasks.status === 200 && tasks.data.tasks.length === 1);

  const toggle = await request(`${base}/tasks/${taskId}/toggle`, { method: 'PATCH', token: user1token });
  check('toggle task completed', toggle.status === 200 && toggle.data.task.status === 'completed');

  const taskByUser2 = await request(`${base}/tasks/${taskId}`, { token: user2token });
  check('user cannot access other task', taskByUser2.status === 404);

  // ---- 11. Notes CRUD ----
  console.log('\n[Notes]');
  const noteRes = await request(`${base}/notes`, {
    method: 'POST', token: user1token,
    body: { title: 'OSI Model', subject: subjectId, content: 'The OSI model has 7 layers. Physical, Data Link, Network, Transport, Session, Presentation, Application.' }
  });
  check('create note', noteRes.status === 201);
  const noteId = noteRes.data.note._id;

  const noteUp = await request(`${base}/notes/${noteId}`, {
    method: 'PUT', token: user1token, body: { content: 'Updated content with more detail about layers.' }
  });
  check('update note', noteUp.status === 200);

  const search = await request(`${base}/notes?search=OSI`, { token: user1token });
  check('search notes', search.status === 200 && search.data.notes.length === 1);

  // ---- 12. Study sessions ----
  console.log('\n[Study Sessions]');
  const start = await request(`${base}/study-sessions/start`, {
    method: 'POST', token: user1token, body: { subject: subjectId }
  });
  check('start session', start.status === 201);
  const sessionId = start.data.session._id;

  // Simulate time passing
  await sleep(1200);
  const end = await request(`${base}/study-sessions/${sessionId}/end`, { method: 'POST', token: user1token });
  check('end session computes duration', end.status === 200 && end.data.session.durationMinutes >= 0);

  // ---- 13. Analytics ----
  console.log('\n[Analytics]');
  const dash = await request(`${base}/analytics/dashboard`, { token: user1token });
  check('dashboard analytics', dash.status === 200 && dash.data.stats);

  const analytics = await request(`${base}/analytics`, { token: user1token });
  check('full analytics', analytics.status === 200 && analytics.data.analytics.studyTime);

  // ---- 14. AI recommend (no API key -> graceful fallback needed) ----
  console.log('\n[AI]');
  const rec = await request(`${base}/ai/recommend`, { method: 'POST', token: user1token });
  // If no API key, expect an error response (not a crash)
  check('recommend handles missing key gracefully', [200, 500, 400].includes(rec.status));

  // ---- 15. Dashboard accuracy ----
  const dash2 = await request(`${base}/analytics/dashboard`, { token: user1token });
  check('dashboard shows 1 completed task', dash2.data.stats.completedTasks === 1, JSON.stringify(dash2.data.stats));

  console.log(`\n===== ${passed} passed, ${failed} failed =====`);
  await mongod.stop();
  process.exit(failed > 0 ? 1 : 0);
}

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, data };
}

async function waitForServer() {
  const max = 40;
  for (let i = 0; i < max; i++) {
    try {
      const res = await fetch(`http://localhost:${process.env.PORT || 5000}/api/health`);
      if (res.ok) return;
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('Server did not start');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
