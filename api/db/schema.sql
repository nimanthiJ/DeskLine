-- Shared: keep created_at immutable and bump updated_at on every UPDATE.
create or replace function sync_row_timestamps()
returns trigger as $$
begin
  new.created_at = old.created_at;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Older ticket-only helper from a previous revision (safe if absent).
drop function if exists set_tickets_updated_at() cascade;

create table users (
  id           serial primary key,
  name         text not null,
  email        text not null unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger users_sync_timestamps
  before update on users
  for each row
  execute function sync_row_timestamps();

create table tickets (
  id           serial primary key,
  subject      text not null,
  description  text not null,
  status       text not null default 'open'
                 check (status in ('open','in_progress','resolved','closed')),
  priority     text not null default 'medium'
                 check (priority in ('low','medium','high','urgent')),
  assignee_id  integer references users(id),
  sla_hours    integer not null default 8,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create trigger tickets_sync_timestamps
  before update on tickets
  for each row
  execute function sync_row_timestamps();

create table comments (
  id           serial primary key,
  ticket_id    integer not null references tickets(id),
  author_id    integer not null references users(id),
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger comments_sync_timestamps
  before update on comments
  for each row
  execute function sync_row_timestamps();
