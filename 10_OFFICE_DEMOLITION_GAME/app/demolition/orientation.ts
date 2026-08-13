/**
 * The canonical Sobaya model faces local -Z. Keep movement, attacks and the
 * rendered character on that same axis so he never appears to moonwalk.
 */
export function getPlayerFacingYaw(moveX: number, moveZ: number) {
  return Math.atan2(-moveX, -moveZ);
}

export function getPlayerForward(yaw: number) {
  return {
    x: -Math.sin(yaw),
    z: -Math.cos(yaw),
  };
}

export function getRadarArrow(
  targetX: number,
  targetZ: number,
  playerYaw: number,
) {
  const targetYaw = getPlayerFacingYaw(targetX, targetZ);
  let delta = (targetYaw - playerYaw + Math.PI) % (Math.PI * 2) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  const index = Math.round(delta / (Math.PI / 4));
  const arrows: Record<number, string> = {
    [-4]: "↓",
    [-3]: "↘",
    [-2]: "→",
    [-1]: "↗",
    0: "↑",
    1: "↖",
    2: "←",
    3: "↙",
    4: "↓",
  };
  return arrows[index] ?? "↑";
}
