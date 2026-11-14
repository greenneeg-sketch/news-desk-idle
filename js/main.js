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
import { UPGRADES, MILESTONES, RANKS, MANAGER, CHIEF, STAGES, ACHIEVEMENTS, LEADERBOARD, CARDS, RARITY, WEEKLY, CHALLENGES, TIERS } from './data/config.js';
import { Repo } from './services/storage.js';
import { createBoard } from './services/leaderboard.js';
import { Sfx } from './services/audio.js';
import { Scene } from './ui/scene.js';
import { Hud, fmt } from './ui/hud.js';

// Composition Root: 모듈을 조립만 하고 로직은 각 모듈에 둔다
const bus = new EventBus(), store = createStore(reducer, initialState());
const ui = Hud(bus), scene = Scene(ui.canvases, ui.cardCanvas), scheduler = EventScheduler(store);
let pending = 0, board = null;
const newId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

const saved = Repo.load();
if (saved) { store.dispatch({ type: 'LOAD', s: saved.s }); if (saved.offline) { pending = saved.offline.n; ui.offline(saved.offline); } }
const dstr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function checkDates() { // 일일 출석과 주간 목표 초기화(월요일 기준)
  if (!store.getState().name) return; const d = new Date();
  store.dispatch({ type: 'WEEK', key: dstr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7)) }); store.dispatch({ type: 'SEASON', key: seasonKey(d) }); store.dispatch({ type: 'CHECKIN', day: dstr(d) });
}
if (!store.getState().name) ui.askName(); else checkDates();

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
  if (h === 'paid' && s.score < scoutCost(s.pulls)) { Sfx.play('fail'); return ui.toast('점수가 부족해요.'); }
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
  if (s.report && s.report !== p.report) { const r = s.report; Sfx.play('rank'); ui.toast(`8시 뉴스 시청률 ${r.rating.toFixed(1)}% · 유튜브 +${fmt(r.views)}${r.viral ? ' (대박!)' : ''} · 광고 수입 +${fmt(r.bonus)}점`); refresh(); }
  if (s.ach.length > p.ach.length) { const a = ACHIEVEMENTS.find(x => x.id === s.ach[s.ach.length - 1]); Sfx.play('rank'); ui.toast(`업적 달성: ${a.n} (점수 +2%)`); }
  if (rank(s) > rank(p)) { Sfx.play('rank'); ui.toast(`승급: ${RANKS[rank(s)].n}`); }
});

GameLoop({
  step: dt => { const s = store.getState(); if (!s.name) { ui.render(s); return; } store.dispatch({ type: 'TICK', dt, rnd: Math.random(), r2: Math.random() }); scheduler.update(); ui.render(store.getState()); },
  render: t => scene.draw(store.getState(), t, ui.sel()),
}).start();
setInterval(() => Repo.save(store.getState()), 5000);
setInterval(refresh, 60000);
setInterval(checkDates, 60000);
