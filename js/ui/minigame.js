// 미니게임 모음. 공통 화면(모달·캔버스)은 main.js가 띄우고, 게임은 여기서 그리고 판정한다.
// 게임 인터페이스: { id, start(), stop(), down(x, y), move(x, y), up(), key(e), shot(), debug } — x·y는 게임 좌표(0~240, 0~150)
// 끝나면 ui.done({ grade, ratio, perfect, stat }) 을 부른다. 보상·기록은 main.js 몫.
// 고해상도(2026-11-16): 캔버스는 게임 좌표의 4배(960x600). 그림은 0.5칸 단위까지 세밀하게 그린다.
import { drawFigure } from './cardart.js';
export const MINI = (() => {
const MG_W = 240, MG_H = 150, MG_S = 4;
const MG_PAL = [['#41a6f6', '#3b5dc9'], ['#ef7d57', '#b13e53'], ['#38b764', '#257179'], ['#ffcd75', '#a7f070'], ['#94b0c2', '#566c86'], ['#a05ae0', '#5d275d']];
const KOF = '"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif', MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace';
let ui = null, cx = null, cur = null, raf = 0;
const loop = fn => { const f = now => { if (fn(now) !== false) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); };
const R = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(x, y, w, h); };
const TX = (str, x, y, n, c, f = KOF, al = 'left') => { cx.font = `bold ${n}px ${f}`; cx.fillStyle = c; cx.textAlign = al; cx.fillText(str, x, y); cx.textAlign = 'left'; };
const hx3 = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const SH = (h, a) => '#' + hx3(h).map(v => Math.max(0, Math.min(255, Math.round(a > 0 ? v + (255 - v) * a : v * (1 + a)))).toString(16).padStart(2, '0')).join('');
const MIX = (a, b, f) => { const A = hx3(a), B = hx3(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join(''); };
const HEAD = ['도심 폭우로 퇴근길 정체', '올해 첫 한파 특보 발효', '국가대표 결승 진출', '신형 우주망원경 첫 사진 공개', '주말 전국에 많은 비', '연말 시상식 오늘 밤 생중계'];
// 뉴스 화면 한 장(140x78 기준)을 (x, y, w, h)에 그린다. 컷 편집·송출 사고 모니터와 썸네일이 함께 쓴다
function newsScene(k, x, y, w, h, now) {
  cx.save(); cx.translate(x, y); cx.scale(w / 140, h / 78); cx.beginPath(); cx.rect(0, 0, 140, 78); cx.clip();
  const kind = ((k % 4) + 4) % 4, t = now / 1000;
  if (kind === 0) { // 앵커 스튜디오
    for (let i = 0; i < 78; i += 2) R(0, i, 140, 2, MIX('#1d3a6b', '#0b1430', i / 78));
    R(74, 6, 60, 34, '#0b1a3a'); R(75, 7, 58, 32, '#15306a'); for (let i = 0; i < 40; i++) R(77 + (i * 13) % 54, 9 + (i * 7) % 28, 1.5, 1.5, (i + Math.floor(t * 2)) % 5 ? '#3b6bd0' : '#73eff7');
    R(8, 8, 36, 12, '#b13e53'); R(8, 8, 36, 1, '#e8606c'); TX('NEWS 8', 26, 16.5, 6.5, '#ffffff', KOF, 'center');
    drawFigure((gx, gy, gw, gh, c) => R(53 + gx * .75, 14 + gy * .75, gw * .75, gh * .75, c), 'c11', 1, t);
    R(0, 52, 140, 26, '#222844'); R(0, 50, 140, 3, '#c2c3c7'); R(0, 50, 140, 1, '#ffffff'); R(48, 57, 44, 9, '#b13e53'); TX('NEWS', 70, 63.5, 5.5, '#ffffff', KOF, 'center');
    R(0, 66, 140, 12, '#f4f4f4'); R(0, 66, 24, 12, '#e43b44'); TX('속보', 12, 74.5, 6.5, '#ffffff', KOF, 'center'); TX(HEAD[(k >> 2) % HEAD.length], 28, 74.5, 6, '#14141f');
  } else if (kind === 1) { // 노을 지는 도심
    for (let i = 0; i < 60; i += 2) R(0, i, 140, 2, MIX('#3b2a6b', '#ef7d57', i / 60)); R(96, 30, 14, 14, '#ffcd75'); R(98, 28, 10, 2, '#ffcd75'); R(98, 44, 10, 2, '#ffcd75');
    [[0, 30, 16], [18, 18, 20], [40, 34, 14], [56, 10, 22], [80, 26, 18], [100, 38, 16], [118, 20, 22]].forEach(([bx, by, bw], i) => { R(bx, by, bw, 62 - by, i % 2 ? '#29366f' : '#333c57'); R(bx, by, bw, 1, '#566c86'); for (let yy = by + 4; yy < 58; yy += 5) for (let xx = bx + 2; xx < bx + bw - 2; xx += 4) R(xx, yy, 2, 2.5, (xx * 3 + yy + i) % 7 < 3 ? '#ffe28a' : '#1d2b53'); });
    R(0, 62, 140, 16, '#2c3246'); for (let i = 0; i < 8; i++) R(i * 20 - (t * 20) % 20, 69, 10, 1, '#ffcd75');
    for (let i = 0; i < 3; i++) { const cxp = (t * (18 + i * 6) + i * 55) % 170 - 20; R(cxp, 63 + i * 4, 12, 4, ['#e43b44', '#41a6f6', '#f4f4f4'][i]); R(cxp + 2, 62 + i * 4, 6, 2, '#73b6ef'); R(cxp + 11, 64 + i * 4, 1, 1.5, '#ffcd75'); }
    R(4, 4, 30, 8, '#0b0b14cc'); R(6, 6, 4, 4, '#e43b44'); TX('LIVE', 12, 10, 5, '#ffffff', MONO);
  } else if (kind === 2) { // 헬기 항공 촬영
    for (let i = 0; i < 78; i += 2) R(0, i, 140, 2, MIX('#73b6ef', '#c9e6ff', i / 78));
    for (let i = 0; i < 4; i++) { const cl = (i * 47 - t * 8) % 180; const xx = cl < -40 ? cl + 180 : cl; R(xx, 8 + i * 12, 26, 5, '#ffffff'); R(xx + 6, 5 + i * 12, 14, 4, '#ffffff'); }
    R(0, 64, 140, 14, '#566c86'); for (let i = 0; i < 14; i++) R(i * 10, 60 + (i * 7) % 6, 8, 18, i % 2 ? '#3a4466' : '#4a5577');
    const hx = 30 + Math.sin(t * .8) * 20, hy = 26 + Math.sin(t * 1.7) * 3, b = Math.floor(t * 12) % 2;
    R(hx, hy, 28, 11, '#e43b44'); R(hx + 2, hy - 1, 22, 2, '#e43b44'); R(hx + 20, hy + 1, 7, 6, '#73eff7'); R(hx + 21, hy + 2, 2, 2, '#ffffff'); R(hx + 4, hy + 4, 12, 2, '#ffffff');
    R(hx - 22, hy + 3, 23, 3, '#b13e53'); R(hx - 24, hy - 1 + (b ? 0 : 6), 2, 6, '#333c57'); R(hx + 6, hy + 13, 18, 1.5, '#333c57'); R(hx + 9, hy + 11, 1.5, 2, '#333c57'); R(hx + 20, hy + 11, 1.5, 2, '#333c57');
    R(hx + 13, hy - 4, 2, 3, '#333c57'); c_rotor(hx + 14, hy - 4, b);
    R(108, 4, 28, 9, '#e43b44'); TX('LIVE', 122, 10.5, 6, '#ffffff', MONO, 'center');
  } else { // 그래픽: 강수량 막대그래프
    R(0, 0, 140, 78, '#14204a'); for (let i = 0; i < 140; i += 10) R(i, 0, .5, 78, '#1d2b5e'); for (let i = 0; i < 78; i += 10) R(0, i, 140, .5, '#1d2b5e');
    R(0, 0, 140, 14, '#f4f4f4'); R(0, 0, 30, 14, '#3b5dc9'); TX('그래픽', 15, 9.5, 6, '#ffffff', KOF, 'center'); TX('지역별 강수량 (mm)', 34, 9.5, 6.5, '#14141f');
    const names = ['서울', '대전', '광주', '부산', '강릉', '제주'];
    names.forEach((n, i) => { const v = 14 + ((i * 37) % 30) + Math.sin(t * 1.5 + i) * 3, bx = 12 + i * 21; R(bx, 66 - v * .9, 13, v * .9, i === 1 ? '#ffcd75' : '#41a6f6'); R(bx, 66 - v * .9, 13, 1.5, '#ffffff'); TX(String(Math.round(v * 3)), bx + 6.5, 63 - v * .9, 4.5, '#ffffff', MONO, 'center'); TX(n, bx + 6.5, 74, 4.5, '#c2c3c7', KOF, 'center'); });
    R(8, 66, 126, 1, '#94b0c2');
  }
  cx.restore();
}
function c_rotor(x, y, b) { R(x - (b ? 24 : 18), y - 1, b ? 48 : 36, 1.5, '#14141f'); if (!b) R(x - 6, y - 1.5, 12, 2.5, '#333c57'); }

// ───────── 1. 속보 컷 편집 (영상편집기자) ─────────
// 플레이바가 타임라인의 컷 지점을 지날 때 탭. 5라운드, 점점 컷이 늘고 빨라진다
const CUT = (() => {
  const ROUNDS = [{ n: 5, d: 4.0 }, { n: 6, d: 3.7 }, { n: 7, d: 3.5 }, { n: 8, d: 3.3 }, { n: 9, d: 3.2 }];
  const WIN = { p: .065, g: .13, near: .3 }, X0 = 12, X1 = 228;   // 판정 범위(초): 아이폰 터치 지연을 감안해 넉넉하게
  let st = null;
  const cutsFor = r => { const R = ROUNDS[r], w = .85 / R.n; return Array.from({ length: R.n }, (_, i) => ({ x: .1 + w * (i + .5 + (Math.random() - .5) * .5), res: '' })); };
  function round(r) { st.r = r; st.cuts = cutsFor(r); st.tot += st.cuts.length; st.t0 = performance.now() + 900; st.phase = 'ready'; st.flash = null; ui.label(`ROUND ${r + 1}/${ROUNDS.length}`, `컷 ${st.cuts.length}개 · 플레이바가 빨간 선에 닿을 때 화면을 탭!`); }
  function judge(c, res) {
    c.res = res; st.flash = { res, at: performance.now(), x: c.x };
    if (res === 'miss') { st.combo = 0; st.miss++; ui.sfx('fail'); } else { st.combo++; st.best = Math.max(st.best, st.combo); st[res === 'p' ? 'perf' : 'good']++; ui.sfx('buy'); }
    ui.pop(res === 'p' ? 'PERFECT!' : res === 'g' ? 'GOOD' : 'MISS', res); ui.combo(st.combo > 1 ? `${st.combo} COMBO` : '');
  }
  function tap() {
    if (!st || st.phase !== 'play') return;
    const R = ROUNDS[st.r], t = (performance.now() - st.t0) / 1000; let best = null, bd = 9;
    st.cuts.forEach(c => { if (c.res) return; const d = Math.abs(c.x * R.d - t); if (d < bd) { bd = d; best = c; } });
    if (best && bd <= WIN.p) judge(best, 'p'); else if (best && bd <= WIN.g) judge(best, 'g'); else if (best && bd <= WIN.near) judge(best, 'miss');
    else { st.stray++; st.combo = 0; ui.sfx('fail'); ui.pop('헛컷!', 'miss'); ui.combo(''); }
  }
  function frame(now) {
    const R = ROUNDS[st.r], t = (now - st.t0) / 1000;
    if (st.phase === 'ready' && t >= 0) { st.phase = 'play'; ui.label(`ROUND ${st.r + 1}/${ROUNDS.length}`, ''); }
    if (st.phase === 'play') {
      st.cuts.forEach(c => { if (!c.res && t > c.x * R.d + WIN.g) judge(c, 'miss'); });
      if (t >= R.d) {
        if (st.r + 1 < ROUNDS.length) round(st.r + 1);
        else { st.phase = 'done'; const ratio = Math.max(0, (st.perf * 2 + st.good) / (st.tot * 2) - st.stray * .03);
          ui.done({ grade: ratio >= .95 ? 'S' : ratio >= .8 ? 'A' : ratio >= .6 ? 'B' : 'C', ratio, perfect: st.perf === st.tot, stat: `PERFECT ${st.perf} · GOOD ${st.good} · MISS ${st.miss} · 최대 ${st.best}콤보` }); return false; }
      }
    }
    draw(now, Math.max(0, Math.min(1, t / R.d)));
  }
  function draw(now, p) { // 편집 프로그램 화면: 위 왼쪽 프로그램 모니터, 오른쪽 정보·다음 컷, 아래 타임라인(V1 클립 + 오디오 2트랙) + 빨간 플레이바
    const R0 = ROUNDS[st.r]; R(0, 0, MG_W, MG_H, '#101320');
    R(0, 0, MG_W, 8, '#1a1c2c'); R(0, 7.5, MG_W, .5, '#333c57'); R(3, 2.5, 3, 3, '#e43b44'); R(7.5, 2.5, 3, 3, '#ffcd75'); R(12, 2.5, 3, 3, '#38b764'); TX('NEWS EDIT  ·  톱리포트_최종_v3', 19, 6, 4.8, '#94b0c2');
    const ci = st.cuts.filter(c => c.x <= p).length;
    R(5, 10.5, 147, 84, '#0b0b14'); R(5.5, 11, 146, 83, '#2a2e44'); newsScene(ci + st.r * 3, 8, 13, 140, 78, now); R(8, 13, 140, .5, '#ffffff22');
    if (st.phase === 'ready') { R(8, 13, 140, 78, '#0b0b1488'); TX(`ROUND ${st.r + 1}`, 78, 52, 11, '#ffcd75', MONO, 'center'); }
    // 오른쪽 정보 패널
    R(155, 10.5, 81, 84, '#1a1c2c'); R(155, 10.5, 81, 9, '#22253a'); TX('PROGRAM', 158, 17, 5, '#ffcd75', MONO);
    const tc = Math.floor(p * R0.d * 30); TX(`00:00:0${Math.floor(tc / 30)}:${String(tc % 30).padStart(2, '0')}`, 158, 29, 7.2, '#f4f4f4', MONO);
    TX(`ROUND ${st.r + 1}/${ROUNDS.length}`, 158, 38, 5, '#94b0c2', MONO); TX(`CUT ${st.cuts.filter(c => c.res).length}/${st.cuts.length}`, 200, 38, 5, '#94b0c2', MONO);
    const rec = st.phase === 'ready' ? Math.floor(now / 250) % 2 : 1; R(158, 41.5, 5, 5, st.phase === 'ready' ? (rec ? '#e43b44' : '#5a1a22') : '#38b764'); TX(st.phase === 'ready' ? 'STANDBY' : 'PLAYING', 166, 46, 5, '#c2c3c7', MONO);
    TX('NEXT', 158, 55, 4.5, '#566c86', MONO);
    for (let i = 0; i < 2; i++) { const nx = 158 + i * 39; R(nx - .5, 57.5, 37, 21, '#333c57'); newsScene(ci + 1 + i + st.r * 3, nx, 58, 36, 20, now); TX(`C${ci + 2 + i}`, nx + 1, 84, 4.5, '#94b0c2', MONO); }
    R(158, 87, 75, 5, '#0b0b14'); R(158, 87, 75 * p, 5, '#3b5dc9'); R(158 + 75 * p - .5, 86, 1, 7, '#ffffff');
    // 타임라인
    const ty = 102; R(0, 96, MG_W, 54, '#14141f'); R(0, 96, 11, 54, '#1a1c2c');
    TX('V1', 5.5, ty + 9, 4.5, '#94b0c2', MONO, 'center'); TX('A1', 5.5, ty + 25, 4.5, '#94b0c2', MONO, 'center'); TX('A2', 5.5, ty + 39, 4.5, '#94b0c2', MONO, 'center');
    R(X0, 96, X1 - X0, 5, '#22253a'); for (let i = 0; i <= 40; i++) { const xx = X0 + i * (X1 - X0) / 40; R(xx, i % 5 ? 99 : 97, .5, i % 5 ? 2 : 4, '#566c86'); }
    const xs = [0, ...st.cuts.map(c => c.x), 1];
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = X0 + xs[i] * (X1 - X0), b = X0 + xs[i + 1] * (X1 - X0), q = MG_PAL[(i + st.r * 2) % MG_PAL.length], w = b - a - 1;
      R(a + .5, ty, w, 15, q[1]); R(a + .5, ty, w, 2, q[0]); R(a + .5, ty + 14.5, w, .5, SH(q[1], -.4));
      if (w > 20) { R(a + 1.5, ty + 3, 17, 10, '#0b0b14'); newsScene(i + st.r * 3, a + 2, ty + 3.5, 16, 9, now); TX(`C${i + 1}`, a + 21, ty + 10, 4.5, '#ffffff', MONO); }
      R(a + .5, ty + 18, w, 12, SH(q[1], -.55)); R(a + .5, ty + 32, w, 11, '#1d2b53');
      for (let x = a + 1.5; x < b - 1.5; x += 1.5) { const h1 = 1 + Math.abs(Math.sin(x * .7 + i)) * 9, h2 = 1 + Math.abs(Math.sin(x * 1.3 + i * 2) * Math.sin(x * .2)) * 8; R(x, ty + 24 - h1 / 2, 1, h1, SH(q[0], .2)); R(x, ty + 37.5 - h2 / 2, 1, h2, '#73b6ef'); }
    }
    st.cuts.forEach(c => {
      const x = X0 + c.x * (X1 - X0), col = c.res === 'p' ? '#a7f070' : c.res === 'g' ? '#38b764' : c.res === 'miss' ? '#566c86' : (Math.floor(now / 200) % 2 ? '#ff5050' : '#ffcd75');
      R(x - .75, 96, 1.5, 49, col); if (!c.res) { R(x - 2.5, 96, 5, 2.5, col); R(x - 1.5, 98.5, 3, 1, col); } else R(x - 2, 96, 4, 4, col);
    });
    const px = X0 + p * (X1 - X0); R(px - 3, 94, 6.5, 3, '#ff2e4d'); R(px - 2, 97, 4.5, 1, '#ff2e4d'); R(px - 1, 98, 2.5, 1, '#ff2e4d'); R(px - .25, 96, 1, 50, '#ff2e4d');
    if (st.flash && now - st.flash.at < 250) { cx.globalAlpha = 1 - (now - st.flash.at) / 250; R(X0 + st.flash.x * (X1 - X0) - 6, 96, 12, 50, st.flash.res === 'miss' ? '#b13e53' : '#a7f070'); cx.globalAlpha = 1; }
  }
  return {
    id: 'cut', shutter: false,
    start() { st = { r: 0, tot: 0, perf: 0, good: 0, miss: 0, stray: 0, combo: 0, best: 0 }; round(0); loop(frame); },
    stop() { st = null; }, down: () => tap(), move() { }, up() { }, key: e => { if (e.key === ' ' || e.key === 'Enter') tap(); }, shot() { },
    get debug() { return st && { ...st, R: ROUNDS[st.r] }; },
  };
})();

// ───────── 2. 단독 입수 (취재기자·영상기자) ─────────
// 뷰파인더 속 피사체가 앞뒤로 움직여 초점이 계속 바뀐다. 화면을 좌우로 문질러 포커스 링을 돌리고, 선명할 때 셔터!
// 컷마다 제한 시간 6초, 컷당 5초, 빨리 찍을수록 보너스.
const FOCUS = (() => {
  const SHOTS = 5, LIMIT = 5, WIN = { p: .04, g: .1 };
  const SUBJ = [ // 피사체: 이름, 그리기 함수
    ['공항 출국 스타', star], ['도심에 나타난 거대 로봇', robot], ['하늘을 나는 히어로', hero], ['정체불명 UFO', ufo], ['기자회견장 대변인', speaker],
  ];
  let st = null, off = null, ox = null;
  const tgt = (t, s) => .5 + .34 * Math.sin(t * s.w + s.ph) + .08 * Math.sin(t * s.w * 2.7 + s.ph2); // 시간에 따른 정답 초점(0~1)
  function shot(i) {
    const order = st.order;
    st.i = i; st.s = { w: .95 + i * .35, ph: Math.random() * 6.28, ph2: Math.random() * 6.28, k: order[i % order.length], t0: performance.now() + 1100 };
    st.f = Math.random() < .5 ? .05 : .95; st.phase = 'ready'; st.flash = null;
    ui.label(`SHOT ${i + 1}/${SHOTS}`, `${SUBJ[st.s.k][0]} · 화면을 좌우로 문질러 초점을 맞추고 셔터!`);
  }
  function fire() {
    if (!st || st.phase !== 'play') return;
    const t = (performance.now() - st.s.t0) / 1000, err = Math.abs(st.f - tgt(t, st.s)), left = Math.max(0, 1 - t / LIMIT);
    const res = err <= WIN.p ? 'p' : err <= WIN.g ? 'g' : 'miss';
    st.flash = { at: performance.now(), res }; ui.sfx(res === 'miss' ? 'fail' : 'buy');
    if (res === 'miss') { st.miss++; st.combo = 0; ui.pop('흔들렸다!', 'miss'); ui.combo(''); }
    else { const pts = (res === 'p' ? 2 : 1) + left; st.pts += pts; st[res === 'p' ? 'perf' : 'good']++; st.combo++; st.best = Math.max(st.best, st.combo); st.fast += left;
      ui.pop(res === 'p' ? '단독 컷!' : '건졌다', res); ui.combo(left > .5 ? `빠른 셔터 +${Math.round(left * 100)}%` : ''); }
    st.phase = 'snap'; st.snapAt = performance.now();
  }
  function frame(now) {
    const s = st.s, t = (now - s.t0) / 1000;
    if (st.phase === 'ready' && t >= 0) { st.phase = 'play'; ui.label(`SHOT ${st.i + 1}/${SHOTS}`, ''); }
    if (st.phase === 'play' && t >= LIMIT) { st.miss++; st.combo = 0; ui.pop('놓쳤다!', 'miss'); ui.sfx('fail'); st.phase = 'snap'; st.snapAt = now; st.flash = { at: now, res: 'miss' }; }
    if (st.phase === 'snap' && now - st.snapAt > 700) {
      if (st.i + 1 < SHOTS) shot(st.i + 1);
      else { st.phase = 'done'; const ratio = st.pts / (SHOTS * 3) + .1 * (st.perf === SHOTS);
        ui.done({ grade: ratio >= .8 ? 'S' : ratio >= .65 ? 'A' : ratio >= .45 ? 'B' : 'C', ratio, perfect: st.perf === SHOTS, stat: `단독 ${st.perf} · 건짐 ${st.good} · 놓침 ${st.miss} · 셔터 속도 ${Math.round(st.fast / SHOTS * 100)}%` }); return false; }
    }
    draw(now, Math.max(0, t));
  }
  function draw(now, t) {
    const s = st.s, live = st.phase === 'play', target = tgt(live || st.phase === 'snap' ? Math.min(t, LIMIT) : 0, s), err = Math.abs(st.f - target);
    // 1) 장면을 작은 캔버스(게임 좌표 2배)에 그린 뒤, 초점이 어긋난 만큼 거칠게 줄였다 키워 흐리게
    const o = ox, T = now / 1000; o.setTransform(2, 0, 0, 2, 0, 0); o.imageSmoothingEnabled = false;
    for (let i = 0; i < 150; i += 2) px(o, 0, i, MG_W, 2, MIX('#0b1430', '#3b2a6b', Math.min(1, i / 110)));
    for (let i = 0; i < 30; i++) px(o, (i * 47) % 240, (i * 23) % 50, .5, .5, '#c2c3c7');
    for (let i = 0; i < 11; i++) { const bx = i * 23 - 6, bh = 50 + (i * 37) % 45; px(o, bx, 124 - bh, 21, bh, i % 2 ? '#1d2b53' : '#222c5a'); for (let yy = 128 - bh; yy < 120; yy += 5) for (let xx = bx + 2; xx < bx + 19; xx += 4) if ((xx * 7 + yy * 3 + i) % 9 < 4) px(o, xx, yy, 2, 2.5, '#ffe28a'); }
    for (let i = 0; i < 5; i++) { const lx = 18 + i * 52; px(o, lx, 92, 1.5, 32, '#3a4466'); px(o, lx - 4, 91, 9, 2, '#566c86'); o.globalAlpha = .25; px(o, lx - 8, 93, 17, 30, '#ffcd75'); o.globalAlpha = 1; px(o, lx - 3, 93, 7, 1.5, '#fff6c0'); }
    px(o, 0, 124, MG_W, 26, '#2c3246'); px(o, 0, 124, MG_W, 1, '#566c86'); for (let i = 0; i < 12; i++) px(o, i * 24 - (T * 10) % 24, 136, 12, 1, '#ffcd75');
    const sx = 120 + Math.sin(t * .9 + s.ph) * 34, sy = 78 + Math.sin(t * 1.3 + s.ph2) * 10, sc = .8 + target * .5; // 피사체: 가까워질수록 크게
    SUBJ[s.k][1](o, sx, sy, sc, now);
    for (let i = 0; i < 16; i++) { const hx = i * 16 - 2 + Math.sin(T * 2 + i) * .8; px(o, hx, 138 + (i % 3), 10, 12, '#0b0b14'); px(o, hx + 2, 133 + (i % 3), 6, 6, '#0b0b14'); if (i % 4 === 1) { px(o, hx + 6, 129, 6, 4, '#14141f'); px(o, hx + 11, 130, 2, 2, '#566c86'); } } // 앞줄 취재진 실루엣
    const blk = Math.max(1, Math.round(err * 34));
    cx.imageSmoothingEnabled = false;
    if (blk > 1) { const w = Math.ceil(MG_W / blk), h = Math.ceil(MG_H / blk); const tc = off.getContext('2d'); tc.imageSmoothingEnabled = true; tc.clearRect(0, 0, w, h); tc.drawImage(o.canvas, 0, 0, w, h); cx.drawImage(off, 0, 0, w, h, 0, 0, MG_W, MG_H); }
    else cx.drawImage(o.canvas, 0, 0, MG_W, MG_H);
    // 2) 뷰파인더 화면 표시
    const ok = err <= WIN.p, near = err <= WIN.g;
    R(0, 0, MG_W, 15, '#0b0b1499'); R(0, 120, MG_W, 30, '#0b0b1499');
    [[6, 18, 1, 1], [234, 18, -1, 1], [6, 116, 1, -1], [234, 116, -1, -1]].forEach(([x, y, a, b]) => { R(a > 0 ? x : x - 14, y > 70 ? y - 1.5 : y, 14, 1.5, '#f4f4f4'); R(a > 0 ? x : x - 1.5, b > 0 ? y : y - 14, 1.5, 14, '#f4f4f4'); });
    const fc = ok ? '#a7f070' : near ? '#ffcd75' : '#f4f4f4', bx = 120, by = 70;
    [[-24, -17], [18, -17], [-24, 15], [18, 15]].forEach(([dx, dy]) => { R(bx + dx, by + dy, 6, 1.5, fc); R(bx + (dx > 0 ? dx + 4.5 : dx), by + (dy > 0 ? dy - 4.5 : dy), 1.5, 6, fc); });
    R(bx - .5, by - 3, 1, 6, fc + '99'); R(bx - 3, by - .5, 6, 1, fc + '99');
    TX(ok ? 'AF ●' : near ? 'AF ○' : 'MF', bx, by + 26, 5, fc, MONO, 'center');
    R(6, 4.5, 5, 5, Math.floor(now / 400) % 2 ? '#ff2e4d' : '#7a1a26'); TX('REC', 13, 9.5, 5.5, '#f4f4f4', MONO);
    const tcn = Math.floor(now / 33.3); TX(`00:${String(Math.floor(tcn / 1800) % 60).padStart(2, '0')}:${String(Math.floor(tcn / 30) % 60).padStart(2, '0')}:${String(tcn % 30).padStart(2, '0')}`, 32, 9.5, 5.5, '#f4f4f4', MONO);
    TX('4K 29.97  ISO 3200  F2.8', 92, 9.5, 4.5, '#c2c3c7', MONO);
    R(214, 4.5, 14, 6, '#f4f4f4'); R(228, 6, 1.5, 3, '#f4f4f4'); R(215, 5.5, 12, 4, '#0b0b14'); R(215.5, 6, 8, 3, '#a7f070');
    if (live) { const left = Math.max(0, LIMIT - t); TX(left.toFixed(1) + 's', 208, 9.5, 5.5, left < 2 ? '#ff5050' : '#ffcd75', MONO, 'right'); }
    for (let ch = 0; ch < 2; ch++) { const lv = .4 + Math.abs(Math.sin(now / 130 + ch * 1.7)) * .5; for (let i = 0; i < 12; i++) R(4 + ch * 3.5, 112 - i * 7, 2.5, 6, i / 12 < lv ? (i > 9 ? '#ff5050' : i > 7 ? '#ffcd75' : '#38b764') : '#22253a'); }
    // 포커스 링 눈금(정답은 보이지 않는다: 감으로 맞추기)
    R(20, 126, 200, 18, '#0b0b14cc'); const L = [['0.3', 0], ['0.5', .2], ['1', .4], ['2', .6], ['5', .8], ['∞', 1]];
    for (let i = 0; i <= 40; i++) R(24 + i * 4.8, 129, .5, i % 4 ? 2.5 : 4.5, '#566c86');
    L.forEach(([n, v]) => TX(n, 24 + v * 192, 142, 4.5, '#94b0c2', MONO, 'center'));
    const fx = 24 + st.f * 192; R(fx - .75, 127, 1.5, 9, ok ? '#a7f070' : '#ffcd75'); R(fx - 3, 135, 6, 1.5, ok ? '#a7f070' : '#ffcd75');
    if (st.flash && now - st.flash.at < 160) { cx.globalAlpha = 1 - (now - st.flash.at) / 160; R(0, 0, MG_W, MG_H, '#ffffff'); cx.globalAlpha = 1; } // 셔터 플래시
    if (st.phase === 'snap') { cx.strokeStyle = st.flash && st.flash.res !== 'miss' ? '#a7f070' : '#ff5050'; cx.lineWidth = 2.5; cx.strokeRect(2, 2, MG_W - 4, MG_H - 4); }
  }
  // ── 피사체 그림(가상 인물·소재, 실존 인물 아님). u = 한 칸 크기
  function px(o, x, y, w, h, c) { o.fillStyle = c; o.fillRect(x, y, w, h); }
  function star(o, x, y, s, now) { const u = 1.6 * s, P = (dx, dy, w, h, c) => px(o, x + dx * u, y + dy * u, w * u, h * u, c); // 공항 출국 스타: 모자·선글라스·트렌치코트·캐리어
    P(-4, 18, 3, 6, '#29366f'); P(1, 18, 3, 6, '#29366f'); P(-5, 23, 4, 1.5, '#14141f'); P(1, 23, 4, 1.5, '#14141f');
    P(-6, 2, 12, 17, '#c2a35a'); P(-6, 2, 12, 1, '#d8bf7a'); P(-1, 2, 2, 14, '#a8883e'); P(-6, 10, 12, 1.5, '#8b6d2e'); P(-8, 3, 2.5, 11, '#c2a35a'); P(5.5, 3, 2.5, 11, '#a8883e'); P(-8, 13.5, 2.5, 2, '#f2c9a0'); P(5.5, 13.5, 2.5, 2, '#f2c9a0');
    P(-1.5, 0, 3, 2.5, '#e0ac7e'); P(-4, -9, 8, 9, '#f2c9a0'); P(2.5, -8, 1.5, 7, '#e0ac7e'); P(-5, -11, 10, 3, '#14141f'); P(-6.5, -8.5, 13, 1.5, '#14141f'); P(-4.5, -7, 3.5, 2, '#14141f'); P(1, -7, 3.5, 2, '#14141f'); P(-1, -6.5, 2, .7, '#14141f'); P(-3.8, -6.6, 1, .6, '#94b0c2'); P(1.7, -6.6, 1, .6, '#94b0c2'); P(-1.2, -2.5, 2.4, .8, '#c2665a');
    P(8, 8, 7, 10, '#e43b44'); P(8, 8, 7, 1, '#ff6070'); P(10.5, 5, 2, 3, '#566c86'); P(9, 18, 1.5, 1.5, '#14141f'); P(13, 18, 1.5, 1.5, '#14141f'); P(8, 12, 7, .8, '#b13e53'); }
  function robot(o, x, y, s, now) { const u = 1.9 * s, P = (dx, dy, w, h, c) => px(o, x + dx * u, y + dy * u, w * u, h * u, c), bl = Math.floor(now / 300) % 2; // 거대 로봇
    P(-.5, -16, 1, 4, '#566c86'); P(-1.5, -17, 3, 1.5, bl ? '#ff2e4d' : '#ffcd75');
    P(-5, -12, 10, 8, '#94b0c2'); P(-5, -12, 10, 1, '#c2c3c7'); P(4, -11, 1, 7, '#566c86'); P(-4, -9.5, 8, 3, '#14141f'); P(-3.5, -9, 2.5, 2, bl ? '#ff2e4d' : '#ffcd75'); P(1, -9, 2.5, 2, bl ? '#ff2e4d' : '#ffcd75'); P(-3, -5.5, 6, .8, '#566c86');
    P(-8, -3, 16, 12, '#566c86'); P(-8, -3, 16, 1.2, '#8b9bb4'); P(7, -3, 1, 12, '#3a4466'); P(-3, -1, 6, 5, '#14141f'); P(-2.5, -.5, 5, 4, '#41a6f6'); P(-1.5, .5, 3, 2, Math.floor(now / 150) % 2 ? '#73eff7' : '#ffffff');
    for (let i = 0; i < 3; i++) P(-7 + i * 1.6, 5, 1, 2, ['#e43b44', '#ffcd75', '#38b764'][(i + bl) % 3]);
    P(-12, -3, 4, 4, '#94b0c2'); P(-12, 1, 3.5, 8, '#8b9bb4'); P(-12.5, 9, 4.5, 3, '#566c86'); P(8, -3, 4, 4, '#94b0c2'); P(8.5, 1, 3.5, 8, '#8b9bb4'); P(8, 9, 4.5, 3, '#566c86');
    P(-6, 9, 12, 3, '#3a4466'); P(-6, 12, 4.5, 9, '#566c86'); P(1.5, 12, 4.5, 9, '#566c86'); P(-6, 15, 4.5, 1, '#3a4466'); P(1.5, 15, 4.5, 1, '#3a4466'); P(-7, 21, 6.5, 2.5, '#333c57'); P(.5, 21, 6.5, 2.5, '#333c57'); }
  function hero(o, x, y, s, now) { const u = 1.7 * s, P = (dx, dy, w, h, c) => px(o, x + dx * u, y + dy * u, w * u, h * u, c), f = Math.floor(now / 150) % 2; // 하늘을 나는 히어로(오리지널)
    P(-17, -3 + f, 10, 5, '#b13e53'); P(-20, -1 + f * 2, 4, 4, '#b13e53'); P(-13, -4, 7, 6, '#e43b44');
    P(-12, -3, 13, 6, '#3b5dc9'); P(-12, -3, 13, 1, '#5b7de9'); P(-14, -2, 3, 4, '#3b5dc9'); P(-17, -2, 3, 4, '#e43b44'); P(-4, -1.5, 4, 3, '#ffcd75'); P(-3, -.5, 2, 1, '#e43b44'); P(-12, 2, 13, 1, '#ffcd75');
    P(1, -4, 6, 7, '#f2c9a0'); P(1, -5, 6, 2.5, '#3b2a20'); P(4, -2.5, 1.5, 1.5, '#14141f'); P(1.5, -3.2, 5.5, 1.2, '#41a6f6'); P(6, -.5, 1, .8, '#c2665a');
    P(7, -6, 7, 2.5, '#3b5dc9'); P(13, -6.5, 2.5, 3.5, '#ffcd75'); P(1, 2.5, 6, 2, '#3b5dc9'); P(7, 3, 2, 2, '#f2c9a0');
    for (let i = 0; i < 3; i++) px(o, x - 22 * u - i * 6, y - 2 * u + i * 3, 5, .8, '#ffffff99'); }
  function ufo(o, x, y, s, now) { const u = 1.7 * s, P = (dx, dy, w, h, c) => px(o, x + dx * u, y + dy * u, w * u, h * u, c), k = Math.floor(now / 200); // 정체불명 UFO
    o.globalAlpha = .28; for (let i = 0; i < 10; i++) P(-4 - i, 4 + i * 2, 8 + i * 2, 2, '#a7f070'); o.globalAlpha = 1;
    P(-5, -8, 10, 6, '#73eff7'); P(-4, -9, 8, 1.5, '#b8f6ff'); P(-3, -7, 2, 2, '#ffffff'); P(-1.5, -6, 3, 3, '#38b764'); P(-1, -5.5, .8, .8, '#14141f'); P(.4, -5.5, .8, .8, '#14141f');
    P(-14, -2, 28, 5, '#94b0c2'); P(-14, -2, 28, 1, '#dfe6ee'); P(-12, 3, 24, 2, '#566c86'); P(-8, 5, 16, 1.5, '#3a4466');
    for (let i = 0; i < 6; i++) P(-12 + i * 4.6, .2, 2, 1.6, (k + i) % 3 ? '#ffcd75' : '#ef7d57'); }
  function speaker(o, x, y, s) { const u = 1.6 * s, P = (dx, dy, w, h, c) => px(o, x + dx * u, y + dy * u, w * u, h * u, c); // 기자회견장 대변인
    P(-20, -22, 40, 26, '#29366f'); P(-20, -22, 40, 1.5, '#3b5dc9'); for (let i = 0; i < 4; i++) P(-18 + i * 10, -18, 6, 6, '#3b5dc944');
    P(-6, -2, 12, 14, '#1a1c2c'); P(-1, -2, 2, 9, '#f4f4f4'); P(-.5, -2, 1, 8, '#b13e53'); P(-8, -1, 2.5, 9, '#1a1c2c'); P(5.5, -1, 2.5, 9, '#1a1c2c');
    P(-1.5, -4, 3, 2, '#e0ac7e'); P(-4, -13, 8, 9, '#f2c9a0'); P(2.5, -12, 1.5, 8, '#e0ac7e'); P(-4.5, -14, 9, 3, '#3b2a20'); P(-4.5, -12, 1.5, 3, '#3b2a20'); P(-2.5, -9.5, 1.2, 1.5, '#14141f'); P(1.3, -9.5, 1.2, 1.5, '#14141f'); P(-1.2, -6.5, 2.4, .8, '#c2665a');
    P(-12, 4, 24, 14, '#5d275d'); P(-12, 4, 24, 1.5, '#8b4a8b'); P(-4, 8, 8, 5, '#ffcd75'); P(-3, 9, 6, 3, '#a05a00');
    [[-6, '#e43b44'], [-3, '#41a6f6'], [0, '#38b764'], [3, '#ffcd75'], [6, '#f4f4f4']].forEach(([mx, c], i) => { P(mx * .9 - .5, -2 + (i % 2), 1, 6, '#333c57'); P(mx * .9 - 1.2, -3 + (i % 2), 2.4, 2, '#14141f'); P(mx * .9 - 1.2, -1 + (i % 2), 2.4, 1.2, c); }); }
  let dragX = null;
  return {
    id: 'focus', shutter: true,
    start() {
      if (!off) { off = document.createElement('canvas'); off.width = MG_W; off.height = MG_H; const c = document.createElement('canvas'); c.width = MG_W * 2; c.height = MG_H * 2; ox = c.getContext('2d'); }
      const order = [0, 1, 2, 3, 4].sort(() => Math.random() - .5);
      st = { order, i: 0, pts: 0, perf: 0, good: 0, miss: 0, combo: 0, best: 0, fast: 0, f: .5 }; shot(0); loop(frame);
    },
    stop() { st = null; dragX = null; },
    down(x) { dragX = x; }, up() { dragX = null; },
    move(x) { if (dragX == null || !st) return; st.f = Math.max(0, Math.min(1, st.f + (x - dragX) / 170)); dragX = x; }, // 화면 너비의 70%를 문지르면 끝에서 끝
    key(e) { if (!st) return; if (e.key === 'ArrowLeft') st.f = Math.max(0, st.f - .03); else if (e.key === 'ArrowRight') st.f = Math.min(1, st.f + .03); else if (e.key === ' ' || e.key === 'Enter') fire(); },
    shot: () => fire(),
    get debug() { return st && { ...st, target: st.s ? tgt((performance.now() - st.s.t0) / 1000, st.s) : 0 }; },
  };
})();

// ───────── 3. 긴급 수정 (그래픽 디자이너) ─────────
// 카드를 잠깐 다 보여 준 뒤 뒤집는다. 같은 그림(마지막 단계는 '용어 ↔ 뜻')끼리 짝을 맞춘다.
// 4단계: 2x3 → 3x4 → 4x4 → 4x5. 단계마다 제한 시간, 시간이 끝나면 게임 끝. 남은 시간만큼 보너스.
const MATCH = (() => {
  const STAGES = [
    { c: 3, r: 2, kind: 'icon', show: 1.8, lim: 12 },
    { c: 4, r: 3, kind: 'mix', show: 2.6, lim: 21 },
    { c: 4, r: 4, kind: 'word', show: 3.0, lim: 28 },
    { c: 5, r: 4, kind: 'term', show: 3.6, lim: 40 },
  ];
  const WORDS = ['속보', '단독', '특종', '생중계', '앵커', '자막', '큐시트', '데스크', '리포트', '현장', '엠바고', '오보'];
  const TERMS = [['엠바고', '보도유예'], ['풀', '공동취재'], ['데스크', '기사검토'], ['큐시트', '방송순서'], ['리드', '첫 문장'], ['인서트', '삽입화면'], ['스탠딩', '기자등장'], ['바이라인', '기자이름'], ['크로마키', '합성배경'], ['클로징', '마무리말'], ['VCR', '녹화영상'], ['슈퍼', '화면자막']];
  const ICONS = ['mic', 'cam', 'heli', 'sat', 'globe', 'gavel', 'scale', 'shield', 'dome', 'tv'], FACES = 6;
  const TOP = 4, GAP = 4;
  const WCOL = [['#ffe1e1', '#b13e53'], ['#dff3ff', '#3b5dc9'], ['#e2f7d9', '#257179'], ['#fff1c9', '#a05a00'], ['#efe2ff', '#5d275d'], ['#ffe6d4', '#c0502a'], ['#dcf5f2', '#1f6f6a'], ['#f2f2f2', '#1a1c2c'], ['#fde2f3', '#a0306e'], ['#e6ebff', '#29366f']]; // 단어 카드 [바탕, 글자]
  let st = null;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function deal(k) {
    const S = STAGES[k], n = S.c * S.r / 2; let cards = []; st.pairsAll += st.got || 0;
    // 단어 단계도 절반은 쉬운 그림(아이콘·얼굴)을 섞는다. 단어는 짝마다 색이 다르다
    const pics = shuffle([...ICONS.map(v => ({ t: 'icon', v })), ...Array.from({ length: FACES }, (_, v) => ({ t: 'face', v }))]);
    const nw = S.kind === 'icon' || S.kind === 'mix' ? 0 : Math.floor(n / 2), col = shuffle(WCOL.slice());
    if (S.kind === 'term') shuffle(TERMS.slice()).slice(0, nw).forEach((t, i) => cards.push({ p: i, t: 'txt', v: t[0], term: 1, col: col[i] }, { p: i, t: 'txt', v: t[1], col: col[i] }));
    else if (nw) shuffle(WORDS.slice()).slice(0, nw).forEach((v, i) => cards.push({ p: i, t: 'txt', v, col: col[i] }, { p: i, t: 'txt', v, col: col[i] }));
    (S.kind === 'icon' ? pics.filter(x => x.t === 'icon') : pics).slice(0, n - nw).forEach((x, i) => cards.push({ p: nw + i, ...x }, { p: nw + i, ...x }));
    const cw = (MG_W - GAP * (S.c + 1)) / S.c, ch = (MG_H - TOP - GAP * (S.r + 1)) / S.r;
    st.cards = shuffle(cards).map((c, i) => ({ ...c, x: GAP + (i % S.c) * (cw + GAP), y: TOP + GAP + Math.floor(i / S.c) * (ch + GAP), w: cw, h: ch, up: 1, done: 0, flip: 0 }));
    st.k = k; st.open = []; st.lock = 0; st.phase = 'show'; st.t0 = performance.now(); st.pairs = n; st.got = 0;
    ui.label(`STAGE ${k + 1}/${STAGES.length}`, S.kind === 'term' ? '그림끼리, 용어와 뜻끼리 짝지어요. 잘 봐 두세요!' : `카드 ${S.c * S.r}장 · 잘 봐 두세요!`);
  }
  function tap(x, y) {
    if (!st || st.phase !== 'play' || st.lock) return;
    const c = st.cards.find(c => !c.done && !c.up && x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h); if (!c) return;
    c.up = 1; c.flip = performance.now(); st.open.push(c); ui.sfx('buy');
    if (st.open.length < 2) return;
    const [a, b] = st.open; st.open = [];
    if (a.p === b.p) { a.done = b.done = 1; st.got++; st.pts++; st.combo++; st.best = Math.max(st.best, st.combo); ui.pop(st.combo > 2 ? '연속 수정!' : '수정 완료', 'p'); ui.combo(st.combo > 1 ? `${st.combo} COMBO` : '');
      if (st.got === st.pairs) clear(); }
    else { st.lock = 1; st.miss++; st.combo = 0; ui.pop('다시!', 'miss'); ui.combo(''); setTimeout(() => { if (!st) return; a.up = b.up = 0; a.flip = b.flip = performance.now(); st.lock = 0; ui.sfx('fail'); }, 650); }
  }
  function clear() {
    const S = STAGES[st.k], left = Math.max(0, 1 - (performance.now() - st.t0) / 1000 / S.lim); st.pts += left * 2; st.cleared++; st.phase = 'clear'; st.tc = performance.now();
    ui.pop(`STAGE CLEAR`, 'p'); ui.combo(`남은 시간 보너스 +${Math.round(left * 100)}%`); ui.sfx('rank');
  }
  function end() {
    st.phase = 'done'; const all = STAGES.reduce((a, S) => a + S.c * S.r / 2 + 2, 0), ratio = st.pts / all;
    ui.done({ grade: ratio >= .8 ? 'S' : ratio >= .62 ? 'A' : ratio >= .42 ? 'B' : 'C', ratio, perfect: st.cleared === STAGES.length && st.miss === 0,
      stat: `통과 ${st.cleared}/${STAGES.length}단계 · 짝 ${st.ptsPairs()}쌍 · 실수 ${st.miss} · 최대 ${st.best}콤보` });
  }
  function frame(now) {
    const S = STAGES[st.k], t = (now - st.t0) / 1000;
    if (st.phase === 'show' && t >= S.show) { st.phase = 'play'; st.t0 = now; st.cards.forEach(c => { c.up = 0; c.flip = now; }); ui.label(`STAGE ${st.k + 1}/${STAGES.length}`, S.kind === 'term' ? '그림은 같은 그림끼리, 용어는 뜻과 짝!' : '같은 카드끼리 탭해서 짝을 맞춰요!'); }
    if (st.phase === 'play' && t >= S.lim) { ui.pop('시간 초과!', 'miss'); ui.sfx('fail'); end(); draw(now); return false; }
    if (st.phase === 'clear' && now - st.tc > 900) { if (st.k + 1 < STAGES.length) deal(st.k + 1); else { end(); draw(now); return false; } }
    draw(now);
  }
  function card(x, y, w, h, c) { R(x + 1, y, w - 2, h, c); R(x, y + 1, w, h - 2, c); } // 모서리를 깎은 카드
  function draw(now) {
    const S = STAGES[st.k]; R(0, 0, MG_W, MG_H, '#1a1c2c'); for (let i = 0; i < MG_H; i += 6) R(0, i, MG_W, .5, '#20233a');
    if (st.phase === 'play') { const r = Math.max(0, 1 - (now - st.t0) / 1000 / S.lim); R(0, 0, MG_W, 3, '#0b0b14'); R(0, 0, MG_W * r, 3, r < .25 ? '#ff5050' : '#ffcd75'); R(0, 0, MG_W * r, 1, r < .25 ? '#ff9090' : '#fff1c9'); }
    if (st.phase === 'show') { const r = 1 - (now - st.t0) / 1000 / S.show; R(0, 0, MG_W * Math.max(0, r), 3, '#41a6f6'); }
    st.cards.forEach(c => {
      const ft = Math.min(1, (now - c.flip) / 140), sx = c.flip ? Math.abs(1 - 2 * ft) : 1, face = c.flip && ft < .5 ? !c.up : c.up; // 뒤집기: 가로로 접혔다 펴진다
      const w = Math.max(1, c.w * sx), x = c.x + (c.w - w) / 2;
      cx.globalAlpha = .5; card(x + .5, c.y + 1.5, w, c.h, '#0b0b14'); cx.globalAlpha = c.done ? .45 : 1;
      if (face) { card(x, c.y, w, c.h, c.col ? c.col[1] : '#c2c3c7'); card(x + .75, c.y + .75, w - 1.5, c.h - 1.5, c.col ? c.col[0] : '#f4f4f4'); if (sx > .6) { cx.save(); cx.beginPath(); cx.rect(x + 1, c.y + 1, w - 2, c.h - 2); cx.clip(); art(c, c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h), now); cx.restore(); } }
      else { card(x, c.y, w, c.h, '#29366f'); card(x + .75, c.y + .75, w - 1.5, c.h - 1.5, '#3b5dc9');
        cx.save(); cx.beginPath(); cx.rect(x + 1, c.y + 1, w - 2, c.h - 2); cx.clip(); for (let i = -c.h; i < w; i += 5) for (let j = 0; j < c.h; j += 1) R(x + i + j, c.y + j, 1, 1, '#4a6ee0'); cx.restore();
        R(x + 1, c.y + c.h / 2 - 5, w - 2, 10, '#b13e53'); R(x + 1, c.y + c.h / 2 - 5, w - 2, 1, '#e8606c'); if (w > 22) TX('NEWS', c.x + c.w / 2, c.y + c.h / 2 + 2.5, 6.5, '#ffffff', KOF, 'center'); }
      if (c.done) { cx.globalAlpha = 1; R(c.x + c.w - 10, c.y + 2, 8, 8, '#38b764'); R(c.x + c.w - 8, c.y + 5.5, 1.5, 1.5, '#ffffff'); R(c.x + c.w - 6.5, c.y + 7, 1.5, 1.5, '#ffffff'); R(c.x + c.w - 5, c.y + 5.5, 1.5, 1.5, '#ffffff'); R(c.x + c.w - 3.5, c.y + 4, 1.5, 1.5, '#ffffff'); }
      cx.globalAlpha = 1;
    });
  }
  // 카드 그림: 텍스트 / 가상 아이콘(실제 기관 상징 아님) / 가상 인물 얼굴(스카우트 카드 인물)
  const FACE_ID = ['c1', 'c4', 'c7', 'c10', 'c16', 'c9'];
  function art(c, x, y, s, now) {
    if (c.t === 'txt') {
      const n = c.v.length; TX(c.v, x, y + 4, n >= 4 ? 9.5 : 11.5, c.col ? c.col[1] : '#1a1c2c', KOF, 'center');
      if (c.term) { cx.globalAlpha = .7; TX('용어', x, y - 8, 6, c.col ? c.col[1] : '#1a1c2c', KOF, 'center'); cx.globalAlpha = 1; } return; }
    if (c.t === 'face') { const k = s / 30; drawFigure((gx, gy, w, h, col) => R(x + (gx - 16) * k, y + (gy - 9) * k, w * k, h * k, col), FACE_ID[c.v], 1, now / 1000); return; }
    const u = s / 22, P = (dx, dy, w, h, col) => R(x + dx * u, y + dy * u, w * u, h * u, col);
    switch (c.v) {
      case 'mic': P(-3, -9, 6, 9, '#3a4466'); P(-2.5, -8.5, 5, 8, '#566c86'); for (let i = 0; i < 4; i++) P(-2.5, -8 + i * 2, 5, .6, '#8b9bb4'); P(-3.5, -1, 7, 2.5, '#e43b44'); P(-3.5, -1, 7, .6, '#ff8090'); P(-1, 1.5, 2, 5, '#333c57'); P(-1.5, 2, 3, 1, '#566c86'); P(-5, 6.5, 10, 2, '#333c57'); P(-5, 6.5, 10, .6, '#566c86'); break;
      case 'cam': P(-9, -5, 14, 10, '#333c57'); P(-9, -5, 14, 1, '#566c86'); P(5, -3.5, 5, 7, '#222633'); P(6, -2.5, 3.5, 5, '#41a6f6'); P(6.5, -2, 1.5, 1.5, '#ffffff'); P(-7, -8, 6, 3, '#3a4466'); P(-8, -3, 4, 3, '#14141f'); P(-7.5, -2.5, 3, 2, '#73eff7'); P(1, -4, 2, 2, '#e43b44'); P(-5, 5, 2, 3, '#333c57'); P(-1, 5, 2, 3, '#333c57'); break;
      case 'heli': P(-10, -8, 20, 1, '#333c57'); P(-.5, -7, 1.5, 2, '#333c57'); P(-6, -5, 11, 7, '#41a6f6'); P(-6, -5, 11, 1, '#73b6ef'); P(1, -4, 4, 4, '#b8dcff'); P(1.5, -3.5, 1.5, 1.5, '#ffffff'); P(-14, -3, 9, 2, '#3b5dc9'); P(-15, -6, 1.5, 6, '#333c57'); P(-5, 3, 10, 1, '#333c57'); P(-4, 2, 1, 1.5, '#333c57'); P(3, 2, 1, 1.5, '#333c57'); break;
      case 'sat': P(-2.5, -2.5, 5, 5, '#ffcd75'); P(-2.5, -2.5, 5, 1, '#fff1c9'); P(-11, -2, 7, 4, '#3b5dc9'); P(4, -2, 7, 4, '#3b5dc9'); for (let i = 0; i < 3; i++) { P(-10.5 + i * 2.3, -2, .4, 4, '#73b6ef'); P(4.5 + i * 2.3, -2, .4, 4, '#73b6ef'); } P(-4, -.4, 1.5, .8, '#566c86'); P(2.5, -.4, 1.5, .8, '#566c86'); P(-.5, -7, 1, 4.5, '#566c86'); P(-2, -8.5, 4, 2, '#e43b44'); break;
      case 'globe': P(-7, -5, 14, 10, '#41a6f6'); P(-5, -7, 10, 14, '#41a6f6'); P(-6, -6, 12, 12, '#41a6f6'); P(-4, -5, 5, 3, '#38b764'); P(-5, -2, 3, 3, '#38b764'); P(2, 0, 4, 4, '#38b764'); P(-1, 2, 2, 3, '#38b764'); P(-7, -.3, 14, .6, '#dfe6ee'); P(-.3, -7, .6, 14, '#dfe6ee'); P(-4, -5, 2, 1, '#b8dcff'); P(-1, 7.5, 2, 1.5, '#566c86'); P(-4, 9, 8, 1.2, '#566c86'); break;
      case 'gavel': P(-7, -7, 10, 5, '#ab5236'); P(-7, -7, 10, 1, '#d07a50'); P(-8, -7.5, 1.5, 6, '#7a4a2a'); P(3, -7.5, 1.5, 6, '#7a4a2a'); P(-1, -2, 2, 9, '#7a4a2a'); P(-8, 7, 16, 2.5, '#566c86'); P(-8, 7, 16, .6, '#8b9bb4'); break;
      case 'scale': P(-.5, -8, 1, 15, '#566c86'); P(-1.5, -9, 3, 2, '#ffcd75'); P(-9, -6, 18, 1, '#566c86'); P(-8.5, -5, .5, 4, '#8b9bb4'); P(8, -5, .5, 4, '#8b9bb4'); P(-11, -1, 6, 1.5, '#ffcd75'); P(5, -1, 6, 1.5, '#ffcd75'); P(-10, .5, 4, 1, '#d8a050'); P(6, .5, 4, 1, '#d8a050'); P(-4, 7, 8, 1.5, '#333c57'); break;
      case 'shield': P(-7, -8, 14, 9, '#3b5dc9'); P(-6, 1, 12, 3, '#3b5dc9'); P(-4, 4, 8, 2, '#3b5dc9'); P(-2, 6, 4, 2, '#3b5dc9'); P(-7, -8, 14, 1, '#73b6ef'); P(-1, -6, 2, 10, '#ffcd75'); P(-4, -3, 8, 2, '#ffcd75'); break;
      case 'dome': P(-4, -10, 8, 1.5, '#94b0c2'); P(-6, -8.5, 12, 4, '#94b0c2'); P(-6, -8.5, 12, 1, '#dfe6ee'); P(-.5, -12, 1, 2, '#566c86'); P(-9, -4.5, 18, 1.5, '#566c86'); for (let i = 0; i < 5; i++) P(-8 + i * 3.7, -3, 1.5, 7, '#f4f4f4'); P(-10, 4, 20, 2, '#566c86'); P(-11, 6, 22, 1.5, '#3a4466'); break;
      case 'tv': P(-4, -11, 1, 3, '#566c86'); P(3, -11, 1, 3, '#566c86'); P(-10, -8, 20, 14, '#333c57'); P(-9, -7, 18, 12, '#41a6f6'); P(-9, -7, 18, 2, '#73b6ef'); P(-9, 1, 18, 4, '#e43b44'); P(-8, 2, 6, 2, '#ffffff'); P(-1, 2.3, 8, 1, '#ffd0d0'); P(-3, 6, 6, 1.5, '#566c86'); P(-6, 7.5, 12, 1.2, '#3a4466'); break;
    }
  }
  return {
    id: 'match', shutter: false,
    start() { st = { k: 0, pts: 0, cleared: 0, miss: 0, combo: 0, best: 0, pairsAll: 0, ptsPairs() { return this.pairsAll + this.got; } }; deal(0); loop(frame); },
    stop() { st = null; },
    down(x, y) { tap(x, y); }, move() { }, up() { }, key() { }, shot() { },
    get debug() { return st && { phase: st.phase, k: st.k, cards: st.cards.map(c => ({ p: c.p, x: c.x + c.w / 2, y: c.y + c.h / 2, done: c.done, up: c.up })) }; },
  };
})();

// ───────── 4. 송출 사고 (방송 엔지니어) ─────────
// 오른쪽 레벨 미터의 초록 구간(정상 신호)이 흔들린다. 화면을 누르고 있으면 노란 레벨 막대가 올라가고, 떼면 내려간다.
// 막대가 초록 구간 안에 있으면 '송출 안정' 게이지가 차고, 벗어나면 줄어든다. 게이지를 채우면 복구! 사고 4건, 점점 어려워진다.
const SIGNAL = (() => {
  const CASES = [
    { n: '영상 신호 끊김', band: .38, jump: [2.0, 2.9], ease: 1.15 },
    { n: '오디오 레벨 폭주', band: .34, jump: [1.7, 2.6], ease: 1.4 },
    { n: '위성 링크 흔들림', band: .30, jump: [1.5, 2.3], ease: 1.65 },
    { n: '중계차 전송 장애', band: .27, jump: [1.3, 2.0], ease: 1.9 },
  ];
  const LIM = 18, UP = 1.65, DOWN = 1.35, VMAX = .8, FILL = .2, DRAIN = .08; // 감도: 천천히 오르내리고, 게이지는 빨리 차고 천천히 준다
  const MX = 168, MY = 6, MW = 30, MH = 136, GX = 208, GW = 24;
  let st = null;
  function incident(i) {
    st.i = i; st.c = CASES[i]; st.pos = .35; st.vel = 0; st.tgt = .55; st.goal = .55; st.nextJ = 0; st.gauge = .45; st.phase = 'ready'; st.t0 = performance.now() + 1200; st.last = 0; st.res = '';
    ui.label(`사고 ${i + 1}/${CASES.length}`, `${st.c.n}! 화면을 누르고 있으면 레벨이 올라가요. 초록 구간 안에 붙잡아 두세요`); ui.sfx('alert');
  }
  function frame(now) {
    const t = (now - st.t0) / 1000, dt = Math.min(.05, st.last ? (now - st.last) / 1000 : 0); st.last = now;
    if (st.phase === 'ready' && t >= 0) { st.phase = 'play'; ui.label(`사고 ${st.i + 1}/${CASES.length}`, st.c.n); }
    if (st.phase === 'play') {
      // 정상 신호 구간: 가끔 새 목표로 튀고, 부드럽게 따라간다
      if (t >= st.nextJ) { const c = st.c; st.goal = Math.max(.15, Math.min(.85, st.tgt + (Math.random() < .5 ? -1 : 1) * (.15 + Math.random() * .3))); st.nextJ = t + c.jump[0] + Math.random() * (c.jump[1] - c.jump[0]); }
      st.tgt += (st.goal - st.tgt) * Math.min(1, dt * st.c.ease);
      st.vel = Math.max(-VMAX, Math.min(VMAX, st.vel + (st.hold ? UP : -DOWN) * dt)); st.pos += st.vel * dt;
      if (st.pos < 0) { st.pos = 0; st.vel = Math.max(0, -st.vel * .25); } if (st.pos > 1) { st.pos = 1; st.vel = Math.min(0, -st.vel * .25); }
      st.in = Math.abs(st.pos - st.tgt) <= st.c.band / 2;
      st.gauge = Math.max(0, Math.min(1, st.gauge + (st.in ? FILL : -DRAIN) * dt)); st.inT += st.in ? dt : 0; st.allT += dt;
      if (st.gauge >= 1) { const left = Math.max(0, 1 - t / LIM); st.pts += 1 + left; st.ok++; st.fast += left; st.res = 'ok'; st.phase = 'end'; st.te = now; ui.pop('송출 정상화!', 'p'); ui.combo(`복구 ${t.toFixed(1)}초`); ui.sfx('rank'); }
      else if (st.gauge <= 0 || t >= LIM) { st.fail++; st.res = 'fail'; st.phase = 'end'; st.te = now; ui.pop(st.gauge <= 0 ? '방송 사고!' : '시간 초과!', 'miss'); ui.combo(''); ui.sfx('fail'); }
    }
    if (st.phase === 'end' && now - st.te > 1000) {
      if (st.i + 1 < CASES.length) incident(st.i + 1);
      else { st.phase = 'done'; const ratio = st.pts / (CASES.length * 2) + .05 * (st.inT / Math.max(1, st.allT));
        ui.done({ grade: ratio >= .75 ? 'S' : ratio >= .6 ? 'A' : ratio >= .4 ? 'B' : 'C', ratio, perfect: st.ok === CASES.length && st.fast / CASES.length > .5,
          stat: `복구 ${st.ok}/${CASES.length}건 · 사고 ${st.fail} · 신호 유지 ${Math.round(st.inT / Math.max(.01, st.allT) * 100)}%` }); draw(now); return false; }
    }
    draw(now);
  }
  function draw(now) { // 주조정실(MCR): 프로그램 모니터 + 파형 모니터 + 레벨 미터(LED) + 송출 안정 게이지
    const noise = st.phase === 'play' ? (st.in ? .05 : .55) * (1 - st.gauge * .6) : st.res === 'ok' ? 0 : .7;
    R(0, 0, MG_W, MG_H, '#101320');
    R(3, 3, 155, 91, '#0b0b14'); R(3.5, 3.5, 154, 90, '#2a2e44'); R(6, 6, 149, 4, '#1a1c2c'); TX('PGM · 주조정실', 8, 9.3, 3.8, '#94b0c2'); R(130, 6.5, 23, 3, st.res === 'fail' && st.phase === 'end' ? '#566c86' : '#e43b44'); TX('ON AIR', 141.5, 9.2, 3, '#ffffff', MONO, 'center');
    newsScene(st.i * 4, 8, 11, 145, 80, now);
    if (noise > 0) { for (let i = 0; i < 300 * noise; i++) R(8 + Math.random() * 143, 11 + Math.random() * 78, 1 + Math.random() * 4, .5 + Math.random(), Math.random() < .5 ? '#f4f4f4' : '#0b0b14');
      if (noise > .4) { const y = 11 + (now / 4) % 78; R(8, y, 145, 3, '#ffffff55'); R(8 + Math.sin(now / 50) * 3, y + 6, 145, 1.5, '#e43b4433'); } }
    if (st.res === 'fail' && st.phase === 'end') { ['#c2c3c7', '#ffcd75', '#73eff7', '#38b764', '#a05ae0', '#e43b44', '#3b5dc9'].forEach((c, i) => R(8 + i * 20.7, 11, 20.7, 60, c)); R(8, 71, 145, 20, '#14141f'); R(30, 32, 100, 18, '#0b0b14ee'); TX('NO SIGNAL', 80, 45, 10, '#ff5050', MONO, 'center'); }
    if (st.phase === 'play') { const left = Math.max(0, LIM - (now - st.t0) / 1000); R(129, 13, 22, 11, '#0b0b14cc'); TX(left.toFixed(0).padStart(2, '0'), 140, 21.5, 7.5, left < 4 ? '#ff5050' : '#f4f4f4', MONO, 'center'); }
    // 파형 모니터
    R(3, 97, 155, 50, '#0b0b14'); R(4, 98, 153, 48, '#0f1a1a'); TX('WAVEFORM', 6, 102.5, 3.5, '#38b764', MONO);
    for (let k = 0; k <= 4; k++) { const y = 104 + k * 10; R(16, y, 139, .4, '#1f4a40'); TX(String(100 - k * 25), 14, y + 1.3, 3, '#2f7a60', MONO, 'right'); }
    for (let x = 0; x < 139; x += 1.5) { const base = 124 - (st.pos - .5) * 30, j = (Math.random() - .5) * 40 * noise, y = base + Math.sin(x * .25 + now / 120) * 6 + Math.sin(x * .9) * 1.5 + j; R(16 + x, Math.max(104, Math.min(144, y)), 1.2, 1.2, st.in || st.res === 'ok' ? '#a7f070' : '#ff5050'); cx.globalAlpha = .35; R(16 + x, Math.max(104, Math.min(144, y + 2)), 1.2, 1.2, st.in || st.res === 'ok' ? '#38b764' : '#b13e53'); cx.globalAlpha = 1; }
    // 레벨 미터: LED 칸 + 정상 구간 + 내 레벨
    const Y = v => MY + (1 - v) * MH, bh = st.c.band * MH, N = 36;
    R(MX - 2, MY - 2, MW + 4, MH + 4, '#0b0b14'); R(MX, MY, MW, MH, '#14141f');
    for (let i = 0; i < N; i++) { const v0 = i / N, y = Y(v0) - MH / N, inb = Math.abs(v0 + .5 / N - st.tgt) <= st.c.band / 2; R(MX + 3, y + .4, MW - 6, MH / N - .8, inb ? (st.in ? '#38b764' : '#257179') : (i > N * .85 ? '#3a1a22' : '#1f2638')); if (inb) R(MX + 3, y + .4, MW - 6, .5, st.in ? '#a7f070' : '#38b764'); }
    R(MX, Y(st.tgt) - bh / 2 - .75, MW, 1.5, '#a7f070'); R(MX, Y(st.tgt) + bh / 2 - .75, MW, 1.5, '#a7f070');
    const py = Y(st.pos); R(MX - 4, py - 2.5, MW + 8, 5, st.in ? '#ffcd75' : '#ef7d57'); R(MX - 4, py - 2.5, MW + 8, 1, '#ffffff88'); R(MX - 4, py - .4, MW + 8, .8, '#0b0b14'); R(MX - 7, py - 2, 3, 4, st.in ? '#ffcd75' : '#ef7d57');
    // 송출 안정 게이지
    R(GX - 2, MY - 2, GW + 4, MH + 4, '#0b0b14'); R(GX, MY, GW, MH, '#14141f'); const segs = 24, on = Math.round(st.gauge * segs);
    for (let i = 0; i < segs; i++) { const y = MY + MH - (i + 1) * MH / segs; R(GX + 2.5, y + .5, GW - 5, MH / segs - 1, i < on ? (st.gauge > .7 ? '#a7f070' : st.gauge > .3 ? '#ffcd75' : '#ff5050') : '#1f2638'); }
    TX('LEVEL', MX + MW / 2, 148.5, 3.5, '#94b0c2', MONO, 'center'); TX('안정', GX + GW / 2, 148.5, 4, '#94b0c2', KOF, 'center');
    if (st.hold && st.phase === 'play') { R(MX + MW / 2 - 3, MY - 6, 6, 3, '#ffcd75'); R(MX + MW / 2 - 1.5, MY - 7.5, 3, 1.5, '#ffcd75'); }
  }
  return {
    id: 'signal', shutter: false,
    start() { st = { i: 0, pts: 0, ok: 0, fail: 0, fast: 0, inT: 0, allT: 0, hold: false, in: false }; incident(0); loop(frame); },
    stop() { st = null; },
    down() { if (st) st.hold = true; }, up() { if (st) st.hold = false; }, move() { },
    key(e) { if (st && (e.key === ' ' || e.key === 'Enter')) { st.hold = e.type === 'keydown'; } }, shot() { },
    get debug() { return st && { phase: st.phase, pos: st.pos, tgt: st.tgt, vel: st.vel, band: st.c.band, gauge: st.gauge }; },
  };
})();

const GAMES = { cut: CUT, focus: FOCUS, match: MATCH, signal: SIGNAL };
return {
  // 게임 목록(메뉴·아이콘용). jobs: 이 직업이면 특기 보상 x1.5, 아이콘도 주로 이 게임
  LIST: [
    { id: 'cut', n: '속보 컷 편집', icon: '속보', sub: '컷 편집', jobs: ['editor'], d: '플레이바가 타임라인의 컷 지점을 지날 때 탭. 5라운드(컷 5~9개), 점점 빨라져요.' },
    { id: 'focus', n: '단독 입수', icon: '단독', sub: '입수', jobs: ['reporter', 'camera'], d: '화면을 좌우로 문질러 초점을 맞추고 셔터! 빨리 찍을수록 보너스. 5컷.' },
    { id: 'match', n: '긴급 수정', icon: '긴급', sub: '수정', jobs: ['designer'], d: '카드를 잠깐 보여 준 뒤 뒤집어요. 같은 그림끼리 짝 맞추기! 4단계, 마지막은 보도 용어 ↔ 뜻.' },
    { id: 'signal', n: '송출 사고', icon: '송출', sub: '사고', jobs: ['engineer'], d: '화면을 누르고 있으면 레벨이 올라가요. 흔들리는 초록 구간 안에 붙잡아 송출을 복구! 사고 4건.' },
  ],
  init(u) { ui = u; u.canvas.width = MG_W * MG_S; u.canvas.height = MG_H * MG_S; cx = u.canvas.getContext('2d'); cx.setTransform(MG_S, 0, 0, MG_S, 0, 0); cx.imageSmoothingEnabled = false; }, // 실제 픽셀 4배: 글자·그림이 깨지지 않게
  start(id) { this.stop(); cur = GAMES[id]; cur.start(); return cur; },
  stop() { cancelAnimationFrame(raf); if (cur) cur.stop(); cur = null; },
  get cur() { return cur; },
};
})();
