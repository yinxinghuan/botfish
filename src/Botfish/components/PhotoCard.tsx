import type { CardState } from '../hooks/useBotfish';
import { t } from '../i18n';

interface Props {
  card: CardState;
  depth: number;
  isActive: boolean;
}

const SWIPE_COMMIT_PX = 90;

/** Note: not memoized. The active card's drag motion is driven by direct DOM
 *  writes from the hook's pointer handler (bypassing React entirely), so
 *  React re-renders this component only on stack-level events: card commit,
 *  snap-back, frame-by-frame leaving animation, mount/unmount. Memoization
 *  bought nothing and broke the leaving animation when the card object was
 *  mutated in place. */
export function PhotoCard({ card, depth, isActive }: Props) {
  const { photo, dragX, dragY, phase } = card;

  const rotateDeg = isActive ? dragX * 0.06 : 0;
  const stackOffsetY = depth * 10;
  const stackScale = 1 - depth * 0.035;
  const baseTilt = depth === 1 ? -1.5 : depth === 2 ? 1.5 : 0;

  const tx = dragX;
  const ty = dragY + stackOffsetY;
  const tr = rotateDeg + baseTilt;

  // No transition during drag (finger should glue to card) or while the
  // card is flying off (RAF drives the frame-by-frame transform).
  // Spring-back idle has the bouncy transition.
  const transitionStyle =
    phase === 'leaving' || (isActive && (dragX !== 0 || dragY !== 0))
      ? 'none'
      : 'transform 280ms cubic-bezier(.34,1.56,.64,1)';

  const likeOpacity = isActive ? Math.max(0, Math.min(1, dragX / SWIPE_COMMIT_PX)) : 0;
  const nopeOpacity = isActive ? Math.max(0, Math.min(1, -dragX / SWIPE_COMMIT_PX)) : 0;

  return (
    <div
      className={`bf-card bf-card--depth-${depth} ${isActive ? 'bf-card--active' : ''}`}
      style={{
        zIndex: 100 - depth,
        transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${tr}deg) scale(${stackScale})`,
        transition: transitionStyle,
      }}
    >
      <div className="bf-card__photo">
        <img
          src={photo.src}
          alt=""
          draggable={false}
          className="bf-card__img"
          loading="eager"
          decoding="async"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="bf-card__shade" />
        <div className="bf-card__nameplate">
          <div className="bf-card__name">
            {photo.name}, <span className="bf-card__age">{photo.age}</span>
          </div>
          <div className="bf-card__loc">
            <span className="bf-card__dot" />
            {photo.location}
          </div>
        </div>
      </div>

      <div className="bf-card__prompt">
        <div className="bf-card__prompt-label">{photo.promptLabel}</div>
        <div className="bf-card__prompt-body">{photo.prompt}</div>
      </div>

      {isActive && (
        <>
          <div className="bf-stamp bf-stamp--like" style={{ opacity: likeOpacity }}>{t('stamp_like')}</div>
          <div className="bf-stamp bf-stamp--nope" style={{ opacity: nopeOpacity }}>{t('stamp_nope')}</div>
        </>
      )}
    </div>
  );
}
