import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './reference.css';
import './signin.css';

// Sign in — deck artboard 18. Phone + six-digit OTP, one field at a time.
// Guest data is merged into the account on verify (server-side).
export default function SignIn() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('number');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  async function send(e) {
    e.preventDefault();
    if (!phoneValid) { setError('Enter a 10-digit mobile number.'); return; }
    setError(''); setBusy(true);
    try {
      await sendOtp(phone);
      setStep('code');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function verify(e) {
    e.preventDefault();
    if (code.length !== 6) { setError('The code is six digits.'); return; }
    setError(''); setBusy(true);
    try {
      await verifyOtp(phone, code);
      navigate('/mocks');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="page centre-wrap">
      <div className="card-420">
        <div className="field-label" style={{ marginBottom: 10 }}>
          {step === 'number' ? 'A · Number' : 'B · Code'}
        </div>
        <div className="card card-pad">
          {step === 'number' ? (
            <form onSubmit={send}>
              <div className="card-h" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                Sign in to High Court Clerk CPT
              </div>
              <p className="card-meta">We send a six-digit code. No password.</p>
              <div className="field-label" style={{ marginTop: 20 }}>Mobile number</div>
              <div className="phone-input">
                <span className="phone-cc mono">+91</span>
                <input
                  className="phone-field mono" inputMode="numeric" autoComplete="tel" maxLength={10}
                  placeholder="98••• •••••" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} aria-label="Mobile number"
                />
              </div>
              {error && <ErrorStrip>{error}</ErrorStrip>}
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
                {busy ? 'Sending…' : 'Send the code'}
              </button>
              <p className="fineprint">
                Your number is used only to sign in. It is never shown on the rank list — the board
                shows the handle you choose.
              </p>
            </form>
          ) : (
            <form onSubmit={verify}>
              <div className="card-h" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>Enter the code</div>
              <p className="card-meta">
                Sent to +91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')} ·{' '}
                <button type="button" className="link-btn" onClick={() => { setStep('number'); setError(''); }}>Change</button>
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
              <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={send} disabled={busy}>
                Send a new code
              </button>
            </form>
          )}
        </div>
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
