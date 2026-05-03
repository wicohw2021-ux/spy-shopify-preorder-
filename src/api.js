// src/api.js
// Central API-klient — håndterer token-caching og alle kald til Netlify Functions

let _token = null
let _tokenExpiresAt = 0

export async function login(username, password) {
  const res = await fetch('/.netlify/functions/spy-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login fejlede')

  _token = data.token
  _tokenExpiresAt = data.expiresAt
  return data
}

export function logout() {
  _token = null
  _tokenExpiresAt = 0
}

export function isTokenValid() {
  return _token && Date.now() < _tokenExpiresAt - 30_000 // 30 sek buffer
}

async function authHeaders() {
  if (!isTokenValid()) throw new Error('Session udløbet — log ind igen')
  return { Authorization: `Bearer ${_token}` }
}

export async function fetchStyles({ season, search, styleNos } = {}) {
  const headers = await authHeaders()
  const params = new URLSearchParams()
  if (season)   params.set('season', season)
  if (search)   params.set('search', search)
  if (styleNos?.length) params.set('styleNos', styleNos.join(','))

  const res = await fetch(`/.netlify/functions/spy-styles?${params}`, { headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Kunne ikke hente styles')
  return data
}

export async function generateImport(styles, season) {
  const headers = await authHeaders()
  const res = await fetch('/.netlify/functions/generate-shopify-import', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ styles, season })
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Eksport fejlede')
  }
  // Returner blob til download
  return await res.blob()
}
