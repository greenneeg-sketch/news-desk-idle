// 미니게임 "속보 컷 편집": 편집기 타임라인의 잘린 지점(컷)을 플레이바가 지날 때 정확히 탭한다.
// 3라운드, 라운드마다 빨라지고 컷이 늘어난다. 판정 PERFECT/GOOD/MISS, 콤보, 등급(S~C)으로 보상(생산량 N분치)을 준다.
// 이 모듈은 화면과 판정만 맡고, 보상 지급은 main.js가 onDone 콜백으로 처리한다.
export const MiniCut = (() => {
const MC_ROUNDS = [{ n: 4, d: 4.2 }, { n: 5, d: 3.8 }, { n: 7, d: 3.4 }];
const MC_WIN = { p: .08, g: .16, near: .32 };            // 판정 범위(초). 아이폰 터치 지연을 감안해 넉넉하게
const MC_W = 240, MC_H = 150, MC_X0 = 12, MC_X1 = 228;    // 캔버스 논리 크기, 타임라인 시작·끝 x
const MC_PAL = [['#41a6f6', '#3b5dc9'], ['#ef7d57', '#b13e53'], ['#38b764', '#257179'], ['#ffcd75', '#a7f070'], ['#94b0c2', '#566c86'], ['#a05ae0', '#5d275d']];
const $m = id => document.getElementById(id);
let cv, cx, st = null, raf = 0, onDone = null, sfx = () => { };

function cutsFor(r) { // 컷 위치(0~1 비율): 구간을 n칸으로 나눠 칸마다 하나씩, 칸 안에서 조금 흔든다 (간격이 너무 붙지 않게)
  const R = MC_ROUNDS[r], a = .1, w = .85 / R.n;
  return Array.from({ length: R.n }, (_, i) => ({ x: a + w * (i + .5 + (Math.random() - .5) * .5), res: '' }));
}
function startRound(r) { st.r = r; st.cuts = cutsFor(r); st.tot += st.cuts.length; st.t0 = performance.now() + 900; st.phase = 'ready'; st.flash = null; label(`ROUND ${r + 1}`, `컷 ${st.cuts.length}개 · 플레이바가 빨간 선에 닿을 때 탭!`); }
function label(a, b) { $m('mcl').textContent = a; $m('mcs').textContent = b || ''; }
function judge(c, res) { c.res = res; st.flash = { res, at: performance.now(), x: c.x };
  if (res === 'miss') { st.combo = 0; st.miss++; sfx('fail'); } else { st.combo++; st.best = Math.max(st.best, st.combo); st[res === 'p' ? 'perf' : 'good']++; sfx('buy'); }
  $m('mcj').textContent = res === 'p' ? 'PERFECT!' : res === 'g' ? 'GOOD' : 'MISS'; $m('mcj').className = 'mcj ' + res; $m('mcc').textContent = st.combo > 1 ? `${st.combo} COMBO` : '';
}
function tap() {
  if (!st || st.phase !== 'play') return;
  const R = MC_ROUNDS[st.r], t = (performance.now() - st.t0) / 1000;
  let best = null, bd = 9; st.cuts.forEach(c => { if (c.res) return; const d = Math.abs(c.x * R.d - t); if (d < bd) { bd = d; best = c; } });
  if (best && bd <= MC_WIN.p) judge(best, 'p'); else if (best && bd <= MC_WIN.g) judge(best, 'g'); else if (best && bd <= MC_WIN.near) judge(best, 'miss');
  else { st.stray++; st.combo = 0; sfx('fail'); $m('mcj').textContent = '헛컷!'; $m('mcj').className = 'mcj miss'; $m('mcc').textContent = ''; }
}
function finish() {
  st.phase = 'done'; cancelAnimationFrame(raf);
  const tot = st.tot, ratio = Math.max(0, (st.perf * 2 + st.good) / (tot * 2) - st.stray * .03);
  const grade = ratio >= .95 ? 'S' : ratio >= .8 ? 'A' : ratio >= .6 ? 'B' : 'C', perfect = st.perf === tot;
  if (onDone) onDone({ grade, ratio, perfect, perf: st.perf, good: st.good, miss: st.miss, best: st.best, tot });
}
function update(now) {
  const R = MC_ROUNDS[st.r], t = (now - st.t0) / 1000;
  if (st.phase === 'ready' && t >= 0) { st.phase = 'play'; label(`ROUND ${st.r + 1}`, ''); }
  if (st.phase === 'play') {
    st.cuts.forEach(c => { if (!c.res && t > c.x * R.d + MC_WIN.g) judge(c, 'miss'); });
    if (t >= R.d) { if (st.r + 1 < MC_ROUNDS.length) startRound(st.r + 1); else return finish(); }
  }
  draw(now, Math.max(0, Math.min(1, t / R.d)));
  raf = requestAnimationFrame(update);
}
// 화면: 위쪽 프로그램 모니터(지금 지나는 클립의 그림), 아래쪽 타임라인(V1 영상 클립, A1 오디오 파형), 빨간 플레이바
function draw(now, p) {
  const R = MC_ROUNDS[st.r]; cx.fillStyle = '#0b0b14'; cx.fillRect(0, 0, MC_W, MC_H);
  // 프로그램 모니터
  const ci = st.cuts.filter(c => c.x <= p).length, pal = MC_PAL[(ci + st.r * 2) % MC_PAL.length];
  cx.fillStyle = '#262b44'; cx.fillRect(8, 6, 150, 86); cx.fillStyle = pal[0]; cx.fillRect(12, 10, 142, 50); cx.fillStyle = pal[1]; cx.fillRect(12, 60, 142, 28);
  scene(ci + st.r * 3, 12, 10, now);
  cx.fillStyle = '#b13e53'; cx.fillRect(12, 76, 60, 10); cx.fillStyle = '#f4f4f4'; cx.fillRect(14, 79, 40, 4); // 자막 바
  // 오른쪽 정보: 라운드, 타임코드
  cx.fillStyle = '#ffcd75'; cx.font = '8px "Press Start 2P",monospace'; cx.fillText('PGM', 166, 18);
  const tc = Math.floor(p * R.d * 30); cx.fillStyle = '#94b0c2'; cx.fillText(`00:0${Math.floor(tc / 30)}:${String(tc % 30).padStart(2, '0')}`, 166, 34);
  cx.fillStyle = '#f4f4f4'; cx.fillText(`R${st.r + 1}/${MC_ROUNDS.length}`, 166, 52);
  cx.fillStyle = st.phase === 'ready' && Math.floor(now / 250) % 2 ? '#b13e53' : '#38b764'; cx.fillRect(166, 62, 8, 8); cx.fillStyle = '#94b0c2'; cx.fillText(st.phase === 'ready' ? 'STBY' : 'REC', 178, 70);
  // 타임라인
  const ty = 100; cx.fillStyle = '#1a1c2c'; cx.fillRect(4, ty - 4, MC_W - 8, 48);
  const xs = [0, ...st.cuts.map(c => c.x), 1];
  for (let i = 0; i + 1 < xs.length; i++) { // 클립: 컷마다 색이 바뀌고, 맞춘 컷은 이음매가 초록으로 붙는다
    const a = MC_X0 + xs[i] * (MC_X1 - MC_X0), b = MC_X0 + xs[i + 1] * (MC_X1 - MC_X0), q = MC_PAL[(i + st.r * 2) % MC_PAL.length];
    cx.fillStyle = q[1]; cx.fillRect(a + 1, ty, b - a - 2, 16); cx.fillStyle = q[0]; cx.fillRect(a + 1, ty, b - a - 2, 4);
    cx.fillStyle = '#566c86'; for (let x = a + 2; x < b - 2; x += 3) { const h = 2 + Math.abs(Math.sin(x * .7 + i)) * 7; cx.fillRect(x, ty + 30 - h / 2, 2, h); } // 오디오 파형
  }
  st.cuts.forEach(c => { // 컷 표시
    const x = Math.round(MC_X0 + c.x * (MC_X1 - MC_X0));
    cx.fillStyle = c.res === 'p' ? '#a7f070' : c.res === 'g' ? '#38b764' : c.res === 'miss' ? '#566c86' : (Math.floor(now / 200) % 2 ? '#ff5050' : '#ffcd75');
    cx.fillRect(x - 1, ty - 4, 3, 40); if (!c.res) { cx.fillRect(x - 3, ty - 6, 7, 3); }
  });
  const px = Math.round(MC_X0 + p * (MC_X1 - MC_X0)); // 플레이바
  cx.fillStyle = '#f4f4f4'; cx.fillRect(px - 3, ty - 8, 7, 4); cx.fillStyle = '#ff2e4d'; cx.fillRect(px, ty - 6, 1, 44);
  if (st.flash && now - st.flash.at < 250) { cx.globalAlpha = 1 - (now - st.flash.at) / 250; cx.fillStyle = st.flash.res === 'miss' ? '#b13e53' : '#a7f070'; cx.fillRect(MC_X0 + st.flash.x * (MC_X1 - MC_X0) - 6, ty - 6, 13, 44); cx.globalAlpha = 1; }
}
// 모니터 속 장면: 클립 번호마다 앵커석 / 현장 건물 / 헬기 / 그래픽 중 하나
function scene(k, ox, oy, now) {
  const kind = k % 4, b = Math.floor(now / 300) % 2;
  if (kind === 0) { cx.fillStyle = '#5d275d'; cx.fillRect(ox + 20, oy + 32, 100, 10); cx.fillStyle = '#f4c2a0'; cx.fillRect(ox + 64, oy + 12, 14, 14); cx.fillStyle = '#333c57'; cx.fillRect(ox + 58, oy + 26, 26, 14); cx.fillStyle = '#1a1c2c'; cx.fillRect(ox + 64, oy + 10, 14, 4); }
  else if (kind === 1) { cx.fillStyle = '#29366f'; [[10, 14, 22], [36, 6, 30], [72, 20, 18], [96, 10, 26]].forEach(([x, y, w]) => cx.fillRect(ox + x, oy + y, w, 50 - y)); cx.fillStyle = '#ffcd75'; for (let i = 0; i < 12; i++) cx.fillRect(ox + 14 + (i * 23) % 104, oy + 18 + (i * 7) % 24, 3, 3); }
  else if (kind === 2) { const x = ox + 30 + (now / 30) % 80; cx.fillStyle = '#f4f4f4'; cx.fillRect(x, oy + 18, 24, 9); cx.fillRect(x + 22, oy + 20, 12, 3); cx.fillStyle = '#1a1c2c'; cx.fillRect(x - 6 + (b ? 0 : 12), oy + 14, 26, 2); cx.fillRect(x + 4, oy + 27, 14, 2); }
  else { cx.fillStyle = '#f4f4f4'; cx.fillRect(ox + 16, oy + 10, 110, 20); cx.fillStyle = '#b13e53'; cx.fillRect(ox + 16, oy + 10, 26, 20); cx.fillStyle = '#1a1c2c'; for (let i = 0; i < 4; i++) cx.fillRect(ox + 48 + i * 18, oy + 16, 12, 8); }
}
return {
  init(o) { onDone = o.onDone; sfx = o.sfx || sfx; cv = $m('mccv'); cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    $m('mcstage').addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
    addEventListener('keydown', e => { if (st && st.phase !== 'done' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); tap(); } });
  },
  start() { cancelAnimationFrame(raf); st = { r: 0, tot: 0, perf: 0, good: 0, miss: 0, stray: 0, combo: 0, best: 0 }; $m('mcj').textContent = ''; $m('mcc').textContent = ''; startRound(0); raf = requestAnimationFrame(update); },
  stop() { cancelAnimationFrame(raf); st = null; },
  get debug() { return st && { ...st, R: MC_ROUNDS[st.r] }; },
  get running() { return !!st && st.phase !== 'done'; },
};
})();
