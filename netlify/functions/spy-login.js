// netlify/functions/spy-login.js
// Kaldes fra browseren med { username, password }
// Returnerer et SPY API-token uden at credentials nogensinde rammer SPY direkte fra browseren

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { username, password } = JSON.parse(event.body || '{}')

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Brugernavn og adgangskode er påkrævet' })
    }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://api.spysystem.dk'

  try {
    const response = await fetch(`${SPY_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!response.ok) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Forkert brugernavn eller adgangskode' })
      }
    }

    const data = await response.json()

    // Returner token til browseren — token udløber efter ~13 min (SPY anbefaling)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: data.token,
        expiresAt: Date.now() + 13 * 60 * 1000
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
