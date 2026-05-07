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

  try {
    const params = new URLSearchParams()
    params.set('detailed', 'true')
    if (search) params.set('search', search)

    // SPY V1 bruger apiKey header — ikke Bearer
    const res = await fetch(`${SPY_BASE_URL}/variants/stock?${params}`, {
      headers: {
        'apiKey': token,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    })

    const text = await res.text()
    console.log('STATUS:', res.status, '| SVAR:', text.slice(0, 300))

    if (res.status === 401) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token udløbet — log ind igen' }) }
    }
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'SPY API fejl: ' + res.status }) }
    }

    const data = JSON.parse(text)

    // Gruppér varianter per style+farve → ét produkt per farve
    const productMap = {}
    for (const variant of (data.data?.variants || [])) {
      const d = variant.details
      const key = `${d.styleNo}__${d.colorName}`
      if (!productMap[key]) {
        productMap[key] = {
          styleNo: d.styleNo,
          name: d.styleNameWebshop || d.styleName,
          styleNameWebshop: d.styleNameWebshop || d.styleName,
          type: d.type || d.category || '',
          colors: [d.colorName],
          sizes: [],
          images: d.images || [],
          styleDescription: d.styleDescription || '',
          brandName: d.brandName || '',
          prices: {
            dkk_rrp: d.price || null,
            dkk_wsp: d.wspPrice || null,
          }
        }
      }
      if (d.size && !productMap[key].sizes.includes(d.size)) {
        productMap[key].sizes.push(d.size)
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.values(productMap))
    }
  } catch (err) {
    console.log('FEJL:', err.message)
    return { statusCode: 502, body: JSON.stringify({ error: 'Netværksfejl: ' + err.message }) }
  }
}
