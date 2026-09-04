import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './reference.css';
import './signin.css';

// Sign in — email + password with a six-digit email verification code.
// Modes: 'login' (default) · 'signup' · 'verify'. Guest data is merged into the
// account server-side on verify/login.
export default function SignIn() {
  const { register, verifyEmail, login, resendCode } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function submitSignup(e) {
    e.preventDefault();
    if (!emailValid) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setBusy(true);
    try {
      await register(email, password, name || undefined);
      setCode(''); setMode('verify');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function submitLogin(e) {
    e.preventDefault();
    if (!emailValid || !password) { setError('Enter your email and password.'); return; }
    setError(''); setBusy(true);
    try {
      await login(email, password);
      navigate('/mocks');
    } catch (err) {
      // Unverified accounts are asked to verify; the server sends a fresh code.
      if (/verify your email/i.test(err.message)) { setCode(''); setMode('verify'); }
      setError(err.message);
    } finally { setBusy(false); }
  }

  async function submitVerify(e) {
    e.preventDefault();
    if (code.length !== 6) { setError('The code is six digits.'); return; }
    setError(''); setBusy(true);
    try {
      await verifyEmail(email, code);
      navigate('/mocks');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function resend() {
    setError(''); setBusy(true);
    try { await resendCode(email); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const stepLabel = mode === 'verify' ? 'B · Code' : mode === 'signup' ? 'A · Sign up' : 'A · Log in';

  return (
    <div className="page centre-wrap">
      <div className="card-420">
        <div className="field-label" style={{ marginBottom: 10 }}>{stepLabel}</div>
        <div className="card card-pad">
          {mode === 'signup' && (
            <form onSubmit={submitSignup}>
              <div className="card-h" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                Create your account
              </div>
              <p className="card-meta">We email a six-digit code to confirm it's you.</p>

              <div className="field-label" style={{ marginTop: 20 }}>Name (optional)</div>
              <input className="text-field" type="text" autoComplete="name" maxLength={120}
                placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />

              <div className="field-label" style={{ marginTop: 16 }}>Email</div>
              <input className="text-field mono" type="email" inputMode="email" autoComplete="email" maxLength={255}
                placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} aria-label="Email" />

              <div className="field-label" style={{ marginTop: 16 }}>Password</div>
              <input className="text-field" type="password" autoComplete="new-password" maxLength={200}
                placeholder="At least 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} aria-label="Password" />

              {error && <ErrorStrip>{error}</ErrorStrip>}
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
                {busy ? 'Sending…' : 'Create account'}
              </button>
              <p className="card-meta" style={{ marginTop: 14 }}>
                Already have an account?{' '}
                <button type="button" className="link-btn" onClick={() => { setMode('login'); setError(''); }}>Log in</button>
              </p>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={submitLogin}>
              <div className="card-h" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                Log in to High Court Clerk CPT
              </div>
              <p className="card-meta">Use your email and password.</p>

              <div className="field-label" style={{ marginTop: 20 }}>Email</div>
              <input className="text-field mono" type="email" inputMode="email" autoComplete="email" maxLength={255}
                placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} aria-label="Email" />

              <div className="field-label" style={{ marginTop: 16 }}>Password</div>
              <input className="text-field" type="password" autoComplete="current-password" maxLength={200}
                placeholder="Your password" value={password}
                onChange={(e) => setPassword(e.target.value)} aria-label="Password" />

              {error && <ErrorStrip>{error}</ErrorStrip>}
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
                {busy ? 'Logging in…' : 'Log in'}
              </button>
              <p className="card-meta" style={{ marginTop: 14 }}>
                New here?{' '}
                <button type="button" className="link-btn" onClick={() => { setMode('signup'); setError(''); }}>Create an account</button>
              </p>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={submitVerify}>
              <div className="card-h" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>Enter the code</div>
              <p className="card-meta">
                Sent to {email} ·{' '}
                <button type="button" className="link-btn" onClick={() => { setMode('login'); setError(''); }}>Change</button>
              </p>
              <input
                className="code-field mono" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                placeholder="••••••" value={code} autoFocus
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Six-digit code"
              />
              {error && <ErrorStrip>{error}</ErrorStrip>}
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
                {busy ? 'Verifying…' : 'Verify and continue'}
              </button>
              <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={resend} disabled={busy}>
                Send a new code
              </button>
            </form>
          )}
        </div>
        {mode !== 'verify' && (
          <p className="fineprint" style={{ marginTop: 14 }}>
            Your email is used only to sign in and send your verification code. It is never shown
            on the rank list — the board shows the handle you choose.
          </p>
        )}
      </div>
    </div>
  );
}

function ErrorStrip({ children }) {
  return (
    <div className="strip strip-rose" style={{ marginTop: 12, borderRadius: 'var(--r-btn)' }}>
      <span className="dot" style={{ background: 'var(--rose)' }}>!</span>
      {children}
    </div>
  );
}
