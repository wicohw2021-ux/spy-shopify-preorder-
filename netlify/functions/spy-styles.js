exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')

  if (!token) {
    return { 
      statusCode: 401, 
      body: JSON.stringify({ error: 'Manglende token' }) 
    }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'
  const { search } = event.queryStringParameters || {}

  try {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('limit', '10')
    if (search) params.set('search', search)

    const url = `${SPY_BASE_URL}/variants/stock?${params.toString()}`

    const res = await fetch(url, {
      headers: {
        'apiKey': token,
        'Accept': 'application/json'
      }
    })

    const text = await res.text()
    
    if (!res.ok) {
      return { 
        statusCode: res.status, 
        body: JSON.stringify({ error: 'SPY fejl: ' + res.status + ' ' + text.slice(0, 100) }) 
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: text
    }
  } catch (err) {
    return { 
      statusCode: 502, 
      body: JSON.stringify({ error: err.message }) 
    }
  }
}
