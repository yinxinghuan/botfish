import { useEffect } from 'react';
import { t } from '../i18n';

interface Props {
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

/** First-launch intro modal. Tap anywhere on the overlay or wait 5 seconds
 *  and it fades out (calling onDismiss which flips hasInteracted in the hook). */
export function TutorialOverlay({ onDismiss }: Props) {
  useEffect(() => {
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      className="bf-tutorial"
      onPointerDown={(e) => { e.stopPropagation(); onDismiss(); }}
    >
      <div className="bf-tutorial__scrim" />
      <div className="bf-tutorial__panel">
        <div className="bf-tutorial__brand">
          <span className="bf-tutorial__brand-dot" />
          BOTFISH
        </div>
        <div className="bf-tutorial__title">{t('tut_title')}</div>
        <div className="bf-tutorial__sub">{t('tut_sub')}</div>

        <div className="bf-tutorial__arrows">
          <div className="bf-tutorial__arrow bf-tutorial__arrow--left">
            <svg viewBox="0 0 24 24" className="bf-tutorial__arrow-icon" aria-hidden>
              <path d="M14 6 8 12 14 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="bf-tutorial__arrow-label">{t('tut_swipe_left')}</span>
          </div>
          <div className="bf-tutorial__arrow bf-tutorial__arrow--right">
            <span className="bf-tutorial__arrow-label">{t('tut_swipe_right')}</span>
            <svg viewBox="0 0 24 24" className="bf-tutorial__arrow-icon" aria-hidden>
              <path d="M10 6 16 12 10 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bf-tutorial__hint">{t('tut_dismiss')}</div>
      </div>
    </div>
  );
}
