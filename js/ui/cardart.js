import { CARDS, RARITY } from '../data/config.js';
// 스카우트 카드 그림: 카드마다 머리·피부·옷·소품이 다르고, 같은 카드가 겹칠수록(★2, ★3) 외형과 액자가 업그레이드된다
// 고해상도: 카드 한 장 = 80x112칸(도감 캔버스는 3배, 크게 보기는 6배). 인물은 32x44칸 격자(한 칸 = 4/3칸)
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
  c13: { hair: 'bob', hc: '#5d275d', sk: 3, top: '#a7f070', acc: 'tablet', acc2: 'glasses' },
  c14: { hair: 'short', hc: '#14141f', sk: 2, top: '#333c57', acc: 'headset', beard: 1 },
  c15: { hair: 'cap', hc: '#3b2a20', cap: '#ffcd75', sk: 1, top: '#ef7d57', acc: 'camera', acc2: 'glasses' },
  c16: { hair: 'long', hc: '#8b5e3c', sk: 3, top: '#41a6f6', acc: 'mic' },
  c17: { hair: 'curly', hc: '#3b2a20', sk: 0, top: '#a05ae0', acc: 'tablet', acc2: 'glasses' },
  c18: { hair: 'beanie', hc: '#14141f', cap: '#b13e53', sk: 1, top: '#566c86', acc: 'headset', tired: 1 },
  c19: { hair: 'neat', hc: '#5a3a20', sk: 3, top: '#257179', acc: 'badge', acc2: 'headset', tie: '#ffcd75' },
  c20: { hair: 'fedora', hc: '#c2c3c7', cap: '#333c57', sk: 2, top: '#5a3a20', acc: 'script', beard: 1, tie: '#b13e53' },
  h1: { hair: 'goggles', hc: '#3b2a20', sk: 0, top: '#3b5dc9', acc: 'cape', cape: '#e43b44', emb: '#ffcd75', boot: '#e43b44', pants: '#3b5dc9', hero: 1 },
  h2: { hair: 'hood', hc: '#14141f', hood: '#257179', sk: 1, top: '#257179', acc: 'scarf', mask: 1, emb: '#a7f070', boot: '#14141f', pants: '#1c3c40', hero: 1 },
  h3: { hair: 'helmet', hc: '#c2c3c7', sk: 0, top: '#94b0c2', acc: 'jet', emb: '#73eff7', boot: '#566c86', pants: '#8b9bb4', hero: 1 },
  h4: { hair: 'hood', hc: '#333c57', hood: '#333c57', sk: 2, top: '#333c57', acc: 'board', cape: '#ef7d57', emb: '#ffcd75', boot: '#14141f', pants: '#222633', ears: 1, hero: 1 },
};
const hexn = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const shade = (h, a) => '#' + hexn(h).map(v => Math.max(0, Math.min(255, Math.round(a > 0 ? v + (255 - v) * a : v * (1 + a)))).toString(16).padStart(2, '0')).join('');

const KOF = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif', CW = 80, CH = 112;
const BUFF = ['취재', '인제스트', '편집', 'CG', '송출'];
// 도감 배치: 등급별로 묶고(일반 → 희귀 → 영웅 → 전설), 등급마다 새 줄에서 시작하며 위에 등급 머리말을 단다
const GH = 14; // 머리말 높이(칸)
export const CARD_LAYOUT = (() => { const items = [], heads = []; let y = 0;
  RARITY.forEach((r, ri) => { const list = CARDS.map((cd, i) => [cd, i]).filter(([cd]) => cd.rar === ri); if (!list.length) return;
    heads.push({ ri, y, n: list.length }); y += GH; list.forEach(([, i], j) => items.push({ i, x: j % 4 * CW, y: y + (j / 4 | 0) * CH })); y += Math.ceil(list.length / 4) * CH; });
  return { items, heads, h: y }; })();
export const cardAt = (fx, fy) => { const x = fx * CW * 4, y = fy * CARD_LAYOUT.h, it = CARD_LAYOUT.items.find(o => x >= o.x && x < o.x + CW && y >= o.y && y < o.y + CH); return it ? it.i : -1; };
export function drawCards(c, s, t, sel) { // 도감: 4열 격자, 캔버스 3배
  const W = CW * 4 * 3, H = CARD_LAYOUT.h * 3;
  if (c.canvas.width !== W || c.canvas.height !== H) { c.canvas.width = W; c.canvas.height = H; }
  if (c.canvas.closest('.pane') && c.canvas.closest('.pane').hidden) return;
  c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.fillStyle = '#1a1c2c'; c.fillRect(0, 0, W, H);
  CARD_LAYOUT.heads.forEach(h => { const r = RARITY[h.ri], got = CARDS.filter(cd => cd.rar === h.ri && s.cards[cd.id]).length;
    c.fillStyle = shade(r.c, -.7); c.fillRect(0, h.y * 3 + 6, W, (GH - 4) * 3); c.fillStyle = r.c; c.fillRect(0, h.y * 3 + 6, 9, (GH - 4) * 3);
    c.font = `bold ${8 * 3}px ${KOF}`; c.fillStyle = r.c; c.fillText(`${r.n}`, 18, h.y * 3 + 33); const w = c.measureText(r.n).width;
    c.font = `bold ${6.5 * 3}px ${KOF}`; c.fillStyle = '#c2c3c7'; c.fillText(`${got}/${h.n}장 · 1장당 해당 층 속도 +${Math.round(r.b * 100)}%`, 18 + w + 18, h.y * 3 + 32); });
  CARD_LAYOUT.items.forEach(o => { const cd = CARDS[o.i]; drawCard(c, 3, o.x * 3, o.y * 3, cd, s.cards[cd.id] || 0, t, o.i, o.i === sel); });
  const big = document.getElementById('cbig'); // 크게 보기(선택한 카드)
  if (big) { const g = big.getContext('2d'); if (big.width !== CW * 6) { big.width = CW * 6; big.height = CH * 6; } g.imageSmoothingEnabled = false; g.clearRect(0, 0, big.width, big.height); const cd = CARDS[sel] || CARDS[0]; drawCard(g, 6, 0, 0, cd, s.cards[cd.id] || 0, t, CARDS.indexOf(cd), false, true); }
}

// 카드 한 장. k = 배율(칸 → 실제 픽셀), (X, Y) = 실제 픽셀 위치
function drawCard(c, k, X, Y, cd, n, t, idx, selected, big) {
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(X + x * k), Math.round(Y + y * k), Math.round(w * k), Math.round(h * k)); };
  const T = (str, x, y, sz, col, al = 'center') => { c.font = `bold ${sz * k}px ${KOF}`; c.textAlign = al; c.fillStyle = col; c.fillText(str, X + x * k, Y + y * k); c.textAlign = 'left'; };
  const fit = (str, max, sz) => { c.font = `bold ${sz * k}px ${KOF}`; const w = c.measureText(str).width / k; return w > max ? sz * max / w : sz; };
  const L = LOOK[cd.id] || LOOK.c1, rc = RARITY[cd.rar].c, gold = '#ffd24a', silver = '#dfe6ee', fr = n >= 3 ? gold : n >= 2 ? silver : n ? rc : '#3a4466';
  // 배경: 등급 색 그러데이션 + ★2 사선 무늬 + ★3 회전 후광
  for (let j = 0; j < CH; j += 2) R(0, j, CW, 2, shade(n ? rc : '#2a2e44', n ? -.8 + j / CH * .2 : -.45));
  if (n >= 2) for (let q = -CH; q < CW; q += 8) for (let j = 0; j < CH; j += 1.5) { const px = q + j; if (px >= 0 && px < CW - 1) R(px, j, 1, 1, shade(rc, -.6)); }
  if (n >= 3) for (let r = 0; r < 10; r++) { const an = t * .5 + r * Math.PI / 5; for (let d = 10; d < 46; d += 2.5) R(40 + Math.cos(an) * d, 46 + Math.sin(an) * d, 1.5, 1.5, shade(gold, -.4)); }
  // 액자
  R(0, 0, CW, 2, fr); R(0, CH - 2, CW, 2, fr); R(0, 0, 2, CH, fr); R(CW - 2, 0, 2, CH, fr); R(2, 2, CW - 4, .5, shade(fr, -.45)); R(2, CH - 2.5, CW - 4, .5, shade(fr, -.45));
  if (n >= 2) { R(3.5, 3.5, CW - 7, .5, shade(fr, -.25)); R(3.5, CH - 4, CW - 7, .5, shade(fr, -.25)); }
  if (n >= 3) [[0, 0], [CW - 4, 0], [0, CH - 4], [CW - 4, CH - 4]].forEach(([a, b]) => R(a, b, 4, 4, (t * 3 + a) % 2 < 1 ? '#ffffff' : '#ff4ad6'));
  // 등급 표시
  const rn = n ? RARITY[cd.rar].n : '?'; R(4, 4, 17, 8, n ? rc : '#3a4466'); T(rn, 12.5, 10.6, 5.6, '#14141f');
  if (cd.hero && n) { R(CW - 13, 4, 9, 8, '#0b0b14'); T('★', CW - 8.5, 10.6, 6, gold); }
  // 인물
  const cs = 4 / 3, fx = 40 - 16 * cs, fy = 16 + (n >= 3 ? Math.round(Math.sin(t * 2) * 1.5) / 1.5 : 0);
  c.globalAlpha = .45; R(fx + 4 * cs, 76, 24 * cs, 2.5, '#0b0b14'); c.globalAlpha = 1;
  figure((gx, gy, w, h, col) => R(fx + gx * cs, fy + gy * cs, w * cs, h * cs, col), L, n, t, !n, idx);
  if (!n) { T('?', 40, 54, 22, '#566c86'); }
  // 이름표
  R(4, 80, CW - 8, 14, '#0b0b14d8'); R(4, 80, CW - 8, .7, shade(fr, -.2));
  const nm = n ? cd.n : '???', sz = fit(nm, CW - 12, 7); T(nm, 40, 89.5, sz, n ? '#ffffff' : '#8b9bb4');
  if (n) { const b = `${cd.st < 0 ? '전 층' : BUFF[cd.st]} +${Math.round(RARITY[cd.rar].b * (1 + .5 * (n - 1)) * 100)}%`; T(b, 40, 101, 5.6, shade(rc, .35)); }
  else T(cd.hero ? '전설의 히어로' : '스카우트로 만나요', 40, 101, 5, '#566c86');
  for (let q = 0; q < n; q++) { const sx = 40 - n * 4 + q * 8 + 1, sy = 103.5; R(sx + 2, sy, 2, 6, fr); R(sx, sy + 2, 6, 2, fr); R(sx + 1, sy + 1, 4, 4, fr); }
  if (n >= 3) for (let q = 0; q < 4; q++) { const ph = (t * .9 + q * .27 + idx * .13) % 1; R(10 + ((q * 19 + idx * 7) % 60), 72 - ph * 60, 1.5, 1.5, '#ffffff'); }
  if (selected) { c.strokeStyle = '#ffffff'; c.lineWidth = k; c.strokeRect(X + k * .5, Y + k * .5, (CW - 1) * k, (CH - 1) * k); }
}

// 정면 인물 32x44칸. n = 별 개수(외형 업그레이드), dark = 미획득 실루엣
function figure(P0, L, n, t, dark, idx) {
  const D = '#2a2e44', P = (x, y, w, h, col) => P0(x, y, w, h, dark ? D : col);
  const sk = SK[L.sk || 0], skD = shade(sk, -.14), top = n >= 2 ? shade(L.top, .1) : L.top, topD = shade(top, -.22), hc = L.hc, hcD = shade(hc, -.3), hcL = shade(hc, .28), gold = '#ffd24a';
  const pants = L.pants || '#2a2a3a', boot = L.boot || '#14141f', ink = '#14141f', f2 = Math.floor(t * 4) % 2, blink = Math.floor(t * 1.2 + idx * 1.7) % 7 === 0;
  // 뒤쪽: 망토·긴 머리
  if (L.acc === 'cape' || L.cape) { const k = L.cape; P(6, 16, 20, 26, k); P(4 + f2, 22, 3, 21, shade(k, -.25)); P(25 - f2, 22, 3, 21, shade(k, -.25)); P(8, 40 + f2, 16, 2, shade(k, -.15)); }
  if (L.hair === 'long') { P(7, 3, 18, 22, hc); P(7, 20, 18, 2, hcD); }
  if (L.hair === 'bob') P(7, 3, 18, 13, hc);
  if (L.hair === 'pony') { P(23, 4, 4, 4, hc); P(24, 8, 3, 11, hc); P(25, 18, 2, 2, hcD); }
  // 다리·신발
  P(10, 32, 5, 10, pants); P(17, 32, 5, 10, pants); P(14, 32, 1, 8, shade(pants, -.3)); P(9, 41, 7, 3, boot); P(16, 41, 7, 3, boot); P(9, 41, 7, 1, shade(boot, .25)); P(16, 41, 7, 1, shade(boot, .25));
  if (L.acc === 'jet') { const f = Math.floor(t * 10) % 3; P(10, 44, 4, 2 + f, '#73eff7'); P(18, 44, 4, 2 + f, '#73eff7'); P(11, 44, 2, 1 + f, '#ffffff'); P(19, 44, 2, 1 + f, '#ffffff'); }
  if (L.acc === 'board') { P(3, 44, 26, 2, '#b45bff'); P(5, 46, 22, 1, Math.floor(t * 6) % 2 ? '#ff4ad6' : '#5d275d'); P(4, 44, 2, 1, '#ffffff'); }
  // 몸통·팔·손
  P(8, 17, 16, 15, top); P(22, 17, 2, 15, topD); P(8, 17, 16, 1, shade(top, .15));
  P(4, 18, 4, 11, top); P(4, 18, 1, 11, topD); P(24, 18, 4, 11, topD); P(4, 17, 4, 2, shade(top, .1)); P(24, 17, 4, 2, top);
  P(4, 29, 4, 3, sk); P(24, 29, 4, 3, sk); P(4, 31, 4, 1, skD); P(24, 31, 4, 1, skD);
  if (!L.hero) { P(15, 22, 2, 10, shade(top, -.12)); if (!L.tie) { P(16, 24, 1, 1, shade(top, -.35)); P(16, 28, 1, 1, shade(top, -.35)); } P(9, 25, 4, 3, shade(top, -.08)); P(9, 25, 4, 1, shade(top, -.25)); }
  else { P(8, 30, 16, 2, gold); P(15, 30, 2, 2, shade(gold, -.3)); P(4, 26, 4, 3, shade(L.emb || gold, -.2)); P(24, 26, 4, 3, shade(L.emb || gold, -.2)); P(13, 20, 6, 6, ink); P(14, 21, 4, 4, L.emb || gold); P(15, 22, 2, 2, '#ffffff'); }
  P(14, 15, 4, 2, skD);
  if (L.tie) { P(12, 17, 3, 4, '#f4f4f4'); P(17, 17, 3, 4, '#f4f4f4'); P(15, 17, 2, 2, shade(L.tie, -.2)); P(15, 19, 2, 9, L.tie); P(15, 27, 2, 1, shade(L.tie, -.3)); }
  else if (n >= 2 && !L.hero) { P(11, 17, 4, 2, '#f4f4f4'); P(17, 17, 4, 2, '#f4f4f4'); } // ★2: 흰 옷깃
  if (n >= 3) { P(8, 17, 16, 1, gold); P(9, 21, 3, 3, gold); P(10, 22, 1, 1, '#ffffff'); P(4, 17, 4, 1, gold); P(24, 17, 4, 1, gold); } // ★3: 금장식·훈장
  // 머리
  P(9, 3, 14, 12, sk); P(21, 4, 2, 11, skD); P(10, 14, 12, 1, skD); P(8, 7, 1, 4, sk); P(23, 7, 1, 4, skD);
  const face = L.hair !== 'helmet';
  if (face && !dark) {
    P(11, 6, 4, 1, hcD); P(17, 6, 4, 1, hcD); // 눈썹
    if (blink) { P(12, 9, 3, 1, ink); P(17, 9, 3, 1, ink); } else { P(12, 8, 3, 3, ink); P(17, 8, 3, 3, ink); P(12, 8, 1, 1, '#ffffff'); P(17, 8, 1, 1, '#ffffff'); }
    P(15, 11, 2, 1, skD); P(14, 13, 4, 1, shade(sk, -.38)); P(10, 11, 2, 1, '#e8a6a0'); P(20, 11, 2, 1, '#e8a6a0');
    if (L.tired) { P(12, 11, 3, 1, '#9b7bb5'); P(17, 11, 3, 1, '#9b7bb5'); }
    if (L.beard) { P(10, 12, 12, 3, hc); P(13, 13, 6, 1, shade(sk, -.38)); P(9, 9, 1, 4, hc); P(22, 9, 1, 4, hc); }
  }
  const H = {
    short: () => { P(8, 1, 16, 4, hc); P(8, 4, 2, 5, hc); P(22, 4, 2, 5, hc); P(10, 4, 5, 1, hc); P(11, 1, 6, 1, hcL); },
    neat: () => { P(8, 1, 16, 4, hc); P(8, 4, 2, 4, hc); P(22, 4, 2, 3, hc); P(9, 4, 8, 1, hc); P(15, 1, 1, 3, hcL); P(17, 1, 5, 1, hcL); },
    pony: () => { P(8, 1, 16, 4, hc); P(8, 4, 2, 6, hc); P(22, 4, 2, 4, hc); P(10, 4, 4, 1, hc); P(11, 1, 5, 1, hcL); P(23, 4, 2, 2, '#e43b44'); },
    long: () => { P(8, 1, 16, 4, hc); P(8, 4, 2, 12, hc); P(22, 4, 2, 12, hc); P(14, 4, 6, 1, hc); P(11, 1, 5, 1, hcL); },
    bob: () => { P(8, 1, 16, 4, hc); P(8, 4, 2, 10, hc); P(22, 4, 2, 10, hc); P(10, 4, 12, 2, hc); P(12, 1, 6, 1, hcL); },
    curly: () => { for (let q = 0; q < 9; q++) P(7 + q * 2, q % 2, 3, 5, q % 3 ? hc : hcL); P(7, 4, 3, 7, hc); P(22, 4, 3, 7, hc); },
    cap: () => { P(8, 6, 2, 4, hc); P(22, 6, 2, 4, hc); P(8, 0, 16, 5, L.cap); P(9, 0, 14, 1, shade(L.cap, .25)); P(6, 4, 20, 2, shade(L.cap, -.28)); P(15, 1, 3, 3, '#f4f4f4'); },
    beanie: () => { P(8, 6, 2, 4, hc); P(22, 6, 2, 4, hc); P(8, -1, 16, 6, L.cap); P(8, 4, 16, 2, shade(L.cap, .22)); for (let q = 9; q < 24; q += 2) P(q, 4, 1, 2, shade(L.cap, -.1)); P(14, -3, 4, 2, shade(L.cap, .4)); },
    fedora: () => { P(8, 5, 2, 5, hc); P(22, 5, 2, 5, hc); P(10, -3, 12, 5, L.cap); P(12, -3, 8, 1, shade(L.cap, -.2)); P(10, 1, 12, 1, ink); P(5, 2, 22, 2, shade(L.cap, -.2)); },
    bald: () => { P(8, 6, 2, 5, hc); P(22, 6, 2, 5, hc); P(12, 3, 5, 1, shade(sk, .35)); P(9, 3, 14, 1, shade(sk, .1)); },
    goggles: () => { P(8, 0, 16, 4, hc); P(8, 3, 2, 6, hc); P(22, 3, 2, 6, hc); P(11, 0, 5, 1, hcL); P(8, 4, 16, 2, '#5a3a20'); P(10, 3, 5, 4, ink); P(17, 3, 5, 4, ink); P(11, 4, 3, 2, '#73eff7'); P(18, 4, 3, 2, '#73eff7'); P(11, 4, 1, 1, '#ffffff'); P(18, 4, 1, 1, '#ffffff'); },
    hood: () => { const hd = L.hood; P(7, 0, 18, 17, hd); P(7, 0, 18, 1, shade(hd, .2)); P(23, 2, 2, 14, shade(hd, -.25)); if (L.ears) { P(8, -3, 3, 4, hd); P(21, -3, 3, 4, hd); } P(10, 4, 12, 10, sk); P(20, 4, 2, 10, skD);
      if (!dark) { if (L.mask) { P(10, 4, 12, 3, ink); P(10, 10, 12, 4, ink); P(12, 7, 3, 2, '#ffffff'); P(17, 7, 3, 2, '#ffffff'); P(13, 7, 2, 2, ink); P(18, 7, 2, 2, ink); } else { P(10, 4, 12, 3, ink); P(12, 8, 3, 2, '#ffffff'); P(17, 8, 3, 2, '#ffffff'); P(13, 8, 2, 2, ink); P(18, 8, 2, 2, ink); P(14, 12, 4, 1, shade(sk, -.38)); } } },
    helmet: () => { P(7, 0, 18, 16, hc); P(7, 0, 18, 1, shade(hc, .3)); P(8, 1, 6, 1, '#ffffff'); P(23, 2, 2, 13, shade(hc, -.25)); P(9, 6, 14, 5, ink); P(10, 7, 12, 3, '#b45bff'); if (!dark) { P(12, 8, 3, 1, Math.floor(t * 2) % 2 ? '#ffffff' : '#73eff7'); P(17, 8, 3, 1, Math.floor(t * 2) % 2 ? '#ffffff' : '#73eff7'); } P(6, 6, 2, 5, '#566c86'); P(24, 6, 2, 5, '#566c86'); P(15, -3, 2, 3, '#566c86'); P(14, -4, 4, 1, '#e43b44'); P(11, 12, 10, 1, shade(hc, -.3)); },
  };
  (H[L.hair] || H.short)();
  const A = { // 소품(★2·★3이면 업그레이드)
    camera: () => { P(21, 12, 14, 9, '#2a2a3a'); P(21, 12, 14, 1, '#3a4466'); P(33, 13, 4, 7, '#14141f'); P(34, 14, 2, 5, n >= 3 ? gold : '#73eff7'); P(24, 9, 7, 3, '#333c57'); P(23, 15, 6, 2, n >= 2 ? '#ffd24a' : '#566c86'); P(21, 20, 3, 6, '#2a2a3a'); if (n >= 3) P(21, 20, 14, 1, gold); if (!dark && Math.floor(t * 2) % 2) P(22, 13, 2, 2, '#ff004d'); },
    headset: () => { const k = n >= 3 ? gold : '#222633'; P(8, 0, 16, 2, '#222633'); P(6, 5, 3, 7, k); P(23, 5, 3, 7, k); P(7, 6, 1, 5, shade(k, .3)); P(8, 12, 5, 1, '#222633'); P(12, 12, 2, 2, n >= 2 ? '#ff004d' : '#566c86'); },
    glasses: () => { const k = n >= 3 ? gold : ink; P(10, 7, 5, 1, k); P(17, 7, 5, 1, k); P(10, 7, 1, 5, k); P(14, 7, 1, 5, k); P(17, 7, 1, 5, k); P(21, 7, 1, 5, k); P(10, 11, 5, 1, k); P(17, 11, 5, 1, k); P(15, 8, 2, 1, k); if (n >= 2 && !dark) { P(11, 8, 3, 3, '#3a4466'); P(18, 8, 3, 3, '#3a4466'); P(11, 8, 1, 1, '#94b0c2'); P(18, 8, 1, 1, '#94b0c2'); } },
    tablet: () => { P(10, 21, 12, 9, '#2a2a3a'); P(11, 22, 10, 7, n >= 3 ? (Math.floor(t * 4) % 2 ? '#73eff7' : '#ff77e1') : '#41a6f6'); P(12, 23, 5, 1, '#f4f4f4'); P(12, 25, 7, 1, shade('#41a6f6', .4)); P(12, 27, 4, 1, shade('#41a6f6', .4)); P(8, 25, 3, 3, sk); P(21, 25, 3, 3, sk); if (n >= 2) P(22, 21, 1, 6, '#f4f4f4'); },
    script: () => { P(0, 24, 7, 10, n >= 3 ? gold : '#f4f4f4'); for (let q = 0; q < 4; q++) P(1, 26 + q * 2, 5, 1, '#94b0c2'); P(0, 24, 7, 1, n >= 2 ? '#e43b44' : '#c2c3c7'); P(4, 29, 4, 3, sk); },
    coffee: () => { P(25, 25, 6, 7, n >= 3 ? gold : '#f4f4f4'); P(25, 27, 6, 2, '#8b5e3c'); P(25, 25, 6, 1, '#c2c3c7'); if (n >= 2) P(31, 27, 1, 3, '#f4f4f4'); if (!dark) { const st = Math.floor(t * 5) % 3; P(27 + (st % 2), 22 - st, 1, 2, '#c2c3c7'); P(29 - (st % 2), 21 - st, 1, 2, '#c2c3c7'); } },
    mic: () => { P(26, 21, 2, 10, '#333c57'); P(25, 16, 4, 5, '#14141f'); P(25, 16, 4, 1, '#566c86'); P(24, 21, 6, 3, n >= 3 ? gold : n >= 2 ? '#e43b44' : '#3b5dc9'); P(25, 22, 4, 1, '#f4f4f4'); },
    badge: () => { P(12, 17, 1, 8, '#e43b44'); P(19, 17, 1, 8, '#e43b44'); P(12, 25, 8, 6, n >= 2 ? gold : '#f4f4f4'); P(13, 26, 3, 3, '#94b0c2'); P(17, 26, 2, 1, '#566c86'); P(17, 28, 2, 1, '#566c86'); },
    scarf: () => { const k = '#f4f4f4'; P(9, 14, 14, 3, k); P(9, 16, 14, 1, '#c2c3c7'); P(21, 16, 3, 3, k); P(23 + f2, 18, 5, 2, k); P(26 + f2, 19, 3, 2, '#c2c3c7'); },
  };
  if (A[L.acc]) A[L.acc](); if (A[L.acc2]) A[L.acc2]();
}

// 스토리 대화창 얼굴: 카드 인물의 상반신(가로 26칸 x 세로 26칸)을 한 칸 = px 픽셀로 그린다
export function drawPortrait(c, id, px, t) {
  const L = LOOK[id] || LOOK.c1, sz = 26 * px; c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  c.fillStyle = '#1d2b53'; c.fillRect(0, 0, sz, sz); c.fillStyle = '#29366f'; for (let y = 0; y < sz; y += px * 2) c.fillRect(0, y, sz, px);
  c.save(); c.beginPath(); c.rect(0, 0, sz, sz); c.clip();
  figure((gx, gy, w, h, col) => { c.fillStyle = col; c.fillRect((gx - 3) * px, (gy + 4) * px, w * px, h * px); }, L, 1, t, false, CARDS.findIndex(cd => cd.id === id));
  c.restore();
}
