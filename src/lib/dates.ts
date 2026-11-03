const pad2 = (n: number) => String(n).padStart(2, '0');

export const keyOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = (now: Date = new Date()) => keyOf(now);

export const addDays = (k: string, n: number) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};

/** Whole days from a to b (b - a). Uses noon to avoid DST edge cases. */
export const daysBetween = (a: string, b: string) => {
  const da = parseKey(a); da.setHours(12);
  const db = parseKey(b); db.setHours(12);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
};

export const fmtLong = (k: string) =>
  parseKey(k).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export const fmtShort = (k: string) =>
  parseKey(k).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const monthLabel = (ym: string) =>
  new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

export const shiftMonth = (ym: string, n: number) => {
  const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1);
  return keyOf(d).slice(0, 7);
};

/** Calendar cells for a month, Monday-first. null = leading blank. */
export const monthGrid = (ym: string): (string | null)[] => {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${y}-${pad2(m)}-${pad2(d)}`);
  return cells;
};

export const dayIndex = (k: string) => Math.floor(parseKey(k).getTime() / 86400000);
