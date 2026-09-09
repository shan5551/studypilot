import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, StickyNote, GraduationCap, CheckSquare, BarChart3, Lightbulb,
  ArrowRight, BookOpen, LayoutDashboard, Clock, Target, Layers, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Study Assistant',
    description: 'Ask anything about your course material. Get clear explanations, examples, and concepts broken down simply — grounded in your own notes.',
    color: 'text-brand-600 bg-brand-50 dark:bg-brand-950 dark:text-brand-400'
  },
  {
    icon: GraduationCap,
    title: 'AI Quiz Generation',
    description: 'Turn any note or subject into practice quizzes in seconds. Multiple choice, true/false, and short answer — then review your weak topics.',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400'
  },
  {
    icon: StickyNote,
    title: 'Smart Notes',
    description: 'Write structured notes with one-click AI summaries. Organize by subject, tag them, and search everything instantly.',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Plan assignments, prioritize with urgency levels, set deadlines, and stay on top of your workload with a clean task board.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400'
  },
  {
    icon: BarChart3,
    title: 'Study Analytics',
    description: 'See exactly how you study. Daily and weekly hours, quiz accuracy across subjects, streaks, and meaningful progress charts.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400'
  },
  {
    icon: Lightbulb,
    title: 'Personalized Recommendations',
    description: 'StudyPilot reads your real data — overdue work, weak quiz topics, neglected subjects — and tells you exactly what to do next.',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400'
  }
];

const steps = [
  { num: '1', title: 'Organize your study material', desc: 'Create subjects, add your notes, and structure your tasks and deadlines in one place.', icon: Layers },
  { num: '2', title: 'Let AI help you understand it', desc: 'Get explanations in plain language and one-click summaries of any note.', icon: Sparkles },
  { num: '3', title: 'Practice with generated quizzes', desc: 'Turn your notes into quizzes, test yourself, and identify exactly what to review.', icon: Target },
  { num: '4', title: 'Track your progress', desc: 'Watch your study hours, streaks, and subject mastery grow on a clear analytics dashboard.', icon: BarChart3 }
];

const stats = [
  { value: '25+', label: 'Study features' },
  { value: '10s', label: 'Data visualizations' },
  { value: '2-way', label: 'AI + study data' },
  { value: '100%', label: 'Your data private' }
];

export default function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">StudyPilot</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white">How it works</a>
            <a href="#product" className="hover:text-slate-900 dark:hover:text-white">Product</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
              Log in
            </button>
            <Link to="/register" className="btn-primary">Get started</Link>
          </div>

          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden px-4 py-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col gap-3 text-sm font-medium">
              <a href="#features" className="hover:text-brand-600" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#how-it-works" className="hover:text-brand-600" onClick={() => setMobileOpen(false)}>How it works</a>
              <a href="#product" className="hover:text-brand-600" onClick={() => setMobileOpen(false)}>Product</a>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/login')} className="btn-secondary flex-1">Log in</button>
              <Link to="/register" className="btn-primary flex-1">Get started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50 to-transparent dark:from-brand-950/30 dark:to-transparent -z-10" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <div className="mx-auto mb-5 flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 w-fit text-xs font-medium text-slate-600 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            AI-powered study companion
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.1]">
            Study smarter.
            <br />
            <span className="text-brand-600 dark:text-brand-400">Understand faster.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            StudyPilot brings your subjects, notes, tasks, and study time together in one place —
            then uses AI to explain concepts, quiz you, and point you at what to study next.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-base w-full sm:w-auto">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={() => navigate('/login')} className="btn-secondary px-6 py-3 text-base w-full sm:w-auto">
              View Demo
            </button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-8 flex-wrap text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Organize subjects & tasks</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> AI explanations & summaries</span>
            <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> Generated practice quizzes</span>
            <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Progress analytics</span>
          </div>
        </div>
      </section>

      {/* Dashboard mockup */}
      <section id="product" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="flex h-10 items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-slate-400">studypilot.app/dashboard</span>
          </div>
          <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
            <div className="col-span-2 hidden lg:block">
              <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 space-y-2">
                {['Dashboard', 'Subjects', 'Tasks', 'Notes', 'Assistant', 'Quizzes', 'Analytics'].map((x, i) => (
                  <div key={x} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium ${i === 0 ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 text-brand-300' : 'text-slate-400'}`}>
                    <span className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700" />
                    {x}
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {['Tasks done', 'Study hours', 'Subjects', 'Quiz accuracy', 'Streak', 'Pending'].map((s, i) => (
                  <div key={s} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                    <div className="h-2 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-2 h-5 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-1 h-2 w-14 rounded bg-slate-200/60 dark:bg-slate-800/60" />
                    <span className="sr-only">{s}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Weekly study hours</span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400"><Clock className="h-3 w-3" /> 9.5h</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {[3, 5, 2, 6, 4, 7, 5].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t bg-brand-500/80 dark:bg-brand-500/60"
                          style={{ height: `${h * 11}px` }}
                        />
                        <span className="text-[9px] text-slate-400">{['M','T','W','T','F','S','S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                  <div className="mb-3 flex items-center gap-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-950"><Sparkles className="h-3 w-3 text-brand-600 dark:text-brand-400" /></span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">AI recommendation</span>
                  </div>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    "You have three unfinished tasks in{" "}
                    <span className="text-slate-800 dark:text-slate-200 font-medium">Computer Networks</span>.
                    The highest-priority one — <span className="text-slate-800 dark:text-slate-200 font-medium">Study TCP/IP — is due tomorrow</span>.
                    Start there before picking a new topic."
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                    View task <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to study</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
            Six connected tools working together — not a pile of disconnected features.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-cardHover transition-shadow">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
              From scattered material to a clear study plan in four steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="relative rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
                    {s.num}
                  </div>
                  <s.icon className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-brand-600 to-brand-700 dark:from-brand-600 dark:to-brand-800 px-6 sm:px-12 py-14 text-center overflow-hidden relative">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to study smarter?</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-100">
            Create your account free, add your first subject and note, and let StudyPilot take over the busywork.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50 transition-colors w-full sm:w-auto">
              Get started — it's free <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={() => navigate('/login')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors w-full sm:w-auto">
              I already have an account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">StudyPilot</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} StudyPilot. Built for students who want to understand, not just memorize.
          </p>
        </div>
      </footer>
    </div>
  );
}