import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';
import { BrandMark } from '../components/Layout';
import Icon from '../components/Icon';

// Demo shortcut: always on in dev, and in production only if VITE_DEMO_LOGIN=true
const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO_LOGIN === 'true';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-art">
        <div className="brand"><BrandMark /> TaskFlow</div>
        <div className="login-copy">
          <h2>Run your team’s work from one place.</h2>
          <p>Assign tasks, follow progress and catch deadlines before they slip.</p>
        </div>
        <p className="login-art-foot">Task management for your team</p>
      </section>

      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div className="brand login-mobile-brand"><BrandMark /> TaskFlow</div>
          <div>
            <h1>Welcome back</h1>
            <p className="muted">Sign in to your admin account.</p>
          </div>

          {error && <div className="alert" role="alert">{error}</div>}

          <label>Email
            <span className="field">
              <Icon name="mail" size={17} />
              <input type="email" required autoFocus autoComplete="username" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
            </span>
          </label>
          <label>Password
            <span className="field">
              <Icon name="lock" size={17} />
              <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" />
              <button type="button" className="field-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                <Icon name={show ? 'eyeoff' : 'eye'} size={17} />
              </button>
            </span>
          </label>

          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>

          {SHOW_DEMO && (
            <div className="demo">
              <span>Reviewing this project?</span>
              <button type="button" className="link-btn" onClick={() => setForm({ email: 'admin@example.com', password: 'Admin@123' })}>
                Fill demo login
              </button>
            </div>
          )}
        </form>
        <p className="login-foot">Internal use only. Authorized staff.</p>
      </section>
    </div>
  );
}
