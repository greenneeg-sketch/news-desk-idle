import { WEEK_EVENTS, CARDS } from '../data/config.js';
// 이번 주 한정 이벤트와 히어로 카드 보유 수 (순수 함수)
export const weekEvent = s => (s.wev && WEEK_EVENTS.find(e => e.id === s.wev.id)) || null;
export const weekFor = key => WEEK_EVENTS[((Math.floor(Date.parse(key + 'T00:00:00Z') / 864e5 / 7) % WEEK_EVENTS.length) + WEEK_EVENTS.length) % WEEK_EVENTS.length];
export const heroCount = s => CARDS.filter(c => c.hero && s.cards[c.id]).length;
