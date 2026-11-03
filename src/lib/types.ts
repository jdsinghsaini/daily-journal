export type Entry = {
  date: string; // YYYY-MM-DD
  text: string;
  mood: number; // 0 = not set, 1 (awful) … 5 (great)
  tags: string[];
  photos: string[]; // file URIs (native) or data URIs (web)
  gratitude: string[]; // always 3 slots
  gratOn: boolean;
  done: Record<string, number>; // ritual item id -> completed timestamp
  promptIdx: number;
  updated: number;
};

export type Capsule = {
  id: string;
  letter: string;
  unlock: string; // YYYY-MM-DD
  created: string; // YYYY-MM-DD
  read: boolean;
};

export type RitualItem = { id: string; name: string };

export type Settings = {
  ritualTitle: string;
  ritual: RitualItem[];
  pinEnabled: boolean;
  biometric: boolean;
};

export type AppData = {
  version: 1;
  entries: Record<string, Entry>;
  capsules: Record<string, Capsule>;
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  ritualTitle: 'My daily rituals',
  ritual: [],
  pinEnabled: false,
  biometric: false,
};

export const emptyData = (): AppData => ({
  version: 1,
  entries: {},
  capsules: {},
  settings: { ...DEFAULT_SETTINGS, ritual: [] },
});
