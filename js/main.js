import { createStore } from './core/Store.js';
import { EventBus } from './core/EventBus.js';
import { GameLoop } from './core/Loop.js';
import { reducer, initialState } from './state/reducer.js';
import { EventScheduler } from './systems/events.js';
import { bulk, rank, prestigeGain, goldReward } from './systems/economy.js';
import { scoutCost } from './systems/cards.js';
import { seasonKey } from './systems/season.js';
import { toEntry } from './systems/ranking.js';
import { checkName } from './systems/nameFilter.js';
import { UPGRADES, MILESTONES, RANKS, MANAGER, CHIEF, STAGES, ACHIEVEMENTS, LEADERBOARD, CARDS, RARITY, WEEKLY, CHALLENGES, TIERS, RIVAL } from './data/config.js';
import { Repo } from './services/storage.js';
import { createBoard } from './services/leaderboard.js';
import { Sfx } from './services/audio.js';
import { Scene } from './ui/scene.js';
import { Bubbles } from './ui/bubbles.js';
import { paper } from './ui/paper.js';
import { Intro } from './ui/intro.js';
import { Hud, fmt } from './ui/hud.js';

// Composition Root: 모듈을 조립만 하고 로직은 각 모듈에 둔다
const bus = new EventBus(), store = createStore(reducer, initialState());
const ui = Hud(bus), scene = Scene(ui.canvases, ui.cardCanvas), bubbles = Bubbles(ui.canvases), scheduler = EventScheduler(store);
let pending = 0, board = null;
const newId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

const saved = Repo.load();
if (saved) { store.dispatch({ type: 'LOAD', s: saved.s }); if (saved.offline) { pending = saved.offline.n; ui.offline(saved.offline); } }
const dstr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function checkDates() { // 일일 출석과 주간 목표 초기화(월요일 기준)
  if (!store.getState().name) return; const d = new Date();
  store.dispatch({ type: 'WEEK', key: dstr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7)) }); store.dispatch({ type: 'SEASON', key: seasonKey(d) }); store.dispatch({ type: 'CHECKIN', day: dstr(d) });
}
if (store.getState().name) checkDates();
// 인트로 타이틀 화면: 메뉴를 고르면 게임으로 들어간다
const $i = id => document.getElementById(id), intro = Intro($i('introcv'), $i('iticker'), $i('iclock'));
function showIntro() {
  const n = store.getState().name; $i('istart').textContent = n ? '이어하기' : '게임 시작'; $i('iname').textContent = n ? `${n} 방송 중` : '';
  $i('inew').hidden = $i('iname2').hidden = !n; $i('inew').textContent = '새로 시작'; delete $i('inew').dataset.a;
  $i('isound').textContent = $i('mute').textContent; $i('intro').classList.remove('open'); $i('intro').hidden = false; intro.start();
}
function enter(after) { $i('intro').hidden = true; intro.stop(); Sfx.play('buy'); if (!store.getState().name) ui.askName(); else if (after) after(); }
$i('istart').onclick = () => enter(() => ui.showTab('desk'));
$i('irank').onclick = () => enter(() => { ui.showTab('rank'); refresh(); });
$i('iguide').onclick = () => enter(() => bus.emit('tut', 0));
$i('isound').onclick = () => { bus.emit('mute'); $i('isound').textContent = $i('mute').textContent; };
$i('titleb').onclick = showIntro;
// 새로 시작: 모든 기록을 지우므로 두 번 눌러야 실행. 이름 변경: 기록은 그대로 두고 방송국 이름만 바꾼다
let newT = 0;
$i('inew').onclick = () => {
  const b = $i('inew');
  if (!b.dataset.a) { b.dataset.a = 1; b.textContent = '기록 삭제! 한 번 더'; clearTimeout(newT); newT = setTimeout(() => { delete b.dataset.a; b.textContent = '새로 시작'; }, 3000); return; }
  clearTimeout(newT); $i('intro').hidden = true; intro.stop(); bus.emit('reset'); ui.showTab('desk');
};
$i('iname2').onclick = () => enter(() => bus.emit('rename'));
// 처음엔 PRESS START만. 화면을 누르면 타이틀이 위에서, 메뉴가 아래에서 나오고 5초 동안 조작이 없으면 역순으로 사라진다
let itimer = 0;
const openMenu = () => { $i('intro').classList.add('open'); clearTimeout(itimer); itimer = setTimeout(() => $i('intro').classList.remove('open'), 5000); };
$i('intro').addEventListener('pointerdown', openMenu);
addEventListener('keydown', e => { if (!$i('intro').hidden && (e.key === 'Enter' || e.key === ' ')) openMenu(); });
showIntro();

// 순위 동기화: 내 기록을 올리고 상위 목록을 받아 그린다
async function refresh() {
  if (!board) return; const s = store.getState();
  try { if (s.name) await board.submit(toEntry(s)); ui.board(await board.top(50, toEntry(s)), board.me || s.uid, board.mode, s.season.key); } catch (e) { ui.toast('순위를 불러오지 못했어요.'); }
}
createBoard(LEADERBOARD).then(b => { board = b; refresh(); });

// Command 핸들러: 사용자 의도 -> 상태 변경 + 피드백
bus.on('name', raw => {
  const r = checkName(raw); if (r.err) return ui.toast(r.err);
  const renamed = !!store.getState().name; store.dispatch({ type: 'NAME', name: r.name, uid: newId() }); ui.closeName(); Sfx.play('rank');
  ui.toast(renamed ? `방송국 이름을 ${r.name}(으)로 바꿨어요.` : `${r.name} 방송 시작!`); checkDates(); refresh();
});
bus.on('rename', () => ui.askName(store.getState().name));
bus.on('board', refresh);
bus.on('buy', id => {
  const u = UPGRADES.find(x => x.id === id), s = store.getState(), { total } = bulk(s, u, s.buyN);
  if (s.chal === 'noQual' && id === 'qual') return ui.toast('저예산 방송 챌린지 중에는 방송 품질을 올릴 수 없어요.');
  if (s.score < total) { Sfx.play('fail'); return ui.toast('점수가 부족해요.'); }
  const l0 = s.lv[id]; store.dispatch({ type: 'BUY', id, n: s.buyN }); Sfx.play('buy');
  const l1 = store.getState().lv[id];
  if (MILESTONES.some(m => l0 < m && l1 >= m)) ui.toast(u.nm ? `${u.n} 시설이 한 단계 업그레이드됐어요!` : `${u.n} 마일스톤! 효과 x2, 시설 업그레이드`);
});
bus.on('hire', i => {
  const s = store.getState(); if (s.mg[i]) return;
  if (s.chal === 'noMgr') return ui.toast('매니저 없이 운영 챌린지 중이에요.');
  if (s.score < MANAGER[i]) { Sfx.play('fail'); return ui.toast('점수가 부족해요.'); }
  store.dispatch({ type: 'HIRE', i }); Sfx.play('rank'); ui.toast(`${STAGES[i]} 매니저 고용! 처리 속도 x2`);
});
bus.on('chief', () => {
  const s = store.getState(); if (s.chief) return;
  if (s.chal === 'noMgr') return ui.toast('매니저 없이 운영 챌린지 중이에요.');
  if (s.score < CHIEF) { Sfx.play('fail'); return ui.toast('점수가 부족해요.'); }
  store.dispatch({ type: 'CHIEF' }); Sfx.play('rank'); ui.toast('영상편집팀장 고용! 속보마다 우선 편집이 자동 적용돼요.');
});
bus.on('research', id => { const p = store.getState(); store.dispatch({ type: 'RESEARCH', id }); if (store.getState() !== p) { Sfx.play('rank'); ui.toast('연구 완료! 영구 강화가 적용됐어요.'); } else Sfx.play('fail'); });
bus.on('deco', id => { const p = store.getState(); store.dispatch({ type: 'DECO', id }); if (store.getState() !== p) { Sfx.play('rank'); ui.toast('사무실에 배치했어요! 점수 +2%'); } else { Sfx.play('fail'); ui.toast('점수가 부족해요.'); } });
let paperBonus = 0;
bus.on('paperad', () => { if (!paperBonus) return; store.dispatch({ type: 'GAIN', n: paperBonus }); paperBonus = 0; ui.paperAdDone(); Sfx.play('buy'); ui.toast('실제 앱에서는 보상형 광고가 나와요. 광고 수입 2배!'); });
bus.on('judge', pick => { const s = store.getState(); if (!s.ev || !s.ev.dil || s.ev.pick) return; store.dispatch({ type: 'JUDGE', pick, r: Math.random() }); });
bus.on('setn', n => store.dispatch({ type: 'SETN', n }));
bus.on('boost', () => {
  const s = store.getState();
  if (!s.ev) return ui.toast('지금은 진행 중인 속보가 없어요.');
  if (s.ev.boost) return;
  store.dispatch({ type: 'BOOST' }); Sfx.play('buy'); ui.toast('우선 편집: 이번 속보 점수 +50%');
});
bus.on('claim', k => { store.dispatch({ type: 'GAIN', n: pending * k }); pending = 0; ui.hideOffline(); Sfx.play('buy'); if (k > 1) ui.toast('실제 앱에서는 보상형 광고가 나와요.'); });
bus.on('prestige', () => { if (prestigeGain(store.getState()) < 1) return ui.toast('누적 5,000점부터 개편할 수 있어요.'); store.dispatch({ type: 'PRESTIGE' }); Sfx.play('rank'); ui.toast('개편 완료! 시청률 포인트를 얻었어요.'); });
bus.on('reset', () => { Repo.clear(); store.dispatch({ type: 'RESET' }); ui.toast('저장 데이터를 지웠어요.'); ui.askName(); });
bus.on('gold', () => {
  const s = store.getState(); if (!s.gold) return;
  const r = Math.random(), g = goldReward(s, r); store.dispatch({ type: 'GOLD', r }); Sfx.play('rank');
  ui.toast(g.frenzy ? '특종 터졌다! 20초 동안 점수 x7' : `특종! 점수 +${fmt(g.cash)}`);
});
bus.on('spd', () => {
  const s = store.getState(); if (s.clock < s.spdReady) return ui.toast('부스트는 잠시 후 다시 쓸 수 있어요.');
  store.dispatch({ type: 'SPD' }); Sfx.play('buy'); ui.toast('실제 앱에서는 보상형 광고가 나와요. 2분 동안 처리 속도 x2');
});
bus.on('scout', how => {
  const s = store.getState(), h = how === 'free' ? (s.tickets > 0 ? 'ticket' : 'ad') : how;
  if (h === 'paid' && s.score < scoutCost(s)) { Sfx.play('fail'); return ui.toast('점수가 부족해요.'); }
  if (h === 'ad' && s.clock < s.freeReady) return ui.toast('광고 스카우트는 잠시 후 다시 쓸 수 있어요.');
  store.dispatch({ type: 'SCOUT', how: h, r: Math.random(), r2: Math.random() }); Sfx.play(store.getState().last.miss ? 'fail' : 'rank');
  const l = store.getState().last;
  if (l.miss) return ui.toast(`꽝! 이번엔 합격자가 없어요${l.back ? ` · 위로금 +${fmt(l.back)}점` : ''}${h === 'ad' ? ' · 실제 앱에서는 보상형 광고가 나와요' : ''}`);
  const c = CARDS.find(x => x.id === l.id);
  ui.toast(`스카우트: ${c.n} (${RARITY[c.rar].n})${l.isNew ? ' NEW!' : l.maxed ? ' 최대 ★ 보너스 +500점' : ' ★ 상승'}${h === 'ad' ? ' · 실제 앱에서는 보상형 광고가 나와요' : ''}`);
});
bus.on('goal', id => {
  const s = store.getState(), g = WEEKLY.find(x => x.id === id); if (!g || s.week.done[id] || (s.week.prog[g.k] || 0) < g.goal) return;
  store.dispatch({ type: 'CLAIM', id }); Sfx.play('rank'); ui.toast(`주간 목표 달성: ${g.n} · 보상과 스카우트 티켓 +1`);
});
bus.on('chal', id => { const c = CHALLENGES.find(x => x.id === id); store.dispatch({ type: 'CHAL', id }); Sfx.play('rank'); ui.toast(`챌린지 시작: ${c.n} · 목표 누적 ${fmt(c.goal)}점`); });
bus.on('chalquit', () => { store.dispatch({ type: 'CHAL_QUIT' }); Sfx.play('fail'); ui.toast('챌린지를 포기했어요. 회차가 처음부터 다시 시작돼요.'); });
bus.on('tut', step => { store.dispatch({ type: 'TUT', step }); if (step === 0) ui.showTab('desk'); if (step === -1) ui.toast('가이드를 닫았어요. 위의 ? 버튼으로 다시 볼 수 있어요.'); });
bus.on('mute', () => ui.setMute(Sfx.toggle()));

// 상태 변화 구독: 효과음과 알림
store.subscribe((s, p) => {
  if (s.ev && (!p.ev || p.ev.id !== s.ev.id || p.ev.end !== s.ev.end)) Sfx.play('alert');
  if (s.gold && !p.gold) Sfx.play('alert');
  if (s.chalWin && s.chalWin !== p.chalWin) { const c = CHALLENGES.find(x => x.id === s.chalWin.split(':')[0]); Sfx.play('rank'); ui.toast(`챌린지 완료: ${c.n}! 영구 점수 +10%`); }
  if (s.lastSeason && s.lastSeason !== p.lastSeason) { const l = s.lastSeason; Sfx.play('rank'); ui.toast(`시즌 종료: ${TIERS[l.tier].n} 달성 · 스카우트 티켓 +${l.tk}장`); }
  if (s.daily && s.daily !== p.daily) { const d = s.daily; Sfx.play('rank'); ui.toast(`출석 ${d.streak}일째! 보너스 +${fmt(d.gain)}점${d.tk ? ' · 스카우트 티켓 +1' : ''}`); }
  if (s.report && s.report !== p.report) { const r = s.report; Sfx.play('rank'); paperBonus = r.bonus; if (s.tut < 0 || s.tut >= 7) ui.showPaper(paper(s.name, r)); else ui.toast(`8시 뉴스 시청률 ${r.rating.toFixed(1)}% · 광고 수입 +${fmt(r.bonus)}점`); refresh(); }
  if (s.judge && s.judge !== p.judge) { const j = s.judge.res; Sfx.play(j === 'fail' ? 'fail' : j === 'win' ? 'rank' : 'buy'); ui.toast(j === 'win' ? '단독 성공! 이번 속보 점수 x2 · 오늘 시청률 +0.8' : j === 'fail' ? '오보! 정정 보도 나갑니다... 오늘 시청률 -1.2' : '팩트 체크 완료, 안전하게 송출 (점수 x1.2)'); }
  if (s.misHit && s.misHit !== p.misHit) { const m = s.misHit; Sfx.play('rank'); ui.toast(m.all ? `오늘의 미션 올클리어! +${fmt(m.gain)}점 · 스카우트 티켓 +1` : `미션 달성! +${fmt(m.gain)}점`); }
  if (s.ach.length > p.ach.length) { const a = ACHIEVEMENTS.find(x => x.id === s.ach[s.ach.length - 1]); Sfx.play('rank'); ui.toast(`업적 달성: ${a.n} (점수 +2%)`); }
  if (rank(s) > rank(p)) { Sfx.play('rank'); ui.toast(`승급: ${RANKS[rank(s)].n}`); }
});

GameLoop({
  step: dt => { const s = store.getState(); if (!s.name) { ui.render(s); return; } bubbles.update(dt, s, !document.querySelector('.pane[data-tab="desk"]').hidden); store.dispatch({ type: 'TICK', dt, rnd: Math.random(), r2: Math.random(), r3: Math.random() }); scheduler.update(); ui.render(store.getState()); },
  render: t => scene.draw(store.getState(), t, ui.sel()),
}).start();
setInterval(() => Repo.save(store.getState()), 5000);
setInterval(refresh, 60000);
setInterval(checkDates, 60000);
