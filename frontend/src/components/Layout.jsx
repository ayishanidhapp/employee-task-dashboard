import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statsApi } from '../api/client';
import Icon from './Icon';
import Avatar from './Avatar';

export const BrandMark = ({ size = 32 }) => (
  <svg className="brandmark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="#2358E8" />
    <path d="m9 16.5 4.8 4.8L23 11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GROUPS = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }] },
  {
    label: 'Manage',
    items: [
      { to: '/tasks', label: 'Tasks', icon: 'tasks', badge: 'openTasks' },
      { to: '/employees', label: 'Employees', icon: 'users', badge: 'employees' },
    ],
  },
];
const TITLES = { '/': 'Dashboard', '/tasks': 'Tasks', '/employees': 'Employees' };

const readCollapsed = () => {
  try { return localStorage.getItem('taskflow_sidebar') === 'collapsed'; } catch { return false; }
};

export default function Layout() {
  const { admin, logout } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [counts, setCounts] = useState({});
  const menuRef = useRef(null);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem('taskflow_sidebar', c ? 'open' : 'collapsed'); } catch { /* ignore */ }
      return !c;
    });
  };

  // Sidebar badges: refresh whenever the user navigates
  useEffect(() => {
    statsApi
      .get()
      .then((d) => setCounts({ employees: d.totalEmployees, openTasks: d.status.pending + d.status['in-progress'] }))
      .catch(() => {});
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => (e.type === 'keydown' ? e.key === 'Escape' && setMenu(false) : !menuRef.current?.contains(e.target) && setMenu(false));
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [menu]);

  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className={`sidebar ${drawer ? 'open' : ''}`}>
        <div className="sidebar-head"><div className="brand"><BrandMark /><span className="label">TaskFlow</span></div></div>

        <nav className="sidebar-nav" aria-label="Main">
          {GROUPS.map((g) => (
            <div className="nav-group" key={g.label}>
              <div className="nav-label">{g.label}</div>
              {g.items.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className="nav-link" title={collapsed ? l.label : undefined}>
                  <Icon name={l.icon} size={19} />
                  <span className="label">{l.label}</span>
                  {l.badge && counts[l.badge] !== undefined && <span className="nav-badge">{counts[l.badge]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot"><span>TaskFlow v1.0</span></div>
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label="Open menu"><Icon name="menu" size={22} /></button>
            <button className="icon-btn collapse-btn" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <Icon name="panel" size={20} />
            </button>
            <nav className="crumbs" aria-label="Breadcrumb"><span>TaskFlow</span><span aria-hidden="true">/</span><strong>{TITLES[pathname] || 'Page'}</strong></nav>
          </div>

          <div className="topbar-right">
            <span className="today"><Icon name="calendar" size={16} /> {today}</span>
            <div className="user-menu" ref={menuRef}>
              <button className="user-trigger" onClick={() => setMenu(!menu)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu">
                <Avatar name={admin?.name} size={32} />
                <span className="name">{admin?.name}</span>
                <Icon name="chevron" size={16} />
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <div className="dropdown-head">
                    <strong>{admin?.name}</strong>
                    <span>{admin?.email}</span>
                  </div>
                  <button role="menuitem" onClick={logout}><Icon name="logout" size={17} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
