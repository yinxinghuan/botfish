// SwipeStorm SFX — lounge-y kitschy palette (different family from Farm's circus march).

let ctx: AudioContext | null = null;
function ac(): AudioContext {
  if (!ctx) {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx!;
}

export function unlockAudio() {
  try {
    const c = ac();
    if (c.state === 'suspended') c.resume().catch(() => {});
  } catch { /* ignore */ }
}

function tone(freq: number, dur: number, peak: number, type: OscillatorType = 'sine', delay = 0) {
  try {
    const c = ac();
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.04);
  } catch { /* ignore */ }
}

function noiseBurst(dur: number, peak: number, hp: number) {
  try {
    const c = ac();
    const t0 = c.currentTime;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const hpf = c.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = hp;
    const g = c.createGain();
    g.gain.value = peak;
    src.connect(hpf).connect(g).connect(c.destination);
    src.start(t0);
  } catch { /* ignore */ }
}

/** Soft whoosh when starting a swipe drag. */
export function sfxSwipeStart() {
  noiseBurst(0.06, 0.04, 1500);
}

/** Card whoosh on commit. */
export function sfxSwipeCommit() {
  noiseBurst(0.10, 0.07, 1200);
  tone(420, 0.10, 0.05, 'sine');
}

/** Match success — rising arpeggio + soft "ding". */
export function sfxMatch() {
  tone(523, 0.12, 0.08, 'triangle');         // C5
  tone(659, 0.12, 0.07, 'triangle', 0.07);   // E5
  tone(784, 0.18, 0.07, 'triangle', 0.14);   // G5
  tone(1047, 0.22, 0.05, 'sine', 0.21);      // C6 — sparkle
}

/** Soulmate hit — bigger sparkle + chimes. */
export function sfxSoulmate() {
  tone(523, 0.10, 0.08, 'triangle');
  tone(659, 0.10, 0.08, 'triangle', 0.06);
  tone(784, 0.10, 0.08, 'triangle', 0.12);
  tone(1047, 0.18, 0.10, 'triangle', 0.18);
  tone(1568, 0.28, 0.08, 'sine', 0.26);      // G6 sparkle
  // Tinkly bells
  for (let i = 0; i < 4; i++) tone(1320 + i * 240, 0.30, 0.04, 'sine', 0.10 + i * 0.05);
}

/** Red-flag avoid — small affirmative "boop". */
export function sfxDodgeRed() {
  tone(330, 0.10, 0.07, 'triangle');
  tone(440, 0.08, 0.05, 'sine', 0.06);
}

/** Wrong swipe (right on red flag) — short sad-trombone slip. */
export function sfxRegret() {
  try {
    const c = ac();
    const t0 = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(330, t0);
    o.frequency.exponentialRampToValueAtTime(196, t0 + 0.32);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.10, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1200;
    o.connect(lp).connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + 0.42);
  } catch { /* ignore */ }
}

/** Catfish caught — emergency alarm. */
export function sfxCatfish() {
  // Two oscillating sirens
  try {
    const c = ac();
    const t0 = c.currentTime;
    for (let n = 0; n < 4; n++) {
      const o = c.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(880, t0 + n * 0.18);
      o.frequency.exponentialRampToValueAtTime(440, t0 + n * 0.18 + 0.14);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0 + n * 0.18);
      g.gain.linearRampToValueAtTime(0.12, t0 + n * 0.18 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n * 0.18 + 0.16);
      o.connect(g).connect(c.destination);
      o.start(t0 + n * 0.18);
      o.stop(t0 + n * 0.18 + 0.18);
    }
  } catch { /* ignore */ }
}

/** Lost a heart from card expiring. */
export function sfxExpire() {
  tone(180, 0.10, 0.08, 'sine');
  tone(120, 0.16, 0.05, 'sine', 0.05);
}

/** Run-end fanfare. */
export function sfxRunEnd() {
  tone(523, 0.12, 0.08, 'triangle');
  tone(440, 0.16, 0.06, 'triangle', 0.10);
  tone(330, 0.22, 0.05, 'sine', 0.22);
}

// ─── Lounge BGM ──────────────────────────────────────────────────────────
//
// Slow walking-bass + simple cocktail melody. Phrases breathe.

const N: Record<string, number> = {
  C3: 48, D3: 50, Eb3: 51, E3: 52, F3: 53, G3: 55, A3: 57, Bb3: 58, B3: 59,
  C4: 60, D4: 62, Eb4: 63, E4: 64, F4: 65, G4: 67, A4: 69, Bb4: 70, C5: 72,
  D5: 74, Eb5: 75, E5: 76, F5: 77, G5: 79,
};
function nHz(m: number): number { return 440 * Math.pow(2, (m - 69) / 12); }

interface LNote { midi: number; beat: number; dur: number; gain?: number }

const LOUNGE_A = {
  beats: 16, bpm: 88,
  melody: [
    { midi: N.E4, beat: 0, dur: 1.0 }, { midi: N.G4, beat: 1, dur: 0.5 },
    { midi: N.A4, beat: 1.5, dur: 0.5 }, { midi: N.B4, beat: 2, dur: 1.0 },
    { midi: N.A4, beat: 3, dur: 1.0 },
    { midi: N.G4, beat: 4, dur: 1.5 }, { midi: N.E4, beat: 5.5, dur: 0.5 },
    { midi: N.F4, beat: 6, dur: 1.0 }, { midi: N.D4, beat: 7, dur: 1.0 },
    { midi: N.C5, beat: 8, dur: 0.5 }, { midi: N.B4, beat: 8.5, dur: 0.5 },
    { midi: N.A4, beat: 9, dur: 1.0 }, { midi: N.G4, beat: 10, dur: 1.0 },
    { midi: N.A4, beat: 11, dur: 1.5 }, { midi: N.F4, beat: 12.5, dur: 0.5 },
    { midi: N.G4, beat: 13, dur: 0.5 }, { midi: N.E4, beat: 13.5, dur: 0.5 },
    { midi: N.D4, beat: 14, dur: 0.5 }, { midi: N.C4, beat: 14.5, dur: 1.5 },
  ] as LNote[],
  bass: [
    { midi: N.C3, beat: 0, dur: 0.95 }, { midi: N.E3, beat: 1, dur: 0.95 },
    { midi: N.G3, beat: 2, dur: 0.95 }, { midi: N.E3, beat: 3, dur: 0.95 },
    { midi: N.A3 - 12, beat: 4, dur: 0.95 }, { midi: N.C3, beat: 5, dur: 0.95 },
    { midi: N.E3, beat: 6, dur: 0.95 }, { midi: N.G3, beat: 7, dur: 0.95 },
    { midi: N.F3, beat: 8, dur: 0.95 }, { midi: N.A3, beat: 9, dur: 0.95 },
    { midi: N.C4, beat: 10, dur: 0.95 }, { midi: N.A3, beat: 11, dur: 0.95 },
    { midi: N.G3, beat: 12, dur: 0.95 }, { midi: N.B3, beat: 13, dur: 0.95 },
    { midi: N.D4, beat: 14, dur: 0.95 }, { midi: N.G3, beat: 15, dur: 0.95 },
  ] as LNote[],
};

const LOUNGE_B = {
  beats: 16, bpm: 88,
  melody: [
    { midi: N.G4, beat: 0, dur: 1.0 }, { midi: N.E4, beat: 1, dur: 0.5 },
    { midi: N.C4, beat: 1.5, dur: 0.5 }, { midi: N.E4, beat: 2, dur: 0.5 },
    { midi: N.G4, beat: 2.5, dur: 0.5 }, { midi: N.C5, beat: 3, dur: 1.0 },
    { midi: N.B4, beat: 4, dur: 0.5 }, { midi: N.G4, beat: 4.5, dur: 0.5 },
    { midi: N.A4, beat: 5, dur: 1.0 }, { midi: N.E4, beat: 6, dur: 1.5 },
    { midi: N.D4, beat: 7.5, dur: 0.5 },
    { midi: N.F4, beat: 8, dur: 1.0 }, { midi: N.A4, beat: 9, dur: 1.0 },
    { midi: N.C5, beat: 10, dur: 1.5 }, { midi: N.Bb4, beat: 11.5, dur: 0.5 },
    { midi: N.A4, beat: 12, dur: 0.5 }, { midi: N.G4, beat: 12.5, dur: 0.5 },
    { midi: N.E4, beat: 13, dur: 1.0 }, { midi: N.C4, beat: 14, dur: 2.0 },
  ] as LNote[],
  bass: [
    { midi: N.C3, beat: 0, dur: 0.95 }, { midi: N.G3, beat: 1, dur: 0.95 },
    { midi: N.C3, beat: 2, dur: 0.95 }, { midi: N.E3, beat: 3, dur: 0.95 },
    { midi: N.A3 - 12, beat: 4, dur: 0.95 }, { midi: N.E3, beat: 5, dur: 0.95 },
    { midi: N.A3 - 12, beat: 6, dur: 0.95 }, { midi: N.C3, beat: 7, dur: 0.95 },
    { midi: N.F3, beat: 8, dur: 0.95 }, { midi: N.C4, beat: 9, dur: 0.95 },
    { midi: N.F3, beat: 10, dur: 0.95 }, { midi: N.A3, beat: 11, dur: 0.95 },
    { midi: N.G3, beat: 12, dur: 0.95 }, { midi: N.D4, beat: 13, dur: 0.95 },
    { midi: N.C3, beat: 14, dur: 0.95 }, { midi: N.G3, beat: 15, dur: 0.95 },
  ] as LNote[],
};

const LOUNGE = [LOUNGE_A, LOUNGE_B];

// No BGM. Dating apps are silent; the silence + UI sounds IS the parody.
export function startAmbient() { /* intentional no-op */ }
export function stopAmbient()  { /* intentional no-op */ }

// Keep the lounge phrase data unused but defined to avoid shifting other imports.
void LOUNGE; void nHz;
