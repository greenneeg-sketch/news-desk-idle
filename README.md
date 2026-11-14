# NEWS DESK 8BIT

뉴스 편집실 방치형 게임 (16비트 스타일). 정적 호스팅(GitHub Pages)으로 동작합니다.

## 구조
```
index.html            배포용 한 파일 (build.py가 생성, 직접 고치지 않음)
dev.html              개발용 진입점 (ES 모듈)
build.py              dev.html + js + css → index.html
css/main.css          8비트 테마
js/main.js            Composition Root (조립만)
js/core/              EventBus(Observer), Store(Redux식 단일 상태), Loop(고정 타임스텝)
js/data/config.js     업그레이드, 이벤트, 단계 등 데이터 (밸런스 조정은 여기서)
js/state/reducer.js   상태 전이 (순수 함수)
js/systems/           economy(순수 계산), events(속보 스케줄러)
js/services/          storage(Repository), audio(8비트 효과음)
js/ui/                scene(픽셀 렌더러), hud(DOM 뷰)
```

## 배포
1. `dev.html`, `js/`, `css/`를 고친다.
2. `python3 build.py`로 `index.html`(모든 코드가 들어간 한 파일)을 만든다. 타이틀 화면 왼쪽 위에 빌드 번호가 찍힌다.
3. 저장소에 올리면 GitHub Pages(Settings > Pages, `main` / root)가 `index.html`을 연다.

한 파일로 배포하는 이유: GitHub Pages는 파일을 최대 10분 캐시하는데, 파일이 여러 개면 브라우저가 새 파일과 옛 파일을 섞어 써서 게임이 멈출 수 있다.
개발용 `dev.html`은 ES 모듈이라 로컬에서는 `python3 -m http.server`로 열어야 한다.

## 순위 보드 (사용자 간 순위)
- 순위 점수 = 30*log10(1+누적 점수) + 0.6*최대 레벨 + 4*최고 시청률 + 10*log10(1+유튜브 조회수) (`js/systems/ranking.js`)
- 정적 호스팅(GitHub Pages)만으로는 사용자 간 공유가 안 되므로 서버가 필요합니다. `js/data/config.js`의 `LEADERBOARD`에 Supabase URL과 anon key를 넣으면 켜집니다. 비워두면 샘플 방송국과 비교하는 오프라인 모드입니다.
```sql
create table leaderboard(uid text primary key, name text, total double precision, max_lv int, best_rating double precision, views double precision, rank_score double precision, updated_at timestamptz default now());
alter table leaderboard enable row level security;
create policy "read" on leaderboard for select using (true);
create policy "write" on leaderboard for insert with check (true);
create policy "update" on leaderboard for update using (true);
```
- 주의: 이 구성은 클라이언트가 점수를 직접 올리므로 조작이 가능합니다. 정식 출시 전에는 서버 검증이나 로그인이 필요합니다.

## 방송국 이름
- 한글·영문·숫자 2~12자, 비속어와 운영자 사칭 단어는 `js/systems/nameFilter.js`에서 차단하고, 순위 보드에 표시할 때도 다시 거릅니다. 이름 변경은 하단 버튼에서 합니다. 서버를 연결하면 서버에서도 같은 검사를 해야 합니다.
- 게임 속 하루 길이는 `js/data/config.js`의 `DAY_SEC`(현재 300초 = 5분)입니다.

## 직원 카드 도감 / 주간 목표 / 출석
- 스카우트 확률은 꽝 45%, 일반 30%, 희귀 17%, 영웅 6.5%, 전설 1.5%이고 30번째는 영웅 이상 보장입니다(꽝이면 점수로 뽑은 경우 비용의 20%를 돌려줍니다)(`js/systems/cards.js`). 카드와 주간 목표는 `js/data/config.js`의 `CARDS`, `WEEKLY`에서 고칩니다.
- 스카우트 가격은 뽑을 때마다 15%씩 오르고(상한 없음), 최소한 평소 수입 10분치입니다(`js/systems/cards.js`의 `scoutCost`).
- 출석과 주간 초기화는 기기 시계(로컬 날짜) 기준입니다. 서버를 붙이면 서버 시간을 써야 시계 조작을 막을 수 있습니다.

## 시즌 / 챌린지
- 시즌은 매월 1일 시작(기기 날짜 기준). 시즌 점수 = 시즌 시작 이후 번 점수, 등급 브론즈~다이아(`TIERS`). 시즌이 끝나면 등급에 따라 티켓 1~5장. 시즌 테마(`SEASON_THEMES`)는 해당 속보를 3배 자주 발생시킵니다.
- 순위 보드에서 "전체 / 이번 시즌"을 전환합니다. Supabase를 쓰면 테이블에 `season text, season_pts double precision` 열을 추가하세요.
- 챌린지(`CHALLENGES`)를 시작하면 회차가 초기화되고, 목표를 달성하면 영구 점수 +10%. 개편하면 진행 중 챌린지는 포기됩니다.

## 화면 구성 / 튜토리얼
- 하단 탭: 보도국(층·HQ) / 스카우트(도감·주간 목표) / 순위(시즌·순위 보드) / 성장(개편·챌린지·업적·설정). 속보 경보·특종·알림은 어느 탭에서나 보입니다.
- 첫 방송을 시작하면 7단계 가이드가 나옵니다(`js/ui/tutorial.js`). 일부 단계는 직접 해 보면 자동으로 넘어가고, 위의 ? 버튼으로 다시 볼 수 있습니다.

## 인트로 타이틀
- `js/ui/intro.js`: 방송국 건물 픽셀 아트 타임랩스(하루 20초, 계절마다 2일), 중계 헬기, UFO vs 전투기, 오리지널 히어로 '뉴스 디펜더즈'(캡틴 큐시트·프레임 닌자·메카 앵커·나이트 에디터), 거대 로봇 습격, 건물 파괴와 복구, 하단 뉴스 자막.
- 테스트용: 주소 뒤에 `?it=130`처럼 붙이면 그 시점(초)부터 시작합니다(130 ≈ 겨울).
- 처음엔 PRESS START만 보이고, 화면을 누르면 타이틀(위)과 메뉴(아래)가 나옵니다. 5초간 조작이 없으면 다시 숨습니다.
- 이벤트(헬기·UFO 공중전·히어로·거대 로봇)는 3.5~6.5초마다 랜덤으로 나오며 같은 종류는 한 번에 하나(히어로 1명, 큰 사건 1개, 헬기 1대)이고, 피해가 생기면 중계차와 취재기자·영상기자가 현장으로 출동합니다.
- 설정의 "타이틀" 버튼으로 다시 볼 수 있습니다.
