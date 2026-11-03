import { addDays, dayIndex, fmtLong, parseKey } from './dates';
import { moodOf, PROMPTS } from './moods';
import type { AppData, Entry, RitualItem } from './types';

export const newEntry = (date: string): Entry => ({
  date,
  text: '',
  mood: 0,
  tags: [],
  photos: [],
  gratitude: ['', '', ''],
  gratOn: false,
  done: {},
  promptIdx: dayIndex(date) % PROMPTS.length,
  updated: 0,
});

export const words = (t: string) => (t || '').trim().split(/\s+/).filter(Boolean).length;

export const isEmpty = (e: Entry | undefined) =>
  !e ||
  (!e.text?.trim() &&
    !e.mood &&
    !(e.tags || []).length &&
    !(e.photos || []).length &&
    !(e.gratitude || []).some((g) => g.trim()) &&
    !Object.values(e.done || {}).some(Boolean));

/** Non-empty entries, newest first. */
export const filled = (entries: AppData['entries']): [string, Entry][] =>
  Object.entries(entries)
    .filter(([, e]) => !isEmpty(e))
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));

export const streak = (entries: AppData['entries'], today: string) => {
  let k = today;
  if (isEmpty(entries[k])) k = addDays(k, -1);
  let n = 0;
  while (!isEmpty(entries[k])) {
    n++;
    k = addDays(k, -1);
  }
  return n;
};

export const normalizeTags = (raw: string) =>
  raw
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-'))
    .filter(Boolean);

export const allTags = (entries: AppData['entries']) => {
  const c: Record<string, number> = {};
  for (const [, e] of filled(entries)) for (const t of e.tags || []) c[t] = (c[t] || 0) + 1;
  return Object.entries(c)
    .sort((a, b) => b[1] - a[1])
    .map((x) => x[0]);
};

export const search = (entries: AppData['entries'], query: string): [string, Entry][] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (q.startsWith('#')) {
    const term = q.slice(1);
    return filled(entries).filter(([, e]) => (e.tags || []).some((t) => t.includes(term)));
  }
  return filled(entries).filter(([, e]) =>
    [e.text, ...(e.gratitude || []), ...(e.tags || [])].join(' ').toLowerCase().includes(q),
  );
};

/** Same day in earlier years, plus exactly 30 days ago. */
export const onThisDay = (entries: AppData['entries'], k: string): [string, Entry][] => {
  const md = k.slice(5);
  const out = filled(entries).filter(([pk]) => pk < k && pk.slice(5) === md);
  const monthAgo = addDays(k, -30);
  if (!isEmpty(entries[monthAgo]) && !out.find(([pk]) => pk === monthAgo)) out.push([monthAgo, entries[monthAgo]]);
  return out;
};

export const moodSeries = (entries: AppData['entries'], today: string, days = 30) => {
  const out: { date: string; mood: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    out.push({ date: k, mood: entries[k]?.mood || 0 });
  }
  return out;
};

export const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const tagMoods = (entries: AppData['entries']) => {
  const tg: Record<string, number[]> = {};
  for (const [, e] of filled(entries)) if (e.mood) for (const t of e.tags || []) (tg[t] = tg[t] || []).push(e.mood);
  return Object.entries(tg)
    .map(([tag, a]) => ({ tag, avg: average(a), count: a.length }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 8);
};

/** Index 0 = Monday … 6 = Sunday. */
export const weekdayMoods = (entries: AppData['entries']) => {
  const wd: number[][] = Array.from({ length: 7 }, () => []);
  for (const [k, e] of filled(entries)) if (e.mood) wd[(parseKey(k).getDay() + 6) % 7].push(e.mood);
  return wd.map((a) => (a.length ? average(a) : 0));
};

export const totalWords = (entries: AppData['entries']) =>
  filled(entries).reduce((a, [, e]) => a + words(e.text), 0);

export const ritualProgress = (items: RitualItem[], e: Entry | undefined) => {
  const done = items.filter((i) => e?.done?.[i.id]).length;
  return { done, total: items.length };
};

export const exportText = (data: AppData) => {
  const items = filled(data.entries).reverse();
  if (!items.length) return 'No entries yet.';
  return items
    .map(([k, e]) => {
      const m = moodOf(e.mood);
      const lines = [`${fmtLong(k)}, ${k.slice(0, 4)}${m ? `  ·  ${m.e} ${m.l}` : ''}`];
      if (e.tags?.length) lines.push(e.tags.map((t) => '#' + t).join(' '));
      if (e.text?.trim()) lines.push('', e.text.trim());
      const g = (e.gratitude || []).filter((x) => x.trim());
      if (g.length) lines.push('', 'Grateful for:', ...g.map((x) => '• ' + x));
      const done = data.settings.ritual.filter((r) => e.done?.[r.id]);
      if (done.length) lines.push('', `${data.settings.ritualTitle}:`, ...done.map((r) => '✓ ' + r.name));
      return lines.join('\n');
    })
    .join('\n\n———\n\n');
};

export const reflectionPrompt = (data: AppData, today: string) => {
  const lines: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(today, -i);
    const e = data.entries[k];
    if (isEmpty(e)) continue;
    const m = moodOf(e.mood);
    const g = (e.gratitude || []).filter((x) => x.trim());
    lines.push(
      `${k} | mood: ${m ? `${m.l} (${e.mood}/5)` : 'n/a'} | tags: ${e.tags.join(', ') || 'none'}` +
        (g.length ? ` | grateful for: ${g.join('; ')}` : '') +
        `\n${(e.text || '').slice(0, 1500)}`,
    );
  }
  if (!lines.length) return null;
  return `You are a warm, thoughtful journaling companion. Below are someone's journal entries from the past 7 days.
Write a short weekly reflection addressed to them ("you"), max 170 words, plain text, short paragraphs, no headings or bullet symbols:
1) Two or three patterns you notice (for example how mood relates to tags, activities, people or sleep).
2) One thing that went well that deserves credit.
3) End with two gentle, open questions for next week, each on its own line.
Be specific to what they wrote. Don't diagnose or give medical advice. If an entry suggests serious distress, kindly suggest talking to someone they trust or a professional.

ENTRIES:
${lines.join('\n\n')}`;
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
