// Formatting helpers

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const formatRelative = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = d - now;
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);

  if (diffMin < 0) {
    if (diffMin > -60) return `${Math.abs(diffMin)}m overdue`;
    if (diffHr > -24) return `${Math.abs(diffHr)}h overdue`;
    return `${Math.abs(diffDay)}d overdue`;
  }
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffHr < 24) return `in ${diffHr}h`;
  if (diffDay < 8) return `in ${diffDay}d`;
  return formatDate(date);
};

export const isToday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

export const isOverdue = (date) => {
  if (!date) return false;
  return new Date(date) < new Date() ;
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const formatMinutes = (minutes) => {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const timeAgo = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const seconds = Math.floor((new Date() - d) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const greeting = (name) => {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 18) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
};

export const firstName = (name) => {
  if (!name) return '';
  return name.split(' ')[0];
};

export const initials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
};

export const wordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const charCount = (text) => (text || '').length;

export const stripMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`\-_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const excerpt = (text, len = 120) => {
  if (!text) return '';
  const clean = stripMarkdown(text);
  return clean.length > len ? clean.slice(0, len) + '…' : clean;
};

export const colorFor = (subject) => subject?.color || '#6366f1';