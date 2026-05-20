export type Screen = 'playing' | 'end';

/** A photo's true classification — decides correct swipe. */
export type PhotoKind = 'clean' | 'ai';

export interface Photo {
  id: string;
  src: string;          // resolved URL via Vite
  kind: PhotoKind;
  tells: string[];      // empty for clean, e.g. ['six_fingers'] for ai
  tellLabel?: string;   // human-readable tell (shown after the trap)
  name: string;
  age: number;
  prompt: string;       // the prompt-card text shown on the card
  promptLabel: string;  // small uppercase label above the prompt
  location: string;     // "3 miles away · Brooklyn"
}

export interface Stats {
  finalScore: number;
  totalSwiped: number;
  matched: number;       // right-swiped clean = correct
  caughtAI: number;      // left-swiped ai = correct
  missed: number;        // left-swiped clean (no penalty stat)
  isNewBest: boolean;
  endReason: 'trusted_ai' | 'lives' | null;
  lastTell?: string;     // what the trap was, shown on game over
}

export interface SwipeOutcome {
  delta: number;
  comboInc: boolean;
  comboBreak: boolean;
  banner?: string;
  bannerColor?: string;
  gameOver: boolean;
  loseLife: boolean;
  /** When game over by trusting an AI — surface the tell so the player learns. */
  tellLabel?: string;
}
