exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { apiClient, apiSecret } = JSON.parse(event.body || '{}')
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://api.spysystem.dk'

  console.log('SPY_BASE_URL:', SPY_BASE_URL)
  console.log('apiClient modtaget:', apiClient ? apiClient.slice(0,8) + '...' : 'MANGLER')
  console.log('apiSecret modtaget:', apiSecret ? 'JA' : 'MANGLER')

  const endpoints = [
    { path: '/login',         body: { apiClient, apiSecret } },
    { path: '/login',         body: { client_id: apiClient, client_secret: apiSecret } },
    { path: '/api/login',     body: { apiClient, apiSecret } },
    { path: '/v1/auth/login', body: { apiClient, apiSecret } },
    { path: '/auth/login',    body: { apiClient, apiSecret } },
  ]

  for (const ep of endpoints) {
    const url = SPY_BASE_URL + ep.path
    console.log('Prøver:', url)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(ep.body),
        signal: AbortSignal.timeout(6000)
      })
      const text = await res.text()
      console.log('Status:', res.status, '| Svar:', text.slice(0, 200))

      if (res.ok && (text.includes('token') || text.includes('Token'))) {
        const data = JSON.parse(text)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token || data.Token, expiresAt: Date.now() + 14 * 60 * 1000 })
        }
      }
    } catch (err) {
      console.log('Fejl på', url, ':', err.message)
    }
  }

  return { statusCode: 401, body: JSON.stringify({ error: 'Ugyldig API Client eller API Secret' }) }
}
