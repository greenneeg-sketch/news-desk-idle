import { MISSIONS, DAY_SEC } from '../data/config.js';
import { rates } from './economy.js';
// 오늘의 미션: 누적 카운터의 '하루 시작 시점 값'을 기준으로 진행도를 잰다 (별도 일일 카운터 불필요)
const CNT = { out: s => s.outT || 0, ev: s => s.evH || 0, gold: s => s.goldCount, buy: s => s.buyT || 0, pull: s => s.pulls, scoop: s => s.scoopT || 0 };
export function newMissions(s, r) {
  const pool = MISSIONS.filter(m => !(s.chal === 'calm' && (m.k === 'ev' || m.k === 'gold' || m.k === 'scoop')) && !(s.chief && m.k === 'ev')); // 팀장이 있으면 우선 편집이 자동이라 '속보 대응' 미션은 빼다
  let x = Math.floor(r * 1e9) || 7; const rnd = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = [...pool].sort(() => rnd() - .5).slice(0, 3);
  return { day: s.day, all: 0, list: pick.map(m => ({ k: m.k, goal: m.k === 'out' ? Math.max(20, Math.round(Math.min(...rates(s)) * DAY_SEC * .4)) : m.g, base: CNT[m.k](s), done: 0 })) };
}
export const progress = (s, m) => Math.max(0, Math.min(m.goal, Math.floor(CNT[m.k](s) - m.base)));
export const missionText = (m, f = String) => MISSIONS.find(x => x.k === m.k).n.replace('{g}', f(m.goal));
