// 방송국 이름 검증: 허용 문자(한글·영문·숫자·공백·점·&·하이픈) 2~12자 + 비속어/운영자 사칭 차단
// 주의: 클라이언트 검사는 우회할 수 있으므로 서버에도 같은 검사가 필요하다. 표시할 때도 다시 걸러낸다.
const BAD = ['씨발', '시발', '씨팔', '시팔', '씹', '병신', '지랄', '좆', '개새', '새끼', '미친놈', '미친년', '썅', '염병', '섹스', '창녀', '한남충', '김치녀',
  'fuck', 'shit', 'bitch', 'asshole', 'nigger', 'nigga', 'cunt', 'porn', '운영자', '관리자', 'admin'];
const squash = s => s.toLowerCase().replace(/[^가-힣a-z]/g, ''); // 공백·숫자·기호를 끼워 넣는 우회(시.발, f u c k, 시1발)를 막는다
export const isBlocked = name => { const n = squash(String(name)); return BAD.some(w => n.includes(w)); };
export function checkName(raw) {
  const v = String(raw).trim().replace(/\s+/g, ' ');
  if (!/^[0-9A-Za-z가-힣 ·&-]{2,12}$/.test(v)) return { err: '이름은 한글·영문·숫자 2~12자로 입력해 주세요.' };
  if (isBlocked(v)) return { err: '사용할 수 없는 이름이에요.' };
  return { name: v };
}
