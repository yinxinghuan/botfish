interface AppBarProps {
  score: number;
  lives: number;
  maxLives: number;
}

/** Fake iOS status bar — kept dark on cream to match Hinge feel. */
export function StatusBar() {
  return (
    <div className="bf-status">
      <span className="bf-status__time">9:41</span>
      <span className="bf-status__right">
        <svg viewBox="0 0 18 12" className="bf-status__sig" aria-hidden>
          <path d="M2 9.5 a4 4 0 0 1 5 0" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M4 11 a2 2 0 0 1 3 0" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="5.5" cy="11.5" r="0.8" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 14 10" className="bf-status__wifi" aria-hidden>
          <path d="M0 4 a8 8 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2 6 a6 6 0 0 1 10 0" fill="none" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M4 8 a4 4 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="7" cy="9.5" r="0.9" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 13" className="bf-status__batt" aria-hidden>
          <rect x="0" y="0.5" width="20" height="12" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="2" y="2.5" width="16" height="8" fill="currentColor"/>
          <rect x="21" y="3.5" width="2" height="6" fill="currentColor"/>
        </svg>
      </span>
    </div>
  );
}

/** Single heart icon — solid red when on, hollow when lost. */
function Heart({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`bf-heart ${on ? '' : 'bf-heart--off'}`} aria-hidden>
      <path d="M12 21s-7.5-4.8-9.6-9.2C.7 7.4 4 3 8.2 3c2 0 3.4 1 3.8 2.2C12.4 4 13.8 3 15.8 3 20 3 23.3 7.4 21.6 11.8 19.5 16.2 12 21 12 21z"/>
    </svg>
  );
}

/** AppBar: logo + wordmark left · hearts + score right. */
export function AppBar({ score, lives, maxLives }: AppBarProps) {
  return (
    <header className="bf-appbar">
      <div className="bf-appbar__left">
        <div className="bf-logo" aria-hidden>
          <span>b</span>
        </div>
        <div className="bf-wordmark">botfish</div>
      </div>
      <div className="bf-appbar__right">
        <div className="bf-lives" aria-label={`Lives ${lives} of ${maxLives}`}>
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart key={i} on={i < lives} />
          ))}
        </div>
        <div className="bf-score" aria-label={`Score ${score}`}>+{score}</div>
      </div>
    </header>
  );
}
