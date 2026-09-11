import { create } from "zustand";
import { EMPTY_KEYS, type AxisId, type Ending, type Keys, type LogLine, type Phase } from "./core/types";

export type Prompt = { label: string; detail: string } | null;

export type GameUI = {
  phase: Phase;
  objective: string;
  location: string;
  coherence: number;
  cognition: number;
  entropy: number;
  timeline: 0 | 1 | 2;
  reversing: boolean;
  keys: Keys;
  attuned: AxisId[];
  logs: LogLine[];
  prompt: Prompt;
  ending: Ending | null;
  flash: number;
  metaAlert: string | null;
  queries: number;
  anomalies: number;
  playtime: number;
  seed: string;
  isTouch: boolean;
  volume: number;
  muted: boolean;
  sensitivity: number;
  invertY: boolean;
  shake: boolean;
  hudRewrite: string | null;
  set: (p: Partial<GameUI>) => void;
};

export const useGame = create<GameUI>((set) => ({
  phase: "title",
  objective: "Enter the engine",
  location: "Projection threshold",
  coherence: 100,
  cognition: 24,
  entropy: 0.18,
  timeline: 1,
  reversing: false,
  keys: { ...EMPTY_KEYS },
  attuned: [],
  logs: [],
  prompt: null,
  ending: null,
  flash: 0,
  metaAlert: null,
  queries: 0,
  anomalies: 0,
  playtime: 0,
  seed: "PENTAXIS-5D",
  isTouch: false,
  volume: 0.72,
  muted: false,
  sensitivity: 1,
  invertY: false,
  shake: true,
  hudRewrite: null,
  set: (p) => set(p),
}));

let logSeq = 1;

export function pushLog(text: string, kind: LogLine["kind"] = "engine") {
  const line = { id: logSeq++, text, kind };
  const logs = [...useGame.getState().logs, line].slice(-8);
  useGame.setState({ logs });
}

export function keyCount(keys: Keys) {
  return (Object.values(keys) as boolean[]).filter(Boolean).length;
}
