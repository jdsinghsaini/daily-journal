/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, daysBetween, keyOf, monthGrid, parseKey, shiftMonth } from '../src/lib/dates';
import {
  allTags, exportText, filled, isEmpty, moodSeries, newEntry, normalizeTags, onThisDay,
  reflectionPrompt, ritualProgress, search, streak, tagMoods, totalWords, weekdayMoods, words,
} from '../src/lib/logic';
import { MOODS_DISPLAY } from '../src/lib/moods';
import { emptyData, type AppData, type Entry } from '../src/lib/types';

const mk = (date: string, p: Partial<Entry> = {}): Entry => ({ ...newEntry(date), ...p, updated: 1 });
const data = (...es: Entry[]): AppData => {
  const d = emptyData();
  for (const e of es) d.entries[e.date] = e;
  return d;
};

test('date helpers', () => {
  assert.equal(keyOf(parseKey('2026-03-09')), '2026-03-09');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29'); // leap year
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2); // across DST change
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
});

test('month grid is Monday-first with correct day count', () => {
  const g = monthGrid('2026-11'); // Nov 1 2026 is a Sunday
  assert.equal(g.filter((x) => x === null).length, 6);
  assert.equal(g.filter(Boolean).length, 30);
  assert.equal(g[6], '2026-11-01');
  const feb = monthGrid('2027-02'); // Feb 1 2027 is a Monday
  assert.equal(feb[0], '2027-02-01');
  assert.equal(feb.length, 28);
});

test('mood display order: Great first, Awful last', () => {
  assert.deepEqual(MOODS_DISPLAY.map((m) => m.l), ['Great', 'Good', 'Okay', 'Low', 'Awful']);
});

test('isEmpty covers every field, including ritual ticks', () => {
  assert.ok(isEmpty(undefined));
  assert.ok(isEmpty(mk('2026-11-01')));
  assert.ok(isEmpty(mk('2026-11-01', { text: '   ' })));
  assert.ok(!isEmpty(mk('2026-11-01', { text: 'hi' })));
  assert.ok(!isEmpty(mk('2026-11-01', { mood: 3 })));
  assert.ok(!isEmpty(mk('2026-11-01', { tags: ['x'] })));
  assert.ok(!isEmpty(mk('2026-11-01', { photos: ['a'] })));
  assert.ok(!isEmpty(mk('2026-11-01', { gratitude: ['', 'sun', ''] })));
  assert.ok(!isEmpty(mk('2026-11-01', { done: { r1: 123 } })));
});

test('streak counts back from today, or from yesterday if today is blank', () => {
  const d = data(mk('2026-11-02', { text: 'a' }), mk('2026-11-01', { mood: 4 }), mk('2026-10-31', { text: 'c' }), mk('2026-10-29', { text: 'gap' }));
  assert.equal(streak(d.entries, '2026-11-02'), 3);
  assert.equal(streak(d.entries, '2026-11-03'), 3); // today not written yet
  assert.equal(streak(d.entries, '2026-11-05'), 0);
});

test('tags: normalize, rank, search by tag and text', () => {
  assert.deepEqual(normalizeTags(' #Gym, Deep Work ,,family'), ['gym', 'deep-work', 'family']);
  const d = data(
    mk('2026-11-01', { text: 'Long run by the lake', tags: ['exercise'], mood: 5 }),
    mk('2026-11-02', { text: 'Meetings all day', tags: ['work', 'exercise'], mood: 2 }),
    mk('2026-11-03', { gratitude: ['coffee with Sam', '', ''], tags: ['friends'], mood: 4 }),
  );
  assert.deepEqual(allTags(d.entries)[0], 'exercise');
  assert.deepEqual(search(d.entries, '#exer').map(([k]) => k), ['2026-11-02', '2026-11-01']);
  assert.deepEqual(search(d.entries, 'LAKE').map(([k]) => k), ['2026-11-01']);
  assert.deepEqual(search(d.entries, 'sam').map(([k]) => k), ['2026-11-03']);
  assert.deepEqual(search(d.entries, '  '), []);
  const tm = tagMoods(d.entries);
  assert.equal(tm[0].tag, 'friends');
  assert.equal(tm.find((t) => t.tag === 'exercise')!.avg, 3.5);
});

test('on this day finds earlier years and 30 days ago', () => {
  const d = data(mk('2025-11-02', { text: 'last year' }), mk('2024-11-02', { text: 'two years' }), mk('2026-10-03', { text: 'month ago' }), mk('2026-11-01', { text: 'yesterday' }));
  assert.deepEqual(onThisDay(d.entries, '2026-11-02').map(([k]) => k).sort(), ['2024-11-02', '2025-11-02', '2026-10-03']);
});

test('insights numbers', () => {
  const d = data(mk('2026-11-02', { mood: 5, text: 'one two three' }), mk('2026-11-01', { mood: 3, text: 'four' })); // Mon, Sun
  const s = moodSeries(d.entries, '2026-11-02');
  assert.equal(s.length, 30);
  assert.equal(s[29].mood, 5);
  assert.equal(s[28].mood, 3);
  assert.equal(totalWords(d.entries), 4);
  const wd = weekdayMoods(d.entries);
  assert.equal(wd[0], 5); // Monday
  assert.equal(wd[6], 3); // Sunday
  assert.equal(words(''), 0);
});

test('ritual progress and export', () => {
  const d = data(mk('2026-11-02', { done: { a: 1 }, text: 'Prayed', mood: 5, tags: ['faith'] }));
  d.settings.ritualTitle = 'My prayers';
  d.settings.ritual = [{ id: 'a', name: 'Morning prayer' }, { id: 'b', name: 'Evening prayer' }];
  assert.deepEqual(ritualProgress(d.settings.ritual, d.entries['2026-11-02']), { done: 1, total: 2 });
  const t = exportText(d);
  assert.match(t, /😄 Great/);
  assert.match(t, /My prayers:\n✓ Morning prayer/);
  assert.doesNotMatch(t, /Evening prayer/);
  assert.equal(exportText(emptyData()), 'No entries yet.');
});

test('reflection prompt only includes the last 7 days', () => {
  const d = data(mk('2026-11-02', { text: 'recent', mood: 4 }), mk('2026-10-20', { text: 'old entry' }));
  const p = reflectionPrompt(d, '2026-11-02')!;
  assert.match(p, /recent/);
  assert.doesNotMatch(p, /old entry/);
  assert.equal(reflectionPrompt(emptyData(), '2026-11-02'), null);
  assert.equal(filled(d.entries).length, 2);
});
