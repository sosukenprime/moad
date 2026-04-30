// localStorage wrapper with versioned schema so future migrations are clean.
// State persisted under one key. Bump SCHEMA_VERSION when shape changes incompatibly.

const STORAGE_KEY = 'moad-state-v1'
const SCHEMA_VERSION = 1

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.__version !== SCHEMA_VERSION) return null
    return parsed.data
  } catch (err) {
    console.warn('[storage] failed to load state', err)
    return null
  }
}

export function saveState(data) {
  try {
    const payload = { __version: SCHEMA_VERSION, savedAt: new Date().toISOString(), data }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn('[storage] failed to save state', err)
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  return raw
}

export function importState(json) {
  try {
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') throw new Error('bad shape')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    return true
  } catch (err) {
    console.error('[storage] import failed', err)
    return false
  }
}
