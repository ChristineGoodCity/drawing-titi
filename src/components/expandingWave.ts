// Shared geometry keeps the panel widths and the continuous outline in sync.
export function expandingWave(count: number, focus: number) {
  const weights = Array.from({ length: count }, (_, index) =>
    1 + 6 * Math.exp(-0.5 * ((index - focus) / 0.85) ** 2));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const widths = weights.map((weight) => weight / total);
  let left = 0;
  const centers = widths.map((width) => {
    const center = left + width / 2;
    left += width;
    return center;
  });
  const lower = Math.min(Math.floor(focus), count - 1);
  const upper = Math.min(lower + 1, count - 1);
  const center = (centers[lower] ?? 0.5) + ((centers[upper] ?? 0.5) - (centers[lower] ?? 0.5)) * (focus - lower);
  const spread = 0.2;
  // When an end panel is selected, carry its expanded height to the screen edge.
  // Blend into that plateau as the focus approaches either end.
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const leftFalloff = 1 - smooth(1 - focus);
  const rightFalloff = 1 - smooth(focus - (count - 2));
  const falloff = (x: number) => x < center ? leftFalloff : rightFalloff;
  const halfHeight = (x: number) =>
    0.17 + 0.10 * Math.exp(-0.5 * ((x - center) * falloff(x) / spread) ** 2);
  const derivative = (x: number) => {
    const scale = falloff(x);
    const bump = halfHeight(x) - 0.17;
    return -bump * (x - center) * scale ** 2 / spread ** 2;
  };
  return makeWave(widths, halfHeight, derivative);
}

function makeWave(widths: number[], halfHeight: (x: number) => number, derivative: (x: number) => number,
  topHeight = halfHeight, bottomHeight = halfHeight, topDerivative = derivative, bottomDerivative = derivative) {
  let left = 0;
  const centers = widths.map((width) => {
    const center = left + width / 2;
    left += width;
    return center;
  });
  // Cubic segments follow the curve's exact tangent for a smooth silhouette.
  const segments = 64;
  let path = `M 0 ${0.5 - topHeight(0)}`;
  for (const side of [-1, 1]) {
    const profile = side === -1 ? topHeight : bottomHeight;
    const tangent = side === -1 ? topDerivative : bottomDerivative;
    if (side === 1) path += ` L 1 ${0.5 + bottomHeight(1)}`;
    for (let i = 0; i < segments; i++) {
      const start = side === -1 ? i / segments : 1 - i / segments;
      const end = side === -1 ? (i + 1) / segments : 1 - (i + 1) / segments;
      const delta = (end - start) / 3;
      path += ` C ${start + delta} ${0.5 + side * (profile(start) + tangent(start) * delta)} ${end - delta} ${0.5 + side * (profile(end) - tangent(end) * delta)} ${end} ${0.5 + side * profile(end)}`;
    }
  }
  return { widths, centers, halfHeight, derivative, bottomHeight, topHeight, path: `${path} Z` };
}

export function gooeyWave(base: ReturnType<typeof expandingWave>, pull: { x: number; top: number; bottom: number }) {
  const spread = 0.055;
  const bump = (x: number) => Math.exp(-0.5 * ((x - pull.x) / spread) ** 2);
  const slope = (x: number) => -(x - pull.x) / spread ** 2 * bump(x);
  const top = (x: number) => base.halfHeight(x) + pull.top * bump(x);
  const bottom = (x: number) => base.halfHeight(x) + pull.bottom * bump(x);
  const maximum = Math.max(pull.top, pull.bottom);
  return makeWave(base.widths,
    (x) => base.halfHeight(x) + maximum * bump(x),
    (x) => base.derivative(x) + maximum * slope(x),
    top, bottom,
    (x) => base.derivative(x) + pull.top * slope(x),
    (x) => base.derivative(x) + pull.bottom * slope(x));
}

// Blend the old and new shapes directly, rather than visiting intervening panels.
export function blendExpandingWaves(from: ReturnType<typeof expandingWave>, to: ReturnType<typeof expandingWave>, progress: number) {
  const mix = (a: number, b: number) => a + (b - a) * progress;
  const heights = Array.from({ length: 33 }, (_, i) => mix(from.halfHeight(i / 32), to.halfHeight(i / 32)));
  const slopes = Array.from({ length: 33 }, (_, i) => mix(from.derivative(i / 32), to.derivative(i / 32)));
  const sample = (values: number[], x: number) => {
    const index = Math.max(0, Math.min(32, x * 32));
    const lower = Math.floor(index);
    return values[lower] + (values[Math.min(32, lower + 1)] - values[lower]) * (index - lower);
  };
  return makeWave(from.widths.map((width, i) => mix(width, to.widths[i])),
    (x) => sample(heights, x), (x) => sample(slopes, x));
}
