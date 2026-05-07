exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { apiClient, apiSecret } = JSON.parse(event.body || '{}')
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'

  try {
    const res = await fetch(`${SPY_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientID: apiClient, clientSecret: apiSecret })
    })
    const text = await res.text()
    console.log('LOGIN SVAR:', text.slice(0, 500))

    let data
    try { data = JSON.parse(text) } catch(e) {}
    console.log('DATA KEYS:', Object.keys(data || {}))

    const token = data?.token || data?.data?.token || data?.apiKey
    console.log('TOKEN FUNDET:', token ? token.slice(0, 30) + '...' : 'INGEN')

    if (res.ok && token) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, expiresAt: Date.now() + 13 * 60 * 1000 })
      }
    }
    return { statusCode: 401, body: JSON.stringify({ error: 'Ugyldig API Client eller API Secret' }) }
  } catch (err) {
    console.log('FEJL:', err.message)
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) }
  }
}
