import type { Box } from "./level";

/**
 * Push a circle of `radius` at (x,z) out of an axis-aligned box.
 * Returns the corrected position. Resolves along the shallowest axis.
 */
export function resolveCircleBox(
  x: number,
  z: number,
  radius: number,
  box: Box,
): { x: number; z: number } {
  const halfW = box.w / 2 + radius;
  const halfD = box.d / 2 + radius;
  const dx = x - box.x;
  const dz = z - box.z;
  if (Math.abs(dx) >= halfW || Math.abs(dz) >= halfD) return { x, z };
  // Inside the inflated box — eject along the axis of least penetration.
  const penX = halfW - Math.abs(dx);
  const penZ = halfD - Math.abs(dz);
  if (penX < penZ) {
    return { x: box.x + Math.sign(dx || 1) * halfW, z };
  }
  return { x, z: box.z + Math.sign(dz || 1) * halfD };
}

export function collideBoxes(
  x: number,
  z: number,
  radius: number,
  boxes: Box[],
): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (const box of boxes) {
    const r = resolveCircleBox(px, pz, radius, box);
    px = r.x;
    pz = r.z;
  }
  return { x: px, z: pz };
}

/** Does the segment (ax,az)->(bx,bz) intersect the axis-aligned box? */
export function segmentIntersectsBox(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  box: Box,
): boolean {
  const minX = box.x - box.w / 2;
  const maxX = box.x + box.w / 2;
  const minZ = box.z - box.d / 2;
  const maxZ = box.z + box.d / 2;
  const dx = bx - ax;
  const dz = bz - az;
  // Slab clipping over t in [0,1].
  let t0 = 0;
  let t1 = 1;
  const axes: [number, number, number, number][] = [
    [ax, dx, minX, maxX],
    [az, dz, minZ, maxZ],
  ];
  for (const [start, delta, lo, hi] of axes) {
    if (Math.abs(delta) < 1e-9) {
      if (start < lo || start > hi) return false;
    } else {
      let tNear = (lo - start) / delta;
      let tFar = (hi - start) / delta;
      if (tNear > tFar) [tNear, tFar] = [tFar, tNear];
      t0 = Math.max(t0, tNear);
      t1 = Math.min(t1, tFar);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** True if nothing in `boxes` blocks the sight line between the two points. */
export function hasLineOfSight(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  boxes: Box[],
): boolean {
  for (const box of boxes) {
    if (segmentIntersectsBox(ax, az, bx, bz, box)) return false;
  }
  return true;
}
