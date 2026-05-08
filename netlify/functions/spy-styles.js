const https = require('https')

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = event.headers['authorization']?.replace('Bearer ', '')
  console.log('TOKEN:', token ? 'JA' : 'NEJ')

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Manglende token' }) }
  }

  const SPY_BASE_URL = process.env.SPY_BASE_URL || 'https://denasia.spysystem.dk/api/v1'

  return new Promise((resolve) => {
    const url = new URL(`${SPY_BASE_URL}/variants/stock?page=1&limit=1`)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apiKey': token,
        'Accept': 'application/json'
      }
    }

    console.log('Kalder:', url.toString())

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log('STATUS:', res.statusCode)
        console.log('SVAR:', data.slice(0, 300))
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: data
        })
      })
    })

    req.on('error', (err) => {
      console.log('FEJL:', err.message)
      resolve({ statusCode: 502, body: JSON.stringify({ error: err.message }) })
    })

    req.end()
  })
}
