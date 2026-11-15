// 순위 탭의 소셜 화면: 시청률 대결(실제 플레이어 상대·전적·최근 기록), 방송국 연합(만들기·가입·멤버·공동 특보)
// 다른 사람의 이름은 textContent로만 넣는다(XSS 방지)
import { fmt } from './hud.js';

const SO_STORIES = ['초대형 태풍 상륙', '전국 동시 정전', '거대 로봇 도심 출현', '정체불명 UFO 편대', '세기의 결승전 생중계', '대규모 선거 개표', '사상 최대 한파', '국가 비상 브리핑'];
export function Social(bus) {
  const $s = id => document.getElementById(id), el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  $s('gmk').onclick = () => bus.emit('gcreate', $s('gname').value.trim());
  $s('gjn').onclick = () => bus.emit('gjoin', $s('gcode').value.trim().toUpperCase());
  $s('gcp').onclick = () => bus.emit('gcopy');
  $s('gcl').onclick = () => bus.emit('gclaim');
  let armLeave = 0; $s('glv').onclick = () => { if (Date.now() - armLeave < 3000) { armLeave = 0; $s('glv').textContent = '탈퇴'; bus.emit('gleave'); } else { armLeave = Date.now(); $s('glv').textContent = '한 번 더 누르면 탈퇴'; } };
  return {
    offline(on) { $s('duelx').hidden = $s('guildx').hidden = on; $s('dueloff').hidden = $s('guildoff').hidden = !on; },
    duel(s, d) { // d: { list, w, l }
      const lr = s.lr && s.lr.rating > 0 ? s.lr : null;
      $s('dopp').textContent = lr ? `${lr.name}` : '상대를 찾는 중… (지금은 가상 방송국과 대결)';
      $s('doppd').textContent = lr ? `실제 플레이어 · 최근 8시 뉴스 ${lr.rating.toFixed(1)}%${lr.live ? ' · 지금 방송 중!' : ''} · 전적 ${lr.w || 0}승 ${lr.l || 0}패` : '최근 3일 안에 8시 뉴스를 한 플레이어 중 순위가 비슷한 방송국과 붙어요.';
      if (!d) return;
      $s('drec').textContent = `내 전적 ${d.w || 0}승 ${d.l || 0}패`;
      const ul = $s('dlog'); ul.replaceChildren();
      (d.list || []).forEach(x => {
        const won = x.me_r > x.opp_r, li = el('li', won ? 'w' : 'l');
        li.append(el('b', null, `${won ? '승' : '패'} vs ${String(x.opp).slice(0, 12)}`), el('small', null, `${x.mine ? '내가 도전' : '상대가 도전'} · ${(+x.me_r).toFixed(1)}% : ${(+x.opp_r).toFixed(1)}% · ${new Date(x.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`));
        ul.append(li);
      });
      if (!(d.list || []).length) ul.append(el('li', null, '아직 대결 기록이 없어요. 8시 뉴스가 끝나면 기록돼요.'));
    },
    guild(g, perSec) {
      $s('gnone').hidden = !!g; $s('gin').hidden = !g; if (!g) return;
      $s('gtitle').textContent = g.name; $s('gcnt').textContent = `${g.n}/20명 · 연합 버프 점수 +${Math.min(10, g.n) * 2}%`; $s('gcodev').textContent = g.code;
      const wk = +String(g.week).slice(-2) || 0, story = SO_STORIES[wk % SO_STORIES.length], pr = Math.min(1, g.total / g.goal);
      $s('gstory').textContent = `이번 주 공동 특보: ${story}`; $s('gprog').textContent = `연합 속보 송출 ${fmt(g.total)} / ${fmt(g.goal)}건`; $s('gbar').style.width = pr * 100 + '%';
      $s('gcl').disabled = g.claimed || pr < 1; $s('gcl').textContent = g.claimed ? '이번 주 보상 받음 ✓' : pr < 1 ? `목표 달성 시 티켓 3장 + ${fmt(perSec * 1800)}점` : `보상 받기: 티켓 3장 + ${fmt(perSec * 1800)}점`;
      const ul = $s('gmem'); ul.replaceChildren();
      (g.members || []).forEach((m, i) => { const li = el('li', m.me ? 'me' : null); li.append(el('b', null, `${i + 1}. ${String(m.name).slice(0, 12)}${m.owner ? ' ★' : ''}`), el('small', null, `이번 주 속보 송출 ${m.c}건`)); ul.append(li); });
    },
  };
}
