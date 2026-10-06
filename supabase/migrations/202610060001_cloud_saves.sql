-- Run in the Supabase SQL Editor. Player data never passes through Vercel.
begin;

create table if not exists public.cloud_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  revision bigint not null default 1 check (revision between 1 and 9007199254740991),
  data jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot),
  constraint cloud_save_size check (data is null or octet_length(data::text) <= 262144),
  constraint cloud_save_shape check (data is null or ((
    jsonb_typeof(data) = 'object'
    and jsonb_typeof(data->'version') = 'number'
    and jsonb_typeof(data->'id') = 'string'
    and jsonb_typeof(data->'player') = 'object'
    and jsonb_typeof(data->'stats') = 'object'
    and jsonb_typeof(data->'langs') = 'object'
    and data ?& array['version', 'id', 'player', 'stats', 'langs']
  ) is true))
);
alter table public.cloud_saves enable row level security;
revoke all on public.cloud_saves from anon, authenticated;
grant select on public.cloud_saves to authenticated;
drop policy if exists "Owners read their memory card" on public.cloud_saves;
create policy "Owners read their memory card" on public.cloud_saves
  for select to authenticated using ((select auth.uid()) = user_id);

-- The only write path: owner identity comes from the verified JWT, never from a request field.
-- CAS protects offline/multi-device edits; NULL data is a deletion tombstone, not a lost revision.
create or replace function public.sync_cloud_save(p_slot integer, p_expected_revision bigint, p_data jsonb)
returns setof public.cloud_saves
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'authentication_required'; end if;
  if p_slot is null or p_slot < 1 or p_slot > 3 or p_expected_revision is null
      or p_expected_revision < 0 or p_expected_revision >= 9007199254740991 then
    raise exception 'invalid_slot_or_revision';
  end if;
  -- Only a new replica (revision zero) can create a previously absent slot.
  if p_expected_revision = 0 then
    return query insert into public.cloud_saves(user_id, slot, data)
      values (owner_id, p_slot, p_data)
      on conflict (user_id, slot) do nothing returning *;
  else
    -- A two-second per-slot cooldown bounds rapid repeated writes by one account.
    if exists (select 1 from public.cloud_saves s where s.user_id = owner_id and s.slot = p_slot
        and s.revision = p_expected_revision and s.updated_at > clock_timestamp() - interval '2 seconds') then
      raise exception 'save_cooldown';
    end if;
    return query update public.cloud_saves s set data = p_data, revision = s.revision + 1, updated_at = now()
      where s.user_id = owner_id and s.slot = p_slot and s.revision = p_expected_revision returning s.*;
  end if;
end;
$$;
revoke all on function public.sync_cloud_save(integer, bigint, jsonb) from public, anon;
grant execute on function public.sync_cloud_save(integer, bigint, jsonb) to authenticated;

commit;
