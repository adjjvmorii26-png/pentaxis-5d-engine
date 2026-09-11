export const TAU = Math.PI * 2;

export type AxisId = "space" | "time" | "state" | "mind" | "meta";

export type Phase = "title" | "playing" | "paused" | "codex" | "ending";

export type Ending = "stabilize" | "collapse" | "ascend";

export const AXES: {
  id: AxisId;
  name: string;
  glyph: string;
  kicker: string;
  angle: number;
  color: number;
  token: string;
}[] = [
  {
    id: "space",
    name: "Space",
    glyph: "Σ",
    kicker: "Topology",
    angle: -Math.PI / 2,
    color: 0x8eb4c8,
    token: "axis-space",
  },
  {
    id: "time",
    name: "Time",
    glyph: "Τ",
    kicker: "Chronology",
    angle: -Math.PI / 2 + TAU / 5,
    color: 0xb8a890,
    token: "axis-time",
  },
  {
    id: "state",
    name: "State",
    glyph: "Ψ",
    kicker: "Superposition",
    angle: -Math.PI / 2 + (2 * TAU) / 5,
    color: 0x7da8a0,
    token: "axis-state",
  },
  {
    id: "mind",
    name: "Mind",
    glyph: "Μ",
    kicker: "Cognition",
    angle: -Math.PI / 2 + (3 * TAU) / 5,
    color: 0xb09098,
    token: "axis-mind",
  },
  {
    id: "meta",
    name: "Meta",
    glyph: "Ω",
    kicker: "The Engine",
    angle: -Math.PI / 2 + (4 * TAU) / 5,
    color: 0xc8ccd4,
    token: "axis-meta",
  },
];

export type Keys = Record<AxisId, boolean>;

export const EMPTY_KEYS: Keys = {
  space: false,
  time: false,
  state: false,
  mind: false,
  meta: false,
};

export type LogLine = { id: number; text: string; kind: "engine" | "world" | "npc" };

export type ColliderKind = "wall" | "floor" | "platform";

export type Collider = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  active: boolean;
  kind: ColliderKind;
  tag: string;
  track?: 0 | 1 | 2;
  quantumId?: string;
  mindLow?: boolean;
  mindHigh?: boolean;
  metaOpen?: boolean;
};

export function aabb(
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  kind: ColliderKind,
  tag = "",
): Collider {
  return {
    minX: cx - sx / 2,
    maxX: cx + sx / 2,
    minY: cy - sy / 2,
    maxY: cy + sy / 2,
    minZ: cz - sz / 2,
    maxZ: cz + sz / 2,
    active: true,
    kind,
    tag,
  };
}

export type Portal = {
  id: string;
  x: number;
  y: number;
  z: number;
  nx: number;
  nz: number;
  width: number;
  height: number;
  dest: { x: number; y: number; z: number; yaw: number };
  enabled: boolean;
  lastSide: number;
};

export type Pickup = {
  id: AxisId | "anomaly";
  x: number;
  y: number;
  z: number;
  taken: boolean;
  name: string;
};

export type Interactable = {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  label: string;
  kind: "npc" | "pedestal" | "quantum" | "sign" | "query";
};

export type Anomaly = {
  id: string;
  x: number;
  y: number;
  z: number;
  kind: "echo" | "whisper" | "paradox" | "drift";
  alive: boolean;
  age: number;
};
