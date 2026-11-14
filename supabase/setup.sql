-- NEWS DESK 순위 서버 설정 (Supabase > SQL Editor에 전체를 붙여넣고 Run)
-- 다른 게임과 같은 프로젝트를 써도 겹치지 않게 모든 이름에 nd_ 를 붙인다
-- 보안 구조
--  1) 플레이어마다 익명 로그인 계정이 생기고, 자기 기록(user_id = 내 계정)만 쓰고 고칠 수 있다(RLS)
--  2) 순위 점수(rank_score)와 기록 시각은 서버가 계산한다 → 클라이언트가 순위 점수를 직접 못 올린다
--  3) 이름 규칙·비속어 검사를 서버에서도 한다
--  4) 짧은 시간에 순위 점수가 비정상적으로 뛰면 거부한다(1분당 +30, 기본 +60까지)
--  5) nd_server_time(): 출석·주간·시즌을 서버 시각으로 계산해 기기 시계 조작을 막는다

create table if not exists public.nd_leaderboard (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
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
drop policy if exists nd_lb_insert on public.nd_leaderboard;
drop policy if exists nd_lb_update on public.nd_leaderboard;
create policy nd_lb_read   on public.nd_leaderboard for select using (true);
create policy nd_lb_insert on public.nd_leaderboard for insert to authenticated with check (user_id = auth.uid());
create policy nd_lb_update on public.nd_leaderboard for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.nd_lb_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  bad text[] := array['씨발','시발','씨팔','시팔','씹','병신','지랄','좆','개새','새끼','미친놈','미친년','썅','염병','섹스','창녀','한남충','김치녀',
                      'fuck','shit','bitch','asshole','nigger','nigga','cunt','porn','운영자','관리자','admin'];
  n text := regexp_replace(lower(new.name), '[^가-힣a-z]', '', 'g');
  w text;
  mins double precision;
begin
  -- 관리자(대시보드·service role)는 로그인 사용자가 아니므로 검사 없이 통과 (부적절한 이름 수정·삭제용)
  if auth.uid() is null then return new; end if;
  foreach w in array bad loop
    if position(w in n) > 0 then raise exception 'name not allowed'; end if;
  end loop;
  new.user_id    := auth.uid();
  new.rank_score := round(30 * log(1 + new.total) + 0.6 * new.max_lv + 4 * new.best_rating + 10 * log(1 + new.views));
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    mins := greatest(extract(epoch from now() - old.updated_at) / 60, 0);
    if new.rank_score > old.rank_score + 60 + 30 * mins then raise exception 'rank score jumped too fast'; end if;
  else
    new.created_at := now();
    -- 처음 등록할 때만 상한 검사 (이미 기록이 있으면 upsert가 UPDATE로 이어지고, 그쪽에서 급상승을 검사한다)
    if new.rank_score > 600 and not exists (select 1 from public.nd_leaderboard where user_id = auth.uid()) then
      raise exception 'rank score too high for a new entry';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists nd_lb_guard on public.nd_leaderboard;
create trigger nd_lb_guard before insert or update on public.nd_leaderboard for each row execute function public.nd_lb_guard();

create or replace function public.nd_server_time() returns timestamptz language sql stable set search_path = '' as $$ select now() $$;
grant execute on function public.nd_server_time() to anon, authenticated;
