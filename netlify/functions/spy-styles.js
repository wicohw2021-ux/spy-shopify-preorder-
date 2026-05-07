exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }
  }

  const { search } = event.queryStringParameters || {}
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'

  const url = `${SPY_BASE_URL}/variants/stock?detailed=true${search ? '&search=' + encodeURIComponent(search) : ''}`
  console.log('URL:', url)
  console.log('TOKEN (første 20 tegn):', token?.slice(0, 20))

  try {
    const res = await fetch(url, {
      headers: {
        'apiKey': token,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    })
    console.log('STATUS:', res.status)
    const text = await res.text()
    console.log('SVAR:', text.slice(0, 400))
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: text
    }
  } catch (err) {
    console.log('FEJL:', err.message)
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) }
  }
}
