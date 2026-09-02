import { useState } from 'react';
import './reference.css';
import './signin.css';

// Sign in — deck artboard 18. Phone + six-digit OTP, one field at a time.
// Phase 1 renders the states; OTP send/verify is wired in Phase 4.
export default function SignIn() {
  const [step, setStep] = useState('number'); // 'number' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  function sendCode(e) {
    e.preventDefault();
    if (!phoneValid) { setError('Enter a 10-digit mobile number.'); return; }
    setError('');
    setStep('code'); // Phase 4: POST /api/auth/otp/send
  }
  function verify(e) {
    e.preventDefault();
    // Phase 4: POST /api/auth/otp/verify. Placeholder validation for now.
    if (code.length !== 6) { setError('The code is six digits.'); return; }
    setError('');
  }

  return (
    <div className="page centre-wrap">
      <div className="card-420">
        <div className="field-label" style={{ marginBottom: 10 }}>
          {step === 'number' ? 'A · Number' : 'B · Code'}
        </div>
        <div className="card card-pad">
          {step === 'number' ? (
            <form onSubmit={sendCode}>
              <div className="card-h" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                Sign in to High Court Clerk CPT
              </div>
              <p className="card-meta">We send a six-digit code. No password.</p>

              <div className="field-label" style={{ marginTop: 20 }}>Mobile number</div>
              <div className="phone-input">
                <span className="phone-cc mono">+91</span>
                <input
                  className="phone-field mono"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="98••• •••••"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  aria-label="Mobile number"
                />
              </div>

              {error && <ErrorStrip>{error}</ErrorStrip>}

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
                Send the code
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
                <button type="button" className="link-btn" onClick={() => setStep('number')}>Change</button>
              </p>

              <input
                className="code-field mono"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                aria-label="Six-digit code"
              />

              {error && <ErrorStrip>{error}</ErrorStrip>}

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
                Verify and continue
              </button>
              <div className="strip strip-amber" style={{ marginTop: 14, borderRadius: 'var(--r-btn)' }}>
                <span className="dot dot-amber" style={{ background: 'var(--amber)' }}>◔</span>
                Resend available in <span className="mono">00:24</span>
              </div>
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
