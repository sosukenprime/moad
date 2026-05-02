// Supabase-backed storage. The entire app state lives in user_state.data
// (a single JSONB column), one row per authenticated user. Real-time
// subscription pushes cross-device updates back into the store.
//
// Schema (created in Supabase SQL editor):
//   create table user_state (
//     user_id uuid references auth.users(id) on delete cascade primary key,
//     data jsonb not null default '{}',
//     updated_at timestamptz not null default now()
//   );
//   alter table user_state enable row level security;
//   create policy "users can manage own state" on user_state for all
//     using (auth.uid() = user_id) with check (auth.uid() = user_id);
//   alter publication supabase_realtime add table user_state;

import { supabase } from './supabase.js'

const TABLE = 'user_state'

export async function loadState(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[storage] load failed', error)
    return null
  }
  return data?.data || null
}

export async function saveState(userId, dataObj) {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: userId, data: dataObj, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) console.error('[storage] save failed', error)
  return !error
}

export async function clearState(userId) {
  const { error } = await supabase.from(TABLE).delete().eq('user_id', userId)
  if (error) console.error('[storage] clear failed', error)
}

export function subscribeToState(userId, onChange) {
  const channel = supabase
    .channel(`user_state:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const next = payload.new?.data
        if (next) onChange(next)
      }
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

// Local export/import (still works — emits the same JSONB shape).
export function exportState(state) {
  return JSON.stringify(
    { __version: 2, savedAt: new Date().toISOString(), data: state },
    null,
    2
  )
}

export function importState(json) {
  try {
    const parsed = JSON.parse(json)
    return parsed.data || parsed
  } catch (err) {
    console.error('[storage] import parse failed', err)
    return null
  }
}
