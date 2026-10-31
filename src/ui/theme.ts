import { Platform } from 'react-native';
import type { StatKey } from '../engine/types.ts';

export const colors = {
  bg: '#0B1220',
  surface: '#131C2E',
  surface2: '#1B2740',
  border: '#26334F',
  text: '#EAF0FA',
  muted: '#8A9BB8',
  gold: '#E0B866',
  danger: '#F0716B',
  good: '#5BD38A',
  overlay: 'rgba(5,9,18,0.82)',
};

export const statColors: Record<StatKey, string> = {
  health: '#5BD38A',
  happiness: '#F4C95D',
  smarts: '#9B7BF0',
  looks: '#F08BB5',
  reputation: '#5AA9F0',
};

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) as string;

export const radius = { sm: 10, md: 14, lg: 20 };
export const fmtMoney = (n: number) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
