export const ISO = {
  ox: 132,
  oy: 486,
  ax: 0.94,
  ay: 0.46,
  bx: -0.17,
  by: 0.62,
  az: 0.86,
};

export const PLAN = { ox: 62, oy: 58, s: 1 };

export const DET = ISO.ax * ISO.by - ISO.ay * ISO.bx;

export const iso = (x, y, z = 0) => [
  ISO.ox + x * ISO.ax + y * ISO.ay,
  ISO.oy + x * ISO.bx + y * ISO.by - z * ISO.az,
];

export const plan = (x, y) => [PLAN.ox + x * PLAN.s, PLAN.oy + y * PLAN.s];

export const isoPoly = (points) => points.map(([x, y, z = 0]) => iso(x, y, z).join(',')).join(' ');

export const planPoly = (points) => points.map(([x, y]) => plan(x, y).join(',')).join(' ');

export const floorDelta = (dx, dy, mode = 'iso') => {
  if (mode === 'plan') return { x: dx / PLAN.s, y: dy / PLAN.s };
  return {
    x: (ISO.by * dx - ISO.ay * dy) / DET,
    y: (-ISO.bx * dx + ISO.ax * dy) / DET,
  };
};

export const snapCm = (value, step = 10) => Math.round(value / step) * step;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
