import { TIERS, SEASON_THEMES } from '../data/config.js';
export const seasonKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const themeOf = key => { const m = +String(key).slice(5); return SEASON_THEMES.find(t => t.months.includes(m)); };
// 시즌 점수 = 시즌 시작 이후 번 누적 점수
export const seasonPts = s => Math.max(0, s.total - s.season.base);
export const tierOf = p => TIERS.filter(t => p >= t.at).length - 1;
