import { useMemo } from 'react';
import { t } from '../i18n';
import type { Photo, Stats } from '../types';

interface Props {
  stats: Stats;
  best: number;
  onAgain: () => void;
  onOpenLeaderboard: () => void;
}

/** Rough (x%, y%) of where each tell visibly lives in the photo — used to
 *  position the "tell is here" ring on top of the offending image. */
const TELL_POS: Record<string, { x: number; y: number; r: number }> = {
  // Subtle batch
  six_fingers:       { x: 28, y: 30, r: 22 },
  fused_fingers:     { x: 40, y: 78, r: 22 },
  asym_earrings:     { x: 28, y: 48, r: 18 },
  three_ears:        { x: 30, y: 38, r: 16 },
  garbled_text:      { x: 50, y: 72, r: 30 },
  background_merge:  { x: 68, y: 52, r: 24 },
  plastic_skin:      { x: 50, y: 40, r: 30 },
  eyes_diff_color:   { x: 50, y: 36, r: 22 },
  extra_teeth:       { x: 50, y: 52, r: 18 },
  shadow_wrong:      { x: 50, y: 38, r: 28 },
  hair_blend:        { x: 24, y: 60, r: 22 },
  third_arm:         { x: 32, y: 50, r: 24 },
  // Absurd batch — the tell IS most of the image, so use a generous central ring
  watermelon_head:   { x: 50, y: 30, r: 32 },
  bread_hands:       { x: 30, y: 72, r: 28 },
  noodle_hair:       { x: 50, y: 30, r: 34 },
  two_faces:         { x: 50, y: 40, r: 34 },
  cyclops:           { x: 50, y: 30, r: 22 },
  melting_face:      { x: 50, y: 42, r: 32 },
  held_head:         { x: 28, y: 38, r: 26 },
  shark_teeth:       { x: 50, y: 56, r: 26 },
  chest_arm:         { x: 50, y: 60, r: 24 },
  shoulder_faces:    { x: 30, y: 50, r: 22 },
  tile_skin:         { x: 50, y: 50, r: 34 },
  chair_fused:       { x: 50, y: 72, r: 30 },
  // Round-3 absurd batch
  egg_eyes:          { x: 50, y: 36, r: 32 },
  zipper_mouth:      { x: 50, y: 60, r: 22 },
  flame_hair:        { x: 50, y: 20, r: 32 },
  lobster_claws:     { x: 30, y: 68, r: 28 },
  long_neck:         { x: 50, y: 50, r: 36 },
  upside_face:       { x: 50, y: 42, r: 34 },
  branch_arms:       { x: 30, y: 60, r: 26 },
  jelly_body:        { x: 50, y: 60, r: 32 },
  cake_hat:          { x: 50, y: 22, r: 28 },
  caterpillar_brows: { x: 50, y: 32, r: 22 },
  bread_torso:       { x: 50, y: 58, r: 30 },
  mummy_wraps:       { x: 50, y: 40, r: 36 },
};

function pickOne<T>(xs: T[]): T { return xs[Math.floor(Math.random() * xs.length)]; }

function Reveal({ photo, kind }: { photo: Photo; kind: 'trusted_ai' | 'missed_real' }) {
  const tellTag = photo.tells[0];
  const pos = tellTag ? TELL_POS[tellTag] : undefined;

  return (
    <div className="bf-reveal">
      <img className="bf-reveal__img" src={photo.src} alt="" draggable={false} />
      {kind === 'trusted_ai' && pos && (
        <>
          <div
            className="bf-reveal__ring"
            style={{
              left:  `${pos.x}%`,
              top:   `${pos.y}%`,
              width:  `${pos.r * 2}%`,
              height: `${pos.r * 2}%`,
            }}
          />
          <div
            className="bf-reveal__pin"
            style={{ left: `${pos.x + pos.r * 0.7}%`, top: `${pos.y - pos.r * 0.7}%` }}
          >
            {t('end_reveal_tell')}
          </div>
        </>
      )}
      {kind === 'missed_real' && (
        <div className="bf-reveal__realstamp">{t('end_reveal_real')}</div>
      )}
      <div className="bf-reveal__nameplate">
        <span className="bf-reveal__name">{photo.name}, {photo.age}</span>
      </div>
    </div>
  );
}

export function EndScreen({ stats, best, onAgain, onOpenLeaderboard }: Props) {
  const trusted = stats.endReason === 'trusted_ai';
  const missed  = stats.endReason === 'missed_real';

  const headline = useMemo(() => {
    if (trusted) return pickOne([t('end_trusted_h1'), t('end_trusted_h2'), t('end_trusted_h3')]);
    if (missed)  return pickOne([t('end_missed_h1'),  t('end_missed_h2'),  t('end_missed_h3')]);
    return '';
  }, [trusted, missed]);

  const sub = trusted && stats.lastPhoto?.tellLabel
    ? t('end_trusted_sub', { tell: stats.lastPhoto.tellLabel })
    : missed
      ? t('end_missed_sub')
      : '';

  return (
    <div className={`bf-overlay bf-overlay--${trusted ? 'bot' : 'real'}`}>
      <div className="bf-overlay__inner">
        {stats.lastPhoto && (
          <>
            <div className="bf-overlay__label">{t('end_reveal_label')}</div>
            <Reveal photo={stats.lastPhoto} kind={trusted ? 'trusted_ai' : 'missed_real'} />
          </>
        )}

        <div className="bf-overlay__headline">{headline}</div>
        {sub && <div className="bf-overlay__sub">{sub}</div>}

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
