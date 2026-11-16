-- NEWS DESK 쿠폰 (2026-11-16 적용). 코드 하나에 보상(jsonb)·사용 가능 횟수·기간. 기기(id)마다 한 번만.
create table public.nd_coupon (code text primary key, reward jsonb not null, max_uses int not null default 1, used int not null default 0, starts_at timestamptz, ends_at timestamptz, note text, created_at timestamptz not null default now());
create table public.nd_coupon_use (code text not null references public.nd_coupon(code) on delete cascade, id uuid not null, at timestamptz not null default now(), primary key (code, id));
alter table public.nd_coupon enable row level security;
alter table public.nd_coupon_use enable row level security;
-- nd_redeem(code, id) → {ok, reward, note} 또는 {err: none|early|expired|used|full}
-- (함수 본문은 마이그레이션 nd_coupons 참고: 코드 정규화 → 기간·중복·횟수 확인 → 사용 기록 → 보상 반환)
revoke all on public.nd_coupon, public.nd_coupon_use from anon, authenticated;
