import { UPGRADES, RIVAL } from '../data/config.js';
import { mult, rank, perSec, basePS, rl } from './economy.js';
import { jobOf } from '../data/config.js';
import { weekEvent } from './weekly.js';
const QUAL = UPGRADES.find(u => u.id === 'qual');
// 8시 뉴스 일일 평가: 오늘의 송출량, 속보 대응, 방송 품질, 승급 단계로 시청률을 정하고, 매일 +-20% 변동을 준다.
// 시청률로 유튜브 조회수가 정해지고(12% 확률로 대박 x5), 광고 수입이 점수로 지급된다.
// 라이벌 방송국도 같은 기준선에서 시청률을 받는다. 이기면 광고 수입 x1.5(+연승마다 10%, 최대 +100%)
export function evaluateDay(s, r, r2, r3 = .5) {
  const base = 2 + 1.1 * Math.log10(1 + s.dOut) + .6 * Math.min(s.dEv, 5) + 1.2 * Math.sqrt(mult(s, QUAL) - 1) + .4 * Math.min(rank(s), 3);
  const rating = Math.max(.5, Math.min(30, Math.round((base * (.8 + .4 * r) + (s.dAdj || 0) + .3 * rl(s, 'rating') + (jobOf(s).rating || 0)) * 10) / 10)), viral = r2 < .12;
  // 상대: 실제 플레이어(s.lr, 서버에서 받은 최근 8시 뉴스 시청률 ±5%)가 있으면 그 사람, 없으면 가상 라이벌
  const lr = s.lr && s.lr.rating > 0 ? s.lr : null, rn = lr ? lr.name : RIVAL;
  const rival = lr ? Math.round(lr.rating * (.95 + .1 * r3) * 10) / 10 : Math.round(base * (.85 + .35 * r3) * 10) / 10, won = rating > rival, win = won ? (s.win || 0) + 1 : 0, wm = won ? (1.4 + .1 * Math.min(win, 10)) * ((weekEvent(s) || {}).rival || 1) : 1;
  const views = Math.floor((s.dOut * 8 + s.dEv * 400) * (1 + rating / 10) * (viral ? 5 : 1));
  return { rating, views, viral, rival, rn, real: !!lr, oppId: lr ? lr.id : null, won, win, bonus: Math.floor((basePS(s) * rating * 10 + views * .05) * wm * (jobOf(s).ad || 1)) };
}
