import { UPGRADES } from '../data/config.js';
import { mult, rank, perSec } from './economy.js';
const QUAL = UPGRADES.find(u => u.id === 'qual');
// 8시 뉴스 일일 평가: 오늘의 송출량, 속보 대응, 방송 품질, 승급 단계로 시청률을 정하고, 매일 +-20% 변동을 준다.
// 시청률로 유튜브 조회수가 정해지고(12% 확률로 대박 x5), 광고 수입이 점수로 지급된다.
export function evaluateDay(s, r, r2) {
  const base = 2 + 1.1 * Math.log10(1 + s.dOut) + .6 * Math.min(s.dEv, 5) + 1.2 * Math.sqrt(mult(s, QUAL) - 1) + .4 * rank(s);
  const rating = Math.min(30, Math.round(base * (.8 + .4 * r) * 10) / 10), viral = r2 < .12;
  const views = Math.floor((s.dOut * 8 + s.dEv * 400) * (1 + rating / 10) * (viral ? 5 : 1));
  return { rating, views, viral, bonus: Math.floor(perSec(s) * rating * 10 + views * .05) };
}
