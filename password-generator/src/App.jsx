import { useCallback, useMemo, useState } from "react";
import "./App.css";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};

function secureRandomIndex(max) {
  // Rejection sampling avoids modulo bias.
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const values = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);
  return value % max;
}

function createPassword(length, enabledTypes) {
  const selectedSets = enabledTypes.map((type) => CHARSETS[type]);
  if (!selectedSets.length) return "";

  const allChars = selectedSets.join("");
  const chars = selectedSets.map((set) => set[secureRandomIndex(set.length)]);

  while (chars.length < length) {
    chars.push(allChars[secureRandomIndex(allChars.length)]);
  }

  // Shuffle to avoid always placing one character from each set at the start.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

function App() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const enabledTypes = useMemo(
    () => Object.keys(options).filter((key) => options[key]),
    [options]
  );

  const generatePassword = useCallback(() => {
    if (!enabledTypes.length) {
      setPassword("");
      setNotice("Choose at least one character type.");
      return;
    }

    setPassword(createPassword(length, enabledTypes));
    setCopied(false);
    setNotice("A new password is ready.");
  }, [enabledTypes, length]);

  const toggleOption = (key) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
    setCopied(false);
    setNotice("");
  };

  const strength = useMemo(() => {
    if (!password) return { label: "Not generated", score: 0, detail: "Generate a password to check it." };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Needs work", score: 2, detail: "Try a longer password and more character types." };
    if (score <= 3) return { label: "Good", score: 3, detail: "Good start. More length can improve it." };
    return { label: "Strong", score: 5, detail: "Long and varied — a stronger choice." };
  }, [password]);

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setNotice("Password copied to clipboard.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Clipboard access was blocked. Select and copy the password manually.");
    }
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#home" aria-label="SecureGen home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3.2 19 6v5.2c0 4.5-2.9 7.8-7 9.6-4.1-1.8-7-5.1-7-9.6V6l7-2.8Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>secure<span className="brand-accent">gen</span></span>
        </a>
        <div className="privacy-pill"><span className="privacy-dot" /> Generated in your browser</div>
      </header>

      <section className="hero" id="home">
        <div className="hero-kicker"><span className="kicker-line" /> PASSWORD TOOLKIT <span className="kicker-line" /></div>
        <h1>A stronger password.<br /><span>Less to worry about.</span></h1>
        <p>Build a unique password in seconds. Set your preferences, generate it, and copy it when you’re ready.</p>
      </section>

      <section className="workspace" aria-label="Password generator">
        <div className="workspace-heading">
          <div>
            <span className="mini-label">PASSWORD WORKSPACE</span>
            <h2>Your password</h2>
          </div>
          <span className="workspace-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10" width="14" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="12" cy="15" r="1.2" fill="currentColor" />
            </svg>
          </span>
        </div>

        <div className="password-output">
          <div className={`password-value ${password ? "has-password" : ""}`} aria-live="polite">
            {password || "Your password will appear here"}
          </div>
          <button className="icon-button copy-button" onClick={copyPassword} disabled={!password} aria-label="Copy password" title="Copy password">
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M16 8V5a1 1 0 0 0-1-1H6a2 2 0 0 0-2 2v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.7" /></svg>
            )}
          </button>
        </div>

        <div className="strength-row">
          <div className="strength-copy">
            <div className="strength-title"><span>Password strength</span><strong className={`strength-${strength.score}`}>{strength.label}</strong></div>
            <div className="strength-track" role="img" aria-label={`Strength: ${strength.label}`}>
              {[1, 2, 3, 4, 5].map((segment) => <span key={segment} className={segment <= strength.score ? `filled strength-fill-${strength.score}` : ""} />)}
            </div>
          </div>
          <span className="strength-shield" aria-hidden="true">✦</span>
        </div>

        <div className="section-divider" />

        <div className="settings-title">
          <div>
            <span className="mini-label">MAKE IT YOURS</span>
            <h2>Customize password</h2>
            <p>Choose the length and characters you want to include.</p>
          </div>
        </div>

        <div className="length-control">
          <div className="control-heading">
            <label htmlFor="password-length">Password length</label>
            <output htmlFor="password-length" className="length-number">{length}<span> chars</span></output>
          </div>
          <input
            id="password-length"
            className="length-slider"
            type="range"
            min="8"
            max="40"
            value={length}
            style={{ "--progress": `${((length - 8) / 32) * 100}%` }}
            onChange={(event) => { setLength(Number(event.target.value)); setCopied(false); }}
          />
          <div className="range-labels"><span>8 characters</span><span>40 characters</span></div>
        </div>

        <div className="character-heading"><span>Character types</span><span>{enabledTypes.length} of 4 selected</span></div>
        <div className="options-grid">
          {[
            { key: "uppercase", title: "Uppercase", sample: "ABC", icon: "A" },
            { key: "lowercase", title: "Lowercase", sample: "abc", icon: "a" },
            { key: "numbers", title: "Numbers", sample: "123", icon: "1" },
            { key: "symbols", title: "Symbols", sample: "!@#", icon: "#" },
          ].map((item) => (
            <label className={`option-card ${options[item.key] ? "selected" : ""}`} key={item.key}>
              <span className="option-symbol" aria-hidden="true">{item.icon}</span>
              <span className="option-info"><span className="option-name">{item.title}</span><span className="option-sample">{item.sample}</span></span>
              <input type="checkbox" checked={options[item.key]} onChange={() => toggleOption(item.key)} aria-label={item.title} />
              <span className="custom-check" aria-hidden="true">{options[item.key] ? "✓" : ""}</span>
            </label>
          ))}
        </div>

        <button className="generate-button" onClick={generatePassword} disabled={!enabledTypes.length}>
          <span className="generate-sparkle" aria-hidden="true">✦</span>
          <span>{password ? "Generate new password" : "Generate secure password"}</span>
          <span className="generate-arrow" aria-hidden="true">↗</span>
        </button>
        <p className="status-message" aria-live="polite">{notice || "Your password is created locally — nothing is sent to a server."}</p>
        <div className="strength-tip"><span aria-hidden="true">i</span><p>{strength.detail}</p></div>
      </section>

      <footer className="page-footer">
        <span className="footer-mark">SECUREGEN</span>
        <span className="footer-separator" />
        <span>Simple tools for safer digital habits.</span>
      </footer>
    </main>
  );
}

export default App;
