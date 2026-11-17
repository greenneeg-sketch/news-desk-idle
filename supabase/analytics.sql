-- 익명 사용 통계 + 오류 기록 (2026-11-17). 닉네임·기기 열쇠와 연결하지 않는 별도 무작위 id(aid)만 쓴다.
-- 테이블은 RLS만 켜고 정책을 두지 않아 앱(anon)은 직접 읽거나 쓸 수 없고, nd_log 함수로만 넣는다. 분석은 소유자가 SQL로 본다(아래 뷰).
create table if not exists public.nd_event (
  id   bigint generated always as identity primary key,
  at   timestamptz not null default now(),
  aid  uuid not null,
  ev   text not null,
  p    jsonb,
  ver  text, plat text, sess text
);
alter table public.nd_event enable row level security;
revoke all on public.nd_event from anon, authenticated;
create index if not exists nd_event_aid_at on public.nd_event(aid, at);
create index if not exists nd_event_ev_at on public.nd_event(ev, at);

create or replace function public.nd_log(p_aid uuid, p_ver text, p_plat text, p_sess text, p_events jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare e jsonb; n int := 0; recent int;
begin
  if p_aid is null or p_events is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 40 then return 0; end if;
  select count(*) into recent from public.nd_event where aid = p_aid and at > now() - interval '1 hour';
  if recent > 600 then return 0; end if;                                   -- 기기당 시간당 600건까지
  for e in select * from jsonb_array_elements(p_events) loop
    if (e->>'ev') ~ '^[a-z0-9_]{2,30}$' and length(coalesce((e->'p')::text, '')) <= 400 then
      insert into public.nd_event(aid, ev, p, ver, plat, sess) values (p_aid, e->>'ev', e->'p', left(p_ver, 16), left(p_plat, 8), left(p_sess, 12));
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke execute on function public.nd_log(uuid, text, text, text, jsonb) from public;
grant execute on function public.nd_log(uuid, text, text, text, jsonb) to anon, authenticated;

-- 오래된 기록 정리(수동 실행): select public.nd_event_trim(120);
create or replace function public.nd_event_trim(p_days int) returns int language plpgsql security definer set search_path = '' as $$
declare n int; begin delete from public.nd_event where at < now() - make_interval(days => p_days); get diagnostics n = row_count; return n; end $$;
revoke execute on function public.nd_event_trim(int) from public, anon, authenticated;

-- 분석 뷰 (소유자 전용). 한국 시간 기준 날짜
create or replace view public.nd_an_retention with (security_invoker = true) as
with f as (select aid, min((at at time zone 'Asia/Seoul')::date) d0 from public.nd_event where ev = 'open' group by aid),
     a as (select distinct aid, (at at time zone 'Asia/Seoul')::date d from public.nd_event where ev = 'open')
select f.d0 as cohort, count(*) as users,
  count(*) filter (where exists (select 1 from a where a.aid = f.aid and a.d = f.d0 + 1)) as d1,
  count(*) filter (where exists (select 1 from a where a.aid = f.aid and a.d = f.d0 + 3)) as d3,
  count(*) filter (where exists (select 1 from a where a.aid = f.aid and a.d = f.d0 + 7)) as d7
from f group by f.d0 order by f.d0 desc;

create or replace view public.nd_an_funnel with (security_invoker = true) as
select ev, count(distinct aid) as users, count(*) as n, max(at) as last_at from public.nd_event group by ev order by users desc;

create or replace view public.nd_an_errors with (security_invoker = true) as
select p->>'m' as message, p->>'s' as src, ver, plat, count(*) as n, count(distinct aid) as users, max(at) as last_at
from public.nd_event where ev = 'err' group by 1, 2, 3, 4 order by n desc;
revoke all on public.nd_an_retention, public.nd_an_funnel, public.nd_an_errors from anon, authenticated;
