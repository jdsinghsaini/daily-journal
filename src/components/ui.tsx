import React from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SERIF, useTheme } from '../lib/theme';

export function Screen({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        testID={testID}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={[{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 16, marginVertical: 6 }, style]}>
      {children}
    </View>
  );
}

export function Title({ children, size = 28, style }: { children: React.ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: SERIF, fontWeight: '600', fontSize: size, color: t.ink }, style]}>{children}</Text>;
}

export function H3({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: SERIF, fontWeight: '600', fontSize: 17, color: t.ink }, style]}>{children}</Text>;
}

export function Body({ children, muted, small, style, numberOfLines, testID }: {
  children: React.ReactNode; muted?: boolean; small?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number; testID?: string;
}) {
  const t = useTheme();
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[{ color: muted ? t.muted : t.ink, fontSize: small ? 13 : 16, lineHeight: small ? 18 : 23 }, style]}>
      {children}
    </Text>
  );
}

type BtnProps = PressableProps & { label: string; kind?: 'primary' | 'outline' | 'ghost'; small?: boolean; full?: boolean };
export function Btn({ label, kind = 'outline', small, full, style, ...rest }: BtnProps) {
  const t = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={(s) => [
        {
          backgroundColor: primary ? t.acc : kind === 'ghost' ? 'transparent' : t.card,
          borderColor: primary ? t.acc : t.line,
          borderWidth: 1,
          borderRadius: 999,
          paddingVertical: small ? 6 : full ? 13 : 9,
          paddingHorizontal: small ? 12 : 16,
          alignItems: 'center',
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: rest.disabled ? 0.5 : s.pressed ? 0.75 : 1,
        },
        typeof style === 'function' ? style(s) : style,
      ]}
    >
      <Text style={{ color: primary ? '#fff' : t.ink, fontWeight: '600', fontSize: small ? 13 : 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[{ backgroundColor: t.inputBg, borderColor: t.line, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, color: t.ink }, props.style]}
    />
  );
}

export function Chip({ label, onPress, outline, testID }: { label: string; onPress?: () => void; outline?: boolean; testID?: string }) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{ backgroundColor: outline ? 'transparent' : t.acc2, borderWidth: 1, borderColor: outline ? t.line : t.acc2, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11, marginRight: 6, marginBottom: 6 }}
    >
      <Text style={{ color: t.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export function Bar({ value, color }: { value: number; color: string }) {
  const t = useTheme();
  return (
    <View style={{ height: 10, borderRadius: 999, backgroundColor: t.line, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}

export const s = StyleSheet.create({
  between: { justifyContent: 'space-between' },
  wrap: { flexWrap: 'wrap' },
});
