import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { ritualProgress, uid } from '../lib/logic';
import { useStore } from '../lib/store';
import { useTheme, mix } from '../lib/theme';
import type { RitualItem } from '../lib/types';
import { Bar, Body, Btn, Card, H3, Input, Row, s } from './ui';

const GREEN = '#3FC97A';

/** A user-named daily checklist ("My prayers", "My mantras"…). Ticks are saved per day. */
export function RitualList({ date }: { date: string }) {
  const t = useTheme();
  const { data, updateEntry, updateSettings } = useStore();
  const { ritual, ritualTitle } = data.settings;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RitualItem[]>([]);
  const [title, setTitle] = useState(ritualTitle);
  const entry = data.entries[date];

  const startEdit = () => {
    setTitle(ritualTitle);
    setDraft(ritual.length ? ritual.map((r) => ({ ...r })) : [{ id: uid(), name: '' }]);
    setEditing(true);
  };
  const finish = () => {
    updateSettings({
      ritualTitle: title.trim() || 'My daily rituals',
      ritual: draft.map((r) => ({ ...r, name: r.name.trim() })).filter((r) => r.name),
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <Card testID="ritual-card">
        <Row style={[s.between, { marginBottom: 12 }]}>
          <H3>Edit list</H3>
          <Btn label="Done" kind="primary" small onPress={finish} testID="ritual-done" />
        </Row>
        <Body small muted>List name</Body>
        <Input value={title} onChangeText={setTitle} placeholder="e.g. My prayers, My mantras, My works" style={{ marginTop: 4, marginBottom: 14 }} testID="ritual-title" />
        <Body small muted style={{ marginBottom: 6 }}>Items</Body>
        {draft.map((r, i) => (
          <Row key={r.id} style={{ marginBottom: 8, gap: 8 }}>
            <Input
              value={r.name}
              onChangeText={(v) => setDraft((d) => d.map((x) => (x.id === r.id ? { ...x, name: v } : x)))}
              placeholder="e.g. Morning prayer"
              style={{ flex: 1 }}
              autoFocus={i === draft.length - 1 && !r.name}
              testID={`ritual-item-input-${i}`}
              returnKeyType="next"
              onSubmitEditing={() => setDraft((d) => [...d, { id: uid(), name: '' }])}
            />
            <Pressable accessibilityLabel="Remove item" onPress={() => setDraft((d) => d.filter((x) => x.id !== r.id))} style={{ padding: 8 }}>
              <Text style={{ color: t.muted, fontSize: 18 }}>✕</Text>
            </Pressable>
          </Row>
        ))}
        <Btn label="+ Add another" onPress={() => setDraft((d) => [...d, { id: uid(), name: '' }])} testID="ritual-add" />
      </Card>
    );
  }

  if (!ritual.length) {
    return (
      <Card testID="ritual-card">
        <H3>{ritualTitle}</H3>
        <Body small muted style={{ marginVertical: 8 }}>
          Add things you want to do every day: prayers, mantras, habits. Name the list anything you like, then tap each one when it&apos;s done.
        </Body>
        <Btn label="+ Create my list" kind="primary" onPress={startEdit} testID="ritual-create" />
      </Card>
    );
  }

  const { done, total } = ritualProgress(ritual, entry);
  return (
    <Card testID="ritual-card">
      <Row style={s.between}>
        <H3 style={{ flex: 1 }}>{ritualTitle}</H3>
        <Btn label="Edit" kind="ghost" small onPress={startEdit} testID="ritual-edit" />
      </Row>
      <Row style={{ gap: 10, marginTop: 8, marginBottom: 4 }}>
        <Bar value={total ? done / total : 0} color={GREEN} />
        <Body small muted testID="ritual-progress">{`${done}/${total}${done === total ? ' 🎉' : ''}`}</Body>
      </Row>
      {ritual.map((r) => {
        const isDone = !!entry?.done?.[r.id];
        return (
          <Pressable
            key={r.id}
            testID={`ritual-${r.name}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              updateEntry(date, (e) => {
                if (e.done[r.id]) delete e.done[r.id];
                else e.done[r.id] = Date.now();
              });
            }}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1,
              borderColor: isDone ? mix(GREEN, t.card, 0.45) : t.line,
              backgroundColor: isDone ? mix(GREEN, t.card, 0.88) : t.card,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: isDone ? t.muted : t.ink }}>{r.name}</Text>
              {isDone && <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN }}>Completed</Text>}
            </View>
            <View style={{ width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: isDone ? GREEN : t.line, backgroundColor: isDone ? GREEN : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {isDone && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}
