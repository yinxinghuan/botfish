import { useCallback, useEffect, useRef, useState } from 'react';
import type { EndReason, Photo, Screen, Stats, SwipeOutcome } from '../types';
import { nextPhoto } from '../data/photos';
import {
  sfxCatfish, sfxDodgeRed, sfxMatch, sfxRegret, sfxRunEnd,
  sfxSwipeCommit, sfxSwipeStart, unlockAudio,
} from '../utils/audio';

const BEST_KEY = 'botfish:best';
const STACK_SIZE = 3;
const SWIPE_COMMIT_PX = 90;

export interface CardState {
  photo: Photo;
  dragX: number;
  dragY: number;
  velX: number;
  phase: 'idle' | 'leaving' | 'gone';
  leftDir: -1 | 0 | 1;
  born: number;
}

export function useBotfish() {
  const screenRef = useRef<Screen>('playing');
  const gameStartedRef = useRef<boolean>(false);

  const stackRef = useRef<CardState[]>([]);
  const draggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragLastTRef = useRef<number>(0);
  const dragLastXRef = useRef<number>(0);

  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const servedRef = useRef<number>(0);

  const totalSwipedRef = useRef<number>(0);
  const matchedRef = useRef<number>(0);
  const caughtAIRef = useRef<number>(0);
  const endReasonRef = useRef<EndReason>(null);
  const lastPhotoRef = useRef<Photo | undefined>(undefined);

  const [, forceRender] = useState(0);
  const [screen, setScreen] = useState<Screen>('playing');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [banner, setBanner] = useState<{ key: string; color: string; tick: number } | null>(null);
  const [best, setBest] = useState<number>(() => {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(BEST_KEY) : null;
    return v ? Number(v) || 0 : 0;
  });
  const [stats, setStats] = useState<Stats>({
    finalScore: 0, totalSwiped: 0, matched: 0, caughtAI: 0,
    isNewBest: false, endReason: null,
  });
  const [hasInteracted, setHasInteracted] = useState(false);

  const refresh = () => forceRender(n => n + 1);

  const topUp = useCallback(() => {
    const now = performance.now();
    while (stackRef.current.length < STACK_SIZE) {
      stackRef.current.unshift({
        photo: nextPhoto(servedRef.current),
        dragX: 0, dragY: 0, velX: 0,
        phase: 'idle',
        leftDir: 0,
        born: now,
      });
      servedRef.current += 1;
    }
  }, []);

  /** Spot-the-AI scoring — both wrong moves are instant game-over (tighter pacing).
   *  Right on AI    → GAME OVER (you trusted a bot)
   *  Right on clean → +10 match (combo-amplified)
   *  Left on AI     → +20 caught (combo-amplified)
   *  Left on clean  → GAME OVER (you flagged a real person as a bot)
   */
  const resolveSwipe = useCallback((card: CardState, direction: -1 | 1): SwipeOutcome => {
    const { photo } = card;
    const out: SwipeOutcome = {
      delta: 0, comboInc: false, comboBreak: false, gameOver: false,
    };
    if (direction === 1) {
      if (photo.kind === 'ai') {
        out.gameOver = true;
        out.endReason = 'trusted_ai';
        out.photo = photo;
        sfxCatfish();
        out.bannerKey = 'banner_trusted_ai';
        out.bannerColor = '#d83555';
      } else {
        out.delta = 10 + Math.min(8, comboRef.current * 2);
        out.comboInc = true;
        matchedRef.current += 1;
        sfxMatch();
        out.bannerKey = 'banner_match';
        out.bannerColor = '#f6c14a';
      }
    } else {
      if (photo.kind === 'ai') {
        out.delta = 20 + Math.min(12, comboRef.current * 2);
        out.comboInc = true;
        caughtAIRef.current += 1;
        sfxDodgeRed();
        out.bannerKey = 'banner_caught';
        out.bannerColor = '#3aa84a';
      } else {
        out.gameOver = true;
        out.endReason = 'missed_real';
        out.photo = photo;
        sfxRegret();
        out.bannerKey = 'banner_missed_real';
        out.bannerColor = '#d83555';
      }
    }
    return out;
  }, []);

  const endRun = useCallback(() => {
    sfxRunEnd();
    const finalScore = scoreRef.current;
    const isNewBest = finalScore > best;
    if (isNewBest) {
      try { localStorage.setItem(BEST_KEY, String(finalScore)); } catch { /* ignore */ }
      setBest(finalScore);
    }
    setStats({
      finalScore,
      totalSwiped: totalSwipedRef.current,
      matched: matchedRef.current,
      caughtAI: caughtAIRef.current,
      isNewBest,
      endReason: endReasonRef.current,
      lastPhoto: lastPhotoRef.current,
    });
    setScreen('end');
    screenRef.current = 'end';
  }, [best]);

  const commitSwipe = useCallback((direction: -1 | 1, withVelocity = false) => {
    const stack = stackRef.current;
    const active = stack[stack.length - 1];
    if (!active || active.phase !== 'idle') return;

    active.phase = 'leaving';
    active.leftDir = direction;
    if (!withVelocity) active.velX = direction * 1400;
    sfxSwipeCommit();

    const out = resolveSwipe(active, direction);
    if (out.delta !== 0) {
      scoreRef.current = Math.max(0, scoreRef.current + out.delta);
      setScore(scoreRef.current);
    }
    if (out.comboInc) {
      comboRef.current += 1;
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      setCombo(comboRef.current);
    } else if (out.comboBreak) {
      comboRef.current = 0;
      setCombo(0);
    }
    if (out.bannerKey) {
      setBanner({ key: out.bannerKey, color: out.bannerColor || '#fff', tick: performance.now() });
    }
    totalSwipedRef.current += 1;

    if (out.gameOver) {
      endReasonRef.current = out.endReason ?? null;
      lastPhotoRef.current = out.photo;
      endRun();
    }
  }, [resolveSwipe, endRun]);

  const start = useCallback(() => {
    stackRef.current = [];
    draggingRef.current = false;
    gameStartedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    servedRef.current = 0;
    totalSwipedRef.current = 0;
    matchedRef.current = 0;
    caughtAIRef.current = 0;
    endReasonRef.current = null;
    lastPhotoRef.current = undefined;
    setScore(0);
    setCombo(0);
    setBanner(null);
    setHasInteracted(false);
    topUp();
    setScreen('playing');
    screenRef.current = 'playing';
    unlockAudio();
    refresh();
  }, [topUp]);

  const onPointerDown = useCallback((clientX: number) => {
    unlockAudio();
    if (screenRef.current !== 'playing') return;
    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
      setHasInteracted(true);
    }
    const stack = stackRef.current;
    const active = stack[stack.length - 1];
    if (!active || active.phase !== 'idle') return;
    draggingRef.current = true;
    dragStartXRef.current = clientX;
    dragLastXRef.current = clientX;
    dragLastTRef.current = performance.now();
    sfxSwipeStart();
  }, []);

  const onPointerMove = useCallback((clientX: number) => {
    if (!draggingRef.current) return;
    if (screenRef.current !== 'playing') return;
    const stack = stackRef.current;
    const active = stack[stack.length - 1];
    if (!active || active.phase !== 'idle') return;
    const dx = clientX - dragStartXRef.current;
    active.dragX = dx;
    active.dragY = Math.abs(dx) * 0.08;
    const now = performance.now();
    const dt = now - dragLastTRef.current;
    if (dt > 0) active.velX = ((clientX - dragLastXRef.current) / dt) * 1000;
    dragLastXRef.current = clientX;
    dragLastTRef.current = now;
    refresh();
  }, []);

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const stack = stackRef.current;
    const active = stack[stack.length - 1];
    if (!active || active.phase !== 'idle') return;
    const dx = active.dragX;
    const speed = active.velX;
    const flingSpeed = 800;
    if (dx > SWIPE_COMMIT_PX || speed > flingSpeed) {
      commitSwipe(1, true);
    } else if (dx < -SWIPE_COMMIT_PX || speed < -flingSpeed) {
      commitSwipe(-1, true);
    } else {
      active.dragX = 0;
      active.dragY = 0;
      active.velX = 0;
    }
    refresh();
  }, [commitSwipe]);

  const onPointerCancel = onPointerUp;

  const swipeRight = useCallback(() => commitSwipe(1), [commitSwipe]);
  const swipeLeft  = useCallback(() => commitSwipe(-1), [commitSwipe]);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - (lastTickRef.current || t)) / 1000);
      lastTickRef.current = t;

      if (screenRef.current === 'playing') {
        const stack = stackRef.current;
        let mutated = false;
        for (let i = stack.length - 1; i >= 0; i--) {
          const c = stack[i];
          if (c.phase === 'leaving') {
            c.dragX += c.velX * dt;
            c.dragY += 600 * dt;
            c.velX *= 0.985;
            if (Math.abs(c.dragX) > 900 || c.dragY > 800) {
              c.phase = 'gone';
            }
            mutated = true;
          } else if (c.phase === 'gone') {
            stack.splice(i, 1);
            mutated = true;
          }
        }
        topUp();
        if (mutated) refresh();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [topUp]);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    start();
  }, [start]);

  return {
    screen, score, combo, banner, best, stats, hasInteracted,
    stack: stackRef.current,
    isDragging: draggingRef.current,
    start, swipeLeft, swipeRight,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  };
}
