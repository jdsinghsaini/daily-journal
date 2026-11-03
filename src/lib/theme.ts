import { useColorScheme } from 'react-native';

const light = {
  bg: '#FAF6EF',
  card: '#FFFDF9',
  ink: '#2B2622',
  muted: '#877D74',
  line: '#EBE3D7',
  acc: '#C2643C',
  acc2: '#F6E6DA',
  inputBg: '#FAF6EF',
  dark: false,
};

const dark: typeof light = {
  bg: '#1A1815',
  card: '#23201C',
  ink: '#EFE9E1',
  muted: '#9C9289',
  line: '#35302A',
  acc: '#E3895C',
  acc2: '#3B2A20',
  inputBg: '#1A1815',
  dark: true,
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const SERIF = 'Georgia';

/** Mix a hex colour toward another (0..1). */
export function mix(hex: string, toward: string, amount: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(toward);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
