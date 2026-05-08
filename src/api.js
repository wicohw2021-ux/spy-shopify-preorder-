let _token = null
let _tokenExpiresAt = 0

export async function login(apiClient, apiSecret) {
  const res = await fetch('/.netlify/functions/spy-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiClient, apiSecret })
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
  return _token && Date.now() < _tokenExpiresAt - 30_000
}

async function authHeaders() {
  if (!isTokenValid()) throw new Error('Session udløbet — log ind igen')
  return { Authorization: `Bearer ${_token}` }
}

export async function fetchStyles({ season, search } = {}) {
  const headers = await authHeaders()
  const params = new URLSearchParams()
  if (season) params.set('season', season)
  if (search) params.set('search', search)

  const res = await fetch(`/.netlify/functions/spy-styles?${params}`, { headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Kunne ikke hente styles')
  // Sikr at vi altid returnerer et array
  return Array.isArray(data) ? data : []
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
  return await res.blob()
}
