// Partner pairing + cross-user requests (The Ask).
//
// Schema (created in Supabase SQL editor — see SQL block in this file's footer):
//   partners(id, user_id, partner_email, partner_name, created_at)
//   partner_requests(id, from_user_id, to_user_id, raw, polished, status, created_at, completed_at)
//
// RLS lets a partner read partners rows where they're listed (so Michelle can
// resolve Ken's user_id) and lets either party read partner_requests they're
// involved in. Sender can insert/delete their own pending; recipient can
// update status.

import { supabase } from './supabase.js'

// ---- partners (Ken's list of who he's paired with) ----

export async function loadMyPartners(userId) {
  const { data, error } = await supabase
    .from('partners')
    .select('id, user_id, partner_email, partner_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) {
    console.warn('[partners] loadMyPartners', error)
    return []
  }
  return data || []
}

// ---- "I'm someone's partner" (Michelle's reverse lookup) ----
//
// Returns rows describing which users have ME listed as their partner.
// Each row tells Michelle one user (`user_id`) she can address requests to,
// along with the name they used for her ("Michelle"). With RLS, this query
// only returns rows where partner_email = the caller's email.

export async function loadPartnersListingMe(myEmail) {
  if (!myEmail) return []
  const { data, error } = await supabase
    .from('partners')
    .select('id, user_id, partner_email, partner_name')
    .ilike('partner_email', myEmail)
  if (error) {
    console.warn('[partners] loadPartnersListingMe', error)
    return []
  }
  return data || []
}

export async function addPartner(userId, { email, name }) {
  const { data, error } = await supabase
    .from('partners')
    .insert({
      user_id: userId,
      partner_email: email.trim().toLowerCase(),
      partner_name: name?.trim() || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removePartner(id) {
  const { error } = await supabase.from('partners').delete().eq('id', id)
  if (error) throw error
}

// ---- partner_requests ----

export async function loadIncomingRequests(myUserId) {
  const { data, error } = await supabase
    .from('partner_requests')
    .select('*')
    .eq('to_user_id', myUserId)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[partners] loadIncomingRequests', error)
    return []
  }
  return data || []
}

export async function loadOutgoingRequests(myUserId) {
  const { data, error } = await supabase
    .from('partner_requests')
    .select('*')
    .eq('from_user_id', myUserId)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[partners] loadOutgoingRequests', error)
    return []
  }
  return data || []
}

export async function sendRequest({ fromUserId, toUserId, raw, polished }) {
  const { data, error } = await supabase
    .from('partner_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      raw,
      polished,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markRequestDone(id) {
  const { data, error } = await supabase
    .from('partner_requests')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markRequestPending(id) {
  const { data, error } = await supabase
    .from('partner_requests')
    .update({ status: 'pending', completed_at: null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRequest(id) {
  const { error } = await supabase.from('partner_requests').delete().eq('id', id)
  if (error) throw error
}

// ---- realtime subscriptions ----

// Subscribes to all partner_requests changes that touch this user (sender or
// recipient). Fires `onChange(eventType, row)` for every INSERT/UPDATE/DELETE
// that involves them. Returns an unsubscribe function.
export function subscribeToPartnerRequests(userId, onChange) {
  const channel = supabase
    .channel(`partner_requests:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partner_requests', filter: `to_user_id=eq.${userId}` },
      (payload) => onChange(payload.eventType, payload.new || payload.old),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partner_requests', filter: `from_user_id=eq.${userId}` },
      (payload) => onChange(payload.eventType, payload.new || payload.old),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

/* ============================================================================
SQL to run once in the Supabase SQL editor:

create table partners (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  partner_email text not null,
  partner_name text,
  created_at timestamptz default now() not null,
  unique (user_id, partner_email)
);
alter table partners enable row level security;

create policy "owner manages own partners" on partners for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "partner can read own listings" on partners for select
  using (lower(partner_email) = lower((auth.jwt() ->> 'email')::text));

create table partner_requests (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users(id) on delete cascade not null,
  to_user_id uuid references auth.users(id) on delete cascade not null,
  raw text not null,
  polished text not null,
  status text not null default 'pending',
  created_at timestamptz default now() not null,
  completed_at timestamptz
);
alter table partner_requests enable row level security;

create policy "sender inserts" on partner_requests for insert
  with check (
    auth.uid() = from_user_id
    and exists (
      select 1 from partners p
      where p.user_id = to_user_id
      and lower(p.partner_email) = lower((auth.jwt() ->> 'email')::text)
    )
  );

create policy "parties read" on partner_requests for select
  using (auth.uid() in (from_user_id, to_user_id));

create policy "recipient updates" on partner_requests for update
  using (auth.uid() = to_user_id) with check (auth.uid() = to_user_id);

create policy "sender deletes pending" on partner_requests for delete
  using (auth.uid() = from_user_id and status = 'pending');

alter publication supabase_realtime add table partner_requests;
============================================================================ */
