-- 시청률 대결 · 방송국 연합 (2026-11-15, Supabase 마이그레이션 이름: nd_duel_and_guild)
-- 함수 본문 전체는 Supabase 대시보드 > Database > Migrations 의 nd_duel_and_guild 에 있다. 여기에는 구조와 규칙만 적어 둔다.
-- 모든 RPC는 기기 열쇠(p_id, p_key)를 nd_auth 로 확인한다. 테이블은 RLS만 켜고 정책 없음 = RPC로만 접근.

create table public.nd_rating (            -- 각 방송국의 최근 8시 뉴스 시청률과 전적
  id uuid primary key references public.nd_leaderboard(id) on delete cascade,
  rating real not null default 0, at timestamptz not null default now(), w int not null default 0, l int not null default 0,
  constraint nd_rating_range check (rating between 0 and 30));
create table public.nd_duel (              -- 대결 기록 (a가 도전, b가 상대)
  n bigserial primary key, a uuid not null, b uuid not null, a_rating real not null, b_rating real not null, at timestamptz not null default now());
create table public.nd_guild (             -- 연합: 이름 12자, 초대 코드 6자리
  id uuid primary key default gen_random_uuid(), name text not null, code text not null unique, owner uuid not null, created_at timestamptz not null default now());
create table public.nd_guild_mem (         -- 연합원(기기당 한 연합), 이번 주 기여(contrib), 보상 받은 주(claimed)
  id uuid primary key references public.nd_leaderboard(id) on delete cascade, guild uuid not null references public.nd_guild(id) on delete cascade,
  joined timestamptz not null default now(), week text not null default '', contrib int not null default 0, claimed text not null default '', last_add timestamptz);

-- 내부 함수(anon 실행 불가): nd_auth(id, key) 열쇠 확인 · nd_bad_name(text) 이름 검사 · nd_week() 서울 기준 주차('2026-W46')
-- 공개 RPC (anon 실행 가능, 모두 열쇠 확인):
--   nd_rival(id, key)                   최근 3일 안에 8시 뉴스를 한 다른 플레이어 중 순위 점수가 비슷한 1명 {id,name,rating,live,w,l}
--   nd_rate(id, key, rating, opp, oppR) 내 시청률 기록(1분에 한 번) + 상대가 있으면 대결 기록, 전적 갱신
--   nd_duels(id, key)                   최근 대결 10건 + 내 전적
--   nd_guild_info / create(name) / join(code) / leave   연합 정보·만들기·가입(최대 20명)·탈퇴(방장이 나가면 가장 오래된 멤버가 방장)
--   nd_guild_add(id, key, n)            공동 특보 기여(속보 대응 수). 한 번에 최대 40, 30초에 한 번
--   nd_guild_claim(id, key)             이번 주 연합 합계가 목표(150 x 멤버 수, 최소 150) 이상이면 한 번 true
