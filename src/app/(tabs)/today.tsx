import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { RitualList } from '../../components/RitualList';
import { Body, Btn, Card, Chip, H3, Input, Row, Screen, Title, s } from '../../components/ui';
import { addDays, dayIndex, fmtLong, fmtShort, todayKey } from '../../lib/dates';
import { allTags, normalizeTags, onThisDay, words } from '../../lib/logic';
import { DEFAULT_TAGS, moodOf, MOODS_DISPLAY, PROMPTS } from '../../lib/moods';
import { deletePhoto, pickPhotos } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { SERIF, useTheme } from '../../lib/theme';

const MAX_PHOTOS = 4;

const clampDate = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= todayKey() ? d : todayKey());

export default function TodayScreen() {
  const params = useLocalSearchParams<{ date?: string; t?: string }>();
  const [date, setDate] = useState(() => clampDate(params.date));
  // When the calendar (or the Today tab) sends a new date, follow it.
  const paramKey = `${params.date}|${params.t}`;
  const [seenKey, setSeenKey] = useState(paramKey);
  if (paramKey !== seenKey) {
    setSeenKey(paramKey);
    if (params.date) setDate(clampDate(params.date));
  }
  // key={date} gives each day a fresh editor with its own text buffers.
  return <DayEditor key={date} date={date} setDate={setDate} />;
}

function DayEditor({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const t = useTheme();
  const tk = todayKey();
  const { data, updateEntry } = useStore();
  const e = data.entries[date];
  const [promptIdx, setPromptIdx] = useState(() => e?.promptIdx ?? dayIndex(date) % PROMPTS.length);
  const [tagText, setTagText] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local text buffers keep typing smooth; they're written to the store on every change.
  const [text, setText] = useState(e?.text ?? '');
  const [grat, setGrat] = useState<string[]>(e?.gratitude ?? ['', '', '']);

  const flashSaved = () => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1200);
  };

  const prompt = PROMPTS[promptIdx % PROMPTS.length];
  const isToday = date === tk;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const opened = Object.values(data.capsules).filter((c) => c.unlock <= tk && !c.read);
  const past = onThisDay(data.entries, date);
  const tags = e?.tags ?? [];
  const suggestions = [...new Set([...allTags(data.entries), ...DEFAULT_TAGS])].filter((x) => !tags.includes(x)).slice(0, 8);
  const gratOn = e?.gratOn ?? false;

  const addTags = (raw: string) => {
    const add = normalizeTags(raw);
    if (!add.length) return;
    updateEntry(date, (x) => {
      x.tags = [...new Set([...x.tags, ...add])];
    });
    setTagText('');
  };

  return (
    <Screen testID="today-screen">
      <Row style={[s.between, { marginBottom: 6 }]}>
        <Pressable accessibilityLabel="Previous day" testID="prev-day" onPress={() => setDate(addDays(date, -1))} style={{ padding: 10 }}>
          <Text style={{ fontSize: 26, color: t.ink }}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Body small muted>{isToday ? hello : 'Looking back'}</Body>
          <Title size={24} style={{ textAlign: 'center' }}>{fmtLong(date)}</Title>
        </View>
        <Pressable accessibilityLabel="Next day" testID="next-day" disabled={isToday} onPress={() => setDate(addDays(date, 1))} style={{ padding: 10, opacity: isToday ? 0 : 1 }}>
          <Text style={{ fontSize: 26, color: t.ink }}>›</Text>
        </Pressable>
      </Row>
      {!isToday && (
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <Btn small kind="ghost" label="Jump to today" onPress={() => setDate(tk)} />
        </View>
      )}

      {opened.length > 0 && (
        <Pressable onPress={() => router.navigate('/capsule')} style={{ backgroundColor: t.acc, borderRadius: 16, padding: 14, marginVertical: 6 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>💌 A letter from past you has unlocked. Tap to read.</Text>
        </Pressable>
      )}

      <Card style={{ backgroundColor: t.acc2, borderColor: t.acc2 }}>
        <Row style={s.between}>
          <Body small muted>Today&apos;s prompt</Body>
          <Pressable accessibilityLabel="Another prompt" testID="shuffle" onPress={() => {
            const n = (promptIdx + 1 + Math.floor(Math.random() * 5)) % PROMPTS.length;
            setPromptIdx(n);
            updateEntry(date, (x) => { x.promptIdx = n; });
          }} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18, color: t.ink }}>↻</Text>
          </Pressable>
        </Row>
        <Text testID="prompt" style={{ fontFamily: SERIF, fontSize: 19, color: t.ink, marginVertical: 8 }}>{prompt}</Text>
        <Btn label="Answer this" testID="use-prompt" onPress={() => {
          if (text.includes(prompt)) return;
          const v = (text ? text + '\n\n' : '') + prompt + '\n';
          setText(v);
          updateEntry(date, (x) => { x.text = v; });
        }} />
      </Card>

      <Card>
        <H3 style={{ marginBottom: 10 }}>How are you feeling?</H3>
        <Row style={{ gap: 6 }}>
          {MOODS_DISPLAY.map((m) => {
            const on = e?.mood === m.v;
            return (
              <Pressable
                key={m.v}
                testID={`mood-${m.l}`}
                accessibilityLabel={m.l}
                accessibilityState={{ selected: on }}
                onPress={() => { updateEntry(date, (x) => { x.mood = x.mood === m.v ? 0 : m.v; }); flashSaved(); }}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 14, borderWidth: on ? 2 : 1, borderColor: on ? m.c : t.line, backgroundColor: on ? m.c + '26' : t.card }}
              >
                <Text style={{ fontSize: 26 }}>{m.e}</Text>
                <Text style={{ fontSize: 11, color: on ? t.ink : t.muted, marginTop: 2, fontWeight: on ? '700' : '400' }}>{m.l}</Text>
              </Pressable>
            );
          })}
        </Row>
      </Card>

      <Card>
        <Row style={[s.between, { marginBottom: 8 }]}>
          <H3>Write it down</H3>
          <Body small muted>{saved ? 'Saved ✓' : `${words(text)} words`}</Body>
        </Row>
        <TextInput
          testID="entry-text"
          multiline
          value={text}
          onChangeText={(v) => { setText(v); updateEntry(date, (x) => { x.text = v; }); flashSaved(); }}
          placeholder="Start with one line. That's enough. (Tip: tap the 🎤 on your keyboard to dictate.)"
          placeholderTextColor={t.muted}
          textAlignVertical="top"
          style={{ minHeight: 170, fontFamily: SERIF, fontSize: 17, lineHeight: 26, color: t.ink, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 12 }}
        />
      </Card>

      <Card>
        <Pressable testID="grat-toggle" accessibilityRole="switch" accessibilityState={{ checked: gratOn }} onPress={() => updateEntry(date, (x) => { x.gratOn = !x.gratOn; })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 42, height: 25, borderRadius: 13, backgroundColor: gratOn ? t.acc : t.line, padding: 3, alignItems: gratOn ? 'flex-end' : 'flex-start' }}>
            <View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: '#fff' }} />
          </View>
          <H3>Gratitude — 3 good things</H3>
        </Pressable>
        {gratOn && (
          <View style={{ marginTop: 12, gap: 8 }}>
            {['Something good that happened…', 'Someone you appreciate…', 'A small pleasure…'].map((ph, i) => (
              <Input
                key={i}
                testID={`grat-${i}`}
                value={grat[i] ?? ''}
                placeholder={ph}
                onChangeText={(v) => {
                  const g = [...grat];
                  g[i] = v;
                  setGrat(g);
                  updateEntry(date, (x) => { x.gratitude = g; });
                }}
              />
            ))}
          </View>
        )}
      </Card>

      <RitualList date={date} />

      <Card>
        <H3 style={{ marginBottom: 10 }}>Tags</H3>
        {tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
            {tags.map((tg) => (
              <Chip key={tg} testID={`tag-${tg}`} label={`#${tg}  ×`} onPress={() => updateEntry(date, (x) => { x.tags = x.tags.filter((y) => y !== tg); })} />
            ))}
          </View>
        )}
        <Input
          testID="tag-input"
          value={tagText}
          onChangeText={(v) => (v.endsWith(',') ? addTags(v) : setTagText(v))}
          onSubmitEditing={() => addTags(tagText)}
          onBlur={() => addTags(tagText)}
          placeholder="Add a tag: work, gym, family…"
          autoCapitalize="none"
          returnKeyType="done"
          submitBehavior="submit"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          {suggestions.map((sg) => (
            <Chip key={sg} outline label={`+ ${sg}`} onPress={() => addTags(sg)} testID={`suggest-${sg}`} />
          ))}
        </View>
      </Card>

      <Card>
        <H3 style={{ marginBottom: 10 }}>Photos</H3>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(e?.photos ?? []).map((uri, i) => (
            <View key={uri + i} style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: t.line }}>
              <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
              <Pressable accessibilityLabel="Remove photo" onPress={() => { deletePhoto(uri); updateEntry(date, (x) => { x.photos = x.photos.filter((p) => p !== uri); }); }}
                style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.55)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>✕</Text>
              </Pressable>
            </View>
          ))}
          {(e?.photos?.length ?? 0) < MAX_PHOTOS && (
            <Pressable
              testID="add-photo"
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  const uris = await pickPhotos(MAX_PHOTOS - (e?.photos?.length ?? 0));
                  if (uris.length) updateEntry(date, (x) => { x.photos = [...x.photos, ...uris].slice(0, MAX_PHOTOS); });
                } finally {
                  setBusy(false);
                }
              }}
              style={{ width: 84, height: 84, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: t.muted, fontSize: 13, textAlign: 'center' }}>{busy ? '…' : '+ Add\nphoto'}</Text>
            </Pressable>
          )}
        </View>
      </Card>

      {past.length > 0 && (
        <Card testID="on-this-day">
          <H3>On this day</H3>
          {past.map(([pk, pe]) => (
            <Pressable key={pk} onPress={() => setDate(pk)} style={{ borderLeftWidth: 3, borderLeftColor: t.acc, paddingLeft: 12, marginTop: 10 }}>
              <Body small muted>{`${fmtShort(pk)} ${moodOf(pe.mood)?.e ?? ''}`}</Body>
              <Text numberOfLines={3} style={{ fontFamily: SERIF, color: t.ink, fontSize: 15 }}>{pe.text || '(no text)'}</Text>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}
