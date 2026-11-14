import { QUOTES, URGENT } from '../data/quotes.js';
// 말풍선: 장면 캔버스 위에 DOM으로 겹쳐 그린다(한글 폰트 선명). 상태는 읽기만 한다.
export function Bubbles(canvases) {
  const items = canvases.map((cv, i) => {
    const w = document.createElement('div'); w.className = 'cv'; cv.parentNode.insertBefore(w, cv); w.appendChild(cv);
    const b = document.createElement('div'); b.className = 'bub'; b.hidden = true; w.appendChild(b);
    return { b, next: 1.5 + i * 0.9 + Math.random() * 2, hide: 0, last: -1 };
  });
  const slots = [14, 38, 60]; let now = 0;
  return {
    update(dt, s, visible) {
      now += dt; if (!visible) return;
      items.forEach((it, i) => {
        if (!it.b.hidden && now > it.hide) it.b.hidden = true;
        if (now < it.next) return;
        const urgent = s.ev && !s.ev.boost && Math.random() < .5, active = i === 0 || i >= 5 || (s.q && s.q[i] > .02);
        it.next = now + (urgent ? 3 : 5) + Math.random() * 5;
        if (!active) return;
        const pool = urgent && i < 5 ? URGENT : QUOTES[i]; let k; do k = Math.random() * pool.length | 0; while (k === it.last && pool.length > 1);
        it.last = k; it.b.textContent = pool[k]; it.b.className = 'bub' + (urgent && i < 5 ? ' ur' : '');
        it.b.style.left = slots[Math.random() * 3 | 0] + '%'; it.b.hidden = false; it.hide = now + 3.2;
      });
    },
  };
}
