import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { noteApi, taskApi, subjectApi } from '../../services/api';
import { useDebounce } from '../../hooks/useFetch';
import { Spinner } from '../../components/ui/LoadingSpinner';
import { Search, StickyNote, CheckSquare, BookOpen, FileX } from 'lucide-react';
import { excerpt, formatRelative } from '../../utils/format';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 350);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!debounced.trim()) {
      setResult(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const t = setTimeout(() => {
      Promise.allSettled([
        noteApi.list({ search: debounced, limit: 20 }),
        taskApi.list({ search: debounced }),
        subjectApi.list()
      ]).then(([notes, tasks, subjects]) => {
        const noteRes = notes.status === 'fulfilled' ? notes.value.data.notes || [] : [];
        const taskRes = tasks.status === 'fulfilled' ? tasks.value.data.tasks || [] : [];
        // Filter subjects client-side by name
        const subjectRes = subjects.status === 'fulfilled'
          ? (subjects.value.data.subjects || []).filter((s) => s.name.toLowerCase().includes(debounced.toLowerCase()))
          : [];
        setResult({ notes: noteRes, tasks: taskRes, subjects: subjectRes });
        setLoading(false);
      });
    }, 350);
    return () => clearTimeout(t);
  }, [debounced]);

  const total = result ? result.notes.length + result.tasks.length + result.subjects.length : 0;

  return (
    <div className="space-y-5 animate-slide-up max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Search</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Find notes, tasks, and subjects instantly.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          autoFocus
          className="input pl-11 py-3 text-base"
          placeholder="Search your study materials…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <Spinner />}

      {searched && !loading && result && (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total === 0 ? 'No results for' : `${total} result${total !== 1 ? 's' : ''} for`}{' '}
            <span className="font-medium text-slate-800 dark:text-slate-200">"{debounced}"</span>
          </p>

          {total === 0 ? (
            <div className="card p-10 text-center">
              <FileX className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">Nothing found. Try a different keyword.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.subjects.length > 0 && (
                <Section icon={BookOpen} title="Subjects" count={result.subjects.length}>
                  {result.subjects.map((s) => (
                    <Link key={s._id} to={`/subjects/${s._id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div className="h-8 w-1 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                      <span className="ml-auto text-xs text-slate-400">{s.progress}% complete</span>
                    </Link>
                  ))}
                </Section>
              )}

              {result.tasks.length > 0 && (
                <Section icon={CheckSquare} title="Tasks" count={result.tasks.length}>
                  {result.tasks.map((t) => (
                    <Link key={t._id} to="/tasks" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <span className={`h-2 w-2 rounded-full ${t.status === 'completed' ? 'bg-emerald-500' : t.priority === 'urgent' ? 'bg-red-500' : 'bg-brand-500'}`} />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.title}</span>
                      <span className="ml-auto text-xs text-slate-400 shrink-0">
                        {t.dueDate ? formatRelative(t.dueDate) : t.status}
                      </span>
                    </Link>
                  ))}
                </Section>
              )}

              {result.notes.length > 0 && (
                <Section icon={StickyNote} title="Notes" count={result.notes.length}>
                  {result.notes.map((n) => (
                    <Link key={n._id} to={`/notes/${n._id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div className="h-8 w-1 rounded-full" style={{ backgroundColor: n.subject?.color || '#94a3b8' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                        <p className="text-xs text-slate-400 truncate">{excerpt(n.content, 80)}</p>
                      </div>
                    </Link>
                  ))}
                </Section>
              )}
            </div>
          )}
        </>
      )}

      {!searched && (
        <div className="card p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">Type to search across your notes, tasks, and subjects.</p>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="card divide-y divide-slate-100 dark:divide-slate-800">
      <div className="flex items-center gap-2 px-4 py-3">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
        <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800">{count}</span>
      </div>
      {children}
    </div>
  );
}