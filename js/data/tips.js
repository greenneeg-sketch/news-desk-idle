import { prestigeGain } from '../systems/economy.js';
// 새 기능 안내: 기능이 처음 열릴 때 한 번씩 보여 준다 (처음 가이드가 끝난 뒤, 다른 창이 없을 때)
export const TIPS = [
  { id: 'mis', when: s => !!s.mis, t: '오늘의 미션', d: '게임 속 하루(5분)마다 미션 3개가 나와요. 하나 달성할 때마다 점수, 3개 모두 달성하면 스카우트 티켓을 받아요.', tab: 'desk', target: 'misp' },
  { id: 'dil', when: s => !!(s.ev && s.ev.dil && !s.ev.pick), t: '데스크 판단', d: '아래 카드에서 단독으로 바로 내보낼지, 확인 후 내보낼지 골라요. 단독이 성공하면 점수 2배, 오보면 오늘 시청률이 떨어져요.' },
  { id: 'week', when: s => !!s.wev, t: '이번 주 한정 이벤트', d: '매주 월요일마다 이벤트가 바뀌어요. 목표를 채우면 티켓 2장과 한정 배지를 받아요.', tab: 'desk', target: 'wevp' },
  { id: 'rival', when: s => !!s.report, t: '라이벌 한누리방송', d: '매일 8시 뉴스에서 시청률 대결을 해요. 이기면 광고 수입이 1.5배, 연승할수록 더 늘어나요.', tab: 'desk', target: 'rate' },
  { id: 'res', when: s => s.rp > 0, t: '방송 기술 연구소', d: '8시 뉴스·미션·단독·라이벌 승리로 연구 포인트가 쌓여요. 성장 탭에서 영구 강화를 해 보세요.', tab: 'grow', target: 'resp' },
  { id: 'deco', when: s => s.score >= 2e4, t: '사무실 꾸미기', d: '점수로 사무실 소품을 살 수 있어요. 소품은 장면에 나타나고 하나당 점수 +2%예요.', tab: 'grow', target: 'decop' },
  { id: 'pres', when: s => prestigeGain(s) >= 3, t: '개편', d: '개편하면 이번 회차가 처음부터 시작되지만, 개편 포인트로 점수가 영구히 올라가요. 진행이 느려질 때 해 보세요.', tab: 'grow', target: 'presp' },
  { id: 'robot', when: s => !!(s.ev && s.ev.id === 'robot'), t: '거대 로봇 속보', d: '뉴스 디펜더즈 히어로 카드가 있으면 로봇 속보 점수가 1장당 +50%예요. 스카우트에서 모아 보세요.', tab: 'scout', target: 'scout' },
  { id: 'cloud', when: s => s.total >= 1e5, t: '클라우드 저장', d: '기록이 서버에 자동 저장돼요. 성장 탭의 복구 코드를 적어 두면 휴대폰을 바꿔도 이어서 할 수 있어요.', tab: 'grow', target: 'cloudp' },
];
