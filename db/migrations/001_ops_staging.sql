-- Birdiaconia staging operational ledger.
-- Apply ONLY to an isolated staging Supabase Postgres project.
-- Opaque references only: never store names, phone numbers, case notes or health data.
create table if not exists public.birdia_ops_event_inbox (
  event_id text primary key,
  source text not null check (source in ('site','toss','operator')),
  project_id text not null,
  person_ref text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

create table if not exists public.birdia_ops_applications (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  person_ref text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (project_id, person_ref)
);

create table if not exists public.birdia_ops_audit (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  application_id uuid references public.birdia_ops_applications(id),
  actor text not null,
  action text not null,
  occurred_at timestamptz not null default now()
);

create table if not exists public.birdia_ops_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  application_id uuid not null references public.birdia_ops_applications(id),
  event_type text not null,
  status text not null default 'PENDING_CONNECTOR' check (status in ('PENDING_CONNECTOR','DELIVERED','FAILED')),
  created_at timestamptz not null default now()
);

create index if not exists birdia_ops_audit_recent on public.birdia_ops_audit(occurred_at desc);
create index if not exists birdia_ops_applications_recent on public.birdia_ops_applications(created_at desc);

alter table public.birdia_ops_event_inbox enable row level security;
alter table public.birdia_ops_applications enable row level security;
alter table public.birdia_ops_audit enable row level security;
alter table public.birdia_ops_outbox enable row level security;

revoke all on table public.birdia_ops_event_inbox from public, anon, authenticated;
revoke all on table public.birdia_ops_applications from public, anon, authenticated;
revoke all on table public.birdia_ops_audit from public, anon, authenticated;
revoke all on table public.birdia_ops_outbox from public, anon, authenticated;
grant all on table public.birdia_ops_event_inbox to service_role;
grant all on table public.birdia_ops_applications to service_role;
grant all on table public.birdia_ops_audit to service_role;
grant all on table public.birdia_ops_outbox to service_role;

create or replace function public.birdia_ops_ingest_application(
  p_event_id text, p_source text, p_project_id text, p_person_ref text, p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_inserted integer;
  v_application_id uuid;
  v_status text;
  v_existing record;
begin
  if p_event_id !~ '^evt_[A-Za-z0-9_-]{8,80}$'
     or p_source not in ('site','toss','operator')
     or p_project_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{2,63}$'
     or p_person_ref !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{2,63}$'
     or p_occurred_at is null or p_occurred_at > now() + interval '5 minutes'
     or p_occurred_at < now() - interval '24 hours'
  then
    raise exception 'invalid_staging_event';
  end if;

  insert into public.birdia_ops_event_inbox(event_id,source,project_id,person_ref,occurred_at)
    values(p_event_id,p_source,p_project_id,p_person_ref,p_occurred_at)
    on conflict(event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    select source,project_id,person_ref,occurred_at into v_existing
      from public.birdia_ops_event_inbox where event_id = p_event_id;
    if v_existing.source is distinct from p_source
       or v_existing.project_id is distinct from p_project_id
       or v_existing.person_ref is distinct from p_person_ref
       or v_existing.occurred_at is distinct from p_occurred_at
    then
      raise exception 'duplicate_event_id_conflict';
    end if;
    select id,status into v_application_id,v_status
      from public.birdia_ops_applications where project_id = p_project_id and person_ref = p_person_ref;
    return jsonb_build_object('duplicate',true,'application_id',v_application_id,'status',v_status);
  end if;

  insert into public.birdia_ops_applications(project_id,person_ref)
    values(p_project_id,p_person_ref)
    on conflict(project_id,person_ref) do nothing
    returning id,status into v_application_id,v_status;
  if v_application_id is null then
    select id,status into v_application_id,v_status
      from public.birdia_ops_applications where project_id = p_project_id and person_ref = p_person_ref;
  end if;

  insert into public.birdia_ops_audit(event_id,application_id,actor,action)
    values(p_event_id,v_application_id,p_source,'APPLICATION_RECEIVED');
  insert into public.birdia_ops_outbox(dedupe_key,application_id,event_type)
    values(p_event_id,v_application_id,'APPLICATION_REVIEW_REQUIRED');
  return jsonb_build_object('duplicate',false,'application_id',v_application_id,'status',v_status);
end;
$$;

create or replace function public.birdia_ops_review_application(
  p_application_id uuid, p_decision text, p_actor_email text
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_application_id uuid;
begin
  if p_decision not in ('APPROVED','REJECTED') or p_actor_email is null
     or length(p_actor_email) > 254 or p_actor_email !~ '^[^[:space:]@]+@[^[:space:]@]+$'
  then
    raise exception 'invalid_review_input';
  end if;
  update public.birdia_ops_applications
     set status = p_decision, reviewed_at = now()
   where id = p_application_id and status = 'PENDING'
   returning id into v_application_id;
  if v_application_id is null then
    raise exception 'application_not_pending';
  end if;
  insert into public.birdia_ops_audit(event_id,application_id,actor,action)
    values('review:' || v_application_id::text,v_application_id,p_actor_email,p_decision);
  insert into public.birdia_ops_outbox(dedupe_key,application_id,event_type)
    values('review:' || v_application_id::text,v_application_id,'APPLICATION_REVIEWED');
  return jsonb_build_object('application_id',v_application_id,'status',p_decision);
end;
$$;

revoke all on function public.birdia_ops_ingest_application(text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.birdia_ops_review_application(uuid,text,text) from public, anon, authenticated;
grant execute on function public.birdia_ops_ingest_application(text,text,text,text,timestamptz) to service_role;
grant execute on function public.birdia_ops_review_application(uuid,text,text) to service_role;
