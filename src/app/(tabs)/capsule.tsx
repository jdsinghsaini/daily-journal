import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Body, Btn, Card, H3, Input, Row, Screen, Title } from '../../components/ui';
import { addDays, daysBetween, fmtShort, todayKey } from '../../lib/dates';
import { useStore } from '../../lib/store';
import { SERIF, useTheme } from '../../lib/theme';

const PRESETS: [string, number][] = [['1 month', 30], ['6 months', 182], ['1 year', 365]];
const isDateKey = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export default function CapsuleScreen() {
  const t = useTheme();
  const { data, addCapsule, removeCapsule, markCapsulesRead } = useStore();
  const tk = todayKey();
  const [letter, setLetter] = useState('');
  const [days, setDays] = useState(365);
  const [custom, setCustom] = useState('');
  const [msg, setMsg] = useState('');
  const [armed, setArmed] = useState<string | null>(null);
  const list = Object.values(data.capsules).sort((a, b) => (a.unlock < b.unlock ? -1 : 1));

  // Opening this tab marks unlocked letters as read (clears the banner on Today).
  useFocusEffect(
    useCallback(() => {
      markCapsulesRead(list.filter((c) => c.unlock <= tk && !c.read).map((c) => c.id));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list.length]),
  );

  const unlock = custom.trim() ? custom.trim() : addDays(tk, days);

  const seal = () => {
    if (!letter.trim()) return setMsg('Write something first.');
    if (!isDateKey(unlock) || unlock <= tk) return setMsg('Pick a date in the future (YYYY-MM-DD).');
    addCapsule(letter.trim(), unlock, tk);
    setLetter('');
    setCustom('');
    setMsg(`Sealed until ${fmtShort(unlock)} 💌`);
  };

  return (
    <Screen testID="capsule-screen">
      <Title style={{ marginTop: 8 }}>Time capsule</Title>
      <Body muted style={{ marginTop: 2, marginBottom: 6 }}>Write a letter to your future self. It stays sealed until the date you pick.</Body>
      <Card>
        <TextInput
          testID="capsule-text"
          multiline
          value={letter}
          onChangeText={(v) => { setLetter(v); setMsg(''); }}
          placeholder="Dear future me…"
          placeholderTextColor={t.muted}
          textAlignVertical="top"
          style={{ minHeight: 140, fontFamily: SERIF, fontSize: 17, lineHeight: 25, color: t.ink, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 12 }}
        />
        <Body small muted style={{ marginTop: 12, marginBottom: 6 }}>Open in</Body>
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(([l, d]) => {
            const on = !custom && days === d;
            return (
              <Pressable key={d} testID={`preset-${d}`} onPress={() => { setDays(d); setCustom(''); }}
                style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: on ? t.acc : t.line, backgroundColor: on ? t.acc2 : 'transparent' }}>
                <Text style={{ color: t.ink, fontWeight: on ? '700' : '400' }}>{l}</Text>
              </Pressable>
            );
          })}
        </Row>
        <Input value={custom} onChangeText={setCustom} placeholder="…or a date: YYYY-MM-DD" style={{ marginTop: 10 }} testID="capsule-date" autoCapitalize="none" />
        <Body small muted style={{ marginTop: 6 }}>{isDateKey(unlock) ? `Opens ${fmtShort(unlock)}` : 'Use the format YYYY-MM-DD'}</Body>
        <View style={{ marginTop: 12 }}>
          <Btn full kind="primary" label="Seal the letter 💌" onPress={seal} testID="seal" />
        </View>
        {!!msg && <Body small style={{ marginTop: 8, textAlign: 'center' }} testID="capsule-msg">{msg}</Body>}
      </Card>

      <Card>
        <H3 style={{ marginBottom: 4 }}>Your capsules</H3>
        {list.length === 0 && <Body small muted>No capsules yet.</Body>}
        {list.map((c, i) => {
          const open = c.unlock <= tk;
          const left = daysBetween(tk, c.unlock);
          return (
            <View key={c.id} testID={`capsule-${i}`} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
              <Text style={{ fontSize: 26 }}>{open ? '💌' : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Body small muted>
                  {`Written ${fmtShort(c.created)} · ${open ? 'opened ' + fmtShort(c.unlock) : `opens ${fmtShort(c.unlock)} · ${left} day${left === 1 ? '' : 's'} to go`}`}
                </Body>
                {open ? (
                  <Text style={{ fontFamily: SERIF, color: t.ink, fontSize: 16, marginTop: 6 }}>{c.letter}</Text>
                ) : (
                  <Body muted style={{ marginTop: 4 }}>Sealed. No peeking.</Body>
                )}
                <View style={{ marginTop: 8 }}>
                  <Btn small kind="ghost" label={armed === c.id ? 'Tap again to delete' : 'Delete'}
                    onPress={() => {
                      if (armed !== c.id) { setArmed(c.id); setTimeout(() => setArmed((a) => (a === c.id ? null : a)), 2500); return; }
                      removeCapsule(c.id);
                      setArmed(null);
                    }} />
                </View>
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
