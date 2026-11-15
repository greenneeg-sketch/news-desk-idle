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

// ───────── 3. 긴급 수정 (그래픽 디자이너) ─────────
// 카드를 잠깐 다 보여 준 뒤 뒤집는다. 같은 그림(마지막 단계는 '용어 ↔ 뜻')끼리 짝을 맞춘다.
// 4단계: 2x3 → 3x4 → 4x4 → 4x5. 단계마다 제한 시간, 시간이 끝나면 게임 끝. 남은 시간만큼 보너스.
const MATCH = (() => {
  const STAGES = [
    { c: 3, r: 2, kind: 'icon', show: 2.2, lim: 15 },
    { c: 4, r: 3, kind: 'mix', show: 3.2, lim: 26 },
    { c: 4, r: 4, kind: 'word', show: 3.6, lim: 34 },
    { c: 5, r: 4, kind: 'term', show: 4.5, lim: 48 },
  ];
  const WORDS = ['속보', '단독', '특종', '생중계', '앵커', '자막', '큐시트', '데스크', '리포트', '현장', '엠바고', '오보'];
  const TERMS = [['엠바고', '보도유예'], ['풀', '공동취재'], ['데스크', '기사검토'], ['큐시트', '방송순서'], ['리드', '첫 문장'], ['인서트', '삽입화면'], ['스탠딩', '기자등장'], ['바이라인', '기자이름'], ['크로마키', '합성배경'], ['클로징', '마무리말'], ['VCR', '녹화영상'], ['슈퍼', '화면자막']];
  const ICONS = ['mic', 'cam', 'heli', 'sat', 'globe', 'gavel', 'scale', 'shield', 'dome', 'tv'], FACES = 6;
  const TOP = 4, GAP = 4;
  let st = null;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function deal(k) {
    const S = STAGES[k], n = S.c * S.r / 2; let cards = []; st.pairsAll += st.got || 0;
    if (S.kind === 'term') shuffle(TERMS.slice()).slice(0, n).forEach((t, i) => cards.push({ p: i, t: 'txt', v: t[0], term: 1 }, { p: i, t: 'txt', v: t[1] }));
    else {
      const pool = S.kind === 'icon' ? ICONS.map(v => ({ t: 'icon', v })) : S.kind === 'word' ? WORDS.map(v => ({ t: 'txt', v })) : [...ICONS.map(v => ({ t: 'icon', v })), ...Array.from({ length: FACES }, (_, v) => ({ t: 'face', v }))];
      shuffle(pool.slice()).slice(0, n).forEach((x, i) => cards.push({ p: i, ...x }, { p: i, ...x }));
    }
    const cw = (MG_W - GAP * (S.c + 1)) / S.c, ch = (MG_H - TOP - GAP * (S.r + 1)) / S.r;
    st.cards = shuffle(cards).map((c, i) => ({ ...c, x: GAP + (i % S.c) * (cw + GAP), y: TOP + GAP + Math.floor(i / S.c) * (ch + GAP), w: cw, h: ch, up: 1, done: 0, flip: 0 }));
    st.k = k; st.open = []; st.lock = 0; st.phase = 'show'; st.t0 = performance.now(); st.pairs = n; st.got = 0;
    ui.label(`STAGE ${k + 1}/${STAGES.length}`, S.kind === 'term' ? '용어와 뜻을 짝지어요. 잘 봐 두세요!' : `카드 ${S.c * S.r}장 · 잘 봐 두세요!`);
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
    if (st.phase === 'show' && t >= S.show) { st.phase = 'play'; st.t0 = now; st.cards.forEach(c => { c.up = 0; c.flip = now; }); ui.label(`STAGE ${st.k + 1}/${STAGES.length}`, '같은 그림끼리 탭해서 짝을 맞춰요!'); }
    if (st.phase === 'play' && t >= S.lim) { ui.pop('시간 초과!', 'miss'); ui.sfx('fail'); end(); draw(now); return false; }
    if (st.phase === 'clear' && now - st.tc > 900) { if (st.k + 1 < STAGES.length) deal(st.k + 1); else { end(); draw(now); return false; } }
    draw(now);
  }
  function draw(now) {
    const S = STAGES[st.k]; cx.fillStyle = '#1a1c2c'; cx.fillRect(0, 0, MG_W, MG_H);
    if (st.phase === 'play') { const r = Math.max(0, 1 - (now - st.t0) / 1000 / S.lim); cx.fillStyle = '#0b0b14'; cx.fillRect(0, 0, MG_W, 3); cx.fillStyle = r < .25 ? '#ff5050' : '#ffcd75'; cx.fillRect(0, 0, MG_W * r, 3); }
    if (st.phase === 'show') { const r = 1 - (now - st.t0) / 1000 / S.show; cx.fillStyle = '#41a6f6'; cx.fillRect(0, 0, MG_W * Math.max(0, r), 3); }
    st.cards.forEach(c => {
      const ft = Math.min(1, (now - c.flip) / 140), sx = c.flip ? Math.abs(1 - 2 * ft) : 1, face = c.flip && ft < .5 ? !c.up : c.up; // 뒤집기: 가로로 접혔다 펴진다
      const w = Math.max(1, c.w * sx), x = c.x + (c.w - w) / 2;
      if (c.done) cx.globalAlpha = .45;
      if (face) { cx.fillStyle = c.term ? '#ffe9b0' : '#f4f4f4'; cx.fillRect(x, c.y, w, c.h); if (sx > .6) art(c, c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h)); }
      else { cx.fillStyle = '#3b5dc9'; cx.fillRect(x, c.y, w, c.h); cx.fillStyle = '#41a6f6'; for (let i = 0; i < c.h; i += 6) cx.fillRect(x, c.y + i, w, 2); cx.fillStyle = '#b13e53'; cx.fillRect(x, c.y + c.h / 2 - 4, w, 8); cx.fillStyle = '#f4f4f4'; if (w > 20) { cx.font = '6px "Press Start 2P",monospace'; cx.textAlign = 'center'; cx.fillText('NEWS', c.x + c.w / 2, c.y + c.h / 2 + 3); cx.textAlign = 'left'; } }
      if (c.done) { cx.globalAlpha = 1; cx.fillStyle = '#38b764'; cx.fillRect(c.x + c.w - 9, c.y + 2, 7, 7); cx.fillStyle = '#f4f4f4'; cx.fillRect(c.x + c.w - 7, c.y + 5, 2, 2); cx.fillRect(c.x + c.w - 5, c.y + 4, 2, 2); }
    });
  }
  // 카드 그림: 텍스트 / 가상 아이콘(실제 기관 상징 아님) / 가상 얼굴
  function art(c, x, y, s) {
    if (c.t === 'txt') { const n = c.v.length; cx.fillStyle = c.term ? '#b13e53' : '#1a1c2c'; cx.font = `${n >= 4 ? 9 : 11}px "DotGothic16",sans-serif`; cx.textAlign = 'center'; cx.fillText(c.v, x, y + 4); cx.textAlign = 'left'; return; }
    const u = Math.max(2, Math.floor(s / 12)), P = (dx, dy, w, h, col) => { cx.fillStyle = col; cx.fillRect(Math.round(x + dx * u), Math.round(y + dy * u), Math.round(w * u), Math.round(h * u)); };
    if (c.t === 'face') { const hair = ['#1a1c2c', '#5d275d', '#ef7d57', '#94b0c2', '#ffcd75', '#257179'][c.v];
      P(-4, -4, 8, 8, '#f4c2a0'); P(-4, -5, 8, 2 + (c.v % 3), hair); if (c.v % 2) P(-5, -4, 1, 5, hair), P(4, -4, 1, 5, hair);
      P(-2, -1, 1, 1, '#1a1c2c'); P(1, -1, 1, 1, '#1a1c2c'); if (c.v === 2 || c.v === 5) { P(-3, -1.5, 3, 2, '#0b0b14'); P(0, -1.5, 3, 2, '#0b0b14'); } P(-1, 2, 2, 1, c.v === 4 ? '#b13e53' : '#ab5236'); if (c.v === 3) P(-2, 3, 4, 1, '#566c86'); return; }
    switch (c.v) {
      case 'mic': P(-1.5, -5, 3, 5, '#566c86'); P(-1, -4, 2, 3, '#94b0c2'); P(-0.5, 0, 1, 3, '#333c57'); P(-3, 3, 6, 1, '#333c57'); P(-1.5, -1, 3, 1, '#b13e53'); break;
      case 'cam': P(-5, -3, 8, 6, '#333c57'); P(3, -2, 3, 4, '#566c86'); P(-3, -1, 3, 3, '#41a6f6'); P(-4, -5, 3, 2, '#b13e53'); break;
      case 'heli': P(-3, -2, 6, 4, '#41a6f6'); P(3, -1, 5, 1, '#3b5dc9'); P(-6, -4, 12, 1, '#333c57'); P(-0.5, -3, 1, 1, '#333c57'); P(-3, 3, 6, 1, '#333c57'); P(-2, -1, 2, 2, '#f4f4f4'); break;
      case 'sat': P(-1.5, -1.5, 3, 3, '#ffcd75'); P(-6, -1, 4, 2, '#3b5dc9'); P(2, -1, 4, 2, '#3b5dc9'); P(-0.5, -4, 1, 2.5, '#566c86'); P(-1, -5, 2, 1, '#b13e53'); break;
      case 'globe': P(-4, -4, 8, 8, '#41a6f6'); P(-3, -3, 3, 2, '#38b764'); P(1, 0, 3, 3, '#38b764'); P(-2, 1, 2, 2, '#38b764'); P(-4, -0.5, 8, 1, '#f4f4f4'); break;
      case 'gavel': P(-4, -4, 6, 3, '#ab5236'); P(-0.5, -1, 1.5, 6, '#7a4a2a'); P(-5, 4, 10, 1.5, '#566c86'); break;
      case 'scale': P(-0.5, -4, 1, 8, '#566c86'); P(-5, -3, 10, 1, '#566c86'); P(-6, -1, 4, 1.5, '#ffcd75'); P(2, -1, 4, 1.5, '#ffcd75'); P(-2, 4, 4, 1, '#333c57'); break;
      case 'shield': P(-4, -4, 8, 5, '#3b5dc9'); P(-3, 1, 6, 2, '#3b5dc9'); P(-1.5, 3, 3, 1.5, '#3b5dc9'); P(-1, -3, 2, 5, '#ffcd75'); P(-2.5, -1.5, 5, 2, '#ffcd75'); break;
      case 'dome': P(-3, -5, 6, 3, '#94b0c2'); P(-5, -2, 10, 1, '#566c86'); for (let i = 0; i < 4; i++) P(-4.5 + i * 2.6, -1, 1, 4, '#f4f4f4'); P(-6, 3, 12, 2, '#566c86'); break;
      case 'tv': P(-5, -4, 10, 7, '#333c57'); P(-4, -3, 8, 5, '#41a6f6'); P(-4, 0, 8, 2, '#b13e53'); P(-2, 3, 4, 1, '#566c86'); P(-3, -6, 1, 2, '#566c86'); P(2, -6, 1, 2, '#566c86'); break;
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
    { n: '영상 신호 끊김', band: .30, jump: [1.0, 1.8], ease: 2.0 },
    { n: '오디오 레벨 폭주', band: .26, jump: [.8, 1.5], ease: 2.6 },
    { n: '위성 링크 흔들림', band: .22, jump: [.7, 1.3], ease: 3.2 },
    { n: '중계차 전송 장애', band: .19, jump: [.6, 1.1], ease: 3.8 },
  ];
  const LIM = 16, UP = 2.4, DOWN = 1.9, VMAX = 1.3, FILL = .17, DRAIN = .13;
  const MX = 166, MY = 8, MW = 30, MH = 134, GX = 206, GW = 22;
  let st = null;
  function incident(i) {
    st.i = i; st.c = CASES[i]; st.pos = .15; st.vel = 0; st.tgt = .55; st.goal = .55; st.nextJ = 0; st.gauge = .4; st.phase = 'ready'; st.t0 = performance.now() + 1200; st.last = 0; st.res = '';
    ui.label(`사고 ${i + 1}/${CASES.length}`, `${st.c.n}! 화면을 누르고 있으면 레벨이 올라가요. 초록 구간 안에 붙잡아 두세요`); ui.sfx('alert');
  }
  function frame(now) {
    const t = (now - st.t0) / 1000, dt = Math.min(.05, st.last ? (now - st.last) / 1000 : 0); st.last = now;
    if (st.phase === 'ready' && t >= 0) { st.phase = 'play'; ui.label(`사고 ${st.i + 1}/${CASES.length}`, st.c.n); }
    if (st.phase === 'play') {
      // 정상 신호 구간: 가끔 새 목표로 튀고, 부드럽게 따라간다
      if (t >= st.nextJ) { const c = st.c; st.goal = .12 + Math.random() * .76; st.nextJ = t + c.jump[0] + Math.random() * (c.jump[1] - c.jump[0]); }
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
  function draw(now) {
    const noise = st.phase === 'play' ? (st.in ? .05 : .55) * (1 - st.gauge * .6) : st.res === 'ok' ? 0 : .7;
    cx.fillStyle = '#0b0b14'; cx.fillRect(0, 0, MG_W, MG_H);
    // 프로그램 모니터: 컬러바 + 자막. 신호가 나쁠수록 지지직
    const bars = ['#f4f4f4', '#ffcd75', '#73eff7', '#38b764', '#a05ae0', '#b13e53', '#3b5dc9'];
    cx.fillStyle = '#262b44'; cx.fillRect(4, 4, 152, 88);
    bars.forEach((c, i) => { cx.fillStyle = c; cx.fillRect(8 + i * 20.6, 8, 20.6, 56); });
    cx.fillStyle = '#1a1c2c'; cx.fillRect(8, 64, 144, 24); cx.fillStyle = '#b13e53'; cx.fillRect(8, 68, 40, 16); font(7); cx.fillStyle = '#f4f4f4'; cx.fillText('ON AIR', 52, 80);
    if (noise > 0) { for (let i = 0; i < 260 * noise; i++) { cx.fillStyle = Math.random() < .5 ? '#f4f4f4' : '#0b0b14'; cx.fillRect(8 + Math.random() * 142, 8 + Math.random() * 78, 2 + Math.random() * 4, 1); }
      if (noise > .4) { const y = 8 + (now / 4) % 78; cx.fillStyle = '#ffffff55'; cx.fillRect(8, y, 144, 3); } }
    if (st.res === 'fail' && st.phase === 'end') { cx.fillStyle = '#0b0b14dd'; cx.fillRect(8, 30, 144, 22); font(8); cx.fillStyle = '#ff5050'; cx.fillText('NO SIGNAL', 44, 45); }
    // 파형 모니터
    cx.fillStyle = '#1a1c2c'; cx.fillRect(4, 98, 152, 48); cx.fillStyle = '#257179'; for (let y = 104; y < 146; y += 10) cx.fillRect(6, y, 148, 1);
    cx.fillStyle = st.in || st.res === 'ok' ? '#a7f070' : '#ff5050';
    for (let x = 0; x < 146; x += 2) { const base = 122 - (st.pos - .5) * 30, j = (Math.random() - .5) * 40 * noise, y = base + Math.sin(x * .25 + now / 120) * 6 + j; cx.fillRect(6 + x, Math.max(100, Math.min(144, y)), 2, 2); }
    // 레벨 미터
    cx.fillStyle = '#1a1c2c'; cx.fillRect(MX, MY, MW, MH); for (let i = 1; i < 10; i++) { cx.fillStyle = '#333c57'; cx.fillRect(MX, MY + i * MH / 10, MW, 1); }
    const Y = v => MY + (1 - v) * MH, bh = st.c.band * MH;
    cx.fillStyle = st.in ? '#38b764' : '#257179'; cx.fillRect(MX + 2, Y(st.tgt) - bh / 2, MW - 4, bh);
    cx.fillStyle = '#a7f070'; cx.fillRect(MX + 2, Y(st.tgt) - bh / 2, MW - 4, 2); cx.fillRect(MX + 2, Y(st.tgt) + bh / 2 - 2, MW - 4, 2);
    cx.fillStyle = st.in ? '#ffcd75' : '#ef7d57'; cx.fillRect(MX - 3, Y(st.pos) - 3, MW + 6, 6); cx.fillStyle = '#0b0b14'; cx.fillRect(MX - 3, Y(st.pos) - .5, MW + 6, 1);
    // 송출 안정 게이지
    cx.fillStyle = '#1a1c2c'; cx.fillRect(GX, MY, GW, MH); const gh = st.gauge * (MH - 4);
    cx.fillStyle = st.gauge > .7 ? '#a7f070' : st.gauge > .3 ? '#ffcd75' : '#ff5050'; cx.fillRect(GX + 2, MY + MH - 2 - gh, GW - 4, gh);
    if (st.phase === 'play') { const left = Math.max(0, LIM - (now - st.t0) / 1000); cx.fillStyle = '#0b0b14cc'; cx.fillRect(8, 8, 26, 14); font(7); cx.fillStyle = left < 4 ? '#ff5050' : '#f4f4f4'; cx.fillText(left.toFixed(0).padStart(2, '0'), 12, 19); }
    if (st.hold && st.phase === 'play') { cx.fillStyle = '#ffcd75'; cx.fillRect(MX + MW / 2 - 3, MY + MH + 2, 6, 3); }
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
    { id: 'cut', n: '속보 컷 편집', icon: '속보', sub: '컷 편집', jobs: ['editor'], d: '플레이바가 타임라인의 컷 지점을 지날 때 탭. 5라운드, 점점 빨라져요.' },
    { id: 'focus', n: '단독 입수', icon: '단독', sub: '입수', jobs: ['reporter', 'camera'], d: '화면을 좌우로 문질러 초점을 맞추고 셔터! 빨리 찍을수록 보너스. 5컷.' },
    { id: 'match', n: '긴급 수정', icon: '긴급', sub: '수정', jobs: ['designer'], d: '카드를 잠깐 보여 준 뒤 뒤집어요. 같은 그림끼리 짝 맞추기! 4단계, 마지막은 보도 용어 ↔ 뜻.' },
    { id: 'signal', n: '송출 사고', icon: '송출', sub: '사고', jobs: ['engineer'], d: '화면을 누르고 있으면 레벨이 올라가요. 흔들리는 초록 구간 안에 붙잡아 송출을 복구! 사고 4건.' },
  ],
  init(u) { ui = u; cx = u.canvas.getContext('2d'); cx.imageSmoothingEnabled = false; },
  start(id) { this.stop(); cur = GAMES[id]; cur.start(); return cur; },
  stop() { cancelAnimationFrame(raf); if (cur) cur.stop(); cur = null; },
  get cur() { return cur; },
};
})();
