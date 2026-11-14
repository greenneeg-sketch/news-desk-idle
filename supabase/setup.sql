-- NEWS DESK 순위 서버 설정 (Supabase > SQL Editor에 전체를 붙여넣고 Run)
-- 다른 게임과 같은 프로젝트를 써도 겹치지 않게 모든 이름에 nd_ 를 붙인다
-- 로그인 없이 동작한다 (Supabase 인증 설정을 건드리지 않음 → 회원 로그인을 쓰는 다른 게임에 영향 없음)
--
-- 보안 구조
--  1) 기기 열쇠: 게임이 기기마다 무작위 id와 비밀 열쇠를 만들어 기기에만 보관한다. 서버에는 열쇠의 해시만 저장한다.
--  2) 쓰기는 오직 nd_submit() 함수로만. 열쇠가 맞을 때만 그 기록을 고친다. 테이블에 직접 쓰기는 막혀 있다(RLS).
--  3) 순위 점수는 서버가 계산하고, 이름 규칙·비속어를 서버에서도 검사한다.
--  4) 순위 점수가 너무 빨리 오르면 거부(1분당 +30, 기본 +60), 첫 등록은 600점까지, 15초에 한 번만 반영.
--  5) nd_server_time(): 출석·주간·시즌을 서버 시각으로 계산해 기기 시계 조작을 막는다.

create table if not exists public.nd_leaderboard (
  id          uuid primary key,
  name        text not null,
  total       double precision not null default 0,
  max_lv      int not null default 0,
  best_rating double precision not null default 0,
  views       double precision not null default 0,
  rank_score  double precision not null default 0,
  season      text,
  season_pts  double precision not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint nd_lb_name   check (name ~ '^[0-9A-Za-z가-힣 ·&-]{2,12}$'),
  constraint nd_lb_ranges check (total between 0 and 1e30 and max_lv between 0 and 100000 and best_rating between 0 and 30
                                 and views between 0 and 1e24 and season_pts between 0 and 1e30)
);
create index if not exists nd_lb_rank on public.nd_leaderboard (rank_score desc);
create index if not exists nd_lb_season on public.nd_leaderboard (season, season_pts desc);
alter table public.nd_leaderboard enable row level security;
drop policy if exists nd_lb_read on public.nd_leaderboard;
create policy nd_lb_read on public.nd_leaderboard for select using (true);   -- 읽기만 공개, 쓰기 정책 없음

create table if not exists public.nd_lb_keys (
  id uuid primary key references public.nd_leaderboard(id) on delete cascade,
  key_hash text not null
);
alter table public.nd_lb_keys enable row level security;               -- 정책 없음: 아무도 직접 못 읽고 못 씀
revoke all on public.nd_lb_keys from anon, authenticated;

create or replace function public.nd_submit(p_id uuid, p_key text, p_name text, p_total double precision, p_max_lv int,
  p_best double precision, p_views double precision, p_season text, p_season_pts double precision)
returns double precision language plpgsql security definer set search_path = '' as $$
declare
  bad text[] := array['씨발','시발','씨팔','시팔','씹','병신','지랄','좆','개새','새끼','미친놈','미친년','썅','염병','섹스','창녀','한남충','김치녀',
                      'fuck','shit','bitch','asshole','nigger','nigga','cunt','porn','운영자','관리자','admin'];
  n text := regexp_replace(lower(coalesce(p_name, '')), '[^가-힣a-z]', '', 'g');
  w text; h text; old_hash text; old_rank double precision; old_at timestamptz; r double precision; mins double precision;
begin
  if p_id is null or p_key is null or length(p_key) < 32 or length(p_key) > 128 then raise exception 'bad key'; end if;
  foreach w in array bad loop
    if position(w in n) > 0 then raise exception 'name not allowed'; end if;
  end loop;
  h := encode(pg_catalog.sha256(convert_to(p_key, 'UTF8')), 'hex');
  r := round(30 * log(1 + greatest(p_total, 0)) + 0.6 * greatest(p_max_lv, 0) + 4 * least(greatest(p_best, 0), 30) + 10 * log(1 + greatest(p_views, 0)));
  select k.key_hash into old_hash from public.nd_lb_keys k where k.id = p_id;
  if found then
    if old_hash <> h then raise exception 'forbidden'; end if;
    select l.rank_score, l.updated_at into old_rank, old_at from public.nd_leaderboard l where l.id = p_id;
    mins := greatest(extract(epoch from now() - old_at) / 60, 0);
    if mins < 0.25 then return old_rank; end if;                       -- 15초에 한 번까지만 반영
    if r > old_rank + 60 + 30 * mins then raise exception 'rank score jumped too fast'; end if;
    update public.nd_leaderboard set name = p_name, total = p_total, max_lv = p_max_lv, best_rating = least(p_best, 30), views = p_views,
      rank_score = r, season = left(p_season, 7), season_pts = p_season_pts, updated_at = now() where id = p_id;
  else
    if r > 600 then raise exception 'rank score too high for a new entry'; end if;
    insert into public.nd_leaderboard(id, name, total, max_lv, best_rating, views, rank_score, season, season_pts)
      values (p_id, p_name, p_total, p_max_lv, least(p_best, 30), p_views, r, left(p_season, 7), p_season_pts);
    insert into public.nd_lb_keys(id, key_hash) values (p_id, h);
  end if;
  return r;
end $$;
revoke execute on function public.nd_submit(uuid, text, text, double precision, int, double precision, double precision, text, double precision) from public;
grant execute on function public.nd_submit(uuid, text, text, double precision, int, double precision, double precision, text, double precision) to anon, authenticated;

create or replace function public.nd_server_time() returns timestamptz language sql stable set search_path = '' as $$ select now() $$;
grant execute on function public.nd_server_time() to anon, authenticated;
