// 안내서 화면: '방송 이야기' / '게임 방법' 두 탭, 항목을 누르면 펼쳐진다. 아직 안 열린 기능은 언제 열리는지 보여 준다
import { GUIDE_BC, GUIDE_GM, GUIDE_FLOOR } from '../data/guide.js';
import { UNLOCKS, isUnlocked } from '../data/tips.js';
import { fmt } from './hud.js';
export function GuideUI(bus, getState) {
  const $g = id => document.getElementById(id);
  let tab = 'bc';
  function draw(openId) {
    document.querySelectorAll('#gdseg [data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === tab));
    const s = getState(), box = $g('gdlist'); box.replaceChildren();
    (tab === 'bc' ? GUIDE_BC : GUIDE_GM).forEach(x => {
      const d = document.createElement('details'), sm = document.createElement('summary'), p = document.createElement('p');
      d.id = 'gd-' + x.id; sm.textContent = x.t; p.textContent = x.d;
      if (x.u && s && !isUnlocked(s, x.u)) { const u = UNLOCKS.find(v => v.id === x.u), lk = document.createElement('small'); lk.className = 'gdlock'; lk.textContent = u && u.at ? `누적 ${fmt(u.at)}점에 열려요` : '개편 후 열려요'; sm.append(lk); }
      if (x.id === openId) d.open = true;
      d.append(sm, p); box.append(d);
    });
    if (openId) setTimeout(() => { const e = $g('gd-' + openId); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); }, 30);
  }
  $g('gdseg').onclick = e => { const b = e.target.closest('[data-g]'); if (b) { tab = b.dataset.g; draw(); $g('gdlist').scrollTop = 0; } };
  $g('gdok').onclick = () => { $g('guidem').hidden = true; bus.emit('guideclose'); };
  $g('gdtut').onclick = () => { $g('guidem').hidden = true; bus.emit('tut', 0); };
  // 층 이름을 누르면 그 부서 설명으로
  document.addEventListener('click', e => { const b = e.target.closest('.floor .fh b'); if (!b) return; const i = +(b.closest('.floor').id || '').replace('fl', ''); if (i >= 0 && GUIDE_FLOOR[i]) open('bc', GUIDE_FLOOR[i]); });
  function open(t = 'bc', id) { tab = t; $g('guidem').hidden = false; draw(id); }
  return { open };
}
