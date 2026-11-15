// 지국 화면: 위쪽 픽셀 지도(국내 지국 + 해외 특파원, 본사와 연결선), 아래쪽 지국 목록(개설·확장 버튼)
import { BRANCHES, BR_MAX, brCost, EVENTS } from '../data/config.js';
import { brMul } from '../systems/economy.js';
import { fmt } from './hud.js';

const BR_KO = [ // 한반도 모양(가로 줄 단위): [y, x시작, x끝]
  [10, 52, 74], [16, 46, 84], [22, 42, 88], [28, 44, 82], [34, 46, 78], [40, 44, 76], [46, 46, 76], [52, 48, 78], [58, 50, 80], [64, 50, 82],
  [70, 52, 84], [76, 52, 86], [82, 52, 88], [88, 52, 88], [94, 54, 88], [100, 54, 86], [106, 58, 80]];
const BR_HQ = { x: 56, y: 58 }, BR_EVK = Object.fromEntries(EVENTS.map(e => [e.id, e.k]));
export function Branches(bus) {
  const $b = id => document.getElementById(id), cv = $b('brmap'), c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  const R = (x, y, w, h, k) => { c.fillStyle = k; c.fillRect(x, y, w, h); };
  $b('brlist').innerHTML = BRANCHES.map(b => `<div class="wg brrow" id="brw-${b.id}"><div class="row2"><span><b>${b.n}</b> <small class="brk">${b.k}</small><br><small id="brd-${b.id}"></small></span><button class="btn mini" data-br="${b.id}" id="brb-${b.id}"></button></div></div>`).join('');
  $b('brlist').onclick = e => { const x = e.target.closest('[data-br]'); if (x && !x.disabled) bus.emit('brup', x.dataset.br); };
  let last = '';
  return {
    render(s) { // 목록: 바뀐 것만 다시 쓴다
      const br = s.br || {}, key = JSON.stringify(br) + '|' + Math.floor(Math.log10(1 + s.score) * 20);
      if (key === last) return; last = key;
      const open = BRANCHES.filter(b => br[b.id]).length;
      $b('brsum').textContent = `${open}/${BRANCHES.length}곳 운영 · 전체 점수 x${brMul(s).toFixed(2)}`;
      BRANCHES.forEach((b, i) => {
        const lv = br[b.id] || 0, prev = i === 0 || br[BRANCHES[i - 1].id], cost = brCost(b, lv), btn = $b('brb-' + b.id), max = lv >= BR_MAX;
        $b('brw-' + b.id).classList.toggle('off', !prev && !lv);
        $b('brd-' + b.id).textContent = !prev && !lv ? `앞 지국을 먼저 열어야 해요` : lv ? `Lv.${lv} · 점수 +${Math.round(lv * b.pct * 100)}% · ${BR_EVK[b.ev]} 속보 +${20 + 2 * lv}%` : `열면 점수 +${Math.round(b.pct * 100)}% · ${BR_EVK[b.ev]} 속보 +22%`;
        btn.textContent = max ? 'MAX' : `${lv ? '확장' : '개설'} ${fmt(cost)}`; btn.disabled = max || (!prev && !lv) || s.score < cost; btn.classList.toggle('can', !btn.disabled);
      });
    },
    draw(s, t) { // 지도
      const br = s.br || {};
      R(0, 0, 320, 150, '#1d2b53'); for (let y = 0; y < 150; y += 6) R(0, y, 320, 1, '#22325e'); // 바다
      R(0, 0, 40, 64, '#3a4466'); R(0, 64, 26, 30, '#3a4466'); // 대륙(중국 쪽)
      BR_KO.forEach(([y, a, b]) => R(a, y, b - a, 6, '#5a6988')); R(56, 124, 12, 6, '#5a6988'); // 한반도, 제주
      [[110, 64, 10, 10], [116, 74, 12, 12], [120, 86, 10, 10], [108, 98, 10, 8]].forEach(([x, y, w, h]) => R(x, y, w, h, '#5a6988')); // 일본
      R(150, 0, 2, 150, '#0b0b14'); c.fillStyle = '#94b0c2'; c.font = '6px "Press Start 2P",monospace'; c.fillText('WORLD', 160, 12); c.fillText('KOREA', 6, 145);
      R(176, 30, 52, 44, '#3a4466'); R(186, 74, 22, 16, '#3a4466'); R(256, 26, 40, 34, '#3a4466'); R(262, 60, 30, 40, '#3a4466'); R(300, 30, 20, 40, '#3a4466'); // 북미, 유럽, 아프리카, 아시아 끝
      BRANCHES.forEach(b => { // 본사 → 지국 연결선(점선이 흐른다)
        if (!br[b.id]) return; const dx = b.x - BR_HQ.x, dy = b.y - BR_HQ.y, n = Math.max(6, Math.hypot(dx, dy) / 4 | 0);
        for (let i = 0; i < n; i++) { const f = ((i + t * 3) % n) / n; if (i % 2) continue; R(BR_HQ.x + dx * f, BR_HQ.y + dy * f, 2, 2, b.k === '해외' ? '#ffcd75' : '#73eff7'); }
      });
      BRANCHES.forEach(b => {
        const lv = br[b.id] || 0, on = lv > 0, p = on && (t * 2 + b.x) % 2 < 1;
        R(b.x - 3, b.y - 3, 7, 7, '#0b0b14'); R(b.x - 2, b.y - 2, 5, 5, on ? (b.k === '해외' ? '#ffcd75' : '#73eff7') : '#566c86'); if (p) R(b.x - 1, b.y - 1, 3, 3, '#ffffff');
        if (on) { c.fillStyle = '#f4f4f4'; c.font = '5px "Press Start 2P",monospace'; c.fillText('Lv' + lv, b.x + 5, b.y + 2); }
      });
      R(BR_HQ.x - 4, BR_HQ.y - 4, 9, 9, '#0b0b14'); R(BR_HQ.x - 3, BR_HQ.y - 3, 7, 7, '#b13e53'); R(BR_HQ.x - 1, BR_HQ.y - 1, 3, 3, '#ffcd75'); // 본사(서울)
      c.fillStyle = '#ffcd75'; c.font = '5px "Press Start 2P",monospace'; c.fillText('HQ', BR_HQ.x - 18, BR_HQ.y + 2);
    },
  };
}
