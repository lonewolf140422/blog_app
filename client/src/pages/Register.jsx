import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <h1 className="auth__title">Create an account</h1>
      <p className="auth__sub">It takes about ten seconds.</p>

      <form className="auth__form" onSubmit={submit}>
        <Alert>{error}</Alert>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            value={form.username}
            onChange={set('username')}
            placeholder="letters, numbers or underscore"
            minLength={3}
            maxLength={30}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <span className="field__hint">At least 6 characters.</span>
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="auth__foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
