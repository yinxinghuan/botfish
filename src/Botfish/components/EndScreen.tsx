import { useMemo } from 'react';
import { t } from '../i18n';
import type { Stats } from '../types';

interface Props {
  stats: Stats;
  best: number;
  onAgain: () => void;
  onOpenLeaderboard: () => void;
}

const TRUSTED_HEADLINES = [
  'You matched with an AI.',
  'It was a bot.',
  'They never existed.',
  'You sent a heart to nothing.',
];
const LIVES_HEADLINES = [
  'You ghosted everyone.',
  'No one made it.',
  'You passed on every real one.',
  'The algorithm gave up.',
];

function pickOne<T>(xs: T[]): T { return xs[Math.floor(Math.random() * xs.length)]; }

export function EndScreen({ stats, best, onAgain, onOpenLeaderboard }: Props) {
  const trustedAI = stats.endReason === 'trusted_ai';
  const headline = useMemo(
    () => pickOne(trustedAI ? TRUSTED_HEADLINES : LIVES_HEADLINES),
    [trustedAI]
  );

  return (
    <div className={`bf-overlay bf-overlay--${trustedAI ? 'bot' : 'lives'}`}>
      <div className="bf-overlay__inner">
        <div className="bf-overlay__crest" aria-hidden>
          {trustedAI ? (
            // robot head
            <svg viewBox="0 0 24 24">
              <rect x="4" y="7" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6"/>
              <circle cx="9" cy="13" r="1.4" fill="currentColor"/>
              <circle cx="15" cy="13" r="1.4" fill="currentColor"/>
              <line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="12" cy="3" r="1" fill="currentColor"/>
              <line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          ) : (
            // broken heart
            <svg viewBox="0 0 24 24">
              <path d="M12 21s-7.5-4.8-9.6-9.2C.7 7.4 4 3 8.2 3c2 0 3.4 1 3.8 2.2L8 11l4 2-2 4 6-9-4-1 2-4c.4-1.2 1.8-2.2 3.8-2.2C20 3 23.3 7.4 21.6 11.8 19.5 16.2 12 21 12 21z"
                fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        <div className="bf-overlay__headline">{headline}</div>
        {trustedAI && stats.lastTell && (
          <div className="bf-overlay__sub">The tell: {stats.lastTell.toLowerCase()}.</div>
        )}
        {!trustedAI && (
          <div className="bf-overlay__sub">You passed too many real ones.</div>
        )}

        {stats.isNewBest && <div className="bf-newbest">{t('new_best')}</div>}

        <div className="bf-final">
          <div className="bf-final__label">{t('final_score')}</div>
          <div className="bf-final__value">{stats.finalScore}</div>
        </div>

        <div className="bf-stats">
          <div className="bf-stats__cell">
            <div className="bf-stats__label">{t('best')}</div>
            <div className="bf-stats__value">{best}</div>
          </div>
          <div className="bf-stats__cell">
            <div className="bf-stats__label">{t('matched')}</div>
            <div className="bf-stats__value">{stats.matched}</div>
          </div>
          <div className="bf-stats__cell">
            <div className="bf-stats__label">{t('caught')}</div>
            <div className="bf-stats__value">{stats.caughtAI}</div>
          </div>
          <div className="bf-stats__cell">
            <div className="bf-stats__label">{t('swiped')}</div>
            <div className="bf-stats__value">{stats.totalSwiped}</div>
          </div>
        </div>

        <div className="bf-overlay__buttons">
          <button className="bf-btn bf-btn--primary" onPointerDown={onAgain}>{t('again')}</button>
          <button className="bf-btn bf-btn--ghost" onPointerDown={onOpenLeaderboard}>{t('leaderboard')}</button>
        </div>
      </div>
    </div>
  );
}
