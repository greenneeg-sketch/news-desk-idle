// 편집실 고해상도 장면: 640x128칸 도트(캔버스는 3배 해상도로 그려 글씨가 선명하다)
// 게임 상태와 연결: 벽시계는 하루 진행(19:55→20:00), 렌더 막대는 오늘 진행률, 일이 있을 때만 타이핑·플레이바가 움직인다
// 속보 중에는 PGM 모니터에 속보 띠, 뒤의 취재기자가 말주머니로 재촉한다. 소품(화분·냉장고·포스터)과 매니저도 이 해상도로 그린다
import { DAY_SEC } from '../data/config.js';
const EH_CL = [['#41a6f6', '#2a5aa8'], ['#ef7d57', '#a8432c'], ['#38b764', '#1f6f55'], ['#ffcd75', '#b8863e'], ['#a05ae0', '#5d2f8a'], ['#73eff7', '#2f8f99']];
const EH_CLIPS = [[0, 34], [34, 62], [62, 98], [98, 120], [120, 150], [150, 178]];
const EH_KO = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', EH_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const ehShade = (h, a) => '#' + [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)).map(v => Math.max(0, Math.min(255, Math.round(a > 0 ? v + (255 - v) * a : v * (1 + a))))).map(v => v.toString(16).padStart(2, '0')).join('');
export function drawEditHD(c, s, t, active, k) {
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const T = (str, x, y, n, col, f) => { c.fillStyle = col; c.font = f || `bold ${n}px ${EH_MONO}`; c.fillText(str, x, y); };
  const city = (x0, y0, w, h, tt) => { R(x0, y0, w, h, '#1d2b53'); for (let i = 0; i < 9; i++) { const bx = x0 + i * w / 9, bh = h * (.35 + ((i * 37) % 50) / 100); R(bx, y0 + h - bh, w / 9 - 1, bh, '#29366f'); for (let j = 0; j < 4; j++) if ((i + j + Math.floor(tt)) % 3) R(bx + 2, y0 + h - bh + 3 + j * 5, 2, 2, '#ffcd75'); } };
  const shot = (kind, x0, y0, w, h) => {
    c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
    if (kind === 0) { R(x0, y0, w, h, '#3b5dc9'); R(x0, y0 + h * .62, w, h * .38, '#5d275d'); const cx = x0 + w / 2; R(cx - 6, y0 + h * .2, 12, 12, '#f2c9a0'); R(cx - 7, y0 + h * .16, 14, 5, '#14141f'); R(cx - 10, y0 + h * .45, 20, 14, '#1d3a6b'); R(cx - 2, y0 + h * .45, 4, 8, '#e43b44'); }
    else if (kind === 1) city(x0, y0, w, h, t);
    else if (kind === 2) { R(x0, y0, w, h, '#73b6ef'); R(x0, y0 + h * .7, w, h * .3, '#3a6b45'); const hx = x0 + ((t * 18) % (w + 30)) - 20; R(hx, y0 + h * .3, 18, 7, '#f4f4f4'); R(hx + 16, y0 + h * .34, 9, 2, '#f4f4f4'); R(hx - 6 + (Math.floor(t * 12) % 2) * 12, y0 + h * .25, 22, 1, '#14141f'); }
    else { R(x0, y0, w, h, '#f4f4f4'); R(x0 + 4, y0 + 4, w - 8, 9, '#b13e53'); for (let i = 0; i < 5; i++) { const bh = 6 + ((i * 7 + Math.floor(t)) % 5) * 3; R(x0 + 8 + i * (w - 16) / 5, y0 + h - 4 - bh, (w - 16) / 5 - 3, bh, ['#41a6f6', '#ef7d57', '#38b764', '#ffcd75', '#a05ae0'][i]); } }
    if (s.ev) { R(x0, y0 + h - 10, w, 10, '#e43b44'); T('속보', x0 + 3, y0 + h - 2, 0, '#ffffff', `bold 8px ${EH_KO}`); R(x0 + 26, y0 + h - 7, w - 30, 3, '#ffd6dc'); } // 속보 띠
    else { R(x0 + 4, y0 + h - 9, w * .55, 6, '#b13e53'); R(x0 + 6, y0 + h - 7, w * .4, 2, '#f4f4f4'); }
    c.restore();
  };
  const monitor = (x, y, w, h, label) => { R(x - 2, y - 2, w + 4, h + 4, '#0b0b14'); R(x - 1, y - 1, w + 2, h + 2, '#3a4466'); R(x, y, w, h, '#101320'); R(x + w / 2 - 4, y + h + 2, 8, 5, '#3a4466'); R(x + w / 2 - 12, y + h + 7, 24, 2, '#566c86'); if (label) T(label, x + 1, y - 4, 7, '#b8c6d6'); };
  const stand = (x, y, sk, hair, top, tie, sway, paper) => { // 서 있는 사람(32x44칸)
    R(x + 10, y + 2, 12, 12, sk); R(x + 9, y, 14, 6, hair); R(x + 9, y + 2, 3, 8, hair); R(x + 18, y + 7, 2, 2, '#14141f'); R(x + 18, y + 11, 3, 1, ehShade(sk, -.3));
    R(x + 8, y + 15, 16, 16, top); R(x + 14, y + 15, 3, 8, '#f4f4f4'); R(x + 15, y + 16, 1, 6, tie);
    R(x + 10, y + 31, 5, 12, '#2a2a3a'); R(x + 17, y + 31, 5, 12, '#2a2a3a'); R(x + 9, y + 42, 7, 2, '#14141f'); R(x + 16, y + 42, 7, 2, '#14141f');
    R(x + 20, y + 17, 5, 9, ehShade(top, -.2));
    if (paper) { R(x + 24, y + 22 + sway, 10, 12, '#f4f4f4'); for (let i = 0; i < 4; i++) R(x + 26, y + 25 + sway + i * 2, 6, 1, '#9aaabd'); } R(x + 23, y + 26 + sway, 3, 3, sk);
  };
  // 벽·바닥
  for (let y = 0; y < 112; y += 4) R(0, y, 640, 4, ehShade('#1a1d30', y / 112 * .12));
  R(0, 112, 640, 16, '#2a2e44'); for (let x = 0; x < 640; x += 32) R(x, 112, 1, 16, '#22263a'); R(0, 112, 640, 1, '#3a4466');
  R(10, 12, 110, 62, '#0b0b14'); city(13, 15, 104, 56, t * .5); R(64, 12, 2, 62, '#0b0b14'); R(10, 42, 110, 2, '#0b0b14');
  // 벽시계: 게임 속 하루(5분)를 19:55→20:00로. 마지막 1분은 빨갛게 깜빡
  const day = Math.min(1, (s.dayT || 0) / DAY_SEC), sec = Math.floor(day * 300), late = day > .8, blink = Math.floor(t * 3) % 2;
  R(262, 4, 92, 14, '#0b0b14'); T(`19:${String(55 + Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, 266, 15, 10, late && blink ? '#ff5a6e' : '#a7f070');
  R(360, 4, 54, 14, late ? '#b13e53' : '#3a4466'); T('ON AIR', 365, 15, 8, late && blink ? '#ffffff' : '#9aaabd');
  [[132, 20, '#ffcd75'], [146, 26, '#a7f070'], [134, 36, '#ff9fd0']].forEach(([x, y, col]) => { R(x, y, 12, 11, col); R(x + 2, y + 3, 8, 1, ehShade(col, -.4)); R(x + 2, y + 6, 6, 1, ehShade(col, -.4)); });
  // 책상
  R(150, 90, 420, 6, '#7a4a2a'); R(150, 90, 420, 1, '#a8693f'); R(156, 96, 6, 16, '#4a2c18'); R(558, 96, 6, 16, '#4a2c18');
  // 모니터·타임라인 (일이 있을 때만 플레이바가 움직인다)
  const prog = (t * (active ? .09 : .015)) % 1, px = prog * 178, ci = EH_CLIPS.findIndex(([a, b]) => px >= a && px < b), kk = Math.max(0, ci) % 4;
  monitor(166, 26, 82, 50, 'SOURCE'); shot((kk + 1) % 4, 168, 28, 78, 46);
  monitor(258, 22, 200, 60, '');
  monitor(470, 30, 74, 44, 'PGM'); shot(kk, 472, 32, 70, 40); R(536, 24, 8, 4, Math.floor(t * 2) % 2 ? '#ff2e4d' : '#7a1a28');
  const tx = 262, ty = 26, tw = 192, th = 52; R(tx, ty, tw, th, '#151827');
  const TC = Math.floor(prog * 90 * 30); T(`00:00:${String(Math.floor(TC / 30) % 60).padStart(2, '0')}:${String(TC % 30).padStart(2, '0')}`, tx + 2, ty + 7, 7, late && blink ? '#ff5a6e' : '#ffcd75');
  ['V2', 'V1', 'A1', 'A2'].forEach((n, i) => { const ry = ty + 10 + i * 10; R(tx, ry, 12, 9, '#222638'); T(n, tx + 1, ry + 7, 6, '#c8d4e2'); R(tx + 12, ry, tw - 12, 9, i % 2 ? '#1b1f30' : '#1e2234'); });
  const done = Math.floor(prog * EH_CLIPS.length * 1.15);
  EH_CLIPS.forEach(([a, b], i) => { if (i > done) return; const x0 = tx + 12 + a, w = b - a - 1, col = EH_CL[i % EH_CL.length];
    R(x0, ty + 20, w, 9, col[1]); R(x0, ty + 20, w, 2, col[0]);
    if (i % 2 === 0) { R(x0 + 2, ty + 10, Math.min(w - 2, 20), 9, '#5d275d'); R(x0 + 3, ty + 13, Math.min(w - 4, 14), 2, '#f4f4f4'); }
    for (let xx = x0 + 1; xx < x0 + w - 1; xx += 2) { const a1 = 1 + Math.abs(Math.sin(xx * .6 + i)) * 3.5; R(xx, ty + 34 - a1, 1, a1 * 2, '#73b06f'); }
    if (i % 3 !== 1) for (let xx = x0 + 1; xx < x0 + w - 1; xx += 3) { const a2 = 1 + Math.abs(Math.sin(xx * .3)) * 2; R(xx, ty + 44 - a2, 1, a2 * 2, '#5b8bc0'); }
  });
  const phx = tx + 12 + px; R(phx - 2, ty + 8, 5, 2, '#ff2e4d'); R(phx, ty + 8, 1, 42, '#ff2e4d');
  R(tx, ty + th - 2, tw, 2, '#2a2e44'); R(tx, ty + th - 2, tw * day, 2, day > .95 ? '#a7f070' : '#41a6f6'); // 오늘 진행
  if (day > .95) { R(tx + 52, ty + 20, 92, 13, '#0b0b14dd'); T('송출 준비 완료', tx + 56, ty + 30, 0, '#a7f070', `bold 10px ${EH_KO}`); }
  // 책상 위: 키보드·조그·마우스·스피커·커피·대기 클립(인제스트에서 넘어온 영상)
  const typing = active ? Math.floor(t * 9) : 0;
  R(196, 86, 74, 5, '#2a2e44'); for (let i = 0; i < 14; i++) R(198 + i * 5, 87, 4, 1, active && (typing + i) % 7 === 0 ? '#ffcd75' : '#566c86');
  R(250, 83, 16, 8, '#2a2e44'); R(254, 84, 8, 6, '#14141f'); const ja = active ? t * 6 : 0; R(258 + Math.cos(ja) * 2, 86 + Math.sin(ja) * 2, 2, 2, '#ffcd75');
  R(330, 86, 7, 5, '#c2c3c7'); R(330, 86, 7, 1, '#f4f4f4');
  R(150, 70, 12, 20, '#14141f'); R(153, 76, 6, 6, '#3a4466'); R(552, 70, 12, 20, '#14141f'); R(555, 76, 6, 6, '#3a4466');
  R(500, 80, 10, 10, '#f4f4f4'); R(510, 82, 3, 5, '#f4f4f4'); R(501, 81, 8, 2, '#6b3a1f'); for (let i = 0; i < 3; i++) { const sy = 76 - ((t * 10 + i * 5) % 14); R(503 + (i % 2) * 3, sy, 1, 3, '#9aaabd'); }
  for (let m = 0, n = Math.min(6, (s.q ? s.q[2] : 0) / 2 | 0); m < n; m++) { const x = 424 + (m % 3) * 14, y = 84 - (m / 3 | 0) * 6; R(x, y, 12, 5, '#41a6f6'); R(x, y, 12, 1, '#a8d8ff'); }
  // 의자 + 편집기자(뒷모습, 헤드셋)
  R(214, 80, 34, 28, '#333c57'); R(216, 82, 30, 2, '#566c86'); R(228, 108, 6, 4, '#222633'); R(220, 112, 22, 2, '#14141f');
  { const x = 214, y = 56, sk = '#f2c9a0', hair = '#3b2a20', top = '#ffcd75', tap = active ? Math.floor(t * 9) % 2 : 0, tap2 = active ? Math.floor(t * 9 + 1) % 2 : 0;
    R(x + 6, y + 16, 22, 18, top); R(x + 6, y + 16, 22, 2, ehShade(top, .2)); R(x + 26, y + 18, 2, 16, ehShade(top, -.25));
    R(x + 10, y + 2, 14, 14, hair); R(x + 9, y + 4, 16, 9, hair); R(x + 11, y + 14, 12, 3, sk);
    R(x + 8, y + 3, 18, 2, '#222633'); R(x + 7, y + 6, 3, 6, '#222633'); R(x + 24, y + 6, 3, 6, '#222633'); R(x + 6, y + 7, 2, 4, '#e43b44');
    R(x + 2, y + 20, 6, 10, top); R(x - 4, y + 28 - tap, 8, 4, sk); R(x + 26, y + 20, 6, 10, ehShade(top, -.15)); R(x + 30, y + 27 - tap2, 8, 4, sk); }
  // 뒤에서 재촉하는 취재기자 + 매니저(고용 시)
  stand(560, 66, '#e0ac7e', '#14141f', '#41a6f6', '#b13e53', Math.sin(t * 2) > .6 ? -2 : 0, true);
  if (s.mg && s.mg[2]) stand(604, 66, '#f2c9a0', '#5a3a20', '#f4f4f4', '#2a6fdb', 0, false);
  // 소품(이 층): 화분·냉장고·포스터
  const D = s.deco || {};
  if (D.plant) { R(128, 96, 14, 16, '#b86f50'); R(126, 94, 18, 3, '#9a5a40'); R(133, 80, 2, 15, '#38b764'); R(126, 82, 7, 4, '#38b764'); R(135, 78, 8, 4, '#a7f070'); R(124, 88, 8, 3, '#257179'); R(136, 86, 7, 3, '#38b764'); }
  if (D.fridge) { R(96, 84, 24, 28, '#c2c3c7'); R(96, 84, 24, 1, '#f4f4f4'); R(96, 96, 24, 1, '#8b9bb4'); R(116, 87, 1, 6, '#566c86'); R(116, 99, 1, 8, '#566c86'); R(99, 87, 5, 4, '#ef7d57'); R(105, 88, 4, 3, '#ffcd75'); if (Math.floor(t) % 2) R(99, 109, 2, 1, '#38b764'); }
  if (D.poster) { R(592, 8, 36, 46, '#14141f'); R(594, 10, 32, 30, '#5d275d'); R(600, 15, 20, 20, '#ffcd75'); R(604, 19, 12, 12, '#ef7d57'); R(594, 42, 32, 3, '#f4f4f4'); R(597, 47, 26, 2, '#94b0c2'); }
  // 컨베이어(층 사이 흐름)·마일스톤 테두리
  R(0, 118, 640, 6, '#14141f'); if (active) R((t * 80 + 74) % 680 - 20, 118, 16, 6, '#73eff7');
  if (k >= 4) { R(0, 0, 640, 4, '#ffd24a'); R(0, 124, 640, 4, '#ffd24a'); }
  // 말주머니(크게): 속보 중이거나 마감 직전이면 취재기자가 재촉한다
  const say = s.ev && !s.ev.boost ? '속보 들어갑니다!' : late ? `${Math.max(1, Math.ceil((1 - day) * 5))}분 남았어요!` : null;
  if (say && Math.floor(t / 2.5) % 2 === 0) {
    c.font = `bold 15px ${EH_KO}`; const w = Math.ceil(c.measureText(say).width) + 18, bx = Math.min(636 - w, 590 - w / 2), by = 24;
    R(bx - 2, by - 2, w + 4, 26, '#14141f'); R(bx, by, w, 22, s.ev ? '#ffd24a' : '#ffffff'); R(574, by + 24, 8, 4, '#14141f'); R(576, by + 22, 4, 4, s.ev ? '#ffd24a' : '#ffffff');
    T(say, bx + 9, by + 16, 0, '#14141f', `bold 15px ${EH_KO}`);
  }
}
