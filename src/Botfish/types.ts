export type Screen = 'playing' | 'end';

export type PhotoKind = 'clean' | 'ai';

export interface Photo {
  id: string;
  src: string;
  kind: PhotoKind;
  tells: string[];
  /** Localized tell label (already pre-resolved to current locale at load time). */
  tellLabel?: string;
  name: string;
  age: number;
  /** Pre-resolved (current-locale) Hinge prompt label, e.g. "MY SIMPLE PLEASURE". */
  promptLabel: string;
  /** Pre-resolved (current-locale) Hinge prompt body. */
  prompt: string;
  /** Pre-resolved (current-locale) location text. */
  location: string;
}

export type EndReason = 'trusted_ai' | 'missed_real' | null;

export interface Stats {
  finalScore: number;
  totalSwiped: number;
  matched: number;
  caughtAI: number;
  isNewBest: boolean;
  endReason: EndReason;
  /** The exact photo that ended the run — shown on the end screen. */
  lastPhoto?: Photo;
}

export interface SwipeOutcome {
  delta: number;
  comboInc: boolean;
  comboBreak: boolean;
  /** i18n key for the banner — resolved by the renderer. */
  bannerKey?: string;
  bannerColor?: string;
  gameOver: boolean;
  /** When game over, surface the offending photo + reason so the renderer can show it. */
  photo?: Photo;
  endReason?: EndReason;
}
