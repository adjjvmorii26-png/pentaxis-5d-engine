import * as THREE from "three";
import { audio } from "./core/audio";
import { Input } from "./core/input";
import { Juice } from "./core/juice";
import { loadSave, loadSettings, newCycle, writeSave, writeSettings, type SaveData } from "./core/save";
import { AXES, EMPTY_KEYS, type AxisId, type Ending, type Keys } from "./core/types";
import { ARCHIVIST, CHORUS, ENGINE_LINES, HINTS } from "./content/voices";
import { keyCount, pushLog, useGame } from "./store";
import { collideXZ, groundY, headBump } from "./sim/collision";
import { ATRIUM_R, buildWorld, updateTesseract, type World } from "./world/build";
import { makeStreams, pick } from "./core/rng";

const EYE = 1.58;
const RADIUS = 0.32;
const HEIGHT = 1.62;
const GRAVITY = 22;
const JUMP = 7.4;
const WALK = 5.6;
const SPRINT = 8.4;
const FIXED = 1 / 60;
const HISTORY = 8 * 20;

type Vec = { x: number; y: number; z: number };

export class Engine {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  world!: World;
  input = new Input();
  juice = new Juice();
  save: SaveData = loadSave();
  settings = loadSettings();

  pos: Vec = { x: 0, y: 0, z: 8.5 };
  vel: Vec = { x: 0, y: 0, z: 0 };
  yaw = 0;
  pitch = -0.08;
  grounded = false;
  bob = 0;
  speed = 0;
  acc = 0;
  time = 0;
  hudClock = 0;
  footClock = 0;
  checkpoint: Vec = { x: 0, y: 0, z: 8.5 };
  checkpointYaw = 0;
  look = new THREE.Vector3();
  tmp = new THREE.Vector3();
  collapsed = new Set<string>();
  archivistI = 0;
  chorusBias = 1;
  entropy = 0.2;
  hintAt: Record<string, number> = {};
  chamberTime: Record<string, number> = {};
  lastLookRate = 0;
  pointerLocked = false;
  touchLook = false;
  ritualFlash = 0;
  ended = false;
  streams = makeStreams(this.save.seed);
  cubeOrigin: Vec = { x: 0, y: 0, z: 0 };
  cubeT = 0;
  playerHistory: Vec[] = [];
  lastLogAt = 0;
  introSaid = false;
  location = "Atrium of Five Axes";

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
  }

  init() {
    this.world = buildWorld(this.scene, this.save.seed);
    this.input.attach();
    this.input.lookSensitivity = this.settings.sensitivity;
    this.input.invertY = this.settings.invertY;
    this.juice.enabled = this.settings.shake;
    this.cubeOrigin = {
      x: this.world.cube.mesh.position.x,
      y: this.world.cube.mesh.position.y,
      z: this.world.cube.mesh.position.z,
    };
    this.applySaveToWorld();
    this.syncHud(true);
    this.installControlsProbe();
    this.bindPointer();
  }

  applySaveToWorld() {
    for (const p of this.world.pickups) {
      if (p.id !== "anomaly" && this.save.keys[p.id]) p.taken = true;
    }
    for (const t of this.world.tesseracts) {
      const id = t.userData.pickup as AxisId | undefined;
      if (id && this.save.keys[id]) t.visible = false;
    }
  }

  bindPointer() {
    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.pointerLocked) return;
      this.input.lookX += e.movementX;
      this.input.lookY += e.movementY;
    });
    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      const phase = useGame.getState().phase;
      if (!this.pointerLocked && phase === "playing") {
        useGame.setState({ phase: "paused" });
      }
    });
  }

  requestLock() {
    if (useGame.getState().isTouch) return;
    this.canvas.requestPointerLock?.();
  }

  installControlsProbe() {
    const self = this;
    window.__controlsTest = {
      getYaw: () => self.yaw,
      getSpeed: () => self.speed,
      setKeys: (codes: string[]) => self.input.setKeys(codes),
      getPosition: () => ({ x: self.pos.x, y: self.pos.y, z: self.pos.z }),
      getPitch: () => self.pitch,
    };
  }

  startPlay() {
    audio.unlock();
    audio.startDrones();
    audio.setVolume(this.settings.volume);
    audio.setMuted(this.settings.muted);
    const fresh = keyCount(this.save.keys) === 0 && this.save.playtime < 1;
    if (fresh) {
      this.save = { ...this.save, coherence: 100, cognition: 28 };
    }
    useGame.setState({
      phase: "playing",
      seed: this.save.seed,
      keys: { ...this.save.keys },
      volume: this.settings.volume,
      muted: this.settings.muted,
      sensitivity: this.settings.sensitivity,
      invertY: this.settings.invertY,
      shake: this.settings.shake,
    });
    this.requestLock();
    if (!this.introSaid) {
      this.introSaid = true;
      pushLog("Projection locked. Five corridors. I am already watching.", "engine");
      pushLog("The Archivist waits by the core. Walk.", "world");
    }
  }

  pause() {
    if (document.pointerLockElement) document.exitPointerLock();
    useGame.setState({ phase: "paused" });
    this.persist();
  }

  resume() {
    useGame.setState({ phase: "playing" });
    this.requestLock();
  }

  openCodex() {
    if (document.pointerLockElement) document.exitPointerLock();
    useGame.setState({ phase: "codex" });
  }

  persist() {
    this.save.playtime = useGame.getState().playtime;
    this.save.keys = { ...useGame.getState().keys };
    this.save.attuned = [...useGame.getState().attuned];
    this.save.coherence = useGame.getState().coherence;
    this.save.cognition = useGame.getState().cognition;
    this.save.timeline = useGame.getState().timeline as 0 | 1 | 2;
    this.save.queries = useGame.getState().queries;
    this.save.anomalies = useGame.getState().anomalies;
    writeSave(this.save);
    writeSettings(this.settings);
  }

  restart(seed?: string) {
    this.save = newCycle(seed);
    this.ended = false;
    this.pos = { x: 0, y: 0, z: 8.5 };
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = 0;
    this.pitch = -0.08;
    this.entropy = 0.2;
    this.collapsed.clear();
    this.archivistI = 0;
    this.hintAt = {};
    this.chamberTime = {};
    this.introSaid = false;
    this.world.cube.history = [];
    for (const p of this.world.pickups) p.taken = false;
    for (const t of this.world.tesseracts) {
      if (t.userData.pickup) {
        t.visible = true;
        t.userData.taken = false;
      }
    }
    for (const an of this.world.anomalies) an.alive = false;
    this.save.attuned = [];
    useGame.setState({
      phase: "title",
      keys: { ...EMPTY_KEYS },
      attuned: [],
      ending: null,
      coherence: 100,
      cognition: 28,
      queries: 0,
      anomalies: 0,
      playtime: 0,
      logs: [],
      hudRewrite: null,
      metaAlert: null,
      objective: "Enter the engine",
      reversing: false,
      timeline: 1,
      seed: this.save.seed,
    });
  }

  currentChamber(): AxisId | "atrium" | "hyper" {
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (this.pos.y > 18) return "hyper";
    if (r < ATRIUM_R + 1.5) return "atrium";
    let best: AxisId = "space";
    let bestDot = -Infinity;
    for (const a of AXES) {
      const dx = Math.cos(a.angle);
      const dz = Math.sin(a.angle);
      const dot = this.pos.x * dx + this.pos.z * dz;
      if (dot > bestDot) {
        bestDot = dot;
        best = a.id;
      }
    }
    return best;
  }

  lookingAt(x: number, y: number, z: number, maxDist: number, cosMin = 0.62) {
    const dx = x - (this.pos.x + this.look.x * 0.2);
    const dy = y - (this.pos.y + EYE);
    const dz = z - this.pos.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > maxDist) return false;
    const dot = (dx * this.look.x + dy * this.look.y + dz * this.look.z) / Math.max(dist, 0.001);
    return dot > cosMin;
  }

  spend(n: number) {
    const g = useGame.getState();
    if (g.cognition < n) return false;
    useGame.setState({ cognition: g.cognition - n });
    return true;
  }

  hurt(n: number, why: string) {
    const g = useGame.getState();
    const next = Math.max(0, g.coherence - n);
    useGame.setState({ coherence: next });
    this.juice.addTrauma(0.45);
    this.juice.addFlash(0.35);
    this.juice.freeze(0.05);
    audio.hurt();
    pushLog(why, "world");
    if (next <= 0) this.end("collapse");
  }

  end(kind: Ending) {
    if (this.ended) return;
    this.ended = true;
    if (document.pointerLockElement) document.exitPointerLock();
    this.save.ending = kind;
    this.save.bestEnding = kind;
    this.persist();
    useGame.setState({ phase: "ending", ending: kind });
    if (kind === "stabilize") pushLog("Projection held. The engine sleeps.", "engine");
    if (kind === "collapse") pushLog("The slice tore. You are a rumour.", "engine");
    if (kind === "ascend") pushLog("Your voice is now a rule. Welcome to Ω.", "engine");
  }

  updateSolids() {
    const tl = useGame.getState().timeline;
    const entropy = this.entropy;
    const queries = useGame.getState().queries;
    for (const s of this.world.solids) {
      if (s.track !== undefined) s.active = s.track === tl;
      if (s.quantumId) s.active = this.collapsed.has(s.quantumId);
      if (s.mindHigh) s.active = entropy > 0.32;
      if (s.mindLow) s.active = entropy <= 0.28;
      if (s.metaOpen) s.active = queries < 2;
    }
    for (const t of this.world.tesseracts) {
      if (t.userData.track !== undefined) t.visible = t.userData.track === tl && !t.userData.taken;
    }
    for (const g of this.world.quantumGhosts) {
      const id = g.userData.quantumId as string;
      const mat = g.material as THREE.MeshStandardMaterial;
      if (this.collapsed.has(id)) {
        mat.opacity = 0.92;
        mat.emissiveIntensity = 0.8;
        mat.transparent = false;
      } else {
        mat.opacity = 0.22;
        mat.transparent = true;
        mat.depthWrite = false;
      }
    }
  }

  stepPlayer(dt: number, act: ReturnType<Input["poll"]>) {
    const look = this.input.consumeLook();
    const sens = 0.0022 * this.settings.sensitivity;
    this.yaw -= look.x * sens;
    const inv = this.settings.invertY ? -1 : 1;
    this.pitch -= look.y * sens * inv;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));

    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    this.look.set(
      fx * Math.cos(this.pitch),
      Math.sin(this.pitch),
      fz * Math.cos(this.pitch),
    );

    const wishX = fx * act.moveY + rx * act.moveX;
    const wishZ = fz * act.moveY + rz * act.moveX;
    const target = (act.sprint ? SPRINT : WALK) * (act.reverse ? 0.55 : 1);
    const accel = this.grounded ? 18 : 6;
    const vx = wishX * target;
    const vz = wishZ * target;
    this.vel.x += (vx - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (vz - this.vel.z) * Math.min(1, accel * dt);
    if (!this.grounded) this.vel.y -= GRAVITY * dt;
    if (act.jumpPressed && this.grounded) {
      this.vel.y = JUMP;
      this.grounded = false;
      audio.land();
    }

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    collideXZ(this.pos, RADIUS, HEIGHT, this.world.solids);

    this.pos.y += this.vel.y * dt;
    if (this.vel.y > 0 && headBump(this.pos, RADIUS, HEIGHT, this.world.solids)) {
      this.vel.y = 0;
    }
    const g = groundY(this.pos, RADIUS, this.world.solids);
    if (this.vel.y <= 0 && g.hit && this.pos.y <= g.y + 0.02) {
      if (!this.grounded && this.vel.y < -4) {
        audio.land();
        this.juice.addTrauma(0.12);
        this.juice.punch(2);
      }
      this.pos.y = g.y;
      this.vel.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.pos.y < -6) {
      this.hurt(14, "The well took a moment of you.");
      this.pos.x = this.checkpoint.x;
      this.pos.y = this.checkpoint.y;
      this.pos.z = this.checkpoint.z;
      this.yaw = this.checkpointYaw;
      this.vel.x = this.vel.y = this.vel.z = 0;
    }

    const lookRate = Math.hypot(look.x, look.y) * 0.02 + Math.hypot(act.moveX, act.moveY) * 0.15;
    const targetE = act.focus ? 0.08 : THREE.MathUtils.clamp(lookRate, 0, 1);
    const leak = act.focus && this.spend(8 * dt) ? 1.6 : 0.7;
    this.entropy += (targetE - this.entropy) * (1 - Math.exp(-leak * dt));
    this.entropy = THREE.MathUtils.clamp(this.entropy, 0.02, 1);

    if (this.grounded && this.speed > 1.2) {
      this.footClock += dt * (this.speed * 1.4);
      if (this.footClock > 0.42) {
        this.footClock = 0;
        audio.footstep();
      }
      this.bob += dt * this.speed * 1.8;
    }
  }

  stepPortals() {
    for (const p of this.world.portals) {
      if (!p.enabled) continue;
      const dx = this.pos.x - p.x;
      const dz = this.pos.z - p.z;
      const side = Math.sign(dx * p.nx + dz * p.nz) || 1;
      const along = Math.abs(-dx * p.nz + dz * p.nx);
      const dist = dx * p.nx + dz * p.nz;
      if (along < p.width / 2 && Math.abs(this.pos.y - (p.y - 1.2)) < p.height && Math.abs(dist) < 0.55) {
        if (p.lastSide !== 0 && side !== p.lastSide) {
          this.pos.x = p.dest.x;
          this.pos.y = p.dest.y;
          this.pos.z = p.dest.z;
          this.yaw = p.dest.yaw;
          this.vel.x = this.vel.z = 0;
          audio.portal();
          this.juice.addFlash(0.25);
          this.juice.addTrauma(0.2);
          pushLog(p.id === "hyper-in" ? "Σ — interior metric disagrees with the door." : "Chart closed.", "world");
        }
      }
      p.lastSide = Math.abs(dist) < 1.2 && along < p.width ? side : 0;
    }
  }

  stepTime(dt: number, act: ReturnType<Input["poll"]>) {
    if (act.timeline !== null) {
      const from = useGame.getState().timeline;
      if (act.timeline !== from) {
        if (act.reverse) this.hurt(8, "Paradox: reverse engaged during track jump.");
        useGame.setState({ timeline: act.timeline as 0 | 1 | 2 });
        audio.tick();
        this.juice.addFlash(0.12);
        const names = ["Past", "Present", "Future"];
        pushLog(`Τ track ${names[act.timeline]}.`, "world");
      }
    }

    // Time-mass cube patrol on future track
    this.cubeT += dt;
    const reversing = act.reverse && useGame.getState().timeline === 2;
    if (reversing) {
      if (this.world.cube.history.length > 1 && this.spend(10 * dt)) {
        const h = this.world.cube.history.pop()!;
        this.world.cube.mesh.position.set(h.x, h.y, h.z);
        audio.reverse();
      }
    } else if (useGame.getState().timeline === 2) {
      const ox = this.cubeOrigin.x + Math.sin(this.cubeT * 0.6) * 1.8;
      const oz = this.cubeOrigin.z + Math.cos(this.cubeT * 0.6) * 0.4;
      this.world.cube.mesh.position.set(ox, this.cubeOrigin.y, oz);
      this.world.cube.history.push({ x: ox, y: this.cubeOrigin.y, z: oz });
      if (this.world.cube.history.length > HISTORY) this.world.cube.history.shift();
    }
    const cp = this.world.cube.mesh.position;
    const c = this.world.cube.collider;
    c.minX = cp.x - 0.7;
    c.maxX = cp.x + 0.7;
    c.minZ = cp.z - 0.7;
    c.maxZ = cp.z + 0.7;
    useGame.setState({ reversing });
  }

  stepInteract(act: ReturnType<Input["poll"]>) {
    const g = useGame.getState();
    let prompt: { label: string; detail: string } | null = null;

    for (const p of this.world.pickups) {
      if (p.taken) continue;
      if (p.id === "time" && g.timeline !== 2) continue;
      const d = Math.hypot(this.pos.x - p.x, this.pos.z - p.z);
      if (d < 1.5 && Math.abs(this.pos.y + 0.8 - p.y) < 2.2) {
        prompt = { label: "Collect", detail: p.name };
        if (act.observePressed || d < 0.85) this.takePickup(p.id as AxisId, p);
      }
    }

    for (const it of this.world.interacts) {
      const d = Math.hypot(this.pos.x - it.x, this.pos.z - it.z);
      if (d > it.radius) continue;
      const lookOk = this.lookingAt(it.x, it.y, it.z, it.radius + 1.4, 0.35);
      if (!lookOk && d > 1.2) continue;
      prompt = { label: it.kind === "quantum" ? "Observe" : "Interact", detail: it.label };

      if (it.kind === "quantum") {
        const ghost = this.world.quantumGhosts.find((m) => m.userData.quantumId === it.id);
        if (ghost && !this.collapsed.has(it.id)) {
          const mat = ghost.material as THREE.MeshStandardMaterial;
          mat.opacity = 0.5;
          mat.emissiveIntensity = 0.9;
        }
        if (act.observePressed) this.collapseQuantum(it.id);
      }

      if (!act.observePressed && it.kind !== "quantum") continue;
      if (it.id === "archivist") this.talkArchivist();
      if (it.id.startsWith("chorus-")) this.talkChorus(Number(it.id.slice(7)));
      if (it.kind === "pedestal") this.attune(it.id.replace("pedestal-", "") as AxisId);
      if (it.kind === "query" && act.observePressed) this.queryEngine();
    }

    if (act.queryPressed) this.queryEngine();
    useGame.setState({ prompt });
  }

  takePickup(id: AxisId, p: { taken: boolean }) {
    if (useGame.getState().keys[id]) return;
    p.taken = true;
    for (const t of this.world.tesseracts) {
      if (t.userData.pickup === id) {
        t.visible = false;
        t.userData.taken = true;
      }
    }
    const keys = { ...useGame.getState().keys, [id]: true };
    useGame.setState({ keys, cognition: useGame.getState().cognition + 12 });
    this.save.keys = keys;
    audio.pickup();
    this.juice.addFlash(0.4);
    this.juice.addTrauma(0.3);
    this.juice.punch(6);
    const axis = AXES.find((a) => a.id === id);
    pushLog(`Key ${axis?.glyph} ${axis?.name} seated in the projection.`, "world");
    const n = keyCount(keys);
    if (n >= 5) {
      pushLog("Five sockets filled. Return to the core. Attune.", "engine");
    }
    this.persist();
  }

  collapseQuantum(id: string) {
    if (this.collapsed.has(id)) return;
    this.collapsed.add(id);
    audio.observe();
    this.juice.addFlash(0.2);
    if (id !== "q-long") {
      this.hurt(10, "A short truth tried to bear weight. It did not.");
      // keep it collapsed so they see the mistake, they can still walk the long one if they collapse it too
    } else {
      pushLog("Ψ collapsed to the longest eigenstate.", "world");
      useGame.setState({ cognition: useGame.getState().cognition + 6 });
    }
  }

  talkArchivist() {
    const g = useGame.getState();
    const layer = g.queries >= 5 ? "afraid" : g.queries >= 2 ? "ironic" : "archival";
    const lines = ARCHIVIST.layers[layer];
    const line = lines[this.archivistI % lines.length]!;
    this.archivistI++;
    pushLog(`${ARCHIVIST.name}: ${line}`, "npc");
    audio.query();
  }

  talkChorus(i: number) {
    this.chorusBias = i;
    const pack = i === 0 ? CHORUS.dissent : i === 1 ? CHORUS.harmony : CHORUS.hunger;
    pushLog(`${CHORUS.name}: ${pick(this.streams.mind, pack)}`, "npc");
    if (i === 1) this.entropy = Math.max(0.08, this.entropy - 0.18);
    if (i === 2) this.entropy = Math.min(1, this.entropy + 0.12);
    audio.query();
  }

  queryEngine() {
    if (!this.spend(4)) {
      pushLog("Cognition too thin to be heard.", "engine");
      return;
    }
    const q = useGame.getState().queries + 1;
    const line = ENGINE_LINES[Math.min(q, ENGINE_LINES.length) - 1] ?? pick(this.streams.meta, ENGINE_LINES);
    useGame.setState({ queries: q });
    this.save.queries = q;
    pushLog(line, "engine");
    audio.query();
    this.juice.addFlash(0.1);
    if (q >= 2) {
      pushLog("A wall in Ω forgot it was a wall.", "world");
    }
    if (q >= 4) {
      useGame.setState({ hudRewrite: "Do not collect anything. Leave." });
      pushLog("HUD rewrite engaged. Codex remains honest.", "engine");
    }
    if (q >= 5) {
      useGame.setState({ metaAlert: "Ascend path armed. Reverse the ritual." });
    }
  }

  attune(axis: AxisId) {
    const g = useGame.getState();
    if (!g.keys[axis]) {
      pushLog("The socket is empty.", "world");
      return;
    }
    if (g.attuned.includes(axis)) {
      pushLog("Already attuned.", "world");
      return;
    }
    if (keyCount(g.keys) < 5) {
      pushLog("The core wants five voices, not one.", "engine");
      return;
    }
    const next = [...g.attuned, axis];
    useGame.setState({ attuned: next });
    audio.attune();
    this.juice.addFlash(0.3);
    this.ritualFlash = 1;
    pushLog(`Attuned ${AXES.find((a) => a.id === axis)?.glyph}.`, "world");
    this.checkRitual(next);
  }

  checkRitual(attuned: AxisId[]) {
    if (attuned.length < 5) return;
    const order = attuned.join(",");
    if (order === "space,time,state,mind,meta") this.end("stabilize");
    else if (order === "meta,mind,state,time,space" && useGame.getState().queries >= 5) this.end("ascend");
    else {
      pushLog("Wrong order. The core resets the sequence. Clockwise from Space — or the other way, if you have asked enough.", "engine");
      useGame.setState({ attuned: [] });
      this.hurt(6, "Misattunement shock.");
    }
  }

  stepAnomalies(dt: number) {
    const loc = this.currentChamber();
    if (typeof loc === "string" && loc !== "atrium" && loc !== "hyper") {
      this.chamberTime[loc] = (this.chamberTime[loc] ?? 0) + dt;
      const held = useGame.getState().keys[loc];
      if (!held && this.chamberTime[loc]! > 75 && !this.hintAt[loc]) {
        this.hintAt[loc] = this.time;
        pushLog(HINTS[loc] ?? "Ask me with R.", "engine");
      }
    }
    this.acc += dt;
    if (this.acc > 42 && this.world.anomalies.filter((a) => a.alive).length < 3 && this.entropy > 0.2) {
      this.acc = 0;
      const a = AXES[Math.floor(this.streams.anomaly() * 5)]!;
      const fr = this.world.frames.find((f) => f.id === a.id)!;
      const p = fr.toWorld((this.streams.anomaly() - 0.5) * 8, 1.4, (this.streams.anomaly() - 0.5) * 8);
      const kinds = ["echo", "whisper", "paradox", "drift"] as const;
      this.world.anomalies.push({
        id: `an-${this.time}`,
        x: p.x,
        y: p.y,
        z: p.z,
        kind: kinds[Math.floor(this.streams.anomaly() * 4)]!,
        alive: true,
        age: 0,
      });
      pushLog("A dimensional anomaly condensed nearby.", "world");
    }
    for (const an of this.world.anomalies) {
      if (!an.alive) continue;
      an.age += dt;
      if (Math.hypot(this.pos.x - an.x, this.pos.z - an.z) < 1.1) {
        an.alive = false;
        useGame.setState({
          anomalies: useGame.getState().anomalies + 1,
          cognition: useGame.getState().cognition + (an.kind === "paradox" ? 4 : 8),
        });
        if (an.kind === "paradox") this.hurt(6, "Paradox anomaly: you were warned.");
        else pushLog(`Anomaly (${an.kind}) absorbed.`, "world");
        audio.pickup();
      }
    }
  }

  regen(dt: number) {
    const band = this.entropy > 0.14 && this.entropy < 0.42 ? 3.2 : 1.1;
    const g = useGame.getState();
    useGame.setState({ cognition: Math.min(100, g.cognition + band * dt) });
    if (this.entropy > 0.78) {
      this.entropyHurt = (this.entropyHurt ?? 0) + dt;
      if (this.entropyHurt > 2.5) {
        this.entropyHurt = 0;
        this.hurt(4, "Decision entropy tearing the slice.");
      }
    } else this.entropyHurt = 0;
  }
  entropyHurt = 0;

  applyCamera(dt: number) {
    const phase = useGame.getState().phase;
    this.camera.rotation.order = "YXZ";
    if (phase === "title" || phase === "ending") {
      const t = this.time;
      const r = phase === "ending" ? 16 : 13.5;
      this.camera.position.set(Math.sin(t * 0.18) * r, 5.4, Math.cos(t * 0.18) * r);
      this.camera.lookAt(0, 1.8, 0);
      return;
    }
    const bobY = this.juice.reduced ? 0 : Math.sin(this.bob) * 0.035 * (this.grounded ? 1 : 0.2);
    this.camera.position.set(this.pos.x, this.pos.y + EYE + bobY, this.pos.z);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    const sh = this.juice.shakeOffset(this.time);
    this.camera.position.x += sh.x;
    this.camera.position.y += sh.y;
    this.camera.rotation.z = sh.roll;
    const fov = 72 + (this.speed > 6 ? 4 : 0) + this.juice.fovPunch;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, fov, 1 - Math.exp(-8 * dt));
    this.camera.updateProjectionMatrix();
  }

  locationName() {
    const c = this.currentChamber();
    if (c === "atrium") return "Atrium of Five Axes";
    if (c === "hyper") return "Hyper-room (λ_in ≠ λ_out)";
    const a = AXES.find((x) => x.id === c)!;
    return `${a.name} chart · ${a.glyph}`;
  }

  objectiveText() {
    const g = useGame.getState();
    if (g.hudRewrite && g.queries >= 4 && keyCount(g.keys) < 5) return g.hudRewrite;
    const n = keyCount(g.keys);
    if (n < 5) return `Recover the five Axis Keys  ·  ${n}/5`;
    if (g.attuned.length < 5) return `Attune the core clockwise from Space  ·  ${g.attuned.length}/5`;
    return "Hold the projection.";
  }

  syncHud(force = false) {
    this.hudClock += force ? 1 : 0;
    const loc = this.locationName();
    if (loc !== this.location) {
      this.location = loc;
      const c = this.currentChamber();
      if (c !== "atrium" && c !== "hyper") {
        this.checkpoint = { ...this.pos, y: Math.max(0, this.pos.y) };
        this.checkpointYaw = this.yaw;
      }
    }
    useGame.setState({
      location: loc,
      objective: this.objectiveText(),
      entropy: this.entropy,
      flash: this.juice.flash,
      reversing: useGame.getState().reversing,
      playtime: this.save.playtime + this.time * 0,
    });
  }

  fixedUpdate(dt: number) {
    const phase = useGame.getState().phase;
    const act = this.input.poll();

    if (phase === "playing") {
      if (act.pausePressed) {
        this.pause();
        return;
      }
      if (act.codexPressed) {
        this.openCodex();
        return;
      }
      this.stepPlayer(dt, act);
      this.stepPortals();
      this.stepTime(dt, act);
      this.updateSolids();
      this.stepInteract(act);
      this.stepAnomalies(dt);
      this.regen(dt);
      if (this.currentChamber() !== "atrium") {
        const id = this.currentChamber();
        if (id !== "hyper" && !this.hintAt[`enter-${id}`]) {
          this.hintAt[`enter-${id}`] = 1;
          const names: Record<string, string> = {
            space: "Σ — climb. The small door is a liar about size.",
            time: "Τ — 1 past, 2 present, 3 future. Q rewinds mass.",
            state: "Ψ — look, then E. Longest truth.",
            mind: "Μ — hold F. Stop turning.",
            meta: "Ω — ask with R.",
          };
          pushLog(names[id] ?? "", "engine");
        }
      }
    } else {
      if (phase === "paused" && act.pausePressed) this.resume();
      if (phase === "codex" && (act.codexPressed || act.pausePressed)) {
        useGame.setState({ phase: "playing" });
        this.requestLock();
      }
    }
  }

  render(dt: number) {
    this.time += dt;
    this.juice.update(dt);
    for (const t of this.world.tesseracts) {
      const speed = t.userData.pickup ? 1.4 : 1;
      t.userData.t = (t.userData.t ?? 0) + dt * speed;
      updateTesseract(t, t.userData.t as number);
      if (t.userData.pickup && t.visible) {
        t.position.y += Math.sin(this.time * 2.4) * 0.002;
      }
    }
    const mp = this.world.motes.geometry.attributes.position;
    const arr = mp.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] = arr[i + 1]! + Math.sin(this.time * 0.4 + i) * 0.002;
    }
    mp.needsUpdate = true;
    this.world.motes.rotation.y = this.time * 0.01;

    // Drift: slight fog density with unused axes + entropy
    const drift = (5 - keyCount(useGame.getState().keys)) * 0.04 + this.entropy * 0.08;
    if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = 14 - drift * 8;
      this.scene.fog.far = 62 - drift * 18;
    }

    this.applyCamera(dt);
    this.hudClock += dt;
    if (this.hudClock > 0.12) {
      this.hudClock = 0;
      this.save.playtime += 0.12;
      this.syncHud();
    }
  }

  dispose() {
    this.input.detach();
    this.persist();
    this.world.dispose();
    audio.stopDrones();
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
      getPosition: () => { x: number; y: number; z: number };
      getPitch: () => number;
    };
    __pentaxis?: Engine;
  }
}
