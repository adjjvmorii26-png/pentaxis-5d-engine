import type { Collider } from "../core/types";

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

export function collideXZ(
  pos: { x: number; y: number; z: number },
  radius: number,
  height: number,
  solids: Collider[],
) {
  const y0 = pos.y + 0.08;
  const y1 = pos.y + height;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i]!;
    if (!s.active || s.kind === "floor") continue;
    if (y1 < s.minY || y0 > s.maxY) continue;
    const insideX = pos.x > s.minX && pos.x < s.maxX;
    const insideZ = pos.z > s.minZ && pos.z < s.maxZ;
    if (insideX && insideZ) {
      const dl = pos.x - s.minX + radius;
      const dr = s.maxX - pos.x + radius;
      const db = pos.z - s.minZ + radius;
      const df = s.maxZ - pos.z + radius;
      const m = Math.min(dl, dr, db, df);
      if (m === dl) pos.x = s.minX - radius;
      else if (m === dr) pos.x = s.maxX + radius;
      else if (m === db) pos.z = s.minZ - radius;
      else pos.z = s.maxZ + radius;
      continue;
    }
    const cx = clamp(pos.x, s.minX, s.maxX);
    const cz = clamp(pos.z, s.minZ, s.maxZ);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius && d2 > 1e-8) {
      const d = Math.sqrt(d2);
      const f = (radius - d) / d;
      pos.x += dx * f;
      pos.z += dz * f;
    }
  }
}

export function groundY(
  pos: { x: number; y: number; z: number },
  radius: number,
  solids: Collider[],
  maxStep = 0.5,
): { hit: boolean; y: number } {
  let best = -Infinity;
  let hit = false;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i]!;
    if (!s.active || s.kind === "wall") continue;
    const cx = clamp(pos.x, s.minX, s.maxX);
    const cz = clamp(pos.z, s.minZ, s.maxZ);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    if (dx * dx + dz * dz >= radius * radius) continue;
    const top = s.maxY;
    if (top <= pos.y + maxStep && top > pos.y - 0.85 && top > best) {
      best = top;
      hit = true;
    }
  }
  return { hit, y: best };
}

export function headBump(
  pos: { x: number; y: number; z: number },
  radius: number,
  height: number,
  solids: Collider[],
): boolean {
  const head = pos.y + height;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i]!;
    if (!s.active || s.kind === "floor") continue;
    if (head < s.minY || pos.y + height * 0.5 > s.maxY) continue;
    const cx = clamp(pos.x, s.minX, s.maxX);
    const cz = clamp(pos.z, s.minZ, s.maxZ);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    if (dx * dx + dz * dz >= radius * radius) continue;
    if (head > s.minY && pos.y < s.minY) return true;
  }
  return false;
}
