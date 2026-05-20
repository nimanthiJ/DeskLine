create table users (
  id           serial primary key,
  name         text not null,
  email        text not null unique,
  created_at   timestamptz not null default now()
);

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

create table comments (
  id           serial primary key,
  ticket_id    integer not null references tickets(id),
  author_id    integer not null references users(id),
  body         text not null,
  created_at   timestamptz not null default now()
);
