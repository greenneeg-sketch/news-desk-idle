import { seasonPts } from './season.js';
// 순위 점수: 누적 점수 + 최대 레벨 + 최고 시청률 + 유튜브 조회수를 종합 (점수와 조회수는 로그 스케일)
export const rankScore = p => Math.round(30 * Math.log10(1 + p.total) + .6 * p.maxLv + 4 * p.bestRating + 10 * Math.log10(1 + p.views));
// 순위 초기화 회차: 이 숫자를 올리면 모든 기기의 순위용 누적 점수·조회수가 0부터 다시 쌓인다 (게임 진행은 그대로)
export const LB_EP = 2;
export const toEntry = s => {
  const b = s.lbBase || {}, p = { total: Math.max(0, Math.floor(s.total - (b.total || 0))), maxLv: s.maxLv, bestRating: s.bestRating, views: Math.max(0, Math.floor(s.views - (b.views || 0))) };
  return { uid: s.uid, name: s.name, ...p, rankScore: rankScore(p), season: s.season.key, seasonPts: Math.floor(seasonPts(s)) };
};
