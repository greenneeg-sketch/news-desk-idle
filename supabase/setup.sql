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

-- ============================================================
-- 푸시 알림 (선택). 서명 열쇠(VAPID)는 서버 함수 nd-push가 처음 실행될 때 만들어 Vault에 넣는다.
-- 함께 배포: supabase/functions/nd-push/index.ts (verify_jwt = true)
-- ============================================================
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.nd_push (
  id        uuid primary key references public.nd_lb_keys(id) on delete cascade,
  sub       jsonb not null,
  kind      text not null default 'offline',
  notify_at timestamptz,
  sent_at   timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists nd_push_due_idx on public.nd_push (notify_at) where notify_at is not null;
alter table public.nd_push enable row level security;                  -- 정책 없음: 함수로만 접근
revoke all on public.nd_push from anon, authenticated;

-- 기기 열쇠를 확인하고 알림 구독/예약을 저장 (p_sub null이면 구독 해제, p_at null이면 예약 취소)
create or replace function public.nd_push_set(p_id uuid, p_key text, p_sub jsonb, p_at timestamptz, p_kind text default 'offline')
returns boolean language plpgsql security definer set search_path = '' as $$
declare h text; ok boolean;
begin
  if p_id is null or p_key is null then raise exception 'bad key'; end if;
  h := encode(pg_catalog.sha256(convert_to(p_key, 'UTF8')), 'hex');
  select k.key_hash = h into ok from public.nd_lb_keys k where k.id = p_id;
  if ok is null then raise exception 'no key yet'; end if;
  if not ok then raise exception 'forbidden'; end if;
  if p_sub is null then delete from public.nd_push where id = p_id; return true; end if;
  if left(p_sub->>'endpoint', 8) <> 'https://' or length(p_sub::text) > 2000 or (p_sub->'keys'->>'p256dh') is null or (p_sub->'keys'->>'auth') is null then raise exception 'bad subscription'; end if;
  if p_kind not in ('offline') then raise exception 'bad kind'; end if;
  insert into public.nd_push(id, sub, kind, notify_at, updated_at)
    values (p_id, p_sub, p_kind, case when p_at is null then null else least(greatest(p_at, now() + interval '1 minute'), now() + interval '2 days') end, now())
  on conflict (id) do update set sub = excluded.sub, kind = excluded.kind, notify_at = excluded.notify_at, updated_at = now();
  return true;
end $$;
revoke execute on function public.nd_push_set(uuid, text, jsonb, timestamptz, text) from public;
grant execute on function public.nd_push_set(uuid, text, jsonb, timestamptz, text) to anon, authenticated;

create or replace function public.nd_vapid_public() returns text language sql stable security definer set search_path = '' as $$
  select (decrypted_secret::jsonb)->>'public' from vault.decrypted_secrets where name = 'nd_vapid' limit 1
$$;
revoke execute on function public.nd_vapid_public() from public;
grant execute on function public.nd_vapid_public() to anon, authenticated;

-- 아래는 서버 함수(service_role) 전용
create or replace function public.nd_vapid() returns jsonb language sql stable security definer set search_path = '' as $$
  select decrypted_secret::jsonb from vault.decrypted_secrets where name = 'nd_vapid' limit 1
$$;
create or replace function public.nd_vapid_init(p_public text, p_private text) returns text language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from vault.secrets where name = 'nd_vapid') then
    return (select (decrypted_secret::jsonb)->>'public' from vault.decrypted_secrets where name = 'nd_vapid' limit 1);
  end if;
  perform vault.create_secret(jsonb_build_object('public', p_public, 'private', p_private)::text, 'nd_vapid', 'NEWS DESK web push VAPID keys');
  return p_public;
end $$;
create or replace function public.nd_push_due() returns table(id uuid, sub jsonb, kind text) language sql security definer set search_path = '' as $$
  update public.nd_push p set notify_at = null, sent_at = now()
  where p.id in (select q.id from public.nd_push q where q.notify_at is not null and q.notify_at <= now() order by q.notify_at limit 200 for update skip locked)
  returning p.id, p.sub, p.kind
$$;
create or replace function public.nd_push_gone(p_id uuid) returns void language sql security definer set search_path = '' as $$
  delete from public.nd_push where id = p_id
$$;
revoke execute on function public.nd_vapid() from public, anon, authenticated;
revoke execute on function public.nd_vapid_init(text, text) from public, anon, authenticated;
revoke execute on function public.nd_push_due() from public, anon, authenticated;
revoke execute on function public.nd_push_gone(uuid) from public, anon, authenticated;
grant execute on function public.nd_vapid() to service_role;
grant execute on function public.nd_vapid_init(text, text) to service_role;
grant execute on function public.nd_push_due() to service_role;
grant execute on function public.nd_push_gone(uuid) to service_role;

-- 10분마다 보낼 알림이 있을 때만 nd-push 호출 (URL과 anon 키는 자기 프로젝트 값으로 바꿀 것)
create or replace function public.nd_push_tick() returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.nd_push where notify_at is not null and notify_at <= now()) then
    perform net.http_post(
      url := 'https://ndyiuefcvhnqnfdziacv.supabase.co/functions/v1/nd-push',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <ANON_KEY>'),
      body := '{}'::jsonb, timeout_milliseconds := 20000);
  end if;
end $$;
revoke execute on function public.nd_push_tick() from public, anon, authenticated;
select cron.schedule('nd-push', '*/10 * * * *', 'select public.nd_push_tick()');

-- ============================================================
-- 클라우드 저장: 기기 열쇠로 저장, 복구 코드(12자, 약 60비트)로 다른 기기에서 불러오기
-- ============================================================
create table if not exists public.nd_saves (
  id         uuid primary key references public.nd_lb_keys(id) on delete cascade,
  code       text not null unique,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.nd_saves enable row level security;                 -- 정책 없음: 함수로만 접근
revoke all on public.nd_saves from anon, authenticated;

create or replace function public.nd_new_code() returns text language plpgsql volatile set search_path = '' as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := extensions.gen_random_bytes(12); c text := ''; i int;
begin
  for i in 0..11 loop c := c || substr(a, (get_byte(b, i) % 32) + 1, 1); if i in (3, 7) then c := c || '-'; end if; end loop;
  return c;
end $$;
revoke execute on function public.nd_new_code() from public, anon, authenticated;

create or replace function public.nd_save_put(p_id uuid, p_key text, p_data jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare h text; ok boolean; c text; last timestamptz;
begin
  if p_id is null or p_key is null or p_data is null then raise exception 'bad request'; end if;
  if length(p_data::text) > 65536 then raise exception 'save too large'; end if;
  h := encode(pg_catalog.sha256(convert_to(p_key, 'UTF8')), 'hex');
  select k.key_hash = h into ok from public.nd_lb_keys k where k.id = p_id;
  if ok is null then raise exception 'no key yet'; end if;
  if not ok then raise exception 'forbidden'; end if;
  select s.code, s.updated_at into c, last from public.nd_saves s where s.id = p_id;
  if c is null then
    loop c := public.nd_new_code(); exit when not exists (select 1 from public.nd_saves where code = c); end loop;
    insert into public.nd_saves(id, code, data) values (p_id, c, p_data);
  elsif now() - last >= interval '30 seconds' then
    update public.nd_saves set data = p_data, updated_at = now() where id = p_id;
  end if;
  return c;
end $$;

create or replace function public.nd_save_restore(p_code text, p_new_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if p_new_key is null or length(p_new_key) < 32 or length(p_new_key) > 128 then raise exception 'bad key'; end if;
  select s.id, s.data, s.updated_at into r from public.nd_saves s where s.code = upper(replace(trim(p_code), ' ', ''));
  if r.id is null then perform pg_sleep(1); raise exception 'code not found'; end if;
  update public.nd_lb_keys set key_hash = encode(pg_catalog.sha256(convert_to(p_new_key, 'UTF8')), 'hex') where id = r.id;
  return jsonb_build_object('id', r.id, 'data', r.data, 'saved_at', r.updated_at);
end $$;
revoke execute on function public.nd_save_put(uuid, text, jsonb) from public;
revoke execute on function public.nd_save_restore(text, text) from public;
grant execute on function public.nd_save_put(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.nd_save_restore(text, text) to anon, authenticated;
