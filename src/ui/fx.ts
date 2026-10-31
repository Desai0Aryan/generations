// Animation + haptics helpers. No native animation library: plain requestAnimationFrame tweens,
// so the same code runs on iOS, Android and the browser preview.
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

let hapticsOn = true;
export const setHapticsEnabled = (v: boolean) => { hapticsOn = v; };
export const hapticsEnabled = () => hapticsOn;
const safe = (p: Promise<unknown> | undefined) => { try { p?.catch(() => {}); } catch {} };
export const tap = () => { if (hapticsOn) safe(Haptics.selectionAsync()); };
export const thud = () => { if (hapticsOn) safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)); };
export const success = () => { if (hapticsOn) safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)); };
export const warning = () => { if (hapticsOn) safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)); };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeBack = (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/** Smoothly follows `target` whenever it changes. */
export function useTween(target: number, ms = 600): number {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const from = cur.current;
    if (from === target) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / ms);
      cur.current = from + (target - from) * easeOut(t);
      setV(cur.current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** 0 -> 1 once when the component mounts (optionally delayed). `back` overshoots slightly for a "pop". */
export function useEntrance(ms = 380, delay = 0, back = false): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const timer = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const t = Math.min(1, (Date.now() - start) / ms);
        setP(back ? easeBack(t) : easeOut(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [ms, delay, back]);
  return p;
}

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function seeded(seed: number) {
  let s = seed || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

export function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
