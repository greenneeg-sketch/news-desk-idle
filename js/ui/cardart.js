import { CARDS, RARITY } from '../data/config.js';
// 스카우트 카드 그림: 카드마다 머리·피부·옷·소품이 다르고, 같은 카드가 겹칠수록(★2, ★3) 외형과 액자가 업그레이드된다
// 인물은 16x22 칸 격자에 2배로 그린다. 카드 한 장 = 80x96
const SK = ['#f2c9a0', '#e0ac7e', '#c68a5c', '#f6d5b8'];
const LOOK = {
  c1: { hair: 'short', hc: '#5a3a20', sk: 0, top: '#41a6f6', acc: 'camera' },
  c2: { hair: 'pony', hc: '#14141f', sk: 3, top: '#38b764', acc: 'headset' },
  c3: { hair: 'curly', hc: '#8b5e3c', sk: 1, top: '#ffcd75', acc: 'glasses', acc2: 'headset' },
  c4: { hair: 'bob', hc: '#b45bff', sk: 3, top: '#e43b44', acc: 'tablet' },
  c5: { hair: 'long', hc: '#3b2a20', sk: 0, top: '#f4f4f4', acc: 'script', tie: '#2a6fdb' },
  c6: { hair: 'cap', hc: '#333c57', cap: '#e43b44', sk: 2, top: '#566c86', acc: 'camera', beard: 1 },
  c7: { hair: 'curly', hc: '#14141f', sk: 1, top: '#8b9bb4', acc: 'coffee', tired: 1 },
  c8: { hair: 'beanie', hc: '#3b2a20', cap: '#257179', sk: 2, top: '#73eff7', acc: 'tablet', acc2: 'glasses' },
  c9: { hair: 'fedora', hc: '#3b2a20', cap: '#5a3a20', sk: 0, top: '#c2a35a', acc: 'script' },
  c10: { hair: 'pony', hc: '#c2c3c7', sk: 1, top: '#222633', acc: 'headset', acc2: 'glasses' },
  c11: { hair: 'neat', hc: '#14141f', sk: 0, top: '#1d3a6b', acc: 'mic', tie: '#e43b44' },
  c12: { hair: 'bald', hc: '#c2c3c7', sk: 2, top: '#2a2a3a', acc: 'badge', tie: '#ffd24a' },
  h1: { hair: 'goggles', hc: '#3b2a20', sk: 0, top: '#ffcd75', acc: 'cape', cape: '#38b764' },
  h2: { hair: 'hood', hc: '#14141f', hood: '#257179', sk: 1, top: '#257179', acc: 'scarf', mask: 1 },
  h3: { hair: 'helmet', hc: '#c2c3c7', sk: 0, top: '#94b0c2', acc: 'jet' },
  h4: { hair: 'hood', hc: '#333c57', hood: '#ef7d57', sk: 2, top: '#333c57', acc: 'board' },
};
const hexn = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const shade = (h, a) => '#' + hexn(h).map(v => Math.max(0, Math.min(255, Math.round(a > 0 ? v + (255 - v) * a : v * (1 + a)))).toString(16).padStart(2, '0')).join('');

export function drawCards(c, s, t, sel) {
  const R = (x, y, w, h, k) => { c.fillStyle = k; c.fillRect(Math.round(x), Math.round(y), w, h); };
  c.imageSmoothingEnabled = false; R(0, 0, 320, 384, '#1a1c2c');
  CARDS.forEach((cd, i) => {
    const x = i % 4 * 80, y = (i / 4 | 0) * 96, n = s.cards[cd.id] || 0, rc = RARITY[cd.rar].c;
    drawCard(R, x, y, cd, n, rc, t, i);
    if (i === sel) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, 76, 92); }
  });
}

function drawCard(R, x, y, cd, n, rc, t, idx) {
  const L = LOOK[cd.id] || LOOK.c1, gold = '#ffd24a', silver = '#dfe6ee';
  // 배경 + 액자
  for (let j = 0; j < 88; j += 4) R(x + 4, y + 4 + j, 72, 4, shade(n ? rc : '#2a2e44', n ? -.72 + j / 88 * .12 : -.35));
  if (n >= 2) for (let k = -88; k < 72; k += 10) for (let j = 0; j < 88; j += 2) { const px = x + 4 + k + j; if (px >= x + 4 && px < x + 76) R(px, y + 4 + j, 1, 2, shade(rc, -.5)); }
  if (n >= 3) { const a = t * .8; for (let r = 0; r < 8; r++) { const an = a + r * Math.PI / 4; for (let d = 8; d < 40; d += 3) R(x + 40 + Math.cos(an) * d, y + 40 + Math.sin(an) * d, 2, 2, shade(gold, -.45)); } }
  const fr = n >= 3 ? gold : n >= 2 ? silver : n ? rc : '#3a4466';
  R(x + 3, y + 3, 74, 2, fr); R(x + 3, y + 91, 74, 2, fr); R(x + 3, y + 3, 2, 90, fr); R(x + 75, y + 3, 2, 90, fr);
  if (n >= 2) { R(x + 6, y + 6, 70, 1, shade(fr, -.3)); R(x + 6, y + 88, 70, 1, shade(fr, -.3)); }
  if (n >= 3) for (const [cx, cy] of [[4, 4], [72, 4], [4, 88], [72, 88]]) { R(x + cx, y + cy, 4, 4, (t * 3 + cx) % 2 < 1 ? '#ffffff' : '#ff4ad6'); }
  if (!n) { figure(R, x + 24, y + 12, L, 0, t, true); R(x + 36, y + 62, 8, 2, '#566c86'); R(x + 34, y + 54, 2, 4, '#566c86'); R(x + 36, y + 52, 8, 2, '#566c86'); R(x + 44, y + 54, 2, 4, '#566c86'); R(x + 40, y + 58, 4, 2, '#566c86'); R(x + 38, y + 66, 4, 2, '#566c86'); return; }
  figure(R, x + 24, y + 12, L, n, t, false);
  // 별
  for (let k = 0; k < n; k++) { const sx = x + 40 - n * 6 + k * 12 + 2, sy = y + 80, sc = n >= 3 ? gold : n >= 2 ? silver : rc; R(sx + 2, sy, 2, 6, sc); R(sx, sy + 2, 6, 2, sc); R(sx + 1, sy + 1, 4, 4, sc); }
  if (cd.hero) { R(x + 8, y + 8, 6, 6, gold); R(x + 10, y + 10, 2, 2, '#ff4ad6'); }
  if (n >= 3) for (let k = 0; k < 3; k++) { const ph = (t * 1.3 + k * .37) % 1, sx = x + 14 + ((k * 23 + idx * 7) % 52), sy = y + 70 - ph * 56; R(sx, sy, 2, 2, '#ffffff'); R(sx - 2, sy, 1, 2, gold); R(sx + 3, sy, 1, 2, gold); }
}

// 인물: (ox, oy)에서 16x22 칸, 한 칸 = 2px. n = 별 개수(외형 업그레이드), dark = 미획득 실루엣
function figure(R, ox, oy, L, n, t, dark) {
  const D = '#222633', P = (gx, gy, w, h, k) => R(ox + gx * 2, oy + gy * 2, w * 2, h * 2, dark ? D : k);
  const sk = SK[L.sk || 0], top = n >= 2 ? shade(L.top, .12) : L.top, hc = L.hc, gold = '#ffd24a';
  if (L.acc === 'cape') { P(3, 11, 10, 10, L.cape); P(2, 13 + ((t * 4 | 0) % 2), 2, 7, shade(L.cape, -.2)); P(12, 13 + ((t * 4 + 1 | 0) % 2), 2, 7, shade(L.cape, -.2)); }
  // 다리·신발
  P(5, 19, 2, 2, '#2a2a3a'); P(9, 19, 2, 2, '#2a2a3a'); P(4, 21, 3, 1, '#14141f'); P(9, 21, 3, 1, '#14141f');
  if (L.acc === 'board') { P(1, 21, 14, 1, '#b45bff'); P(2, 22, 12, 1, (t * 6 | 0) % 2 ? '#ff4ad6' : '#5d275d'); }
  if (L.acc === 'jet') { const f = (t * 10 | 0) % 2; P(5, 22, 2, 1 + f, '#73eff7'); P(9, 22, 2, 1 + f, '#73eff7'); }
  // 몸통·팔·손
  P(4, 11, 8, 8, top); P(11, 11, 1, 8, shade(top, -.25)); P(2, 11, 2, 6, top); P(12, 11, 2, 6, shade(top, -.15)); P(2, 17, 2, 1, sk); P(12, 17, 2, 1, sk);
  P(7, 10, 2, 1, shade(sk, -.1));
  if (L.tie) { P(6, 11, 1, 2, '#f4f4f4'); P(9, 11, 1, 2, '#f4f4f4'); P(7, 11, 2, 5, L.tie); }
  if (n >= 2 && !L.tie) P(6, 11, 4, 1, '#f4f4f4');                                          // ★2: 흰 옷깃
  if (n >= 3) { P(4, 11, 8, 1, gold); P(8, 13, 1, 1, gold); P(7, 14, 3, 1, shade(gold, -.2)); } // ★3: 금장식·가슴 휘장
  // 머리
  P(5, 4, 6, 6, sk); P(10, 4, 1, 6, shade(sk, -.12));
  if (!dark) { R(ox + 12, oy + 12, 2, 2, '#14141f'); R(ox + 18, oy + 12, 2, 2, '#14141f'); R(ox + 14, oy + 16, 4, 2, shade(sk, -.3)); }
  if (L.tired && !dark) { R(ox + 12, oy + 14, 2, 1, '#9b7bb5'); R(ox + 18, oy + 14, 2, 1, '#9b7bb5'); }
  if (L.beard) P(5, 8, 6, 2, hc);
  const H = {
    short: () => { P(5, 2, 6, 2, hc); P(4, 3, 1, 3, hc); P(11, 3, 1, 3, hc); },
    neat: () => { P(5, 2, 6, 2, hc); P(4, 3, 1, 3, hc); P(11, 3, 1, 2, hc); P(7, 2, 1, 1, shade(hc, .3)); },
    pony: () => { P(5, 2, 6, 2, hc); P(4, 3, 1, 3, hc); P(11, 3, 2, 2, hc); P(12, 5, 1, 4, hc); },
    long: () => { P(5, 2, 6, 2, hc); P(4, 3, 1, 8, hc); P(11, 3, 1, 8, hc); },
    bob: () => { P(5, 2, 6, 2, hc); P(4, 3, 1, 6, hc); P(11, 3, 1, 6, hc); P(5, 4, 2, 1, hc); },
    curly: () => { for (let i = 4; i < 12; i++) P(i, 1 + (i % 2), 1, 3 - (i % 2), hc); P(4, 4, 1, 2, hc); P(11, 4, 1, 2, hc); },
    cap: () => { P(4, 2, 8, 2, L.cap); P(10, 4, 4, 1, shade(L.cap, -.25)); P(4, 4, 1, 2, hc); },
    beanie: () => { P(4, 1, 8, 3, L.cap); P(4, 3, 8, 1, shade(L.cap, .25)); P(7, 0, 2, 1, shade(L.cap, -.2)); },
    fedora: () => { P(5, 1, 6, 2, L.cap); P(3, 3, 10, 1, shade(L.cap, -.2)); P(5, 2, 6, 1, '#14141f'); },
    bald: () => { P(4, 5, 1, 2, hc); P(11, 5, 1, 2, hc); P(6, 3, 4, 1, shade(sk, .2)); },
    goggles: () => { P(5, 2, 6, 2, hc); P(4, 3, 1, 2, hc); P(4, 5, 8, 1, '#5a3a20'); P(5, 5, 2, 1, '#73eff7'); P(9, 5, 2, 1, '#73eff7'); },
    hood: () => { P(4, 2, 8, 9, L.hood); P(6, 5, 4, 4, sk); if (L.mask) P(6, 7, 4, 2, '#14141f'); else P(6, 5, 4, 1, '#14141f'); },
    helmet: () => { P(4, 2, 8, 8, L.hc); P(5, 5, 6, 2, '#b45bff'); P(4, 2, 8, 1, shade(L.hc, .3)); },
  };
  (H[L.hair] || H.short)();
  // 소품 (★2·★3이면 업그레이드)
  const A = {
    camera: () => { P(11, 8, 5, 4, '#2a2a3a'); P(15, 9, 1, 2, '#94b0c2'); P(12, 9, 2, 1, '#566c86'); if (n >= 2) { P(12, 7, 2, 1, '#ffd24a'); } if (n >= 3) P(11, 11, 5, 1, gold); if (!dark && (t * 2 | 0) % 2) R(ox + 24, oy + 16, 2, 2, '#ff004d'); },
    headset: () => { P(4, 2, 8, 1, '#2a2a3a'); P(3, 5, 1, 3, n >= 3 ? gold : '#2a2a3a'); P(12, 5, 1, 3, n >= 3 ? gold : '#2a2a3a'); if (n >= 2) { P(12, 8, 2, 1, '#2a2a3a'); P(13, 9, 1, 1, '#ff004d'); } },
    glasses: () => { const k = n >= 3 ? gold : '#14141f'; P(5, 6, 6, 1, k); if (n >= 2 && !dark) { R(ox + 12, oy + 12, 4, 2, '#14141f'); R(ox + 18, oy + 12, 4, 2, '#14141f'); } },
    tablet: () => { P(5, 13, 6, 4, '#2a2a3a'); P(6, 14, 4, 2, n >= 3 ? ((t * 4 | 0) % 2 ? '#73eff7' : '#ff77e1') : '#41a6f6'); if (n >= 2) P(11, 12, 1, 4, '#f4f4f4'); },
    script: () => { P(1, 14, 3, 4, n >= 3 ? gold : '#f4f4f4'); P(1, 15, 3, 1, '#94b0c2'); if (n >= 2) P(1, 13, 3, 1, '#8b5e3c'); },
    coffee: () => { P(12, 15, 2, 3, n >= 3 ? gold : '#f4f4f4'); P(12, 16, 2, 1, '#5a3a20'); if (!dark) R(ox + 26, oy + 26 - (t * 6 | 0) % 3 * 2, 2, 2, '#c2c3c7'); if (n >= 2) P(14, 16, 1, 1, '#f4f4f4'); },
    mic: () => { P(13, 12, 1, 4, '#14141f'); P(12, 11, 3, 2, n >= 3 ? gold : '#94b0c2'); if (n >= 2) P(12, 13, 3, 2, '#e43b44'); },
    badge: () => { P(9, 12, 2, 2, gold); if (n >= 2) P(5, 12, 2, 1, '#e43b44'); },
    scarf: () => { P(5, 10, 6, 1, '#f4f4f4'); P(11, 10, 1, 1, '#f4f4f4'); P(12, 10 + ((t * 5 | 0) % 2), 3, 1, '#f4f4f4'); },
  };
  if (A[L.acc]) A[L.acc](); if (A[L.acc2]) A[L.acc2]();
}
