import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { employeeApi, taskApi, errMsg } from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PriorityBadge } from '../components/Badges';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, toInputDate, dueLabel } from '../utils/format';

function TaskForm({ task, employees, defaultEmployee, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo?._id || defaultEmployee || '',
    priority: task?.priority || 'medium',
    dueDate: toInputDate(task?.dueDate),
    status: task?.status || 'pending',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (task) await taskApi.update(task._id, form);
      else await taskApi.create(form);
      toast.success(task ? 'Task updated' : 'Task created');
      onSaved();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        {error && <div className="alert">{error}</div>}
        {employees.length === 0 && <div className="alert">Add an employee first so you can assign tasks.</div>}
        <label>Title *<input required value={form.title} onChange={set('title')} autoFocus maxLength={150} /></label>
        <label>Description<textarea rows={3} value={form.description} onChange={set('description')} maxLength={2000} /></label>
        <label>Assign to *
          <select required value={form.assignedTo} onChange={set('assignedTo')}>
            <option value="">Select employee…</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </label>
        <div className="row">
          <label>Priority
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={set('status')}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <label>Due date *<input required type="date" value={form.dueDate} onChange={set('dueDate')} /></label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || employees.length === 0}>{busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Tasks() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const employee = params.get('employee') || '';
  const priority = params.get('priority') || '';

  const [allTasks, setAllTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | task
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    employeeApi.list().then(setEmployees).catch((e) => toast.error(errMsg(e)));
  }, [toast]);

  // The server filters by employee / priority / search; status is filtered here so every tab can show its count.
  const load = useCallback(() => {
    const q = {};
    if (employee) q.employee = employee;
    if (priority) q.priority = priority;
    if (search.trim()) q.search = search.trim();
    taskApi
      .list(q)
      .then(setAllTasks)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [employee, priority, search, toast]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  // "New task" button on the dashboard links here with ?new=1
  useEffect(() => {
    if (params.get('new')) {
      setEditing('new');
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const counts = { all: allTasks.length };
  STATUS_OPTIONS.forEach((o) => (counts[o.value] = allTasks.filter((t) => t.status === o.value).length));
  const tasks = status ? allTasks.filter((t) => t.status === status) : allTasks;

  const changeStatus = async (task, next) => {
    const prev = allTasks;
    setAllTasks(allTasks.map((t) => (t._id === task._id ? { ...t, status: next } : t))); // optimistic
    try {
      await taskApi.setStatus(task._id, next);
      toast.success('Status updated');
    } catch (e) {
      setAllTasks(prev);
      toast.error(errMsg(e));
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await taskApi.remove(deleting._id);
      toast.success('Task deleted');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const hasFilters = status || employee || priority || search;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Tasks</h1>
          <p className="muted">{allTasks.length} task{allTasks.length === 1 ? '' : 's'}{employee || priority || search ? ' match your filters' : ' in total'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> New task</button>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tasks" />
        </div>
        <select value={employee} onChange={(e) => setFilter('employee', e.target.value)} aria-label="Filter by employee">
          <option value="">All employees</option>
          {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
        <select value={priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {hasFilters && <button className="btn btn-ghost" onClick={() => { setParams({}, { replace: true }); setSearch(''); }}>Clear filters</button>}
      </div>

      <div className="panel flush">
        <div className="tabs" role="tablist">
          {[{ value: '', label: 'All', n: counts.all }, ...STATUS_OPTIONS.map((s) => ({ ...s, n: counts[s.value] }))].map((t) => (
            <button key={t.value} role="tab" aria-selected={status === t.value} className={status === t.value ? 'active' : ''} onClick={() => setFilter('status', t.value)}>
              {t.label} <span className="count">{t.n}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="center-screen small"><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty">
            <strong>{hasFilters ? 'No tasks match these filters' : 'No tasks yet'}</strong>
            <span>{hasFilters ? 'Try a different status, employee or search.' : 'Create a task and assign it to an employee.'}</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Assigned to</th><th>Priority</th><th>Due</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {tasks.map((t) => {
                  const due = dueLabel(t);
                  return (
                    <tr key={t._id}>
                      <td data-label="Task">
                        <div className="strong">{t.title}</div>
                        {t.description && <div className="muted small-text clamp">{t.description}</div>}
                      </td>
                      <td data-label="Assigned to"><span className="person-inline"><Avatar name={t.assignedTo?.name} size={26} />{t.assignedTo?.name || '—'}</span></td>
                      <td data-label="Priority"><PriorityBadge priority={t.priority} /></td>
                      <td data-label="Due" className={`due due-${due.tone}`}>{due.text}</td>
                      <td data-label="Status">
                        <select className={`status-select status-${t.status}`} value={t.status} onChange={(e) => changeStatus(t, e.target.value)} aria-label={`Status of ${t.title}`}>
                          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="actions">
                        <button className="icon-btn" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`} title="Edit"><Icon name="edit" /></button>
                        <button className="icon-btn danger" onClick={() => setDeleting(t)} aria-label={`Delete ${t.title}`} title="Delete"><Icon name="trash" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <TaskForm
          task={editing === 'new' ? null : editing}
          employees={employees}
          defaultEmployee={editing === 'new' ? employee : ''}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <ConfirmDialog busy={busy} message={`Delete task "${deleting.title}"? This cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
      )}
    </>
  );
}
