// 글자 크기·글꼴 설정. 보도국에는 연세 있는 분도 많아서 글자 크기를 키울 수 있게 한다.
// CSS는 html[data-fs]·html[data-font]로 배율(--fs)과 글꼴을 바꾸고, 캔버스 글자(도감 카드 칸 수, 말풍선)는 아래 TS 값을 본다.
export const FS_STEPS = [['보통', 0], ['크게', 1], ['아주 크게', 2]]; // 값 = data-fs 단계
export const TS = { step: 1, clear: false, fs: 1.2, cols: 3 };  // 기본: 크게(1.2배), 도트 글꼴, 도감 3열
const FS = [1, 1.2, 1.4];
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
export function applyTextScale() {
  const r = document.documentElement; r.dataset.fs = TS.step; r.dataset.font = TS.clear ? 'clear' : 'pixel';
  TS.fs = FS[TS.step]; TS.cols = TS.step >= 1 ? 3 : 4; // 글자가 커지면 도감 카드도 한 줄에 3장(카드 글자가 커진다)
}
export function initTextScale() {
  const s = get('newsDeskFs'); TS.step = s === '0' || s === '1' || s === '2' ? +s : 1; TS.clear = get('newsDeskFont') === 'clear'; applyTextScale();
}
export function setTextStep(n) { TS.step = n; set('newsDeskFs', String(n)); applyTextScale(); }
export function setClearFont(on) { TS.clear = on; set('newsDeskFont', on ? 'clear' : 'pixel'); applyTextScale(); }
