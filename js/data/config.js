export const SAVE_KEY = 'newsDeskIdle.v2';
export const STAGES = ['취재', '인제스트', '편집', 'CG', '송출'];
export const BASE = [2, 1.6, 1, 1.4, 1.8];
export const RANKS = [{ n: '지역 뉴스', at: 0 }, { n: '저녁 종합', at: 5e3 }, { n: '8시 메인', at: 2e5 }, { n: '24시 채널', at: 1e7 }];
export const MILESTONES = [10, 25, 50, 100];
export const UPGRADES = [
  { id: 'ing', n: '인제스트 서버', d: '등록 속도 +12%', base: 50, g: 1.12, st: 1, pct: .12 },
  { id: 'edit', n: '편집기자 충원', d: '편집 속도 +15%', base: 200, g: 1.15, st: 2, pct: .15 },
  { id: 'cg', n: 'CG 템플릿', d: 'CG 처리 +12%', base: 800, g: 1.15, st: 3, pct: .12 },
  { id: 'out', n: '송출 자동화', d: '송출 처리 +10%', base: 3000, g: 1.17, st: 4, pct: .10 },
  { id: 'live', n: '중계 장비', d: '속보 보상 +10%', base: 4000, g: 1.18, st: -1, pct: .10 },
  { id: 'crew', n: '취재팀 확장', d: '취재 유입 +15%', base: 15000, g: 1.2, st: 0, pct: .15 },
  { id: 'qual', n: '방송 품질', d: '점수 +20%', base: 300, g: 1.4, st: -1, pct: .2, nm: true },
];
export const EVENTS = [
  { id: 'crime', k: '사건사고', names: ['도심 건물 화재', '강력 사건 발생'], dur: 30, inf: 3, sc: 2, min: 0 },
  { id: 'weather', k: '날씨', names: ['한파와 폭설, 교통 마비', '집중 호우, 도심 침수'], dur: 120, inf: .5, sc: 1.5, min: 0 },
  { id: 'politics', k: '정치', names: ['대선 개표 중계 (가상)'], dur: 180, inf: 2, sc: 3, min: 5e3 },
  { id: 'world', k: '국제', names: ['인접국 미사일 발사'], dur: 45, inf: 2.5, sc: 2.5, min: 2e5 },
  { id: 'sports', k: '스포츠', names: ['세계 종합 스포츠 대회 금메달'], dur: 120, inf: 4, sc: 4, min: 2e5 },
  { id: 'robot', k: '특보', names: ['거대 로봇 도심 출현 (가상)'], dur: 40, inf: 3, sc: 4, min: 1e6, w: .35 }, // 히어로 카드 1장당 점수 +50%
];
export const MANAGER = [2000, 8000, 30000, 120000, 500000];
export const CHIEF = 40000;
export const ACHIEVEMENTS = [
  { id: 'a1', n: '첫 송출', d: '누적 10점', t: s => s.run >= 10 },
  { id: 'a2', n: '지역 방송 기자', d: '누적 1만 점', t: s => s.run >= 1e4 },
  { id: 'a3', n: '메인 뉴스 입성', d: '누적 100만 점', t: s => s.run >= 1e6 },
  { id: 'a4', n: '시청률 왕', d: '누적 1억 점', t: s => s.run >= 1e8 },
  { id: 'a5', n: '속보 초보', d: '속보 5회 대응', t: s => s.evCount >= 5 },
  { id: 'a6', n: '속보 베테랑', d: '속보 25회 대응', t: s => s.evCount >= 25 },
  { id: 'a7', n: '첫 매니저', d: '매니저 1명 고용', t: s => s.mg.some(Boolean) },
  { id: 'a8', n: '전 층 매니저', d: '모든 층 매니저 고용', t: s => s.mg.every(Boolean) },
  { id: 'a9', n: '시설 강화', d: '업그레이드 Lv.25 달성', t: s => Object.values(s.lv).some(l => l >= 25) },
  { id: 'a10', n: '시설 만렙급', d: '업그레이드 Lv.100 달성', t: s => Object.values(s.lv).some(l => l >= 100) },
  { id: 'a11', n: '팀장 영입', d: '영상편집팀장 고용', t: s => !!s.chief },
  { id: 'a12', n: '특종 사냥꾼', d: '특종 5회 획득', t: s => s.goldCount >= 5 },
  { id: 'a13', n: '시청률 두 자릿수', d: '시청률 10% 돌파', t: s => s.bestRating >= 10 },
  { id: 'a14', n: '유튜브 100만 뷰', d: '유튜브 누적 조회수 100만', t: s => s.views >= 1e6 },
  { id: 'a15', n: '스카우트 단장', d: '직원 카드 6종 수집', t: s => Object.keys(s.cards).length >= 6 },
  { id: 'a16', n: '한계 돌파', d: '챌린지 1개 완료', t: s => Object.keys(s.chalDone).length >= 1 },
  { id: 'a17', n: '동시간대 1위', d: '라이벌에게 3일 연속 승리', t: s => (s.bestWin || 0) >= 3 },
  { id: 'a18', n: '단독의 신', d: '단독 보도 10회 성공', t: s => (s.scoopT || 0) >= 10 },
  { id: 'a19', n: '성실한 보도국', d: '오늘의 미션 올클리어 5회', t: s => (s.misAll || 0) >= 5 },
];
export const DAY_SEC = 300; // 게임 속 하루(오전 6시 → 8시 뉴스)의 실제 시간(초): 5분
// 사용자 간 순위 서버 (Supabase REST). 비워두면 오프라인 모드(샘플 방송국과 비교)로 동작한다. README 참고
export const LEADERBOARD = { url: 'https://ndyiuefcvhnqnfdziacv.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5keWl1ZWZjdmhucW5mZHppYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTE5MDEsImV4cCI6MjEwNzY4NzkwMX0.Tlb5AhmdCeQdZNkB5zd9P3Fw-4vdqZqM9k8oH4aOvWE' }; // anon(공개) 키. service_role 키는 절대 넣지 말 것
// 직원 카드 도감 (AFK Arena식 수집): 가진 카드는 해당 층 속도를 영구로 올리고, 중복으로 뽑으면 별(최대 3)이 올라 효과가 커진다
export const RARITY = [{ n: '일반', b: .05, c: '#94b0c2' }, { n: '희귀', b: .10, c: '#41a6f6' }, { n: '영웅', b: .20, c: '#b45bff' }, { n: '전설', b: .25, c: '#ffd24a' }];
export const CARDS = [
  { id: 'c1', n: '신입 카메라기자', st: 0, rar: 0 }, { id: 'c2', n: '수습 인제스트 요원', st: 1, rar: 0 }, { id: 'c3', n: '막내 영상편집기자', st: 2, rar: 0 },
  { id: 'c4', n: '인턴 그래픽 디자이너', st: 3, rar: 0 }, { id: 'c5', n: '신입 아나운서', st: 4, rar: 0 }, { id: 'c6', n: '베테랑 영상기자', st: 0, rar: 1 },
  { id: 'c7', n: '야근 영상편집기자', st: 2, rar: 1 }, { id: 'c8', n: '모션 그래픽 전문가', st: 3, rar: 1 }, { id: 'c9', n: '탐사 취재기자', st: 0, rar: 2 },
  { id: 'c10', n: '편집 달인', st: 2, rar: 2 }, { id: 'c11', n: '메인 앵커', st: 4, rar: 2 }, { id: 'c12', n: '전설의 보도국장', st: -1, rar: 3 },
  // 뉴스 디펜더즈(오리지널 히어로): 전설 등급. 거대 로봇 속보 때 1장당 점수 +50%
  { id: 'h1', n: '캡틴 큐시트', st: -1, rar: 3, hero: 'cap' }, { id: 'h2', n: '프레임 닌자', st: 2, rar: 3, hero: 'ninja' },
  { id: 'h3', n: '메카 앵커', st: 4, rar: 3, hero: 'mecha' }, { id: 'h4', n: '나이트 에디터', st: 3, rar: 3, hero: 'night' },
];
// 주간 목표 (Egg Inc의 계약식): 매주 월요일에 초기화
export const WEEKLY = [
  { id: 'w1', n: '속보 20회 대응', k: 'ev', goal: 20 }, { id: 'w2', n: '시청률 6% 이상 3일', k: 'rate', goal: 3 }, { id: 'w3', n: '특종 5회 획득', k: 'gold', goal: 5 },
  { id: 'w4', n: '업그레이드 50레벨 구매', k: 'buy', goal: 50 }, { id: 'w5', n: '스카우트 3회', k: 'pull', goal: 3 },
];
// 스카우트 확률(등급 순서: 일반, 희귀, 영웅, 전설). 합계의 나머지가 꽝이다. PITY번째 스카우트는 영웅 이상 보장
export const ODDS = [.29, .17, .065, .025];
export const PITY = 30;
// 시즌(매월 1일 시작): 시즌 점수로 등급을 매기고, 시즌이 끝나면 등급에 따라 스카우트 티켓 1~5장 지급
export const TIERS = [{ n: '브론즈', at: 0 }, { n: '실버', at: 1e5 }, { n: '골드', at: 1e6 }, { n: '플래티넘', at: 1e7 }, { n: '다이아', at: 1e8 }];
// 시즌 테마: 해당 속보가 3배 자주 발생 (name: 같은 카테고리 안에서 쓸 속보 이름 번호)
export const SEASON_THEMES = [
  { months: [12, 1, 2], n: '한파 시즌', ev: 'weather', name: 0, d: '한파·폭설 속보가 3배 자주 터져요.' },
  { months: [3, 4, 5], n: '선거 시즌', ev: 'politics', d: '개표 중계 속보가 3배 자주 터져요. (누적 5천 점부터)' },
  { months: [6, 7, 8], n: '장마 시즌', ev: 'weather', name: 1, d: '집중 호우 속보가 3배 자주 터져요.' },
  { months: [9, 10, 11], n: '스포츠 대회 시즌', ev: 'sports', d: '금메달 속보가 3배 자주 터져요. (누적 20만 점부터)' },
];
// 챌린지: 시작하면 이번 회차가 초기화되고, 제약 속에서 목표(이번 회차 누적 점수)를 달성하면 영구 점수 +10%
export const CHALLENGES = [
  { id: 'noMgr', n: '매니저 없이 운영', d: '매니저·영상편집팀장 고용 불가 · 누적 20만 점', goal: 2e5 },
  { id: 'calm', n: '평온한 보도국', d: '속보와 특종이 오지 않음 · 누적 5만 점', goal: 5e4 },
  { id: 'noQual', n: '저예산 방송', d: '방송 품질 업그레이드 불가 · 누적 20만 점', goal: 2e5 },
];
// 라이벌 방송국: 매일 8시 뉴스에서 시청률 대결 (가상 이름)
export const RIVAL = '한누리방송';
// 오늘의 미션: 게임 속 하루마다 3개. {g}는 목표치. out 목표는 현재 처리 속도로 정한다
export const MISSIONS = [
  { k: 'out', n: '뉴스 {g}건 송출' },
  { k: 'ev', n: '속보 {g}건 대응', g: 2 },
  { k: 'gold', n: '특종 {g}번 잡기', g: 1 },
  { k: 'buy', n: '업그레이드 {g}레벨 올리기', g: 10 },
  { k: 'pull', n: '스카우트 {g}회', g: 1 },
  { k: 'scoop', n: '단독 보도 {g}회 성공', g: 1 },
];
// 속보 판단: 바로 단독으로 내보낼지, 확인 후 내보낼지 고르는 순간 (category id → 상황)
export const DILEMMAS = {
  crime: '출처 미확인 현장 영상 제보가 들어왔어요.',
  weather: 'SNS에 침수 영상이 퍼지는 중. 원본 확인 전이에요.',
  politics: '출구조사 결과라는 문서가 들어왔어요.',
  world: '외신 단독 보도가 떴어요. 국내 확인 전이에요.',
  sports: '선수 독점 인터뷰 영상, 사용 허락 확인 중이에요.',
  robot: '로봇 조종사가 누구라는 미확인 제보가 들어왔어요.',
};
export const SCOOP_P = .65, DIL_SEC = 15;
// 방송 기술 연구소: 연구 포인트(RP)로 영구 강화 (개편해도 유지). req = [선행 연구, 필요 레벨]
// RP 획득: 8시 뉴스 평가(1 + 시청률/4), 미션 달성 1, 단독 성공 1, 라이벌 승리 1
export const RESEARCH = [
  { id: 'speed', n: '장비 고도화', d: '모든 층 처리 속도 +10%', max: 10, c: 2 },
  { id: 'rating', n: '앵커 트레이닝', d: '8시 뉴스 시청률 +0.3', max: 5, c: 3 },
  { id: 'event', n: '속보 대응 매뉴얼', d: '속보 점수 +15%', max: 5, c: 3, req: ['speed', 2] },
  { id: 'cost', n: '예산 협상', d: '업그레이드 비용 -3%', max: 5, c: 4, req: ['speed', 3] },
  { id: 'scoop', n: '취재원 관리', d: '단독 성공률 +4%p', max: 5, c: 4, req: ['rating', 2] },
  { id: 'gold', n: '특종 감각', d: '특종 등장 간격 -8%', max: 5, c: 4, req: ['rating', 2] },
  { id: 'night', n: '야간 근무조', d: '오프라인 수익 +10%p · 최대 +1시간', max: 5, c: 5, req: ['event', 2] },
];
// 사무실 꾸미기: 하나당 점수 +2% (개편해도 유지). at = 점수 가격, need = 해금 조건
export const DECOS = [
  { id: 'plant', n: '편집실 화분', fl: 2, at: 2e4 },
  { id: 'coffee', n: '인제스트실 커피 머신', fl: 1, at: 2e5 },
  { id: 'cat', n: '보도국 고양이', fl: 7, at: 2e6 },
  { id: 'sofa', n: 'CG실 야근 소파', fl: 3, at: 2e7 },
  { id: 'neon', n: '스튜디오 네온 간판', fl: 4, at: 2e8 },
  { id: 'tank', n: '로비 수족관', fl: 6, at: 2e9 },
  { id: 'trophy', n: '동시간대 1위 트로피', fl: 4, need: s => (s.bestWin || 0) >= 3, nt: '라이벌 3연승' },
  { id: 'mic', n: '황금 마이크', fl: 0, need: s => s.bestRating >= 10, nt: '시청률 10% 돌파' },
];
// 커리어: 조건을 채우면 승진(개편해도 유지). 승진마다 영구 점수 +5%와 스카우트 티켓
export const CAREER = [
  { n: '수습 영상편집기자' },
  { n: '영상편집기자', need: s => s.total >= 1e4, nd: '누적 1만 점', tk: 1, who: '영상편집팀장', say: ['수습 딱지 뗐다. 오늘부터 네 이름으로 리포트 붙는다.', '마감 5분 전에 올리는 버릇만 고치자.'] },
  { n: '선임 영상편집기자', need: s => s.total >= 1e7 && s.evCount >= 30, nd: '누적 1천만 점 · 속보 30회 대응', tk: 1, who: '보도국장', say: ['속보 때 손 빠른 거 다들 봤어.', '이제 후배들 편집도 좀 봐 줘.'] },
  { n: '영상편집 데스크', need: s => s.total >= 1e10 && s.bestRating >= 12 && s.evCount >= 80, nd: '누적 100억 점 · 최고 시청률 12% · 속보 80회', tk: 2, who: '보도국장', say: ['8시 뉴스 큐시트, 이제 자네가 챙기게.', '데스크는 모든 컷의 마지막 눈이야.'] },
  { n: '영상편집부장', need: s => s.total >= 1e13 && s.pts >= 10, nd: '누적 10조 점 · 개편 포인트 10', tk: 2, who: '보도국장', say: ['영상편집부를 맡아 줘.', '사람이 먼저야. 장비는 그다음이고.'] },
  { n: '보도국장', need: s => s.total >= 1e16 && (s.bestWin || 0) >= 5, nd: '누적 1경 점 · 라이벌 5연승', tk: 3, who: '사장', say: ['보도국을 맡기겠습니다.', '오늘도 방송은 계속됩니다.'] },
];
// 주간 한정 이벤트: 매주 월요일(서버 시각)마다 바뀐다. 목표 달성 시 티켓 2장 + 한정 배지
export const WEEK_EVENTS = [
  { id: 'vote', n: '대선 개표 방송 주간 (가상)', d: '정치 속보가 4배 자주, 점수 x1.5', ev: 'politics', w: 4, sc: 1.5, k: 'ev', goal: 8, gd: '정치 속보 8회 대응' },
  { id: 'games', n: '세계 스포츠 대회 주간', d: '스포츠 속보가 4배 자주, 점수 x1.5', ev: 'sports', w: 4, sc: 1.5, k: 'ev', goal: 8, gd: '스포츠 속보 8회 대응' },
  { id: 'storm', n: '태풍 특보 주간', d: '날씨 속보가 4배 자주, 점수 x1.5', ev: 'weather', w: 4, sc: 1.5, k: 'ev', goal: 10, gd: '날씨 속보 10회 대응' },
  { id: 'robots', n: '로봇 출몰 주간 (가상)', d: '거대 로봇 속보가 자주, 히어로 카드 확률 2배', ev: 'robot', w: 4, sc: 1.5, hero: 2, k: 'ev', goal: 5, gd: '로봇 속보 5회 대응' },
  { id: 'scoop', n: '특종 사냥 주간', d: '특종이 1.7배 자주 나타나요', gold: .6, k: 'gold', goal: 12, gd: '특종 12번 잡기' },
  { id: 'war', n: '시청률 전쟁 주간', d: '라이벌을 이기면 광고 수입 2배 더', rival: 2, k: 'win', goal: 6, gd: '라이벌에게 6번 승리' },
];
