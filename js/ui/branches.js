// 지국 화면: 위쪽 픽셀 지도(국내 지국 + 해외 특파원, 본사와 연결선), 아래쪽 지국 목록(개설·확장 버튼)
import { BRANCHES, BR_MAX, brCost, EVENTS } from '../data/config.js';
import { brMul } from '../systems/economy.js';
import { fmt } from './hud.js';

// 지도(고해상도): 논리 320x190 좌표에 그리고 캔버스는 3배(960x570). 땅은 실제 경위도를 거칠게 따라 그린 픽셀 지도.
const BRM_W = 320, BRM_H = 190, BRM_S = 3, BRM_KX = 124; // 왼쪽 0~124: 한반도, 오른쪽 126~320: 세계
const BRM_KO = (lo, la) => [24 + (lo - 124) * 12.5, 22 + (43 - la) * 14.5]; // 한반도 확대 투영
const BRM_WO = (lo, la) => [128 + ((lo < -30 ? lo + 360 : lo) + 15) * .6, 24 + (75 - la) * 1.2]; // 태평양 중심 세계 투영
const BRM_LAND = { // [경도, 위도] 외곽선(가상 축약)
  ko: [[[124.3, 39.9], [125.5, 40.6], [126.8, 41.7], [128.2, 41.9], [129, 42.4], [130, 42.9], [130.7, 42.3], [129.8, 41.4], [129.7, 40.8], [128.7, 40], [127.6, 39.6], [127.5, 39.2], [128.3, 38.6], [128.6, 38.2], [129.1, 37.6], [129.4, 36.8], [129.5, 36], [129.4, 35.5], [129.1, 35.1], [128.5, 34.9], [127.7, 34.7], [127.3, 34.5], [126.5, 34.3], [126.3, 34.7], [126.5, 35.4], [126.6, 35.9], [126.5, 36.4], [126.2, 36.8], [126.6, 37], [126.6, 37.5], [126.1, 37.7], [125.6, 38], [125.2, 37.9], [124.8, 38.2], [125.1, 38.7], [125.4, 39.4], [124.9, 39.6]],
    [[126.15, 33.4], [126.5, 33.55], [126.95, 33.45], [126.85, 33.25], [126.3, 33.2]], // 제주
    [[110, 46], [133, 46], [133, 42.6], [130.7, 42.3], [130, 42.9], [129, 42.4], [128.2, 41.9], [126.8, 41.7], [125.5, 40.6], [124.3, 39.9], [123, 39.6], [121.3, 38.8], [121.6, 39.4], [122.2, 40.4], [121, 40.8], [110, 40]], // 대륙
    [[129.7, 33.6], [130.9, 34], [131.9, 33.4], [131.6, 32], [131, 31.3], [130.2, 31.4], [130.2, 32.7], [129.6, 33]], // 규슈
    [[130.9, 34], [131.4, 34.4], [132.5, 35.4], [134, 35.6], [136, 35.8], [136, 34], [134, 34.6], [132.3, 34.2], [131.8, 34]], // 혼슈 서쪽
    [[132.2, 33], [133, 33.8], [134.6, 34.2], [134.7, 33.7], [133.5, 33.3], [132.7, 32.8]], // 시코쿠
    [[129.2, 34.1], [129.45, 34.7], [129.5, 34.3]], // 대마도
    [[130.8, 37.45], [130.95, 37.55], [130.95, 37.45]], [[131.85, 37.23], [131.9, 37.27], [131.92, 37.22]]], // 울릉도·독도
  wo: [[[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [5, 53], [9, 57], [5, 62], [15, 69], [28, 71], [40, 67], [60, 69], [80, 73], [100, 77], [115, 74], [140, 72], [160, 70], [180, 67], [190, 65], [180, 62], [163, 58], [156, 51], [143, 53], [140, 47], [132, 43], [129, 41], [129.4, 35.5], [126.5, 34.5], [125, 38], [122, 40], [121, 37], [122, 31], [120, 25], [110, 21], [108, 16], [105, 9], [100, 13], [99, 8], [103, 1], [98, 16], [92, 22], [88, 21], [80, 15], [77, 8], [73, 20], [66, 25], [57, 25], [56, 27], [52, 24], [59, 22], [56, 17], [44, 12], [38, 22], [35, 30], [35, 36], [28, 37], [26, 40], [23, 36], [20, 40], [15, 38], [13, 44], [10, 44], [3, 43], [-5, 36]],
    [[-17, 21], [-17, 14], [-8, 5], [5, 5], [9, 4], [9, -2], [12, -6], [13, -17], [18, -34], [26, -34], [33, -26], [40, -15], [41, -2], [51, 12], [43, 12], [37, 22], [32, 31], [20, 32], [10, 37], [-6, 36], [-10, 30]],
    [[130, 31], [132, 33], [135, 34], [140, 35], [141, 38], [142, 41], [140, 41], [139, 38], [136, 36], [133, 35], [130, 34]], [[140, 42], [145, 43], [142, 45.5]],
    [[-5, 50], [1, 51], [0, 53], [-3, 56], [-5, 58], [-6, 55], [-3, 54], [-5, 52]],
    [[114, -22], [122, -18], [130, -12], [136, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [131, -31], [115, -34]],
    [[95, 5], [106, -6], [104, -5], [98, 1]], [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]], [[120, 18], [122, 18], [124, 12], [126, 7], [122, 7], [120, 13]],
    [[-168, 66], [-160, 71], [-140, 70], [-120, 70], [-95, 72], [-80, 73], [-65, 60], [-55, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 29], [-97, 26], [-97, 21], [-92, 18], [-87, 21], [-88, 16], [-83, 9], [-78, 8], [-72, 12], [-62, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -27], [-58, -38], [-65, -41], [-68, -54], [-74, -50], [-71, -30], [-70, -18], [-76, -13], [-81, -5], [-80, 1], [-79, 7], [-83, 8], [-86, 12], [-92, 15], [-105, 20], [-110, 24], [-112, 30], [-117, 32], [-124, 40], [-124, 48], [-130, 55], [-140, 60], [-152, 58], [-165, 60]],
    [[-55, 60], [-44, 60], [-20, 70], [-18, 78], [-60, 80], [-70, 76]]],
};
// 지국 위치(경위도)와 이름표 방향: [경도, 위도, 이름표 x, y 오프셋, 정렬]
const BRM_POS = { busan: [129.07, 35.18, 8, 3], daejeon: [127.38, 36.35, 8, 3], gwangju: [126.85, 35.16, -8, 3, 'right'], jeju: [126.53, 33.5, 8, 3],
  tokyo: [139.7, 35.7, 7, 13], beijing: [116.4, 39.9, -6, -5, 'right'], dc: [-77, 38.9, -4, -9, 'right'], paris: [2.35, 48.86, 6, -5] };
const BRM_HQ = BRM_KO(126.98, 37.57), BRM_HQW = BRM_WO(126.98, 37.57), BR_EVK = Object.fromEntries(EVENTS.map(e => [e.id, e.k]));
const BRM_KOF = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
function brmLand() { // 땅 한 장을 미리 그려 둔다(해안선·얕은 바다·사막·눈·산맥 색을 픽셀 단위로 입힘)
  const cv = document.createElement('canvas'); cv.width = BRM_W; cv.height = BRM_H; const g = cv.getContext('2d');
  const poly = (pts, pr) => { g.beginPath(); pts.forEach(([lo, la], i) => { const [x, y] = pr(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); };
  g.save(); g.beginPath(); g.rect(0, 0, BRM_KX, BRM_H); g.clip(); BRM_LAND.ko.forEach((p, i) => { g.fillStyle = i === 0 || i === 1 || i >= 7 ? '#ffffff' : '#808080'; poly(p, BRM_KO); if (i >= 7) { const [x, y] = BRM_KO(p[0][0], p[0][1]); g.fillRect(Math.round(x), Math.round(y), 2, 2); } }); g.restore();
  g.save(); g.beginPath(); g.rect(BRM_KX + 3, 0, BRM_W, BRM_H); g.clip(); g.fillStyle = '#ffffff'; BRM_LAND.wo.forEach(p => poly(p, BRM_WO)); g.restore();
  const im = g.getImageData(0, 0, BRM_W, BRM_H), d = im.data, L = new Uint8Array(BRM_W * BRM_H);
  for (let i = 0; i < L.length; i++) L[i] = d[i * 4 + 3] > 110 ? (d[i * 4] / (d[i * 4 + 3] / 255) > 190 ? 1 : 2) : 0; // 1: 한반도·세계, 2: 주변국(국내 지도)
  const at = (x, y) => x < 0 || y < 0 || x >= BRM_W || y >= BRM_H ? 0 : L[y * BRM_W + x], hx = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const C = { sea: rgb('#16264e'), sea2: rgb('#1b2d5c'), shal: rgb('#22396e'), edge: rgb('#2b4636'), land: rgb('#4f7a5a'), land2: rgb('#5a8865'), ridge: rgb('#7aa47c'), oth: rgb('#4b5a5a'), oth2: rgb('#55655f'), othE: rgb('#323d40'), sand: rgb('#b8a062'), sand2: rgb('#c6ad6c'), snow: rgb('#d6e2ea'), snow2: rgb('#bccbd6') };
  for (let y = 0; y < BRM_H; y++) for (let x = 0; x < BRM_W; x++) {
    const i = y * BRM_W + x, l = L[i], wo = x > BRM_KX + 2, la = wo ? 75 - (y - 24) / 1.2 : 43 - (y - 22) / 14.5, lo = wo ? (x - 128) / .6 - 15 : 124 + (x - 24) / 12.5;
    let k;
    if (!l) { let near = 0; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (at(x + dx, y + dy)) { near = 1; break; } k = near ? C.shal : (y % 4 === 0 && hx(x >> 3, y) < .3 ? C.sea2 : C.sea); }
    else if (l === 2) k = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1) ? C.othE : hx(x, y) < .22 ? C.oth2 : C.oth;
    else if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1) || at(x - 1, y) === 2 || at(x, y - 1) === 2) k = C.edge;
    else if (wo && la > 64) k = hx(x, y) < .3 ? C.snow2 : C.snow;
    else if (wo && ((la > 15 && la < 31 && lo > -15 && lo < 58) || (la < -20 && la > -32 && lo > 118 && lo < 142))) k = hx(x, y) < .3 ? C.sand2 : C.sand;
    else if (!wo && lo > 127.3 && lo < 129.4 && la > 35.6 && la < 41 && Math.abs(lo - (128 + (38.5 - la) * .35)) < .5 && hx(x >> 1, y >> 1) < .45) k = C.ridge; // 태백산맥 줄기
    else k = hx(x, y) < .22 ? C.land2 : C.land;
    d[i * 4] = k[0]; d[i * 4 + 1] = k[1]; d[i * 4 + 2] = k[2]; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0); return cv;
}
export function Branches(bus) {
  const $b = id => document.getElementById(id), cv = $b('brmap'), c = cv.getContext('2d');
  cv.width = BRM_W * BRM_S; cv.height = BRM_H * BRM_S; c.setTransform(BRM_S, 0, 0, BRM_S, 0, 0); c.imageSmoothingEnabled = false;
  const R = (x, y, w, h, k) => { c.fillStyle = k; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const T = (str, x, y, n, k, al = 'left') => { c.font = `bold ${n}px ${BRM_KOF}`; c.textAlign = al; c.fillStyle = k; c.fillText(str, x, y); c.textAlign = 'left'; };
  let land = null, landD = null;
  $b('brlist').innerHTML = BRANCHES.map(b => `<div class="wg brrow" id="brw-${b.id}"><div class="row2"><span><b>${b.n}</b> <small class="brk">${b.k}</small><br><small id="brd-${b.id}"></small></span><button class="btn mini" data-br="${b.id}" id="brb-${b.id}"></button></div></div>`).join('');
  $b('brlist').onclick = e => { const x = e.target.closest('[data-br]'); if (x && !x.disabled) bus.emit('brup', x.dataset.br); };
  let last = '';
  return {
    render(s) { // 목록: 바뀐 것만 다시 쓴다
      const br = s.br || {}, key = JSON.stringify(br) + '|' + Math.floor(Math.log10(1 + s.score) * 20);
      if (key === last) return; last = key;
      const open = BRANCHES.filter(b => br[b.id]).length;
      $b('brsum').textContent = `${open}/${BRANCHES.length}곳 운영 · 전체 점수 x${brMul(s).toFixed(2)}`;
      BRANCHES.forEach((b, i) => {
        const lv = br[b.id] || 0, prev = i === 0 || br[BRANCHES[i - 1].id], cost = brCost(b, lv), btn = $b('brb-' + b.id), max = lv >= BR_MAX;
        $b('brw-' + b.id).classList.toggle('off', !prev && !lv);
        $b('brd-' + b.id).textContent = !prev && !lv ? `앞 지국을 먼저 열어야 해요` : lv ? `Lv.${lv} · 점수 +${Math.round(lv * b.pct * 100)}% · ${BR_EVK[b.ev]} 속보 +${20 + 2 * lv}%` : `열면 점수 +${Math.round(b.pct * 100)}% · ${BR_EVK[b.ev]} 속보 +22%`;
        btn.textContent = max ? 'MAX' : `${lv ? '확장' : '개설'} ${fmt(cost)}`; btn.disabled = max || (!prev && !lv) || s.score < cost; btn.classList.toggle('can', !btn.disabled);
      });
    },
    draw(s, t) { // 지도
      const br = s.br || {}; if (!land) { land = brmLand(); landD = land.getContext('2d').getImageData(0, 0, BRM_W, BRM_H).data; }
      c.drawImage(land, 0, 0);
      for (let i = 0; i < 14; i++) { const y = 30 + (i * 37) % 150, x = (i * 71 + t * 4) % (BRM_W + 30) - 20; if (landD[(y * BRM_W + Math.max(0, Math.min(BRM_W - 1, x | 0))) * 4 + 1] < 60 && !(x > BRM_KX - 4 && x < BRM_KX + 8)) R(x, y, 6, 1, '#2c4680'); } // 잔물결
      c.globalAlpha = .18; for (let la = -30; la <= 60; la += 30) { const y = BRM_WO(0, la)[1]; for (let x = BRM_KX + 6; x < BRM_W; x += 6) R(x, y, 3, 1, la ? '#94b0c2' : '#ffcd75'); } c.globalAlpha = 1; // 위도선·적도
      R(BRM_KX, 0, 3, BRM_H, '#0b0b14'); R(BRM_KX + 1, 0, 1, BRM_H, '#333c57');
      R(0, 0, BRM_W, 16, '#0b0b14cc'); T('국내 지국', 6, 12, 10, '#b8c6d6'); T('해외 특파원', BRM_KX + 8, 12, 10, '#b8c6d6');
      const at = b => { const [lo, la] = BRM_POS[b.id]; return b.k === '해외' ? BRM_WO(lo, la) : BRM_KO(lo, la); };
      BRANCHES.forEach((b, i) => { // 본사 → 지국: 흐르는 점선(해외는 곡선 항로 + 비행기)
        if (!br[b.id]) return; const ov = b.k === '해외', [hx, hy] = ov ? BRM_HQW : BRM_HQ, [x, y] = at(b), dx = x - hx, dy = y - hy, len = Math.hypot(dx, dy), m = Math.max(4, len / 4 | 0), arc = f => ov ? -Math.sin(f * Math.PI) * len * .22 : 0;
        for (let k = 0; k < m; k++) { if (k % 2) continue; const f = ((k + t * 3) % m) / m; R(hx + dx * f - .5, hy + dy * f + arc(f) - .5, 1.5, 1.5, ov ? '#ffcd75' : '#73eff7'); }
        if (ov && len > 20) { const f = (t * .15 + i * .37) % 1, ax = hx + dx * f, ay = hy + dy * f + arc(f), dir = dx > 0 ? 1 : -1; R(ax - 3, ay - .5, 7, 2, '#f4f4f4'); R(ax - .5, ay - 2.5, 2, 6, '#f4f4f4'); R(ax - 3 * dir - (dir < 0 ? 1 : 0), ay - 2, 1.5, 3, '#f4f4f4'); R(ax + 3 * dir - (dir > 0 ? 1 : 0), ay - .5, 1, 2, '#e43b44'); }
      });
      const tag = (str, x, y, k, al = 'left', sz = 8.5) => { c.font = `bold ${sz}px ${BRM_KOF}`; const w = c.measureText(str).width, x0 = al === 'right' ? x - w : al === 'center' ? x - w / 2 : x; R(x0 - 2.5, y - sz + .5, w + 5, sz + 3.5, '#0b0b14d0'); T(str, x0, y + .5, sz, k); };
      BRANCHES.forEach((b, i) => { // 지국 핀 + 이름표
        const lv = br[b.id] || 0, on = lv > 0, prev = i === 0 || br[BRANCHES[i - 1].id], ov = b.k === '해외', [x, y] = at(b), col = on ? (ov ? '#ffcd75' : '#73eff7') : '#566c86', p = BRM_POS[b.id];
        if (on) { R(x - .5, y - 9, 1.5, 6, '#c2c3c7'); R(x - 2.5, y - 10, 5.5, 1.5, '#c2c3c7'); if ((t * 2 + i) % 2 < 1) R(x - .5, y - 12, 1.5, 1.5, '#ff2e4d'); c.globalAlpha = .35 * (1 - (t * .8 + i * .2) % 1); R(x - 5 - ((t * .8 + i * .2) % 1) * 4, y - 5 - ((t * .8 + i * .2) % 1) * 4, 11 + ((t * .8 + i * .2) % 1) * 8, 11 + ((t * .8 + i * .2) % 1) * 8, col); c.globalAlpha = 1; }
        R(x - 3, y - 3, 7, 7, '#0b0b14'); R(x - 2, y - 2, 5, 5, col); if (on && (t * 2 + b.id.length) % 2 < 1) R(x - 1, y - 1, 3, 3, '#ffffff');
        const nm = b.n.split(' ')[0]; tag(on ? `${nm} Lv.${lv}` : nm, x + p[2], y + p[3], on ? '#ffffff' : prev ? '#a7f070' : '#8b9bb4', p[4] || 'left');
      });
      [[BRM_HQ, '서울 본사', -7, 3, 'right'], [BRM_HQW, '서울', 0, 14, 'center']].forEach(([[x, y], nm, lx, ly, al]) => { // 본사
        R(x - 4, y - 4, 9, 9, '#0b0b14'); R(x - 3, y - 3, 7, 7, '#e43b44'); R(x - 1, y - 1, 3, 3, '#ffcd75'); R(x - .5, y - 11, 1.5, 7, '#f4f4f4'); if ((t * 2) % 2 < 1) R(x - 1.5, y - 13, 3.5, 2.5, '#ff2e4d');
        tag(nm, x + lx, y + ly, '#ffcd75', al);
      });
    },
  };
}
