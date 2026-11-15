// 미니게임 모음. 공통 화면(모달·캔버스 240x150·판정 글자)은 main.js가 띄우고, 게임은 여기서 그리고 판정한다.
// 게임 인터페이스: { id, start(), stop(), down(x, y), move(x, y), up(), key(e), shot(), debug } — x·y는 캔버스 좌표(0~240, 0~150)
// 끝나면 ui.done({ grade, ratio, perfect, stat }) 을 부른다. 보상·기록은 main.js 몫.
export const MINI = (() => {
const MG_W = 240, MG_H = 150;
const MG_PAL = [['#41a6f6', '#3b5dc9'], ['#ef7d57', '#b13e53'], ['#38b764', '#257179'], ['#ffcd75', '#a7f070'], ['#94b0c2', '#566c86'], ['#a05ae0', '#5d275d']];
let ui = null, cx = null, cur = null, raf = 0;
const loop = fn => { const f = now => { if (fn(now) !== false) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); };
const font = (n = 8) => { cx.font = `${n}px "Press Start 2P",monospace`; };

// ───────── 1. 속보 컷 편집 (영상편집기자) ─────────
// 플레이바가 타임라인의 컷 지점을 지날 때 탭. 5라운드, 점점 컷이 늘고 빨라진다
const CUT = (() => {
  const ROUNDS = [{ n: 4, d: 4.4 }, { n: 5, d: 4.0 }, { n: 6, d: 3.8 }, { n: 7, d: 3.6 }, { n: 8, d: 3.4 }];
  const WIN = { p: .08, g: .16, near: .32 }, X0 = 12, X1 = 228;   // 판정 범위(초): 아이폰 터치 지연을 감안해 넉넉하게
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
  function draw(now, p) { // 위: 프로그램 모니터, 아래: 타임라인(V1 클립 + 오디오 파형) + 빨간 플레이바
    const R = ROUNDS[st.r]; cx.fillStyle = '#0b0b14'; cx.fillRect(0, 0, MG_W, MG_H);
    const ci = st.cuts.filter(c => c.x <= p).length, pal = MG_PAL[(ci + st.r * 2) % MG_PAL.length];
    cx.fillStyle = '#262b44'; cx.fillRect(8, 6, 150, 86); cx.fillStyle = pal[0]; cx.fillRect(12, 10, 142, 50); cx.fillStyle = pal[1]; cx.fillRect(12, 60, 142, 28);
    scene(ci + st.r * 3, 12, 10, now);
    cx.fillStyle = '#b13e53'; cx.fillRect(12, 76, 60, 10); cx.fillStyle = '#f4f4f4'; cx.fillRect(14, 79, 40, 4);
    font(); cx.fillStyle = '#ffcd75'; cx.fillText('PGM', 166, 18);
    const tc = Math.floor(p * R.d * 30); cx.fillStyle = '#94b0c2'; cx.fillText(`00:0${Math.floor(tc / 30)}:${String(tc % 30).padStart(2, '0')}`, 166, 34);
    cx.fillStyle = '#f4f4f4'; cx.fillText(`R${st.r + 1}/${ROUNDS.length}`, 166, 52);
    cx.fillStyle = st.phase === 'ready' && Math.floor(now / 250) % 2 ? '#b13e53' : '#38b764'; cx.fillRect(166, 62, 8, 8); cx.fillStyle = '#94b0c2'; cx.fillText(st.phase === 'ready' ? 'STBY' : 'REC', 178, 70);
    const ty = 100; cx.fillStyle = '#1a1c2c'; cx.fillRect(4, ty - 4, MG_W - 8, 48);
    const xs = [0, ...st.cuts.map(c => c.x), 1];
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = X0 + xs[i] * (X1 - X0), b = X0 + xs[i + 1] * (X1 - X0), q = MG_PAL[(i + st.r * 2) % MG_PAL.length];
      cx.fillStyle = q[1]; cx.fillRect(a + 1, ty, b - a - 2, 16); cx.fillStyle = q[0]; cx.fillRect(a + 1, ty, b - a - 2, 4);
      cx.fillStyle = '#566c86'; for (let x = a + 2; x < b - 2; x += 3) { const h = 2 + Math.abs(Math.sin(x * .7 + i)) * 7; cx.fillRect(x, ty + 30 - h / 2, 2, h); }
    }
    st.cuts.forEach(c => {
      const x = Math.round(X0 + c.x * (X1 - X0));
      cx.fillStyle = c.res === 'p' ? '#a7f070' : c.res === 'g' ? '#38b764' : c.res === 'miss' ? '#566c86' : (Math.floor(now / 200) % 2 ? '#ff5050' : '#ffcd75');
      cx.fillRect(x - 1, ty - 4, 3, 40); if (!c.res) cx.fillRect(x - 3, ty - 6, 7, 3);
    });
    const px = Math.round(X0 + p * (X1 - X0)); cx.fillStyle = '#f4f4f4'; cx.fillRect(px - 3, ty - 8, 7, 4); cx.fillStyle = '#ff2e4d'; cx.fillRect(px, ty - 6, 1, 44);
    if (st.flash && now - st.flash.at < 250) { cx.globalAlpha = 1 - (now - st.flash.at) / 250; cx.fillStyle = st.flash.res === 'miss' ? '#b13e53' : '#a7f070'; cx.fillRect(X0 + st.flash.x * (X1 - X0) - 6, ty - 6, 13, 44); cx.globalAlpha = 1; }
  }
  function scene(k, ox, oy, now) { // 모니터 속 장면: 앵커석 / 도심 / 헬기 / 그래픽
    const kind = k % 4, b = Math.floor(now / 300) % 2;
    if (kind === 0) { cx.fillStyle = '#5d275d'; cx.fillRect(ox + 20, oy + 32, 100, 10); cx.fillStyle = '#f4c2a0'; cx.fillRect(ox + 64, oy + 12, 14, 14); cx.fillStyle = '#333c57'; cx.fillRect(ox + 58, oy + 26, 26, 14); cx.fillStyle = '#1a1c2c'; cx.fillRect(ox + 64, oy + 10, 14, 4); }
    else if (kind === 1) { cx.fillStyle = '#29366f'; [[10, 14, 22], [36, 6, 30], [72, 20, 18], [96, 10, 26]].forEach(([x, y, w]) => cx.fillRect(ox + x, oy + y, w, 50 - y)); cx.fillStyle = '#ffcd75'; for (let i = 0; i < 12; i++) cx.fillRect(ox + 14 + (i * 23) % 104, oy + 18 + (i * 7) % 24, 3, 3); }
    else if (kind === 2) { const x = ox + 30 + (now / 30) % 80; cx.fillStyle = '#f4f4f4'; cx.fillRect(x, oy + 18, 24, 9); cx.fillRect(x + 22, oy + 20, 12, 3); cx.fillStyle = '#1a1c2c'; cx.fillRect(x - 6 + (b ? 0 : 12), oy + 14, 26, 2); cx.fillRect(x + 4, oy + 27, 14, 2); }
    else { cx.fillStyle = '#f4f4f4'; cx.fillRect(ox + 16, oy + 10, 110, 20); cx.fillStyle = '#b13e53'; cx.fillRect(ox + 16, oy + 10, 26, 20); cx.fillStyle = '#1a1c2c'; for (let i = 0; i < 4; i++) cx.fillRect(ox + 48 + i * 18, oy + 16, 12, 8); }
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
// 컷마다 제한 시간 6초, 빨리 찍을수록 보너스. 5컷.
const FOCUS = (() => {
  const SHOTS = 5, LIMIT = 6, WIN = { p: .05, g: .12 };
  const SUBJ = [ // 피사체: 이름, 그리기 함수
    ['공항 출국 스타', star], ['도심에 나타난 거대 로봇', robot], ['하늘을 나는 히어로', hero], ['정체불명 UFO', ufo], ['기자회견장 대변인', speaker],
  ];
  let st = null, off = null, ox = null;
  const tgt = (t, s) => .5 + .34 * Math.sin(t * s.w + s.ph) + .08 * Math.sin(t * s.w * 2.7 + s.ph2); // 시간에 따른 정답 초점(0~1)
  function shot(i) {
    const order = st.order;
    st.i = i; st.s = { w: .8 + i * .3, ph: Math.random() * 6.28, ph2: Math.random() * 6.28, k: order[i % order.length], t0: performance.now() + 1100 };
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
    // 1) 장면을 작은 캔버스에 그린 뒤, 초점이 어긋난 만큼 거칠게 줄였다 키워 흐리게(픽셀 보케)
    const o = ox; o.fillStyle = '#1a1c2c'; o.fillRect(0, 0, MG_W, MG_H);
    o.fillStyle = '#29366f'; for (let i = 0; i < 9; i++) o.fillRect(i * 28 - 4, 40 + (i * 37) % 30, 22, 110); // 배경 건물
    o.fillStyle = '#ffcd75'; for (let i = 0; i < 30; i++) o.fillRect((i * 53) % 236, 50 + (i * 29) % 70, 2, 2);
    o.fillStyle = '#333c57'; o.fillRect(0, 124, MG_W, 26);
    const sx = 120 + Math.sin(t * .9 + s.ph) * 34, sy = 78 + Math.sin(t * 1.3 + s.ph2) * 10, sc = .8 + target * .5; // 피사체: 가까워질수록 크게
    SUBJ[s.k][1](o, sx, sy, sc, now);
    const blk = Math.max(1, Math.round(err * 34)); // 흐림 정도(블록 크기)
    cx.imageSmoothingEnabled = false;
    if (blk > 1) { const w = Math.ceil(MG_W / blk), h = Math.ceil(MG_H / blk); const tc = off.getContext('2d'); tc.imageSmoothingEnabled = true; tc.clearRect(0, 0, w, h); tc.drawImage(o.canvas, 0, 0, w, h); cx.drawImage(off, 0, 0, w, h, 0, 0, MG_W, MG_H); }
    else cx.drawImage(o.canvas, 0, 0);
    // 2) 뷰파인더 오버레이: 모서리 괄호, 가운데 AF 박스(선명하면 초록), REC, 남은 시간, 포커스 링 눈금
    const ok = err <= WIN.p, near = err <= WIN.g;
    cx.fillStyle = '#f4f4f4'; [[6, 6, 1, 1], [234, 6, -1, 1], [6, 144, 1, -1], [234, 144, -1, -1]].forEach(([x, y, a, b]) => { cx.fillRect(a > 0 ? x : x - 14, y > 70 ? y - 2 : y, 14, 2); cx.fillRect(a > 0 ? x : x - 2, b > 0 ? y : y - 14, 2, 14); });
    cx.fillStyle = ok ? '#a7f070' : near ? '#ffcd75' : '#f4f4f4';
    const bx = 120, by = 72; [[-22, -16], [16, -16], [-22, 14], [16, 14]].forEach(([dx, dy]) => { cx.fillRect(bx + dx, by + dy, 6, 2); cx.fillRect(bx + (dx > 0 ? dx + 4 : dx), by + (dy > 0 ? dy - 4 : dy), 2, 6); });
    font(); cx.fillStyle = Math.floor(now / 400) % 2 ? '#ff2e4d' : '#b13e53'; cx.fillRect(12, 12, 6, 6); cx.fillStyle = '#f4f4f4'; cx.fillText('REC', 22, 19);
    if (live) { const left = Math.max(0, LIMIT - t); cx.fillStyle = left < 2 ? '#ff5050' : '#f4f4f4'; cx.fillText(left.toFixed(1), 196, 19); }
    cx.fillStyle = '#0b0b14cc'; cx.fillRect(20, 128, 200, 14); // 포커스 링: 내 위치(흰 삼각) / 정답 근처는 보이지 않는다(감으로 맞추기)
    for (let i = 0; i <= 20; i++) { cx.fillStyle = '#566c86'; cx.fillRect(24 + i * 9.6, 131, 1, i % 5 ? 4 : 8); }
    const fx = 24 + st.f * 192; cx.fillStyle = ok ? '#a7f070' : '#f4f4f4'; cx.fillRect(fx - 3, 138, 7, 2); cx.fillRect(fx - 1, 136, 3, 2);
    cx.fillStyle = '#94b0c2'; cx.fillText('∞', 206, 140); cx.fillText('0.3', 22, 126 + 0);
    if (st.flash && now - st.flash.at < 160) { cx.fillStyle = '#ffffff'; cx.globalAlpha = 1 - (now - st.flash.at) / 160; cx.fillRect(0, 0, MG_W, MG_H); cx.globalAlpha = 1; } // 셔터 플래시
    if (st.phase === 'snap') { cx.strokeStyle = st.flash && st.flash.res !== 'miss' ? '#a7f070' : '#ff5050'; cx.lineWidth = 3; cx.strokeRect(2, 2, MG_W - 4, MG_H - 4); }
  }
  // ── 피사체 픽셀 그림 (가상 인물·소재, 실존 인물 아님)
  function px(o, x, y, w, h, c) { o.fillStyle = c; o.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function star(o, x, y, s) { const u = 3 * s; px(o, x - 3 * u, y - 7 * u, 6 * u, 5 * u, '#f4c2a0'); px(o, x - 3.5 * u, y - 8.5 * u, 7 * u, 2.5 * u, '#5d275d'); px(o, x - 3 * u, y - 5.5 * u, 6 * u, 1.3 * u, '#0b0b14'); px(o, x - 4 * u, y - 2 * u, 8 * u, 8 * u, '#f4f4f4'); px(o, x - 4 * u, y + 6 * u, 3 * u, 5 * u, '#29366f'); px(o, x + 1 * u, y + 6 * u, 3 * u, 5 * u, '#29366f'); px(o, x + 4 * u, y + 1 * u, 3 * u, 4 * u, '#b13e53'); }
  function robot(o, x, y, s, now) { const u = 3.4 * s; px(o, x - 4 * u, y - 9 * u, 8 * u, 6 * u, '#94b0c2'); px(o, x - 2.5 * u, y - 7 * u, 5 * u, 1.5 * u, Math.floor(now / 300) % 2 ? '#ff2e4d' : '#ffcd75'); px(o, x - 6 * u, y - 3 * u, 12 * u, 9 * u, '#566c86'); px(o, x - 9 * u, y - 2 * u, 3 * u, 8 * u, '#94b0c2'); px(o, x + 6 * u, y - 2 * u, 3 * u, 8 * u, '#94b0c2'); px(o, x - 5 * u, y + 6 * u, 4 * u, 6 * u, '#333c57'); px(o, x + 1 * u, y + 6 * u, 4 * u, 6 * u, '#333c57'); px(o, x - 2 * u, y, 4 * u, 3 * u, '#41a6f6'); }
  function hero(o, x, y, s, now) { const u = 3 * s, f = Math.floor(now / 150) % 2; px(o, x - 9 * u, y - 2 * u + f * u, 8 * u, 5 * u, '#b13e53'); px(o, x - 3 * u, y - 3 * u, 10 * u, 5 * u, '#3b5dc9'); px(o, x + 6 * u, y - 4 * u, 4 * u, 4 * u, '#f4c2a0'); px(o, x + 6 * u, y - 5 * u, 4 * u, 1.5 * u, '#1a1c2c'); px(o, x - 1 * u, y - 1 * u, 3 * u, 2 * u, '#ffcd75'); px(o, x + 9 * u, y - 3 * u, 3 * u, 2 * u, '#3b5dc9'); }
  function ufo(o, x, y, s, now) { const u = 3 * s; px(o, x - 4 * u, y - 5 * u, 8 * u, 3 * u, '#a7f070'); px(o, x - 10 * u, y - 2 * u, 20 * u, 4 * u, '#94b0c2'); px(o, x - 7 * u, y + 2 * u, 14 * u, 2 * u, '#566c86'); for (let i = 0; i < 4; i++) px(o, x - 8 * u + i * 5 * u, y - 1 * u, 2 * u, 2 * u, (Math.floor(now / 200) + i) % 2 ? '#ffcd75' : '#ef7d57'); }
  function speaker(o, x, y, s) { const u = 3 * s; px(o, x - 12 * u, y + 2 * u, 24 * u, 10 * u, '#5d275d'); px(o, x - 3 * u, y - 9 * u, 6 * u, 6 * u, '#f4c2a0'); px(o, x - 3 * u, y - 10 * u, 6 * u, 2 * u, '#1a1c2c'); px(o, x - 5 * u, y - 3 * u, 10 * u, 6 * u, '#1a1c2c'); px(o, x - 0.5 * u, y - 3 * u, 1 * u, 4 * u, '#b13e53'); px(o, x - 1 * u, y - 0.5 * u, 2 * u, 3 * u, '#94b0c2'); px(o, x - 9 * u, y + 5 * u, 18 * u, 2 * u, '#ffcd75'); }
  let dragX = null;
  return {
    id: 'focus', shutter: true,
    start() {
      if (!off) { off = document.createElement('canvas'); off.width = MG_W; off.height = MG_H; const c = document.createElement('canvas'); c.width = MG_W; c.height = MG_H; ox = c.getContext('2d'); }
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

const GAMES = { cut: CUT, focus: FOCUS };
return {
  // 게임 목록(메뉴·아이콘용). jobs: 이 직업이면 특기 보상 x1.5, 아이콘도 주로 이 게임
  LIST: [
    { id: 'cut', n: '속보 컷 편집', icon: '속보', sub: '컷 편집', jobs: ['editor'], d: '플레이바가 타임라인의 컷 지점을 지날 때 탭. 5라운드, 점점 빨라져요.' },
    { id: 'focus', n: '단독 입수', icon: '단독', sub: '입수', jobs: ['reporter', 'camera'], d: '화면을 좌우로 문질러 초점을 맞추고 셔터! 빨리 찍을수록 보너스. 5컷.' },
    { id: 'match', n: '긴급 수정', icon: '긴급', sub: '수정', jobs: ['designer'], d: '그래픽 짝 맞추기. 준비 중이에요.', soon: true },
    { id: 'signal', n: '송출 사고', icon: '송출', sub: '사고', jobs: ['engineer'], d: '흔들리는 신호 맞추기. 준비 중이에요.', soon: true },
  ],
  init(u) { ui = u; cx = u.canvas.getContext('2d'); cx.imageSmoothingEnabled = false; },
  start(id) { this.stop(); cur = GAMES[id]; cur.start(); return cur; },
  stop() { cancelAnimationFrame(raf); if (cur) cur.stop(); cur = null; },
  get cur() { return cur; },
};
})();
