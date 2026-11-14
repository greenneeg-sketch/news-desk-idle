import { CARDS, ODDS, PITY } from '../data/config.js';
export const scoutCost = pulls => Math.floor(3000 * 1.2 ** Math.min(pulls, 30));
// r: 등급 추첨, r2: 같은 등급 안의 카드 추첨. 확률 합계를 넘으면 꽝(null). pity가 차면 영웅 이상 보장
export function rollCard(r, r2, pity) {
  let rar = null, acc = 0;
  for (let i = ODDS.length - 1; i >= 0; i--) { acc += ODDS[i]; if (r < acc) { rar = i; break; } }
  if (pity >= PITY - 1 && (rar === null || rar < 2)) rar = 2;
  if (rar === null) return null;
  const pool = CARDS.filter(c => c.rar === rar); return pool[Math.floor(r2 * pool.length) % pool.length];
}
