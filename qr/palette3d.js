import {seedOf, random} from './qr-core.js';
export const PAPER = '#fffaf2';
export const LEAF_COLORS = ['#df91ad', '#9463ac', '#bf4444', '#e5b632', '#517fb4', '#d5d6d2'];
export const SEASONS = {
  spring: {leaf: '#ef9bb2', grass: '#80b852'},
  summer: {leaf: '#398750', grass: '#397342'},
  autumn: {leaf: '#e5a33c', grass: '#b9a13b'}
};
export function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
export function contrast(color, background = PAPER) {
  return (luminance(background) + .05) / (luminance(color) + .05);
}
// Scaling sRGB channels preserves hue and saturation in HSV space.
export function safeColor(hex, shade = 1) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16));
  let factor = shade;
  const paint = () => '#' + rgb.map(v => Math.round(Math.min(255, v * factor)).toString(16).padStart(2, '0')).join('');
  while (contrast(paint()) < 4.5) factor *= .99;
  return paint();
}
export function palette(season, leaf = '') {
  const source = SEASONS[season];
  const base = safeColor(leaf || source.leaf);
  return {leaf: [1, .89, .78].map(s => safeColor(base, s)), grass: safeColor(source.grass)};
}
export function floorColors(q, text, season, leaf = '') {
  const rng = random(seedOf(text)), colors = palette(season, leaf);
  return Array.from({length: q.size + 8}, (_, r) => Array.from({length: q.size + 8}, (_, c) => {
    const y = r - 4, x = c - 4;
    return q.modules[y]?.[x] ? q.isFinder(y, x) ? colors.grass : colors.leaf[Math.floor(rng() * 3)] : PAPER;
  }));
}
// Round-robin assignment guarantees coverage even for unusually dense QR matrices.
export function allocateLeaves(q, text, requested) {
  const cells = [];
  for (let r = 0; r < q.size; r++) for (let c = 0; c < q.size; c++) {
    if (q.modules[r][c] && !q.isFinder(r, c)) cells.push({r, c});
  }
  const rng = random(seedOf(text));
  return Array.from({length: Math.max(requested, cells.length)}, (_, i) => ({
    ...cells[i % cells.length], layer: Math.floor(i / cells.length), phase: rng() * Math.PI * 2
  }));
}
