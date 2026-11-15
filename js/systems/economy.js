import { BASE, UPGRADES, RANKS, MILESTONES, CARDS, RARITY, jobOf } from '../data/config.js';
import { weekEvent, heroCount } from './weekly.js';
// 순수 함수 모음: 상태를 받아 계산만 한다 (부작용 없음)
const U = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
export const rl = (s, id) => (s.res && s.res[id]) || 0; // 연구 레벨
const cm = s => 1 - .03 * rl(s, 'cost');
const cmU = (s, u) => cm(s) * (u.st >= 0 && u.st === jobOf(s).st ? .8 : 1); // 내 직업 주력 층 업그레이드는 20% 싸다
const boost = (m, k) => k ? 1 + (m - 1) * k : m;                              // 직업 특기로 효과 키우기
export const mult = (s, u) => { const l = s.lv[u.id], b = 1 + u.pct * l; return u.nm ? b : b * 2 ** MILESTONES.filter(m => l >= m).length; };
export const cost = (s, u) => Math.ceil(u.base * u.g ** s.lv[u.id] * cmU(s, u));
// 구매 수량(x1/x10/MAX)에 따른 레벨 수와 총 비용
export function bulk(s, u, n) {
  const l = s.lv[u.id], lim = n === 'max' ? 1000 : +n; let k = 0, tot = 0;
  while (k < lim) { const c = Math.ceil(u.base * u.g ** (l + k) * cmU(s, u)); if (n === 'max' && s.score < tot + c) break; tot += c; k++; }
  if (!k) { k = 1; tot = Math.ceil(u.base * u.g ** l * cmU(s, u)); }
  return { k, total: tot };
}
export const rank = s => RANKS.filter(r => s.run >= r.at).length - 1;
export const prestigeBonus = s => 1 + .05 * s.pts;
export const prestigeGain = s => Math.floor(Math.sqrt(s.run / 5000));
export function rates(s) {
  const r = BASE.slice();
  UPGRADES.forEach(u => { if (u.st >= 0) r[u.st] *= mult(s, u); });
  s.mg.forEach((m, i) => { if (m) r[i] *= 2; });
  for (let i = 0; i < 5; i++) r[i] *= (1 + cardBonus(s, i)) * (1 + .1 * rl(s, 'speed'));
  r[jobOf(s).st] *= 1.5; // 내 직업 주력 층 +50%
  if (s.ev) r[0] *= s.ev.inf;
  if (s.clock < s.spdEnd) r.forEach((v, i) => { r[i] = v * 2; });
  return r;
}
export function scoreMul(s) {
  const jb = jobOf(s);
  let m = prestigeBonus(s) * boost(mult(s, U.live), jb.live) * boost(mult(s, U.qual), jb.qual) * 2 ** rank(s) * (1 + .02 * s.ach.length) * (1 + .1 * Object.keys(s.chalDone || {}).length) * (1 + .02 * Object.keys(s.deco || {}).length) * (1 + .05 * (s.career || 0)) * (s.clock < s.gbEnd ? 7 : 1);
  if (s.ev) { let e = s.ev.sc; if (s.ev.id === 'sports' && s.lv.live < 1) e *= .5; if (s.ev.boost) e *= 1.5; const we = weekEvent(s); if (we && we.ev === s.ev.id) e *= we.sc; if (s.ev.id === 'robot') e *= 1 + .5 * heroCount(s); e *= jb.ev || 1; m *= e * (1 + .15 * rl(s, 'event')); }
  return m;
}
export const goldGap = (s, r) => (60 + r * 60) * (1 - .08 * rl(s, 'gold')) * ((weekEvent(s) || {}).gold || 1);
export const perSec = s => Math.min(...rates(s)) * 10 * scoreMul(s);
// 특종(Cookie Clicker의 황금 쿠키): 10분치 점수 또는 20초간 점수 x7
export const goldReward = (s, r) => r < .5 ? { cash: Math.max(100, Math.floor(perSec(s) * 600)) } : { frenzy: true };
// 도감 보너스: 층(i)에 해당하는 카드(또는 전 층 카드)의 등급 보너스 x 별 배율의 합
export const cardBonus = (s, i) => CARDS.reduce((a, c) => a + ((c.st === i || c.st < 0) && s.cards[c.id] ? RARITY[c.rar].b * (1 + .5 * (s.cards[c.id] - 1)) : 0), 0);
