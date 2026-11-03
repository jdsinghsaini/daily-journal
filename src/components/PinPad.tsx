import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SERIF, useTheme } from '../lib/theme';
import { Body, Title } from './ui';

type Props = {
  title: string;
  subtitle: string;
  /** Return false to shake and clear. */
  onComplete: (pin: string) => Promise<boolean> | boolean;
  onCancel?: () => void;
  extra?: React.ReactNode;
};

export function PinPad({ title, subtitle, onComplete, onCancel, extra }: Props) {
  const t = useTheme();
  const [pin, setPin] = useState('');
  const [shake] = useState(() => new Animated.Value(0));

  const press = async (k: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    if (k === 'del') return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      const ok = await onComplete(next);
      if (!ok) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Animated.sequence(
          [12, -12, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 60, useNativeDriver: Platform.OS !== 'web' })),
        ).start();
        setTimeout(() => setPin(''), 250);
      }
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', onCancel ? 'cancel' : '', '0', 'del'];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Title>{title}</Title>
      <Body muted style={{ marginTop: 6 }} >{subtitle}</Body>
      <Animated.View style={{ flexDirection: 'row', gap: 16, marginVertical: 26, transform: [{ translateX: shake }] }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 15, height: 15, borderRadius: 8, borderWidth: 2, borderColor: t.acc, backgroundColor: i < pin.length ? t.acc : 'transparent' }} />
        ))}
      </Animated.View>
      <View style={{ width: 260, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
        {keys.map((k, i) =>
          k === '' ? (
            <View key={i} style={{ width: 74, height: 74 }} />
          ) : (
            <Pressable
              key={i}
              testID={`pin-${k}`}
              accessibilityLabel={k === 'del' ? 'Delete' : k === 'cancel' ? 'Cancel' : k}
              onPress={() => (k === 'cancel' ? onCancel?.() : press(k))}
              style={({ pressed }) => ({
                width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center',
                backgroundColor: k === 'cancel' || k === 'del' ? 'transparent' : pressed ? t.acc2 : t.card,
                borderWidth: k === 'cancel' || k === 'del' ? 0 : 1, borderColor: t.line,
              })}
            >
              <Text style={{ color: t.ink, fontSize: k === 'cancel' ? 15 : 26, fontFamily: k.length === 1 ? SERIF : undefined }}>
                {k === 'del' ? '⌫' : k === 'cancel' ? 'Cancel' : k}
              </Text>
            </Pressable>
          ),
        )}
      </View>
      {extra}
    </SafeAreaView>
  );
}
