import type { Photo, PhotoKind } from '../types';

/* ──────────────────────────────────────────────────────────────────────────
   Photos live in public/photos/ — written by gen_photos.py.
   Vite serves public/* unmodified under the configured base URL.
   ───────────────────────────────────────────────────────────────────────── */

function src(id: string): string {
  return `${import.meta.env.BASE_URL}photos/${id}.jpg`;
}

/* ──────────────────────────────────────────────────────────────────────────
   The roster — kept in lock-step with gen_photos.py.
   12 CLEAN + 12 AI tells. Prompt-cards mimic Hinge's "MY SIMPLE PLEASURE"
   format and are flavor for both kinds (the AI cards have nothing wrong
   with their prompt; the giveaway is in the photo).
   ───────────────────────────────────────────────────────────────────────── */

interface PhotoSpec {
  id: string;
  name: string;
  age: number;
  kind: PhotoKind;
  tells: string[];
  tellLabel?: string;
  promptLabel: string;
  prompt: string;
  location: string;
}

const PROMPT_BANK: Array<[string, string]> = [
  ['MY SIMPLE PLEASURE',     'picking the perfect avocado at the bodega'],
  ['I GO CRAZY FOR',         'a thunderstorm and an open window'],
  ['MY MOST IRRATIONAL FEAR','mall escalators going up too slowly'],
  ['TWO TRUTHS AND A LIE',   'I can name every state capital. probably.'],
  ['THE BEST WAY TO ASK ME OUT', 'just say a cafe and a time'],
  ['I WANT SOMEONE WHO',     'texts back, owns a plant, has a passport'],
  ['MY GREEN FLAG IS',       'I refill the brita without being asked'],
  ['WORST IDEA I\'VE EVER HAD', 'cutting my own bangs at 2am'],
  ['I\'M LOOKING FOR',       'a person, not a hobby'],
  ['MY ROLE IN THE FRIEND GROUP', 'the one who books the airbnb'],
  ['DATING ME IS LIKE',      'a Sunday morning that lasts all week'],
  ['UNUSUAL SKILLS',         'I can fold a fitted sheet correctly'],
  ['HOT TAKE',               'gas stations have the best coffee'],
  ['IF I COULD ONLY EAT ONE FOOD', 'cold sesame noodles, forever'],
  ['WEEKEND PLANS',          'farmers market, dog park, bookshop, repeat'],
  ['I\'M OBSESSED WITH',     'making playlists no one will ever hear'],
  ['I\'LL FALL FOR YOU IF',  'you say "let\'s walk it off"'],
  ['MY UNPOPULAR OPINION',   'the suburbs are underrated'],
  ['ONE THING I\'D RESCUE',  'my grandmother\'s pasta pot'],
  ['MY LOVE LANGUAGE',       'unprompted iced coffee delivery'],
  ['I\'M DOWN FOR',          'a long walk that becomes an even longer talk'],
  ['I\'LL NEVER SHUT UP ABOUT', 'why bagels taste different in Brooklyn'],
  ['THIS YEAR I WANT TO',    'finally learn to bake good bread'],
  ['BIGGEST RED FLAG IN OTHERS', 'they don\'t close kitchen cabinets'],
];

const LOCATIONS = [
  '3 miles away · Brooklyn',  '7 miles away · Bushwick',  '2 miles away · Park Slope',
  '5 miles away · Williamsburg', '4 miles away · Crown Heights', '8 miles away · Astoria',
  '6 miles away · Greenpoint', '1 mile away · LES',  '3 miles away · East Village',
  '10 miles away · Long Island City', '5 miles away · Carroll Gardens', '2 miles away · Soho',
  '4 miles away · Cobble Hill', '6 miles away · Bed-Stuy', '5 miles away · West Village',
  '3 miles away · Nolita', '7 miles away · Sunset Park', '2 miles away · Tribeca',
  '4 miles away · Fort Greene', '9 miles away · Ridgewood', '5 miles away · Boerum Hill',
  '2 miles away · Chelsea', '6 miles away · Prospect Heights', '4 miles away · Gowanus',
];

const CLEAN_ROSTER: Array<[string, string, number]> = [
  ['c01', 'Maya',    26], ['c02', 'Chloe',   24], ['c03', 'Olivia', 29], ['c04', 'Sara',  25],
  ['c05', 'Ava',     27], ['c06', 'Lila',    23], ['c07', 'Noor',   28], ['c08', 'Iris',  30],
  ['c09', 'Jordan',  26], ['c10', 'Theo',    28], ['c11', 'Marcus', 31], ['c12', 'Eli',   25],
];

const AI_ROSTER: Array<[string, string, number, string, string]> = [
  ['a01', 'Daniel',   27, 'six_fingers',       'Six fingers on the visible hand'],
  ['a02', 'Owen',     24, 'fused_fingers',     'Fingers melted into the coffee cup'],
  ['a03', 'Leo',      30, 'asym_earrings',     'Mismatched earrings (gold + silver)'],
  ['a04', 'Sam',      29, 'three_ears',        'An extra third ear behind the hair'],
  ['a05', 'Riya',     26, 'garbled_text',      'Garbled fake letters on the shirt'],
  ['a06', 'Mei',      25, 'background_merge',  'The lamp post is fused into the shoulder'],
  ['a07', 'Tasha',    29, 'plastic_skin',      'Waxy plastic skin — no human texture'],
  ['a08', 'Zoe',      23, 'eyes_diff_color',   'Eyes are two different colors'],
  ['a09', 'Kai',      27, 'extra_teeth',       'Too many teeth, double row'],
  ['a10', 'Felix',    28, 'shadow_wrong',      'Face shadow points the wrong way'],
  ['a11', 'Adrian',   30, 'hair_blend',        'Hair fuses into the background'],
  ['a12', 'Caleb',    25, 'third_arm',         'An extra third arm behind the shoulder'],
];

export const PHOTOS: PhotoSpec[] = [
  ...CLEAN_ROSTER.map(([id, name, age], i) => {
    const [promptLabel, prompt] = PROMPT_BANK[i % PROMPT_BANK.length];
    return {
      id, name, age,
      kind: 'clean' as const,
      tells: [],
      promptLabel,
      prompt,
      location: LOCATIONS[i % LOCATIONS.length],
    };
  }),
  ...AI_ROSTER.map(([id, name, age, tell, tellLabel], i) => {
    const [promptLabel, prompt] = PROMPT_BANK[(i + 12) % PROMPT_BANK.length];
    return {
      id, name, age,
      kind: 'ai' as const,
      tells: [tell],
      tellLabel,
      promptLabel,
      prompt,
      location: LOCATIONS[(i + 12) % LOCATIONS.length],
    };
  }),
];

/** Build a runtime Photo with resolved src. */
function toPhoto(spec: PhotoSpec): Photo {
  return { ...spec, src: src(spec.id) };
}

/* ──────────────────────────────────────────────────────────────────────────
   Deck logic: feed photos in a shuffled order, but every Nth card is an AI.
   Difficulty ramps: at run start, AI share is small; over time, more frequent.
   ───────────────────────────────────────────────────────────────────────── */

const CLEAN_POOL = PHOTOS.filter(p => p.kind === 'clean');
const AI_POOL    = PHOTOS.filter(p => p.kind === 'ai');

function pickFrom<T>(pool: T[], rng = Math.random): T {
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Pick the next photo to serve, given how many have been served already.
 * Difficulty curve: early cards are mostly clean (player warms up), later
 * cards mix AI in heavily.
 */
export function nextPhoto(servedCount: number): Photo {
  // P(ai) = 0.20 + 0.05 * servedCount, capped at 0.55
  const pAI = Math.min(0.55, 0.20 + servedCount * 0.05);
  const spec = Math.random() < pAI ? pickFrom(AI_POOL) : pickFrom(CLEAN_POOL);
  return toPhoto(spec);
}
