import { seasonPts } from './season.js';
// 순위 점수: 누적 점수 + 최대 레벨 + 최고 시청률 + 유튜브 조회수를 종합 (점수와 조회수는 로그 스케일)
export const rankScore = p => Math.round(30 * Math.log10(1 + p.total) + .6 * p.maxLv + 4 * p.bestRating + 10 * Math.log10(1 + p.views));
export const toEntry = s => ({ uid: s.uid, name: s.name, total: Math.floor(s.total), maxLv: s.maxLv, bestRating: s.bestRating, views: Math.floor(s.views), rankScore: rankScore(s), season: s.season.key, seasonPts: Math.floor(seasonPts(s)) });
