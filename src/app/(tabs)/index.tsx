import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Body, Btn, Card, Chip, H3, Input, Row, Screen, s } from '../../components/ui';
import { fmtShort, monthGrid, monthLabel, shiftMonth, todayKey } from '../../lib/dates';
import { allTags, filled, isEmpty, search, streak } from '../../lib/logic';
import { MONTH_GRADIENTS, moodOf, MOODS_DISPLAY, NO_MOOD_COLOR, WEEKDAY_COLORS } from '../../lib/moods';
import { useStore } from '../../lib/store';
import { mix, SERIF, useTheme } from '../../lib/theme';

const openDay = (date: string) => router.navigate({ pathname: '/today', params: { date, t: String(Date.now()) } });

export default function CalendarScreen() {
  const t = useTheme();
  const { data } = useStore();
  const tk = todayKey();
  const [ym, setYm] = useState(tk.slice(0, 7));
  const [query, setQuery] = useState('');
  const cells = monthGrid(ym);
  const grad = MONTH_GRADIENTS[Number(ym.slice(5, 7)) - 1];
  const monthCount = filled(data.entries).filter(([k]) => k.startsWith(ym)).length;
  const results = search(data.entries, query);
  const tags = allTags(data.entries).slice(0, 12);

  return (
    <Screen testID="calendar-screen">
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 16, marginBottom: 6 }}>
        <Row style={s.between}>
          <NavBtn label="‹" onPress={() => setYm(shiftMonth(ym, -1))} a11y="Previous month" />
          <View style={{ alignItems: 'center' }}>
            <Text testID="month-label" style={{ color: '#fff', fontFamily: SERIF, fontWeight: '700', fontSize: 26 }}>{monthLabel(ym)}</Text>
            <Text style={{ color: '#fff', opacity: 0.92, fontSize: 13 }}>
              {monthCount} {monthCount === 1 ? 'entry' : 'entries'} · {streak(data.entries, tk)}🔥 day streak
            </Text>
          </View>
          <NavBtn label="›" onPress={() => setYm(shiftMonth(ym, 1))} a11y="Next month" />
        </Row>
      </LinearGradient>

      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 6 }}>
              <Text style={{ color: WEEKDAY_COLORS[i], fontWeight: '800', fontSize: 12 }}>{d}</Text>
            </View>
          ))}
          {cells.map((k, i) => {
            if (!k) return <View key={'b' + i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
            const e = data.entries[k];
            const has = !isEmpty(e);
            const mood = has ? moodOf(e!.mood) : undefined;
            const future = k > tk;
            const wc = WEEKDAY_COLORS[i % 7];
            const fill = has ? (mood ? mood.c : NO_MOOD_COLOR) : null;
            return (
              <View key={k} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
                <Pressable
                  testID={`day-${k}`}
                  accessibilityLabel={`${fmtShort(k)}${mood ? ', ' + mood.l : has ? ', written' : ''}`}
                  disabled={future}
                  onPress={() => openDay(k)}
                  style={({ pressed }) => ({
                    flex: 1, borderRadius: 13, overflow: 'hidden', opacity: future ? 0.4 : 1,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                    borderWidth: k === tk ? 2.5 : 0, borderColor: t.acc,
                  })}
                >
                  {fill ? (
                    <LinearGradient colors={[fill, mix(fill, '#000000', 0.25)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{Number(k.slice(8))}</Text>
                      <Text style={{ fontSize: 13 }}>{mood ? mood.e : '✍️'}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: mix(wc, t.card, t.dark ? 0.78 : 0.84) }}>
                      <Text style={{ color: t.ink, fontSize: 13 }}>{Number(k.slice(8))}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {MOODS_DISPLAY.map((m) => (
            <Legend key={m.v} color={m.c} label={`${m.e} ${m.l}`} />
          ))}
          <Legend color={NO_MOOD_COLOR} label="✍️ No mood" />
        </View>
        <View style={{ marginTop: 14 }}>
          <Btn
            full
            kind="primary"
            testID="write-today"
            label={isEmpty(data.entries[tk]) ? '✏️  Write today’s entry' : '✏️  Continue today’s entry'}
            onPress={() => openDay(tk)}
          />
        </View>
      </Card>

      <Card>
        <H3 style={{ marginBottom: 10 }}>Search your journal</H3>
        <Input value={query} onChangeText={setQuery} placeholder="Search words or #tags" testID="search" autoCapitalize="none" clearButtonMode="while-editing" />
        {!query.trim() ? (
          tags.length ? (
            <View style={{ marginTop: 10 }}>
              <Body small muted style={{ marginBottom: 6 }}>Your tags</Body>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {tags.map((tg) => (
                  <Chip key={tg} label={'#' + tg} onPress={() => setQuery('#' + tg)} />
                ))}
              </View>
            </View>
          ) : (
            <Body small muted style={{ marginTop: 10 }}>Entries you write will be searchable here.</Body>
          )
        ) : results.length ? (
          <View style={{ marginTop: 6 }}>
            <Body small muted testID="result-count">{`${results.length} result${results.length > 1 ? 's' : ''}`}</Body>
            {results.map(([k, e], i) => (
              <Pressable key={k} onPress={() => openDay(k)} testID={`result-${k}`} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
                <Body small muted>{`${fmtShort(k)} ${moodOf(e.mood)?.e ?? ''}  ${e.tags.map((x) => '#' + x).join(' ')}`}</Body>
                <Text numberOfLines={2} style={{ fontFamily: SERIF, color: t.ink, fontSize: 16 }}>{e.text || '(no text)'}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Body small muted style={{ marginTop: 10 }}>No matches yet.</Body>
        )}
      </Card>
    </Screen>
  );
}

function NavBtn({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable accessibilityLabel={a11y} onPress={onPress} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 24, lineHeight: 28 }}>{label}</Text>
    </Pressable>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: t.muted }}>{label}</Text>
    </View>
  );
}
