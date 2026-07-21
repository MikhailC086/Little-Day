-- LITTLE DAY — Supabase schema v1
-- Run this in your Supabase project: SQL Editor -> New query -> paste -> Run.

-- Each user's profile (created automatically on signup via trigger below)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- Per-user app data (kids, sitters, favorites, saved days, passport) as JSON
create table public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  kids jsonb default '[]',
  sitters jsonb default '[]',
  favorites jsonb default '[]',
  saved_days jsonb default '[]',
  check_ins jsonb default '{}',
  completed_days jsonb default '[]',
  updated_at timestamptz default now()
);

-- Shared reviews (visible to everyone)
create table public.reviews (
  id bigint generated always as identity primary key,
  place_id text not null,
  user_id uuid references auth.users on delete set null,
  author text,
  stars int check (stars between 1 and 5),
  body text,
  created_at timestamptz default now()
);

-- Friendships via invite codes
create table public.friendships (
  a uuid references auth.users on delete cascade,
  b uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (a, b)
);

-- Shared play-date invites
create table public.play_dates (
  id bigint generated always as identity primary key,
  from_user uuid references auth.users on delete cascade,
  to_user uuid references auth.users on delete cascade,
  day_plan jsonb,
  status text default 'pending', -- pending | accepted | declined
  created_at timestamptz default now()
);

-- Auto-create a profile + data row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_data (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: users see their own data; reviews are public-read
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.reviews enable row level security;
alter table public.friendships enable row level security;
alter table public.play_dates enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = id);
create policy "own data" on public.user_data for all using (auth.uid() = user_id);
create policy "read reviews" on public.reviews for select using (true);
create policy "write own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "own friendships" on public.friendships for all using (auth.uid() = a or auth.uid() = b);
create policy "own play dates" on public.play_dates for all using (auth.uid() = from_user or auth.uid() = to_user);
