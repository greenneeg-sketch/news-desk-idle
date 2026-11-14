import { EVENTS } from '../data/config.js';
import { themeOf } from './season.js';
// 속보 스케줄러: 해금된 카테고리 중 직전과 다른 것을 고르고, 시즌 테마 속보는 3배 가중치
let lastEvent = '';
export function pickEvent(s, r, r2) {
  let pool = EVENTS.filter(e => s.run >= e.min && e.id !== lastEvent);
  if (!pool.length) pool = EVENTS.filter(e => s.run >= e.min);
  const th = themeOf(s.season.key), w = pool.map(e => th && e.id === th.ev ? 3 : 1);
  let x = r * w.reduce((a, b) => a + b, 0), i = 0; while (i < pool.length - 1 && x >= w[i]) { x -= w[i]; i++; }
  const d = pool[i], themed = th && d.id === th.ev && th.name != null;
  return { ...d, name: themed ? d.names[th.name] : d.names[Math.floor(r2 * d.names.length) % d.names.length] };
}
export const EventScheduler = store => ({
  update() {
    const s = store.getState(); if (s.chal === 'calm' || s.ev || s.clock < s.nextEv) return;
    const ev = pickEvent(s, Math.random(), Math.random()); lastEvent = ev.id;
    ev.dil = Math.random() < .45; // 45%는 '단독이냐 확인이냐' 판단이 걸린 속보
    store.dispatch({ type: 'SPAWN', ev });
  },
});
