export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')
  console.log('TOKEN:', token ? 'JA' : 'NEJ')

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'

  try {
    console.log('Starter fetch...')
    const res = await fetch(`${SPY_BASE_URL}/variants/stock?page=1&limit=1`, {
      headers: {
        'apiKey': token,
        'Accept': 'application/json'
      }
    })
    console.log('STATUS:', res.status)
    const text = await res.text()
    console.log('SVAR:', text.slice(0, 300))
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: text
    }
  } catch (err) {
    console.log('FEJL:', err.message)
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) }
  }
}
