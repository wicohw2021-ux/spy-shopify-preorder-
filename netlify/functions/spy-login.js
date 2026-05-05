exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  console.log('RAW BODY:', event.body)

  const parsed = JSON.parse(event.body || '{}')
  console.log('PARSED:', JSON.stringify(parsed))

  const { apiClient, apiSecret } = parsed
  console.log('apiClient:', apiClient)
  console.log('apiSecret:', apiSecret ? 'HAR VÆRDI' : 'TOM')

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api'

  try {
    const res = await fetch(`${SPY_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: apiClient, client_secret: apiSecret }),
      signal: AbortSignal.timeout(8000)
    })
    const text = await res.text()
    console.log('STATUS:', res.status)
    console.log('SVAR:', text.slice(0, 300))

    let data
    try { data = JSON.parse(text) } catch(e) {}
    const token = data?.data?.token || data?.token
    if (res.ok && token) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, expiresAt: Date.now() + 14 * 60 * 1000 })
      }
    }
    return { statusCode: 401, body: JSON.stringify({ error: 'Ugyldig API Client eller API Secret' }) }
  } catch (err) {
    console.log('FEJL:', err.message)
    return { statusCode: 502, body: JSON.stringify({ error: 'Kunne ikke forbinde til SPY API' }) }
  }
}
