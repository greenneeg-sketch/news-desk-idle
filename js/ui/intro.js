// 인트로 타이틀: 픽셀 방송국 건물 타임랩스(4계절·밤낮·노을·날씨)
// + 중계 헬기, UFO vs 전투기, 오리지널 히어로 '뉴스 디펜더즈', 거대 로봇 습격, 건물 파괴와 복구
const IHEROES = {
  cap: '캡틴 큐시트', ninja: '프레임 닌자', mecha: '메카 앵커', night: '나이트 에디터',
};
const ISEASONS = ['봄', '여름', '가을', '겨울'];
const ISKY = [[0, '#070a1f', '#141a3d'], [.2, '#0b1030', '#26244f'], [.26, '#3a3f7a', '#f2a65a'], [.32, '#5fa8e8', '#bfe3ff'], [.68, '#4f9be0', '#b5dcff'], [.74, '#4b3a85', '#ff8a4c'], [.8, '#241c4a', '#8a3f6a'], [.88, '#0b1030', '#1c1f45'], [1, '#070a1f', '#141a3d']];
const irgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const imixc = (a, b, t) => { const x = irgb(a), y = irgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const irnd = (a, b) => a + Math.random() * (b - a);
const ipick = a => a[Math.random() * a.length | 0];
const IDAY = 20, ISEASON_DAYS = 2; // 하루 20초, 계절마다 2일 (1년 = 160초)

export function Intro(cv, tickerEl, clockEl) {
  const mc = cv.getContext('2d'), lay = document.createElement('canvas'), lc = lay.getContext('2d'); let c = mc;
  let W = 180, H = 360, G = 320, B0 = 56, B1 = 114, BT = 140, T = +(new URLSearchParams(location.search).get('it')) || 4.5, raf = 0, last = 0, on = false, nameTxt = 'NEWS';
  let parts = [], acts = [], holes = [], wins = [], apts = [], city = [], clouds = [], disk = { gone: 0, t: 0 }, flash = 0, next = 1, bigs = [], incidents = [], vans = [], cars = [], nextCar = 1, lastSeason = -1, rainy = false;
  const R = (x, y, w, h, k) => { c.fillStyle = k; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const circ = (cx, cy, r, k) => { for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); R(cx - w, cy + dy, 2 * w + 1, 1, k); } };
  // 뉴스 자막: 대기열에 쌓았다가 7초마다 하나씩 흘려보낸다
  let tq = [], tickT = 0;
  const show = m => { if (!tickerEl) return; tickerEl.textContent = m; tickerEl.style.animation = 'none'; void tickerEl.offsetWidth; tickerEl.style.animation = ''; };
  const say = m => { if (!tq.includes(m)) tq.push(m); if (tq.length > 3) tq.shift(); };

  function resize() {
    const r = innerHeight / Math.max(1, innerWidth);
    W = 180; H = Math.round(Math.max(300, Math.min(400, 180 * r))); cv.width = W; cv.height = H; lay.width = W; lay.height = H; mc.imageSmoothingEnabled = false; lc.imageSmoothingEnabled = false;
    G = H - 92; B0 = 60; B1 = 118; BT = G - Math.max(100, Math.min(190, G - 118));
    wins = []; for (let y = BT + 16; y < G - 6; y += 5) for (let x = B0 + 5; x < B1 - 5; x += 6) wins.push({ x, y, on: Math.random() < .45 });
    apts = []; [[W - 54, 62], [W - 28, 84]].forEach(([x, h]) => { for (let y = G - h + 6; y < G - 4; y += 6) for (let i = 0; i < 4; i++) apts.push({ x: x + 3 + i * 6, y, on: Math.random() < .5 }); });
    city = []; for (let x = 0; x < W; x += 8) city.push({ x, h: irnd(18, 55) });
    clouds = []; for (let i = 0; i < 6; i++) clouds.push({ x: irnd(0, W), y: irnd(15, BT - 10), w: irnd(14, 34), s: irnd(10, 22) });
  }

  // ---------- 시간·계절 ----------
  const dayF = () => (T % IDAY) / IDAY;
  const season = () => Math.floor(T / (IDAY * ISEASON_DAYS)) % 4;
  const nightF = f => f < .2 || f > .86 ? 1 : f < .3 ? 1 - (f - .2) / .1 : f > .72 ? (f - .72) / .14 : 0;
  const sunsetF = f => Math.max(0, 1 - Math.abs(f - .74) / .06, 1 - Math.abs(f - .26) / .05);
  function skyAt(f) { let i = 0; while (ISKY[i + 1][0] < f) i++; const a = ISKY[i], b = ISKY[i + 1], t = (f - a[0]) / (b[0] - a[0]); return [imixc(a[1], b[1], t), imixc(a[2], b[2], t)]; }

  // ---------- 효과 ----------
  const boom = (x, y, n = 14, big2 = 1) => { for (let i = 0; i < n; i++) parts.push({ x, y, vx: irnd(-30, 30) * big2, vy: irnd(-34, 14) * big2, life: irnd(.4, .9), col: ipick(['#ffd24a', '#ff7a2a', '#ffffff', '#ef7d57']), s: ipick([1, 2, 2, 3]), g: 30, glow: 1 }); flash = Math.max(flash, .25 * big2); };
  const debris = (x, y, n = 8) => { for (let i = 0; i < n; i++) parts.push({ x, y, vx: irnd(-20, 20), vy: irnd(-25, 0), life: 2.5, col: ipick(['#4fa3b8', '#2f6f82', '#e8eef2', '#94b0c2']), s: ipick([1, 2]), g: 80, ground: 1 }); };
  function hit(x, y, r = 3) { // 건물 피격: 구멍 + 불 + 파편
    x = Math.max(B0 - 6, Math.min(B1 - 3, x)); y = Math.max(BT + 4, Math.min(G - 8, y));
    holes.push({ x, y, r, age: 0, life: irnd(10, 16) }); incidents.push({ x, t: 0 }); boom(x, y, 10); debris(x, y, 10);
    if (holes.length > 14) holes.shift();
  }
  function knockDisk() { if (disk.gone) return; disk.gone = 1; disk.t = 14; boom(B0 - 2, BT - 2, 22, 1.4); for (let i = 0; i < 20; i++) parts.push({ x: B0 - 2 + irnd(-10, 10), y: BT - 2 + irnd(-8, 8), vx: irnd(-25, 10), vy: irnd(-20, 5), life: 3, col: ipick(['#e8eef2', '#c2c3c7', '#2f6f82']), s: 2, g: 90, ground: 1 }); say('[속보] 보도국 옥상 원형 구조물 붕괴… "방송은 계속됩니다"'); }

  // ---------- 캐릭터 그리기 (오리지널 디자인) ----------
  const HERO_DRAW = {
    cap(x, y, d, t) { // 노란 슈트 + 초록 망토 + 고글, 수평 비행
      const w = Math.sin(t * 22) > 0 ? 1 : 0;
      R(x - d * 6, y - 1 + w, 5, 2, '#38b764'); R(x - d * 9, y + w * -1, 3, 2, '#257179');
      R(x - (d > 0 ? 3 : 4), y, 7, 3, '#ffcd75'); R(x - (d > 0 ? 6 : -3), y + 1, 3, 2, '#2a2a3a');
      R(x + (d > 0 ? 4 : -6), y - 1, 3, 3, '#f0c090'); R(x + (d > 0 ? 5 : -5), y - 1, 2, 1, '#14141f');
      R(x + (d > 0 ? 7 : -9), y, 3, 1, '#ffcd75');
    },
    ninja(x, y, d, t) { // 청록·검정 닌자 + 흰 스카프
      for (let i = 1; i < 5; i++) R(x - d * (i * 2 + 1), y - 4 + Math.round(Math.sin(t * 15 + i) * 1), 2, 1, '#f4f4f4');
      R(x - 1, y - 6, 3, 3, '#14141f'); R(x - 1, y - 5, 3, 1, '#73eff7');
      R(x - 1, y - 3, 3, 4, '#257179'); R(x - 2, y + 1, 1, 3, '#14141f'); R(x + 2, y + 1, 1, 3, '#14141f');
    },
    mecha(x, y, d, t) { // 은색 각진 슈트 + 보라 바이저 + 파란 제트
      R(x - 2, y - 7, 4, 3, '#c2c3c7'); R(x - 1 + (d > 0 ? 1 : -1), y - 6, 3, 1, '#b45bff');
      R(x - 3, y - 4, 6, 5, '#94b0c2'); R(x - 1, y - 3, 2, 2, '#a7f070');
      R(x - 3, y + 1, 2, 3, '#566c86'); R(x + 1, y + 1, 2, 3, '#566c86');
      R(x - 3, y + 4, 2, 2 + (t * 20 | 0) % 2, '#73eff7'); R(x + 1, y + 4, 2, 2 + (t * 20 | 0) % 2, '#73eff7');
    },
    night(x, y, d, t) { // 주황 후드 + 보라 호버보드
      R(x - 2, y - 7, 4, 4, '#ef7d57'); R(x - 1 + (d > 0 ? 1 : 0), y - 5, 2, 2, '#14141f');
      R(x - 2, y - 3, 4, 4, '#333c57'); R(x - 2, y + 1, 1, 2, '#333c57'); R(x + 1, y + 1, 1, 2, '#333c57');
      R(x - 5, y + 3, 10, 1, '#b45bff'); R(x - 4, y + 4, 8, 1, (t * 10 | 0) % 2 ? '#ff4ad6' : '#5d275d');
    },
  };
  const drawJet = (x, y, d) => { R(x - 5, y, 10, 2, '#9aa5b1'); R(x + (d > 0 ? 5 : -7), y, 2, 1, '#c2c3c7'); R(x - 1, y + 1, 3, 2, '#566c86'); R(x - d * 4 - 1, y - 2, 2, 2, '#566c86'); R(x - d * 6 - (d > 0 ? 2 : 0), y, 2, 2, (T * 30 | 0) % 2 ? '#ffd24a' : '#ff7a2a'); };
  const drawUfo = (x, y) => { R(x - 4, y - 3, 8, 3, '#73eff7'); R(x - 1, y - 2, 2, 1, '#38b764'); R(x - 9, y, 18, 2, '#94b0c2'); R(x - 11, y + 2, 22, 2, '#566c86'); R(x - 7, y + 4, 14, 1, '#333c57'); for (let i = 0; i < 4; i++) R(x - 8 + i * 5, y + 2, 2, 1, ((T * 6 | 0) + i) % 2 ? '#ff4ad6' : '#ffd24a'); };
  const drawHeli = (x, y, d) => {
    R(x - 5, y, 10, 5, '#f4f4f4'); R(x + (d > 0 ? 2 : -5), y + 1, 3, 2, '#41a6f6'); R(x - 5, y + 3, 10, 1, '#b13e53');
    R(x - d * 5 - (d > 0 ? 7 : 0), y + 1, 7, 1, '#c2c3c7'); R(x - d * 12, y - 1, 1, 3, '#c2c3c7');
    const rw = (T * 30 | 0) % 2 ? 15 : 9; R(x - rw / 2, y - 2, rw, 1, '#333c57'); R(x, y - 1, 1, 1, '#333c57'); R(x - 5, y + 6, 10, 1, '#566c86');
    if ((T * 3 | 0) % 2) R(x - 1, y + 1, 1, 1, '#ff004d');
  };
  function drawRobot(x, y, t, punch, hp) { // 오리지널 '글리치 로봇'
    const k = hp > 3 ? '#8b9bb4' : '#6b7894', g = (t * 8 | 0) % 2;
    R(x - 6, y - 40, 12, 9, k); R(x - 4, y - 37, 8, 2, (t * 4 | 0) % 2 ? '#ff004d' : '#ff77a8'); R(x - 1, y - 44, 2, 4, '#566c86'); R(x - 2, y - 46, 4, 2, '#ff004d');
    R(x - 11, y - 31, 22, 18, k); R(x - 6, y - 27, 12, 6, '#333c57'); R(x - 4, y - 25, 3, 2, '#a7f070'); R(x + 1, y - 25, 3, 2, '#ffd24a');
    R(x - 17 - punch * 10, y - 30, 7, 5, k); R(x - 19 - punch * 10, y - 31, 3, 7, '#566c86'); R(x + 11, y - 30, 5, 14, k);
    R(x - 9, y - 13, 7, 13, '#566c86'); R(x + 2, y - 13, 7, 13, '#566c86'); R(x - 10, y - 2 + g, 9, 2, '#333c57'); R(x + 1, y - 2 + (1 - g), 9, 2, '#333c57');
  }

  // 히어로: 작은 캔버스에 1배로 그린 뒤 1.5배로 붙인다(픽셀이 번지지 않게)
  const hc = document.createElement('canvas'); hc.width = hc.height = 32; const hx = hc.getContext('2d'), HS = 1.5;
  const hero = (id, x, y, d) => { const keep = c; c = hx; hx.clearRect(0, 0, 32, 32); HERO_DRAW[id](16, 16, d, T); c = keep; c.imageSmoothingEnabled = false; c.drawImage(hc, Math.round(x - 16 * HS), Math.round(y - 16 * HS), 32 * HS, 32 * HS); };

  const heroOn = () => acts.some(a => a.hero) || bigs.some(b => b.kind === 'robot');

  // ---------- 이벤트 ----------
  function heli() { const d = Math.random() < .5 ? 1 : -1; let x = d > 0 ? -20 : W + 20; const y = irnd(BT - 30, BT + 40); say(ipick(['[현장] 중계 헬기, 보도국 상공 비행 중', '[LIVE] 하늘에서 본 도심… 중계 헬기 연결', '[교통] 중계 헬기가 전하는 퇴근길 상황']));
    acts.push({ heli: 1, up(dt) { x += d * 22 * dt; return x > -30 && x < W + 30; }, draw() { drawHeli(x, y + Math.sin(T * 3) * 2, d); }, glow() { if (nightF(dayF()) > .4) { c.fillStyle = 'rgba(255,250,200,.12)'; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x - 12, G); c.lineTo(x + 12, G); c.fill(); } } });
  }
  function flyby(id) {
    id = id || ipick(Object.keys(IHEROES)); const d = Math.random() < .5 ? 1 : -1; let x = d > 0 ? -12 : W + 12, y = irnd(30, G - 60), t0 = T, sp = id === 'ninja' ? 50 : 60;
    say(`[화제] 뉴스 디펜더즈 '${IHEROES[id]}', 방송국 상공 포착`);
    acts.push({ hero: 1, up(dt) {
        x += d * sp * dt;
        if (id === 'ninja') y = G - 70 - Math.abs(Math.sin((T - t0) * 3)) * 60; else if (id === 'mecha') y -= 12 * dt; else y += Math.sin(T * 2) * .3;
        if (Math.random() < dt * 25) parts.push({ x: x - d * 4, y, vx: -d * 5, vy: 0, life: .35, col: { cap: '#ffd24a', ninja: '#f4f4f4', mecha: '#73eff7', night: '#ff4ad6' }[id], s: 1, g: 0, glow: 1 });
        return x > -20 && x < W + 20; },
      draw() { hero(id, x, y, d); } });
  }
  function battle() {
    say('[속보] 방송국 상공에 정체불명 UFO 출현… 공군 전투기 긴급 출격');
    const u = { x: W + 20, y: BT - 40, hp: 6, dead: 0, vy: 0, rot: 0 }; let t = 0, nextJet = .8, nextLaser = 1.6, joined = 0;
    const jets = [], missiles = [], beams = [];
    bigs.push({ kind: 'battle', up(dt) {
        t += dt;
        if (!u.dead) { const tx = W * .55 + Math.sin(t * .9) * 30, ty = BT - 35 + Math.sin(t * 1.7) * 12; u.x += (tx - u.x) * dt * 1.5; u.y += (ty - u.y) * dt * 1.5; }
        else { u.vy += 60 * dt; u.y += u.vy * dt; u.x += u.dx * dt; if (Math.random() < dt * 30) parts.push({ x: u.x, y: u.y, vx: irnd(-5, 5), vy: -8, life: 1.2, col: '#555566', s: 2, g: -5 });
          if (u.y >= G - 6 || (u.x > B0 - 6 && u.x < B1 && u.y > BT)) { boom(u.x, u.y, 30, 1.6); if (u.x > B0 - 6 && u.x < B1) { hit(u.x, u.y, 5); if (u.y < BT + 40) knockDisk(); } u.gone = 1; say('[속보] UFO 격추… 보도국 "피해 복구 중, 방송 이상 없음"'); } }
        if ((nextJet -= dt) < 0 && t < 11 && !u.dead) { const d = Math.random() < .5 ? 1 : -1; jets.push({ x: d > 0 ? -12 : W + 12, y: irnd(BT - 70, BT + 30), d, fired: 0 }); nextJet = irnd(1.2, 2.2); }
        jets.forEach(j => { j.x += j.d * 75 * dt; if (!j.fired && !u.dead && Math.abs(j.x - u.x) < 70 && (u.x - j.x) * j.d > 0) { j.fired = 1; missiles.push({ x: j.x, y: j.y, tx: u.x, ty: u.y }); } });
        missiles.forEach(m => { const dx = u.x - m.x, dy = u.y - m.y, L = Math.hypot(dx, dy) || 1; m.x += dx / L * 90 * dt; m.y += dy / L * 90 * dt; parts.push({ x: m.x, y: m.y, vx: 0, vy: 0, life: .5, col: '#c2c3c7', s: 1, g: -3 });
          if (L < 5 && !u.dead) { m.done = 1; boom(u.x, u.y, 10); if (--u.hp <= 0) { u.dead = 1; u.dx = (B0 + 20 - u.x) * .4; } } else if (u.dead) m.done = 1; });
        if ((nextLaser -= dt) < 0 && !u.dead) { nextLaser = irnd(.7, 1.3); const tj = jets.find(j => Math.abs(j.x - u.x) < 80); const miss = !tj || Math.random() < .55;
          const tx = miss ? irnd(B0, B1) : tj.x, ty = miss ? irnd(BT + 4, BT + 90) : tj.y; beams.push({ x: tx, y: ty, l: .18 }); if (miss) hit(tx, ty); else { boom(tx, ty, 8); jets.splice(jets.indexOf(tj), 1); } }
        beams.forEach(b => b.l -= dt);
        if (!joined && t > 4 && !heroOn() && Math.random() < .6) { joined = 1; const id = ipick(Object.keys(IHEROES)); let hx = -10, hy = u.y; say(`[화제] '${IHEROES[id]}' 참전! UFO와 공중전`);
          acts.push({ hero: 1, up(dt2) { if (u.dead || u.gone) { hx += 70 * dt2; hy -= 20 * dt2; return hx < W + 20; } hx += (u.x - hx) * dt2 * 2.5; hy += (u.y - hy) * dt2 * 2.5; if (Math.hypot(u.x - hx, u.y - hy) < 6 && Math.random() < dt2 * 3) { boom(u.x, u.y, 8); if (--u.hp <= 0) { u.dead = 1; u.dx = (B0 + 20 - u.x) * .4; } } return true; }, draw() { hero(id, hx, hy, 1); } }); }
        for (let i = jets.length - 1; i >= 0; i--) if (jets[i].x < -20 || jets[i].x > W + 20) jets.splice(i, 1);
        for (let i = missiles.length - 1; i >= 0; i--) if (missiles[i].done) missiles.splice(i, 1);
        for (let i = beams.length - 1; i >= 0; i--) if (beams[i].l <= 0) beams.splice(i, 1);
        if (t > 14 && !u.dead) { u.x += 80 * dt; u.y -= 40 * dt; if (u.y < -20) { say('[속보] UFO 퇴각… 군 "추가 출현 대비"'); return false; } }
        return !u.gone; },
      draw() { if (!u.gone) drawUfo(u.x, u.y); jets.forEach(j => drawJet(j.x, j.y, j.d)); missiles.forEach(m => R(m.x, m.y, 2, 1, '#f4f4f4')); },
      glow() { c.strokeStyle = '#a7f070'; c.lineWidth = 1; beams.forEach(b => { c.beginPath(); c.moveTo(u.x, u.y + 4); c.lineTo(b.x, b.y); c.stroke(); }); } });
  }
  function robot() {
    say('[속보] 거대 로봇, 보도국 습격! 뉴스 디펜더즈 출동');
    const r = { x: W + 30, hp: 8, t: 0, punch: 0, fall: 0 }; const ids = Object.keys(IHEROES).sort(() => Math.random() - .5).slice(0, 1); let nextPunch = 1.5, nextHit = 2.5;
    bigs.push({ kind: 'robot', up(dt) {
        r.t += dt; const tx = B1 + 22;
        if (r.hp > 0) { if (r.x > tx) r.x -= 18 * dt; else { if (!r.arr) { r.arr = 1; incidents.push({ x: r.x - 14, t: 0 }); } if ((nextPunch -= dt) < 0) { nextPunch = irnd(1.2, 2); r.punch = .3; hit(B1 - 3, irnd(G - 130, G - 30), 4); } if (r.t > 4 && (nextHit -= dt) < 0) { nextHit = irnd(.5, .9); boom(r.x + irnd(-8, 8), G - irnd(15, 40), 6); r.hp--; } } }
        else { r.fall += dt; if (r.fall < .1) { boom(r.x, G - 25, 34, 1.8); say(`[속보] '${IHEROES[ids[0]]}', 거대 로봇 제압!`); } r.x += 25 * dt; }
        r.punch = Math.max(0, r.punch - dt);
        return r.fall < 2.5; },
      draw() {
        if (r.fall < 2.5) { c.globalAlpha = Math.max(0, 1 - r.fall / 2.5); drawRobot(r.x, G + r.fall * 12, r.t, r.punch > 0 ? 1 : 0, r.hp); c.globalAlpha = 1; }
        if (r.t > 2.5 && r.hp > 0) ids.forEach((id, i) => { const a = r.t * 2.4 + i * Math.PI; hero(id, r.x + Math.cos(a) * 22, G - 30 + Math.sin(a) * 18, Math.cos(a + Math.PI / 2) > 0 ? 1 : -1); });
      } });
  }

  // ---------- 도로: 중계차와 취재진 ----------
  const FEET = () => G + 12;
  function person(x, kind, d, run) { // kind: rep(취재기자, 마이크) / cam(영상기자, 어깨 카메라)
    const y = FEET(), leg = run ? (T * 12 | 0) % 2 : 0;
    R(x - 1, y - 10, 3, 3, '#f0c090'); R(x - 1, y - 11, 3, 1, kind === 'rep' ? '#3b2a20' : '#14141f');
    R(x - 1, y - 7, 3, 5, kind === 'rep' ? '#b13e53' : '#333c57');
    R(x - 1 - leg, y - 2, 1, 2, '#2a2a3a'); R(x + 1 + leg, y - 2, 1, 2, '#2a2a3a');
    if (kind === 'rep') { R(x + d * 2, y - 7, 1, 2, '#14141f'); R(x + d * 2, y - 8, 1, 1, '#c2c3c7'); }
    else { R(x - (d > 0 ? 0 : 3), y - 11, 4, 3, '#14141f'); R(x + (d > 0 ? 4 : -4), y - 10, 1, 1, '#94b0c2'); if (!run && (T * 2 | 0) % 2) R(x - (d > 0 ? 0 : 3), y - 12, 1, 1, '#ff004d'); }
  }
  function drawVan(v) {
    const x = v.x, y = G + 11, d = v.d;
    R(x - 12, y - 11, 24, 8, '#f4f4f4'); R(x + (d > 0 ? 6 : -12), y - 11, 6, 4, '#41a6f6'); R(x - 12, y - 6, 24, 2, '#2a6fdb'); R(x - 9, y - 10, 5, 2, '#b13e53');
    R(x - 9, y - 3, 4, 3, '#14141f'); R(x + 5, y - 3, 4, 3, '#14141f');
    R(x - 4, y - 11 - v.mast, 1, v.mast, '#94b0c2'); R(x - 7, y - 13 - v.mast, 7, 2, '#e8eef2'); if (v.mast > 4) R(x - 5, y - 15 - v.mast, 3, 2, '#e8eef2');
    if ((T * 3 | 0) % 2) R(x + (d > 0 ? -12 : 11), y - 12, 1, 1, '#ff004d');
  }
  const REPORTERS = ['김민준', '이서연', '박지호', '최유나', '정우진', '한소희'];
  function dispatch(inc) {
    const d = inc.x > W / 2 ? 1 : -1, tx = Math.max(16, Math.min(W - 16, inc.x));
    vans.push({ x: d > 0 ? -16 : W + 16, d, tx, st: 'drive', mast: 0, t: 0, spot: Math.max(6, Math.min(W - 6, inc.x)), crew: [] });
    say(ipick(['[현장] 중계차 긴급 출동… 사고 현장으로 이동 중', '[현장] 취재진 현장 급파… 잠시 후 연결합니다', '[속보] 중계차 현장 도착 예정… 영상기자 동행']));
  }
  function road(dt) {
    incidents.forEach(i => i.t += dt); incidents = incidents.filter(i => i.t < 12);
    const inc = incidents.find(i => !vans.some(v => Math.abs(v.spot - i.x) < 30));
    if (inc && vans.length < 2) { dispatch(inc); incidents = incidents.filter(i => Math.abs(i.x - inc.x) >= 30); }
    else if (!vans.length && Math.random() < dt * .08) dispatch({ x: irnd(20, W - 20) });
    vans.forEach(v => {
      if (v.st === 'drive') { v.x += v.d * 50 * dt; if ((v.tx - v.x) * v.d <= 0) { v.x = v.tx; v.st = 'park'; v.crew = [{ k: 'rep', x: v.x, tx: v.spot, d: v.d }, { k: 'cam', x: v.x, tx: Math.max(4, Math.min(W - 4, v.spot - v.d * 12)), d: v.d }]; } }
      else if (v.st === 'park' || v.st === 'back') {
        v.mast = Math.max(0, Math.min(14, v.mast + (v.st === 'park' ? 20 : -20) * dt)); let all = true;
        v.crew.forEach(p => { const dx = (v.st === 'park' ? p.tx : v.x) - p.x; if (Math.abs(dx) > .8) { all = false; p.d = Math.sign(dx); p.x += p.d * 30 * dt; p.run = 1; } else p.run = 0; });
        if (all && v.st === 'park') { v.st = 'film'; v.t = irnd(5, 8); v.crew[0].d = -v.d; v.crew[1].d = v.d; say(`[LIVE] 현장 연결합니다. ${ipick(REPORTERS)} 기자!`); }
        if (all && v.st === 'back' && v.mast <= 0) { v.st = 'leave'; v.crew = []; }
      }
      else if (v.st === 'film') { if ((v.t -= dt) <= 0) v.st = 'back'; }
      else v.x += v.d * 50 * dt;
    });
    vans = vans.filter(v => v.x > -30 && v.x < W + 30);
    if ((nextCar -= dt) <= 0) { nextCar = irnd(1.5, 4); const d = Math.random() < .5 ? 1 : -1; cars.push({ x: d > 0 ? -10 : W + 10, d, k: ipick(['#e43b44', '#feae34', '#2ce8f5', '#c2c3c7', '#3e8948']), sp: irnd(40, 65) }); }
    cars.forEach(k => k.x += k.d * k.sp * dt); cars = cars.filter(k => k.x > -20 && k.x < W + 20);
  }
  function drawRoad() {
    cars.forEach(k => { R(k.x - 7, G + 2, 14, 3, k.k); R(k.x - 4, G, 8, 2, k.k); R(k.x - 3, G, 6, 1, '#94b0c2'); R(k.x - 5, G + 5, 2, 1, '#14141f'); R(k.x + 3, G + 5, 2, 1, '#14141f'); });
    vans.forEach(v => { drawVan(v); v.crew.forEach(p => person(p.x, p.k, p.d, p.run)); });
  }

  // ---------- 그리기 ----------
  function drawSky(f, s) {
    let [top, bot] = skyAt(f); if (s === 3) { top = imixc(top, '#c9d3e3', .25 * (1 - nightF(f))); bot = imixc(bot, '#e6ecf5', .25 * (1 - nightF(f))); } if (rainy) { top = imixc(top, '#4a5266', .55); bot = imixc(bot, '#6b7385', .55); }
    for (let y = 0; y < G; y += 4) R(0, y, W, 4, imixc(top, bot, y / G));
    const nf = nightF(f);
    if (nf > 0) for (let i = 0; i < 40; i++) { const x = (i * 53) % W, y = (i * 29) % (BT); if ((i + (T * 2 | 0)) % 9) { c.globalAlpha = nf * .8; R(x, y, 1, 1, '#ffffff'); c.globalAlpha = 1; } }
    const arc = (g, k, r) => { if (g < 0 || g > 1) return; const x = 10 + g * (W - 20), y = G - 30 - Math.sin(Math.PI * g) * (G - 70); circ(x, y, r, k); };
    if (!rainy) { arc((f - .24) / .52, f < .32 || f > .68 ? '#ffb05a' : '#fff2b0', 5); arc(((f + .5) % 1 - .24) / .52, '#e8eef5', 4); }
    clouds.forEach(cl => { const k = rainy ? '#7b8396' : '#ffffff'; c.globalAlpha = rainy ? .9 : .75; R(cl.x, cl.y, cl.w, 4, k); R(cl.x + 4, cl.y - 3, cl.w - 10, 3, k); c.globalAlpha = 1; });
    city.forEach(b => R(b.x, G - b.h, 7, b.h, '#5b6e8c'));
  }
  function drawBuilding(s) {
    const H2 = G - BT, snow = s === 3;
    // 왼쪽 저층 빌딩, 오른쪽 아파트
    R(4, G - 70, 34, 70, '#6f8fa6'); for (let y = G - 66; y < G; y += 5) R(6, y, 30, 1, '#557590');
    [[W - 54, 62], [W - 28, 84]].forEach(([x, h]) => { R(x, G - h, 26, h, '#e9e4dc'); R(x + 24, G - h, 2, h, '#c9c1b5'); R(x + 4, G - h - 6, 8, 6, '#d6d0c6'); R(x + 14, G - h - 4, 6, 4, '#d6d0c6'); for (let y = G - h + 6; y < G - 4; y += 6) for (let i = 0; i < 4; i++) R(x + 3 + i * 6, y, 4, 3, '#a9b8c4'); if (snow) R(x, G - h - 1, 26, 2, '#ffffff'); });
    // 본관: 왼쪽 측면 + 정면 유리 + 흰 프레임
    R(B0 - 8, BT + 6, 8, H2 - 6, '#2d4a5a'); for (let y = BT + 8; y < G; y += 5) R(B0 - 8, y, 8, 1, '#22394a');
    for (let y = BT + 10; y < G; y++) R(B0, y, B1 - B0, 1, imixc('#7cc4d4', '#3f8ea3', (y - BT) / H2));
    for (let y = BT + 12; y < G; y += 5) R(B0 + 3, y, B1 - B0 - 6, 1, '#2f6f82');
    for (let x = B0 + 4; x < B1 - 4; x += 6) R(x, BT + 10, 1, H2 - 10, '#9fd8e2');
    R(B0, BT + 6, 3, H2 - 6, '#e8eef2'); R(B1 - 3, BT + 6, 3, H2 - 6, '#e8eef2'); R(B1, BT + 10, 5, H2 - 10, '#c9d1d8');
    for (let y = BT + 12; y < G; y += 5) R(B1, y, 5, 1, '#e8eef2');
    const mid = BT + Math.round(H2 * .52); R(B0 - 2, mid, B1 - B0 + 6, 3, '#e8eef2'); R(B0 + 16, mid + 3, 22, 2, '#c9d1d8');
    // 옥상 크라운 + 방송국 엠블럼
    R(B0 - 1, BT, B1 - B0 + 2, 10, '#b7c7d3'); for (let x = B0 + 1; x < B1; x += 3) R(x, BT + 1, 1, 8, '#8ea4b4'); R(B0 - 1, BT - 1, B1 - B0 + 2, 1, '#e8eef2');
    circ(B0 + 17, BT + 5, 3, '#f4f4f4'); circ(B0 + 17, BT + 5, 2, '#2a6fdb');
    c.fillStyle = '#ffffff'; c.font = '6px "Press Start 2P",monospace'; c.fillText(nameTxt.slice(0, 4), B0 + 22, BT + 8);
    // 첨탑
    const sx = B1 - 14; [[6, 8], [4, 10], [3, 10], [2, 8], [1, 8]].reduce((y, [w, h], i) => { R(sx - w / 2, y - h, w, h, i % 2 ? '#c2c3c7' : '#e8eef2'); return y - h; }, BT);
    // 원형 구조물(왼쪽 위)
    if (!disk.gone) { circ(B0 - 1, BT + 1, 11, '#e8eef2'); circ(B0 - 1, BT + 1, 9, '#5f8fa3'); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + T * .2; R(B0 - 1 + Math.cos(a) * 6, BT + 1 + Math.sin(a) * 6, 1, 1, '#c9d1d8'); } circ(B0 - 1, BT + 1, 2, '#e8eef2'); }
    else if (disk.t < 3) { c.strokeStyle = '#ffd24a'; c.strokeRect(B0 - 12.5, BT - 10.5, 22, 22); for (let i = -10; i < 12; i += 4) R(B0 - 12 + i + 10, BT - 10, 1, 22, '#94b0c2'); }
    if (snow) { R(B0 - 2, BT - 2, B1 - B0 + 4, 2, '#ffffff'); R(B0 - 9, BT + 5, 9, 1, '#ffffff'); R(B0 - 2, mid - 1, B1 - B0 + 6, 1, '#ffffff'); }
    // 피격 구멍
    holes.forEach(h => { if (h.age < h.life) { circ(h.x, h.y, h.r, '#1a1414'); circ(h.x, h.y, Math.max(1, h.r - 2), '#0c0a0a'); } else { for (let i = -h.r - 1; i <= h.r + 1; i += 2) R(h.x + i, h.y - h.r - 1, 1, h.r * 2 + 3, '#c2a35a'); R(h.x - h.r - 1, h.y, h.r * 2 + 3, 1, '#c2a35a'); } });
  }
  function drawFront(s) {
    const pal = [['#ffb7d5', '#f78fb3', '#7bc96f'], ['#2f9e44', '#38b764', '#5fbf5a'], ['#ef7d57', '#ffcd75', '#b9a26a'], ['#6b4f3a', '#8b6a50', '#e8eef5']][s];
    R(0, G, W, H - G, pal[2]);
    R(0, G, W, 14, '#4a4f5c'); R(0, G, W, 1, '#9aa0a8'); for (let x = 2; x < W; x += 12) R(x, G + 6, 6, 1, '#e8e8e8'); R(0, G + 13, W, 2, '#b8b2a6');
    if (s === 3) { R(0, G + 1, W, 1, '#ffffff'); R(0, G + 12, W, 1, '#ffffff'); }
    for (let i = 0; i < 12; i++) { const x = i * 16 - 4 + (i % 2) * 5, y = G + 26 + (i % 3) * 6, r = 8 + (i % 3);
      R(x + r - 1, y, 2, 14, '#5a3a20');
      if (s === 3) { R(x + r - 6, y - 2, 12, 1, '#6b4f3a'); R(x + r - 4, y - 6, 8, 1, '#6b4f3a'); R(x + r - 6, y - 3, 12, 1, '#ffffff'); R(x + r - 4, y - 7, 8, 1, '#ffffff'); }
      else { circ(x + r, y, r, pal[0]); circ(x + r - 2, y - 2, r - 4, pal[1]); }
    }
  }
  function drawWeather(s, f, dt) {
    if (s === 1 && rainy) { c.fillStyle = 'rgba(200,220,255,.5)'; for (let i = 0; i < 60; i++) { const x = (i * 37 + T * 140) % (W + 20) - 10, y = (i * 71 + T * 260) % H; c.fillRect(x, y, 1, 4); } if (Math.random() < dt * .4) { flash = .5; say('[날씨] 수도권 장맛비… 천둥·번개 주의'); } }
    if (s === 0 && Math.random() < dt * 8) parts.push({ x: irnd(0, W), y: -2, vx: irnd(4, 12), vy: irnd(8, 14), life: 9, col: ipick(['#ffb7d5', '#ffffff']), s: 1, g: 0, sway: 1 });
    if (s === 2 && Math.random() < dt * 6) parts.push({ x: irnd(0, W), y: -2, vx: irnd(-4, 8), vy: irnd(10, 16), life: 9, col: ipick(['#ef7d57', '#ffcd75', '#d9480f']), s: 2, g: 0, sway: 1 });
    if (s === 3 && Math.random() < dt * 22) parts.push({ x: irnd(0, W), y: -2, vx: irnd(-3, 3), vy: irnd(8, 14), life: 12, col: '#ffffff', s: ipick([1, 1, 2]), g: 0, sway: 1 });
  }

  // ---------- 메인 루프 ----------
  function frame(now) {
    if (!on) return; raf = requestAnimationFrame(frame); try { step(now); } catch (e) { console.error(e); }
  }
  function step(now) {
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; T += dt;
    const f = dayF(), s = season(), nf = nightF(f), sf = sunsetF(f);
    if ((tickT -= dt) <= 0 && tq.length) { show(tq.shift()); tickT = 7; }
    if (s !== lastSeason) { if (lastSeason >= 0) say(['[날씨] 벚꽃 만개… 보도국 앞 꽃길', '[날씨] 본격 무더위와 장마 시작', '[날씨] 단풍 절정… 가을 나들이 행렬', '[날씨] 첫눈 소식… 출근길 빙판 주의'][s]); lastSeason = s; }
    rainy = s === 1 && Math.floor(T / IDAY) % 2 === 0;
    clouds.forEach(cl => { cl.x += cl.s * (rainy ? 1.6 : 1) * dt; if (cl.x > W + 10) { cl.x = -cl.w - 10; cl.y = irnd(15, BT - 10); } });
    if (Math.random() < dt * .6) { const w = ipick(wins); w.on = !w.on; } if (Math.random() < dt * .4) { const a = ipick(apts); a.on = !a.on; }
    holes.forEach(h => h.age += dt); for (let i = holes.length - 1; i >= 0; i--) if (holes[i].age > holes[i].life + 3) { holes.splice(i, 1); if (!holes.length) say('[복구] 보도국 건물 복구 완료… "방송은 계속됩니다"'); }
    if (disk.gone && (disk.t -= dt) <= 0) disk.gone = 0;
    if ((next -= dt) <= 0) { // 랜덤 이벤트가 끝없이 겹쳐서 이어진다
      // 같은 종류는 한 번에 하나: 큰 사건(UFO·로봇) 1개, 히어로 1명, 헬기 1대
      next = irnd(3.5, 6.5); const opts = [];
      if (!bigs.length) { opts.push('battle'); if (!heroOn()) opts.push('robot'); }
      if (!heroOn()) opts.push('flyby', 'flyby');
      if (!acts.some(a => a.heli)) opts.push('heli');
      if (opts.length) ({ battle, robot, flyby: () => flyby(), heli })[ipick(opts)](); }
    acts = acts.filter(a => a.up(dt)); bigs = bigs.filter(b => b.up(dt)); road(dt);
    parts.forEach(p => { p.vy += p.g * dt; p.x += (p.vx + (p.sway ? Math.sin(T * 3 + p.y * .1) * 6 : 0)) * dt; p.y += p.vy * dt; p.life -= dt; if (p.ground && p.y > G + 6) { p.y = G + 6; p.vx = 0; p.vy = 0; } }); parts = parts.filter(p => p.life > 0 && p.y < H + 4);
    holes.forEach(h => { if (h.age < h.life * .7 && Math.random() < dt * 8) { parts.push({ x: h.x + irnd(-1, 1), y: h.y - 1, vx: irnd(-3, 3), vy: -12, life: 1.6, col: ipick(['#555566', '#3a3a48']), s: 2, g: -2 }); parts.push({ x: h.x + irnd(-2, 2), y: h.y, vx: 0, vy: -8, life: .3, col: ipick(['#ffd24a', '#ff7a2a']), s: 1, g: 0, glow: 1 }); } });
    // 낮 색으로 그린 뒤 밤/노을 색을 덮고, 빛나는 것은 그 위에 그린다
    drawSky(f, s); drawBuilding(s); drawFront(s);
    const tint = () => { if (nf > 0) { c.fillStyle = `rgba(8,10,40,${.55 * nf})`; c.fillRect(0, 0, W, H); } if (sf > 0) { c.fillStyle = `rgba(255,110,50,${.2 * sf})`; c.fillRect(0, 0, W, H); } };
    tint(); // 배경에 밤/노을 색
    if (nf > .3) { c.globalAlpha = Math.min(1, (nf - .3) * 2); wins.forEach(w => { if (w.on) R(w.x, w.y, 4, 3, '#ffd68a'); }); apts.forEach(a => { if (a.on) R(a.x, a.y, 4, 3, '#ffe9a8'); }); c.globalAlpha = 1; }
    if ((T * 1.5 | 0) % 2) R(B1 - 14, BT - 45, 1, 1, '#ff004d');
    holes.forEach(h => { if (h.age < h.life * .7) { R(h.x - 1, h.y - 2 - (T * 10 | 0) % 2, 3, 2, '#ff7a2a'); R(h.x, h.y - 3, 1, 1, '#ffd24a'); } });
    // 움직이는 것들은 창문 '앞'에 별도 레이어로 그리고, 그 레이어에만 같은 밤 색을 입힌다
    c = lc; c.clearRect(0, 0, W, H);
    drawRoad(); acts.forEach(a => a.draw()); bigs.forEach(b => b.draw());
    parts.forEach(p => { if (!p.glow) R(p.x, p.y, p.s, p.s, p.col); });
    c.globalCompositeOperation = 'source-atop'; tint(); c.globalCompositeOperation = 'source-over';
    c = mc; c.drawImage(lay, 0, 0);
    acts.forEach(a => a.glow && a.glow()); bigs.forEach(b => b.glow && b.glow());
    if (nf > .4) { cars.forEach(k => R(k.x + (k.d > 0 ? 6 : -8), G + 3, 2, 1, '#fff2b0')); vans.forEach(v => R(v.x + (v.d > 0 ? 11 : -13), G + 7, 2, 1, '#fff2b0')); }
    parts.forEach(p => { if (p.glow) R(p.x, p.y, p.s, p.s, p.col); });
    drawWeather(s, f, dt);
    if (flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(.6, flash)})`; c.fillRect(0, 0, W, H); flash -= dt * 2; }
    if (clockEl) { const hr = (f * 24 + 0) % 24; clockEl.textContent = `${ISEASONS[s]} · ${String(hr | 0).padStart(2, '0')}:${String((hr % 1) * 60 | 0).padStart(2, '0')}${rainy ? ' · 비' : ''}`; }
  }
  addEventListener('resize', () => { if (on) resize(); });
  return {
    start() { if (on) return; on = true; last = 0; resize(); tq = []; tickT = 0; say('[LIVE] 오늘도 보도국은 쉬지 않습니다'); raf = requestAnimationFrame(frame); },
    stop() { on = false; cancelAnimationFrame(raf); },
  };
}
