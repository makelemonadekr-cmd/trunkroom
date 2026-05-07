-- ─── Reports + Blocks (App Store UGC compliance, Guideline 1.2) ──────────────
-- Required for any UGC app on the App Store.

-- 1. reports: users flagging objectionable content
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references auth.users(id) on delete cascade,
  target_type     text not null check (target_type in ('style','item','profile','comment')),
  -- text (not uuid) so we can reference any target table regardless of pk type
  target_id       text not null,
  reason          text not null check (char_length(reason) between 1 and 500),
  reason_category text check (reason_category in (
    'spam','harassment','sexual_content','hate_speech','violence',
    'misinformation','intellectual_property','other'
  )),
  status          text not null default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  resolved_at     timestamptz,
  resolved_by     uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create index if not exists reports_reporter_idx     on public.reports(reporter_id);
create index if not exists reports_target_idx       on public.reports(target_type, target_id);
create index if not exists reports_status_idx       on public.reports(status) where status = 'pending';

alter table public.reports enable row level security;

-- Users can create reports
drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Users can view their own reports
drop policy if exists "Users view own reports" on public.reports;
create policy "Users view own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- 2. blocks: users hiding other users
create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocker_idx on public.blocks(blocker_id);
create index if not exists blocks_blocked_idx on public.blocks(blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "Users manage own blocks" on public.blocks;
create policy "Users manage own blocks"
  on public.blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
