import type { CardState } from '../hooks/useBotfish';

interface Props {
  card: CardState;
  depth: number;       // 0 = active
  isActive: boolean;
}

const SWIPE_COMMIT_PX = 90;

export function PhotoCard({ card, depth, isActive }: Props) {
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
        transform: `translate(${tx}px, ${ty}px) rotate(${tr}deg) scale(${stackScale})`,
        transition: transitionStyle,
      }}
    >
      {/* Photo + gradient + name strip */}
      <div className="bf-card__photo">
        <img
          src={photo.src}
          alt=""
          draggable={false}
          className="bf-card__img"
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

      {/* Hinge-style prompt card */}
      <div className="bf-card__prompt">
        <div className="bf-card__prompt-label">{photo.promptLabel}</div>
        <div className="bf-card__prompt-body">{photo.prompt}</div>
      </div>

      {/* Drag stamps */}
      {isActive && (
        <>
          <div className="bf-stamp bf-stamp--like" style={{ opacity: likeOpacity }}>MATCH</div>
          <div className="bf-stamp bf-stamp--nope" style={{ opacity: nopeOpacity }}>BOT?</div>
        </>
      )}
    </div>
  );
}
