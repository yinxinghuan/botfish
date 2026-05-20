import { memo } from 'react';
import type { CardState } from '../hooks/useBotfish';
import { t } from '../i18n';

interface Props {
  card: CardState;
  depth: number;
  isActive: boolean;
}

const SWIPE_COMMIT_PX = 90;

function PhotoCardImpl({ card, depth, isActive }: Props) {
  const { photo, dragX, dragY, phase } = card;

  const rotateDeg = isActive ? dragX * 0.06 : 0;
  const stackOffsetY = depth * 10;
  const stackScale = 1 - depth * 0.035;
  const baseTilt = depth === 1 ? -1.5 : depth === 2 ? 1.5 : 0;

  const tx = dragX;
  const ty = dragY + stackOffsetY;
  const tr = rotateDeg + baseTilt;

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

/** Skip re-render when the only thing that changed is another card's drag.
 *  • Inactive cards (depth > 0): only re-render when depth or photo changes
 *  • Active cards: also re-render when drag/phase changes */
export const PhotoCard = memo(PhotoCardImpl, (prev, next) => {
  if (prev.depth !== next.depth) return false;
  if (prev.isActive !== next.isActive) return false;
  if (prev.card.uid !== next.card.uid) return false;
  if (!next.isActive) return true; // inactive — skip if nothing else mattered
  // Active card: re-render on drag/phase change
  return (
    prev.card.dragX === next.card.dragX &&
    prev.card.dragY === next.card.dragY &&
    prev.card.phase === next.card.phase
  );
});
