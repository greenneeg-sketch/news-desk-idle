import { CARDS, ODDS, PITY } from '../data/config.js';
import { perSec } from './economy.js';
// 스카우트 가격: 횟수마다 15%씩 계속 오르고(상한 없음), 최소한 평소 수입 10분치는 되게 한다(속보·특종 배율 제외)
export const scoutCost = s => Math.floor(Math.max(5000 * 1.15 ** s.pulls, perSec({ ...s, ev: null, gbEnd: 0, spdEnd: 0 }) * 600));
// r: 등급 추첨, r2: 같은 등급 안의 카드 추첨. 확률 합계를 넘으면 꽝(null). pity가 차면 영웅 이상 보장
export function rollCard(r, r2, pity) {
  let rar = null, acc = 0;
  for (let i = ODDS.length - 1; i >= 0; i--) { acc += ODDS[i]; if (r < acc) { rar = i; break; } }
  if (pity >= PITY - 1 && (rar === null || rar < 2)) rar = 2;
  if (rar === null) return null;
  const pool = CARDS.filter(c => c.rar === rar); return pool[Math.floor(r2 * pool.length) % pool.length];
}
