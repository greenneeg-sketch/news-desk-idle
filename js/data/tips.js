// 기능 해금(단계적 공개): 처음엔 핵심만 보이고, 누적 점수가 오르면 기능이 하나씩 열린다. 열릴 때 안내 카드가 한 번 뜬다
// tab/g/target: '보러 가기'를 누르면 이동할 탭·성장 하위 탭·요소
export const UNLOCKS = [
  { id: 'spd', at: 300, t: '속도 부스트', d: '광고를 보면 2분 동안 모든 층이 2배로 빨라져요.', tab: 'desk', target: 'spdb' },
  { id: 'mg', at: 1000, t: '매니저', d: '층마다 매니저를 고용하면 그 층이 자동으로 2배 빨라져요.', tab: 'desk', target: 'floors' },
  { id: 'mini', at: 1500, t: '미니게임', d: '왼쪽 아래에 빨간 "속보"·"단독" 아이콘이 가끔 떠요. 눌러서 미니게임을 하면 보너스 점수! 놓쳐도 손해는 없어요. 위쪽 🎮 버튼에서 연습할 수 있어요.' },
  { id: 'mis', at: 2000, t: '오늘의 미션', d: '게임 속 하루(5분)마다 미션 3개. 모두 달성하면 스카우트 티켓!', tab: 'desk', target: 'misp' },
  { id: 'hq', at: 3000, t: '본사(HQ) 업그레이드', d: '중계 장비는 속보 보상을, 방송 품질은 모든 점수를 올려요.', tab: 'desk', target: 'hqsec' },
  { id: 'scout', at: 5000, t: '스카우트', d: '직원 카드를 모으면 층 속도가 영구로 올라가요. 아래 스카우트 탭이 열렸어요.', tab: 'scout', target: 'scout' },
  { id: 'grow', at: 1e4, t: '커리어', d: '승진할 때마다 영구 점수 +5%. 성장 탭에서 다음 승진 조건을 볼 수 있어요.', tab: 'grow', g: 'car', target: 'carp' },
  { id: 'rank', at: 2e4, t: '순위', d: '다른 방송국과 순위와 이번 달 시즌 등급을 겨뤄요.', tab: 'rank', target: 'board' },
  { id: 'chief', at: 2e4, t: '영상편집팀장', d: '팀장을 고용하면 속보 때 우선 편집을 자동으로 해 줘요.', tab: 'desk', target: 'flc' },
  { id: 'deco', at: 3e4, t: '사무실 꾸미기', d: '소품을 사면 장면에 나타나고 하나당 점수 +2%예요.', tab: 'grow', g: 'deco', target: 'decop' },
  { id: 'dil', at: 5e4, t: '데스크 판단', d: '이제 일부 속보는 단독으로 바로 낼지, 확인 후 낼지 골라야 해요. 단독 성공 시 점수 2배!' },
  { id: 'res', at: 1e5, t: '방송 기술 연구소', d: '8시 뉴스·미션·단독으로 모은 연구 포인트로 영구 강화를 해요.', tab: 'grow', g: 'res', target: 'resp' },
  { id: 'week', at: 1e5, t: '주간 한정 이벤트', d: '매주 월요일 바뀌는 이벤트. 목표를 채우면 티켓 2장과 한정 배지!', tab: 'desk', target: 'wevp' },
  { id: 'pres', at: 1e6, t: '개편', d: '진행이 느려지면 개편하세요. 처음부터 다시 시작하지만 점수가 영구히 올라가요.', tab: 'grow', g: 'pres', target: 'presp' },
  { id: 'chal', when: s => s.pts > 0, t: '챌린지', d: '제약 속에서 목표를 달성하면 영구 점수 +10%.', tab: 'grow', g: 'pres', target: 'chalp' },
];
export const isUnlocked = (s, id) => !!(s.unl && s.unl[id]);
export const unlockReady = (s, u) => u.when ? u.when(s) : s.total >= u.at;
// 상황 안내: 해당 상황을 처음 만났을 때 한 번
export const TIPS = [
  { id: 'robot', when: s => !!(s.ev && s.ev.id === 'robot'), t: '거대 로봇 속보', d: '뉴스 디펜더즈 히어로 카드 1장당 이번 속보 점수 +50%. 스카우트에서 모아 보세요.', tab: 'scout', target: 'scout' },
  { id: 'cloud', when: s => s.total >= 1e5, t: '클라우드 저장', d: '기록이 서버에 자동 저장돼요. 오른쪽 위 ⚙ 설정에서 복구 코드를 적어 두면 폰을 바꿔도 이어 할 수 있어요.' },
];
