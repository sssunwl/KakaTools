import qrcode from './vendor/qrcode.mjs';
import { stringToBytes } from './vendor/qrcode_UTF8.mjs';
qrcode.stringToBytes = stringToBytes;
const positions = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170]
  ];
export function createQR(text, ec = 'M') {
  const qr = qrcode(0, ec); qr.addData(text, 'Byte'); qr.make();
  const size = qr.getModuleCount(), version = (size - 17) / 4;
  const modules = Array.from({length:size}, (_,r) => Array.from({length:size},(_,c)=>qr.isDark(r,c)));
  const isFinder = (r,c) => (r<8 && c<8) || (r<8 && c>=size-8) || (r>=size-8 && c<8);
  const isTiming = (r,c) => (r===6 || c===6);
  const centers = [];
  for (const r of positions[version-1]) for (const c of positions[version-1]) {
    if (!isFinder(r,c)) centers.push([r,c]);
  }
  const isAlignment = (r,c) => centers.some(([y,x])=>Math.abs(r-y)<=2 && Math.abs(c-x)<=2);
  const isReserved = (r,c) => isFinder(r,c)||isTiming(r,c)||isAlignment(r,c);
  return {size, modules, isFinder, isTiming, isReserved, isAlignment};
}
export function seedOf(text) { let h=2166136261; for(const ch of text) h=Math.imul(h^ch.codePointAt(0),16777619); return h>>>0; }
export function random(seed) { return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; }; }
