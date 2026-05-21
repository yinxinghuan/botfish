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

// Clean photos. Audited and curated — the model occasionally hallucinates a
// "phone-in-phone" composition (subject rendered inside an iPhone frame with
// body parts extending outside) even on neutral selfie prompts; those moved
// to the AI pool below.
const CLEAN_ROSTER: Array<[string, string, number]> = [
  ['c01', 'Maya',    26],                          ['c03', 'Olivia', 29],
  ['c05', 'Ava',     27], ['c06', 'Lila',    23], ['c07', 'Noor',   28],
  ['c10', 'Theo',    28], ['c11', 'Marcus', 31], ['c12', 'Eli',   25],
  // Reclassified from subtle-AI — visually indistinguishable from a real photo
  ['a01', 'Daniel',  27], ['a04', 'Sam',     29], ['a05', 'Riya',   26], ['a11', 'Adrian', 30],
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

// 7 absurd AI tells r3 (a25-a35, minus the ones that rendered plausibly-real
// or that a real person could plausibly do). a28 holding lobsters, a29 next
// to a giraffe, a30 normal portrait, a33 cake on head (real party trick),
// a36 mummy costume — all reclassified as clean.
const AI_ROSTER_ABSURD_R3: Array<[string, string, number, string, string]> = [
  ['a25', 'Beau',    29, 'egg_eyes',          'tell_egg_eyes'],
  ['a26', 'Maple',   26, 'zipper_mouth',      'tell_zipper_mouth'],
  ['a27', 'Lux',     24, 'flame_hair',        'tell_flame_hair'],
  ['a31', 'Atlas',   30, 'branch_arms',       'tell_branch_arms'],
  ['a32', 'Cleo',    25, 'jelly_body',        'tell_jelly_body'],
  ['a34', 'Bea',     23, 'caterpillar_brows', 'tell_caterpillar_brows'],
  ['a35', 'Tobias',  32, 'bread_torso',       'tell_bread_torso'],
];

// Reclassified-clean photos that the model rendered as AI but plausibly real
const RECLASSED_CLEAN_R3: Array<[string, string, number]> = [
  ['a33', 'Dexter', 28], // wearing a cake on head — plausible birthday party gag
];

// Photos that were originally prompted CLEAN but the model added AI artifacts
// (phone-in-phone framing, three hands, garbled IG UI). Game-mechanically AI.
const AI_FROM_CLEAN: Array<[string, string, number, string, string]> = [
  ['c02', 'Chloe',  24, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c04', 'Sara',   25, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c08', 'Iris',   30, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c09', 'Jordan', 26, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c14', 'Holly',  28, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c15', 'Diana',  30, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c17', 'Tom',    29, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c19', 'Casey',  24, 'three_hands',    'tell_three_hands'],
  ['c24', 'Ren',    27, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c31', 'Etta',   24, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c32', 'Nora',   30, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c34', 'Anders', 32, 'phone_in_phone', 'tell_phone_in_phone'],
  ['c36', 'Bram',   29, 'phone_in_phone', 'tell_phone_in_phone'],
];

// 12 more clean photos (c13-c24) + 4 reclassified-from-AI photos that look real
const CLEAN_ROSTER_R2: Array<[string, string, number]> = [
  ['c13', 'Skye',   25],                                                  ['c16', 'Aria',   27],
                          ['c18', 'Naomi',  26],                          ['c20', 'Ezra',   31],
  ['c21', 'Mira',   25], ['c22', 'Joel',   28], ['c23', 'Hana',   30],
  // Reclassified from a25-a36 round 3: model rendered something a real person could be
  ['a28', 'Quinn',  28], // holding two whole lobsters at a seafood restaurant
  ['a29', 'Roman',  31], // selfie next to a giraffe (the prompt asked for "stretched neck")
  ['a30', 'Sage',   27], // totally normal portrait (the prompt asked for "upside-down face")
  ['a36', 'Juno',   26], // mummy-costume selfie at an art museum
];

// Round-4 absurd AI batch — 9 surviving (a39/a44/a46 moved to clean).
const AI_ROSTER_ABSURD_R4: Array<[string, string, number, string, string]> = [
  ['a37', 'Mateo',   28, 'sunflower_head',    'tell_sunflower_head'],
  ['a38', 'Astrid',  26, 'clock_hands',       'tell_clock_hands'],
  ['a40', 'Yuki',    27, 'octopus_hair',      'tell_octopus_hair'],
  ['a41', 'Rory',    29, 'tv_head',           'tell_tv_head'],
  ['a42', 'Sasha',   24, 'reptile_skin',      'tell_reptile_skin'],
  ['a43', 'Wes',     31, 'bubble_wrap_body',  'tell_bubble_wrap_body'],
  ['a45', 'Brody',   28, 'bee_mouth',         'tell_bee_mouth'],
  ['a47', 'Ines',    23, 'origami_body',      'tell_origami_body'],
  ['a48', 'Olek',    30, 'long_tongue',       'tell_long_tongue'],
];

// Round-3 clean batch (c25-c36) + 3 reclassified-from-AI-r4
const CLEAN_ROSTER_R3: Array<[string, string, number]> = [
  ['c25', 'Talia',  25], ['c26', 'Boaz',   29], ['c27', 'Mara',   27], ['c28', 'Levi',   31],
  ['c29', 'Ines2',  26], ['c30', 'Hugo2',  28],
  ['c33', 'Jules',  27],                          ['c35', 'Yara',   25],
  // Reclassified from a37-a48 r4: model rendered cosplay / props / normal sweater
  ['a39', 'Knox',   30], // deer-skull headpiece, plausible cosplay
  ['a44', 'Lior',   25], // normal hand holding a pencil
  ['a46', 'Pia',    26], // rainbow chunky knit sweater on a normal person
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
  ...AI_ROSTER_ABSURD_R3.map(([id, name, age, tell, tellLabelKey], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 18) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'ai' as const,
      tells: [tell],
      tellLabelKey,
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 18) % LOCATION_KEYS.length],
    };
  }),
  ...CLEAN_ROSTER_R2.map(([id, name, age], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 4) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'clean' as const,
      tells: [],
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 4) % LOCATION_KEYS.length],
    };
  }),
  ...AI_ROSTER_ABSURD_R4.map(([id, name, age, tell, tellLabelKey], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 10) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'ai' as const,
      tells: [tell],
      tellLabelKey,
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 10) % LOCATION_KEYS.length],
    };
  }),
  ...CLEAN_ROSTER_R3.map(([id, name, age], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 16) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'clean' as const,
      tells: [],
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 16) % LOCATION_KEYS.length],
    };
  }),
  // Photos prompted as CLEAN but the model added an unambiguous AI artifact.
  ...AI_FROM_CLEAN.map(([id, name, age, tell, tellLabelKey], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 2) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'ai' as const,
      tells: [tell],
      tellLabelKey,
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 2) % LOCATION_KEYS.length],
    };
  }),
  // Photos prompted as AI but the model rendered something plausibly real.
  ...RECLASSED_CLEAN_R3.map(([id, name, age], i) => {
    const [pl, pb] = PROMPT_KEYS[(i + 20) % PROMPT_KEYS.length];
    return {
      id, name, age,
      kind: 'clean' as const,
      tells: [],
      promptLabelKey: pl,
      promptKey: pb,
      locationKey: LOCATION_KEYS[(i + 20) % LOCATION_KEYS.length],
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
// "Absurd" = the obviously-bot batches (a13+). "Subtle" = a02–a12 minus the
// reclassified ones, which moved to CLEAN_POOL.
const AI_ABSURD   = PHOTOS.filter(p => p.kind === 'ai' && Number(p.id.slice(1)) >= 13);
const AI_SUBTLE   = PHOTOS.filter(p => p.kind === 'ai' && Number(p.id.slice(1)) <= 12);

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
