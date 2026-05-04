// netlify/functions/spy-login.js
// Autentificerer mod SPY API via API Client + API Secret
// Token levetid: 15 minutter (SPY's specifikation)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { apiClient, apiSecret } = JSON.parse(event.body || '{}')

  if (!apiClient || !apiSecret) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'API Client og API Secret er påkrævet' })
    }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://api.spysystem.dk'

  try {
    const response = await fetch(`${SPY_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiClient, apiSecret })
    })

    if (!response.ok) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Ugyldig API Client eller API Secret' })
      }
    }

    const data = await response.json()

    // Token udløber efter 15 minutter (SPY's specifikation)
    // Vi bruger 14 minutter for at have lidt buffer
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: data.token,
        expiresAt: Date.now() + 14 * 60 * 1000
      })
    }
  } catch (err) {
    console.error('SPY login fejl:', err)
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Kunne ikke forbinde til SPY API' })
    }
  }
}
