export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const statusLabel = (v) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v;
export const priorityLabel = (v) => PRIORITY_OPTIONS.find((s) => s.value === v)?.label || v;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// yyyy-mm-dd for <input type="date">
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const isOverdue = (task) =>
  task.status !== 'completed' && new Date(task.dueDate) < new Date(new Date().toDateString());

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

// "Due today", "Due in 3 days", "5 days overdue"
export function dueLabel(task) {
  const today = new Date(new Date().toDateString());
  const days = Math.round((new Date(task.dueDate) - today) / 86400000);
  if (task.status === 'completed') return { text: formatDate(task.dueDate), tone: 'done' };
  if (days < 0) return { text: `${-days} day${days === -1 ? '' : 's'} overdue`, tone: 'late' };
  if (days === 0) return { text: 'Due today', tone: 'soon' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'soon' };
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'soon' };
  return { text: formatDate(task.dueDate), tone: 'normal' };
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
