type Locale = 'zh' | 'en';

const dict: Record<Locale, Record<string, string>> = {
  zh: {
    title: 'BOTFISH',
    tagline: '左滑识破假人，右滑赌一把真人。',
    score: '得分',
    best: '最高',
    again: '再来一次',
    leaderboard: '排行榜',
    new_best: '新纪录！',
    final_score: '最终得分',
    matched: '匹配到真人',
    caught: '识破 AI',
    swiped: '总滑动',
    tut_title: '哪个是真的人？',
    tut_sub: 'AI 照片藏着破绽 — 看见就左滑',
    tut_swipe_left: '左滑 · 是 AI',
    tut_swipe_right: '右滑 · 真人',
  },
  en: {
    title: 'BOTFISH',
    tagline: 'Swipe left if it\'s a bot. Right if it\'s real.',
    score: 'Score',
    best: 'Best',
    again: 'Play again',
    leaderboard: 'Leaderboard',
    new_best: 'New best!',
    final_score: 'Final score',
    matched: 'Real ones matched',
    caught: 'Bots caught',
    swiped: 'Total swiped',
    tut_title: 'Spot the AI photo.',
    tut_sub: 'Bot photos have visible tells — left-swipe them.',
    tut_swipe_left: 'LEFT · BOT',
    tut_swipe_right: 'RIGHT · REAL',
  },
};

function detectLocale(): Locale {
  const override = typeof localStorage !== 'undefined' ? localStorage.getItem('game_locale') : null;
  if (override === 'en' || override === 'zh') return override;
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const locale = detectLocale();

export function t(key: string, vars?: { n?: number | string }): string {
  const raw = dict[locale][key] ?? dict.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k as keyof typeof vars] ?? ''));
}
