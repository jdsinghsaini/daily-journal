import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { Bar, Body, Btn, Card, H3, Row, Screen, Title } from '../../components/ui';
import { getApiKey, reflect } from '../../lib/ai';
import { fmtShort, todayKey } from '../../lib/dates';
import { average, filled, moodSeries, reflectionPrompt, streak, tagMoods, totalWords, weekdayMoods } from '../../lib/logic';
import { moodOf } from '../../lib/moods';
import { useStore } from '../../lib/store';
import { SERIF, useTheme } from '../../lib/theme';

export default function InsightsScreen() {
  const t = useTheme();
  const { data } = useStore();
  const tk = todayKey();
  const series = moodSeries(data.entries, tk);
  const withMood = series.filter((x) => x.mood);
  const avg = average(withMood.map((x) => x.mood));
  const tags = tagMoods(data.entries);
  const wd = weekdayMoods(data.entries);
  const [ai, setAi] = useState<{ state: 'idle' | 'loading' | 'done' | 'error'; text: string }>({ state: 'idle', text: '' });

  const runReflection = async () => {
    const prompt = reflectionPrompt(data, tk);
    if (!prompt) return setAi({ state: 'error', text: 'Write a few entries this week first — then there will be something to reflect on.' });
    const key = await getApiKey();
    if (!key) return setAi({ state: 'error', text: 'Add your AI key in Settings to turn on weekly reflections.' });
    setAi({ state: 'loading', text: '' });
    try {
      setAi({ state: 'done', text: await reflect(prompt, key) });
    } catch (err) {
      setAi({ state: 'error', text: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
    }
  };

  // Chart geometry
  const W = 320, H = 130;
  const px = (i: number) => 12 + (i * (W - 24)) / 29;
  const py = (v: number) => H - 14 - ((v - 1) * (H - 28)) / 4;
  const pts = series.map((x, i) => (x.mood ? `${px(i)},${py(x.mood)}` : null)).filter(Boolean) as string[];

  return (
    <Screen testID="insights-screen">
      <Title style={{ marginVertical: 8 }}>Insights</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat v={`${streak(data.entries, tk)}🔥`} l="Day streak" testID="stat-streak" />
        <Stat v={String(filled(data.entries).length)} l="Entries" testID="stat-entries" />
        <Stat v={avg ? `${avg.toFixed(1)} ${moodOf(Math.round(avg))?.e}` : '–'} l="Avg mood · 30 days" testID="stat-avg" />
        <Stat v={totalWords(data.entries).toLocaleString()} l="Words written" testID="stat-words" />
      </View>

      <Card>
        <H3 style={{ marginBottom: 10 }}>Mood · last 30 days</H3>
        {withMood.length ? (
          <>
            <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Line key={v} x1={12} x2={W - 12} y1={py(v)} y2={py(v)} stroke={t.line} strokeWidth={1} />
              ))}
              {pts.length > 1 && <Polyline points={pts.join(' ')} fill="none" stroke={t.acc} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
              {series.map((x, i) => (x.mood ? <Circle key={x.date} cx={px(i)} cy={py(x.mood)} r={4.5} fill={moodOf(x.mood)!.c} /> : null))}
            </Svg>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body small muted>{fmtShort(series[0].date)}</Body>
              <Body small muted>Today</Body>
            </Row>
          </>
        ) : (
          <Body small muted>Pick a mood on a few days to see your trend.</Body>
        )}
      </Card>

      <Card>
        <H3>What lifts your mood</H3>
        <Body small muted style={{ marginTop: 2, marginBottom: 6 }}>Average mood on days with each tag</Body>
        {tags.length ? (
          tags.map((x) => <BarRow key={x.tag} label={`#${x.tag}`} sub={String(x.count)} value={x.avg} />)
        ) : (
          <Body small muted>Add tags and moods to your entries to see what connects to your good days.</Body>
        )}
      </Card>

      <Card>
        <H3 style={{ marginBottom: 6 }}>Mood by weekday</H3>
        {wd.some(Boolean) ? (
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => <BarRow key={d} label={d} value={wd[i]} />)
        ) : (
          <Body small muted>Not enough data yet.</Body>
        )}
      </Card>

      <Card testID="ai-card">
        <H3>✨ Weekly AI reflection</H3>
        <Body small muted style={{ marginTop: 4, marginBottom: 12 }}>
          Claude reads your last 7 days and points out patterns, with a couple of gentle questions for next week.
        </Body>
        <Btn kind="primary" label={ai.state === 'done' ? 'Reflect again' : 'Reflect on my week'} disabled={ai.state === 'loading'} onPress={runReflection} testID="reflect" />
        {ai.state === 'loading' && <ActivityIndicator style={{ marginTop: 14 }} color={t.acc} />}
        {!!ai.text && (
          <Text testID="ai-out" style={{ marginTop: 12, fontFamily: SERIF, fontSize: 16, lineHeight: 25, color: ai.state === 'error' ? t.muted : t.ink }}>{ai.text}</Text>
        )}
        {ai.state === 'error' && ai.text.includes('Settings') && (
          <View style={{ marginTop: 10 }}>
            <Btn small label="Open Settings" onPress={() => router.navigate('/settings')} />
          </View>
        )}
      </Card>
    </Screen>
  );
}

function Stat({ v, l, testID }: { v: string; l: string; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 14 }}>
      <Text style={{ fontFamily: SERIF, fontSize: 27, fontWeight: '700', color: t.ink }}>{v}</Text>
      <Text style={{ fontSize: 12, color: t.muted }}>{l}</Text>
    </View>
  );
}

function BarRow({ label, sub, value }: { label: string; sub?: string; value: number }) {
  return (
    <Row style={{ gap: 10, marginVertical: 6 }}>
      <Body small style={{ width: 96 }} numberOfLines={1}>{label}{sub ? `  ·${sub}` : ''}</Body>
      <Bar value={value / 5} color={value ? moodOf(Math.round(value))!.c : 'transparent'} />
      <Body small style={{ width: 30, textAlign: 'right' }}>{value ? value.toFixed(1) : ''}</Body>
    </Row>
  );
}
