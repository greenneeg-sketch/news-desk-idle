import { RIVAL } from '../data/config.js';
import { QUOTES } from '../data/quotes.js';
import { fmt } from './hud.js';
// 오늘의 헤드라인: 하루 결과(report)를 신문 1면 문구로 바꾼다 (순수 함수)
export function paper(name, r) {
  const RV = r.rn || RIVAL;
  const diff = Math.abs(r.rating - r.rival).toFixed(1), rt = r.rating.toFixed(1) + '%';
  const head = r.rec ? `${name}, 역대 최고 시청률 ${rt} 경신`
    : r.won ? (r.win >= 3 ? `${name}, ${r.win}일 연속 동시간대 1위` : `${name} 8시 뉴스 ${rt}… ${RV} 제쳤다`)
    : `${RV}에 ${diff}%p 차 석패… "내일은 다르다"`;
  const subs = [];
  if (r.log && r.log.length) subs.push(`[속보] ${r.log.join(' · ')}`);
  if (r.dW) subs.push(`[단독] 보도국 단독 보도 ${r.dW}건 적중`);
  if (r.dF) subs.push(`[정정] 오보 ${r.dF}건… "깊이 사과드립니다"`);
  subs.push(r.viral ? `[화제] 유튜브 하루 ${fmt(r.views)}회 '대박'` : `[디지털] 유튜브 조회수 +${fmt(r.views)}`);
  if (r.all) subs.push('[사내] 오늘의 미션 올클리어');
  const q = QUOTES[2], who = ['영상편집기자', '그래픽 디자이너', '영상편집팀장'], k = r.day % 3, pool = [q, QUOTES[3], QUOTES[7]][k];
  subs.push(`[인터뷰] ${who[k]} "${pool[(r.day * 7) % pool.length]}"`);
  return { mast: `${name} 일보`, no: `D+${r.day} · 제${r.day}호`, head, subs: subs.slice(0, 5),
    foot: `시청률 ${rt} vs ${RV}${r.real ? '(실제 플레이어)' : ''} ${r.rival.toFixed(1)}% · 광고 수입 +${fmt(r.bonus)}점 · 연구 포인트 +${r.rp}` };
}
