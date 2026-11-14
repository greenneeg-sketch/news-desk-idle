import { BASE, UPGRADES, RANKS, MILESTONES, CARDS, RARITY } from '../data/config.js';
// 순수 함수 모음: 상태를 받아 계산만 한다 (부작용 없음)
const U = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
export const mult = (s, u) => { const l = s.lv[u.id], b = 1 + u.pct * l; return u.nm ? b : b * 2 ** MILESTONES.filter(m => l >= m).length; };
export const cost = (s, u) => Math.ceil(u.base * u.g ** s.lv[u.id]);
// 구매 수량(x1/x10/MAX)에 따른 레벨 수와 총 비용
export function bulk(s, u, n) {
  const l = s.lv[u.id], lim = n === 'max' ? 1000 : +n; let k = 0, tot = 0;
  while (k < lim) { const c = Math.ceil(u.base * u.g ** (l + k)); if (n === 'max' && s.score < tot + c) break; tot += c; k++; }
  if (!k) { k = 1; tot = Math.ceil(u.base * u.g ** l); }
  return { k, total: tot };
}
export const rank = s => RANKS.filter(r => s.run >= r.at).length - 1;
export const prestigeBonus = s => 1 + .05 * s.pts;
export const prestigeGain = s => Math.floor(Math.sqrt(s.run / 5000));
export function rates(s) {
  const r = BASE.slice();
  UPGRADES.forEach(u => { if (u.st >= 0) r[u.st] *= mult(s, u); });
  s.mg.forEach((m, i) => { if (m) r[i] *= 2; });
  for (let i = 0; i < 5; i++) r[i] *= 1 + cardBonus(s, i);
  if (s.ev) r[0] *= s.ev.inf;
  if (s.clock < s.spdEnd) r.forEach((v, i) => { r[i] = v * 2; });
  return r;
}
export function scoreMul(s) {
  let m = prestigeBonus(s) * mult(s, U.live) * mult(s, U.qual) * 2 ** rank(s) * (1 + .02 * s.ach.length) * (1 + .1 * Object.keys(s.chalDone || {}).length) * (s.clock < s.gbEnd ? 7 : 1);
  if (s.ev) { let e = s.ev.sc; if (s.ev.id === 'sports' && s.lv.live < 1) e *= .5; if (s.ev.boost) e *= 1.5; m *= e; }
  return m;
}
export const perSec = s => Math.min(...rates(s)) * 10 * scoreMul(s);
// 특종(Cookie Clicker의 황금 쿠키): 10분치 점수 또는 20초간 점수 x7
export const goldReward = (s, r) => r < .5 ? { cash: Math.max(100, Math.floor(perSec(s) * 600)) } : { frenzy: true };
// 도감 보너스: 층(i)에 해당하는 카드(또는 전 층 카드)의 등급 보너스 x 별 배율의 합
export const cardBonus = (s, i) => CARDS.reduce((a, c) => a + ((c.st === i || c.st < 0) && s.cards[c.id] ? RARITY[c.rar].b * (1 + .5 * (s.cards[c.id] - 1)) : 0), 0);
