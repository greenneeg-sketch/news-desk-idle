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
import { BAL, MG_MIN, PERKS, UPGRADES, MILESTONES, RANKS, MANAGER, CHIEF, STAGES, ACHIEVEMENTS, LEADERBOARD, CARDS, CARD_SETS, RARITY, WEEKLY, CHALLENGES, TIERS, RIVAL, JOBS } from './data/config.js';
import { Repo } from './services/storage.js';
import { createBoard } from './services/leaderboard.js';
import { Sfx } from './services/audio.js';
import { Music } from './services/music.js';
import { heroCount } from './systems/weekly.js';
import { TIPS, UNLOCKS } from './data/tips.js';
import { TUTORIAL } from './ui/tutorial.js';
import { Scene } from './ui/scene.js';
import { Bubbles } from './ui/bubbles.js';
import { paper } from './ui/paper.js';
import { Intro } from './ui/intro.js';
import { Hud, fmt } from './ui/hud.js';
import { MINI } from './ui/minigame.js';
import { Branches } from './ui/branches.js';
import { Social } from './ui/social.js';
import { GuideUI } from './ui/guide.js';
import { StoryUI } from './ui/story.js';
import { Ads } from './services/ads.js';
import { Shop, SHOP_ITEMS } from './services/shop.js';
import { Analytics } from './services/analytics.js';
import { Native } from './services/native.js';
import { TS, initTextScale, setTextStep, setClearFont } from './ui/textscale.js';
import { STORY } from './data/story.js';
import { perSec, setLevel, setRobot } from './systems/economy.js';
import { jobOf } from './data/config.js';
import { isUnlocked } from './data/tips.js';

// Composition Root: 모듈을 조립만 하고 로직은 각 모듈에 둔다
const bus = new EventBus(), store = createStore(reducer, initialState());
const ui = Hud(bus), story = StoryUI(bus, () => store.getState()), branches = Branches(bus), social = Social(bus), guide = GuideUI(bus, () => store.getState()), scene = Scene(ui.canvases, ui.cardCanvas), bubbles = Bubbles(ui.canvases), scheduler = EventScheduler(store);
// 태블릿 등 넓은 화면: 게임 화면(폭 480) 전체를 화면 폭에 맞게 키운다. 양옆 빈 공간이 생기지 않게
function fitZoom() { const w = innerWidth, h = innerHeight, z = w >= 560 ? Math.min(w / 480, Math.max(1, h / 640)) : 1; document.documentElement.style.zoom = z > 1.04 ? z.toFixed(3) : ''; }
initTextScale();
fitZoom(); addEventListener('resize', fitZoom);
// 보상형 광고: 앱에서는 진짜 광고를 본 뒤에만 ok(), 웹에서는 바로 ok(true)(웹이면 안내 문구를 붙인다)
const AD_WEB = '실제 앱에서는 보상형 광고가 나와요. ';
const withAd = ok => (store.getState().iap || {}).nd_noads ? ok('') : Ads.show().then(r => { Analytics.log('ad', { r: r === 'web' ? 'web' : r ? 'ok' : 'fail' }); if (r === 'web') ok(AD_WEB); else if (r) ok(''); else { Sfx.play('fail'); ui.toast('광고를 끝까지 봐야 보상을 받을 수 있어요.'); } });
Ads.init();
Analytics.init({ url: LEADERBOARD.url, key: LEADERBOARD.key, ver: ((document.querySelector('.iver') || {}).textContent || '').replace(/^v/, '') });
let pending = 0, board = null;
const newId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

const saved = Repo.load();
Analytics.log('open', saved ? { d: saved.s.day || 0, sc: Math.round(Math.log10(1 + (saved.s.total || 0))) } : { first: 1 });
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
$i('iguide').onclick = () => enter(() => guide.open('bc'));
bus.on('guide', () => guide.open());
bus.on('guideclose', () => markPop());
$i('isound').onclick = () => { bus.emit('mute'); $i('isound').textContent = $i('mute').textContent; };
// 메인 화면으로: 바로 저장하고 타이틀로 나간다 (상단 ⌂ 버튼, 설정의 타이틀 버튼)
const goHome = () => { if (!restoring) Repo.save(store.getState()); showIntro(); ui.toast('저장했어요.'); };
$i('titleb').onclick = () => { $i('setm').hidden = true; goHome(); }; $i('homeb').onclick = goHome;
$i('gearb').onclick = () => { $i('setm').hidden = false; }; $i('setok').onclick = () => { $i('setm').hidden = true; markPop(); };
// 홈 화면 앱(PWA): GitHub Pages에서만 서비스 워커를 켠다. 안드로이드 크롬은 설치 창, 아이폰 사파리는 안내 창
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
if ('serviceWorker' in navigator && !Ads.native() && /github\.io$|^localhost$|^127\./.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { });
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
const pushLabel = () => { $i('pushb').textContent = (Native.isApp() ? Native.notifOn() : pushSub) ? '알림 끄기' : '알림 켜기'; };
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
$i('pushb').onclick = Native.isApp() ? async () => { // 앱: 기기 안에서 예약하는 알림(웹 푸시 대신)
  if (Native.notifOn()) { await Native.notifSet(false); ui.toast('알림을 껐어요.'); } else { const ok = await Native.notifSet(true); ui.toast(ok ? '알림을 켰어요. 야간 근무 수익이 가득 차면 알려 드려요.' : '알림 권한이 필요해요. 폰 설정에서 NEWS DESK 알림을 허용해 주세요.'); } pushLabel();
} : () => (pushSub ? disablePush() : enablePush()).catch(() => ui.toast('알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.'));
pushLabel();
// ---------- 클라우드 저장 ----------
const CLOUD_KEY = 'newsDeskCloud';
let cloud = { code: '', at: 0 }; try { cloud = JSON.parse(localStorage.getItem(CLOUD_KEY)) || cloud; } catch (e) { }
ui.cloud(cloud.code, cloud.at);
const cloudSave = (keep = false) => {
  const s = store.getState(); if (!board || board.mode !== 'server' || !s.name) return Promise.resolve(false);
  return board.savePut(Repo.snapshot(s), keep).then(code => { cloud = { code, at: Date.now() }; try { localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud)); } catch (e) { } ui.cloud(cloud.code, cloud.at);
    try { if (!localStorage.getItem('newsDeskCodeTip') && s.day >= 2) { localStorage.setItem('newsDeskCodeTip', '1'); ui.toast('복구 코드가 만들어졌어요! 설정 → 클라우드 저장에서 적어 두면 폰을 바꿔도 이어서 할 수 있어요.'); } } catch (e) { } return true; }).catch(() => false);
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
$i('hapb').onclick = () => { Native.setHaptic(!Native.hapticOn()); hapRef(); if (Native.hapticOn()) Native.haptic('rank'); };
const hapRef = () => { $i('hapb').textContent = Native.hapticOn() ? '진동 ON' : '진동 OFF'; $i('hapb').hidden = !Native.isApp(); }; hapRef();
const fsRef = () => { document.querySelectorAll('.fsrow button').forEach(b => b.classList.toggle('on', +b.dataset.fs === TS.step)); $i('fontb').textContent = TS.clear ? '또렷한 글꼴: 켜짐' : '또렷한 글꼴: 꺼짐'; };
document.querySelectorAll('.fsrow button').forEach(b => { b.onclick = () => { setTextStep(+b.dataset.fs); fsRef(); }; });
$i('fontb').onclick = () => { setClearFont(!TS.clear); fsRef(); }; fsRef();
const anRef = () => { $i('anb').textContent = Analytics.enabled() ? '익명 통계 보내기: 켜짐' : '익명 통계 보내기: 꺼짐'; };
$i('anb').onclick = () => { Analytics.setOn(!Analytics.enabled()); anRef(); ui.toast(Analytics.enabled() ? '익명 통계를 보냅니다. 게임 개선에만 써요.' : '익명 통계를 보내지 않아요.'); }; anRef();

// ---------- 알림 창 대기열: 창은 한 번에 하나, 튜토리얼·다른 창이 끝난 뒤 간격을 두고 ----------
// 종류: promo(승진 창), tip(해금·상황 안내 카드)
const popQ = []; let tipNow = null, lastPop = 0;
const busy = () => !$i('intro').hidden || !$i('tut').hidden || !$i('meetbg').hidden || ui.tipOpen() || document.querySelectorAll('.modal:not([hidden])').length > 0;
const tutOn = s => s.tut >= 0 && s.tut < TUTORIAL.length;
function pump(s) {
  if (!s.name || tutOn(s) || busy() || Date.now() - lastPop < 2500) return;
  if (!popQ.length) { const t = TIPS.find(x => !(s.tips || {})[x.id] && x.when(s)); if (t) popQ.push({ kind: 'tip', t }); }
  const it = popQ.shift(); if (!it) return;
  if (it.kind === 'promo') { Sfx.play('rank'); ui.showPromo(it.i, s.name, s, it.tk); }
  else { tipNow = it.t; ui.showTip(it.t); }
}
const markPop = () => { lastPop = Date.now(); };
$i('prok').addEventListener('click', markPop);
const closeTip = go => {
  if (!tipNow) return; const t = tipNow; tipNow = null; ui.hideTip(); markPop(); store.dispatch({ type: 'TIP', id: t.id });
  if (go && t.tab) { ui.showTab(t.tab, t.g); const el = $i(t.target); if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' }), 80); }
};
$i('tipok').onclick = () => closeTip(false); $i('tipgo').onclick = () => closeTip(true);
// 미니게임: 해금 뒤 3~5분마다 왼쪽 아래 아이콘이 20초 동안 뜬다(놓쳐도 손해 없음). 70%는 내 직업 게임, 나머지는 다른 게임
// 메뉴(🎮)에서는 보상 없이 연습. 공통 화면은 여기서, 게임 그리기·판정은 ui/minigame.js
const MG_LIFE = 20000, MG_ON = MINI.LIST.filter(g => !g.soon);
let mgNext = 0, mgUntil = 0, mgIcon = null, mgPlay = null, mgReward = 0, mgGrade = '';
const mgSchedule = (ms = (180 + Math.random() * 120) * 1000) => { mgNext = Date.now() + ms; };
const mgHide = () => { $i('mgicon').hidden = true; mgUntil = 0; };
const mgMine = (s, g) => g.jobs.includes(jobOf(s).id);
function mgPick(s) { const mine = MG_ON.filter(g => mgMine(s, g)); return mine.length && Math.random() < .7 ? mine[Math.floor(Math.random() * mine.length)] : MG_ON[Math.floor(Math.random() * MG_ON.length)]; }
function mgTick() {
  const s = store.getState(), now = Date.now(), on = !!s.name && isUnlocked(s, 'mini');
  $i('mgmb').hidden = $i('imini').hidden = !on; if (!on) return;
  if (!mgNext) mgSchedule(s.tips && s.tips.mini1 ? undefined : 6000); // 처음 해금되면 곧바로 한 번
  if (mgUntil) { if (now > mgUntil) { mgHide(); mgSchedule(); } else $i('mgbar').style.transform = `scaleX(${(mgUntil - now) / MG_LIFE})`; return; }
  if (now >= mgNext && !busy() && !tutOn(s) && !document.hidden) {
    mgIcon = mgPick(s); $i('mgicon').querySelector('b').textContent = mgIcon.icon; $i('mgicon').querySelector('small').textContent = mgIcon.sub;
    $i('mgicon').hidden = false; mgUntil = now + MG_LIFE; Sfx.play('alert');
  }
}
setInterval(mgTick, 250);
if (location.hash === '#mini') mgSchedule(1500); // 테스트용: 주소 끝에 #mini
let mgStory = false; // 스토리 미션에서 연 미니게임이면 끝나고 스토리로 돌아간다
function mgOpen(g, practice, fromStory) {
  mgStory = !!fromStory; mgPlay = { g, practice }; mgReward = 0;
  $i('mctitle').textContent = g.n + (practice ? ' · 연습' : ''); $i('mcres').hidden = true; $i('mcquit').hidden = false; $i('mgmenu').hidden = true; $i('mcut').hidden = false;
  $i('mcj').textContent = ''; $i('mcc').textContent = '';
  const game = MINI.start(g.id); $i('mcshot').hidden = !game.shutter; Music.play('breaking');
}
const mgClose = () => { MINI.stop(); mgPlay = null; $i('mcut').hidden = true; markPop(); Music.play(store.getState().ev ? 'breaking' : 'desk'); };
$i('mgicon').onclick = () => { mgHide(); mgSchedule(); store.dispatch({ type: 'TIP', id: 'mini1' }); mgOpen(mgIcon || MG_ON[0], false); };
let mgPop = 0;
MINI.init({
  canvas: $i('mccv'), sfx: k => Sfx.play(k),
  label(a, b) { $i('mcl').textContent = a; $i('mcs').textContent = b || ''; },
  pop(t, c) { const e = $i('mcj'); e.textContent = t; e.className = 'mcj ' + c; clearTimeout(mgPop); mgPop = setTimeout(() => { e.textContent = ''; }, 700); },
  combo(t) { $i('mcc').textContent = t; },
  done(r) {
    const { g, practice } = mgPlay, s = store.getState(), MIN = MG_MIN[r.grade], job = mgMine(s, g) ? 1.5 : 1, per = Math.max(perSec({ ...s, ev: null, spdEnd: 0, gbEnd: 0 }), 5); // 속보·부스트·특종 배수는 빼고 평소 생산량 기준
    const prev = (s.mgBest || {})[g.id]; store.dispatch({ type: 'MGREC', id: g.id, grade: r.grade, practice }); if (!practice) gExtra += 5; // 연합 공동 특보 기여
    $i('mcgr').textContent = r.grade; $i('mcst').textContent = r.stat; $i('mcshot').hidden = true;
    $i('mcl').textContent = r.perfect ? '완벽!' : '완료'; $i('mcs').textContent = '';
    if (practice) { mgReward = 0; $i('mcrw').textContent = `연습 모드 · 최고 기록 ${store.getState().mgBest[g.id]}${prev && prev !== store.getState().mgBest[g.id] ? ' (신기록!)' : ''}`; }
    else { mgReward = Math.floor(per * 60 * MIN * job * (r.perfect ? 1.5 : 1)); mgGrade = r.grade;
      $i('mcrw').textContent = `보상 ${fmt(mgReward)}점 (생산량 ${MIN}분치${job > 1 ? ' · 직업 특기 x1.5' : ''}${r.perfect ? ' · 완벽 x1.5' : ''})`; }
    $i('mcrow').hidden = practice; $i('mcprow').hidden = !practice; $i('mcres').hidden = false; $i('mcquit').hidden = true; Sfx.play(r.grade === 'C' ? 'fail' : 'rank');
  },
});
window.__mini = MINI; window.__intro = intro; window.__store = store; // 테스트용
{ // 화면 입력: 누르기·문지르기를 캔버스 좌표로 바꿔 지금 게임에 넘긴다
  const st = $i('mcstage'), xy = e => { const r = st.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 240, (e.clientY - r.top) / r.height * 150]; };
  $i('mcut').addEventListener('contextmenu', e => e.preventDefault()); // 길게 누르기 메뉴 막기
  st.addEventListener('pointerdown', e => { e.preventDefault(); const g = MINI.cur; if (!g) return; try { st.setPointerCapture(e.pointerId); } catch (x) { } g.down(...xy(e)); });
  st.addEventListener('pointermove', e => { const g = MINI.cur; if (g) g.move(...xy(e)); });
  ['pointerup', 'pointercancel'].forEach(k => st.addEventListener(k, () => { const g = MINI.cur; if (g) g.up(); }));
  $i('mcshot').addEventListener('pointerdown', e => { e.preventDefault(); const g = MINI.cur; if (g) g.shot(); });
  addEventListener('keydown', e => { if (mgPlay && MINI.cur && ['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); MINI.cur.key(e); } });
  addEventListener('keyup', e => { if (mgPlay && MINI.cur && MINI.cur.id === 'signal') MINI.cur.key(e); }); // 송출 사고: 키를 떼면 레벨이 내려간다
}
$i('mcok').onclick = () => { if (mgReward) store.dispatch({ type: 'GAIN', n: mgReward }); ui.toast(`${mgGrade}등급! ${fmt(mgReward)}점 획득`); mgReward = 0; mgClose(); };
$i('mcad').onclick = () => { if (!mgReward) return; const n = mgReward * 2; withAd(w => { store.dispatch({ type: 'GAIN', n }); ui.toast(`${w}${fmt(n)}점 획득!`); Sfx.play('buy'); mgReward = 0; mgClose(); if (mgStory) story.open(); }); };
$i('mcquit').onclick = () => { const p = mgPlay && mgPlay.practice; mgClose(); if (mgStory) story.open(); else if (p) mgMenu(); };
$i('mcagain').onclick = () => mgOpen(mgPlay.g, true);
$i('mcback').onclick = () => { mgClose(); if (mgStory) story.open(); else mgMenu(); };
// 미니게임 모음(연습)
function mgMenu() {
  const s = store.getState(), box = $i('mglist'); box.replaceChildren();
  MINI.LIST.forEach(g => {
    const row = document.createElement('div'), info = document.createElement('div'), b = document.createElement('b'), d = document.createElement('small'), best = document.createElement('span'), btn = document.createElement('button');
    row.className = 'mgi' + (mgMine(s, g) ? ' my' : ''); b.textContent = g.n; d.textContent = g.d; best.className = 'bg'; best.textContent = (s.mgBest || {})[g.id] || '-';
    btn.className = 'btn mini' + (g.soon ? ' alt' : ''); btn.textContent = g.soon ? '준비 중' : '연습'; btn.disabled = !!g.soon; btn.onclick = () => mgOpen(g, true);
    info.append(b, d); row.append(best, info, btn); box.append(row);
  });
  $i('mgmenu').hidden = false;
}
$i('mgmb').onclick = () => mgMenu();
// 상점(인앱 결제): 앱에서만 보인다. 웹은 #shoptest로 시험 구매
const SHOP_IC = { nd_noads: '🚫', nd_starter: '🎁' }; let shopPrice = {}, shopBusy = false;
function shopList() {
  const s = store.getState(), own = s.iap || {}, box = $i('shoplist'); box.replaceChildren();
  SHOP_ITEMS.forEach(it => {
    const row = document.createElement('div'), ic = document.createElement('div'), info = document.createElement('div'), b = document.createElement('b'), d = document.createElement('small'), btn = document.createElement('button');
    row.className = 'shopit' + (own[it.id] ? ' own' : ''); ic.className = 'ic'; ic.textContent = SHOP_IC[it.id] || '★'; b.textContent = it.n + (own[it.id] ? ' · 구매함' : ''); d.textContent = it.d;
    btn.className = 'btn' + (own[it.id] ? ' alt' : ' warn'); const web = !Shop.enabled(); btn.disabled = !!own[it.id] || shopBusy || web; btn.textContent = own[it.id] ? '보유 중' : web ? '앱에서 구매' : shopPrice[it.id] || it.price;
    btn.onclick = async () => {
      if (shopBusy) return; shopBusy = true; shopList(); $i('shopnote').textContent = 'Google Play 결제 창을 여는 중…';
      const r = await Shop.buy(it.id); shopBusy = false;
      if (r === 'ok') { store.dispatch({ type: 'IAP', id: it.id }); Sfx.play('rank'); ui.toast(`${it.n} 구매 완료! 고마워요.`); $i('shopnote').textContent = ''; }
      else $i('shopnote').textContent = r === 'pending' ? '결제가 아직 처리 중이에요. 완료되면 다음 실행 때 자동으로 지급돼요.' : r === 'cancel' ? '구매를 취소했어요.' : '결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
      shopList();
    };
    info.append(b, d); row.append(ic, info, btn); box.append(row);
  });
}
async function shopRestore(quiet) { const ids = await Shop.owned(); let n = 0; ids.forEach(id => { if (!(store.getState().iap || {})[id] && SHOP_ITEMS.some(i => i.id === id)) { store.dispatch({ type: 'IAP', id }); n++; } }); if (!quiet) $i('shopnote').textContent = n ? `${n}개 상품을 복원했어요.` : ids.length ? '이미 모두 받은 상태예요.' : '복원할 구매 내역이 없어요.'; if (!$i('shop').hidden) shopList(); }
$i('shopb').onclick = async () => { $i('shoprs').hidden = !Shop.enabled(); $i('shopnote').textContent = Shop.enabled() ? '' : '구매는 안드로이드 앱(Google Play)에서 할 수 있어요. 웹에서는 상품만 둘러볼 수 있어요.'; shopList(); $i('shop').hidden = false; shopPrice = await Shop.prices(); shopList(); };
$i('shopok').onclick = () => { $i('shop').hidden = true; markPop(); };
$i('shoprs').onclick = () => shopRestore(false);
if (Shop.native()) { setTimeout(() => shopRestore(true), 3000); document.addEventListener('visibilitychange', () => { if (!document.hidden) shopRestore(true); }); } // 재설치·결제 대기·Play 프로모션 코드로 받은 상품 자동 지급
// 쿠폰: 서버(nd_redeem)에서 코드 확인 → 보상 지급
const CPN_ERR = { none: '없는 쿠폰 코드예요. 다시 확인해 주세요.', used: '이 기기에서 이미 사용한 쿠폰이에요.', full: '이미 다른 분이 사용한 쿠폰이에요.', expired: '사용 기간이 지난 쿠폰이에요.' };
$i('cpnb').onclick = async () => {
  const code = $i('cpnin').value.trim().toUpperCase(); if (code.length < 4) return; $i('cpnb').disabled = true; $i('cpnn').textContent = '확인 중…';
  try { const r = await board.call('redeem', code);
    if (r && r.ok) { const w = r.reward || {}; store.dispatch({ type: 'COUPON', code, r: w }); Sfx.play('rank'); $i('cpnin').value = '';
      const parts = [w.tk ? `스카우트 티켓 ${w.tk}장` : '', w.spd ? `속도 x2 ${Math.round(w.spd / 3600 * 10) / 10}시간` : '', w.cof ? `커피타임 ${Math.round(w.cof / 60)}분` : '', w.badge === 'beta' ? '베타 테스터 배지' : ''].filter(Boolean).join(' + ');
      $i('cpnn').textContent = `${r.note || '쿠폰'} 지급 완료: ${parts}`; ui.toast(`🎁 ${parts}`); }
    else $i('cpnn').textContent = r && r.err === 'early' ? `${new Date(r.at).toLocaleDateString('ko-KR')}부터 쓸 수 있는 쿠폰이에요.` : CPN_ERR[r && r.err] || '쿠폰을 확인하지 못했어요.';
  } catch (e) { $i('cpnn').textContent = '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.'; }
  $i('cpnb').disabled = false;
};
// 스토리 모드
bus.on('storyGo', id => store.dispatch({ type: 'STORY_GO', id }));
bus.on('storyClaim', id => store.dispatch({ type: 'STORY_CLAIM', id }));
bus.on('storyReward', h => { ui.toast(`스토리 보상: 스카우트 티켓 ${h.tk}장 + ${fmt(h.n)}점`); Sfx.play('rank'); story.open(); });
bus.on('storyMini', id => { const g = MINI.LIST.find(x => x.id === id); if (g) mgOpen(g, true, true); });
bus.on('storyClose', () => markPop());
let stPrev = null;
$i('imini').onclick = () => enter(mgMenu);
$i('mgmok').onclick = () => { $i('mgmenu').hidden = true; markPop(); };
// 소소한 이벤트(커피타임·야식·제보 전화…): 접속 중 4~7분마다 보도국 화면 위에 25초 동안 뜬다. 놓쳐도 손해 없음
let pkNext = Date.now() + (150 + Math.random() * 120) * 1000, pkNow = null, pkUntil = 0;
const pkPick = () => { const tot = PERKS.reduce((a, p) => a + p.w, 0); let x = Math.random() * tot; return PERKS.find(p => (x -= p.w) < 0) || PERKS[0]; };
const pkHide = () => { $i('perk').hidden = true; pkNow = null; pkUntil = 0; pkNext = Date.now() + (240 + Math.random() * 180) * 1000; };
setInterval(() => {
  const s = store.getState(), now = Date.now(); if (!s.name || !isUnlocked(s, 'mis')) return;
  if (pkNow) { if (now > pkUntil) pkHide(); else $i('perkbar').style.transform = `scaleX(${(pkUntil - now) / 25000})`; return; }
  if (now >= pkNext && $i('intro').hidden && !document.hidden && !tutOn(s)) { pkNow = pkPick(); pkUntil = now + 25000; $i('perkt').textContent = pkNow.t; $i('perkd').textContent = pkNow.d; $i('perkb').textContent = pkNow.b; $i('perk').hidden = false; Sfx.play('buy'); }
}, 500);
if (location.hash === '#perk') pkNext = Date.now() + 2000; // 테스트용
$i('perkb').onclick = () => { if (!pkNow) return; const p = pkNow; store.dispatch({ type: 'PERK', id: p.id }); Sfx.play('rank'); ui.toast(`${p.t}! ${p.d}`); pkHide(); };
// 신문: 바로 띄우지 않고 '신문 도착' 버튼으로 (원할 때 본다)
let paperNow = null;
$i('pnew').onclick = () => { if (paperNow) { ui.showPaper(paperNow); paperNow = null; ui.paperReady(false); } };

const pushSchedule = hidden => { if (Native.isApp()) { if (hidden && store.getState().name) Native.schedule((8 + ((store.getState().res || {}).night || 0)) * 3600e3); else Native.cancel(); return; } if (!pushSub || !board || !store.getState().name) return; const cap = (8 + ((store.getState().res || {}).night || 0)) * 3600e3; board.pushSet(pushSub, hidden ? new Date(Date.now() + clockOff + cap).toISOString() : null, hidden).catch(() => { }); };
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
async function refresh(manual = false) {
  if (!board) return; const s = store.getState();
  if (s.name) try { await board.submit(toEntry(s)); } catch (e) { console.warn('순위 기록 실패', e); } // 기록 실패(검증 거부 등)여도 목록은 불러온다
  try { const e = toEntry(s), [list, my] = await Promise.all([board.top(100, e), s.name ? board.myRank(e).catch(() => null) : null]); ui.board(list, board.me || s.uid, board.mode, s.season.key, my); } catch (e) { if (manual) ui.toast('순위를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'); } // 자동 갱신 실패는 조용히
}
// 서버가 있으면 서버 시각으로 출석·주간·시즌을 계산한다(기기 시계 조작 방지)
const syncClock = () => board && board.now().then(t => { if (t) { clockOff = t - Date.now(); checkDates(); } }).catch(() => { });
createBoard(LEADERBOARD).then(b => { board = b; refresh(); syncClock(); setTimeout(() => { duelRefresh(); guildRefresh(); }, 3000); });
// ───── 시청률 대결 · 방송국 연합 (서버 모드에서만) ─────
const online = () => board && board.mode === 'server' && store.getState().name;
let duelLog = null, gInfo = null, gSentEv = null, gExtra = 0;
const perNow = () => Math.max(5, perSec({ ...store.getState(), ev: null, spdEnd: 0, gbEnd: 0 }));
function duelRefresh() {
  if (!online()) { social.offline(true); return; } social.offline(false);
  board.call('rival').then(r => { store.dispatch({ type: 'SETLR', lr: r ? { id: r.id, name: String(r.name).slice(0, 12), rating: +r.rating, live: !!r.live, w: r.w, l: r.l } : null }); social.duel(store.getState(), duelLog); }).catch(() => { });
  board.call('duels').then(d => { duelLog = d; social.duel(store.getState(), d); }).catch(() => { });
}
let gWasIn = null, gReqN = 0;
function guildRefresh() {
  if (!online()) return;
  board.call('guild').then(g => {
    if (gWasIn === false && g) { ui.toast(`🎉 ${g.name} 연합에 들어갔어요!`); Sfx.play('rank'); } // 가입 신청이 수락됨
    gWasIn = !!g; gInfo = g; store.dispatch({ type: 'SETGUILD', g: g ? { id: g.id, name: g.name, n: g.n } : null }); social.guild(g, perNow());
    if (!g) guildList();
    else if (g.isOwner) { if (g.reqn > gReqN) ui.toast(`📨 연합 가입 신청 ${g.reqn}건이 와 있어요`); gReqN = g.reqn || 0; board.call('guildReqs').then(r => social.reqs(r)).catch(() => social.reqs(null)); }
  }).catch(() => { });
}
function guildList() { if (!online()) return; board.call('guildList').then(gs => social.list(gs)).catch(() => social.list(null)); }
const GERR = e => { const m = String(e && e.message); return /guild full/.test(m) ? '연합 인원이 가득 찼어요.' : /cooldown/.test(m) ? '거절된 연합은 24시간 뒤에 다시 신청할 수 있어요.' : /too many/.test(m) ? '신청은 동시에 3곳까지 할 수 있어요.' : /bad message/.test(m) ? '인사말에 쓸 수 없는 말이 있어요.' : /already/.test(m) ? '이미 연합에 들어가 있어요.' : /no such/.test(m) ? '없어진 연합이에요.' : /no request/.test(m) ? '이미 처리된 신청이에요.' : '처리하지 못했어요. 잠시 후 다시 해 주세요.'; };
bus.on('glist', guildList);
bus.on('gapply', ({ id, msg }) => { board.call('guildApply', id, msg || '').then(r => { if (r && r.joined) { ui.toast('연합에 들어갔어요!'); Sfx.play('rank'); gWasIn = true; guildRefresh(); } else { ui.toast('가입 신청을 보냈어요. 연합장이 수락하면 알려 드려요.'); guildList(); } }).catch(e => { ui.toast(GERR(e)); guildList(); }); });
bus.on('gcancel', id => { board.call('guildCancel', id).then(() => guildList()).catch(e => { ui.toast(GERR(e)); guildList(); }); });
bus.on('gdecide', ({ who, ok }) => { board.call('guildDecide', who, !!ok).then(r => { ui.toast(r && r.res === 'ok' ? '가입을 수락했어요.' : r && r.res === 'taken' ? '이미 다른 연합에 들어간 분이에요.' : '신청을 거절했어요.'); guildRefresh(); }).catch(e => { ui.toast(GERR(e)); guildRefresh(); }); });
bus.on('gmode', m => { board.call('guildMode', m).then(() => { ui.toast(`가입 방식: ${{ approve: '승인 필요', open: '자유 가입', invite: '초대만' }[m]}`); guildRefresh(); }).catch(e => ui.toast(GERR(e))); });
function guildSend() { // 공동 특보 기여: 지난번 이후 대응한 속보 수(+미니게임 5건씩)를 보낸다
  const s = store.getState(); if (!online() || !s.guild) { gSentEv = s.evCount; return; }
  if (gSentEv == null) gSentEv = s.evCount;
  const d = Math.min(40, s.evCount - gSentEv + gExtra); if (d <= 0) return;
  board.call('guildAdd', d).then(n => { if (n > 0) { const fromEv = Math.min(n, s.evCount - gSentEv); gSentEv += fromEv; gExtra = Math.max(0, gExtra - (n - fromEv)); guildRefresh(); } }).catch(() => { });
}
setInterval(guildSend, 60000); setInterval(guildRefresh, 120000); setInterval(duelRefresh, 600000);
$i('tab-rank').addEventListener('click', () => { duelRefresh(); guildRefresh(); });
bus.on('gcreate', n => { if (!online()) return ui.toast('온라인 서버에 연결된 뒤 할 수 있어요.'); const c = checkName(n); if (c.err) return ui.toast(c.err); board.call('guildCreate', c.name || n).then(g => { Sfx.play('rank'); ui.toast(`연합 "${g.name}"을 만들었어요! 초대 코드 ${g.code}를 친구에게 알려 주세요.`); guildRefresh(); }).catch(err => ui.toast(/name not allowed/.test(err.message) ? '쓸 수 없는 이름이에요.' : '연합을 만들지 못했어요.')); });
bus.on('gjoin', c => { if (!online()) return ui.toast('온라인 서버에 연결된 뒤 할 수 있어요.'); if (!/^[A-Z0-9]{6}$/.test(c)) return ui.toast('초대 코드 6자리를 확인해 주세요.'); board.call('guildJoin', c).then(g => { Sfx.play('rank'); ui.toast(`"${g.name}" 연합에 가입했어요!`); guildRefresh(); }).catch(err => ui.toast(/guild full/.test(err.message) ? '연합이 가득 찼어요(20명).' : /no such/.test(err.message) ? '없는 초대 코드예요.' : '가입하지 못했어요.')); });
bus.on('gleave', () => { board.call('guildLeave').then(() => { ui.toast('연합에서 탈퇴했어요.'); gInfo = null; gWasIn = false; guildList(); store.dispatch({ type: 'SETGUILD', g: null }); social.guild(null); }).catch(() => ui.toast('탈퇴하지 못했어요.')); });
bus.on('gcopy', () => { const c = gInfo && gInfo.code; if (!c) return; (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => ui.toast('초대 코드를 복사했어요.'), () => ui.toast(`초대 코드: ${c}`)); });
bus.on('gclaim', () => { board.call('guildClaim').then(ok => { if (!ok) return ui.toast('아직 받을 수 없어요.'); const n = Math.floor(perNow() * 1800); store.dispatch({ type: 'GREWARD', n, tk: 3 }); Sfx.play('rank'); ui.toast(`공동 특보 성공! 티켓 3장 + ${fmt(n)}점`); guildRefresh(); }).catch(() => ui.toast('보상을 받지 못했어요.')); });
setInterval(syncClock, 600000);

// Command 핸들러: 사용자 의도 -> 상태 변경 + 피드백
bus.on('name', ({ name, job }) => {
  const r = checkName(name); if (r.err) return ui.toast(r.err);
  const p = store.getState(), renamed = !!p.name; store.dispatch({ type: 'NAME', name: r.name, uid: newId(), job }); ui.closeName(); Sfx.play('rank');
  const J = JOBS.find(x => x.id === job);
  ui.toast(renamed ? (p.job && p.job !== job ? `${J.n}(으)로 전직했어요! 특기: ${J.perk}` : `방송국 이름을 ${r.name}(으)로 바꿨어요.`) : `${r.name} 방송 시작! ${J.n}의 특기: ${J.perk}`); checkDates(); refresh();
});
bus.on('rename', () => ui.askName(store.getState().name, store.getState().job || 'editor'));
bus.on('board', () => refresh(true));
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
bus.on('brup', id => { const p = store.getState(); store.dispatch({ type: 'BRUP', id }); const s = store.getState(); if (s !== p) { Sfx.play('rank'); ui.toast((p.br || {})[id] ? '지국을 확장했어요!' : '새 지국을 열었어요! 지도를 확인해 보세요.'); } else Sfx.play('fail'); });
bus.on('deco', id => { const p = store.getState(); store.dispatch({ type: 'DECO', id }); if (store.getState() !== p) { Sfx.play('rank'); ui.toast('사무실에 배치했어요! 점수 +2%'); } else { Sfx.play('fail'); ui.toast('점수가 부족해요.'); } });
let paperBonus = 0;
bus.on('paperad', () => { if (!paperBonus) return; withAd(w => { if (!paperBonus) return; store.dispatch({ type: 'GAIN', n: paperBonus }); paperBonus = 0; ui.paperAdDone(); Sfx.play('buy'); ui.toast(`${w}광고 수입 2배!`); }); });
bus.on('judge', pick => { const s = store.getState(); if (!s.ev || !s.ev.dil || s.ev.pick) return; store.dispatch({ type: 'JUDGE', pick, r: Math.random() }); });
bus.on('meet', id => { const p = store.getState(); store.dispatch({ type: 'MEET', id }); if (store.getState() !== p) { Sfx.play('rank'); ui.toast('편집회의 결정! 오늘은 이 분야를 톱으로 갑니다.'); } });
bus.on('setn', n => store.dispatch({ type: 'SETN', n }));
bus.on('boost', () => {
  const s = store.getState();
  if (!s.ev) return ui.toast('지금은 진행 중인 속보가 없어요.');
  if (s.ev.boost) return;
  store.dispatch({ type: 'BOOST' }); Sfx.play('buy'); ui.toast('우선 편집: 이번 속보 점수 +50%');
});
bus.on('claim', k => { const give = w => { if (!pending) return; store.dispatch({ type: 'GAIN', n: pending * k }); pending = 0; ui.hideOffline(); Sfx.play('buy'); if (k > 1) ui.toast(`${w}보상 ${k}배!`); }; if (k > 1) withAd(give); else give(''); });
bus.on('prestige', () => { if (prestigeGain(store.getState()) < 1) return ui.toast('이번 회차 100만 점부터 개편할 수 있어요.'); store.dispatch({ type: 'PRESTIGE' }); Sfx.play('rank'); ui.toast('개편 완료! 시청률 포인트를 얻었어요.'); });
bus.on('reset', () => { Repo.clear(); store.dispatch({ type: 'RESET' }); ui.toast('저장 데이터를 지웠어요.'); ui.askName(); });
bus.on('gold', () => {
  const s = store.getState(); if (!s.gold) return;
  const r = Math.random(), g = goldReward(s, r); store.dispatch({ type: 'GOLD', r }); Sfx.play('rank');
  ui.toast(g.frenzy ? `특종 터졌다! 20초 동안 점수 x${BAL.frenzy}` : `특종! 점수 +${fmt(g.cash)}`);
});
bus.on('spd', () => {
  const s = store.getState(); if (s.clock < s.spdReady) return ui.toast('부스트는 잠시 후 다시 쓸 수 있어요.');
  withAd(w => { const s2 = store.getState(); if (s2.clock < s2.spdReady) return; store.dispatch({ type: 'SPD' }); Sfx.play('buy'); ui.toast(`${w}2분 동안 처리 속도 x2`); });
});
bus.on('scout', how => {
  const s = store.getState(), h = how === 'free' ? (s.tickets > 0 ? 'ticket' : 'ad') : how;
  if (h === 'paid' && s.score < scoutCost(s)) { Sfx.play('fail'); return ui.toast('점수가 부족해요.'); }
  if (h === 'ad' && s.clock < s.freeReady) return ui.toast('광고 스카우트는 잠시 후 다시 쓸 수 있어요.');
  if (h === 'ad') return withAd(w => doScout(h, w));
  doScout(h, '');
});
function doScout(h, w) {
  store.dispatch({ type: 'SCOUT', how: h, r: Math.random(), r2: Math.random() }); Sfx.play(store.getState().last.miss ? 'fail' : 'rank');
  const l = store.getState().last;
  if (l.miss) return ui.toast(`꽝! 이번엔 합격자가 없어요${l.back ? ` · 위로금 +${fmt(l.back)}점` : ''}${w ? ' · ' + w.trim() : ''}`);
  const c = CARDS.find(x => x.id === l.id);
  ui.toast(`스카우트: ${c.n} (${RARITY[c.rar].n})${l.isNew ? ' NEW!' : l.maxed ? ' 최대 ★ 보너스 +500점' : ' ★ 상승'}${w ? ' · ' + w.trim() : ''}`);
}
bus.on('goal', id => {
  const s = store.getState(), g = WEEKLY.find(x => x.id === id); if (!g || s.week.done[id] || (s.week.prog[g.k] || 0) < g.goal) return;
  store.dispatch({ type: 'CLAIM', id }); Sfx.play('rank'); ui.toast(`주간 목표 달성: ${g.n} · 보상과 스카우트 티켓 +1`);
});
bus.on('chal', id => { const c = CHALLENGES.find(x => x.id === id); store.dispatch({ type: 'CHAL', id }); Sfx.play('rank'); ui.toast(`챌린지 시작: ${c.n} · 목표 누적 ${fmt(c.goal)}점`); });
bus.on('chalquit', () => { store.dispatch({ type: 'CHAL_QUIT' }); Sfx.play('fail'); ui.toast('챌린지를 포기했어요. 회차가 처음부터 다시 시작돼요.'); });
bus.on('tut', step => { store.dispatch({ type: 'TUT', step }); if (step === 0) ui.showTab('desk'); if (step === -1) ui.toast('안내를 닫았어요. 위의 ? 버튼에서 안내서와 처음 안내를 다시 볼 수 있어요.'); });
bus.on('mute', () => ui.setMute(Sfx.toggle()));

// 상태 변화 구독: 효과음과 알림
store.subscribe((s, p) => {
  pump(s);
  { const A = Analytics; // 익명 통계: 상태가 바뀐 순간만 센다
    if (s.name && !p.name) A.log('start', { job: s.job || '' });
    if (s.tut !== p.tut && p.name) A.log('tut', { step: s.tut });
    if (s.pulls > p.pulls) A.log('scout', { n: s.pulls, tk: s.tickets < p.tickets ? 1 : 0 });
    if (s.ach.length > p.ach.length) A.log('ach', { n: s.ach.length });
    if (rank(s) > rank(p)) A.log('rank', { r: rank(s) });
    if (s.run < p.run * .5 && s.pts > p.pts) A.log('prestige', { pts: Math.round(s.pts) });
    if (s.mgN > p.mgN) A.log('minigame', { n: s.mgN });
    if (s.story && p.story && Object.keys(s.story.done).length > Object.keys(p.story.done).length) A.log('story', { n: Object.keys(s.story.done).length });
    if (s.iap && p.iap) Object.keys(s.iap).forEach(k => { if (s.iap[k] && !p.iap[k]) A.log('iap', { id: k }); });
    if (s.misHit && s.misHit !== p.misHit) A.log('mission', { all: s.misHit.all ? 1 : 0 });
    if (s.report && s.report !== p.report) A.log('news8', { r: Math.round(s.report.rating * 10) / 10 });
    if (s.chalWin && s.chalWin !== p.chalWin) A.log('chal', {}); }
  if (s.ev && (!p.ev || p.ev.id !== s.ev.id || p.ev.end !== s.ev.end)) Sfx.play('alert');
  if (!!s.ev !== !!p.ev && $i('intro').hidden) Music.play(s.ev ? 'breaking' : 'desk'); // 속보 중에는 긴박한 곡
  if (s.gold && !p.gold) Sfx.play('alert');
  if (s.chalWin && s.chalWin !== p.chalWin) { const c = CHALLENGES.find(x => x.id === s.chalWin.split(':')[0]); Sfx.play('rank'); ui.toast(`챌린지 완료: ${c.n}! 영구 점수 +10%`); }
  if (s.lastSeason && s.lastSeason !== p.lastSeason) { const l = s.lastSeason; Sfx.play('rank'); ui.toast(`시즌 종료: ${TIERS[l.tier].n} 달성 · 스카우트 티켓 +${l.tk}장`); }
  if (s.daily && s.daily !== p.daily) { const d = s.daily; Sfx.play('rank'); ui.toast(`출석 ${d.streak}일째! 보너스 +${fmt(d.gain)}점${d.tk ? ' · 스카우트 티켓 +1' : ''}`); }
  if (s.report && s.report !== p.report && online()) { const r = s.report; board.call('rate', r.rating, r.real ? r.oppId : null, r.real ? r.rival : null).catch(() => { }).then(() => setTimeout(duelRefresh, 1500)); }
  if (s.report && s.report !== p.report) { const r = s.report; Sfx.play('rank'); paperBonus = r.bonus; paperNow = paper(s.name, r); ui.paperReady(true); ui.toast(`8시 뉴스 시청률 ${r.rating.toFixed(1)}%${r.pay ? ` · 성과급 +${fmt(r.pay)}` : ''}${r.rival != null ? (r.won ? ' · 라이벌에 승리!' : ' · 라이벌에 패배') : ''} · 광고 수입 +${fmt(r.bonus)}점`); refresh(); }
  if (s.judge && s.judge !== p.judge) { const j = s.judge.res; Sfx.play(j === 'fail' ? 'fail' : j === 'win' ? 'rank' : 'buy'); ui.toast(j === 'win' ? '단독 성공! 이번 속보 점수 x2 · 오늘 시청률 +0.8' : j === 'fail' ? '오보! 정정 보도 나갑니다... 오늘 시청률 -1.2' : '팩트 체크 완료, 안전하게 송출 (점수 x1.2)'); }
  if (s.misHit && s.misHit !== p.misHit) { const m = s.misHit; Sfx.play('rank'); ui.toast(m.all ? `오늘의 미션 올클리어! +${fmt(m.gain)}점 · 스카우트 티켓 +1` : `미션 달성! +${fmt(m.gain)}점`); }
  if (s.promo && s.promo !== p.promo) { for (let k = popQ.length - 1; k >= 0; k--) if (popQ[k].kind === 'promo') popQ.splice(k, 1); popQ.push({ kind: 'promo', i: s.promo.i, tk: s.promo.tk }); } // 대기 중인 승진 창은 최신 것 하나만
  if (s.unlHit && s.unlHit !== p.unlHit) { // 기능 해금: 하나면 안내 카드, 한꺼번에 여러 개(예전 저장본)면 조용히 표시만
    const ids = s.unlHit.ids; if (ids.length === 1 && p.name) { const u = UNLOCKS.find(x => x.id === ids[0]); popQ.push({ kind: 'tip', t: { ...u, t: `새 기능: ${u.t}` } }); Sfx.play('rank'); } else ids.forEach(id => store.dispatch({ type: 'TIP', id }));
  }
  if (s.weHit && s.weHit !== p.weHit) { Sfx.play('rank'); ui.toast('한정 이벤트 달성! 스카우트 티켓 +2 · 한정 배지 획득'); }
  if (s.ev && s.ev.id === 'robot' && (!p.ev || p.ev.id !== 'robot')) ui.toast(heroCount(s) ? `뉴스 디펜더즈 ${heroCount(s)}명 출동! 이번 속보 점수 +${Math.round((heroCount(s) * .5 + setRobot(s)) * 100)}%` : '거대 로봇 습격! 히어로 카드가 있으면 점수가 크게 올라요.');
  if (s.pulls > p.pulls) CARD_SETS.forEach(g => { const a = setLevel(p, g), b = setLevel(s, g); if (b > a) { Analytics.log('set', { id: g.id, n: b }); Sfx.play('rank'); ui.toast(a ? `세트 강화: ${g.n} ★${b}` : `세트 효과 발동: ${g.n}!`); } });
  if (s.ach.length > p.ach.length) { const a = ACHIEVEMENTS.find(x => x.id === s.ach[s.ach.length - 1]); Sfx.play('rank'); ui.toast(`업적 달성: ${a.n} (점수 +2%)`); }
  if (rank(s) > rank(p)) { Sfx.play('rank'); ui.toast(`승급: ${RANKS[rank(s)].n}`); }
});

GameLoop({
  step: dt => { const s = store.getState(); if (!s.name) { ui.render(s); return; } $i('shopb').hidden = false; $i('cpnt').textContent = s.beta ? '★ 베타 테스터' : ''; document.body.classList.toggle('noads', !!(s.iap || {}).nd_noads); { const sts = story.refresh(s); if (stPrev && sts.some((x, i) => (x === 'new' && stPrev[i] === 'lock') || (x === 'claim' && stPrev[i] === 'mis'))) { const i = sts.findIndex((x, j) => x !== stPrev[j]); ui.toast(sts[i] === 'new' ? `📖 새 이야기 「${STORY[i].n}」가 열렸어요` : `📖 스토리 미션 완료! 보상을 받으세요`); Sfx.play('alert'); } stPrev = sts; } bubbles.update(dt, s, !document.querySelector('.pane[data-tab="desk"]').hidden); store.dispatch({ type: 'TICK', dt, rnd: Math.random(), r2: Math.random(), r3: Math.random() }); scheduler.update(); ui.render(store.getState()); if (!$i('brp').closest('.pane').hidden) branches.render(store.getState()); },
  render: t => { scene.draw(store.getState(), t, ui.sel()); if (!$i('brp').closest('.pane').hidden) branches.draw(store.getState(), t); },
}).start();
setInterval(() => { if (!restoring) Repo.save(store.getState()); }, 5000); // 자동 저장: 5초마다
// 앱을 닫거나 다른 앱으로 넘어갈 때도 즉시 저장
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!restoring) { Repo.save(store.getState()); cloudSave(true); } Music.pause(); pushSchedule(true); } else { Music.resume(); pushSchedule(false); } });
addEventListener('pagehide', () => { if (!restoring) Repo.save(store.getState()); });
setInterval(refresh, 60000);
setInterval(checkDates, 60000);
