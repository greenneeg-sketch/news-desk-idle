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
import { Music } from './services/music.js';
import { heroCount } from './systems/weekly.js';
import { TIPS } from './data/tips.js';
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
let clockOff = 0; // 서버 시각 - 기기 시각 (ms)
function checkDates() { // 일일 출석과 주간 목표 초기화(월요일 기준)
  if (!store.getState().name) return; const d = new Date(Date.now() + clockOff);
  store.dispatch({ type: 'WEEK', key: dstr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7)) }); store.dispatch({ type: 'SEASON', key: seasonKey(d) }); store.dispatch({ type: 'CHECKIN', day: dstr(d) });
}
if (store.getState().name) checkDates();
// 인트로 타이틀 화면: 메뉴를 고르면 게임으로 들어간다
const $i = id => document.getElementById(id), intro = Intro($i('introcv'), $i('iticker'), $i('iclock'));
function showIntro() {
  const n = store.getState().name; $i('istart').textContent = n ? '이어하기' : '게임 시작'; $i('iname').textContent = n ? `${n} 방송 중` : '';
  $i('inew').hidden = $i('iname2').hidden = !n; $i('inew').textContent = '새로 시작'; delete $i('inew').dataset.a;
  $i('isound').textContent = $i('mute').textContent; $i('intro').classList.remove('open'); $i('intro').hidden = false; intro.start(); Music.play('title');
}
function enter(after) { $i('intro').hidden = true; intro.stop(); Sfx.play('buy'); Music.play(store.getState().ev ? 'breaking' : 'desk'); if (!store.getState().name) ui.askName(); else if (after) after(); }
$i('istart').onclick = () => enter(() => ui.showTab('desk'));
$i('irank').onclick = () => enter(() => { ui.showTab('rank'); refresh(); });
$i('iguide').onclick = () => enter(() => bus.emit('tut', 0));
$i('isound').onclick = () => { bus.emit('mute'); $i('isound').textContent = $i('mute').textContent; };
// 메인 화면으로: 바로 저장하고 타이틀로 나간다 (상단 ⌂ 버튼, 설정의 타이틀 버튼)
const goHome = () => { if (!restoring) Repo.save(store.getState()); showIntro(); ui.toast('저장했어요.'); };
$i('titleb').onclick = goHome; $i('homeb').onclick = goHome;
// 홈 화면 앱(PWA): GitHub Pages에서만 서비스 워커를 켠다. 안드로이드 크롬은 설치 창, 아이폰 사파리는 안내 창
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
if ('serviceWorker' in navigator && /github\.io$|^localhost$|^127\./.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { });
let installEv = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (!standalone && isIOS) $i('iinstall').hidden = false;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; if (!standalone) $i('iinstall').hidden = false; });
addEventListener('appinstalled', () => { $i('iinstall').hidden = true; ui.toast('홈 화면에 설치했어요!'); });
$i('iinstall').onclick = async () => {
  if (installEv) { installEv.prompt(); const r = await installEv.userChoice.catch(() => null); installEv = null; if (r && r.outcome === 'accepted') $i('iinstall').hidden = true; }
  else $i('iosins').hidden = false;
};
$i('iosok').onclick = () => { $i('iosins').hidden = true; };
// 푸시 알림: 앱을 닫을 때 '야간 근무 수익이 가득 차는 시각'에 알림을 예약하고, 다시 열면 예약을 취소한다
const PUSH_KEY = 'newsDeskPush';
let pushSub = null; try { pushSub = JSON.parse(localStorage.getItem(PUSH_KEY)); } catch (e) { }
const pushLabel = () => { $i('pushb').textContent = pushSub ? '알림 끄기' : '알림 켜기'; };
const b64u8 = b => { const s = atob((b + '='.repeat((4 - b.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); };
async function enablePush() {
  if (isIOS && !standalone) return ui.toast('아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요. 타이틀의 "앱 설치"를 먼저 해 주세요.');
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return ui.toast('이 브라우저는 알림을 지원하지 않아요.');
  if (!board || board.mode !== 'server') return ui.toast('순위 서버에 연결된 뒤 다시 시도해 주세요.');
  if (await Notification.requestPermission() !== 'granted') return ui.toast('알림이 허용되지 않았어요. 브라우저 설정에서 허용할 수 있어요.');
  const reg = await navigator.serviceWorker.ready, key = await board.vapid();
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u8(key) });
  await refresh(); // 서버에 방송국 기록(기기 열쇠)이 먼저 등록돼 있어야 한다
  pushSub = sub.toJSON(); await board.pushSet(pushSub, null);
  try { localStorage.setItem(PUSH_KEY, JSON.stringify(pushSub)); } catch (e) { }
  pushLabel(); ui.toast('알림을 켰어요. 야간 근무 수익이 가득 차면 알려 드려요.');
}
async function disablePush() {
  try { const reg = await navigator.serviceWorker.ready, s = await reg.pushManager.getSubscription(); if (s) await s.unsubscribe(); } catch (e) { }
  try { await board.pushSet(null, null); } catch (e) { }
  pushSub = null; try { localStorage.removeItem(PUSH_KEY); } catch (e) { } pushLabel(); ui.toast('알림을 껐어요.');
}
$i('pushb').onclick = () => (pushSub ? disablePush() : enablePush()).catch(() => ui.toast('알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.'));
pushLabel();
// ---------- 클라우드 저장 ----------
const CLOUD_KEY = 'newsDeskCloud';
let cloud = { code: '', at: 0 }; try { cloud = JSON.parse(localStorage.getItem(CLOUD_KEY)) || cloud; } catch (e) { }
ui.cloud(cloud.code, cloud.at);
const cloudSave = (keep = false) => {
  const s = store.getState(); if (!board || board.mode !== 'server' || !s.name) return Promise.resolve(false);
  return board.savePut(Repo.snapshot(s), keep).then(code => { cloud = { code, at: Date.now() }; try { localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud)); } catch (e) { } ui.cloud(cloud.code, cloud.at); return true; }).catch(() => false);
};
$i('cloudnow').onclick = () => cloudSave().then(ok => ui.toast(ok ? '클라우드에 저장했어요.' : '아직 저장할 수 없어요. 순위 서버 연결과 방송국 등록(1분 정도)을 기다려 주세요.'));
$i('cloudcp').onclick = () => { const c = cloud.code; (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => ui.toast('복구 코드를 복사했어요. 안전한 곳에 적어 두세요.'), () => ui.toast(`복구 코드: ${c}`)); };
let getArm = 0;
$i('cloudget').onclick = async () => {
  const code = $i('cloudin').value.trim(), b = $i('cloudget');
  if (code.replace(/[^0-9A-Za-z]/g, '').length !== 12) return ui.toast('복구 코드 12자리를 정확히 넣어 주세요.');
  if (!board || board.mode !== 'server') return ui.toast('순위 서버에 연결된 뒤 다시 시도해 주세요.');
  if (!b.dataset.a) { b.dataset.a = 1; b.textContent = '덮어쓰기! 한 번 더'; clearTimeout(getArm); getArm = setTimeout(() => { delete b.dataset.a; b.textContent = '불러오기'; }, 3000); return; }
  clearTimeout(getArm); delete b.dataset.a; b.textContent = '불러오는 중…';
  try {
    const j = await board.restore(code); restoring = true; Repo.write(j.data);
    try { localStorage.setItem(CLOUD_KEY, JSON.stringify({ code: code.toUpperCase(), at: Date.now() })); } catch (e) { }
    ui.toast('기록을 불러왔어요! 다시 시작합니다.'); setTimeout(() => location.reload(), 900);
  } catch (e) { b.textContent = '불러오기'; ui.toast('복구 코드를 찾지 못했어요. 다시 확인해 주세요.'); }
};
let restoring = false; // 불러온 직후에는 지금 상태로 덮어쓰지 않는다
setInterval(() => cloudSave(), 120000);

// ---------- 새 기능 안내 팁 ----------
let tipNow = null;
const tipBlocked = () => !$i('intro').hidden || !$i('tut').hidden || document.querySelectorAll('.modal:not([hidden])').length > 0; // 다른 창이 떠 있으면 기다린다
function checkTip(s) {
  if (tipNow || ui.tipOpen() || !s.name || (s.tut >= 0 && s.tut < 7) || tipBlocked()) return;
  const t = TIPS.find(x => !(s.tips || {})[x.id] && x.when(s)); if (!t) return;
  tipNow = t; ui.showTip(t);
}
const closeTip = go => {
  if (!tipNow) return; const t = tipNow; tipNow = null; ui.hideTip(); store.dispatch({ type: 'TIP', id: t.id });
  if (go && t.tab) { ui.showTab(t.tab); const el = $i(t.target); if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50); }
};
$i('tipok').onclick = () => closeTip(false); $i('tipgo').onclick = () => closeTip(true);

const pushSchedule = hidden => { if (!pushSub || !board || !store.getState().name) return; const cap = (8 + ((store.getState().res || {}).night || 0)) * 3600e3; board.pushSet(pushSub, hidden ? new Date(Date.now() + clockOff + cap).toISOString() : null, hidden).catch(() => { }); };
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
// 소리 켜기: 브라우저(특히 아이폰)는 화면을 누르고 뗄 때만 소리를 허락한다 → 그때마다 오디오를 깨우고 지금 화면에 맞는 곡을 튼다
const songNow = () => !$i('intro').hidden ? 'title' : store.getState().ev ? 'breaking' : 'desk';
const wakeAudio = () => { Music.unlock(); Sfx.unlock(); if (Music.on) Music.play(songNow()); };
['pointerdown', 'touchend', 'click', 'keydown'].forEach(t => document.addEventListener(t, wakeAudio, { capture: true, passive: true }));
// 배경음악 켜기·끄기 (타이틀 메뉴, 성장 탭 설정)
const bgmLabel = () => { const t = Music.on ? 'BGM ON' : 'BGM OFF'; $i('ibgm').textContent = t; $i('bgmb').textContent = t; };
$i('ibgm').onclick = $i('bgmb').onclick = () => { Music.toggle(); if (Music.on) Music.play($i('intro').hidden ? (store.getState().ev ? 'breaking' : 'desk') : 'title'); bgmLabel(); };
bgmLabel();
addEventListener('keydown', e => { if (!$i('intro').hidden && (e.key === 'Enter' || e.key === ' ')) openMenu(); });
showIntro();

// 순위 동기화: 내 기록을 올리고 상위 목록을 받아 그린다
async function refresh() {
  if (!board) return; const s = store.getState();
  if (s.name) try { await board.submit(toEntry(s)); } catch (e) { console.warn('순위 기록 실패', e); } // 기록 실패(검증 거부 등)여도 목록은 불러온다
  try { ui.board(await board.top(50, toEntry(s)), board.me || s.uid, board.mode, s.season.key); } catch (e) { ui.toast('순위를 불러오지 못했어요.'); }
}
// 서버가 있으면 서버 시각으로 출석·주간·시즌을 계산한다(기기 시계 조작 방지)
const syncClock = () => board && board.now().then(t => { if (t) { clockOff = t - Date.now(); checkDates(); } }).catch(() => { });
createBoard(LEADERBOARD).then(b => { board = b; refresh(); syncClock(); });
setInterval(syncClock, 600000);

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
  checkTip(s);
  if (s.ev && (!p.ev || p.ev.id !== s.ev.id || p.ev.end !== s.ev.end)) Sfx.play('alert');
  if (!!s.ev !== !!p.ev && $i('intro').hidden) Music.play(s.ev ? 'breaking' : 'desk'); // 속보 중에는 긴박한 곡
  if (s.gold && !p.gold) Sfx.play('alert');
  if (s.chalWin && s.chalWin !== p.chalWin) { const c = CHALLENGES.find(x => x.id === s.chalWin.split(':')[0]); Sfx.play('rank'); ui.toast(`챌린지 완료: ${c.n}! 영구 점수 +10%`); }
  if (s.lastSeason && s.lastSeason !== p.lastSeason) { const l = s.lastSeason; Sfx.play('rank'); ui.toast(`시즌 종료: ${TIERS[l.tier].n} 달성 · 스카우트 티켓 +${l.tk}장`); }
  if (s.daily && s.daily !== p.daily) { const d = s.daily; Sfx.play('rank'); ui.toast(`출석 ${d.streak}일째! 보너스 +${fmt(d.gain)}점${d.tk ? ' · 스카우트 티켓 +1' : ''}`); }
  if (s.report && s.report !== p.report) { const r = s.report; Sfx.play('rank'); paperBonus = r.bonus; if (s.tut < 0 || s.tut >= 7) ui.showPaper(paper(s.name, r)); else ui.toast(`8시 뉴스 시청률 ${r.rating.toFixed(1)}% · 광고 수입 +${fmt(r.bonus)}점`); refresh(); }
  if (s.judge && s.judge !== p.judge) { const j = s.judge.res; Sfx.play(j === 'fail' ? 'fail' : j === 'win' ? 'rank' : 'buy'); ui.toast(j === 'win' ? '단독 성공! 이번 속보 점수 x2 · 오늘 시청률 +0.8' : j === 'fail' ? '오보! 정정 보도 나갑니다... 오늘 시청률 -1.2' : '팩트 체크 완료, 안전하게 송출 (점수 x1.2)'); }
  if (s.misHit && s.misHit !== p.misHit) { const m = s.misHit; Sfx.play('rank'); ui.toast(m.all ? `오늘의 미션 올클리어! +${fmt(m.gain)}점 · 스카우트 티켓 +1` : `미션 달성! +${fmt(m.gain)}점`); }
  if (s.promo && s.promo !== p.promo) { Sfx.play('rank'); ui.showPromo(s.promo.i, s.name); }
  if (s.weHit && s.weHit !== p.weHit) { Sfx.play('rank'); ui.toast('한정 이벤트 달성! 스카우트 티켓 +2 · 한정 배지 획득'); }
  if (s.ev && s.ev.id === 'robot' && (!p.ev || p.ev.id !== 'robot')) ui.toast(heroCount(s) ? `뉴스 디펜더즈 ${heroCount(s)}명 출동! 이번 속보 점수 +${heroCount(s) * 50}%` : '거대 로봇 습격! 히어로 카드가 있으면 점수가 크게 올라요.');
  if (s.ach.length > p.ach.length) { const a = ACHIEVEMENTS.find(x => x.id === s.ach[s.ach.length - 1]); Sfx.play('rank'); ui.toast(`업적 달성: ${a.n} (점수 +2%)`); }
  if (rank(s) > rank(p)) { Sfx.play('rank'); ui.toast(`승급: ${RANKS[rank(s)].n}`); }
});

GameLoop({
  step: dt => { const s = store.getState(); if (!s.name) { ui.render(s); return; } bubbles.update(dt, s, !document.querySelector('.pane[data-tab="desk"]').hidden); store.dispatch({ type: 'TICK', dt, rnd: Math.random(), r2: Math.random(), r3: Math.random() }); scheduler.update(); ui.render(store.getState()); },
  render: t => scene.draw(store.getState(), t, ui.sel()),
}).start();
setInterval(() => { if (!restoring) Repo.save(store.getState()); }, 5000); // 자동 저장: 5초마다
// 앱을 닫거나 다른 앱으로 넘어갈 때도 즉시 저장
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!restoring) { Repo.save(store.getState()); cloudSave(true); } Music.pause(); pushSchedule(true); } else { Music.resume(); pushSchedule(false); } });
addEventListener('pagehide', () => { if (!restoring) Repo.save(store.getState()); });
setInterval(refresh, 60000);
setInterval(checkDates, 60000);
