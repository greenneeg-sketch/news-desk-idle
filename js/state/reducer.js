import { UPGRADES, MANAGER, CHIEF, ACHIEVEMENTS, DAY_SEC, WEEKLY, CHALLENGES } from '../data/config.js';
import { tierOf } from '../systems/season.js';
import { rates, scoreMul, bulk, prestigeGain, goldReward, perSec } from '../systems/economy.js';
import { evaluateDay } from '../systems/ratings.js';
import { rollCard, scoutCost } from '../systems/cards.js';
export const initialState = () => ({
  score: 0, run: 0, pts: 0, clock: 0, nextEv: 15, ev: null, q: [0, 0, 0, 0, 0], buyN: '1', mg: [0, 0, 0, 0, 0], chief: 0,
  ach: [], evCount: 0, goldCount: 0, gold: null, nextGold: 60, gbEnd: 0, spdEnd: 0, spdReady: 0,
  name: '', uid: '', total: 0, maxLv: 0, bestRating: 0, views: 0, day: 1, dayT: 0, dOut: 0, dEv: 0, hist: [], lastRating: 0, prevRating: 0, lastViews: 0, report: null,
  cards: {}, pulls: 0, pity: 0, tickets: 0, freeReady: 0, last: null, login: { last: '', streak: 0 }, week: { key: '', prog: {}, done: {} }, daily: null,
  chal: null, chalDone: {}, chalWin: null, season: { key: '', base: 0 }, lastSeason: null, tut: 0,
  lv: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
});
const KEEP = ['name', 'uid', 'total', 'maxLv', 'bestRating', 'views', 'day', 'hist', 'lastRating', 'prevRating', 'lastViews', 'ach', 'evCount', 'goldCount', 'buyN', 'cards', 'pulls', 'pity', 'tickets', 'login', 'week', 'chalDone', 'season', 'lastSeason', 'tut'];
const keep = st => ({ ...initialState(), ...Object.fromEntries(KEEP.map(k => [k, st[k]])) });
const bump = (w, k, n = 1) => ({ ...w, prog: { ...w.prog, [k]: (w.prog[k] || 0) + n } });
const dn = d => Math.floor(Date.parse(d + 'T00:00:00Z') / 864e5);
const earn = (st, n) => ({ ...st, score: st.score + n, run: st.run + n, total: st.total + n });
// 파이프라인 시스템: 대기열을 단계별로 흘려보낸다
function flow(s, dt) {
  const r = rates(s), m = scoreMul(s);
  if (s.q[1] + s.q[2] + s.q[3] + s.q[4] < 80) s.q[1] += r[0] * dt;
  for (let i = 1; i < 5; i++) {
    const mv = Math.min(s.q[i], r[i] * dt); s.q[i] -= mv;
    if (i < 4) s.q[i + 1] += mv; else { s.dOut += mv; const g = mv * 10 * m; s.score += g; s.run += g; s.total += g; }
  }
}
export function reducer(st, a) {
  switch (a.type) {
    case 'TICK': {
      const s = { ...st, q: [...st.q], clock: st.clock + a.dt };
      if (s.ev && s.clock >= s.ev.end) { s.ev = null; s.nextEv = s.clock + 25 + a.rnd * 20; }
      if (s.gold && s.clock >= s.gold.end) { s.gold = null; s.nextGold = s.clock + 60 + a.rnd * 60; }
      else if (!s.gold && s.chal !== 'calm' && s.clock >= s.nextGold) s.gold = { end: s.clock + 12, x: Math.round(8 + a.rnd * 70), y: Math.round(22 + a.r2 * 50) };
      flow(s, a.dt);
      s.dayT += a.dt;
      if (s.dayT >= DAY_SEC) { // 8시 뉴스 시청률 평가
        const e = evaluateDay(s, a.rnd, a.r2);
        s.prevRating = s.lastRating; s.lastRating = e.rating; s.bestRating = Math.max(s.bestRating, e.rating); s.views += e.views; s.lastViews = e.views;
        s.hist = [...s.hist, e.rating].slice(-7); s.score += e.bonus; s.run += e.bonus; s.total += e.bonus;
        if (e.rating >= 6) s.week = bump(s.week, 'rate');
        s.report = { day: s.day, ...e }; s.day += 1; s.dayT -= DAY_SEC; s.dOut = 0; s.dEv = 0;
      }
      const hit = ACHIEVEMENTS.filter(x => !s.ach.includes(x.id) && x.t(s)); if (hit.length) s.ach = [...s.ach, ...hit.map(x => x.id)];
      if (s.chal) { const c = CHALLENGES.find(x => x.id === s.chal); if (c && s.run >= c.goal) { s.chalDone = { ...s.chalDone, [c.id]: 1 }; s.chalWin = c.id + ':' + s.clock; s.chal = null; } }
      return s;
    }
    case 'NAME': return { ...st, name: a.name, uid: st.uid || a.uid };
    case 'SPAWN': return { ...st, evCount: st.evCount + 1, dEv: st.dEv + 1, week: bump(st.week, 'ev'), ev: { ...a.ev, end: st.clock + a.ev.dur, boost: !!st.chief } };
    case 'BOOST': return st.ev ? { ...st, ev: { ...st.ev, boost: true } } : st;
    case 'GOLD': {
      if (!st.gold) return st; const g = goldReward(st, a.r), n = g.cash || 0;
      return { ...earn(st, n), gold: null, nextGold: st.clock + 60 + a.r * 60, goldCount: st.goldCount + 1, week: bump(st.week, 'gold'), gbEnd: g.frenzy ? st.clock + 20 : st.gbEnd };
    }
    case 'SPD': return st.clock < st.spdReady ? st : { ...st, spdEnd: st.clock + 120, spdReady: st.clock + 300 };
    case 'BUY': {
      if (st.chal === 'noQual' && a.id === 'qual') return st;
      const u = UPGRADES.find(x => x.id === a.id), { k, total } = bulk(st, u, a.n || '1'), nl = st.lv[u.id] + k;
      return st.score < total ? st : { ...st, score: st.score - total, maxLv: Math.max(st.maxLv, nl), week: bump(st.week, 'buy', k), lv: { ...st.lv, [u.id]: nl } };
    }
    case 'HIRE': return st.chal === 'noMgr' || st.mg[a.i] || st.score < MANAGER[a.i] ? st : { ...st, score: st.score - MANAGER[a.i], mg: st.mg.map((v, j) => j === a.i ? 1 : v) };
    case 'CHIEF': return st.chal === 'noMgr' || st.chief || st.score < CHIEF ? st : { ...st, score: st.score - CHIEF, chief: 1 };
    case 'SCOUT': { // how: paid(점수) / ticket(티켓) / ad(광고 무료)
      let s = { ...st };
      if (a.how === 'paid') { const c = scoutCost(st.pulls); if (st.score < c) return st; s.score -= c; }
      else if (a.how === 'ticket') { if (st.tickets < 1) return st; s.tickets -= 1; }
      else { if (st.clock < st.freeReady) return st; s.freeReady = st.clock + 600; }
      const card = rollCard(a.r, a.r2, st.pity);
      s.pulls = st.pulls + 1; s.week = bump(st.week, 'pull');
      if (!card) { // 꽝: 점수로 뽑았다면 비용의 20%를 위로금으로 돌려준다
        const back = a.how === 'paid' ? Math.floor(scoutCost(st.pulls) * .2) : 0;
        s.pity = st.pity + 1; s.last = { id: null, miss: true, back }; return back ? earn(s, back) : s;
      }
      const had = st.cards[card.id] || 0;
      s.cards = { ...st.cards, [card.id]: Math.min(3, had + 1) }; s.pity = card.rar >= 2 ? 0 : st.pity + 1;
      s.last = { id: card.id, isNew: !had, maxed: had >= 3 };
      return had >= 3 ? earn(s, 500) : s;
    }
    case 'CLAIM': { // 주간 목표 보상
      const g = WEEKLY.find(x => x.id === a.id); if (!g || st.week.done[g.id] || (st.week.prog[g.k] || 0) < g.goal) return st;
      return { ...earn(st, Math.max(2000, Math.floor(perSec(st) * 1800))), tickets: st.tickets + 1, week: { ...st.week, done: { ...st.week.done, [g.id]: 1 } } };
    }
    case 'WEEK': return st.week.key === a.key ? st : { ...st, week: { key: a.key, prog: {}, done: {} } };
    case 'CHECKIN': { // 일일 출석: 연속일수 x 보너스, 7일마다 티켓
      if (st.login.last === a.day) return st;
      const streak = st.login.last && dn(a.day) - dn(st.login.last) === 1 ? st.login.streak + 1 : 1;
      const gain = Math.max(500, Math.floor(perSec(st) * 900)) * Math.min(streak, 7), tk = streak % 7 === 0 ? 1 : 0;
      return { ...earn(st, gain), tickets: st.tickets + tk, login: { last: a.day, streak }, daily: { streak, gain, tk } };
    }
    case 'TUT': return { ...st, tut: a.step };
    case 'SETN': return { ...st, buyN: a.n };
    case 'GAIN': return earn(st, a.n);
    case 'PRESTIGE': return { ...keep(st), pts: st.pts + prestigeGain(st) };
    case 'CHAL': return st.chalDone[a.id] || !CHALLENGES.some(c => c.id === a.id) ? st : { ...keep(st), pts: st.pts, chal: a.id };
    case 'CHAL_QUIT': return st.chal ? { ...keep(st), pts: st.pts } : st;
    case 'SEASON': { // 새 달이 되면 지난 시즌 등급만큼 티켓 지급 후 새 시즌 시작
      if (st.season.key === a.key) return st;
      if (!st.season.key) return { ...st, season: { key: a.key, base: st.total } };
      const p = Math.max(0, st.total - st.season.base), t = tierOf(p);
      return { ...st, tickets: st.tickets + t + 1, lastSeason: { key: st.season.key, pts: p, tier: t, tk: t + 1 }, season: { key: a.key, base: st.total } };
    }
    case 'LOAD': return { ...initialState(), ...a.s, lv: { ...initialState().lv, ...a.s.lv } };
    case 'RESET': return initialState();
    default: return st;
  }
}
