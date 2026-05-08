export const handler = async (event) => {
  const token = event.headers['authorization']?.replace('Bearer ', '')
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token', debug: 'ingen token i header' }) }
  }

  try {
    const res = await fetch(`${SPY_BASE_URL}/variants/stock?page=1&limit=1`, {
      headers: { 'apiKey': token, 'Accept': 'application/json' }
    })
    const text = await res.text()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debug: true, status: res.status, url: SPY_BASE_URL, svar: text.slice(0, 500) })
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debug: true, fejl: err.message, stack: err.stack?.slice(0, 200) })
    }
  }
}
