import { UPGRADES, MANAGER, CHIEF, ACHIEVEMENTS, DAY_SEC, WEEKLY, CHALLENGES, SCOOP_P, DIL_SEC, RESEARCH, DECOS, jobOf, careerOf, BRANCHES, BR_MAX, brCost, BAL, PERKS, PAY } from '../data/config.js';
import { weekEvent, weekFor } from '../systems/weekly.js';
import { UNLOCKS, unlockReady } from '../data/tips.js';
import { newMissions, progress } from '../systems/missions.js';
import { tierOf } from '../systems/season.js';
import { rates, scoreMul, bulk, prestigeGain, goldReward, perSec, basePS, rl, goldGap } from '../systems/economy.js';
import { evaluateDay } from '../systems/ratings.js';
import { rollCard, scoutCost } from '../systems/cards.js';
export const initialState = () => ({
  score: 0, run: 0, pts: 0, clock: 0, nextEv: 15, ev: null, q: [0, 0, 0, 0, 0], buyN: '1', mg: [0, 0, 0, 0, 0], chief: 0,
  ach: [], evCount: 0, goldCount: 0, gold: null, nextGold: 60, gbEnd: 0, spdEnd: 0, spdReady: 0,
  name: '', uid: '', total: 0, maxLv: 0, bestRating: 0, views: 0, day: 1, dayT: 0, dOut: 0, dEv: 0, hist: [], lastRating: 0, prevRating: 0, lastViews: 0, report: null,
  cards: {}, pulls: 0, pity: 0, tickets: 0, freeReady: 0, last: null, login: { last: '', streak: 0 }, week: { key: '', prog: {}, done: {} }, daily: null,
  chal: null, chalDone: {}, chalWin: null, season: { key: '', base: 0 }, lastSeason: null, tut: 0,
  outT: 0, buyT: 0, scoopT: 0, win: 0, bestWin: 0, dAdj: 0, mis: null, misAll: 0, misHit: null, judge: null,
  rp: 0, res: {}, deco: {}, dLog: [], dW: 0, dF: 0,
  career: 0, promo: null, wev: null, badges: [], weHit: null, tips: {}, job: '', unl: {}, unlHit: null, presV: 2, lbEp: 2, lbBase: { total: 0, views: 0 }, mgBest: {}, mgN: 0, br: {}, evH: 0, cofEnd: 0, perkN: 0, lr: null, guild: null,
  lv: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
});
const KEEP = ['name', 'uid', 'total', 'maxLv', 'bestRating', 'views', 'day', 'hist', 'lastRating', 'prevRating', 'lastViews', 'ach', 'evCount', 'goldCount', 'buyN', 'cards', 'pulls', 'pity', 'tickets', 'login', 'week', 'chalDone', 'season', 'lastSeason', 'tut', 'outT', 'buyT', 'scoopT', 'win', 'bestWin', 'misAll', 'rp', 'res', 'deco', 'career', 'wev', 'badges', 'tips', 'job', 'unl', 'presV', 'lbEp', 'lbBase', 'mgBest', 'mgN', 'lr', 'guild', 'evH', 'perkN'];
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
    if (i < 4) s.q[i + 1] += mv; else { s.dOut += mv; s.outT += mv; const g = mv * 10 * m; s.score += g; s.run += g; s.total += g; }
  }
}
// 주간 한정 이벤트 진행도: 종류(k)가 맞을 때만 +1
const wevBump = (st, k, evId) => { const we = weekEvent(st); return we && st.wev && !st.wev.done && we.k === k && (k !== 'ev' || we.ev === evId) ? { ...st.wev, p: st.wev.p + 1 } : st.wev; };
// 속보 판단: risk = 바로 단독 송출(성공 시 점수 x2·시청률 +0.8, 오보 시 속보 종료·시청률 -1.2), safe = 확인 후 송출(점수 x1.2)
function judge(s, pick, r) {
  const ev = { ...s.ev, pick };
  if (pick === 'safe') { ev.sc = Math.round(ev.sc * 1.2 * 10) / 10; s.judge = { res: 'safe', t: s.clock }; }
  else if (r < SCOOP_P + .04 * rl(s, 'scoop') + (jobOf(s).scoop || 0)) { ev.sc *= 2; s.dAdj += .8; s.scoopT += 1; s.rp += 1; s.dW += 1; s.judge = { res: 'win', t: s.clock }; }
  else { ev.end = s.clock; s.dAdj -= 1.2; s.dF += 1; s.judge = { res: 'fail', t: s.clock }; }
  s.ev = ev; return s;
}
export function reducer(st, a) {
  switch (a.type) {
    case 'TICK': {
      const s = { ...st, q: [...st.q], clock: st.clock + a.dt };
      if (s.ev && s.clock >= s.ev.end) { s.ev = null; s.nextEv = s.clock + 25 + a.rnd * 20; }
      if (s.gold && s.clock >= s.gold.end) { s.gold = null; s.nextGold = s.clock + goldGap(s, a.rnd); }
      else if (!s.gold && s.chal !== 'calm' && s.clock >= s.nextGold) s.gold = { end: s.clock + 12, x: Math.round(8 + a.rnd * 70), y: Math.round(22 + a.r2 * 50) };
      if (s.ev && s.ev.dil && !s.ev.pick && s.clock >= s.ev.dilEnd) judge(s, 'safe');
      flow(s, a.dt);
      s.dayT += a.dt;
      if (s.dayT >= DAY_SEC) { // 8시 뉴스 시청률 평가
        const e = evaluateDay(s, a.rnd, a.r2, a.r3), rec = e.rating > s.bestRating && s.day > 1;
        s.prevRating = s.lastRating; s.lastRating = e.rating; s.bestRating = Math.max(s.bestRating, e.rating); s.views += e.views; s.lastViews = e.views;
        s.hist = [...s.hist, e.rating].slice(-7); s.score += e.bonus; s.run += e.bonus; s.total += e.bonus;
        { const p = PAY.find(x => e.rating >= x.r); e.pay = p ? Math.floor(basePS(s) * 60 * p.min) : 0; e.payTk = p && p.tk || 0; if (e.pay) { s.score += e.pay; s.run += e.pay; s.total += e.pay; s.tickets += e.payTk; } } // 시청률 성과급
        if (e.rating >= 6) s.week = bump(s.week, 'rate');
        { const we = weekEvent(s); if (we && we.k === 'win' && e.won && s.wev && !s.wev.done) s.wev = { ...s.wev, p: s.wev.p + 1 }; }
        const rp = 1 + Math.floor(e.rating / 4) + (e.won ? 1 : 0);
        s.win = e.win; s.bestWin = Math.max(s.bestWin, e.win); s.rp += rp;
        s.report = { day: s.day, ...e, rp, rec, log: s.dLog, dW: s.dW, dF: s.dF, all: !!(s.mis && s.mis.all), out: Math.floor(s.dOut) };
        s.day += 1; s.dayT -= DAY_SEC; s.dOut = 0; s.dEv = 0; s.dAdj = 0; s.dLog = []; s.dW = 0; s.dF = 0;
      }
      if (!s.mis || s.mis.day !== s.day) s.mis = newMissions(s, a.r2);
      else if (s.mis.list.some(m => !m.done && progress(s, m) >= m.goal)) { // 미션 달성: 즉시 보상, 3개 모두 달성 시 티켓
        const mis = { ...s.mis, list: s.mis.list.map(m => ({ ...m })) }, gain = Math.max(1000, Math.floor(basePS(s) * BAL.mis));
        mis.list.forEach(m => { if (!m.done && progress(s, m) >= m.goal) { m.done = 1; s.rp += 1; s.score += gain; s.run += gain; s.total += gain; s.misHit = { k: m.k, gain, t: s.clock }; } });
        if (!mis.all && mis.list.every(m => m.done)) { mis.all = 1; s.tickets += 1; s.misAll += 1; s.misHit = { ...s.misHit, all: 1 }; }
        s.mis = mis;
      }
      { const C = careerOf(s); let c = s.career || 0, tk = 0; while (C[c + 1] && C[c + 1].need(s)) { c++; tk += C[c].tk; } if (c > (s.career || 0)) { s.career = c; s.tickets += tk; s.promo = { i: c, t: s.clock, tk }; } } // 승진: 여러 단계를 한 번에 넘으면 마지막 직급 창 하나만
      { const we = weekEvent(s); if (we && s.wev && !s.wev.done && s.wev.p >= we.goal) { s.wev = { ...s.wev, done: 1 }; s.tickets += 2; s.badges = [...(s.badges || []), s.wev.id + ':' + s.wev.key]; s.weHit = { id: we.id, t: s.clock }; } }
      { const nu = UNLOCKS.filter(u => !(s.unl || {})[u.id] && unlockReady(s, u)); if (nu.length) { s.unl = { ...s.unl }; nu.forEach(u => { s.unl[u.id] = 1; }); s.unlHit = { ids: nu.map(u => u.id), t: s.clock }; } } // 기능 해금
      const hit = ACHIEVEMENTS.filter(x => !s.ach.includes(x.id) && x.t(s)); if (hit.length) s.ach = [...s.ach, ...hit.map(x => x.id)];
      if (s.chal) { const c = CHALLENGES.find(x => x.id === s.chal); if (c && s.run >= c.goal) { s.chalDone = { ...s.chalDone, [c.id]: 1 }; s.chalWin = c.id + ':' + s.clock; s.chal = null; } }
      return s;
    }
    case 'NAME': return { ...st, name: a.name, uid: st.uid || a.uid, job: a.job || st.job || 'editor' };
    case 'SPAWN': return { ...st, evCount: st.evCount + 1, dEv: st.dEv + 1, dLog: [...(st.dLog || []), a.ev.name].slice(-3), wev: wevBump(st, 'ev', a.ev.id), week: bump(st.week, 'ev'), ev: { ...a.ev, end: st.clock + a.ev.dur, boost: !!st.chief, auto: !!st.chief, dilEnd: st.clock + DIL_SEC, pick: null } };
    case 'JUDGE': return st.ev && st.ev.dil && !st.ev.pick ? judge({ ...st, evH: (st.evH || 0) + 1 }, a.pick, a.r) : st; // 데스크 판단도 대응
    case 'BOOST': return st.ev && !st.ev.boost ? { ...st, evH: (st.evH || 0) + 1, ev: { ...st.ev, boost: true } } : st; // 직접 우선 편집 = 속보 대응
    case 'GOLD': {
      if (!st.gold) return st; const g = goldReward(st, a.r), n = g.cash || 0;
      return { ...earn(st, n), gold: null, nextGold: st.clock + goldGap(st, a.r), goldCount: st.goldCount + 1, wev: wevBump(st, 'gold'), week: bump(st.week, 'gold'), gbEnd: g.frenzy ? st.clock + 20 : st.gbEnd };
    }
    case 'SPD': return st.clock < st.spdReady ? st : { ...st, spdEnd: st.clock + 120, spdReady: st.clock + 300 };
    case 'BUY': {
      if (st.chal === 'noQual' && a.id === 'qual') return st;
      const u = UPGRADES.find(x => x.id === a.id), { k, total } = bulk(st, u, a.n || '1'), nl = st.lv[u.id] + k;
      return st.score < total ? st : { ...st, score: st.score - total, maxLv: Math.max(st.maxLv, nl), buyT: st.buyT + k, week: bump(st.week, 'buy', k), lv: { ...st.lv, [u.id]: nl } };
    }
    case 'HIRE': return st.chal === 'noMgr' || st.mg[a.i] || st.score < MANAGER[a.i] ? st : { ...st, score: st.score - MANAGER[a.i], mg: st.mg.map((v, j) => j === a.i ? 1 : v) };
    case 'CHIEF': return st.chal === 'noMgr' || st.chief || st.score < CHIEF ? st : { ...st, score: st.score - CHIEF, chief: 1 };
    case 'SCOUT': { // how: paid(점수) / ticket(티켓) / ad(광고 무료)
      let s = { ...st };
      if (a.how === 'paid') { const c = scoutCost(st); if (st.score < c) return st; s.score -= c; }
      else if (a.how === 'ticket') { if (st.tickets < 1) return st; s.tickets -= 1; }
      else { if (st.clock < st.freeReady) return st; s.freeReady = st.clock + 600; }
      const card = rollCard(a.r, a.r2, st.pity, (weekEvent(st) || {}).hero || 1);
      s.pulls = st.pulls + 1; s.week = bump(st.week, 'pull');
      if (!card) { // 꽝: 점수로 뽑았다면 비용의 20%를 위로금으로 돌려준다
        const back = a.how === 'paid' ? Math.floor(scoutCost(st) * .2) : 0;
        s.pity = st.pity + 1; s.last = { id: null, miss: true, back }; return back ? earn(s, back) : s;
      }
      const had = st.cards[card.id] || 0;
      s.cards = { ...st.cards, [card.id]: Math.min(3, had + 1) }; s.pity = card.rar >= 2 ? 0 : st.pity + 1;
      s.last = { id: card.id, isNew: !had, maxed: had >= 3 };
      return had >= 3 ? earn(s, 500) : s;
    }
    case 'CLAIM': { // 주간 목표 보상
      const g = WEEKLY.find(x => x.id === a.id); if (!g || st.week.done[g.id] || (st.week.prog[g.k] || 0) < g.goal) return st;
      return { ...earn(st, Math.max(2000, Math.floor(basePS(st) * 1800))), tickets: st.tickets + 1, week: { ...st.week, done: { ...st.week.done, [g.id]: 1 } } };
    }
    case 'WEEK': { // 주간 목표 초기화 + 이번 주 한정 이벤트 시작
      const wev = st.wev && st.wev.key === a.key ? st.wev : { key: a.key, id: weekFor(a.key).id, p: 0, done: 0 };
      return st.week.key === a.key ? (wev === st.wev ? st : { ...st, wev }) : { ...st, week: { key: a.key, prog: {}, done: {} }, wev };
    }
    case 'CHECKIN': { // 일일 출석: 연속일수 x 보너스, 7일마다 티켓
      if (st.login.last === a.day) return st;
      const streak = st.login.last && dn(a.day) - dn(st.login.last) === 1 ? st.login.streak + 1 : 1;
      // 첫 출석(처음 시작한 날)은 작게: 시작하자마자 큰 보상이 들어오면 해금·승진이 한꺼번에 터져 혼란스럽다
      const gain = !st.login.last ? 300 : Math.max(500, Math.floor(basePS(st) * 600)) * Math.min(streak, 7), tk = streak % 7 === 0 ? 1 : 0;
      return { ...earn(st, gain), tickets: st.tickets + tk, login: { last: a.day, streak }, daily: { streak, gain, tk } };
    }
    case 'RESEARCH': {
      const r = RESEARCH.find(x => x.id === a.id), l = rl(st, a.id); if (!r || l >= r.max) return st;
      const c = r.c * (l + 1); if (st.rp < c || (r.req && rl(st, r.req[0]) < r.req[1])) return st;
      return { ...st, rp: st.rp - c, res: { ...st.res, [a.id]: l + 1 } };
    }
    case 'DECO': {
      const d = DECOS.find(x => x.id === a.id); if (!d || st.deco[a.id]) return st;
      if (d.need ? !d.need(st) : st.score < d.at) return st;
      return { ...st, score: st.score - (d.at || 0), deco: { ...st.deco, [a.id]: 1 } };
    }
    case 'TUT': return { ...st, tut: a.step };
    case 'TIP': return { ...st, tips: { ...st.tips, [a.id]: 1 } };
    case 'SETN': return { ...st, buyN: a.n };
    case 'GAIN': return earn(st, a.n);
    case 'PERK': { // 소소한 이벤트 보상
      const p = PERKS.find(x => x.id === a.id); if (!p) return st; let s = { ...st, perkN: (st.perkN || 0) + 1 };
      if (p.k === 'speed') s.cofEnd = st.clock + 120;
      if (p.k === 'cash') s = earn(s, Math.max(200, Math.floor(basePS(st) * 60 * p.n)));
      if (p.k === 'rp') s.rp = st.rp + p.n; if (p.rp) s.rp = s.rp + p.rp;
      if (p.k === 'ticket') s.tickets = st.tickets + p.n;
      return s;
    }
    case 'SETLR': return { ...st, lr: a.lr || null }; // 오늘의 실제 플레이어 상대
    case 'SETGUILD': return { ...st, guild: a.g || null }; // 연합 정보(버프 계산용)
    case 'GREWARD': return { ...earn(st, a.n), tickets: st.tickets + (a.tk || 0) }; // 공동 특보 보상
    case 'BRUP': { // 지국 개설·확장
      const b = BRANCHES.find(x => x.id === a.id), lv = (st.br || {})[a.id] || 0; if (!b || lv >= BR_MAX) return st;
      const c = brCost(b, lv); if (st.score < c) return st;
      return { ...st, score: st.score - c, br: { ...st.br, [a.id]: lv + 1 } };
    }
    case 'MGREC': { // 미니게임 기록: 최고 등급(S>A>B>C), 실전 횟수
      const o = 'CBAS', b = (st.mgBest || {})[a.id];
      return { ...st, mgBest: { ...st.mgBest, [a.id]: !b || o.indexOf(a.grade) > o.indexOf(b) ? a.grade : b }, mgN: (st.mgN || 0) + (a.practice ? 0 : 1) };
    }
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
