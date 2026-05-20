import type { Photo, PhotoKind } from '../types';
import { t } from '../i18n';

/* ──────────────────────────────────────────────────────────────────────────
   Photos live in public/photos/ — written by gen_photos.py.
   Vite serves public/* unmodified under the configured base URL.
   ───────────────────────────────────────────────────────────────────────── */

function src(id: string): string {
  return `${import.meta.env.BASE_URL}photos/${id}.jpg`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Roster definitions — every user-visible string lives in i18n keys
   (tellLabelKey, promptLabelKey, promptKey, locationKey) so the photo
   carries the same identity in both locales.
   ───────────────────────────────────────────────────────────────────────── */

interface PhotoSpec {
  id: string;
  name: string;
  age: number;
  kind: PhotoKind;
  tells: string[];
  tellLabelKey?: string;
  promptLabelKey: string;
  promptKey: string;
  locationKey: string;
}

// 24 Hinge-style prompt pairs (label key + body key)
const PROMPT_KEYS: Array<[string, string]> = [
  ['pl_simple_pleasure',  'pb_simple_pleasure'],
  ['pl_crazy_for',        'pb_crazy_for'],
  ['pl_irrational_fear',  'pb_irrational_fear'],
  ['pl_two_truths',       'pb_two_truths'],
  ['pl_ask_me_out',       'pb_ask_me_out'],
  ['pl_someone_who',      'pb_someone_who'],
  ['pl_green_flag',       'pb_green_flag'],
  ['pl_worst_idea',       'pb_worst_idea'],
  ['pl_looking_for',      'pb_looking_for'],
  ['pl_role_in_group',    'pb_role_in_group'],
  ['pl_dating_me',        'pb_dating_me'],
  ['pl_unusual_skills',   'pb_unusual_skills'],
  ['pl_hot_take',         'pb_hot_take'],
  ['pl_only_food',        'pb_only_food'],
  ['pl_weekend',          'pb_weekend'],
  ['pl_obsessed',         'pb_obsessed'],
  ['pl_fall_for',         'pb_fall_for'],
  ['pl_unpopular',        'pb_unpopular'],
  ['pl_one_rescue',       'pb_one_rescue'],
  ['pl_love_language',    'pb_love_language'],
  ['pl_down_for',         'pb_down_for'],
  ['pl_wont_shut_up',     'pb_wont_shut_up'],
  ['pl_this_year',        'pb_this_year'],
  ['pl_red_flag_others',  'pb_red_flag_others'],
];

const LOCATION_KEYS = [
  'loc_3mi_brooklyn',  'loc_7mi_bushwick',     'loc_2mi_parkslope',  'loc_5mi_williamsburg',
  'loc_4mi_crown',     'loc_8mi_astoria',      'loc_6mi_greenpoint', 'loc_1mi_les',
  'loc_3mi_eastvillage','loc_10mi_lic',        'loc_5mi_carroll',    'loc_2mi_soho',
  'loc_4mi_cobblehill','loc_6mi_bedstuy',      'loc_5mi_westvillage','loc_3mi_nolita',
  'loc_7mi_sunset',    'loc_2mi_tribeca',      'loc_4mi_fortgreene', 'loc_9mi_ridgewood',
  'loc_5mi_boerum',    'loc_2mi_chelsea',      'loc_6mi_prospect',   'loc_4mi_gowanus',
];

// Clean photos — both prompted-clean (c*) AND originally-prompted-as-AI photos
// where the model produced something a real person plausibly could have:
//   - normal anatomy (a01 five fingers, a04 normal ears)
//   - things a real person could wear (a05 graphic-print T-shirt)
//   - artifacts too subtle to spot without a magnifying glass (a11 hair edge)
// Rule: a photo only counts as AI if "no real person could plausibly be like
// this" at a glance. Subtle physics violations don't count.
const CLEAN_ROSTER: Array<[string, string, number]> = [
  ['c01', 'Maya',    26], ['c02', 'Chloe',   24], ['c03', 'Olivia', 29], ['c04', 'Sara',  25],
  ['c05', 'Ava',     27], ['c06', 'Lila',    23], ['c07', 'Noor',   28], ['c08', 'Iris',  30],
  ['c09', 'Jordan',  26], ['c10', 'Theo',    28], ['c11', 'Marcus', 31], ['c12', 'Eli',   25],
  // Reclassified from AI — visually indistinguishable from a real photo
  ['a01', 'Daniel',  27], // prompt asked six fingers; model rendered a normal five-finger hand
  ['a04', 'Sam',     29], // prompt asked three ears; model gave a normal portrait
  ['a05', 'Riya',   26],  // garbled shirt text — but a real person could wear a graphic shirt
  ['a11', 'Adrian',  30], // hair edge bleed — too subtle to spot
];

// 8 subtle AI tells that still pass the "no real person could be like this" bar
const AI_ROSTER_SUBTLE: Array<[string, string, number, string, string]> = [
  ['a02', 'Owen',   24, 'fused_fingers',     'tell_fused_fingers'],
  ['a03', 'Leo',    30, 'asym_earrings',     'tell_asym_earrings'],   // left/right ear diptych composition
  ['a06', 'Mei',    25, 'background_merge',  'tell_background_merge'],
  ['a07', 'Tasha',  29, 'plastic_skin',      'tell_plastic_skin'],
  ['a08', 'Zoe',    23, 'eyes_diff_color',   'tell_eyes_diff_color'], // keyhole-shaped pupils
  ['a09', 'Kai',    27, 'extra_teeth',       'tell_extra_teeth'],     // "AI" literally printed on teeth
  ['a10', 'Felix',  28, 'shadow_wrong',      'tell_shadow_wrong'],
  ['a12', 'Caleb',  25, 'third_arm',         'tell_third_arm'],
];

// 12 absurd AI tells (a13-a24) — the new "obviously a bot" batch
const AI_ROSTER_ABSURD: Array<[string, string, number, string, string]> = [
  ['a13', 'Nico',   28, 'watermelon_head',   'tell_watermelon_head'],
  ['a14', 'Wren',   26, 'bread_hands',       'tell_bread_hands'],
  ['a15', 'Aria',   24, 'noodle_hair',       'tell_noodle_hair'],
  ['a16', 'Soren',  30, 'two_faces',         'tell_two_faces'],
  ['a17', 'Hugo',   32, 'cyclops',           'tell_cyclops'],
  ['a18', 'Vera',   27, 'melting_face',      'tell_melting_face'],
  ['a19', 'Pablo',  29, 'held_head',         'tell_held_head'],
  ['a20', 'Reese',  25, 'shark_teeth',       'tell_shark_teeth'],
  ['a21', 'Otis',   28, 'chest_arm',         'tell_chest_arm'],
  ['a22', 'Indie',  23, 'shoulder_faces',    'tell_shoulder_faces'],
  ['a23', 'Bowen',  31, 'tile_skin',         'tell_tile_skin'],
  ['a24', 'Cyrus',  26, 'chair_fused',       'tell_chair_fused'],
];

export const PHOTOS: PhotoSpec[] = [
  ...CLEAN_ROSTER.map(([id, name, age], i) => {
    const [pl, pb] = PROMPT_KEYS[i % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'clean' as const,
      tells: [],
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[i % LOCATION_KEYS.length],
    };
  }),
  ...AI_ROSTER_SUBTLE.map(([id, name, age, tell, tellLabelKey], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 12) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'ai' as const,
      tells: [tell],
      tellLabelKey,
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 12) % LOCATION_KEYS.length],
    };
  }),
  ...AI_ROSTER_ABSURD.map(([id, name, age, tell, tellLabelKey], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 6) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'ai' as const,
      tells: [tell],
      tellLabelKey,
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 6) % LOCATION_KEYS.length],
    };
  }),
];

/** Resolve all i18n keys to current-locale strings — done once per card serve. */
function toPhoto(spec: PhotoSpec): Photo {
  return {
    id: spec.id,
    src: src(spec.id),
    kind: spec.kind,
    tells: spec.tells,
    tellLabel: spec.tellLabelKey ? t(spec.tellLabelKey) : undefined,
    name: spec.name,
    age: spec.age,
    promptLabel: t(spec.promptLabelKey),
    prompt: t(spec.promptKey),
    location: t(spec.locationKey),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Deck: weight the absurd pool heavily early in a run so the player sees
   obvious tells while they're learning, then the subtle ones mix in.
   ───────────────────────────────────────────────────────────────────────── */

const CLEAN_POOL  = PHOTOS.filter(p => p.kind === 'clean');
const AI_ABSURD   = PHOTOS.filter(p => p.kind === 'ai' && p.id.startsWith('a') && Number(p.id.slice(1)) >= 13);
const AI_SUBTLE   = PHOTOS.filter(p => p.kind === 'ai' && p.id.startsWith('a') && Number(p.id.slice(1)) <= 12);

function pickFrom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick the next photo, scaling AI frequency + subtlety with how far in.
 *   served 0   → ~25% AI, of those mostly absurd (easy to spot)
 *   served 8+  → ~55% AI, mix of absurd + subtle
 *   served 16+ → ~65% AI, weighted toward subtle (harder)
 */
export function nextPhoto(servedCount: number): Photo {
  const pAI = Math.min(0.65, 0.25 + servedCount * 0.04);
  if (Math.random() < pAI) {
    // Of the AI photos: early run = mostly absurd, later run = mostly subtle.
    const pSubtle = Math.min(0.7, servedCount * 0.07);
    const pool = Math.random() < pSubtle ? AI_SUBTLE : AI_ABSURD;
    return toPhoto(pickFrom(pool));
  }
  return toPhoto(pickFrom(CLEAN_POOL));
}
