import { EMPTY_KEYS, type AxisId, type Ending, type Keys } from "./types";

const SAVE_KEY = "pentaxis-save-v1";
const SETTINGS_KEY = "pentaxis-settings-v1";
const SAVE_VERSION = 1;

export type SaveData = {
  version: number;
  keys: Keys;
  attuned: AxisId[];
  coherence: number;
  cognition: number;
  timeline: 0 | 1 | 2;
  queries: number;
  anomalies: number;
  playtime: number;
  seed: string;
  ending: Ending | null;
  bestEnding: Ending | null;
  unlockedCodex: string[];
};

export type Settings = {
  version: number;
  volume: number;
  muted: boolean;
  sensitivity: number;
  invertY: boolean;
  shake: boolean;
};

const defaultSave = (): SaveData => ({
  version: SAVE_VERSION,
  keys: { ...EMPTY_KEYS },
  attuned: [],
  coherence: 100,
  cognition: 24,
  timeline: 1,
  queries: 0,
  anomalies: 0,
  playtime: 0,
  seed: "PENTAXIS-5D",
  ending: null,
  bestEnding: null,
  unlockedCodex: ["spec"],
});

const defaultSettings = (): Settings => ({
  version: 1,
  volume: 0.72,
  muted: false,
  sensitivity: 1,
  invertY: false,
  shake: true,
});

function migrate(raw: SaveData): SaveData {
  const d = defaultSave();
  return {
    ...d,
    ...raw,
    keys: { ...d.keys, ...raw.keys },
    version: SAVE_VERSION,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch {
    /* private mode / quota */
  }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...(JSON.parse(raw) as Settings) };
  } catch {
    return defaultSettings();
  }
}

export function writeSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function newCycle(seed?: string): SaveData {
  const prev = loadSave();
  const next = defaultSave();
  next.seed = seed ?? `PENTAXIS-${Date.now().toString(36).toUpperCase()}`;
  next.bestEnding = prev.bestEnding;
  next.unlockedCodex = prev.unlockedCodex;
  writeSave(next);
  return next;
}
