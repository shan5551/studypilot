import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiApi, noteApi, subjectApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/LoadingSpinner';
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown';
import {
  Sparkles, Send, Copy, Check, RefreshCw, Trash2, Square, StickyNote, BookOpen, Plus, MoreVertical, MessageSquare
} from 'lucide-react';

const suggestions = [
  { icon: '🎯', label: 'Explain this topic simply', prompt: 'Explain how TCP/IP works in simple terms' },
  { icon: '💡', label: 'Give me an example', prompt: 'Give me a real-life example to understand recursion' },
  { icon: '📝', label: 'Quiz me on this topic', prompt: 'Quiz me on the OSI model with 3 questions' },
  { icon: '🧭', label: 'What should I study next?', prompt: 'Based on what I should be learning, what should I study next?' },
  { icon: '👶', label: 'Explain like I\'m a beginner', prompt: 'Explain the difference between HTTP and HTTPS like I am a beginner' }
];

export default function Assistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [context, setContext] = useState(null); // { noteId, subjectId }
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);
  const [contextOptions, setContextOptions] = useState({ notes: [], subjects: [] });
  const bottomRef = useRef(null);
  const [conversationLoading, setConversationLoading] = useState(false);

  // Load conversations list
  useEffect(() => {
    aiApi.conversations().then((res) => {
      setConversations(res.data.conversations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // On new conversation, load context options
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) return;
    Promise.all([noteApi.list({ limit: 100 }), subjectApi.list()])
      .then(([n, s]) => setContextOptions({ notes: n.data.notes || [], subjects: s.data.subjects || [] }))
      .catch(() => {});
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadConversation = useCallback(async (cId) => {
    setConversationLoading(true);
    try {
      const res = await aiApi.conversation(cId);
      setMessages(res.data.messages || []);
      setConversationId(cId);
      setContext(res.data.conversation?.context || null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConversationLoading(false);
    }
  }, []);

  const newConversation = () => {
    setMessages([]);
    setConversationId(null);
    setContext(null);
    setError(null);
  };

  const send = async (text) => {
    const message = (text || input).trim();
    if (!message || sending) return;

    const userMsg = { role: 'user', content: message, _local: true };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setError(null);

    // Optimistic placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '', _typing: true }]);

    try {
      const res = await aiApi.chat({ message, conversationId, context });
      setConversationId(res.data.conversationId);
      setMessages((prev) => {
        const next = [...prev];
        // Replace last typing placeholder
        next.pop();
        next.push({ role: 'assistant', content: res.data.response });
        return next;
      });
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        next.pop();
        next.push({ role: 'assistant', content: `⚠️ ${e.message}`, _error: true });
        return next;
      });
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const regenerate = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    // Remove last assistant message
    setMessages((prev) => {
      const next = [...prev];
      while (next[next.length - 1]?.role === 'assistant') next.pop();
      return next;
    });
    await send(lastUser.content);
  };

  const clearConversation = async () => {
    if (conversationId) {
      try { await aiApi.deleteConversation(conversationId); } catch (e) { /* ignore */ }
    }
    newConversation();
    toast.success('Conversation cleared');
    // Refresh list
    aiApi.conversations().then((res) => setConversations(res.data.conversations || [])).catch(() => {});
  };

  const copyMsg = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text.slice(0, 20));
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const getContextLabel = () => {
    if (!context) return null;
    if (context.noteId) {
      const n = contextOptions.notes.find((x) => x._id === context.noteId);
      if (n) return { type: 'note', name: n.title, id: n._id };
    }
    if (context.subjectId) {
      const s = contextOptions.subjects.find((x) => x._id === context.subjectId);
      if (s) return { type: 'subject', name: s.name, id: s._id };
    }
    return null;
  };

  const ctx = getContextLabel();

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI Assistant</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Ask anything about your studies. Conversations stay private to you.</p>
        </div>
        <div className="flex items-center gap-2">
          {ctx && (
            <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-3 py-1.5 text-xs font-medium">
              {ctx.type === 'note' ? <StickyNote className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
              {ctx.name}
              <button onClick={() => setContext(null)} className="text-brand-400 hover:text-brand-600 ml-0.5">✕</button>
            </span>
          )}
          <Button size="sm" variant="secondary" onClick={newConversation}>
            <Plus className="h-4 w-4" /> New chat
          </Button>
          <Button size="sm" variant="ghost" onClick={clearConversation} disabled={!conversationId && messages.length === 0}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Conversations list */}
        <div className="hidden lg:block">
          <div className="card p-3 space-y-1">
            <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Conversations</p>
            {conversations.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-400">No past conversations yet</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => loadConversation(c._id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${conversationId === c._id ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="card flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
          {conversationLoading ? (
            <Spinner />
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold">How can I help you study?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6 text-center max-w-md">
                Ask about any concept, get explanations grounded in your notes, or plan your next study session.
              </p>

              {/* Context picker */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <Dropdown
                  align="left"
                  width="w-72"
                  trigger={<Button size="sm" variant="secondary"><StickyNote className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Use a note</Button>}
                >
                  <div className="max-h-64 overflow-y-auto">
                    {contextOptions.notes.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No notes yet</p>}
                    {contextOptions.notes.map((n) => (
                      <DropdownItem key={n._id} onClick={() => setContext({ noteId: n._id })}>
                        <span className="truncate">{n.title}</span>
                      </DropdownItem>
                    ))}
                  </div>
                </Dropdown>
                <Dropdown
                  align="left"
                  width="w-72"
                  trigger={<Button size="sm" variant="secondary"><BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Use a subject</Button>}
                >
                  <div className="max-h-64 overflow-y-auto">
                    {contextOptions.subjects.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No subjects yet</p>}
                    {contextOptions.subjects.map((s) => (
                      <DropdownItem key={s._id} onClick={() => setContext({ subjectId: s._id })}>
                        <span className="truncate">{s.name}</span>
                      </DropdownItem>
                    ))}
                  </div>
                </Dropdown>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => send(s.prompt)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 transition-colors"
                  >
                    <span>{s.icon}</span>
                    <span className="flex-1">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  msg={m}
                  onCopy={copyMsg}
                  copied={copied}
                  onRegenerate={m.role === 'assistant' && i === messages.length - 1 && !m._error ? regenerate : null}
                />
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pl-12">
                  <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-3">
            {error && <p className="text-xs text-red-500 mb-2 px-1">⚠️ {error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                className="input flex-1 min-h-[44px] max-h-32 resize-none"
                rows={1}
              />
              <Button onClick={() => send()} disabled={!input.trim() || sending} className="h-11 w-11 !px-0" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onCopy, copied, onRegenerate }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg._typing) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex gap-1 pt-3">
          <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
          <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shrink-0">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 px-4 py-3">
        {msg.content ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        ) : null}
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onCopy(msg.content)} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Copy response">
            {copied && msg.content.startsWith(copied) ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Regenerate">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}