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
  $s('gfr').onclick = () => bus.emit('glist');
  document.querySelectorAll('.gmode .btn').forEach(b => { b.onclick = () => bus.emit('gmode', b.dataset.m); });
  const MODE = { approve: '승인 필요', open: '자유 가입', invite: '초대만' }, MODEN = { approve: '가입 신청을 연합장이 수락해야 들어올 수 있어요.', open: '연합 찾기에서 신청하면 바로 들어와요.', invite: '연합 찾기에 보이지 않고, 초대 코드로만 들어올 수 있어요.' };
  const ago = t => { const m = Math.max(0, (Date.now() - Date.parse(t)) / 6e4); return m < 60 ? '방금 활동' : m < 1440 ? `${Math.floor(m / 60)}시간 전 활동` : `${Math.floor(m / 1440)}일 전 활동`; };
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
      $s('gown').hidden = !g.isOwner; if (!g.isOwner) return;
      document.querySelectorAll('.gmode .btn').forEach(b => b.classList.toggle('on', b.dataset.m === (g.mode || 'approve')));
      $s('gmoden').textContent = MODEN[g.mode || 'approve']; $s('greqn').textContent = g.reqn ? `가입 신청 ${g.reqn}건` : '';
    },
    reqs(list) { // 연합장: 대기 중 가입 신청
      const ul = $s('greq'); ul.replaceChildren(); if (!list) return;
      if (!list.length) { ul.append(el('li', null, '대기 중인 가입 신청이 없어요.')); return; }
      list.forEach(q => { const li = el('li'), info = el('div'), acts = el('div', 'acts'), ok = el('button', 'btn mini', '수락'), no = el('button', 'btn mini alt', '거절');
        info.append(el('b', null, String(q.name).slice(0, 12)), el('small', null, `순위 점수 ${fmt(q.score)}${q.msg ? ' · "' + String(q.msg).slice(0, 20) + '"' : ''}${q.busy ? ' · 다른 연합에 들어감' : ''}`));
        ok.disabled = !!q.busy; ok.onclick = () => { ok.disabled = no.disabled = true; bus.emit('gdecide', q.id, true); }; no.onclick = () => { ok.disabled = no.disabled = true; bus.emit('gdecide', q.id, false); };
        acts.append(ok, no); li.append(info, acts); ul.append(li); });
    },
    list(gs) { // 연합 찾기
      const ul = $s('glist'); ul.replaceChildren(); if (!gs) { ul.append(el('li', null, '목록을 불러오지 못했어요.')); return; }
      const wait = gs.filter(g => g.my === 'wait').length; $s('gfn').textContent = `연합을 골라 가입 신청을 보내면 연합장이 수락해요. 신청 중 ${wait}/3곳 · 신청은 3일 뒤 사라져요.`;
      if (!gs.length) { ul.append(el('li', null, '아직 공개된 연합이 없어요. 직접 만들어 보세요!')); return; }
      gs.forEach(g => { const li = el('li'), info = el('div'), name = el('b', null, String(g.name).slice(0, 12)), tag = el('span', 'gtag', MODE[g.mode] || ''), full = g.n >= 20;
        name.append(tag); info.append(name, el('small', null, `${g.n}/20명 · 연합장 ${String(g.owner || '-').slice(0, 10)} · 이번 주 ${fmt(g.total)}건 · ${g.act ? ago(g.act) : '활동 없음'}`));
        const b = el('button', 'btn mini');
        if (full) { b.textContent = '가득 참'; b.disabled = true; b.classList.add('alt'); }
        else if (g.my === 'wait') { b.textContent = '신청 취소'; b.classList.add('alt'); b.onclick = () => { b.disabled = true; bus.emit('gcancel', g.id); }; }
        else if (g.my === 'no') { b.textContent = '거절됨'; b.disabled = true; b.classList.add('alt'); }
        else { b.textContent = g.mode === 'open' ? '바로 가입' : '신청'; b.onclick = () => { b.disabled = true; bus.emit('gapply', g.id, $s('gmsg').value.trim()); }; }
        li.append(info, b); ul.append(li); });
    },
  };
}
