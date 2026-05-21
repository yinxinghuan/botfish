import { memo } from 'react';

interface AppBarProps {
  score: number;
}

/** Top safe-area spacer. Aigram and iOS both overlay their own real
 *  status bar — we no longer render a fake "9:41 + signal + battery"
 *  underneath it. Just reserves vertical room. */
export const StatusBar = memo(function StatusBar() {
  return <div className="bf-status" aria-hidden />;
});

/** AppBar: logo + wordmark left · score right. */
export const AppBar = memo(function AppBar({ score }: AppBarProps) {
  return (
    <header className="bf-appbar">
      <div className="bf-appbar__left">
        <div className="bf-logo" aria-hidden>
          <span>b</span>
        </div>
        <div className="bf-wordmark">botfish</div>
      </div>
      <div className="bf-appbar__right">
        <div className="bf-score" aria-label={`Score ${score}`}>+{score}</div>
      </div>
    </header>
  );
});
