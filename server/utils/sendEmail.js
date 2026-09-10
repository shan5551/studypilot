// Mail courier: real SMTP delivery when configured, otherwise a readable
// console fallback so the app (and the verification/reset flows) remain
// testable without any mail credentials.
//
// Configure via these env vars (all optional):
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE ('true' for 465),
//   SMTP_USER, SMTP_PASS, SMTP_FROM (defaults to SMTP_USER)

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER) return null; // no SMTP configured → log mode
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (t) {
    await t.sendMail({
      from: process.env.SMTP_FROM || `StudyPilot <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
    return;
  }

  // Dev / no-SMTP fallback: print the email to the server log so the flow
  // can be tested end-to-end. The console link is clickable in most terminals.
  console.log('\n────────── [STUDYPILOT MAIL (no SMTP — printed to log)] ──────────');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(text || html || '');
  console.log('────────────────────────────────────────────────────────────\n');
}

module.exports = { sendEmail };