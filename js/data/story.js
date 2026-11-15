// 스토리 모드 "8시 뉴스는 계속된다" — 1부: 수습 시절 (챕터 1~3)
// 챕터는 누적 점수(total)로 열리고, 앞 챕터를 끝내야 다음 챕터를 볼 수 있다. 개편해도 진행은 남는다.
// 장면 한 줄: { who: 말하는 사람(카드 id·'me'·null=내레이션), t: 대사, bg: 배경 층(0 취재·1 인제스트·2 편집·3 CG·4 송출), fx: 'rain'|'alarm'|'night' }
// 대사 안의 {name} = 플레이어 이름. 직업별 대사는 t 대신 { editor, reporter, camera }로 쓴다.
// 미션 k: day(8시 뉴스 n회) · mg(미니게임 등급) · evh(속보 직접 대응 n회)
export const ST_WHO = { c12: '보도국장', c1: '신입 카메라기자', c2: '수습 인제스트 요원', c7: '야근 영상편집기자', c4: '인턴 그래픽 디자이너', c5: '신입 아나운서' };
export const ST_PARTS = [{ n: '1부 · 수습 시절', d: '첫 출근부터 첫 특보까지' }];
export const STORY = [
  { id: 's1', part: 0, n: '첫 출근', at: 300, d: '보도국을 한 바퀴 돌며 뉴스가 나가는 길을 배운다',
    lines: [
      { who: null, bg: 0, t: '첫 출근 날. 목에 건 보도국 출입증이 아직 어색하다.' },
      { who: 'c12', bg: 0, t: '{name}, 오늘부터 보도국 식구다. 우리 뉴스가 어떻게 나가는지 한 바퀴 돌아보자.' },
      { who: 'c1', bg: 0, t: '뉴스는 여기서 시작해요. 기자들이 현장에서 찍고 쓴 게 전부 위층으로 올라가요.' },
      { who: 'c2', bg: 1, t: '현장 영상은 인제스트로 먼저 들어와요. 파일 받고, 이름 붙이고, 편집실이 바로 찾을 수 있게 정리하죠.' },
      { who: 'c7', bg: 2, t: '여기가 편집실. 1분 30초짜리 리포트 하나에 컷이 수십 개 들어가. 한 컷이 늦으면 뉴스 전체가 늦어.' },
      { who: 'me', bg: 2, t: { editor: '(빈 편집석 모니터에 내 이름이 붙은 타임라인이 열려 있다.)', reporter: '(편집기자 옆에서 내 원고가 그림에 붙는 걸 처음 봤다.)', camera: '(내가 찍을 그림이 여기서 이렇게 잘리는구나.)' } },
      { who: 'c4', bg: 3, t: '자막이랑 그래픽은 저희가 만들어요. 숫자 하나 틀리면 정정 방송이라 늘 두 번 봐요.' },
      { who: 'c5', bg: 4, t: '그리고 마지막, 스튜디오와 송출실. 저녁 8시 정각에 이 모든 게 전파를 타요.' },
      { who: 'c12', bg: 4, t: '어느 한 곳이라도 막히면 화면이 비어. 오늘 밤 8시 뉴스, 무사히 내보내 봐.' },
    ],
    mis: { k: 'day', n: 1, d: '오늘 밤 8시 뉴스 1회 내보내기', hint: '보도국 화면 위쪽 시계가 20:00이 되면 뉴스가 나가요.' },
    end: [
      { who: 'c5', bg: 4, t: '…지금까지 8시 뉴스였습니다.' },
      { who: 'c12', bg: 4, t: '첫날치고 괜찮았어. 내일도 8시는 온다.' },
    ],
    rw: { tk: 1, min: 5 } },
  { id: 's2', part: 0, n: '19시 55분', at: 5e3, d: '톱 리포트 렌더가 멈췄다. 남은 시간은 5분', clock: 0,
    lines: [
      { who: null, bg: 2, fx: 'alarm', t: '19시 55분. 톱 리포트 렌더 막대가 87%에서 멈춰 있다.' },
      { who: 'c7', bg: 2, fx: 'alarm', t: '렌더 다시 걸면 늦어. 타임라인에서 바로 컷 잡아서 클린본으로 가자.' },
      { who: 'me', bg: 2, fx: 'alarm', t: { editor: '컷 지점 표시해 둘게요. 플레이바 지나갈 때 바로 자를게요.', reporter: '원고 두 문장 줄였어요. 컷만 맞춰 주세요!', camera: '그림은 충분해요. 제일 센 컷부터 쓰세요!' } },
      { who: 'c5', bg: 4, fx: 'alarm', t: '스튜디오 준비 끝났어요. 톱 리포트만 오면 돼요!' },
      { who: 'c7', bg: 2, fx: 'alarm', t: '손 풀어. 다섯 라운드, 갈수록 빨라진다. 놓치면 화면에 블랙 나간다.' },
    ],
    mis: { k: 'mg', g: 'cut', grade: 'B', d: '미니게임 "속보 컷 편집" B등급 이상', hint: '아래 버튼으로 바로 할 수 있어요. 연습 모드도 인정돼요.' },
    end: [
      { who: null, bg: 4, t: '19시 59분 40초. 클린본이 송출 서버에 꽂혔다.' },
      { who: 'c7', bg: 2, t: '…봤지? 이게 방송이야. 커피 한잔 사라.' },
    ],
    rw: { tk: 1, min: 10 } },
  { id: 's3', part: 0, n: '첫 속보', at: 1e4, d: '밤 10시, 폭우 특보. 전원 복귀',
    lines: [
      { who: null, bg: 0, fx: 'rain', t: '밤 10시. 퇴근 버스 정류장에서 휴대폰이 울린다.' },
      { who: 'c12', bg: 0, fx: 'rain', t: '중부지방에 시간당 80mm 폭우다. 전원 복귀, 특보 체제로 간다.' },
      { who: 'c2', bg: 1, fx: 'night', t: '현장 영상이 한꺼번에 몰려와요! 서버 대기열이 꽉 찼어요!' },
      { who: 'c7', bg: 2, fx: 'night', t: '오늘은 밤새는 날이다. 커피 두 잔 타 놨어.' },
      { who: 'c4', bg: 3, fx: 'night', t: '강수량 지도 갱신했어요. 숫자 세 번 확인했어요!' },
      { who: 'me', bg: 2, fx: 'night', t: { editor: '(다음 리포트 타임라인을 열었다. 손이 조금 떨린다.)', reporter: '(현장 기자 전화를 받아 원고를 고쳐 쓴다.)', camera: '(배터리 세 개를 챙겨 중계차로 뛰었다.)' } },
      { who: 'c12', bg: 4, fx: 'night', t: '속보가 뜨면 "우선 편집"을 눌러 직접 챙겨. 오늘 밤은 네가 받는다.' },
    ],
    mis: { k: 'evh', n: 2, d: '속보에 직접 대응 2회', hint: '보도국 화면에 속보 띠가 뜨면 "우선 편집"(또는 데스크 판단)을 누르세요.' },
    end: [
      { who: 'c5', bg: 4, t: '새벽 5시, 폭우 특보를 마칩니다. 밤새 함께해 주셔서 감사합니다.' },
      { who: 'c12', bg: 4, t: '수고했다. 다들 네 얘기 하더라. …이제 진짜 기자다.' },
      { who: null, bg: 4, t: '1부 「수습 시절」 끝. 2부 「현장의 시간」은 준비 중이에요.' },
    ],
    rw: { tk: 2, min: 15 } },
];
const ST_ORD = 'CBAS';
export const stProg = (s, ch) => { // 지금 미션 진행도 [현재, 목표]
  const m = s.story && s.story.mis, ms = ch.mis; if (!m || m.id !== ch.id) return [0, ms.n || 1];
  if (ms.k === 'day') return [Math.min(ms.n, s.day - m.day0), ms.n];
  if (ms.k === 'mg') return [m.mg && ST_ORD.indexOf(m.mg) >= ST_ORD.indexOf(ms.grade) ? 1 : 0, 1];
  if (ms.k === 'evh') return [Math.min(ms.n, (s.evH || 0) - m.evH0 + (s.chief ? (s.evCount || 0) - m.ev0 : 0)), ms.n];
  return [0, 1];
};
export const stStatus = (s, ch) => { // lock · new · mis · claim · done
  const st = s.story || {}, i = STORY.indexOf(ch);
  if (st.done && st.done[ch.id]) return 'done';
  if ((i > 0 && !(st.done && st.done[STORY[i - 1].id])) || s.total < ch.at) return 'lock';
  if (!(st.mis && st.mis.id === ch.id)) return 'new';
  const [a, b] = stProg(s, ch); return a >= b ? 'claim' : 'mis';
};
export const stLine = (l, s) => { const t = typeof l.t === 'string' ? l.t : l.t[s.job] || l.t.editor; return t.replace(/\{name\}/g, s.name || '신입'); };
