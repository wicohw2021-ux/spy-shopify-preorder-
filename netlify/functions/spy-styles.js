exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  const token = event.headers['authorization']?.replace('Bearer ', '')
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }

  const SPY = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'
  const h = { 'X-Spy-Authorization': token, 'Accept': 'application/json' }

  try {
    const results = {}

    // Test 1: season endpoint
    const r1 = await fetch(`${SPY}/variants/season?brandName=BTFCPH&seasonName=26%20Autumn&styleNo=100028-new&detailed=true`, { headers: h })
    const d1 = await r1.json()
    results.season = { status: r1.status, count: d1?.data?.variants?.length, msg: d1?.message }

    await new Promise(r => setTimeout(r, 700))

    // Test 2: stock endpoint
    const r2 = await fetch(`${SPY}/variants/stock?brandName=BTFCPH&styleNo=100028-new&detailed=true`, { headers: h })
    const d2 = await r2.json()
    results.stock = { status: r2.status, count: d2?.data?.variants?.length, msg: d2?.message }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(results) }
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) }
  }
}
