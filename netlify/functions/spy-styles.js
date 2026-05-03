// netlify/functions/spy-styles.js
// Henter styles fra SPY Produkt-API med token + valgfri filtrering på sæson/søgeterm

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }
  }

  const { season, search, styleNos } = event.queryStringParameters || {}
  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://api.spysystem.dk'

  try {
    // Byg query-parametre til SPY's Produkt-API
    const params = new URLSearchParams()
    if (season)   params.set('season', season)
    if (search)   params.set('search', search)
    if (styleNos) params.set('styleNos', styleNos) // kommasepareret liste

    const stylesRes = await fetch(
      `${SPY_BASE_URL}/v2/styles?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (stylesRes.status === 401) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token udløbet — log ind igen' }) }
    }
    if (!stylesRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'SPY API fejl ved hentning af styles' }) }
    }

    const styles = await stylesRes.json()

    // Hent prisliste parallelt
    const pricesRes = await fetch(
      `${SPY_BASE_URL}/v2/pricelists?season=${season || ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const prices = pricesRes.ok ? await pricesRes.json() : []

    // Merge priser ind på styles
    const priceMap = {}
    for (const p of prices) {
      priceMap[p.styleNo] = {
        dkk_wsp: p.wsp_dkk,
        dkk_rrp: p.rrp_dkk,
        sek_wsp: p.wsp_sek,
        sek_rrp: p.rrp_sek,
        eur_wsp: p.wsp_eur,
        eur_rrp: p.rrp_eur,
      }
    }

    const enriched = styles.map(s => ({
      ...s,
      prices: priceMap[s.styleNo] || null
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched)
    }
  } catch (err) {
    console.error('SPY styles fejl:', err)
    return { statusCode: 502, body: JSON.stringify({ error: 'Netværksfejl mod SPY API' }) }
  }
}
