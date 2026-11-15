import { MILESTONES, CARDS, RARITY, DECOS } from '../data/config.js';
import { drawCards } from './cardart.js';
// 16비트풍 픽셀 렌더러: 그라데이션 밴드, 베벨 셰이딩, 음영 있는 캐릭터, 단계별 외형 변화(tier 0~4)
const COL = ['#41a6f6', '#38b764', '#ffcd75', '#b13e53', '#f4f4f4'];
const IDS = ['crew', 'ing', 'edit', 'cg', 'out', 'live', 'qual'];
const GY = 54, memo = {};
const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const lerp = (a, b, t) => { const k = a + b + t; return memo[k] || (memo[k] = hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t))); };
const mix = (k, a) => a > 0 ? lerp(k, '#ffffff', a) : lerp(k, '#000000', -a);
const R = (c, x, y, w, h, k) => { c.fillStyle = k; c.fillRect(x, y, w, h); };
const bx = (c, x, y, w, h, k) => { R(c, x, y, w, h, k); R(c, x, y, w, 1, mix(k, .35)); R(c, x, y, 1, h, mix(k, .2)); R(c, x, y + h - 1, w, 1, mix(k, -.35)); R(c, x + w - 1, y, 1, h, mix(k, -.25)); };
const sky = (c, a, b) => { for (let i = 0; i < 9; i++) R(c, 0, i * 6, 320, 7, lerp(a, b, i / 8)); };
const FLOORC = ['#2b3050', '#2b4a60', '#3a4a8a', '#5a3a7a', '#8a6a1a'];
const ground = (c, k) => { const f = FLOORC[k]; R(c, 0, GY, 320, 10, f); R(c, 0, GY, 320, 1, mix(f, .4)); R(c, 0, GY + 4, 320, 1, mix(f, -.25)); };
const SPR = ['...HHHH...', '..HhHHHH..', '..HSSSSH..', '..SESSES..', '..SSSSSs..', '...SSSs...', '..BBBBBB..', '.BBBBBBbB.', '.SBBBBbBS.', '.SBBBBbBS.', '..BBBBbb..', '..LLLLLL..', '..LL..LL..', '..KK..KK..'];
const PAL = (B, H = '#3b2a20') => ({ H, h: mix(H, .35), S: '#f2c9a0', s: '#d49a74', E: '#0b0b14', B, b: mix(B, -.3), L: '#3a4466', K: '#14141f' });
const person = (c, x, y, p) => SPR.forEach((row, j) => { for (let i = 0; i < 10; i++) { const ch = row[i]; if (ch !== '.') R(c, x + i * 2, y + j * 2, 2, 2, p[ch]); } });
const bob = (a, t, n = 6) => a ? (t * n | 0) % 2 : 0;
const screen = (c, x, y, w, h, k) => { bx(c, x, y, w, h, '#14141f'); R(c, x + 2, y + 2, w - 4, h - 4, k); for (let j = y + 3; j < y + h - 2; j += 2) R(c, x + 2, j, w - 4, 1, mix(k, -.12)); R(c, x + 3, y + 3, 3, 2, mix(k, .5)); };
const blink = (t, n = 2) => (t * n | 0) % 2;
const text = (c, s, x, y, px, k = '#ffffff') => { c.fillStyle = k; c.font = px + 'px "Press Start 2P",monospace'; c.fillText(s, x, y); };

function van(c, x, col, a, t, k) {
  bx(c, x, GY - 24, 58, 22, col); bx(c, x + 44, GY - 18, 16, 16, mix(col, -.1)); R(c, x + 48, GY - 16, 10, 7, '#7fc8ff');
  R(c, x, GY - 12, 58, 3, '#e0475a'); R(c, x + 8, GY - 4, 10, 8, '#14141f'); R(c, x + 38, GY - 4, 10, 8, '#14141f');
  R(c, x + 22, GY - 38, 2, 14, '#8a93a6'); c.fillStyle = '#d0d8e4'; c.beginPath(); c.arc(x + 23, GY - 40, 9, Math.PI, 0); c.fill();
  if (k >= 1) { R(c, x + 8, GY - 32, 2, 8, '#8a93a6'); c.beginPath(); c.arc(x + 9, GY - 33, 5, Math.PI, 0); c.fill(); }
  if (a) { c.strokeStyle = '#ffffff'; c.beginPath(); c.arc(x + 23, GY - 40, 12 + (t * 10) % 8, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); }
}

const DRAW = [
  // 0 취재: 카메라 든 영상기자 + 원고 쓰는 취재기자
  (c, s, t, a, k) => {
    sky(c, '#1b2a5c', '#5a68b0'); if (k >= 3) R(c, 276, 6, 10, 10, '#fff3c4');
    if (k >= 2) [[20, 22, 20], [52, 14, 16], [240, 20, 18], [268, 12, 14], [296, 24, 20]].forEach(([x, y, w]) => R(c, x, y, w, GY - y, '#2a3a78'));
    [[6, 26, 22], [34, 16, 26], [64, 30, 16], [250, 22, 24], [280, 12, 30], [306, 28, 14]].forEach(([x, y, w]) => { bx(c, x, y, w, GY - y, '#171b3a'); for (let j = 0; j < 3; j++) for (let m = 0; m < (w / 6 | 0); m++) R(c, x + 3 + m * 6, y + 4 + j * 7, 3, 3, (t * 1.5 + x + m + j | 0) % 3 ? '#ffd878' : '#171b3a'); });
    ground(c, k);
    person(c, 84, GY - 28 + bob(a, t, 3), PAL('#3f7fe0')); bx(c, 100, GY - 26 + bob(a, t, 3), 17, 10, '#14141f'); bx(c, 115, GY - 24 + bob(a, t, 3), 6, 6, '#566c86'); R(c, 103, GY - 24, 2, 2, a && blink(t) ? '#ff5c5c' : '#5c1f2a');
    person(c, 188, GY - 28 + bob(a, t), PAL('#e8b04a', '#6b4a2b')); bx(c, 206, GY - 16, 13, 15, '#f4f4f4'); [0, 3, 6].forEach(j => R(c, 208, GY - 13 + j, j < 6 ? 9 : 6, 1, '#8a93a6')); if (a) R(c, 208 + (t * 8 | 0) % 7, GY - 5, 2, 2, '#14141f');
    if (k >= 1) { const x = (t * 22) % 360 - 20; R(c, x, 10, 10, 3, '#14141f'); R(c, x - 3, 8, 16, 1, blink(t, 20) ? '#94b0c2' : '#566c86'); R(c, x + 4, 13, 2, 2, '#ff5c5c'); }
    if (k >= 2) { person(c, 138, GY - 28 + bob(a, t, 4), PAL('#8f5fd6')); R(c, 150, GY - 34, 22, 2, '#8a93a6'); bx(c, 170, GY - 38, 7, 7, '#14141f'); }
  },
  // 1 인제스트: 서버 랙 + 모니터 벽, 파일 입고
  (c, s, t, a, k) => {
    sky(c, '#1c2a4a', '#2c3e6c'); ground(c, k);
    for (let r = 0; r < Math.min(2, 1 + k); r++) { const x = 8 + r * 30; bx(c, x, 6, 26, GY - 6, '#3a4466'); for (let j = 0; j < 5; j++) { bx(c, x + 2, 9 + j * 9, 22, 6, '#1c2038'); R(c, x + 18, 11 + j * 9, 3, 3, (t * 3 + j + r | 0) % 2 ? '#4cff9a' : '#1d5a38'); } }
    const cols = k >= 3 ? 4 : 3, w = k >= 3 ? 27 : 34;
    for (let m = 0; m < cols * 2; m++) { const x = 112 + (m % cols) * (w + 4), y = 6 + (m / cols | 0) * 21; screen(c, x, y, w, 18, ['#41a6f6', '#38b764', '#ffcd75', '#b13e53', '#73eff7', '#94b0c2', '#e86aff', '#ff9f5a'][m]); if (a) R(c, x + 3, y + 13, (t * 20 + m * 7) % (w - 6), 2, '#ffffff'); }
    person(c, 76, GY - 28 + bob(a, t, 4), PAL('#38b764')); bx(c, 66, GY - 10, 40, 6, '#7a5230');
    if (a) for (let m = 0; m < 2; m++) bx(c, 40 + (t * 50 + m * 38) % 70, 22 + m * 9, 7, 6, '#ffcd75');
  },
  // 2 편집: 모니터 두 대(+ 3번째 오디오) 워크스테이션
  (c, s, t, a, k) => {
    sky(c, '#161826', '#232845'); if (k >= 3) { R(c, 0, 3, 320, 1, '#37f0ff'); R(c, 0, GY - 2, 320, 1, '#37f0ff'); }
    ground(c, k);
    if (k >= 1) { bx(c, 44, 16, 12, 18, '#2a2f4a'); bx(c, 244, 16, 12, 18, '#2a2f4a'); R(c, 48, 22, 4, 4, '#14141f'); R(c, 248, 22, 4, 4, '#14141f'); }
    screen(c, 70, 2, 56, 28, '#2d3e5c'); R(c, 80, 18, 20, 10, '#1c2a44'); R(c, 108, 8, 9, 9, '#f5d27a');
    screen(c, 132, 2, 56, 28, '#181b2c'); [[0, 8, 18, '#41a6f6'], [20, 8, 14, '#38b764'], [36, 8, 12, '#41a6f6'], [0, 18, 26, '#ffcd75'], [28, 18, 20, '#ffcd75']].forEach(([x, y, w, kk]) => bx(c, 135 + x, 2 + y, w, 7, kk)); R(c, 135 + (a ? (t * 16) % 48 : 24), 4, 2, 24, '#ff5c5c');
    if (k >= 2) { screen(c, 194, 2, 40, 28, '#16222c'); for (let m = 0; m < 10; m++) { const h = a ? 4 + ((Math.sin(t * 5 + m) + 1) * 6 | 0) : 4; R(c, 198 + m * 3, 26 - h, 2, h, '#4cff9a'); } }
    person(c, 140, GY - 28 + bob(a, t, 5), PAL('#ffcd75')); R(c, 143, GY - 27, 14, 2, '#b13e53'); R(c, 142, GY - 23, 3, 5, '#b13e53'); R(c, 155, GY - 23, 3, 5, '#b13e53');
    bx(c, 60, 42, 170, 6, '#7a5230'); R(c, 66, 48, 4, 6, '#5a3a20'); R(c, 216, 48, 4, 6, '#5a3a20'); bx(c, 128, 40, 28, 3, '#94b0c2'); bx(c, 208, 35, 6, 7, '#f4f4f4'); if (a) R(c, 210, 30 - (t * 6 | 0) % 3, 1, 3, '#94b0c2');
  },
  // 3 CG: 로어서드·도형 작업, 팔레트, 타블렛
  (c, s, t, a, k) => {
    sky(c, '#2a1a3d', '#43285c'); ground(c, k);
    screen(c, 64, 2, 100, 30, '#2d3e5c'); bx(c, 92, 8, 10, 10, '#ffcd75'); bx(c, 114, 9, 11, 11, '#41a6f6'); c.strokeStyle = '#ffffff'; c.strokeRect(113.5, 8.5, 12, 12);
    const w = a ? 20 + (t * 30) % 76 | 0 : 76; bx(c, 70, 23, w, 5, '#b13e53'); R(c, 70, 19, Math.min(w, 44), 2, '#f4f4f4'); if (a) R(c, 94 + (t * 20) % 50, 12, 3, 4, '#ffffff');
    bx(c, 174, 4, 20, 42, '#333c57'); ['#b13e53', '#ffcd75', '#38b764', '#41a6f6'].forEach((kk, i) => bx(c, 178, 8 + i * 9, 12, 7, kk));
    if (k >= 1) { screen(c, 204, 4, 34, 28, '#10283a'); const r = a ? t * 2 : 0; c.strokeStyle = '#4cff9a'; c.strokeRect(212.5, 14.5, 13, 13); c.strokeRect(217.5 + Math.sin(r) * 2, 10.5, 13, 13); }
    person(c, 104, GY - 28 + bob(a, t, 4), PAL('#b13e53', '#14141f')); bx(c, 84, GY - 12, 70, 6, '#7a5230'); bx(c, 124, GY - 15, 18, 3, '#566c86'); if (a) R(c, 128 + (t * 10) % 8, GY - 14, 2, 1, '#ffffff');
    if (k >= 2) { person(c, 250, GY - 28 + bob(a, t, 5), PAL('#2fb8a0', '#e8e0d0')); bx(c, 236, GY - 12, 44, 6, '#7a5230'); }
  },
  // 4 송출: 뉴스 스튜디오, 앵커, 카메라, ON AIR
  (c, s, t, a, k) => {
    sky(c, '#12205a', '#24409a'); bx(c, 64, 4, 192, 40, k >= 2 ? '#2346b0' : '#1f3a8a');
    [[70, 12, 24, 10], [100, 22, 16, 9], [214, 18, 22, 14], [240, 10, 10, 8]].forEach(([x, y, w, h]) => bx(c, x, y, w, h, '#38b764'));
    bx(c, 126, 8, 68, 12, '#b13e53'); text(c, 'NEWS', 140, 18, 8); if (k >= 2) { R(c, 66, 38, 188, 4, '#14141f'); R(c, 66 + (t * 40) % 170, 38, 18, 4, '#ffcd75'); }
    ground(c, k);
    person(c, k >= 1 ? 128 : 142, GY - 28 + bob(a, t, 3), PAL('#2b2f4a', '#14141f')); if (k >= 1) person(c, 160, GY - 28 + bob(a, t, 3), PAL('#7a2b5a', '#d8a050'));
    bx(c, 96, GY - 14, 128, 8, '#5a6a8a'); bx(c, 140, GY - 11, 40, 4, '#b13e53');
    R(c, k >= 1 ? 137 : 151, GY - 20, 2, 6, '#b13e53');
    bx(c, 24, GY - 28, 26, 16, '#14141f'); bx(c, 48, GY - 24, 8, 8, '#566c86'); R(c, 34, GY - 12, 3, 12, '#566c86'); R(c, 27, GY - 26, 3, 3, a ? '#ff5c5c' : '#5c1f2a');
    bx(c, 266, 6, 48, 16, a && blink(t) ? '#ff4a4a' : '#5c1f2a'); text(c, 'ON AIR', 270, 18, 7);
    if (k >= 3) { c.globalAlpha = .13; c.fillStyle = '#fff6c0'; [[80, 60, 110], [240, 215, 270]].forEach(([x, a1, a2]) => { c.beginPath(); c.moveTo(x, 0); c.lineTo(a1, GY); c.lineTo(a2, GY); c.fill(); }); c.globalAlpha = 1; }
  },
  // 5 중계 장비: 중계 차량 + 리포터
  (c, s, t, a, k) => {
    sky(c, '#2a6fb0', '#bfe6ff'); R(c, 30, 10, 26, 6, '#ffffff'); R(c, 38, 6, 14, 6, '#ffffff'); R(c, 220, 14, 32, 6, '#ffffff');
    if (k >= 3) { const x = (t * 30) % 380 - 30; R(c, x, 12, 16, 7, '#e8e8ea'); R(c, x + 14, 14, 10, 2, '#e8e8ea'); R(c, x - 2, 9, 20, 1, blink(t, 20) ? '#14141f' : '#566c86'); R(c, x + 3, 19, 8, 1, '#14141f'); }
    ground(c, 1); R(c, 0, GY + 5, 320, 5, '#3a3f4f'); for (let x = 0; x < 320; x += 32) R(c, x, GY + 7, 16, 1, '#e8e8ea');
    van(c, 20, k >= 4 ? '#ffd24a' : '#f4f4f4', a, t, k); if (k >= 2) van(c, 232, '#f4f4f4', a, t, k);
    person(c, 120, GY - 28 + bob(a, t, 3), PAL('#e0475a')); bx(c, 138, GY - 20, 3, 8, '#14141f'); R(c, 137, GY - 22, 5, 3, '#ffcd75');
    person(c, 160, GY - 28 + bob(a, t, 4), PAL('#3f7fe0')); bx(c, 176, GY - 26, 15, 9, '#14141f'); R(c, 188, GY - 24, 5, 5, '#566c86');
    bx(c, 94, 4, 40, 14, a && blink(t) ? '#e83a3a' : '#6a2020'); text(c, 'LIVE', 100, 15, 8);
  },
  // 6 방송 품질: 화질 배지(SD→8K), 별점, 시청률 그래프, 트로피
  (c, s, t, a, k) => {
    sky(c, '#241a3a', '#3a2a5a'); ground(c, k);
    bx(c, 92, 4, 136, 46, '#14141f'); ['#ffffff', '#ffee55', '#33d6e6', '#38c060', '#d84ae0', '#e03a3a', '#3a4ae0'].forEach((kk, i) => R(c, 96 + i * 18, 8, 18, 26, mix(kk, k < 1 ? -.35 : 0)));
    R(c, 96, 34, 128, 12, '#222633'); bx(c, 144, 18, 40, 15, '#14141f'); text(c, ['SD', 'HD', 'FHD', '4K', '8K'][k], 150, 30, 9);
    for (let i = 0; i <= k; i++) { R(c, 104 + i * 9, 36, 2, 6, '#ffd24a'); R(c, 102 + i * 9, 38, 6, 2, '#ffd24a'); }
    for (let i = 0; i < 5; i++) { const h = 6 + i * 4 + k * 4 + (a ? (Math.sin(t * 3 + i) + 1) * 2 | 0 : 0); bx(c, 246 + i * 11, GY - h, 9, h, i <= k ? '#38b764' : '#3a4466'); }
    if (k >= 2) { bx(c, 36, GY - 26, 20, 14, '#ffd24a'); R(c, 43, GY - 12, 6, 8, '#ffd24a'); bx(c, 36, GY - 4, 20, 4, '#8a6a1a'); }
  },
  // 7 영상편집팀장: 14대 모니터로 실시간 편집을 감시 (고용 전에는 모니터가 꺼져 있음)
  (c, s, t, a, k) => {
    sky(c, '#0f1220', '#1a1f38'); ground(c, 0);
    const on = k > 0, cl = ['#41a6f6', '#38b764', '#ffcd75', '#b13e53', '#73eff7', '#e86aff'];
    for (let m = 0; m < 14; m++) {
      const x = 4 + (m % 7) * 45, y = 2 + (m / 7 | 0) * 17;
      screen(c, x, y, 41, 15, on ? '#181b2c' : '#0c0e16');
      if (on) { [[3, 12, 0], [16, 9, 1], [27, 9, 2]].forEach(([dx, w, j]) => R(c, x + dx, y + 6, w, 3, cl[(m + j) % 6])); R(c, x + 3 + (t * 10 + m * 5) % 34, y + 3, 1, 9, '#ff5c5c'); }
    }
    if (on) {
      const m = (t | 0) % 14, x = 4 + (m % 7) * 45, y = 2 + (m / 7 | 0) * 17; c.strokeStyle = blink(t, 4) ? '#ffd24a' : '#ffffff'; c.strokeRect(x - .5, y - .5, 42, 16);
      person(c, 150, GY - 28 + bob(a, t, 2), PAL('#2b2f4a', '#14141f')); R(c, 153, GY - 27, 14, 2, '#566c86'); R(c, 152, GY - 23, 3, 5, '#566c86'); R(c, 165, GY - 23, 3, 5, '#566c86'); R(c, 152, GY - 18, 6, 1, '#566c86'); R(c, 159, GY - 17, 2, 6, '#b13e53');
    } else bx(c, 148, GY - 22, 22, 18, '#3a4466');
    bx(c, 96, GY - 12, 128, 6, '#5a3a20'); bx(c, 134, GY - 14, 28, 3, '#94b0c2'); bx(c, 190, GY - 19, 6, 7, '#f4f4f4'); if (on) R(c, 192, GY - 24 - (t * 6 | 0) % 3, 1, 3, '#94b0c2');
    bx(c, 282, 37, 34, 12, on && blink(t) ? '#ff4a4a' : '#5c1f2a'); text(c, 'ON AIR', 285, 46, 6);
  },
];

// 사무실 꾸미기 소품 (DECOS의 fl 층에 그린다)
const DECO_DRAW = {
  plant: c => { R(c, 9, GY - 20, 2, 8, '#38b764'); R(c, 5, GY - 18, 4, 3, '#38b764'); R(c, 11, GY - 22, 5, 3, '#a7f070'); R(c, 4, GY - 14, 4, 2, '#257179'); R(c, 12, GY - 15, 5, 2, '#38b764'); bx(c, 5, GY - 10, 11, 10, '#b86f50'); },
  coffee: (c, t) => { bx(c, 40, GY - 18, 14, 18, '#566c86'); R(c, 42, GY - 16, 10, 4, '#1a1c2c'); R(c, 43, GY - 15, 2, 2, blink(t) ? '#38b764' : '#257179'); R(c, 44, GY - 9, 6, 6, '#f4f4f4'); R(c, 45, GY - 8, 4, 2, '#5a3a20'); R(c, 46, GY - 13 - (t * 5 | 0) % 3, 1, 2, '#94b0c2'); },
  cat: (c, t) => { const x = 10 + Math.abs(((t * 14) % 260) - 130), d = ((t * 14) % 260) < 130 ? 1 : -1, y = GY - 7, f = (t * 6 | 0) % 2;
    R(c, x, y, 10, 5, '#ef7d57'); R(c, x + (d > 0 ? 8 : -3), y - 3, 5, 5, '#ef7d57'); R(c, x + (d > 0 ? 8 : -3), y - 4, 1, 1, '#ef7d57'); R(c, x + (d > 0 ? 12 : 1), y - 4, 1, 1, '#ef7d57');
    R(c, x + (d > 0 ? 10 : -2), y - 2, 1, 1, '#14141f'); R(c, x + (d > 0 ? -2 : 10), y - 3, 2, 4, '#ef7d57'); R(c, x + 1 + f, y + 5, 2, 2, '#ef7d57'); R(c, x + 7 - f, y + 5, 2, 2, '#ef7d57'); },
  sofa: c => { bx(c, 4, GY - 14, 34, 8, '#5d275d'); bx(c, 4, GY - 8, 34, 8, '#b13e53'); bx(c, 2, GY - 11, 4, 11, '#5d275d'); bx(c, 36, GY - 11, 4, 11, '#5d275d'); R(c, 10, GY - 12, 9, 4, '#ffcd75'); },
  neon: (c, t) => { const k = blink(t, 1.5) ? '#ff4ad6' : '#7a2a6a'; R(c, 6, 6, 52, 13, '#14141f'); text(c, '24H', 14, 16, 8, k); R(c, 6, 6, 52, 1, k); R(c, 6, 18, 52, 1, k); },
  tank: (c, t) => { bx(c, 4, GY - 22, 36, 18, '#257179'); R(c, 6, GY - 20, 32, 14, '#41a6f6'); R(c, 6, GY - 8, 32, 2, '#ffcd75'); const fx = 8 + ((t * 8) % 24); R(c, fx, GY - 15, 4, 2, '#ef7d57'); R(c, fx - 1, GY - 16, 1, 4, '#ef7d57'); R(c, 34 - ((t * 5) % 22), GY - 12, 3, 2, '#ffcd75'); bx(c, 2, GY - 4, 40, 4, '#5a3a20'); },
  trophy: (c, t) => { bx(c, 236, GY - 6, 12, 6, '#5a3a20'); R(c, 239, GY - 10, 6, 4, '#ffcd75'); R(c, 237, GY - 18, 10, 8, '#ffd24a'); R(c, 235, GY - 17, 2, 4, '#ffd24a'); R(c, 247, GY - 17, 2, 4, '#ffd24a'); R(c, 239, GY - 16, 2, 3, '#fff6c0'); if (blink(t, 1)) R(c, 248, GY - 21, 2, 2, '#ffffff'); },
  // ── 추가 소품
  lamp: (c, t) => { R(c, 66, GY - 40, 2, 40, '#333c57'); R(c, 66, GY - 42, 12, 2, '#333c57'); bx(c, 74, GY - 41, 7, 4, '#566c86'); R(c, 75, GY - 37, 5, 1, '#ffcd75'); c.globalAlpha = .18; R(c, 70, GY - 36, 15, 36, '#ffcd75'); c.globalAlpha = 1; R(c, 63, GY - 2, 8, 2, '#333c57'); },
  tape: c => { bx(c, 238, GY - 30, 24, 30, '#5a3a20'); for (let r = 0; r < 3; r++) { R(c, 240, GY - 28 + r * 10, 20, 1, '#3a2414'); for (let k = 0; k < 4; k++) R(c, 241 + k * 5, GY - 26 + r * 10, 3, 7, ['#14141f', '#333c57', '#b13e53', '#41a6f6'][(k + r) % 4]); } },
  clock: (c, t) => { [['SEL', 230, '#ffcd75'], ['NY', 249, '#41a6f6'], ['LDN', 268, '#a7f070']].forEach(([n, x, k], i) => { bx(c, x, 4, 18, 18, '#1a1c2c'); R(c, x + 2, 6, 14, 10, '#0b0b14'); R(c, x + 8, 7, 2, 5, k); const a = t * .5 + i * 2; R(c, x + 8 + Math.round(Math.cos(a) * 3), 11 + Math.round(Math.sin(a) * 3), 2, 2, k); text(c, n, x + 2, 21, 4, '#94b0c2'); }); },
  fridge: (c, t) => { bx(c, 20, GY - 22, 16, 22, '#c2c3c7'); R(c, 20, GY - 14, 16, 1, '#8b9bb4'); R(c, 33, GY - 20, 1, 4, '#566c86'); R(c, 33, GY - 11, 1, 4, '#566c86'); R(c, 23, GY - 20, 4, 3, '#ef7d57'); R(c, 28, GY - 19, 3, 3, '#ffcd75'); if (blink(t, .5)) R(c, 22, GY - 3, 2, 1, '#38b764'); },
  poster: c => { bx(c, 18, 6, 22, 30, '#14141f'); R(c, 20, 8, 18, 18, '#5d275d'); R(c, 24, 12, 10, 10, '#ffcd75'); R(c, 26, 14, 6, 6, '#ef7d57'); R(c, 20, 28, 18, 2, '#f4f4f4'); R(c, 22, 31, 14, 1, '#94b0c2'); },
  figure: (c, t) => { bx(c, 44, GY - 30, 26, 30, '#29366f'); R(c, 46, GY - 28, 22, 26, '#73eff7'); c.globalAlpha = .25; R(c, 46, GY - 28, 22, 26, '#ffffff'); c.globalAlpha = 1; R(c, 46, GY - 15, 22, 1, '#29366f');
    R(c, 49, GY - 25, 4, 4, '#f4c2a0'); R(c, 48, GY - 21, 6, 5, '#b13e53'); R(c, 58, GY - 26, 5, 5, '#a7f070'); R(c, 57, GY - 21, 7, 5, '#3b5dc9'); R(c, 50, GY - 12, 6, 7, '#ffcd75'); R(c, 51, GY - 13, 4, 2, '#ef7d57'); R(c, 60, GY - 12, 5, 8, '#c2c3c7'); if (blink(t, .7)) R(c, 61, GY - 11, 1, 1, '#ff2e4d'); },
  swatch: c => { bx(c, 246, 4, 26, 20, '#f4f4f4'); ['#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#41a6f6', '#3b5dc9', '#5d275d', '#333c57'].forEach((k, i) => R(c, 248 + (i % 3) * 8, 6 + (i / 3 | 0) * 6, 6, 4, k)); },
  light: (c, t) => { R(c, 60, GY - 24, 2, 24, '#333c57'); R(c, 56, GY - 2, 10, 2, '#333c57'); bx(c, 55, GY - 32, 12, 8, '#14141f'); R(c, 57, GY - 30, 8, 4, blink(t, .3) ? '#fff6c0' : '#ffcd75'); c.globalAlpha = .12; R(c, 67, GY - 30, 36, 30, '#fff6c0'); c.globalAlpha = 1; },
  globe: (c, t) => { R(c, 258, GY - 4, 10, 4, '#5a3a20'); R(c, 262, GY - 8, 2, 4, '#ffcd75'); R(c, 255, GY - 22, 16, 15, '#3b5dc9'); const o = (t * 6 | 0) % 12; R(c, 256 + (o % 10), GY - 19, 5, 4, '#38b764'); R(c, 258 + ((o + 6) % 10), GY - 13, 4, 3, '#38b764'); R(c, 253, GY - 23, 2, 17, '#ffcd75'); },
  parasol: c => { R(c, 214, GY - 30, 2, 30, '#f4f4f4'); R(c, 198, GY - 32, 34, 4, '#b13e53'); R(c, 202, GY - 35, 26, 3, '#b13e53'); R(c, 206, GY - 32, 6, 4, '#f4f4f4'); R(c, 218, GY - 32, 6, 4, '#f4f4f4'); bx(c, 204, GY - 10, 22, 4, '#94b0c2'); R(c, 206, GY - 6, 2, 6, '#566c86'); R(c, 222, GY - 6, 2, 6, '#566c86'); R(c, 210, GY - 13, 4, 3, '#f4f4f4'); },
  drone: (c, t) => { const x = 190 + Math.sin(t * .7) * 28, y = 12 + Math.sin(t * 1.9) * 3, f = blink(t, 8); R(c, x - 6, y, 12, 3, '#333c57'); R(c, x - 2, y + 3, 4, 3, '#14141f'); R(c, x - 1, y + 4, 2, 1, '#41a6f6'); R(c, x - 9, y - 1, f ? 6 : 3, 1, '#c2c3c7'); R(c, x + (f ? 3 : 6), y - 1, f ? 6 : 3, 1, '#c2c3c7'); if (blink(t, 1)) R(c, x + 5, y + 1, 1, 1, '#ff2e4d'); },
  disc: (c, t) => { bx(c, 68, 6, 24, 26, '#5a3a20'); R(c, 70, 8, 20, 22, '#14141f'); R(c, 73, 10, 14, 14, '#ffd24a'); R(c, 78, 15, 4, 4, '#14141f'); R(c, 74, 11, 3, 3, '#fff6c0'); text(c, 'S', 77, 30, 5, '#ffcd75'); if (blink(t, 1)) R(c, 88, 9, 2, 2, '#ffffff'); },
  flower: c => { bx(c, 72, GY - 8, 12, 8, '#41a6f6'); R(c, 76, GY - 16, 1, 8, '#38b764'); R(c, 79, GY - 18, 1, 10, '#38b764'); R(c, 73, GY - 20, 5, 5, '#ff4ad6'); R(c, 78, GY - 22, 5, 5, '#ffcd75'); R(c, 81, GY - 17, 4, 4, '#ef7d57'); R(c, 74, GY - 14, 3, 3, '#f4f4f4'); },
  bike: (c, t) => { const w = (t * 4 | 0) % 2; R(c, 228, GY - 6, 7, 6, '#14141f'); R(c, 248, GY - 6, 7, 6, '#14141f'); R(c, 230, GY - 4, 3, 2, w ? '#566c86' : '#333c57'); R(c, 250, GY - 4, 3, 2, w ? '#566c86' : '#333c57'); bx(c, 232, GY - 12, 18, 6, '#b13e53'); R(c, 236, GY - 15, 9, 3, '#14141f'); R(c, 249, GY - 17, 2, 7, '#566c86'); R(c, 247, GY - 18, 5, 2, '#14141f'); bx(c, 228, GY - 18, 9, 7, '#f4f4f4'); text(c, 'TV', 229, GY - 12, 4, '#b13e53'); R(c, 252, GY - 13, 2, 2, '#ffcd75'); },
  board: c => { bx(c, 8, GY - 30, 40, 24, '#f4f4f4'); R(c, 12, GY - 6, 2, 6, '#566c86'); R(c, 42, GY - 6, 2, 6, '#566c86'); R(c, 11, GY - 26, 18, 1, '#3b5dc9'); R(c, 11, GY - 22, 26, 1, '#b13e53'); R(c, 11, GY - 18, 14, 1, '#3b5dc9'); R(c, 33, GY - 27, 10, 7, '#ffcd75'); R(c, 34, GY - 18, 9, 7, '#a7f070'); text(c, 'D-1', 12, GY - 9, 4, '#38b764'); },
  bonsai: c => { bx(c, 236, GY - 7, 16, 7, '#5d275d'); R(c, 243, GY - 15, 2, 8, '#5a3a20'); R(c, 240, GY - 14, 4, 2, '#5a3a20'); R(c, 234, GY - 20, 10, 5, '#257179'); R(c, 242, GY - 23, 12, 6, '#38b764'); R(c, 237, GY - 18, 6, 2, '#38b764'); },
  mic: (c, t) => { R(c, 150, GY - 9, 2, 9, '#ffcd75'); bx(c, 148, GY - 15, 6, 7, '#ffd24a'); R(c, 149, GY - 14, 2, 2, '#fff6c0'); if (blink(t, 1)) { R(c, 156, GY - 18, 2, 2, '#ffffff'); R(c, 145, GY - 12, 1, 1, '#ffffff'); } },
};
const HERO_PAL = { cap: PAL('#ffcd75', '#257179'), ninja: PAL('#257179', '#14141f'), mecha: PAL('#c2c3c7', '#b45bff'), night: PAL('#ef7d57', '#333c57') };
const HAIR = ['#3b2a20', '#14141f', '#8b5e3c', '#d8a050'], DARK = { H: '#222633', h: '#222633', S: '#222633', s: '#222633', E: '#222633', B: '#222633', b: '#222633', L: '#222633', K: '#222633' };
export function Scene(canvases, cardCv) {
  const ctx = canvases.map(cv => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; return c; }), act = [1, 0, 0, 0, 0, 1, 1, 1], cc = cardCv && cardCv.getContext('2d');
  return {
    draw(s, t, sel) {
      ctx.forEach((c, i) => {
        const k = i === 7 ? s.chief : MILESTONES.filter(m => s.lv[IDS[i]] >= m).length;
        act[i] += ((i === 0 || i >= 5 || s.q[i] > .02 ? 1 : 0) - act[i]) * .15; const a = act[i] > .4;
        DRAW[i](c, s, t, a, k);
        if (s.deco) DECOS.forEach(d => { if (d.fl === i && s.deco[d.id]) DECO_DRAW[d.id](c, t); });
        if (i < 4) { R(c, 0, GY + 5, 320, 3, '#14141f'); if (a) R(c, (t * 40 + i * 37) % 340 - 10, GY + 5, 8, 3, COL[i]); }
        if (i > 0 && i < 4) for (let m = 0, n = Math.min(6, s.q[i] / 2 | 0); m < n; m++) bx(c, 262 + (m % 3) * 10, GY - 6 - (m / 3 | 0) * 6, 9, 5, COL[i]);
        if (i < 5 && s.mg[i]) { person(c, 296, GY - 28, PAL('#f4f4f4', '#14141f')); R(c, 304, GY - 14, 2, 7, '#b13e53'); bx(c, 288, GY - 16, 8, 11, '#8b5e3c'); R(c, 290, GY - 13, 4, 1, '#f4f4f4'); }
        if (k >= 4) { R(c, 0, 0, 320, 2, '#ffd24a'); R(c, 0, 62, 320, 2, '#ffd24a'); }
      });
      if (cc) drawCards(cc, s, t, sel); // 직원 카드 도감 (ui/cardart.js)
    },
  };
}
