exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'
  const { search, brand, season } = event.queryStringParameters || {}
  const headers = { 'X-Spy-Authorization': token, 'Accept': 'application/json' }
  const targetBrand = brand || 'Orchid'

  try {
    // Hvis ingen sæson angivet — hent sæsonliste og returner den
    if (!season) {
      const seasonsRes = await fetch(`${SPY_BASE_URL}/seasons?brandName=${encodeURIComponent(targetBrand)}`, { headers })
      const seasonsData = await seasonsRes.json()
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasons: seasonsData?.data?.seasons || [], brand: targetBrand })
      }
    }

    // Hent varianter for specifik sæson
    const params = new URLSearchParams()
    params.set('brandName', targetBrand)
    params.set('seasonName', season)
    params.set('detailed', 'true')
    if (search) params.set('styleNo', search)

    const res = await fetch(`${SPY_BASE_URL}/variants/season?${params}`, { headers })
    const data = await res.json()
    const variants = data?.data?.variants || []

    const productMap = {}
    for (const variant of variants) {
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
          prices: { dkk_rrp: d.price || null, dkk_wsp: d.wspPrice || null }
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
