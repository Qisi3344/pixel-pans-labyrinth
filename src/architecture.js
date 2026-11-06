/** The architectural landmarks are deliberately independent from the tile maze. */
export const WELL = Object.freeze({
  radius: 3.55,
  rimOuter: 4.13,
  depth: 4.90,
  stepCount: 52,
  turns: 2.15,
  startAngle: -Math.PI / 2,
});
export const ARCH = Object.freeze({
  openingRadius: 1.45,
  outerRadius: 2.09,
  springY: 1.65,
  thickness: 0.94,
  stones: 13,
});
export function wellFloorY(radius) {
  if (radius >= WELL.radius + 0.18) return 0;
  if (radius >= WELL.radius - 0.28) return -0.25;
  // The descendable part of the shaft follows the inner taper rather than
  // leaving characters on a floating flat platform.
  const t = Math.max(0, Math.min(1, (WELL.radius - 0.28 - radius) / (WELL.radius - 0.68)));
  return -0.30 - 4.15 * (t * t * (3 - 2 * t));
}
export function spiralStep(i) {
  const t = i / (WELL.stepCount - 1);
  return {
    angle: WELL.startAngle + t * Math.PI * 2 * WELL.turns,
    radius: 3.12 - 2.20 * t,
    y: -0.27 - 4.12 * t,
    width: 0.93 - 0.17 * t,
  };
}
export function entranceAngle(start, center = 9) {
  return Math.atan2(start.z - center, start.x - center);
}

// The actor follows the same spiral curve as the physical mesh. Progress 0
// is the upper tread and 1 the small stone landing at the bottom.
export function spiralPosition(t) {
  t=Math.max(0,Math.min(1,t));
  if(t===1)return {x:0,z:0,y:-4.45};
  const a=WELL.startAngle+t*Math.PI*2*WELL.turns;
  const r=3.12-2.20*t;
  return {x:Math.cos(a)*r,z:Math.sin(a)*r,y:-0.27-4.12*t};
}
