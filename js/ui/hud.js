import { RANKS, UPGRADES, MILESTONES, MANAGER, CHIEF, ACHIEVEMENTS, DAY_SEC, CARDS, RARITY, WEEKLY, ODDS, PITY, TIERS, CHALLENGES, RIVAL, DILEMMAS, SCOOP_P, RESEARCH, DECOS, JOBS, jobOf, careerOf, CAREER_AT } from '../data/config.js';
import { weekEvent, heroCount } from '../systems/weekly.js';
import { progress, missionText } from '../systems/missions.js';
import { seasonPts, tierOf, themeOf } from '../systems/season.js';
import { TUTORIAL } from './tutorial.js';
import { rank, perSec, prestigeGain, prestigeBonus, rates, bulk, mult, cardBonus, rl } from '../systems/economy.js';
import { checkName, isBlocked } from '../systems/nameFilter.js';
import { scoutCost } from '../systems/cards.js';
import { UNLOCKS, isUnlocked } from '../data/tips.js';
const $ = id => document.getElementById(id);
// 큰 수 표기: 만·억·조·경·해, 100 이상이면 소수점 없이 (예: 1000조, 12.5억)
const UNITS = [[1e20, '해'], [1e16, '경'], [1e12, '조'], [1e8, '억'], [1e4, '만']];
export const fmt = n => { n = Math.floor(n); for (const [v, u] of UNITS) if (n >= v) { const x = n / v; return (x >= 100 ? Math.floor(x).toLocaleString('ko-KR') : x.toFixed(1).replace(/\.0$/, '')) + u; } return n.toLocaleString('ko-KR'); };
const FLOORS = [['취재', '카메라 기자 · 취재 기자', 'crew'], ['인제스트', '인제스트실', 'ing'], ['편집', '영상편집기자', 'edit'], ['CG', '그래픽 디자이너', 'cg'], ['송출', '뉴스 스튜디오 · 방송 엔지니어', 'out'], ['중계 장비', '중계 차량 · 리포터', 'live'], ['방송 품질', '화질 · 시청률', 'qual']];
const byId = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
const floorHtml = i => `<section class="panel floor" id="fl${i}"><div class="fh"><div><b>${FLOORS[i][0]}</b><i class="mj" id="mj${i}" hidden>주력</i><i class="bnb" id="bnb${i}" hidden>병목</i> <small>${FLOORS[i][1]}</small><div class="cnt" id="c${i}"></div></div><div class="bs"><button class="btn mini" data-id="${FLOORS[i][2]}" id="fb${i}"></button>${i < 5 ? `<button class="btn mini" data-hire="${i}" id="mb${i}"></button>` : ''}</div></div><div class="ms"><i id="m${i}"></i></div><canvas width="320" height="64"></canvas></section>`;
// View: DOM을 만들고 갱신만 한다. 사용자 입력은 버스 이벤트로만 내보낸다
export function Hud(bus) {
  $('floors').innerHTML = [0, 1, 2, 3, 4].map(floorHtml).join(''); $('hq').innerHTML = [5, 6].map(floorHtml).join('');
  const click = e => { const b = e.target.closest('[data-id],[data-hire]'); if (!b || b.disabled) return; if (b.dataset.id) bus.emit('buy', b.dataset.id); else bus.emit('hire', +b.dataset.hire); };
  $('floors').onclick = click; $('hq').onclick = click;
  $('seg').onclick = e => { const b = e.target.closest('[data-n]'); if (b) bus.emit('setn', b.dataset.n); };
  $('ach').innerHTML = ACHIEVEMENTS.map(() => '<i></i>').join(''); $('gold').onclick = () => bus.emit('gold'); $('spdb').onclick = () => bus.emit('spd');
  let selCard = 0, armedCh = '', armT, cur = null, bd = null, view = 'all', pg = 0, PG = 10, tab = 'desk', hiId = null, tutShown = -2;
  // 탭: 보도국 / 스카우트 / 순위 / 성장. 마지막으로 연 탭을 이 브라우저에 기억한다
  // 잠긴 탭: 해당 기능이 해금돼야 열린다
  const TAB_UNL = { scout: 'scout', grow: 'grow', rank: 'rank', br: 'br' }, need = id => UNLOCKS.find(u => u.id === id);
  let gsub = 'car';
  function showSub(g) {
    gsub = g; document.querySelectorAll('#gsub [data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === g));
    document.querySelectorAll('.pane[data-tab="grow"] section[data-g]').forEach(p => { p.classList.toggle('gh', p.dataset.g !== g); });
  }
  function showTab(t, g) {
    if (cur && TAB_UNL[t] && !isUnlocked(cur, TAB_UNL[t])) { const u = need(TAB_UNL[t]); toastL(`누적 ${fmt(u.at)}점이 되면 열려요.`); return; }
    if (g) showSub(g);
    tab = t; document.querySelectorAll('.pane').forEach(p => { p.hidden = p.dataset.tab !== t; });
    document.querySelectorAll('#tabs [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    try { localStorage.setItem('newsDesk.tab', t); } catch (e) { }
    if (window.scrollTo) window.scrollTo(0, 0);
  }
  try { tab = localStorage.getItem('newsDesk.tab') || 'desk'; } catch (e) { }
  $('tabs').onclick = e => { const b = e.target.closest('[data-t]'); if (b) showTab(b.dataset.t); };
  $('gsub').onclick = e => { const b = e.target.closest('[data-g]'); if (b && !b.hidden) showSub(b.dataset.g); };
  let rateOpen = false; try { rateOpen = localStorage.getItem('newsDesk.rateOpen') === '1'; } catch (e) { }
  const setRate = o => { rateOpen = o; $('ratex').hidden = !o; $('rateh').setAttribute('aria-expanded', o); $('rate').classList.toggle('open', o); try { localStorage.setItem('newsDesk.rateOpen', o ? '1' : '0'); } catch (e) { } };
  $('rateh').onclick = () => setRate(!rateOpen); setRate(rateOpen);
  let tt0; const toastL = m => { const e = $('toast'); e.textContent = m; clearTimeout(tt0); tt0 = setTimeout(() => e.textContent = '', 3000); };
  $('tutnext').onclick = () => { if (!cur) return; const n = cur.tut + 1; bus.emit('tut', n >= TUTORIAL.length ? -1 : n); };
  $('tutskip').onclick = () => bus.emit('tut', -1);
  $('helpb').onclick = () => bus.emit('tut', 0);
  $('clist').innerHTML = CHALLENGES.map((c, i) => `<div class="wg"><div class="row2"><span><b>${c.n}</b><br><small>${c.d}</small></span><span id="chp${i}"></span><button class="btn mini" data-ch="${c.id}" id="chb${i}"></button></div><div class="ms"><i id="chm${i}"></i></div></div>`).join('');
  $('clist').onclick = e => { // 두 번 눌러야 실행 (회차 초기화가 일어나므로)
    const b = e.target.closest('[data-ch]'); if (!b || b.disabled || !cur) return; const id = b.dataset.ch, key = (cur.chal === id ? 'q' : '') + id;
    if (armedCh !== key) { armedCh = key; clearTimeout(armT); armT = setTimeout(() => { armedCh = ''; }, 3000); return; }
    armedCh = ''; bus.emit(key[0] === 'q' ? 'chalquit' : 'chal', id);
  };
  $('lbseg').onclick = e => { const b = e.target.closest('[data-v]'); if (b) { view = b.dataset.v; pg = 0; drawBoard(); } };
  const lbList = () => !bd ? [] : view === 'season' ? bd.list.filter(e => e.season === bd.season).sort((a, b) => b.seasonPts - a.seasonPts).slice(0, 100) : [...bd.list].sort((a, b) => b.rankScore - a.rankScore).slice(0, 100);
  $('lbprev').onclick = () => { pg--; drawBoard(); }; $('lbnext').onclick = () => { pg++; drawBoard(); };
  $('lbme').onclick = () => { if (!bd) return; const i = lbList().findIndex(e => e.uid === bd.me); if (i >= 0) { pg = Math.floor(i / PG); drawBoard(); } else { const r = bd.my && bd.my[view]; toastL(r ? `내 순위는 ${r}위예요. 100위 안에 들면 목록에 보여요.` : '아직 순위에 기록이 없어요.'); } };
  function drawBoard() { // 다른 사용자의 이름은 textContent로만 넣는다 (XSS 방지)
    document.querySelectorAll('#lbseg [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    if (!bd) return; const { me, mode, season } = bd;
    const list = lbList(), pages = Math.max(1, Math.ceil(list.length / PG)); pg = Math.max(0, Math.min(pg, pages - 1));
    const ol = $('lb'); ol.replaceChildren(); ol.start = pg * PG + 1;
    list.slice(pg * PG, pg * PG + PG).forEach((e, j) => { const i = pg * PG + j;
      const li = document.createElement('li'), n = document.createElement('b'), d = document.createElement('small'); if (e.uid === me) li.className = 'me';
      n.textContent = `${i + 1}. ${isBlocked(e.name) ? '(숨김)' : String(e.name).slice(0, 12)}${e.sample ? ' (샘플)' : ''}`;
      d.textContent = view === 'season' ? `시즌 ${TIERS[tierOf(e.seasonPts)].n} · 시즌 점수 ${fmt(e.seasonPts)}` : `순위점수 ${e.rankScore} · 누적 ${fmt(e.total)}점 · 최대 Lv.${e.maxLv} · 최고 시청률 ${e.bestRating.toFixed(1)}% · 유튜브 ${fmt(e.views)}회`;
      li.append(n, d); ol.append(li);
    });
    $('lbpn').textContent = `${pg + 1} / ${pages}`; $('lbprev').disabled = pg <= 0; $('lbnext').disabled = pg >= pages - 1; $('lbpg').hidden = list.length <= PG && !list.some(e => e.uid === me) && !(bd.my && bd.my[view]);
    { const r = bd.my && bd.my[view], i = list.findIndex(e => e.uid === me); $('lbmy').textContent = i >= 0 ? `내 순위 ${i + 1}위` : r ? `내 순위 ${r}위` : ''; }
    if (!list.length) { const li = document.createElement('li'); li.textContent = '아직 이번 시즌 기록이 없어요.'; ol.append(li); }
    $('lbn').textContent = { db: '공유 순위 (이 페이지를 연 사용자끼리)', server: '온라인 순위 (모든 플레이어)', local: '오프라인 모드: 샘플 방송국과 비교 중이에요. 서버를 연결하면 사용자 간 순위가 돼요.' }[mode];
  }
  { const p = x => +(x * 100).toFixed(1) + '%'; $('odds').textContent = `확률 꽝 ${p(1 - ODDS.reduce((a, b) => a + b, 0))} · ${RARITY.map((r, i) => `${r.n} ${p(ODDS[i])}`).join(' · ')} · ${PITY}번째는 영웅 이상 보장`; }
  $('wlist').innerHTML = WEEKLY.map((g, i) => `<div class="wg"><div class="row2"><span>${g.n}</span><span id="wp${i}"></span><button class="btn mini" data-goal="${g.id}" id="wb${i}">받기</button></div><div class="ms"><i id="wm${i}"></i></div></div>`).join('');
  $('mlist').innerHTML = [0, 1, 2].map(i => `<div class="wg"><div class="row2"><span id="mt${i}"></span><span id="mp${i}"></span></div><div class="ms"><i id="mm${i}"></i></div></div>`).join('');
  $('rlist').innerHTML = RESEARCH.map((r, i) => `<div class="wg"><div class="row2"><span><b>${r.n}</b> <small id="rlv${i}"></small><br><small>${r.d}</small></span><button class="btn mini" data-res="${r.id}" id="rb${i}"></button></div><div class="ms"><i id="rm${i}"></i></div></div>`).join('');
  $('rlist').onclick = e => { const b = e.target.closest('[data-res]'); if (b && !b.disabled) bus.emit('research', b.dataset.res); };
  $('dlist').innerHTML = DECOS.map((d, i) => `<div class="wg"><div class="row2"><span>${d.n}<br><small id="dn${i}"></small></span><button class="btn mini" data-deco="${d.id}" id="db${i}"></button></div></div>`).join('');
  $('dlist').onclick = e => { const b = e.target.closest('[data-deco]'); if (b && !b.disabled) bus.emit('deco', b.dataset.deco); };
  let carJob = '';
  $('prok').onclick = () => { $('promo').hidden = true; };
  $('pok').onclick = () => { $('paper').hidden = true; }; $('pad').onclick = () => bus.emit('paperad');
  $('dilR').onclick = () => bus.emit('judge', 'risk'); $('dilS').onclick = () => bus.emit('judge', 'safe');
  $('wlist').onclick = e => { const b = e.target.closest('[data-goal]'); if (b && !b.disabled) bus.emit('goal', b.dataset.goal); };
  $('scoutb').onclick = () => bus.emit('scout', 'paid'); $('scouta').onclick = () => bus.emit('scout', 'free');
  $('cards').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); selCard = Math.floor((e.clientY - r.top) / r.height * 4) * 4 + Math.floor((e.clientX - r.left) / r.width * 4); };
  $('hist').innerHTML = '<i></i>'.repeat(7); $('boardb').onclick = () => bus.emit('board');
  let jobSel = 'editor';
  const showJob = () => { document.querySelectorAll('#jobs button').forEach(b => b.classList.toggle('on', b.dataset.job === jobSel)); const j = JOBS.find(x => x.id === jobSel); $('jobd').textContent = `${j.d} · ${j.perk}`; };
  $('jobs').innerHTML = JOBS.map(j => `<button type="button" data-job="${j.id}">${j.n}</button>`).join('');
  $('jobs').onclick = e => { const b = e.target.closest('[data-job]'); if (b) { jobSel = b.dataset.job; showJob(); } };
  $('startb').onclick = () => { const r = checkName($('nameIn').value); if (r.err) { $('nameErr').textContent = r.err; return; } bus.emit('name', { name: r.name, job: jobSel }); };
  $('nameIn').onkeydown = e => { if (e.key === 'Enter') $('startb').click(); };
  $('cancelb').onclick = () => { $('start').hidden = true; }; $('renameb').onclick = () => { $('setm').hidden = true; bus.emit('rename'); };
  $('chiefb').onclick = () => bus.emit('chief'); $('evb').onclick = () => bus.emit('boost'); $('mute').onclick = () => bus.emit('mute');
  $('offOk').onclick = () => bus.emit('claim', 1); $('offAd').onclick = () => bus.emit('claim', 2);
  const armed = (id, label, evt) => { const b = $(id); let t; b.onclick = () => { if (b.dataset.a) { clearTimeout(t); delete b.dataset.a; b.textContent = label; bus.emit(evt); return; } b.dataset.a = 1; b.textContent = '한 번 더'; t = setTimeout(() => { delete b.dataset.a; b.textContent = label; }, 3000); }; };
  armed('presb', '개편', 'prestige'); armed('resetb', 'RESET', 'reset');
  showSub(gsub); showTab('desk'); // 항상 보도국에서 시작
  let tt;
  return {
    showTab, canvases: [...document.querySelectorAll('.floor canvas')], cardCanvas: $('cards'), sel: () => selCard,
    askName(cur = '', job = 'editor') { jobSel = job || 'editor'; showJob(); $('nameIn').value = cur; $('nameErr').textContent = ''; $('cancelb').hidden = !cur; $('startb').textContent = cur ? '저장' : '방송 시작'; $('start').hidden = false; setTimeout(() => $('nameIn').focus(), 0); },
    closeName() { $('start').hidden = true; },
    board(list, me, mode, season, my) { bd = { list, me, mode, season, my }; drawBoard(); },
    toast(m) { const e = $('toast'); e.textContent = m; clearTimeout(tt); tt = setTimeout(() => e.textContent = '', 3500); },
    offline(o) { $('offd').textContent = `${o.min}분 동안 야간 근무로 ${fmt(o.n)}점을 벌었어요.`; $('offline').hidden = false; },
    showPaper(p) { $('pmast').textContent = p.mast; $('pno').textContent = p.no; $('phead').textContent = p.head; $('pfoot').textContent = p.foot; $('psubs').innerHTML = ''; p.subs.forEach(t => { const li = document.createElement('li'); li.textContent = t; $('psubs').appendChild(li); }); $('pad').disabled = false; $('pad').textContent = '광고 보고 수입 2배'; $('paper').hidden = false; },
    showPromo(i, name, s, tk) { const c = careerOf(s)[i]; tk = tk || c.tk; $('prt').textContent = `${name}님을 ${c.n}(으)로 임명합니다.`; $('prwho').textContent = c.who; $('prsay').textContent = c.say.join(' '); $('prrew').textContent = `보상: 영구 점수 +5%/직급 · 스카우트 티켓 ${tk}장`; $('promo').hidden = false; },
    showTip(t) { $('tipt').textContent = t.t; $('tipd').textContent = t.d; $('tipgo').hidden = !t.tab; $('tip').hidden = false; },
    hideTip() { $('tip').hidden = true; },
    tipOpen: () => !$('tip').hidden,
    cloud(code, at) { $('cloudc').hidden = !code; $('cloudcp').hidden = !code; if (code) $('cloudc').textContent = code; $('cloudt').textContent = at ? `저장 ${new Date(at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : ''; $('cloudn').textContent = code ? '복구 코드는 이 기록의 열쇠예요. 다른 사람에게 알려 주지 마세요.' : '순위 서버에 방송국이 등록되면 2분마다 자동으로 저장돼요.'; },
    paperReady(on) { $('pnew').hidden = !on; },
    paperAdDone() { $('pad').disabled = true; $('pad').textContent = '받음'; },
    hideOffline() { $('offline').hidden = true; },
    setMute(on) { $('mute').textContent = on ? 'SOUND ON' : 'SOUND OFF'; },
    render(s) {
      cur = s;
      const r = rates(s); let w = -1, wv = 4.99;
      $('score').textContent = fmt(s.score); $('ps').textContent = `+${fmt(perSec(s))}/s`;
      { const rk = rank(s), nx = RANKS[rk + 1]; $('rank').textContent = `${RANKS[rk].n} (x${2 ** rk})` + (nx ? ` → ${nx.n} ${fmt(nx.at - s.run)}점` : ' · 최종 단계'); $('rkb').style.width = (nx ? (s.run - RANKS[rk].at) / (nx.at - RANKS[rk].at) * 100 : 100) + '%'; } $('pt').textContent = s.pts > 0 ? `개편 x${prestigeBonus(s).toFixed(2)}` : '';
      document.querySelectorAll('#seg [data-n]').forEach(b => b.classList.toggle('on', b.dataset.n === s.buyN));
      const U_ = id => isUnlocked(s, id);
      $('spdb').hidden = !U_('spd'); $('misp').hidden = !U_('mis'); $('hqsec').hidden = !U_('hq'); $('flc').hidden = !U_('chief');
      for (const [t, id] of Object.entries(TAB_UNL)) $('tab-' + t).classList.toggle('lock', !U_(id));
      document.querySelectorAll('#gsub [data-g]').forEach(b => { const g = b.dataset.g; b.hidden = g === 'res' ? !U_('res') : g === 'deco' ? !U_('deco') : g === 'pres' ? !(U_('pres') || s.pts > 0) : false; });
      if ($('gsub').querySelector(`[data-g="${gsub}"]`).hidden) showSub('car');
      for (let i = 1; i < 5; i++) if (s.q[i] > wv) { wv = s.q[i]; w = i; }
      FLOORS.forEach(([n, sub, id], i) => {
        const u = byId[id], l = s.lv[id], { k, total } = bulk(s, u, s.buyN), nx = MILESTONES.find(m => m > l) || 100, pv = MILESTONES.filter(m => m <= l).pop() || 0, tier = MILESTONES.filter(m => l >= m).length;
        const info = i === 0 ? `${r[0].toFixed(1)}/s` : i < 5 ? `대기 ${Math.floor(s.q[i])}` : `${id === 'live' ? '속보 보상' : '점수'} x${mult(s, u).toFixed(2)}`;
        $('c' + i).textContent = `${info} ${'★'.repeat(tier)}`;
        $('fb' + i).textContent = `Lv.${l} +${k} ${fmt(total)}`; $('fb' + i).classList.toggle('can', s.score >= total);
        $('m' + i).style.width = Math.min(100, (l - pv) / (nx - pv) * 100) + '%'; $('fl' + i).classList.toggle('bn', i === w);
        if (i < 5) { const b = $('mb' + i); b.hidden = !U_('mg'); b.textContent = s.mg[i] ? '매니저 ✓' : `매니저 ${fmt(MANAGER[i])}`; b.disabled = !!s.mg[i]; b.classList.toggle('can', !s.mg[i] && s.score >= MANAGER[i]); }
        $('bnb' + i).hidden = i !== w;
      });
      { // 추천: 병목 층 업그레이드 → 병목 층 매니저 → 살 수 있는 가장 싼 층 순서로 하나만 반짝인다
        const can = id => { const b = $(id); return b && !b.hidden && !b.disabled && b.classList.contains('can'); };
        let rec = null;
        if (w > 0 && can('fb' + w)) rec = 'fb' + w; else if (w > 0 && can('mb' + w)) rec = 'mb' + w;
        else { let best = Infinity; [0, 1, 2, 3, 4, 5, 6].forEach(i => { if (i >= 5 && !U_('hq')) return; const u = byId[FLOORS[i][2]], c = bulk(s, u, s.buyN).total; if (can('fb' + i) && c < best) { best = c; rec = 'fb' + i; } }); }
        document.querySelectorAll('.btn.rec').forEach(b => { if (b.id !== rec) b.classList.remove('rec'); }); if (rec) $(rec).classList.add('rec');
      }
      $('chiefb').textContent = s.chief ? '고용 완료' : `고용 ${fmt(CHIEF)}`; $('chiefb').disabled = !!s.chief; $('chiefb').classList.toggle('can', !s.chief && s.score >= CHIEF);
      const g = $('gold'); g.hidden = !s.gold; if (s.gold) { g.style.left = s.gold.x + '%'; g.style.top = s.gold.y + '%'; }
      const on = s.clock < s.spdEnd, cd = s.clock < s.spdReady;
      $('spdb').textContent = on ? `속도 x2 부스트 ${Math.ceil(s.spdEnd - s.clock)}초` : cd ? `부스트 대기 ${Math.ceil(s.spdReady - s.clock)}초` : '광고 보고 속도 x2 (2분)'; $('spdb').disabled = cd;
      document.querySelectorAll('#ach i').forEach((e, i) => e.classList.toggle('on', s.ach.includes(ACHIEVEMENTS[i].id)));
      const na = ACHIEVEMENTS.find(a => !s.ach.includes(a.id)); $('achn').textContent = na ? `다음 업적: ${na.n} · ${na.d}` : '모든 업적을 달성했어요!';
      $('achd').textContent = `${s.ach.length}/${ACHIEVEMENTS.length} · 점수 +${s.ach.length * 2}%`;
      const CR = careerOf(s), JB = jobOf(s);
      $('sname').textContent = s.name ? `${s.name} · ${CR[s.career || 0].n}` : '';
      for (let i = 0; i < 5; i++) $('mj' + i).hidden = i !== JB.st;
      if (carJob !== JB.id) { carJob = JB.id; $('carl').innerHTML = CR.map(c => `<li>${c.n}${c.nd ? ` <small>(${c.nd})</small>` : ''}</li>`).join(''); }
      { // 커리어
        const ci = s.career || 0, nx = CR[ci + 1];
        $('carn').textContent = CR[ci].n; $('card').textContent = `${JB.n} · 영구 점수 +${ci * 5}%`;
        // 다음 승진까지: 이전 기준~다음 기준 사이를 로그 눈금으로 (점수는 몇 배씩 오르므로)
        const lo = ci ? CAREER_AT[ci - 1] : 1, hi = CAREER_AT[ci], pr = nx ? Math.max(0, Math.min(1, Math.log(Math.max(1, s.total) / lo) / Math.log(hi / lo))) : 1;
        $('carb').style.width = pr * 100 + '%';
        $('carx').textContent = (nx ? `다음: ${nx.n} · 누적 ${fmt(s.total)} / ${fmt(hi)}점 (${Math.floor(pr * 100)}%)` : '최고 직급에 올랐어요!') + ` · 특기: ${JB.perk}`;
        document.querySelectorAll('#carl li').forEach((li, i) => { li.className = i === ci ? 'now' : i < ci ? 'on' : ''; });
      }
      { // 주간 한정 이벤트
        const we = weekEvent(s), w = s.wev; $('wevp').hidden = !we || !U_('week');
        if (we) {
          const left = Math.max(1, Math.ceil((Date.parse(w.key + 'T00:00:00') + 7 * 864e5 - Date.now()) / 864e5)), p = Math.min(we.goal, w.p);
          $('wevn').textContent = we.n; $('wevt').textContent = we.d + (we.ev === 'robot' ? ` · 보유 히어로 ${heroCount(s)}명` : ''); $('wevd').textContent = w.done ? '달성 완료!' : `종료까지 ${left}일`;
          $('wevg').textContent = we.gd; $('wevp2').textContent = `${p}/${we.goal}`; $('wevm').style.width = p / we.goal * 100 + '%';
        }
      }
      const hr = 6 + 14 * s.dayT / DAY_SEC, hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60);
      { const left = Math.ceil(DAY_SEC - s.dayT); $('clock').textContent = ` ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} 후 방송`; } $('dayb').style.width = s.dayT / DAY_SEC * 100 + '%';
      $('rnow').textContent = s.lastRating ? `${s.lastRating.toFixed(1)}%` : '-';
      $('rdiff').textContent = s.lastRating && s.prevRating ? ` ${s.lastRating >= s.prevRating ? '▲' : '▼'}${Math.abs(s.lastRating - s.prevRating).toFixed(1)}` : '';
      document.querySelectorAll('#hist i').forEach((b, i) => { const v = s.hist[s.hist.length - 7 + i] || 0; b.style.height = Math.min(100, v / 20 * 100) + '%'; });
      $('rnote').textContent = `최고 시청률 ${s.bestRating.toFixed(1)}% · 유튜브 조회수 ${fmt(s.views)}${s.lastViews ? ` (전일 +${fmt(s.lastViews)})` : ''} · 오늘 송출 ${Math.floor(s.dOut)}건`;
      { // 라이벌 대결
        const rp = s.report, w = s.win || 0;
        $('vs').innerHTML = '';
        const line = (t, cls) => { const e = document.createElement('div'); e.textContent = t; if (cls) e.className = cls; $('vs').appendChild(e); };
        if (rp && rp.rival != null) { line(`VS ${RIVAL} ${rp.rival.toFixed(1)}% → ${rp.won ? '승리!' : '패배'}`, rp.won ? 'w' : 'l'); line(w ? `${w}연승 중 · 오늘 이기면 광고 수입 x${(1.4 + .1 * Math.min(w + 1, 10)).toFixed(1)}` : `오늘 8시에 ${RIVAL}을(를) 이기면 광고 수입 x1.5`); }
        else line(`오늘 8시 뉴스에서 라이벌 ${RIVAL}과 시청률 대결!`);
        if (s.dAdj) line(`오늘 단독 보도 효과: 시청률 ${s.dAdj > 0 ? '+' : ''}${s.dAdj.toFixed(1)}`, s.dAdj > 0 ? 'w' : 'l');
      }
      if (s.mis) {
        s.mis.list.forEach((m, i) => { const p = progress(s, m); $('mt' + i).textContent = (m.done ? '✓ ' : '') + missionText(m, fmt); $('mp' + i).textContent = m.done ? '완료' : `${fmt(p)}/${fmt(m.goal)}`; $('mm' + i).style.width = p / m.goal * 100 + '%'; });
        const nd = s.mis.list.filter(m => m.done).length; $('misd').textContent = s.mis.all ? '올클리어! 내일 새 미션' : `${nd}/3 · 모두 달성 시 티켓 +1`;
      }
      { // 데스크 판단: 보도국 탭에서만, 다른 창이 없을 때 작게
        const d = s.ev && s.ev.dil && !s.ev.pick && tab === 'desk' && $('tut').hidden && $('tip').hidden && !document.querySelector('.modal:not([hidden])'); $('dilp').hidden = !d;
        if (d) { const pr = Math.round((SCOOP_P + .04 * rl(s, 'scoop') + (jobOf(s).scoop || 0)) * 100); $('dilt').textContent = DILEMMAS[s.ev.id] || '확인되지 않은 제보가 들어왔어요.'; $('dils').textContent = `${Math.max(0, Math.ceil(s.ev.dilEnd - s.clock))}초`; $('dilR').textContent = `단독 송출 (성공 ${pr}%)`; $('dilh').textContent = '단독 성공: 점수 x2 · 시청률 +0.8 / 오보: 시청률 -1.2 · 확인: 점수 x1.2 (시간이 지나면 자동 확인)'; }
      }
      let resOk = false;
      RESEARCH.forEach((r, i) => {
        const l = rl(s, r.id), c = r.c * (l + 1), lock = r.req && rl(s, r.req[0]) < r.req[1], max = l >= r.max, b = $('rb' + i), ok = !max && !lock && s.rp >= c;
        $('rlv' + i).textContent = `Lv.${l}/${r.max}` + (lock ? ` · ${RESEARCH.find(x => x.id === r.req[0]).n} Lv.${r.req[1]} 필요` : '');
        b.textContent = max ? '완료' : lock ? '잠김' : `RP ${c}`; b.disabled = !ok; b.classList.toggle('can', ok); $('rm' + i).style.width = l / r.max * 100 + '%'; resOk = resOk || ok;
      });
      $('rpd').textContent = `연구 포인트 ${s.rp}`;
      let decoOk = false;
      DECOS.forEach((d, i) => {
        const own = s.deco[d.id], b = $('db' + i), ok = !own && (d.need ? d.need(s) : s.score >= d.at);
        $('dn' + i).textContent = own ? '배치됨 · 점수 +2%' : d.need ? `해금 조건: ${d.nt}` : '';
        b.textContent = own ? '✓' : d.need ? (ok ? '받기' : '잠김') : `${fmt(d.at)}점`; b.disabled = !ok; b.classList.toggle('can', ok); if (ok && d.need) decoOk = true;
      });
      $('dcd').textContent = `${Object.keys(s.deco).length}/${DECOS.length} · 점수 +${Object.keys(s.deco).length * 2}%`;
      $('dot-grow').hidden = !(U_('grow') && ((resOk && U_('res')) || (decoOk && U_('deco'))));
      const ncard = Object.keys(s.cards).length, scost = scoutCost(s), adcd = s.clock < s.freeReady;
      $('scd').textContent = `카드 ${ncard}/${CARDS.length} · 티켓 ${s.tickets}장 · 영웅 보장까지 ${Math.max(0, PITY - s.pity)}회`;
      $('scoutb').textContent = `스카우트 ${fmt(scost)}점`; $('scoutb').classList.toggle('can', s.score >= scost);
      $('scouta').textContent = s.tickets > 0 ? `티켓 사용 (${s.tickets}장)` : adcd ? `광고 스카우트 ${Math.ceil(s.freeReady - s.clock)}초` : '광고 보고 무료 스카우트'; $('scouta').disabled = s.tickets < 1 && adcd;
      const c0 = CARDS[selCard] || CARDS[0], n0 = s.cards[c0.id] || 0;
      $('cinfo').textContent = n0 ? `${c0.n} · ${RARITY[c0.rar].n} · ${c0.st < 0 ? '전 층' : FLOORS[c0.st][0]} 속도 +${Math.round(RARITY[c0.rar].b * (1 + .5 * (n0 - 1)) * 100)}% · ★${n0}${c0.hero ? ' · 뉴스 디펜더즈: 거대 로봇 속보 점수 +50%' : ''}${n0 < 3 ? ` · 한 장 더 나오면 ★${n0 + 1} ${n0 === 1 ? '은빛 외형' : '금빛 외형'}` : ' · 최고 등급 외형'}` : (c0.hero ? '??? · 전설의 히어로. 거대 로봇이 나타나면 출동해요.' : '??? · 아직 모르는 직원이에요. 카드를 눌러 확인해 보세요.');
      $('cbonus').textContent = '도감 보너스 ' + FLOORS.slice(0, 5).map(([n], i) => `${n} +${Math.round(cardBonus(s, i) * 100)}%`).join(' · ');
      WEEKLY.forEach((g, i) => { const p = Math.min(g.goal, s.week.prog[g.k] || 0), dn = s.week.done[g.id], b = $('wb' + i); $('wp' + i).textContent = `${p}/${g.goal}`; $('wm' + i).style.width = p / g.goal * 100 + '%'; b.textContent = dn ? '완료' : '받기'; b.disabled = !!dn || p < g.goal; b.classList.toggle('can', !dn && p >= g.goal); });
      $('wkd').textContent = `출석 ${s.login.streak}일째 · 7일 연속 시 티켓`;
      if (s.chal === 'noMgr') { for (let i = 0; i < 5; i++) if (!s.mg[i]) { const b = $('mb' + i); b.textContent = '매니저 금지'; b.disabled = true; b.classList.remove('can'); } if (!s.chief) { $('chiefb').textContent = '고용 금지'; $('chiefb').disabled = true; $('chiefb').classList.remove('can'); } }
      $('fb6').disabled = s.chal === 'noQual'; if (s.chal === 'noQual') { $('fb6').textContent = '구매 금지 (챌린지)'; $('fb6').classList.remove('can'); }
      if (s.season.key) {
        const sk = s.season.key, th = themeOf(sk), sp = seasonPts(s), ti = tierOf(sp), nx = TIERS[ti + 1], now = new Date(), left = new Date(now.getFullYear(), now.getMonth() + 1, 1) - now;
        $('sn').textContent = `${+sk.slice(5)}월 시즌 · ${th ? th.n : ''}`; $('sleft').textContent = `종료까지 ${Math.max(1, Math.ceil(left / 864e5))}일`;
        $('sth').textContent = th ? th.d : '';
        $('stier').textContent = TIERS[ti].n; $('spts').textContent = ` 시즌 점수 ${fmt(sp)}` + (nx ? ` · ${nx.n}까지 ${fmt(nx.at - sp)}` : ' · 최고 등급');
        $('sbar').style.width = (nx ? (sp - TIERS[ti].at) / (nx.at - TIERS[ti].at) * 100 : 100) + '%';
        const ls = s.lastSeason; $('slast').textContent = ls ? `지난 시즌(${+ls.key.slice(5)}월) ${TIERS[ls.tier].n} · 티켓 ${ls.tk}장 지급` : '시즌이 끝나면 등급에 따라 스카우트 티켓 1~5장을 받아요.';
      }
      CHALLENGES.forEach((c, i) => {
        const done = s.chalDone[c.id], on = s.chal === c.id, b = $('chb' + i);
        b.textContent = done ? '완료 ✓' : (armedCh === (on ? 'q' : '') + c.id) ? '한 번 더' : on ? '포기' : '도전'; b.disabled = !!done;
        $('chm' + i).style.width = (done ? 100 : on ? Math.min(100, s.run / c.goal * 100) : 0) + '%';
        $('chp' + i).textContent = done ? '' : on ? `${fmt(s.run)}/${fmt(c.goal)}` : '';
      });
      { const nd = Object.keys(s.chalDone).length; $('chd').textContent = s.chal ? `진행 중: ${CHALLENGES.find(c => c.id === s.chal).n}` : `완료 ${nd}/${CHALLENGES.length} · 점수 +${nd * 10}%`; }
      $('dot-scout').hidden = !U_('scout') || !(s.tickets > 0 || s.clock >= s.freeReady || WEEKLY.some(g => !s.week.done[g.id] && (s.week.prog[g.k] || 0) >= g.goal));
      const ts = s.tut, showT = !!s.name && ts >= 0 && ts < TUTORIAL.length && $('start').hidden, tgt = showT ? TUTORIAL[ts].target : null;
      $('tut').hidden = !showT;
      if (tgt !== hiId) { if (hiId && $(hiId)) $(hiId).classList.remove('tut-hi'); if (tgt && $(tgt)) $(tgt).classList.add('tut-hi'); hiId = tgt; }
      if (!showT) tutShown = -2;
      else {
        const step = TUTORIAL[ts];
        if (ts !== tutShown) {
          tutShown = ts; if (step.tab) showTab(step.tab);
          $('tutt').textContent = step.t; $('tutn').textContent = `${ts + 1}/${TUTORIAL.length}`; $('tutnext').textContent = ts === TUTORIAL.length - 1 ? '시작하기' : '다음';
          const el = tgt && $(tgt); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
        if (step.done && step.done(s, { tab })) bus.emit('tut', ts + 1 >= TUTORIAL.length ? -1 : ts + 1);
      }
      $('alert').hidden = !s.ev;
      if (s.ev) { $('evt').textContent = `속보 · ${s.ev.name}`; $('evd').textContent = `${s.ev.k} · 유입 x${s.ev.inf} · 점수 x${s.ev.sc}${s.ev.boost ? ' (+50%)' : ''} · ${Math.max(0, Math.ceil(s.ev.end - s.clock))}초`; $('evb').disabled = s.ev.boost; $('evb').textContent = s.ev.boost ? '편집 중' : '우선 편집'; }
      { const g = prestigeGain(s); $('presd').textContent = `이번 회차 ${fmt(s.run)}점 · 개편하면 포인트 +${fmt(g)} (점수 배율 x${prestigeBonus(s).toFixed(2)} → x${prestigeBonus({ pts: s.pts + g }).toFixed(2)}) · 포인트 1당 +2%, 개편 직후엔 처음부터 다시 시작해요`; }
    },
  };
}
