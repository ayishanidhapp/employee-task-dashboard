import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi, errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { dueLabel, greeting } from '../utils/format';

function Kpi({ label, value, to, tone }) {
  return (
    <Link to={to} className={`kpi kpi-${tone || 'plain'}`}>
      <span className="kpi-label">{tone && <i className="dot" />}{label}</span>
      <span className="kpi-value">{value}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { admin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    statsApi.get().then(setData).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  const { status, totalTasks } = data;
  const pct = (n) => (totalTasks ? Math.round((n / totalTasks) * 100) : 0);
  const rate = pct(status.completed);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{greeting()}, {admin?.name?.split(' ')[0]}</h1>
          <p className="muted">{today}. {data.overdue ? `${data.overdue} task${data.overdue > 1 ? 's are' : ' is'} overdue.` : 'Nothing is overdue.'}</p>
        </div>
        <Link to="/tasks?new=1" className="btn btn-primary"><Icon name="plus" size={16} /> New task</Link>
      </header>

      <div className="kpis">
        <Kpi label="Employees" value={data.totalEmployees} to="/employees" />
        <Kpi label="Total tasks" value={totalTasks} to="/tasks" />
        <Kpi label="Pending" value={status.pending} to="/tasks?status=pending" tone="pending" />
        <Kpi label="In progress" value={status['in-progress']} to="/tasks?status=in-progress" tone="progress" />
        <Kpi label="Completed" value={status.completed} to="/tasks?status=completed" tone="done" />
        <Kpi label="Overdue" value={data.overdue} to="/tasks" tone="late" />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Task status</h2>
            <span className="muted">{rate}% complete</span>
          </div>
          {totalTasks === 0 ? (
            <p className="empty-note">No tasks yet. Create one to see progress here.</p>
          ) : (
            <>
              <div className="stack" role="img" aria-label={`${status.pending} pending, ${status['in-progress']} in progress, ${status.completed} completed`}>
                <span className="seg seg-done" style={{ width: `${pct(status.completed)}%` }} />
                <span className="seg seg-progress" style={{ width: `${pct(status['in-progress'])}%` }} />
                <span className="seg seg-pending" style={{ width: `${pct(status.pending)}%` }} />
              </div>
              <dl className="breakdown">
                <div><dt><i className="dot seg-done" />Completed</dt><dd>{status.completed}</dd></div>
                <div><dt><i className="dot seg-progress" />In progress</dt><dd>{status['in-progress']}</dd></div>
                <div><dt><i className="dot seg-pending" />Pending</dt><dd>{status.pending}</dd></div>
              </dl>
            </>
          )}
          <div className="prio-row">
            <span className="muted">By priority</span>
            <span><i className="prio-dot prio-high" />High {data.priority.high}</span>
            <span><i className="prio-dot prio-medium" />Medium {data.priority.medium}</span>
            <span><i className="prio-dot prio-low" />Low {data.priority.low}</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Team workload</h2><Link to="/employees">View all</Link></div>
          {data.topEmployees.length === 0 ? (
            <p className="empty-note">No tasks are assigned yet.</p>
          ) : (
            <ul className="workload">
              {data.topEmployees.map((e) => (
                <li key={e._id}>
                  <Avatar name={e.name} size={32} />
                  <div className="workload-body">
                    <div className="workload-top">
                      <Link to={`/tasks?employee=${e._id}`}>{e.name}</Link>
                      <span className="muted">{e.completed} of {e.total} done</span>
                    </div>
                    <div className="meter"><span style={{ width: `${(e.completed / e.total) * 100}%` }} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel flush">
        <div className="panel-head padded"><h2>Upcoming deadlines</h2><Link to="/tasks">All tasks</Link></div>
        {data.upcoming.length === 0 ? (
          <p className="empty-note padded">All caught up. No open tasks.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Assigned to</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {data.upcoming.map((t) => {
                  const due = dueLabel(t);
                  return (
                    <tr key={t._id}>
                      <td data-label="Task" className="strong">{t.title}</td>
                      <td data-label="Assigned to"><span className="person-inline"><Avatar name={t.assignedTo?.name} size={24} />{t.assignedTo?.name || '—'}</span></td>
                      <td data-label="Priority"><PriorityBadge priority={t.priority} /></td>
                      <td data-label="Due" className={`due due-${due.tone}`}>{due.text}</td>
                      <td data-label="Status"><StatusBadge status={t.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
