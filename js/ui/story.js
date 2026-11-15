// 스토리 모드 화면: 챕터 목록(#story) + 장면 보기(#storyv: 위쪽 층 장면, 아래쪽 대화창)
import { STORY, ST_PARTS, ST_WHO, stStatus, stProg, stLine } from '../data/story.js';
import { DAY_SEC } from '../data/config.js';
import { drawEditHD } from './edithd.js';
import { FloorsHD } from './floorshd.js';
import { drawPortrait } from './cardart.js';

export function StoryUI(bus, getS) {
  const $s = id => document.getElementById(id), cv = $s('svcv'), c = cv.getContext('2d'), pc = $s('svp').getContext('2d');
  cv.width = 1920; cv.height = 384; c.imageSmoothingEnabled = false;
  let play = null, raf = 0, lastKey = '';
  const statusTxt = (s, ch, st) => st === 'lock' ? (s.total < ch.at ? `누적 ${ch.at >= 1e4 ? ch.at / 1e4 + '만' : ch.at >= 1e3 ? ch.at / 1e3 + '천' : ch.at}점에 열려요` : '앞 이야기를 먼저 끝내세요')
    : st === 'new' ? '새 이야기' : st === 'mis' ? (() => { const [a, b] = stProg(s, ch); return `미션 중 · ${ch.mis.d} (${a}/${b})`; })()
    : st === 'claim' ? '미션 완료! 보상을 받으세요' : `완료 · 티켓 ${ch.rw.tk}장 받음`;
  function list() {
    const s = getS(), box = $s('stlist'); box.replaceChildren();
    ST_PARTS.forEach((p, pi) => {
      const h = document.createElement('div'); h.className = 'sthead'; h.innerHTML = `<b></b><small></small>`; h.querySelector('b').textContent = p.n; h.querySelector('small').textContent = p.d; box.append(h);
      STORY.filter(ch => ch.part === pi).forEach((ch, i) => {
        const st = stStatus(s, ch), row = document.createElement('div'), info = document.createElement('div'), b = document.createElement('b'), d = document.createElement('small'), btn = document.createElement('button');
        row.className = 'strow ' + st; b.textContent = `${STORY.indexOf(ch) + 1}. ${st === 'lock' ? '???' : ch.n}`; d.textContent = (st === 'lock' ? '' : ch.d + ' · ') + statusTxt(s, ch, st);
        btn.className = 'btn mini' + (st === 'new' || st === 'claim' ? ' can' : ' alt'); btn.disabled = st === 'lock';
        btn.textContent = { lock: '잠김', new: '보기', mis: ch.mis.k === 'mg' ? '하러 가기' : '다시 보기', claim: '보상 받기', done: '다시 보기' }[st];
        btn.onclick = () => {
          if (st === 'new') view(ch, ch.lines, 'mission');
          else if (st === 'mis') { if (ch.mis.k === 'mg') { close(); bus.emit('storyMini', ch.mis.g); } else view(ch, ch.lines, 'mission'); }
          else if (st === 'claim') { bus.emit('storyClaim', ch.id); view(ch, ch.end, 'reward'); }
          else if (st === 'done') view(ch, [...ch.lines, ...ch.end], 'replay');
        };
        info.append(b, d); row.append(info, btn); box.append(row);
      });
    });
    const more = document.createElement('p'); more.className = 'note'; more.textContent = '2부 「현장의 시간」은 준비 중이에요.'; box.append(more);
  }
  const open = () => { list(); $s('story').hidden = false; };
  const close = () => { $s('story').hidden = true; };
  function view(ch, lines, mode) {
    play = { ch, lines, i: 0, t0: performance.now(), mode }; $s('story').hidden = true; $s('storyv').hidden = false; $s('svmis').hidden = true; $s('svbox').hidden = false;
    $s('svtitle').textContent = `${STORY.indexOf(ch) + 1}장 · ${ch.n}`; show(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function show() {
    const l = play.lines[play.i], s = getS(), me = l.who === 'me', nar = !l.who;
    $s('svn').textContent = nar ? '' : me ? (s.name || '나') : ST_WHO[l.who] || ''; $s('svn').className = me ? 'me' : '';
    $s('svbox').classList.toggle('nar', nar); $s('svp').hidden = nar || me; play.txt = stLine(l, s); play.t0 = performance.now();
    $s('svt').textContent = ''; $s('svnext').textContent = play.i < play.lines.length - 1 ? '▼' : '■';
  }
  function next() {
    if (!play || !$s('svmis').hidden) return;
    const shown = Math.floor((performance.now() - play.t0) / 1000 * 40);
    if (shown < play.txt.length) { play.t0 = -1e9; return; } // 글자가 다 안 나왔으면 먼저 다 보여 준다
    if (play.i < play.lines.length - 1) { play.i++; show(); return; }
    finish();
  }
  function finish() {
    const { ch, mode } = play;
    if (mode === 'mission') { // 미션 안내
      $s('svbox').hidden = true; $s('svmis').hidden = false; $s('svmd').textContent = ch.mis.d; $s('svmh').textContent = ch.mis.hint; $s('svrw').textContent = `보상: 스카우트 티켓 ${ch.rw.tk}장 + 평소 생산량 ${ch.rw.min}분치`;
      $s('svmini').hidden = ch.mis.k !== 'mg'; return;
    }
    const hit = mode === 'reward' && getS().storyHit; stop();
    if (hit) bus.emit('storyReward', hit); else open();
  }
  function stop() { cancelAnimationFrame(raf); play = null; $s('storyv').hidden = true; }
  function loop(now) {
    if (!play) return; raf = requestAnimationFrame(loop);
    const l = play.lines[play.i], s = getS(), t = now / 1000, ss = { ...s, dayT: play.ch.clock != null ? play.ch.clock * DAY_SEC : s.dayT };
    c.setTransform(3, 0, 0, 3, 0, 0);
    if (l.bg === 2) drawEditHD(c, ss, t, true, 3); else if (FloorsHD.has(l.bg)) FloorsHD.draw(l.bg, c, ss, t, true, 3);
    c.setTransform(3, 0, 0, 3, 0, 0);
    if (l.fx === 'night' || l.fx === 'rain') { c.fillStyle = 'rgba(10,16,64,.42)'; c.fillRect(0, 0, 640, 128); }
    if (l.fx === 'rain') { c.fillStyle = 'rgba(180,210,255,.55)'; for (let i = 0; i < 70; i++) { const x = (i * 53 + t * 260) % 680 - 20, y = (i * 37 + t * 420) % 150 - 20; c.fillRect(x, y, 1, 7); } }
    if (l.fx === 'alarm' && Math.floor(t * 2) % 2) { c.fillStyle = '#e43b44'; c.fillRect(0, 0, 640, 3); c.fillRect(0, 125, 640, 3); c.fillRect(0, 0, 3, 128); c.fillRect(637, 0, 3, 128); }
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (l.who && l.who !== 'me') drawPortrait(pc, l.who, 4, t);
    const n = Math.min(play.txt.length, Math.floor((now - play.t0) / 1000 * 40)), txt = play.txt.slice(0, n);
    if ($s('svt').textContent !== txt) $s('svt').textContent = txt;
  }
  $s('storyv').addEventListener('click', e => { if (!e.target.closest('button')) next(); });
  $s('svskip').onclick = () => { if (!play) return; play.i = play.lines.length - 1; show(); play.t0 = -1e9; };
  $s('svok').onclick = () => { const ch = play && play.ch; if (ch && stStatus(getS(), ch) === 'new') bus.emit('storyGo', ch.id); stop(); open(); };
  $s('svmini').onclick = () => { const ch = play && play.ch; if (ch && stStatus(getS(), ch) === 'new') bus.emit('storyGo', ch.id); stop(); bus.emit('storyMini', ch.mis.g); };
  $s('stok').onclick = () => { close(); bus.emit('storyClose'); };
  $s('storyb').onclick = open;
  return {
    open,
    busy: () => !$s('story').hidden || !$s('storyv').hidden,
    refresh(s) { // 머리 버튼(📖) 표시·빨간 점, 목록이 열려 있으면 진행도 갱신
      const on = s.total >= STORY[0].at, sts = STORY.map(ch => stStatus(s, ch)), dot = sts.some(x => x === 'new' || x === 'claim');
      $s('storyb').hidden = !on; $s('storyb').classList.toggle('dot', dot);
      const key = sts.join() + '|' + STORY.map(ch => stProg(s, ch).join('/')).join();
      if (!$s('story').hidden && key !== lastKey) list(); lastKey = key;
      return sts;
    },
  };
}
