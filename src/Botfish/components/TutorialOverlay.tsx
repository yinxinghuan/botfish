import { t } from '../i18n';

/** First-launch intro overlay. Sits above the card stack (z-index 150).
 *  Pointer-events: none lets the player still drag the card underneath —
 *  the first interaction sets hasInteracted and the overlay fades out. */
export function TutorialOverlay() {
  return (
    <div className="bf-tutorial">
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
