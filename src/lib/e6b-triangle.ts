export const TRIANGLE_SIZE = 300;
const PAD = 46;

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lx: number;
  ly: number;
}

export interface TriangleGeometry {
  ground: Segment;
  air: Segment;
  wind: Segment;
}

function vector(deg: number, length: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [Math.sin(rad) * length, -Math.cos(rad) * length];
}

export function triangleGeometry(courseDeg: number, groundSpeedKt: number, headingDeg: number, tasKt: number): TriangleGeometry {
  const origin: [number, number] = [0, 0];
  const air = vector(headingDeg, tasKt);
  const ground = vector(courseDeg, groundSpeedKt);
  const points = [origin, air, ground];

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min((TRIANGLE_SIZE - PAD * 2) / spanX, (TRIANGLE_SIZE - PAD * 2) / spanY);
  const offsetX = (TRIANGLE_SIZE - spanX * scale) / 2 - minX * scale;
  const offsetY = (TRIANGLE_SIZE - spanY * scale) / 2 - minY * scale;
  const place = (p: [number, number]): [number, number] => [p[0] * scale + offsetX, p[1] * scale + offsetY];

  const o = place(origin);
  const a = place(air);
  const g = place(ground);
  const centroid: [number, number] = [(o[0] + a[0] + g[0]) / 3, (o[1] + a[1] + g[1]) / 3];

  const segment = (p: [number, number], q: [number, number]): Segment => {
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    let nx = -(q[1] - p[1]);
    let ny = q[0] - p[0];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if ((mx - centroid[0]) * nx + (my - centroid[1]) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { x1: p[0], y1: p[1], x2: q[0], y2: q[1], lx: mx + nx * 16, ly: my + ny * 16 + 4 };
  };

  return { ground: segment(o, g), air: segment(o, a), wind: segment(a, g) };
}
