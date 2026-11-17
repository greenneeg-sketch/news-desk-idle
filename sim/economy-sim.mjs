// 경제 시뮬레이터: 실제 리듀서·경제 함수를 그대로 돌리는 자동 플레이 봇.
// 사용: node sim/economy-sim.mjs [casual|engaged|light] [일수=30] [시드=1]
// 출력: 진행 요약(JSON) — 시간대별 진행, 마일스톤 도달 시각, 막히는 구간
import { reducer, initialState } from '../js/state/reducer.js';
import { UPGRADES, MANAGER, CHIEF, RESEARCH, RANKS, BRANCHES, DECOS, BAL, PRESTIGE, jobOf } from '../js/data/config.js';
import { rates, scoreMul, perSec, prestigeGain, rank, rl, bulk } from '../js/systems/economy.js';
import { pickEvent } from '../js/systems/events.js';
import { scoutCost } from '../js/systems/cards.js';
import { UNLOCKS } from '../js/data/tips.js';

// 밸런스 실험: OVR='{"BAL.gAdd":0.2,"PRESTIGE.per":0.03}' node sim/economy-sim.mjs ... 처럼 수치를 바꿔 돌려 본다
for (const [k, v] of Object.entries(JSON.parse(process.env.OVR || '{}'))) { const [o, f] = k.split('.'); ({ BAL, PRESTIGE })[o][f] = v; }
const profile = process.argv[2] || 'casual', DAYS = +process.argv[3] || 30;
let seed = +process.argv[4] || 1; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
// 하루 접속 계획: [시작 시각(시), 플레이 분]
const PLAN = {
  light: [[19, 3]],
  casual: [[8, 4], [12.5, 4], [19, 6], [22.5, 3]],
  engaged: [[7.5, 6], [10, 5], [12.5, 6], [15, 5], [17.5, 6], [19.5, 10], [22, 8]],
}[profile];
let s = reducer(initialState(), { type: 'NAME', name: 'sim', uid: 'sim', job: 'editor' });
const dis = a => { s = reducer(s, a); };
let realH = 0, activeMin = 0, lastPrestigeActive = 0, prestiges = 0, lastEvAt = 0;
const miles = {}, log = [], mark = (k, v = { realH, activeMin: +activeMin.toFixed(1), day: +(realH / 24).toFixed(1) }) => { if (!(k in miles)) miles[k] = v; };
const lvSum = () => Object.values(s.lv).reduce((a, b) => a + b, 0);

function think() { // 플레이어가 한 번 화면을 보고 하는 행동들
  if (s.unl && s.unl.meet && s.meet && s.meet.day === s.day && !s.meet.pick && s.meet.opts && s.meet.opts.length) dis({ type: 'MEET', id: s.meet.opts[0] });
  if (s.gold && rnd() < .9) dis({ type: 'GOLD', r: rnd() });
  if (s.ev && s.ev.dil && !s.ev.pick) dis({ type: 'JUDGE', pick: rnd() < .5 ? 'risk' : 'safe', r: rnd() });
  if (s.ev && !s.ev.boost && rnd() < .8) dis({ type: 'BOOST' });
  if (s.clock >= s.spdReady && (s.unl || {}).spd) dis({ type: 'SPD' }); // 광고 보고 2분 2배(웹 기준 즉시)
  const U = id => !!(s.unl && s.unl[id]); // 아직 열리지 않은 기능은 쓰지 못한다
  if (U('mg')) for (let i = 0; i < 5; i++) if (!s.mg[i] && s.score >= MANAGER[i] * 1.2) dis({ type: 'HIRE', i });
  if (U('chief') && !s.chief && s.score >= CHIEF * 1.2) dis({ type: 'CHIEF' });
  // 구매: 업그레이드·지국·꾸미기 중 '생산 증가 ÷ 비용'이 가장 좋은 것을 계속 산다
  const cands = [...UPGRADES.filter(u => (u.id !== 'qual' && u.id !== 'live') || U('hq')).map(u => ({ type: 'BUY', id: u.id, n: '1' })), ...(U('br') ? BRANCHES.map(b => ({ type: 'BRUP', id: b.id })) : []), ...(U('deco') ? DECOS.map(d => ({ type: 'DECO', id: d.id })) : [])];
  for (let guard = 0; guard < 80; guard++) {
    const base = perSec(s); let best = null;
    for (const a of cands) {
      const t = reducer(s, a); if (t === s) continue; const cost = s.score - t.score;
      const gain = (perSec(t) - base) / Math.max(1, cost); if (!best || gain > best.gain) best = { a, gain };
    }
    if (!best) break; dis(best.a);
  }
  if ((s.unl || {}).scout) { // 스카우트: 티켓은 바로, 점수는 업그레이드를 방해하지 않을 만큼 모였을 때만
    while (s.tickets > 0) dis({ type: 'SCOUT', how: 'ticket', r: rnd(), r2: rnd() });
    if (s.score >= scoutCost(s) * 4) dis({ type: 'SCOUT', how: 'paid', r: rnd(), r2: rnd() });
    if (s.clock >= s.freeReady) dis({ type: 'SCOUT', how: 'ad', r: rnd(), r2: rnd() }); // 광고 무료 스카우트(10분마다)
  }
  if (U('res')) for (const r of RESEARCH) dis({ type: 'RESEARCH', id: r.id });
  const g = prestigeGain(s); // 환생: 얻는 점수가 지금 가진 것의 절반 이상이고 지난 환생 뒤 30분 이상 플레이했을 때
  if (U('pres') && g >= Math.max(2, s.pts * .5) && activeMin - lastPrestigeActive >= 30) { dis({ type: 'PRESTIGE' }); prestiges++; lastPrestigeActive = activeMin; mark('prestige' + prestiges); }
}
function tickSecs(sec) { // 접속 중 sec초를 0.5초 단위로 진행
  for (let t = 0; t < sec; t += .5) {
    if (!s.ev && s.clock >= s.nextEv && s.chal !== 'calm') { const ev = pickEvent(s, rnd(), rnd()); ev.dil = !!(s.unl && s.unl.dil) && rnd() < .45; dis({ type: 'SPAWN', ev }); }
    dis({ type: 'TICK', dt: .5, rnd: rnd(), r2: rnd(), r3: rnd() }); activeMin += .5 / 60;
    if (((t * 2) | 0) % 6 === 0) think(); // 3초마다 화면을 본다
  }
}
function checkMarks() {
  UNLOCKS.forEach(u => { if ((s.unl || {})[u.id]) mark('unlock:' + u.id); });
  RANKS.forEach((r, i) => { if (rank(s) >= i && i > 0) mark('rank:' + r.n); });
  [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e14, 1e16].forEach(n => { if (s.total >= n) mark('total:1e' + Math.log10(n)); });
  if (s.pulls >= 1) mark('first_scout'); if (Object.keys(s.cards).length >= 10) mark('cards10'); if (Object.keys(s.cards).length >= 20) mark('cards20');
  if (s.chief) mark('chief'); if (lvSum() >= 100) mark('lv100'); if (lvSum() >= 400) mark('lv400');
}
// 오프라인: 앱을 닫아 둔 시간만큼(최대 8시간+연구) 절반 효율로 번다(storage.js와 같은 식)
function offline(hours) {
  const nt = rl(s, 'night'), sec = Math.min(hours * 3600, 28800 + 3600 * nt), jo = jobOf(s).off || 0;
  const n = Math.floor(Math.min(...rates(s)) * 10 * scoreMul(s) * sec * (.5 + .1 * nt + jo)); if (n >= 10) dis({ type: 'GAIN', n });
}
const flat = []; PLAN.forEach(([h, m], i) => flat.push({ h, m }));
const rows = [];
for (let d = 0; d < DAYS; d++) {
  dis({ type: 'CHECKIN', day: new Date(Date.UTC(2026, 10, 17 + d)).toISOString().slice(0, 10) });
  flat.forEach(({ h, m }, i) => {
    const t0 = d * 24 + h, gap = t0 - realH; if (gap > 0) { offline(gap); realH = t0; }
    tickSecs(m * 60); realH += m / 60; checkMarks();
    if (i === flat.length - 1) rows.push({ day: d + 1, activeMin: +activeMin.toFixed(0), total: s.total, perSec: perSec(s), pts: s.pts, prestiges, rank: rank(s), lv: lvSum(), cards: Object.keys(s.cards).length, tickets: s.tickets, score: s.score, gameDay: s.day });
  });
  const next = (d + 1) * 24 + flat[0].h, gap = next - realH; if (gap > 0) { offline(gap); realH = next; }
}
const fmt = n => n >= 1e4 ? n.toExponential(2) : String(Math.round(n));
console.log(JSON.stringify({ profile, days: DAYS, rows: rows.map(r => ({ ...r, total: fmt(r.total), perSec: fmt(r.perSec), score: fmt(r.score)})), miles }, null, 1));
