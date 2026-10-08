import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi, errMsg } from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

const EMPTY = { name: '', email: '', phone: '', department: '', position: '' };

function EmployeeForm({ employee, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(employee ? { ...EMPTY, ...employee } : EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, department: form.department, position: form.position };
      if (employee) await employeeApi.update(employee._id, payload);
      else await employeeApi.create(payload);
      toast.success(employee ? 'Employee updated' : 'Employee added');
      onSaved();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={employee ? 'Edit employee' : 'Add employee'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        {error && <div className="alert">{error}</div>}
        <label>Full name *<input required value={form.name} onChange={set('name')} autoFocus /></label>
        <label>Email *<input required type="email" value={form.email} onChange={set('email')} /></label>
        <div className="row">
          <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
          <label>Department<input value={form.department} onChange={set('department')} /></label>
        </div>
        <label>Position<input value={form.position} onChange={set('position')} /></label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : employee ? 'Save changes' : 'Add employee'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Employees() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | employee
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    employeeApi
      .list(search ? { search } : undefined)
      .then(setEmployees)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [search, toast]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const r = await employeeApi.remove(deleting._id);
      toast.success(r.tasksRemoved ? `Employee deleted (${r.tasksRemoved} task(s) removed)` : 'Employee deleted');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Employees</h1>
          <p className="muted">{employees.length} {employees.length === 1 ? 'person' : 'people'}{search ? ' match your search' : ' on your team'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> Add employee</button>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input placeholder="Search by name, email or department" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employees" />
        </div>
      </div>

      <div className="panel flush">
        {loading ? (
          <div className="center-screen small"><div className="spinner" /></div>
        ) : employees.length === 0 ? (
          <div className="empty">
            <strong>{search ? 'No employees match your search' : 'No employees yet'}</strong>
            <span>{search ? 'Check the spelling or try another term.' : 'Add your first employee to start assigning tasks.'}</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Position</th><th>Phone</th><th>Tasks</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e._id}>
                    <td data-label="Employee">
                      <div className="person">
                        <Avatar name={e.name} />
                        <div><div className="strong">{e.name}</div><div className="muted small-text">{e.email}</div></div>
                      </div>
                    </td>
                    <td data-label="Department">{e.department || '—'}</td>
                    <td data-label="Position">{e.position || '—'}</td>
                    <td data-label="Phone">{e.phone || '—'}</td>
                    <td data-label="Tasks"><Link className="count-link" to={`/tasks?employee=${e._id}`}>{e.taskCount}</Link></td>
                    <td className="actions">
                      <button className="icon-btn" onClick={() => setEditing(e)} aria-label={`Edit ${e.name}`} title="Edit"><Icon name="edit" /></button>
                      <button className="icon-btn danger" onClick={() => setDeleting(e)} aria-label={`Delete ${e.name}`} title="Delete"><Icon name="trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EmployeeForm
          employee={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          busy={busy}
          message={`Delete ${deleting.name}? ${deleting.taskCount ? `Their ${deleting.taskCount} task(s) will also be deleted. ` : ''}This cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
