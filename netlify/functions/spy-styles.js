exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'
  const { styleNos, season } = event.queryStringParameters || {}
  const headers = { 'X-Spy-Authorization': token, 'Accept': 'application/json' }

  if (!styleNos) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '[]' }
  }

  // Konvertér sæson fra AW26 → 26 Autumn
  function convertSeason(s) {
    if (!s) return '26 Autumn'
    const match = s.match(/^(AW|SS)(\d{2})$/)
    if (!match) return s
    return `${match[2]} ${match[1] === 'AW' ? 'Autumn' : 'Spring'}`
  }

  const targetSeason = convertSeason(season)
  const styleNoList = styleNos.split(',').map(s => s.trim()).filter(Boolean)
  const BRANDS = ['BTFCPH', 'NO. 1 BY OX', 'NOTYZ', 'Orchid']

  try {
    const productMap = {}

    for (const styleNo of styleNoList) {
      for (const brand of BRANDS) {
        const params = new URLSearchParams()
        params.set('brandName', brand)
        params.set('seasonName', targetSeason)
        params.set('styleNo', styleNo)
        params.set('detailed', 'true')

        const res = await fetch(`${SPY_BASE_URL}/variants/season?${params}`, { headers })
        if (!res.ok) continue

        const data = await res.json()
        const variants = data?.data?.variants || []
        if (variants.length === 0) continue

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
        // Stop ved første brand der matcher
        if (Object.keys(productMap).length > 0) break
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
