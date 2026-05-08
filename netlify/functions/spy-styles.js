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
  const headers = { 'X-Spy-Authorization': token, 'Accept': 'application/json' }

  try {
    // Hent alle brands dynamisk
    const brandsRes = await fetch(`${SPY_BASE_URL}/brands`, { headers })
    const brandsData = await brandsRes.json()
    const brands = (brandsData?.data?.brands || []).map(b => b.brandName)

    if (brands.length === 0) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '[]' }
    }

    // Hent varianter for alle brands
    const allVariants = []
    for (const brand of brands) {
      const params = new URLSearchParams()
      params.set('brandName', brand)
      params.set('page', '1')
      params.set('limit', '250')
      params.set('detailed', 'true')
      if (search) params.set('search', search)

      const res = await fetch(`${SPY_BASE_URL}/variants/stock?${params}`, { headers })
      if (res.ok) {
        const data = await res.json()
        allVariants.push(...(data?.data?.variants || []))
      }
      // Respekter rate limit
      await new Promise(r => setTimeout(r, 500))
    }

    // Gruppér per style+farve — ét produkt per farve
    const productMap = {}
    for (const variant of allVariants) {
      const d = variant.details
      if (!d) continue
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
            dkk_wsp: d.wspPrice || null
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
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) }
  }
}
