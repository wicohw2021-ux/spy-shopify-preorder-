exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  const { apiClient, apiSecret } = JSON.parse(event.body || '{}')
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api'

  try {
    const res = await fetch(`${SPY_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: apiClient, client_secret: apiSecret }),
      signal: AbortSignal.timeout(8000)
    })
    const data = await res.json()
    if (!res.ok || !data.data?.token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Ugyldig API Client eller API Secret' }) }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: data.data.token, expiresAt: Date.now() + 14 * 60 * 1000 })
    }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Kunne ikke forbinde til SPY API' }) }
  }
}
