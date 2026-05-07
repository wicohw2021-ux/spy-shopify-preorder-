exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  console.log('RAW BODY:', event.body)
  const { apiClient, apiSecret } = JSON.parse(event.body || '{}')
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'

  // Prøv query string i stedet for JSON body
  const url = `${SPY_BASE_URL}/auth/login?client_id=${encodeURIComponent(apiClient)}&client_secret=${encodeURIComponent(apiSecret)}`
  console.log('Kalder URL:', url.replace(apiSecret, '***'))

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    })
    const text = await res.text()
    console.log('STATUS:', res.status, '| SVAR:', text.slice(0, 300))

    let data
    try { data = JSON.parse(text) } catch(e) {}
    const token = data?.token || data?.data?.token || data?.apiKey
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
    return { statusCode: 502, body: JSON.stringify({ error: 'Kunne ikke forbinde til SPY API' }) }
  }
}
