exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'
  const { search } = event.queryStringParameters || {}

  try {
    // Hent brands først for at finde det rigtige brandName
    const brandsRes = await fetch(`${SPY_BASE_URL}/brands`, {
      headers: { 'X-Spy-Authorization': token, 'Accept': 'application/json' }
    })
    const brandsData = await brandsRes.json()
    const brands = brandsData?.data?.brands || []
    const firstBrand = brands[0]?.brandName

    if (!firstBrand) {
      return { statusCode: 422, body: JSON.stringify({ error: 'Ingen brands fundet', brands: brandsData }) }
    }

    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('limit', '10')
    params.set('brandName', firstBrand)
    if (search) params.set('search', search)

    const res = await fetch(`${SPY_BASE_URL}/variants/stock?${params}&detailed=true`, {
      headers: { 'X-Spy-Authorization': token, 'Accept': 'application/json' }
    })
    const text = await res.text()

    return {
      statusCode: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
      body: res.ok ? text : JSON.stringify({ error: 'SPY fejl: ' + res.status, details: text.slice(0, 300) })
    }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) }
  }
}
