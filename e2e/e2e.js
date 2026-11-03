// End-to-end test of the Daily Journal web build (phone-sized viewport).
const { chromium } = require('playwright');
const URL = 'http://localhost:8099';
const results = [];
let page;
const step = async (name, fn) => {
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name, String(e.message).split('\n')[0]]); await page.screenshot({ path: `fail-${results.length}.png` }); }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const id = (x) => page.getByTestId(x).first();
const visibleTab = async (name) => page.getByRole('tab', { name }).first().click().catch(async () => page.getByText(name, { exact: true }).last().click());
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = key(new Date());
const yd = new Date(); yd.setDate(yd.getDate() - 1); const yesterday = key(yd);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(URL);
  await step('App opens on the colourful calendar', async () => {
    await id('calendar-screen').waitFor({ timeout: 15000 });
    const label = await id('month-label').innerText();
    expect(label.includes(String(new Date().getFullYear())), 'month label: ' + label);
    await id(`day-${today}`).waitFor();
    await page.screenshot({ path: 'shot-1-calendar-empty.png' });
  });

  await step('"Write today’s entry" opens today', async () => {
    await id('write-today').click();
    await id('today-screen').waitFor();
    await id('entry-text').waitFor();
  });

  await step('Mood order is Great → Awful', async () => {
    const ids = await page.locator('[data-testid^="mood-"]').evaluateAll((els) => els.filter((e) => e.offsetParent).map((e) => e.dataset.testid));
    expect(JSON.stringify(ids) === JSON.stringify(['mood-Great', 'mood-Good', 'mood-Okay', 'mood-Low', 'mood-Awful']), ids.join(','));
  });

  await step('Pick mood, write text, use prompt', async () => {
    await id('mood-Great').click();
    await id('entry-text').fill('Great gym session by the lake and dinner with family.');
    const prompt = await id('prompt').innerText();
    await id('use-prompt').click();
    const v = await id('entry-text').inputValue();
    expect(v.includes(prompt), 'prompt not inserted');
  });

  await step('Gratitude: toggle and fill three things', async () => {
    await id('grat-toggle').click();
    await id('grat-0').fill('Sunny walk');
    await id('grat-1').fill('Mom');
    await id('grat-2').fill('Hot coffee');
  });

  await step('Custom-named list: create "My prayers" with 2 items', async () => {
    await id('ritual-create').click();
    await id('ritual-title').fill('My prayers');
    await id('ritual-item-input-0').fill('Morning prayer');
    await id('ritual-add').click();
    await id('ritual-item-input-1').fill('Evening prayer');
    await id('ritual-done').click();
    await page.getByText('My prayers').first().waitFor();
    expect((await id('ritual-progress').innerText()).startsWith('0/2'), 'progress');
  });

  await step('Tap an item → Completed, progress 1/2; tap again → undo', async () => {
    await id('ritual-Morning prayer').click();
    await page.getByText('Completed').first().waitFor();
    expect((await id('ritual-progress').innerText()).startsWith('1/2'), 'progress after tick');
    await id('ritual-Evening prayer').click();
    expect((await id('ritual-progress').innerText()).includes('2/2 🎉'), 'all done');
    await id('ritual-Evening prayer').click();
    expect((await id('ritual-progress').innerText()).startsWith('1/2'), 'undo');
    await id('ritual-card').screenshot({ path: 'shot-3-ritual.png' });
  });

  await step('Tags: typed tag + suggestion chip', async () => {
    await id('tag-input').fill('gym');
    await id('tag-input').press('Enter');
    await id('tag-gym').waitFor();
    await id('suggest-family').click();
    await id('tag-family').waitFor();
    await page.screenshot({ path: 'shot-2-today.png', fullPage: true });
  });

  await step('Previous day: write a Low day with a tag', async () => {
    await id('prev-day').click();
    await page.waitForTimeout(300);
    await id('mood-Low').click();
    await id('entry-text').fill('Long meetings, felt tired.');
    await id('tag-input').fill('work');
    await id('tag-input').press('Enter');
    await id('tag-work').waitFor();
    // The list is shared across days, ticks are per-day
    expect((await id('ritual-progress').innerText()).startsWith('0/2'), 'ticks should be per day');
  });

  await step('Calendar shows mood colours and emoji for both days', async () => {
    await visibleTab('Calendar');
    await id('calendar-screen').waitFor();
    const t = await id(`day-${today}`).innerText();
    const y = await id(`day-${yesterday}`).innerText();
    expect(t.includes('😄'), 'today cell: ' + t);
    // yesterday may be in previous month on the 1st
    if (yesterday.slice(0, 7) === today.slice(0, 7)) expect(y.includes('😕'), 'yesterday cell: ' + y);
    await page.screenshot({ path: 'shot-4-calendar-filled.png' });
  });

  await step('Search by word and by #tag', async () => {
    await id('search').fill('lake');
    await id(`result-${today}`).waitFor();
    await id('search').fill('#work');
    await id(`result-${yesterday}`).waitFor();
    expect((await id('result-count').innerText()).startsWith('1 result'), 'tag count');
    await id('search').fill('zzzz');
    await page.getByText('No matches yet.').waitFor();
    await id('search').fill('');
  });

  await step('Tapping a calendar day opens that day', async () => {
    await id(`day-${today}`).click();
    await id('today-screen').waitFor();
    const v = await id('entry-text').inputValue();
    expect(v.startsWith('Great gym session'), 'opened wrong day: ' + v.slice(0, 30));
  });

  await step('Data survives an app reload', async () => {
    await page.waitForTimeout(600); // autosave debounce
    await page.goto(URL);
    await id('calendar-screen').waitFor({ timeout: 15000 });
    expect((await id(`day-${today}`).innerText()).includes('😄'), 'mood lost after reload');
    await id('write-today').click();
    expect((await id('entry-text').inputValue()).startsWith('Great gym session'), 'text lost');
    expect(await id('grat-1').inputValue() === 'Mom', 'gratitude lost');
    expect((await id('ritual-progress').innerText()).startsWith('1/2'), 'ritual ticks lost');
    await id('tag-gym').waitFor();
  });

  await step('Insights: streak, entries, average mood, words', async () => {
    await visibleTab('Insights');
    await id('insights-screen').waitFor();
    const streak = await id('stat-streak').innerText();
    const entries = await id('stat-entries').innerText();
    const avg = await id('stat-avg').innerText();
    expect(streak.startsWith('2'), 'streak ' + streak);
    expect(entries.startsWith('2'), 'entries ' + entries);
    expect(avg.startsWith('3.5'), 'avg ' + avg); // (5 + 2) / 2
    await page.screenshot({ path: 'shot-5-insights.png', fullPage: true });
  });

  await step('AI reflection without a key explains what to do', async () => {
    await id('reflect').click();
    const out = await id('ai-out').innerText();
    expect(out.includes('Settings'), out);
  });

  await step('Time capsule: rejects past date, seals future letter', async () => {
    await visibleTab('Capsule');
    await id('capsule-screen').waitFor();
    await id('capsule-text').fill('Dear future me, keep going.');
    await id('capsule-date').fill('2020-01-01');
    await id('seal').click();
    expect((await id('capsule-msg').innerText()).includes('future'), 'past date accepted');
    await id('capsule-date').fill('');
    await id('preset-30').click();
    await id('seal').click();
    expect((await id('capsule-msg').innerText()).startsWith('Sealed until'), 'not sealed');
    await page.getByText('Sealed. No peeking.').waitFor();
    await page.screenshot({ path: 'shot-6-capsule.png', fullPage: true });
  });

  await step('Unlocked capsule shows letter + banner on Today', async () => {
    // Plant a capsule that unlocked today, straight into storage, then reload.
    await page.goto(URL + '/favicon.ico'); // close the app first so it can't overwrite storage
    await page.evaluate((today) => {
      const k = 'daily-journal:v1';
      const d = JSON.parse(localStorage.getItem(k));
      d.capsules.past = { id: 'past', letter: 'Hello from last year!', unlock: today, created: '2025-11-01', read: false };
      localStorage.setItem(k, JSON.stringify(d));
    }, today);
    await page.goto(URL);
    await id('calendar-screen').waitFor({ timeout: 15000 });
    await id('write-today').click();
    await page.getByText('A letter from past you has unlocked', { exact: false }).click();
    await page.getByText('Hello from last year!').waitFor();
  });

  await step('Settings: export includes entries and list ticks', async () => {
    await visibleTab('Settings');
    await id('settings-screen').waitFor();
    await id('export').click();
    const txt = await id('export-text').inputValue();
    expect(txt.includes('Great gym session') && txt.includes('My prayers:') && txt.includes('✓ Morning prayer'), txt.slice(0, 200));
  });

  await step('PIN: mismatch is rejected, matching PIN is set', async () => {
    await id('set-pin').click();
    for (const k of '1234') await id(`pin-${k}`).click();
    for (const k of '9999') await id(`pin-${k}`).click();
    await page.getByText('PINs didn’t match', { exact: false }).waitFor();
    for (const k of '1234') await id(`pin-${k}`).click();
    for (const k of '1234') await id(`pin-${k}`).click();
    await id('settings-note').waitFor();
  });

  await step('Lock screen on reopen: wrong PIN stays locked, right PIN unlocks', async () => {
    await page.waitForTimeout(600);
    await page.goto(URL);
    await id('lock-screen').waitFor({ timeout: 15000 });
    await page.screenshot({ path: 'shot-7-lock.png' });
    for (const k of '0000') await id(`pin-${k}`).click();
    await page.waitForTimeout(500);
    expect(await id('lock-screen').isVisible(), 'unlocked with wrong PIN!');
    for (const k of '1234') await id(`pin-${k}`).click();
    await id('lock-screen').waitFor({ state: 'detached', timeout: 5000 });
  });

  await step('Remove PIN → no lock on reopen', async () => {
    await visibleTab('Settings');
    await id('remove-pin').click();
    await id('remove-pin').click();
    await page.waitForTimeout(600);
    await page.goto(URL);
    await id('calendar-screen').waitFor({ timeout: 15000 });
    expect(!(await page.getByTestId('lock-screen').count()), 'still locked');
  });

  await step('Edit list: rename and remove an item', async () => {
    await id('write-today').click();
    await id('ritual-edit').click();
    await id('ritual-title').fill('My mantras');
    await page.getByLabel('Remove item').nth(1).click();
    await id('ritual-done').click();
    await page.getByText('My mantras').first().waitFor();
    expect((await id('ritual-progress').innerText()).startsWith('1/1'), 'after removing item');
  });

  await step('Dark mode renders', async () => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await visibleTab('Calendar');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'shot-8-dark.png' });
  });

  await step('No runtime errors in console', async () => {
    const real = errors.filter((e) => !/favicon|DevTools|Download the React/.test(e));
    expect(!real.length, real.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(r.join('  '));
  console.log(`\n${results.filter((r) => r[0] === 'PASS').length}/${results.length} passed`);
})();
