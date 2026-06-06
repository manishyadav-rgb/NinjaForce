create table if not exists admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_team_user_id uuid references team_users(id) on delete set null,
  actor_name varchar(160),
  actor_email varchar(190),
  actor_role varchar(20),
  module varchar(80) not null,
  action varchar(80) not null,
  entity_type varchar(80) not null,
  entity_id varchar(120),
  entity_label text,
  status varchar(20) not null default 'success',
  message text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address varchar(120),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_logs_created_at on admin_activity_logs(created_at desc);
create index if not exists idx_admin_activity_logs_actor on admin_activity_logs(actor_team_user_id);
create index if not exists idx_admin_activity_logs_module_action on admin_activity_logs(module, action);
