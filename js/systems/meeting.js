// 아침 편집회의: 게임 속 하루가 시작될 때 톱뉴스 후보 3개 중 하나를 고른다.
// 후보 중 하나는 '유력'(hot): 그날 그 분야 속보가 4배 자주 터진다. 별점(★)으로 힌트를 주지만 가끔 틀린다.
// 고른 분야 속보가 터지면: 그 속보 점수 x1.5, 시청률 +0.6(하루 3건까지). 하루 내내 한 건도 없으면 시청률 -0.3. 안 고르면 영향 없음.
import { EVENTS } from '../data/config.js';

export const MEET_MEMO = { // [유력할 때 메모, 평소 메모]
  weather: ['기상청 공식 특보 예고', '주말 날씨 변수 있음'], politics: ['국회 본회의 표결 일정 확정', '여야 회동설 돌고 있음'],
  economy: ['금리 발표·실적 시즌 겹침', '증시 변동성 커지는 중'], tech: ['대형 신제품 발표회 예정', 'AI 업계 루머 다수'],
  world: ['정상회담 일정 공식 발표', '해외 선거 개표 앞둠'], sports: ['결승전 생중계 예정', '이적 시장 소문'],
  culture: ['연말 시상식 생중계', '컴백 일정 제보'], society: ['전국 단위 행사 당일', '시민 제보 증가'],
  robot: ['도심 이상 신호 다수 포착', 'UFO 목격담 몇 건'],
};
export const MEET_MAX = 3, MEET_ADJ = .6, MEET_MISS = -.3, MEET_SC = 1.5, MEET_HOT = 4, MEET_FOCUS = 1.5;
export function newMeet(s, r) {
  let x = Math.floor(r * 1e9) || 11; const rnd = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pool = EVENTS.filter(e => MEET_MEMO[e.id] && s.run >= e.min).sort(() => rnd() - .5).slice(0, 3);
  if (pool.length < 2) return { day: s.day, opts: [], hot: null, pick: null, hits: 0, stars: {} };
  const hot = pool[Math.floor(rnd() * pool.length)].id, stars = {};
  const memo = {}; // 힌트 두 가지(별점·취재 메모) 모두 가끔 틀린다
  pool.forEach(e => { const h = e.id === hot; stars[e.id] = h ? (rnd() < .7 ? 3 : 2) : (rnd() < .3 ? 2 : 1); memo[e.id] = h ? (rnd() < .7 ? 0 : 1) : (rnd() < .2 ? 0 : 1); });
  return { day: s.day, opts: pool.map(e => e.id), hot, pick: null, hits: 0, stars, memo };
}
export const meetW = (s, id) => (s.meet && s.meet.hot === id ? MEET_HOT : 1) * (s.meet && s.meet.pick === id ? MEET_FOCUS : 1); // 속보 가중치: 유력 분야 x4, 고른 분야(취재 인력 집중) x1.5
