import { useEffect, useState } from 'react';
import { useBotfish } from './hooks/useBotfish';
import { PhotoCard } from './components/PhotoCard';
import { EndScreen } from './components/EndScreen';
import { TutorialOverlay } from './components/TutorialOverlay';
import { StatusBar, AppBar } from './components/Chrome';
import { useGameScore, Leaderboard } from '@shared/leaderboard';
import { t } from './i18n';
import alteruUrl from './img/alteru.svg';
import './Botfish.less';

export default function Botfish() {
  const {
    screen, score, banner, best, stats, hasInteracted,
    stack, rootRef, start, swipeLeft, swipeRight,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  } = useBotfish();

  const { isInAigram, submitScore, fetchLeaderboard } = useGameScore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (screen === 'end' && stats.finalScore > 0) {
      submitScore(stats.finalScore);
    }
  }, [screen, stats.finalScore, submitScore]);

  const showTutorial = !hasInteracted && screen === 'playing';

  return (
    <div
      className="bf-root"
      ref={rootRef}
      onPointerDown={(e) => {
        if (screen !== 'playing') return;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        onPointerDown(e.clientX);
        e.preventDefault();
      }}
      onPointerMove={(e) => onPointerMove(e.clientX)}
      onPointerUp={() => onPointerUp()}
      onPointerCancel={() => onPointerCancel()}
    >
      <StatusBar />
      <AppBar score={score} />

      <div className="bf-deck">
        {stack.map((card, i) => {
          const fromTop = stack.length - 1 - i;
          return (
            <PhotoCard
              key={card.uid}
              card={card}
              depth={fromTop}
              isActive={fromTop === 0}
            />
          );
        })}
      </div>

      {screen === 'playing' && (
        <div className="bf-buttons-row">
          <button
            className="bf-action bf-action--nope"
            onPointerDown={(e) => { e.stopPropagation(); swipeLeft(); }}
            aria-label={t('stamp_nope')}
          >
            <svg viewBox="0 0 24 24"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>
          </button>
          <button
            className="bf-action bf-action--like"
            onPointerDown={(e) => { e.stopPropagation(); swipeRight(); }}
            aria-label={t('stamp_like')}
          >
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.8-9.6-9.2C.7 7.4 4 3 8.2 3c2 0 3.4 1 3.8 2.2C12.4 4 13.8 3 15.8 3 20 3 23.3 7.4 21.6 11.8 19.5 16.2 12 21 12 21z"/></svg>
          </button>
        </div>
      )}

      {banner && (
        <div key={banner.tick} className="bf-banner">
          <span className="bf-banner__chip" style={{ background: banner.color }}>
            {t(banner.key)}
          </span>
        </div>
      )}

      {showTutorial && <TutorialOverlay />}

      {screen === 'end' && (
        <EndScreen
          stats={stats}
          best={best}
          onAgain={start}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          gameName="BOTFISH"
          onClose={() => setShowLeaderboard(false)}
          fetch={fetchLeaderboard}
          isInAigram={isInAigram}
        />
      )}

      <img className="bf-watermark" src={alteruUrl} alt="" />
    </div>
  );
}
