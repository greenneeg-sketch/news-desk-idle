// 인트로(고해상도): 큰 사옥 앞에서 사계절·밤낮·노을이 바뀌고, 이벤트가 한 번에 하나씩 무작위로 이어진다
// (중계 헬기 / 뉴스 디펜더즈 히어로 4명 / UFO 대 전투기 / 거대 로봇). 사옥이 맞으면 구멍·불·연기가 생기고 잠시 뒤 복구된다.
// 캔버스는 가로 360칸(실제 2배 해상도). 타이틀·PRESS START·메뉴·자막은 DOM(dev.html)이 맡는다.
export function Intro(cv, tickerEl, clockEl) {
  const c = cv.getContext('2d'), W = 360, PX = '"Press Start 2P", monospace';
  const HERO = { cap: '캡틴 큐시트', ninja: '프레임 닌자', mecha: '메카 앵커', night: '나이트 에디터' }, SEASONS = ['봄', '여름', '가을', '겨울'];
  const DAY = 36, SKY = [[0, '#3a4a8a', '#ffb37a'], [.12, '#4aa0e8', '#bfe4ff'], [.40, '#4aa0e8', '#bfe4ff'], [.50, '#5a3a7a', '#ff8a4a'], [.60, '#0a1040', '#232a6a'], [.92, '#0a1040', '#232a6a'], [1, '#3a4a8a', '#ffb37a']];
  let H = 640, GY = 500, BY = 190, ROWS = 20, on = false, raf = 0, last = 0, clock = 4, ev = null, evNext = 3, lastType = '', holes = [], parts = [], shake = 0, lastSeason = -1, lastDay = -1, rainy = false, cars = [], nextCar = 2, crew = { x: -70, dir: 1, wait: 0 };
  const BX = 80, BW = 200, COLS = 13;
  const R = (x, y, w, h, k) => { c.fillStyle = k; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const T = (s, x, y, n, k, al) => { c.fillStyle = k; c.font = `bold ${n}px ${PX}`; c.textAlign = al || 'left'; c.fillText(s, x, y); c.textAlign = 'left'; };
  const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)), mix = (a, b, f) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join(''); };
  const bl = (t, n = 2) => Math.floor(t * n) % 2, hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5; return v - Math.floor(v); }, pick = a => a[Math.random() * a.length | 0];
  const say = m => { if (!tickerEl) return; tickerEl.textContent = m; tickerEl.style.animation = 'none'; void tickerEl.offsetWidth; tickerEl.style.animation = ''; };
  function resize() {
    const r = innerHeight / Math.max(1, innerWidth); H = Math.round(Math.max(480, Math.min(800, W * r)));
    cv.width = W * 2; cv.height = H * 2; c.setTransform(2, 0, 0, 2, 0, 0); c.imageSmoothingEnabled = false;
    GY = H - Math.round(H * .2); BY = Math.max(190, GY - 440); ROWS = Math.max(6, Math.floor((GY - 100 - BY - 14) / 9.5));
  }
  function sky(p) { let i = 0; while (p > SKY[i + 1][0]) i++; const f = (p - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); return [mix(SKY[i][1], SKY[i + 1][1], f), mix(SKY[i][2], SKY[i + 1][2], f)]; }
  const night = p => p < .06 ? 1 - p / .06 * .6 : p < .12 ? .4 - (p - .06) / .06 * .4 : p < .44 ? 0 : p < .6 ? (p - .44) / .16 : 1;
  const hr = h => { const age = clock - h.at; return age < .2 ? age / .2 : age > 12 ? Math.max(0, 1 - (age - 12) / 4) : 1; };
  function addHole(x, y, r) { holes.push({ x, y, r, at: clock, seed: Math.random() * 99 }); shake = .5; for (let i = 0; i < 26; i++) parts.push({ x: x + (Math.random() - .5) * r, y: y + (Math.random() - .5) * r, vx: (Math.random() - .5) * 120, vy: -40 - Math.random() * 90, life: 1.6 + Math.random(), col: ['#3d4a9a', '#9fd0ff', '#566c86', '#ffcd75'][i % 4], s: 2 + Math.random() * 3 }); }
  function boom(x, y, n = 14) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 160, vy: (Math.random() - .5) * 160, life: .5 + Math.random() * .5, col: ['#ffcd75', '#ef7d57', '#ffffff'][i % 3], s: 3 + Math.random() * 3, g: 0 }); }

  // ── 히어로(오리지널 4명): 날아가는 옆모습. 망토·벨트·가슴 문양·장갑·부츠·얼굴까지 그린다
  function heroSpr(x, y, kind, dir, t) {
    const P = { cap: { suit: '#ffcd75', sd: '#d89a3c', cape: '#257179', cd: '#1a4f55', boot: '#b13e53', emb: '#ffffff', skin: '#f2c9a0' }, ninja: { suit: '#2a3a55', sd: '#1a2438', cape: '#b13e53', cd: '#7a2434', boot: '#14141f', emb: '#73eff7', skin: '#f2c9a0' },
      mecha: { suit: '#c2c3c7', sd: '#8b9bb4', cape: '#b45bff', cd: '#7a3ab8', boot: '#566c86', emb: '#73eff7', skin: '#c2c3c7' }, night: { suit: '#333c57', sd: '#222633', cape: '#ef7d57', cd: '#b8522f', boot: '#14141f', emb: '#ffcd75', skin: '#e0ac7e' } }[kind], f = bl(t, 10), g = bl(t, 6);
    c.save(); c.translate(x, y); c.scale(dir * 1.5, 1.5);
    for (let i = 1; i < 5; i++) { c.globalAlpha = .4 - i * .08; R(-34 - i * 12, -3 + (i % 2), 10, 3, P.suit); R(-38 - i * 12, 3 - (i % 2), 8, 2, P.cape); } c.globalAlpha = 1;
    if (kind === 'mecha') { R(-40, 0, 9 + f * 5, 4, f ? '#ffcd75' : '#ef7d57'); R(-38, 5, 7 + g * 4, 3, '#fff6c0'); R(-16, -11, 12, 5, P.sd); R(-20, -10, 5, 3, '#ef7d57'); } // 추진기
    else { R(-30 + f * 2, -8, 22, 5, P.cape); R(-38 + f * 3, -6 + f, 14, 6, P.cd); R(-44 + f * 4, -3 + f * 2, 9, 6, P.cape); R(-48 + g * 3, f * 3, 6, 4, P.cd); R(-10, -9, 6, 3, P.cape); } // 망토(3단, 펄럭임)
    R(-28, -2, 18, 5, P.suit); R(-28, 3, 17, 4, P.sd); R(-35, -2, 8, 5, P.boot); R(-34, 3, 8, 4, P.boot); R(-36, -1, 2, 3, mix(P.boot, '#ffffff', .3)); // 다리·부츠
    R(-12, -6, 24, 11, P.suit); R(-12, 3, 24, 2, P.sd); R(-12, -6, 24, 2, mix(P.suit, '#ffffff', .35)); R(-13, -6, 3, 11, P.boot); R(-13, -2, 3, 3, '#ffcd75'); // 몸통·벨트
    R(-3, -4, 8, 7, P.emb); R(-1, -2, 4, 3, P.suit); R(-1, -2, 1, 3, P.emb); R(2, -2, 1, 3, P.emb); // 가슴 문양(N)
    R(-4, 5, 10, 3, P.sd); R(5, 6, 4, 3, P.boot); // 뒤쪽 팔
    R(10, -3, 16, 6, P.suit); R(10, 2, 16, 1, P.sd); R(24, -4, 7, 8, P.boot); R(29, -3, 3, 6, mix(P.boot, '#ffffff', .25)); // 앞으로 뻗은 팔·장갑
    R(11, -15, 11, 11, P.skin); // 머리
    if (kind === 'cap') { R(10, -17, 13, 6, P.cape); R(10, -12, 3, 6, P.cape); R(16, -11, 7, 3, '#73eff7'); R(17, -11, 2, 1, '#ffffff'); R(13, -19, 4, 3, '#ffcd75'); R(16, -6, 5, 1, '#b8522f'); }
    if (kind === 'ninja') { R(10, -17, 13, 13, P.sd); R(15, -12, 8, 3, '#f2c9a0'); R(17, -11, 2, 2, '#14141f'); R(21, -11, 1, 2, '#14141f'); R(6, -13, 5, 3, P.cape); R(2 - f * 2, -12 + f, 5, 3, P.cd); }
    if (kind === 'mecha') { R(10, -17, 13, 4, P.sd); R(14, -12, 9, 4, '#14141f'); R(15, -11, 7, 2, bl(t, 3) ? '#ff2e4d' : '#ff8a9a'); R(13, -20, 2, 4, P.sd); R(12, -21, 4, 2, '#ff2e4d'); R(11, -7, 11, 3, P.sd); }
    if (kind === 'night') { R(10, -17, 13, 9, P.sd); R(10, -21, 3, 5, P.sd); R(19, -21, 3, 5, P.sd); R(16, -12, 6, 2, '#ffffff'); R(18, -12, 2, 2, '#14141f'); R(15, -6, 6, 1, '#8a5a3a'); }
    c.restore();
  }
  // ── 달리는 취재진(옆모습 32x46): 취재기자(마이크·수첩) / 영상기자(어깨 카메라·모자). 팔다리가 번갈아 움직인다
  function runner(x, t, kind, dir = 1, still = false) {
    c.save(); if (dir < 0) { c.translate(x + 16, 0); c.scale(-1, 1); c.translate(-(x + 16), 0); }
    const ph = still ? 1 : Math.floor(t * 8) % 4, y = GY - 46 + (ph % 2 && !still ? -2 : 0), top = kind ? '#41a6f6' : '#a05ae0', td = kind ? '#2f7fc8' : '#7a3ab8', sk = kind ? '#e0ac7e' : '#f2c9a0', hair = kind ? '#3b2a20' : '#14141f';
    const la = [[-6, 0], [-2, 3], [5, 0], [1, 3]][ph], lb = [[5, 0], [1, 3], [-6, 0], [-2, 3]][ph];
    R(x + 12 + lb[0], y + 32, 6, 9 - lb[1], '#222633'); R(x + 11 + lb[0] + (lb[0] > 0 ? 2 : -2), y + 40 - lb[1], 8, 3, '#14141f'); // 뒷다리
    R(x + 9, y + 16, 15, 17, top); R(x + 9, y + 16, 15, 2, mix(top, '#ffffff', .3)); R(x + 21, y + 16, 3, 17, td); R(x + 11, y + 22, 9, 3, '#f4f4f4'); R(x + 12, y + 23, 7, 1, '#b13e53'); // 몸통 + PRESS 띠
    R(x + 12 + la[0], y + 32, 6, 10 - la[1], '#2a2a3a'); R(x + 11 + la[0] + (la[0] > 0 ? 2 : -2), y + 41 - la[1], 9, 3, '#0b0b14'); R(x + 12 + la[0] + (la[0] > 0 ? 6 : -1), y + 43 - la[1], 4, 1, '#f4f4f4'); // 앞다리·운동화
    R(x + 11, y + 3, 12, 12, sk); R(x + 21, y + 5, 2, 9, mix(sk, '#000000', .12)); R(x + 10, y + 1, 14, 6, hair); R(x + 10, y + 3, 3, 9, hair); R(x + 12, y + 2, 5, 1, mix(hair, '#ffffff', .3)); R(x + 19, y + 8, 2, 3, '#14141f'); R(x + 23, y + 10, 2, 2, sk); R(x + 19, y + 13, 3, 1, '#8a4a3a'); R(x + 14, y + 9, 2, 3, mix(sk, '#000000', .15)); // 얼굴
    R(x + 15, y + 15, 4, 2, mix(sk, '#000000', .12));
    if (kind) { R(x + 9, y, 16, 4, '#e43b44'); R(x + 20, y + 3, 8, 2, '#b13e53'); // 모자
      R(x + 14, y + 4, 24, 12, '#222633'); R(x + 14, y + 4, 24, 2, '#3a4466'); R(x + 36, y + 6, 8, 8, '#333c57'); R(x + 42, y + 7, 4, 6, '#73eff7'); R(x + 43, y + 8, 2, 2, '#ffffff'); R(x + 20, y - 1, 12, 5, '#333c57'); R(x + 16, y + 6, 6, 4, '#0b0b14'); if (bl(t, 2)) R(x + 32, y + 6, 2, 2, '#ff2e4d'); // 카메라
      R(x + 18, y + 16, 12, 5, top); R(x + 28, y + 14, 5, 5, sk); }
    else { const sw = ph % 2 ? 2 : 0; R(x + 19, y + 18, 10, 5, top); R(x + 27, y + 16 - sw, 5, 5, sk); R(x + 30, y + 8 - sw, 3, 10, '#333c57'); R(x + 28, y + 2 - sw, 7, 7, '#14141f'); R(x + 27, y + 7 - sw, 9, 5, '#b13e53'); R(x + 29, y + 8 - sw, 5, 2, '#ffffff'); // 마이크
      R(x + 4 - sw, y + 20, 7, 4, td); R(x + 1 - sw, y + 21, 6, 8, '#f4f4f4'); R(x + 2 - sw, y + 23, 4, 1, '#9aaabd'); R(x + 2 - sw, y + 25, 4, 1, '#9aaabd'); } // 수첩
    c.restore();
  }
  function ufoSpr(x, y, t, smoke) { R(x - 14, y - 12, 28, 10, '#a7f070'); R(x - 10, y - 15, 20, 4, '#d9ffb0'); R(x - 5, y - 10, 10, 7, '#3a8f5a'); R(x - 3, y - 9, 2, 2, '#14141f'); R(x + 1, y - 9, 2, 2, '#14141f'); R(x - 34, y - 4, 68, 9, '#94b0c2'); R(x - 34, y - 4, 68, 2, '#c8d4e2'); R(x - 24, y + 5, 48, 4, '#566c86'); for (let i = 0; i < 6; i++) R(x - 29 + i * 11, y - 1, 4, 3, (Math.floor(t * 6) + i) % 2 ? '#ffcd75' : '#ef7d57'); if (smoke) for (let i = 0; i < 4; i++) { c.globalAlpha = .5 - i * .1; R(x + 10 + i * 6, y - 18 - i * 9 - (t * 20 % 8), 8 + i * 2, 6 + i, '#566c86'); c.globalAlpha = 1; } }
  function jetSpr(x, y, t) { R(x - 16, y - 2, 30, 5, '#c2c3c7'); R(x - 16, y + 2, 30, 1, '#8b9bb4'); R(x + 12, y - 1, 8, 3, '#8b9bb4'); R(x - 6, y - 7, 10, 5, '#94b0c2'); R(x - 16, y - 6, 6, 4, '#94b0c2'); R(x - 2, y + 3, 12, 3, '#8b9bb4'); R(x + 3, y - 4, 8, 3, '#73eff7'); R(x + 5, y - 3, 3, 2, '#f2c9a0'); R(x - 10, y - 1, 4, 2, '#b13e53'); R(x - 22 - bl(t, 14) * 4, y - 1, 7 + bl(t, 14) * 4, 3, bl(t, 20) ? '#ffcd75' : '#ef7d57'); }
  function heliSpr(x, y, t, n) { if (n > .3) { c.globalAlpha = .14 * n; c.beginPath(); c.moveTo(x + 18, y + 12); c.lineTo(x - 40, y + 220); c.lineTo(x + 90, y + 220); c.closePath(); c.fillStyle = '#fff6c0'; c.fill(); c.globalAlpha = 1; }
    R(x, y, 40, 14, '#f4f4f4'); R(x, y + 10, 40, 4, '#c2c3c7'); R(x + 36, y + 4, 22, 4, '#f4f4f4'); R(x + 54, y - 2, 4, 10, '#e43b44'); R(x + 4, y + 3, 12, 7, '#73b6ef'); R(x + 8, y + 5, 4, 5, '#f2c9a0'); R(x + 7, y + 4, 6, 2, '#14141f'); R(x - 14 + bl(t, 14) * 30, y - 5, 44, 2, '#c2c3c7'); R(x + 18, y - 5, 3, 5, '#566c86'); R(x + 6, y + 14, 26, 2, '#566c86'); R(x + 20, y + 4, 14, 6, '#b13e53'); R(x + 30, y + 14, 6, 4, '#333c57'); R(x + 34, y + 15, 3, 2, '#73eff7'); }
  function robotSpr(x, t, punch, hit) { const step = Math.sin(t * 5) * 4, bob = Math.abs(Math.sin(t * 5)) * 3, B = '#7a7f9a', D = '#4a4f6a', A = '#b45bff';
    c.save(); c.translate(x, GY - bob + (hit ? -hit * 60 : 0)); if (hit) c.rotate(-hit * .8);
    R(-26, -50 + step, 20, 50 - step, D); R(6, -50 - step, 20, 50 + step, D); R(-30, -6 + step, 28, 6, B); R(4, -6 - step, 28, 6, B); R(-24, -30 + step, 16, 3, A); R(8, -30 - step, 16, 3, A);
    R(-34, -122, 68, 74, B); R(-34, -122, 68, 5, '#a8aec8'); R(26, -122, 8, 74, D); R(-22, -108, 44, 26, D); R(-16, -102, 32, 14, bl(t, 3) ? '#73eff7' : '#41a6f6'); R(-12, -98, 6, 6, '#f2c9a0'); R(-13, -100, 8, 3, '#14141f'); R(-20, -74, 40, 4, A); R(-8, -66, 16, 10, '#ffcd75'); for (let i = 0; i < 3; i++) R(-28, -70 + i * 6, 5, 3, D);
    R(-20, -154, 40, 30, B); R(-20, -154, 40, 4, '#a8aec8'); R(-14, -144, 28, 8, '#14141f'); R(-10 + (bl(t, 2) ? 0 : 12), -142, 8, 4, '#ff2e4d'); R(-10, -132, 20, 3, D); R(-4, -164, 8, 10, D); if (bl(t, 4)) R(-3, -168, 6, 4, '#ff2e4d');
    R(-52, -118, 18, 22, A); R(-50, -96, 14, 44, B); R(-52, -54, 18, 14, D);
    if (punch > 0) { R(34, -116, 18, 20, A); R(52, -112, 30 + punch * 30, 14, B); R(80 + punch * 30, -116, 20, 22, D); } else { R(34, -118, 18, 22, A); R(36, -96, 14, 44, B); R(34, -54, 18, 14, D); }
    c.restore(); }
  function tree(x, s) { R(x + 6, GY - 20, 5, 20, '#5a3a20'); const k = [['#ffb7d5', '#ff8fc0'], ['#38b764', '#257179'], ['#ef7d57', '#d8a050'], ['#5a3a20', '#5a3a20']][s];
    if (s === 3) { R(x, GY - 30, 3, 14, k[0]); R(x + 12, GY - 34, 3, 16, k[0]); R(x + 2, GY - 32, 12, 3, k[0]); R(x, GY - 32, 16, 3, '#f4f4f4'); R(x + 4, GY - 38, 10, 3, '#f4f4f4'); }
    else { R(x - 4, GY - 38, 26, 18, k[0]); R(x, GY - 46, 18, 10, k[0]); R(x - 4, GY - 26, 26, 6, k[1]); R(x + 2, GY - 42, 6, 4, mix(k[0], '#ffffff', .4)); } }
  function van(x, s) { R(x, GY - 36, 104, 34, '#f4f4f4'); R(x, GY - 16, 104, 5, '#b13e53'); R(x + 82, GY - 30, 16, 12, '#73b6ef'); R(x + 86, GY - 27, 5, 6, '#f2c9a0'); R(x + 10, GY - 30, 44, 10, '#1d3a6b'); T('NEWS', x + 14, GY - 22, 7, '#ffcd75'); R(x + 12, GY - 4, 16, 9, '#14141f'); R(x + 76, GY - 4, 16, 9, '#14141f'); R(x + 40, GY - 50, 3, 14, '#566c86'); R(x + 30, GY - 60, 24, 12, '#c2c3c7'); if (s === 3) { R(x, GY - 38, 104, 3, '#ffffff'); R(x + 30, GY - 62, 24, 3, '#ffffff'); } }
  // 지나가는 자동차: 위 차로는 왼쪽으로, 아래 차로는 오른쪽으로
  function carSpr(k, n) { const y = GY + (k.d > 0 ? 50 : 24), x = k.x; c.save(); if (k.d < 0) { c.translate(x + 20, 0); c.scale(-1, 1); c.translate(-(x + 20), 0); }
    R(x, y - 12, 40, 10, k.col); R(x, y - 4, 40, 2, mix(k.col, '#000000', .3)); R(x + 8, y - 19, 22, 8, k.col); R(x + 11, y - 17, 7, 5, '#b8dcff'); R(x + 20, y - 17, 8, 5, '#b8dcff'); R(x + 5, y - 4, 8, 6, '#14141f'); R(x + 27, y - 4, 8, 6, '#14141f'); R(x + 7, y - 2, 4, 2, '#8b9bb4'); R(x + 29, y - 2, 4, 2, '#8b9bb4'); R(x + 37, y - 10, 3, 3, n > .4 ? '#fff6c0' : '#f4f4f4'); R(x, y - 10, 2, 3, '#e43b44');
    if (k.taxi) { R(x + 15, y - 22, 8, 3, '#ffcd75'); } if (n > .4) { c.globalAlpha = .25; R(x + 40, y - 11, 22, 6, '#fff6c0'); c.globalAlpha = 1; } c.restore(); }
  // ── 이벤트: 한 번에 하나, 무작위(같은 것이 연달아 나오지 않게)
  function startEv() { const type = pick(['heli', 'hero', 'hero', 'ufo', 'robot', 'live'].filter(k => k !== lastType || k === 'hero')); lastType = type; ev = { type, t0: clock, f: {}, hk: pick(Object.keys(HERO)), dir: Math.random() < .5 ? 1 : -1 };
    say(type === 'heli' ? pick(['[현장] 중계 헬기, 보도국 상공에서 생중계 중', '[LIVE] 항공 촬영팀 출동']) : type === 'hero' ? `[화제] 뉴스 디펜더즈 '${HERO[ev.hk]}', 방송국 상공 포착` : type === 'live' ? pick(['[현장] 중계차 긴급 출동… 잠시 후 연결합니다', '[현장] 취재진 현장 급파']) : type === 'ufo' ? '[속보] 방송국 상공에 정체불명 UFO 출현… 공군 전투기 긴급 출격' : '[속보] 거대 로봇, 보도국 습격! 뉴스 디펜더즈 출동'); }
  function drawEv(t, n) { if (!ev) return; const u = clock - ev.t0, once = (k, fn) => { if (!ev.f[k]) { ev.f[k] = 1; fn(); } };
    if (ev.type === 'heli') { const x = ev.dir > 0 ? -70 + u * 40 : W + 10 - u * 40; c.save(); if (ev.dir < 0) { c.translate(x + 29, 0); c.scale(-1, 1); c.translate(-(x + 29), 0); } heliSpr(x, BY - 34 + Math.sin(u * 1.4) * 8, t, n); c.restore(); if (u > 11.5) ev = null; }
    else if (ev.type === 'live') { // 중계차가 달려와 서고, 취재진이 내려 생중계한 뒤 떠난다
      const vx = u < 3 ? -120 + u * 46 : u < 11 ? 18 : 18 + (u - 11) * 150;
      c.save(); c.translate(0, 30); van(vx, -1);
      if (u > 3.6 && u < 10.6) { once('l', () => say('[LIVE] 현장 연결합니다. 보도국 앞에서 전해 드립니다')); runner(134, t, 0, 1, true); runner(186, t, 1, -1, true);
        R(140, GY - 70, 44, 15, '#0b0b14'); R(142, GY - 68, 40, 11, bl(t, 2) ? '#e43b44' : '#8a1e2a'); T('LIVE', 162, GY - 59, 8, '#ffffff', 'center'); }
      c.restore(); if (vx > W + 10) ev = null; }
    else if (ev.type === 'hero') { const k = ev.hk, dir = ev.dir, f = u / 5, x = dir > 0 ? -50 + f * 470 : 410 - f * 470, mid = BY + (GY - BY) * .35, y = k === 'ninja' ? mid + Math.sin(u * 6) * 40 : k === 'night' ? BY - 20 + Math.sin(f * Math.PI) * 150 : mid - 30 + Math.sin(u * 2) * 26; heroSpr(x, y, k, dir, t); if (f > 1) ev = null; }
    else if (ev.type === 'ufo') { const hy = BY - 34, ux = u < 2 ? 420 - u * 80 : u < 7 ? 260 + Math.sin(u * 2) * 10 : 260 + (u - 7) * 90, uy = u < 7 ? hy + Math.sin(u * 3) * 4 : hy - (u - 7) * 30;
      if (u > 2.4 && u < 3.6) { c.globalAlpha = .7; R(ux - 5, uy + 8, 10, BY + 60 - uy, bl(t, 16) ? '#a7f070' : '#d9ffb0'); c.globalAlpha = 1; once('h', () => addHole(246, BY + 60, 22)); }
      ufoSpr(ux, uy, t, u > 5.4);
      if (u > 3.6) { const jx = -40 + (u - 3.6) * 110; [0, 1].forEach(i => { const x = jx - i * 46, y = hy - 16 + i * 22; if (x < W + 40) jetSpr(x, y, t); if (u > 4.4 && u < 5.4) R(x + 22 + (u - 4.4) * 150, y, 10, 2, '#ffcd75'); }); }
      if (u > 5.3) once('b', () => { boom(ux, uy, 24); shake = .3; }); if (u > 8) once('s', () => say('[속보] UFO 퇴각… 군 "추가 출현 대비"'));
      if (u > 10) ev = null; }
    else if (ev.type === 'robot') { const rx = u < 3 ? -60 + u * 30 : 30, pu = (u > 3.4 && u < 4) ? (u - 3.4) / .6 : (u > 5 && u < 5.6) ? (u - 5) / .6 : 0, hit = u > 7 ? (u - 7) / 1.6 : 0;
      if (u > 3.9) once('p1', () => addHole(104, GY - 132, 20)); if (u > 5.5) once('p2', () => addHole(118, GY - 100, 16));
      robotSpr(hit ? rx - hit * 140 : rx, u < 3 ? t : 0, pu, Math.min(1, hit));
      if (u > 6) { const hf = u - 6; heroSpr(hf > 1 ? 60 + (hf - 1) * 160 : 400 - hf * 340, GY - 170 + (hf > 1 ? (hf - 1) * -60 : 0), ev.hk, hf > 1 ? 1 : -1, t); if (hf > 1) once('k', () => { boom(60, GY - 150, 20); shake = .4; say(`[속보] '${HERO[ev.hk]}', 거대 로봇 제압!`); }); }
      if (u > 9.5) ev = null; } }
  function frame(now) {
    if (!on) return; const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; clock += dt;
    try { draw(dt); } catch (e) { console.error(e); } // 오류가 나도 다음 프레임은 계속
    raf = requestAnimationFrame(frame);
  }
  function draw(dt) {
    const t = clock, dayT = t / DAY, p = dayT % 1, n = night(p), season = Math.floor(dayT) % 4, sunset = Math.max(0, 1 - Math.abs(p - .5) / .09), dawn = Math.max(0, 1 - Math.abs(p < .5 ? p : p - 1) / .07);
    if (!ev && t > evNext) startEv(); if (ev) evNext = t + 2.5; shake = Math.max(0, shake - dt);
    if (season !== lastSeason) { if (lastSeason >= 0) say(['[날씨] 벚꽃 만개… 보도국 앞 꽃길', '[날씨] 본격 무더위 시작', '[날씨] 단풍 절정… 낙엽 지는 보도국', '[날씨] 첫눈 내린 보도국'][season]); lastSeason = season; }
    if (Math.floor(dayT) !== lastDay) { lastDay = Math.floor(dayT); const was = rainy; rainy = Math.random() < [.25, .6, .25, 0][season]; if (rainy && !was) say(season === 1 ? '[날씨] 장맛비 시작… 우산 챙기세요' : '[날씨] 곳곳에 비 소식'); }
    nextCar -= dt; if (nextCar <= 0) { nextCar = 2.5 + Math.random() * 4; const d = Math.random() < .5 ? 1 : -1; cars.push({ x: d > 0 ? -50 : W + 10, d, v: 70 + Math.random() * 50, col: pick(['#e43b44', '#41a6f6', '#f4f4f4', '#ffcd75', '#38b764', '#566c86']), taxi: Math.random() < .2 }); }
    cars.forEach(k => { k.x += k.d * k.v * dt; }); cars = cars.filter(k => k.x > -70 && k.x < W + 30);
    if (crew.wait > 0) crew.wait -= dt; else { crew.x += crew.dir * 46 * dt; if ((crew.dir > 0 && crew.x > W + 60) || (crew.dir < 0 && crew.x < -100)) { crew.dir *= -1; crew.wait = 1.5 + Math.random() * 3; } } // 취재진: 좌우로 왔다 갔다
    c.save(); if (shake > 0) c.translate((Math.random() - .5) * shake * 12, (Math.random() - .5) * shake * 12);
    const [top, bot] = sky(p); for (let y = 0; y < H; y += 6) R(0, y, W, 6, mix(top, bot, Math.min(1, y / (GY - 20))));
    if (n > .2) { c.globalAlpha = Math.min(1, (n - .2) * 1.6); for (let i = 0; i < 80; i++) if ((i + Math.floor(t * 1.5)) % 6) R((i * 67) % W, (i * 41) % (GY - 140), i % 7 ? 1 : 2, i % 7 ? 1 : 2, '#f4f4f4'); c.globalAlpha = 1; }
    const AR = GY - 110; // 해·달이 도는 높이
    if (p < .56) { const a = p / .56 * Math.PI, sx = 180 - Math.cos(a) * 190, sy = GY - 70 - Math.sin(a) * AR, k = mix('#fff6c0', '#ff7a3a', Math.max(sunset, dawn)); R(sx - 12, sy - 16, 24, 32, k); R(sx - 16, sy - 12, 32, 24, k); c.globalAlpha = .25; R(sx - 22, sy - 22, 44, 44, k); c.globalAlpha = 1; }
    if (p > .5) { const a = (p - .5) / .5 * Math.PI, mx = 180 - Math.cos(a) * 190, my = GY - 70 - Math.sin(a) * AR; R(mx - 10, my - 14, 20, 28, '#fff6c0'); R(mx - 14, my - 10, 28, 20, '#fff6c0'); R(mx - 6, my - 6, 5, 5, '#e6d89a'); R(mx + 3, my + 3, 4, 4, '#e6d89a'); }
    if (n < .7) { c.globalAlpha = (1 - n) * .9; for (let i = 0; i < 5; i++) { const x = ((i * 130 + t * (6 + i)) % 520) - 80, y = 40 + i * Math.max(26, (BY - 60) / 5), k = mix('#ffffff', '#ffb37a', Math.max(sunset, dawn) * .8); R(x, y, 56, 9, k); R(x + 12, y - 6, 28, 7, k); R(x + 30, y + 8, 30, 5, k); } c.globalAlpha = 1; }
    const far = mix('#7f96c8', '#141a50', n), mid = mix('#6a82b8', '#1c2462', n);
    for (let i = 0; i < 12; i++) { const bh = 60 + hash(i, 1) * 90; R(i * 30, GY - bh, 29, bh, far); } for (let i = 0; i < 9; i++) { const bh = 40 + hash(i, 2) * 70; R(-10 + i * 42, GY - bh, 40, bh, mid); }
    // 사옥(가상): 타워 + 저층부 + 옥상 안테나
    const body = '#3d4a9a', bodyD = '#2a3478', PY = GY - 64, SY = GY - 96;
    R(BX, BY, BW, GY - BY, body); R(BX, BY, BW, 5, '#6a78c8'); R(BX + BW - 8, BY, 8, GY - BY, bodyD); R(BX, BY, 4, GY - BY, '#4a58aa');
    const wx = q => BX + 12 + q * 14, wy = r => BY + 14 + r * 9.5, inHole = (x, y) => holes.some(h => Math.hypot(x - h.x, y - h.y) < h.r * hr(h));
    for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) R(wx(q), wy(r), 10, 6, (q + r) % 3 ? '#8fc4f4' : '#b8dcff');
    R(46, PY, 268, 64, '#4a58aa'); R(46, PY, 268, 5, '#7886d8'); R(306, PY, 8, 64, bodyD); for (let q = 0; q < 17; q++) R(56 + q * 15, PY + 14, 10, 36, '#9fd0ff');
    R(150, GY - 20, 60, 20, '#14141f'); R(156, GY - 28, 48, 28, '#d8ecff');
    R(84, SY, 192, 28, '#0b0b14'); R(87, SY + 3, 186, 22, '#b13e53'); T('NEWS DESK', 180, SY + 21, 15, '#ffffff', 'center');
    R(174, BY - 60, 12, 60, '#566c86'); R(152, BY - 30, 56, 4, '#566c86'); R(162, BY - 44, 36, 4, '#566c86'); R(164, BY - 22, 32, 22, '#3a4466'); R(98, BY - 14, 34, 14, '#c2c3c7'); R(106, BY - 22, 18, 10, '#8b9bb4'); R(236, BY - 12, 26, 12, '#566c86');
    holes.forEach(h => { const rr = h.r * hr(h); if (rr < 1) return; for (let dy = -rr; dy <= rr; dy += 4) { const hw = Math.sqrt(Math.max(0, rr * rr - dy * dy)) + (hash(h.seed, dy) - .5) * 8; R(h.x - hw, h.y + dy, hw * 2, 4, '#0b0b14'); } R(h.x - rr * .5, h.y - rr * .3, rr * .6, 3, '#566c86'); R(h.x + rr * .1, h.y + rr * .4, rr * .5, 3, '#566c86'); });
    [6, 30, 318, 340].forEach(x => tree(x, season));
    R(0, GY, W, H - GY, '#2c3246'); R(0, GY, W, 3, '#8b9bb4'); for (let x = 0; x < W + 50; x += 50) R(x - ((t * 30) % 50), GY + 28, 26, 3, '#ffcd75'); R(0, GY + 56, W, 3, '#8b9bb4'); R(0, GY + 59, W, H - GY - 59, '#23283a');
    if (season === 3) R(0, GY, W, 5, '#ffffff'); if (season === 2) for (let i = 0; i < 14; i++) R((i * 29) % W, GY + 6 + (i * 7) % 40, 4, 2, i % 2 ? '#ef7d57' : '#d8a050'); if (season === 0) for (let i = 0; i < 12; i++) R((i * 31) % W, GY + 8 + (i * 9) % 36, 3, 2, '#ffb7d5');
    van(226, season);
    if (season === 3) { R(BX, BY - 3, BW, 4, '#ffffff'); R(46, PY - 3, 34, 4, '#ffffff'); R(280, PY - 3, 34, 4, '#ffffff'); R(98, BY - 17, 34, 3, '#ffffff'); }
    // 밤·노을 색 → 그 위에 불 켜진 창문(움직이는 것들은 그 뒤에 그려서 창문에 가리지 않는다)
    if (n > 0) { const y0 = Math.max(60, BY - 70); c.globalAlpha = n * .5; R(0, y0 + 24, W, H - y0 - 24, '#0a1040'); for (let i = 0; i < 6; i++) { c.globalAlpha = n * .5 * (i / 6); R(0, y0 + i * 4, W, 4, '#0a1040'); } c.globalAlpha = 1; }
    const warm = Math.max(sunset, dawn * .7); if (warm > 0) { c.globalAlpha = warm * .22; R(0, 0, W, H, '#ff7a3a'); c.globalAlpha = 1; }
    if (n > .15) { c.globalAlpha = Math.min(1, (n - .15) * 1.5);
      for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) { const lit = hash(q + Math.floor(t * .15 + q * r * .31), r); if (lit < .55 && !inHole(wx(q) + 5, wy(r) + 3)) R(wx(q), wy(r), 10, 6, lit < .12 ? '#b8dcff' : '#ffe28a'); }
      for (let q = 0; q < 17; q++) if (hash(q, 9) < .8) R(56 + q * 15, PY + 14, 10, 36, '#ffe28a'); R(156, GY - 28, 48, 28, '#fff6c0');
      for (let i = 0; i < 12; i++) for (let j = 0; j < 5; j++) if (hash(i, j + 20) < .4) R(i * 30 + 6 + (j % 2) * 12, GY - 50 - j * 14 - hash(i, 1) * 20, 3, 3, '#ffcd75');
      c.globalAlpha = 1; }
    R(87, SY + 3, 186, 22, n > .3 ? '#e43b44' : '#b13e53'); T('NEWS DESK', 180, SY + 21, 15, '#ffffff', 'center'); if (bl(t, 1.5)) R(176, BY - 68, 8, 8, '#ff2e4d');
    holes.forEach(h => { const age = t - h.at, rr = h.r * hr(h); if (rr < 1) return; if (age < 9) for (let i = 0; i < 4; i++) { const fh = 4 + hash(i, Math.floor(t * 8)) * 10; R(h.x - rr * .6 + i * rr * .4, h.y + rr * .5 - fh, 5, fh, i % 2 ? '#ffcd75' : '#ef7d57'); }
      for (let i = 0; i < 5; i++) { const f = (t * .5 + i * .2) % 1; c.globalAlpha = (1 - f) * .5 * Math.min(1, rr / 10); R(h.x - 6 + Math.sin(i + t) * 8 + f * 14, h.y - rr - f * 70, 10 + f * 14, 8 + f * 8, '#3a4466'); c.globalAlpha = 1; }
      if (age > 11) for (let i = 0; i < 6; i++) if (bl(t + i * .3, 6)) R(h.x + Math.cos(i * 1.1 + t * 3) * rr, h.y + Math.sin(i * 1.1 + t * 3) * rr, 3, 3, '#ffcd75'); });
    cars.filter(k => k.d < 0).forEach(k => carSpr(k, n));
    runner(crew.x, t, 0, crew.dir); runner(crew.x - crew.dir * 44, t + .2, 1, crew.dir);
    cars.filter(k => k.d > 0).forEach(k => carSpr(k, n));
    drawEv(t, n);
    parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g === 0 ? 0 : 320) * dt; q.life -= dt; c.globalAlpha = Math.max(0, Math.min(1, q.life * 2)); R(q.x, q.y, q.s, q.s, q.col); c.globalAlpha = 1; }); parts = parts.filter(q => q.life > 0 && q.y < GY + 40);
    if (season !== 1 && !(rainy && season !== 3)) for (let i = 0; i < 50; i++) { const sp = season === 3 ? 34 : 46, x = (hash(i, 3) * W + Math.sin(t * 1.3 + i) * 14 + t * (season === 3 ? 6 : 22)) % W, y = (hash(i, 4) * (GY + 20) + t * sp * (.6 + hash(i, 5) * .7)) % (GY + 20); R(x, y, season === 3 ? 2 + (i % 2) : 3, season === 3 ? 2 + (i % 2) : 2, season === 0 ? (i % 2 ? '#ffb7d5' : '#ffd6e8') : season === 2 ? (i % 2 ? '#ef7d57' : '#d8a050') : '#ffffff'); }
    else if (n > .5) for (let i = 0; i < 10; i++) if (bl(t + i * .37, 1.2)) R(20 + hash(i, 6) * 320 + Math.sin(t + i) * 8, GY - 60 + hash(i, 7) * 50, 2, 2, '#d9ffb0');
    if (rainy && season !== 3) { c.globalAlpha = .18; R(0, 0, W, H, '#2a3a5a'); c.globalAlpha = .55; for (let i = 0; i < 90; i++) { const x = (hash(i, 11) * (W + 60) + t * -60) % (W + 60) - 10, y = (hash(i, 12) * H + t * 520 * (.8 + hash(i, 13) * .4)) % H; R((x + W + 60) % (W + 60) - 10, y, 1, 9, '#c8dcff'); } for (let i = 0; i < 14; i++) if (bl(t + i * .13, 6)) R(hash(i, 14) * W, GY + 4 + hash(i, 15) * 50, 4, 1, '#c8dcff'); c.globalAlpha = 1; }
    c.restore();
    holes = holes.filter(h => t - h.at < 16);
    if (clockEl) { const hrs = (6 + p * 24) % 24; clockEl.textContent = `${SEASONS[season]} · ${String(hrs | 0).padStart(2, '0')}:${String((hrs % 1) * 60 | 0).padStart(2, '0')}${rainy && season !== 3 ? ' · 비' : ''}`; }
  }
  addEventListener('resize', () => { if (on) resize(); });
  const it = +(new URLSearchParams(location.search).get('it')); if (it) clock = it; // 테스트용: ?it=초
  return {
    start() { if (on) return; on = true; last = 0; resize(); say('[LIVE] 오늘도 보도국은 쉬지 않습니다'); raf = requestAnimationFrame(frame); },
    stop() { on = false; cancelAnimationFrame(raf); },
    debug: { rain(v) { rainy = v; }, ev(type, hk) { lastType = type; ev = { type, t0: clock, f: {}, hk: hk || 'cap', dir: 1 }; }, time(v) { clock = v; ev = null; evNext = v + 99; } },
  };
}
