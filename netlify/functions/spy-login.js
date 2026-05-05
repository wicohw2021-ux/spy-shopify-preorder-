exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { apiClient, apiSecret } = JSON.parse(event.body || '{}')
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'

  const credentials = Buffer.from(`${apiClient}:${apiSecret}`).toString('base64')

  try {
    const res = await fetch(`${SPY_BASE_URL}/variants`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    })
    const text = await res.text()
    console.log('STATUS:', res.status, '| SVAR:', text.slice(0, 200))

    if (res.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: credentials,
          expiresAt: Date.now() + 60 * 60 * 1000
        })
      }
    }
    return { statusCode: 401, body: JSON.stringify({ error: 'Ugyldig API Client eller API Secret' }) }
  } catch (err) {
    console.log('FEJL:', err.message)
    return { statusCode: 502, body: JSON.stringify({ error: 'Kunne ikke forbinde til SPY API' }) }
  }
}
