import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { isEmpty, newEntry, uid } from './logic';
import { loadData, saveData } from './storage';
import type { AppData, Capsule, Entry, Settings } from './types';

type Store = {
  data: AppData;
  updateEntry: (date: string, mutate: (e: Entry) => void) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addCapsule: (letter: string, unlock: string, created: string) => void;
  removeCapsule: (id: string) => void;
  markCapsulesRead: (ids: string[]) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const latest = useRef<AppData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  // Debounced autosave + flush when the app goes to the background.
  useEffect(() => {
    if (!data) return;
    latest.current = data;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveData(data), 300);
  }, [data]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && latest.current) saveData(latest.current);
    });
    return () => sub.remove();
  }, []);

  const updateEntry = useCallback((date: string, mutate: (e: Entry) => void) => {
    setData((d) => {
      if (!d) return d;
      const base = d.entries[date] || newEntry(date);
      const e: Entry = {
        ...base,
        tags: [...base.tags],
        photos: [...base.photos],
        gratitude: [...base.gratitude],
        done: { ...base.done },
      };
      mutate(e);
      e.updated = Date.now();
      const entries = { ...d.entries };
      if (isEmpty(e)) delete entries[date];
      else entries[date] = e;
      return { ...d, entries };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => (d ? { ...d, settings: { ...d.settings, ...patch } } : d));
  }, []);

  const addCapsule = useCallback((letter: string, unlock: string, created: string) => {
    const c: Capsule = { id: uid(), letter, unlock, created, read: false };
    setData((d) => (d ? { ...d, capsules: { ...d.capsules, [c.id]: c } } : d));
  }, []);

  const removeCapsule = useCallback((id: string) => {
    setData((d) => {
      if (!d) return d;
      const capsules = { ...d.capsules };
      delete capsules[id];
      return { ...d, capsules };
    });
  }, []);

  const markCapsulesRead = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setData((d) => {
      if (!d) return d;
      const capsules = { ...d.capsules };
      for (const id of ids) if (capsules[id]) capsules[id] = { ...capsules[id], read: true };
      return { ...d, capsules };
    });
  }, []);

  const value = useMemo(
    () =>
      data
        ? { data, updateEntry, updateSettings, addCapsule, removeCapsule, markCapsulesRead }
        : null,
    [data, updateEntry, updateSettings, addCapsule, removeCapsule, markCapsulesRead],
  );

  if (!value) return null; // tiny moment while loading from disk
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
