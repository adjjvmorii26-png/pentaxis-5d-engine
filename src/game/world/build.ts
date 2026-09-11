import * as THREE from "three";
import { AXES, aabb, type Anomaly, type Collider, type Interactable, type Pickup, type Portal } from "../core/types";
import { makeStreams, randRange, type Rng } from "../core/rng";

export const ATRIUM_R = 12;
export const CORRIDOR_LEN = 9;
export const CHAMBER = 14;
export const CHAMBER_DIST = ATRIUM_R + CORRIDOR_LEN + CHAMBER / 2;

export type ChamberFrame = {
  id: (typeof AXES)[number]["id"];
  angle: number;
  ox: number;
  oz: number;
  rx: number;
  rz: number;
  fx: number;
  fz: number;
  toWorld: (lx: number, ly: number, lz: number) => { x: number; y: number; z: number };
};

export function chamberFrame(index: number): ChamberFrame {
  const axis = AXES[index]!;
  const angle = axis.angle;
  const ox = Math.cos(angle) * CHAMBER_DIST;
  const oz = Math.sin(angle) * CHAMBER_DIST;
  const rx = -Math.sin(angle);
  const rz = Math.cos(angle);
  const fx = Math.cos(angle);
  const fz = Math.sin(angle);
  return {
    id: axis.id,
    angle,
    ox,
    oz,
    rx,
    rz,
    fx,
    fz,
    toWorld: (lx, ly, lz) => ({
      x: ox + rx * lx + fx * lz,
      y: ly,
      z: oz + rz * lx + fz * lz,
    }),
  };
}

export function makeGridTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0c0d11";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(158,180,200,0.07)";
  g.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(512, i);
    g.stroke();
  }
  g.strokeStyle = "rgba(158,180,200,0.16)";
  for (let i = 0; i <= 512; i += 128) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(512, i);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeLabelTexture(text: string, color = "#eceae4") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#111318";
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "rgba(158,180,200,0.35)";
  g.strokeRect(12, 12, 488, 232);
  g.fillStyle = color;
  g.font = "600 36px Syne, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const lines = text.split("\n");
  lines.forEach((ln, i) => {
    g.fillText(ln, 256, 128 + (i - (lines.length - 1) / 2) * 44);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createTesseract(size = 1.35, color = 0x9eb4c8) {
  const verts4: number[][] = [];
  for (let i = 0; i < 16; i++) {
    verts4.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    for (let b = 0; b < 4; b++) {
      const j = i ^ (1 << b);
      if (j > i) edges.push([i, j]);
    }
  }
  const pos = new Float32Array(edges.length * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const line = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
  line.userData = { verts4, edges, size, t: 0 };
  return line;
}

export function updateTesseract(line: THREE.LineSegments, t: number) {
  const { verts4, edges, size } = line.userData as {
    verts4: number[][];
    edges: [number, number][];
    size: number;
  };
  const a = t * 0.37;
  const b = t * 0.23;
  const pos = line.geometry.attributes.position.array as Float32Array;
  const project = (v: number[]) => {
    const x = v[0]!;
    const y = v[1]!;
    const z = v[2]!;
    const w = v[3]!;
    const x1 = x * Math.cos(a) - w * Math.sin(a);
    const w1 = x * Math.sin(a) + w * Math.cos(a);
    const y1 = y * Math.cos(b) - w1 * Math.sin(b);
    const w2 = y * Math.sin(b) + w1 * Math.cos(b);
    const p = 2 / (3 + w2 * 0.45);
    return [x1 * p * size, y1 * p * size, z * p * size];
  };
  let k = 0;
  for (const [i, j] of edges) {
    const p = project(verts4[i]!);
    const q = project(verts4[j]!);
    pos[k++] = p[0]!;
    pos[k++] = p[1]!;
    pos[k++] = p[2]!;
    pos[k++] = q[0]!;
    pos[k++] = q[1]!;
    pos[k++] = q[2]!;
  }
  line.geometry.attributes.position.needsUpdate = true;
}

export type World = {
  solids: Collider[];
  portals: Portal[];
  pickups: Pickup[];
  interacts: Interactable[];
  anomalies: Anomaly[];
  meshes: THREE.Object3D[];
  tesseracts: THREE.LineSegments[];
  motes: THREE.Points;
  quantumGhosts: THREE.Mesh[];
  timeMeshes: THREE.Object3D[];
  mindWall: Collider | null;
  mindPath: Collider | null;
  metaWall: Collider | null;
  signs: { mesh: THREE.Mesh; a: string; b: string }[];
  cube: { mesh: THREE.Mesh; collider: Collider; history: { x: number; y: number; z: number }[] };
  frames: ChamberFrame[];
  pedestals: { axis: (typeof AXES)[number]["id"]; x: number; y: number; z: number }[];
  materials: Record<string, THREE.Material>;
  dispose: () => void;
};

function addMesh(
  scene: THREE.Scene,
  world: World,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  scene.add(m);
  world.meshes.push(m);
  return m;
}

export function buildWorld(scene: THREE.Scene, seed: string): World {
  const streams = makeStreams(seed);
  const grid = makeGridTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x14161c,
    roughness: 0.92,
    metalness: 0.04,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x101218,
    roughness: 0.96,
    metalness: 0.02,
    map: grid,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1c222c,
    roughness: 0.5,
    metalness: 0.2,
    emissive: 0x0a1218,
    emissiveIntensity: 0.4,
  });
  const glowMats = AXES.map(
    (a) =>
      new THREE.MeshStandardMaterial({
        color: a.color,
        emissive: a.color,
        emissiveIntensity: 0.7,
        roughness: 0.35,
        metalness: 0.1,
      }),
  );

  const box = new THREE.BoxGeometry(1, 1, 1);
  const world: World = {
    solids: [],
    portals: [],
    pickups: [],
    interacts: [],
    anomalies: [],
    meshes: [],
    tesseracts: [],
    motes: null as unknown as THREE.Points,
    quantumGhosts: [],
    timeMeshes: [],
    mindWall: null,
    mindPath: null,
    metaWall: null,
    signs: [],
    cube: null as unknown as World["cube"],
    frames: AXES.map((_, i) => chamberFrame(i)),
    pedestals: [],
    materials: { wall: wallMat, floor: floorMat, trim: trimMat },
    dispose() {
      grid.dispose();
      box.dispose();
      wallMat.dispose();
      floorMat.dispose();
      trimMat.dispose();
      for (const m of glowMats) m.dispose();
    },
  };

  const putBox = (
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
    mat: THREE.Material,
    kind: Collider["kind"],
    tag = "",
  ) => {
    const mesh = addMesh(scene, world, box, mat, cx, cy, cz);
    mesh.scale.set(sx, sy, sz);
    const col = aabb(cx, cy, cz, sx, sy, sz, kind, tag);
    world.solids.push(col);
    return { mesh, col };
  };

  // Atrium floor
  putBox(0, -0.2, 0, 28, 0.4, 28, floorMat, "floor", "atrium-floor");
  for (const c of [
    aabb(0, 4, 52, 110, 12, 2, "wall", "bound"),
    aabb(0, 4, -52, 110, 12, 2, "wall", "bound"),
    aabb(52, 4, 0, 2, 12, 110, "wall", "bound"),
    aabb(-52, 4, 0, 2, 12, 110, "wall", "bound"),
  ]) {
    world.solids.push(c);
  }

  // Pentagon walls with gate gaps
  const wallH = 7;
  for (let i = 0; i < 5; i++) {
    const a0 = AXES[i]!.angle - Math.PI / 5;
    const a1 = AXES[i]!.angle + Math.PI / 5;
    const gateHalf = 0.22;
    const segs = [
      [0, 0.5 - gateHalf],
      [0.5 + gateHalf, 1],
    ];
    for (const [tA, tB] of segs) {
      const ta = a0 + (a1 - a0) * tA;
      const tb = a0 + (a1 - a0) * tB;
      const mx = ((Math.cos(ta) + Math.cos(tb)) / 2) * ATRIUM_R;
      const mz = ((Math.sin(ta) + Math.sin(tb)) / 2) * ATRIUM_R;
      const len = ATRIUM_R * Math.abs(tb - ta) * 1.05;
      const mesh = addMesh(scene, world, box, wallMat, mx, wallH / 2, mz);
      mesh.scale.set(len, wallH, 0.45);
      mesh.lookAt(0, wallH / 2, 0);
      // Visual only — AABB approximations of rotated pentagon walls eat the gates.
    }

    // Gate frame
    const ga = AXES[i]!.angle;
    const gx = Math.cos(ga) * (ATRIUM_R - 0.1);
    const gz = Math.sin(ga) * (ATRIUM_R - 0.1);
    const rx = -Math.sin(ga);
    const rz = Math.cos(ga);
    for (const side of [-1.7, 1.7]) {
      putBox(gx + rx * side, 2.1, gz + rz * side, 0.28, 4.2, 0.28, glowMats[i]!, "wall", "gate");
    }
    const lintel = addMesh(scene, world, box, glowMats[i]!, gx, 4.25, gz);
    lintel.scale.set(3.6, 0.18, 0.18);

    // Corridor
    const c0 = ATRIUM_R;
    const c1 = ATRIUM_R + CORRIDOR_LEN;
    const cm = (c0 + c1) / 2;
    const cx = Math.cos(ga) * cm;
    const cz = Math.sin(ga) * cm;
    const clen = CORRIDOR_LEN + 0.4;
    putBox(cx, -0.2, cz, Math.abs(Math.cos(ga)) * clen + Math.abs(Math.sin(ga)) * 3.4, 0.4, Math.abs(Math.sin(ga)) * clen + Math.abs(Math.cos(ga)) * 3.4, floorMat, "floor", "corr-floor");
    // corridor walls
    for (const side of [-1.85, 1.85]) {
      const wx = cx + rx * side;
      const wz = cz + rz * side;
      putBox(
        wx,
        2.2,
        wz,
        Math.abs(Math.cos(ga)) * clen + 0.3,
        4.4,
        Math.abs(Math.sin(ga)) * clen + 0.3,
        wallMat,
        "wall",
        "corr-wall",
      );
    }
  }

  // Center core plinth + pedestals
  putBox(0, 0.25, 0, 3.2, 0.5, 3.2, trimMat, "platform", "plinth");
  const core = createTesseract(1.5, 0x9eb4c8);
  core.position.set(0, 2.1, 0);
  scene.add(core);
  world.tesseracts.push(core);

  for (let i = 0; i < 5; i++) {
    const a = AXES[i]!.angle;
    const x = Math.cos(a) * 4.2;
    const z = Math.sin(a) * 4.2;
    putBox(x, 0.45, z, 0.7, 0.9, 0.7, glowMats[i]!, "platform", `pedestal-${AXES[i]!.id}`);
    world.pedestals.push({ axis: AXES[i]!.id, x, y: 1.1, z });
    world.interacts.push({
      id: `pedestal-${AXES[i]!.id}`,
      x,
      y: 1.1,
      z,
      radius: 1.4,
      label: `Attune ${AXES[i]!.name}`,
      kind: "pedestal",
    });
  }

  // Archivist
  const arch = createTesseract(0.45, 0xb8c4ce);
  arch.position.set(3.2, 1.4, 5.2);
  scene.add(arch);
  world.tesseracts.push(arch);
  world.interacts.push({
    id: "archivist",
    x: 3.2,
    y: 1.4,
    z: 5.2,
    radius: 2.2,
    label: "Speak with the Archivist",
    kind: "npc",
  });

  // Chambers
  world.frames.forEach((fr, i) => buildChamber(scene, world, fr, i, box, wallMat, floorMat, trimMat, glowMats[i]!, streams.world));

  // Motes
  const moteCount = 420;
  const motePos = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    const a = streams.world() * Math.PI * 2;
    const r = randRange(streams.world, 2, 38);
    motePos[i * 3] = Math.cos(a) * r;
    motePos[i * 3 + 1] = randRange(streams.world, 0.4, 9);
    motePos[i * 3 + 2] = Math.sin(a) * r;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({ color: 0x9eb4c8, size: 0.045, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  scene.add(motes);
  world.motes = motes;

  // Lights
  const hemi = new THREE.HemisphereLight(0x8aa0b4, 0x0a0c10, 0.55);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0x6c7380, 0.22);
  scene.add(amb);
  AXES.forEach((axis, i) => {
    const x = Math.cos(axis.angle) * (ATRIUM_R - 1.2);
    const z = Math.sin(axis.angle) * (ATRIUM_R - 1.2);
    const l = new THREE.PointLight(axis.color, 2.4, 16, 2);
    l.position.set(x, 3.4, z);
    scene.add(l);
  });
  const coreLight = new THREE.PointLight(0xc8d0da, 3.2, 14, 2);
  coreLight.position.set(0, 3.2, 0);
  scene.add(coreLight);

  return world;
}

function buildChamber(
  scene: THREE.Scene,
  world: World,
  fr: ChamberFrame,
  index: number,
  box: THREE.BoxGeometry,
  wallMat: THREE.Material,
  floorMat: THREE.Material,
  trimMat: THREE.Material,
  glow: THREE.Material,
  rng: Rng,
) {
  const H = 6.2;
  const S = CHAMBER;
  const half = S / 2;

  const wput = (lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, mat: THREE.Material, kind: Collider["kind"], tag: string) => {
    const p = fr.toWorld(lx, ly, lz);
    const mesh = new THREE.Mesh(box, mat);
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.y = -fr.angle + Math.PI / 2;
    scene.add(mesh);
    world.meshes.push(mesh);
    // AABB in world, conservative
    const c = aabb(p.x, p.y, p.z, sx + 0.15, sy, sz + 0.15, kind, tag);
    // expand xz by rotation
    const extX = Math.abs(fr.rx) * sx + Math.abs(fr.fx) * sz;
    const extZ = Math.abs(fr.rz) * sx + Math.abs(fr.fz) * sz;
    c.minX = p.x - extX / 2 - 0.05;
    c.maxX = p.x + extX / 2 + 0.05;
    c.minZ = p.z - extZ / 2 - 0.05;
    c.maxZ = p.z + extZ / 2 + 0.05;
    world.solids.push(c);
    return { mesh, col: c, p };
  };

  // Shell
  wput(0, -0.2, 0, S, 0.4, S, floorMat, "floor", `${fr.id}-floor`);
  wput(0, H / 2, half, S, H, 0.4, wallMat, "wall", `${fr.id}-back`);
  wput(-half, H / 2, 0, 0.4, H, S, wallMat, "wall", `${fr.id}-left`);
  wput(half, H / 2, 0, 0.4, H, S, wallMat, "wall", `${fr.id}-right`);
  // front wall with door gap (toward atrium, lz negative)
  wput(-4.2, H / 2, -half, 5.6, H, 0.4, wallMat, "wall", `${fr.id}-front-l`);
  wput(4.2, H / 2, -half, 5.6, H, 0.4, wallMat, "wall", `${fr.id}-front-r`);
  wput(0, H - 0.8, -half, 3.6, 1.6, 0.4, wallMat, "wall", `${fr.id}-front-top`);

  if (fr.id === "space") buildSpace(scene, world, fr, wput, glow, box);
  if (fr.id === "time") buildTime(scene, world, fr, wput, glow, box, trimMat);
  if (fr.id === "state") buildState(scene, world, fr, wput, glow, box);
  if (fr.id === "mind") buildMind(scene, world, fr, wput, glow, box, rng);
  if (fr.id === "meta") buildMeta(scene, world, fr, wput, glow, box);

  void index;
}

type WPut = (
  lx: number,
  ly: number,
  lz: number,
  sx: number,
  sy: number,
  sz: number,
  mat: THREE.Material,
  kind: Collider["kind"],
  tag: string,
) => { mesh: THREE.Mesh; col: Collider; p: { x: number; y: number; z: number } };

function buildSpace(scene: THREE.Scene, world: World, fr: ChamberFrame, wput: WPut, glow: THREE.Material, box: THREE.BoxGeometry) {
  // Central well (hole in floor via missing floor already full — add ring platforms)
  const well = wput(0, 1.2, 1.4, 3.2, 2.8, 3.2, glow, "wall", "well-visual");
  well.col.active = false;
  well.mesh.material = new THREE.MeshStandardMaterial({
    color: 0x07080a,
    emissive: 0x1a2833,
    emissiveIntensity: 0.5,
    roughness: 1,
  });

  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const ang = t * Math.PI * 2.2;
    const y = 0.12 + t * 6.4;
    const r = 4.3;
    const lx = Math.cos(ang) * r;
    const lz = 1.4 + Math.sin(ang) * r;
    wput(lx, y, lz, 2.1, 0.22, 1.15, glow, "platform", `helix-${i}`);
  }
  const top = fr.toWorld(0, 7.1, 5.6);
  world.pickups.push({ id: "space", x: top.x, y: top.y, z: top.z, taken: false, name: "Axis Key Σ" });
  const key = createTesseract(0.32, 0x8eb4c8);
  key.position.set(top.x, top.y + 0.4, top.z);
  scene.add(key);
  world.tesseracts.push(key);
  key.userData.pickup = "space";

  // Hyper-room far away + portal
  const door = fr.toWorld(5.2, 1.4, 0.2);
  const dest = { x: 0, y: 23, z: 8, yaw: Math.PI };
  world.portals.push({
    id: "hyper-in",
    x: door.x,
    y: 1.4,
    z: door.z,
    nx: fr.rx,
    nz: fr.rz,
    width: 1.6,
    height: 2.6,
    dest,
    enabled: true,
    lastSide: 0,
  });
  wput(5.2, 1.4, 0.2, 0.2, 2.8, 1.8, glow, "wall", "hyper-frame");
  world.solids[world.solids.length - 1]!.active = false;

  const hx = 0;
  const hy = 22;
  const hz = 0;
  const floor = aabb(hx, hy - 0.2, hz, 22, 0.4, 22, "floor", "hyper-floor");
  world.solids.push(floor);
  const hf = new THREE.Mesh(box, world.materials.floor);
  hf.position.set(hx, hy - 0.2, hz);
  hf.scale.set(22, 0.4, 22);
  scene.add(hf);
  world.meshes.push(hf);
  for (const [cx, cz, sx, sz] of [
    [hx, hz + 11, 22, 0.5],
    [hx, hz - 11, 22, 0.5],
    [hx + 11, hz, 0.5, 22],
    [hx - 11, hz, 0.5, 22],
  ] as const) {
    const col = aabb(cx, hy + 4, cz, sx, 8, sz, "wall", "hyper-wall");
    world.solids.push(col);
    const m = new THREE.Mesh(box, world.materials.wall);
    m.position.set(cx, hy + 4, cz);
    m.scale.set(sx, 8, sz);
    scene.add(m);
    world.meshes.push(m);
  }
  world.portals.push({
    id: "hyper-out",
    x: hx,
    y: hy + 1.4,
    z: hz + 10,
    nx: 0,
    nz: 1,
    width: 2.2,
    height: 3,
    dest: { x: door.x - fr.rx * 1.6, y: 0, z: door.z - fr.rz * 1.6, yaw: Math.atan2(-fr.rx, -fr.rz) },
    enabled: true,
    lastSide: 0,
  });
  const ht = createTesseract(2.4, 0x8eb4c8);
  ht.position.set(hx, hy + 4, hz);
  scene.add(ht);
  world.tesseracts.push(ht);
}

function buildTime(
  scene: THREE.Scene,
  world: World,
  fr: ChamberFrame,
  wput: WPut,
  glow: THREE.Material,
  box: THREE.BoxGeometry,
  trim: THREE.Material,
) {
  // Chasm: disable center strip of floor by covering with no-floor — add side floors and remove middle via a pit collider absence
  // Raise side ledges; cut center by adding a visual pit and NOT putting floor there — we already have full floor. Carve by adding a "pit" that we handle as no-ground: actually punch a hole by splitting floors.
  // Simpler: add a deep pit wall around a hole, and a collider-less visual. Player falls if not on bridge/ledge.
  // We'll mark the center floor inactive.
  const centerFloor = world.solids.find((s) => s.tag === "time-floor");
  if (centerFloor) centerFloor.active = false;

  wput(0, -0.2, -4.6, 13, 0.4, 4.6, world.materials.floor as THREE.Material, "floor", "time-near");
  wput(0, -0.2, 4.6, 13, 0.4, 4.6, world.materials.floor as THREE.Material, "floor", "time-far");
  // Pit visual
  wput(0, -1.6, 0, 12, 2.4, 3.4, new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 1 }), "wall", "pit-vis");
  world.solids[world.solids.length - 1]!.active = false;

  // Past bridge T0
  const bridge = wput(0, 0.05, 0, 2.2, 0.22, 4.2, glow, "platform", "bridge-past");
  bridge.col.track = 0;

  // Present side ledge T1
  const ledge = wput(5.4, 0.05, 0, 1.6, 0.22, 4.4, trim, "platform", "ledge-now");
  ledge.col.track = 1;

  // Future key
  const keyP = fr.toWorld(0, 1.2, 5.1);
  world.pickups.push({ id: "time", x: keyP.x, y: keyP.y, z: keyP.z, taken: false, name: "Axis Key Τ" });
  const key = createTesseract(0.32, 0xb8a890);
  key.position.set(keyP.x, keyP.y + 0.35, keyP.z);
  scene.add(key);
  world.tesseracts.push(key);
  key.userData.pickup = "time";
  key.userData.track = 2;

  // Time-mass cube on far side
  const cubeP = fr.toWorld(0.8, 0.7, 4.8);
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0xb8a890,
    emissive: 0x3a3228,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0.2,
  });
  const cubeMesh = new THREE.Mesh(box, cubeMat);
  cubeMesh.position.set(cubeP.x, cubeP.y, cubeP.z);
  cubeMesh.scale.set(1.4, 1.4, 1.4);
  scene.add(cubeMesh);
  world.meshes.push(cubeMesh);
  const cubeCol = aabb(cubeP.x, cubeP.y, cubeP.z, 1.4, 1.4, 1.4, "wall", "time-mass");
  cubeCol.track = 2;
  world.solids.push(cubeCol);
  world.cube = { mesh: cubeMesh, collider: cubeCol, history: [] };
}

function buildState(scene: THREE.Scene, world: World, fr: ChamberFrame, wput: WPut, glow: THREE.Material, box: THREE.BoxGeometry) {
  const centerFloor = world.solids.find((s) => s.tag === "state-floor");
  if (centerFloor) centerFloor.active = false;
  wput(0, -0.2, -4.8, 13, 0.4, 4.2, world.materials.floor as THREE.Material, "floor", "state-near");
  wput(0, -0.2, 5.0, 13, 0.4, 3.8, world.materials.floor as THREE.Material, "floor", "state-far");
  wput(0, -1.6, 0.2, 12, 2.4, 4.6, new THREE.MeshStandardMaterial({ color: 0x050608 }), "wall", "state-pit");
  world.solids[world.solids.length - 1]!.active = false;

  const ghosts = [
    { lx: -2.4, len: 3.2, id: "q-short" },
    { lx: 0, len: 8.4, id: "q-long" },
    { lx: 2.4, len: 4.4, id: "q-mid" },
  ];
  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0x7da8a0,
    emissive: 0x7da8a0,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  for (const g of ghosts) {
    const { mesh, col, p } = wput(g.lx, 0.08, 0.3, 1.5, 0.16, g.len, ghostMat, "platform", g.id);
    col.active = false;
    col.quantumId = g.id;
    mesh.userData.quantumId = g.id;
    mesh.userData.baseOpacity = 0.28;
    world.quantumGhosts.push(mesh);
    world.interacts.push({
      id: g.id,
      x: p.x,
      y: p.y + 0.4,
      z: p.z,
      radius: 2.8,
      label: "Observe superposition",
      kind: "quantum",
    });
  }
  void box;
  void glow;

  const keyP = fr.toWorld(0, 1.15, 5.4);
  world.pickups.push({ id: "state", x: keyP.x, y: keyP.y, z: keyP.z, taken: false, name: "Axis Key Ψ" });
  const key = createTesseract(0.32, 0x7da8a0);
  key.position.set(keyP.x, keyP.y + 0.35, keyP.z);
  scene.add(key);
  world.tesseracts.push(key);
  key.userData.pickup = "state";
}

function buildMind(
  scene: THREE.Scene,
  world: World,
  fr: ChamberFrame,
  wput: WPut,
  glow: THREE.Material,
  box: THREE.BoxGeometry,
  rng: Rng,
) {
  const wall = wput(0, 2.2, 1.2, 10.5, 4.4, 0.45, world.materials.wall as THREE.Material, "wall", "mind-gate");
  wall.col.mindHigh = true;
  world.mindWall = wall.col;

  const path = wput(0, 0.08, 1.2, 2.2, 0.18, 3.2, glow, "platform", "mind-path");
  path.col.mindLow = true;
  path.col.active = false;
  world.mindPath = path.col;

  const chorusY = 1.6;
  const positions = [
    fr.toWorld(-1.6, chorusY, 4.8),
    fr.toWorld(0, chorusY + 0.3, 5.2),
    fr.toWorld(1.6, chorusY, 4.8),
  ];
  const colors = [0xb09098, 0xc8ccd4, 0x8a7078];
  positions.forEach((p, i) => {
    const sph = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 12),
      new THREE.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: 0.55 }),
    );
    sph.position.set(p.x, p.y, p.z);
    scene.add(sph);
    world.meshes.push(sph);
    world.interacts.push({
      id: `chorus-${i}`,
      x: p.x,
      y: p.y,
      z: p.z,
      radius: 1.8,
      label: "Listen to a voice",
      kind: "npc",
    });
  });

  const keyP = fr.toWorld(0, 1.2, 5.6);
  world.pickups.push({ id: "mind", x: keyP.x, y: keyP.y, z: keyP.z, taken: false, name: "Axis Key Μ" });
  const key = createTesseract(0.32, 0xb09098);
  key.position.set(keyP.x, keyP.y + 0.35, keyP.z);
  scene.add(key);
  world.tesseracts.push(key);
  key.userData.pickup = "mind";
  void box;
  void rng;
}

function buildMeta(scene: THREE.Scene, world: World, fr: ChamberFrame, wput: WPut, glow: THREE.Material, box: THREE.BoxGeometry) {
  const labels = ["TRUE", "EXIT", "OBEY", "FALSE"];
  const spots: [number, number][] = [
    [-4.5, 2],
    [4.5, 2],
    [-2.2, 5.4],
    [2.2, 5.4],
  ];
  spots.forEach((s, i) => {
    const { p } = wput(s[0], 2.2, s[1], 0.2, 3.2, 2.4, world.materials.wall as THREE.Material, "wall", `meta-door-${i}`);
    const tex = makeLabelTexture(labels[i]!);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.9),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    sign.position.set(p.x + fr.fx * 0.25, 2.4, p.z + fr.fz * 0.25);
    sign.lookAt(fr.ox, 2.4, fr.oz);
    scene.add(sign);
    world.meshes.push(sign);
    world.signs.push({ mesh: sign, a: labels[i]!, b: i === 0 ? "BAIT" : i === 1 ? "LOOP" : i === 2 ? "NO" : "PIT" });
  });

  // Secret wall at back-left — opens after queries
  const secret = wput(-5.6, 2.2, -0.4, 0.4, 4.4, 4.8, world.materials.wall as THREE.Material, "wall", "meta-secret");
  secret.col.metaOpen = true;
  world.metaWall = secret.col;

  const keyP = fr.toWorld(-5.6, 1.2, -0.4);
  world.pickups.push({ id: "meta", x: keyP.x, y: keyP.y, z: keyP.z, taken: false, name: "Axis Key Ω" });
  const key = createTesseract(0.32, 0xc8ccd4);
  key.position.set(keyP.x, keyP.y + 0.35, keyP.z);
  scene.add(key);
  world.tesseracts.push(key);
  key.userData.pickup = "meta";

  world.interacts.push({
    id: "meta-query-plinth",
    x: fr.toWorld(0, 1, 0).x,
    y: 1,
    z: fr.toWorld(0, 1, 0).z,
    radius: 2.4,
    label: "The engine is here",
    kind: "query",
  });
  wput(0, 0.4, 0, 1.4, 0.8, 1.4, glow, "platform", "meta-plinth");
  void box;
}
