// netlify/functions/generate-shopify-import.js
// Modtager valgte styles og genererer en Shopify-importfil (CSV format)
// returnerer filen som base64 så browseren kan downloade den

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { styles, season } = JSON.parse(event.body || '{}')
  if (!styles || styles.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ingen styles valgt' }) }
  }

  // Shopify product CSV-kolonner
  const headers = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category',
    'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value',
    'Option2 Name', 'Option2 Value', 'Variant SKU', 'Variant Grams',
    'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service',
    'Variant Price', 'Variant Compare At Price',
    'Variant Requires Shipping', 'Variant Taxable',
    'Image Src', 'Image Position', 'Image Alt Text',
    'SEO Title', 'SEO Description',
    'Google Shopping / Google Product Category',
    'Variant Image', 'Variant Weight Unit',
    'Variant Tax Code', 'Cost per item',
    'Price / International', 'Compare At Price / International',
    'Status'
  ]

  const rows = [headers]

  for (const style of styles) {
    const handle = style.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const hasPrice = style.prices && style.prices.dkk_rrp
    const status = hasPrice ? 'draft' : 'draft' // altid draft — Betina publicerer manuelt
    const tags = ['preorder', season].filter(Boolean).join(', ')

    const colors = style.colors || ['Default']
    const sizes  = style.sizes  || ['One Size']

    let firstRow = true
    let imagePosition = 1

    for (const color of colors) {
      for (const size of sizes) {
        const sku = `${style.styleNo}-${color.replace(/\s/g,'-')}-${size.replace(/\s/g,'-')}`
        const variantPrice = hasPrice ? style.prices.dkk_rrp : ''
        const compareAt    = hasPrice ? style.prices.dkk_wsp : ''

        const row = firstRow
          ? [
              handle,
              style.name,
              style.description || '',
              'SPY Systems',
              '',
              style.type || '',
              tags,
              'FALSE',
              'Color', color,
              'Size',  size,
              sku, '0',
              'shopify', '0',
              'deny', 'manual',
              variantPrice, compareAt,
              'TRUE', 'TRUE',
              style.imageUrl || '', imagePosition, `${style.name} - ${color}`,
              style.name, '',
              '', '', 'kg', '', '',
              '', '',
              status
            ]
          : [
              handle, '', '', '', '', '', '', '',
              'Color', color,
              'Size',  size,
              sku, '0',
              'shopify', '0',
              'deny', 'manual',
              variantPrice, compareAt,
              'TRUE', 'TRUE',
              style.imageUrl || '', imagePosition, `${style.name} - ${color}`,
              '', '', '', '', 'kg', '', '', '', '', status
            ]

        rows.push(row)
        firstRow = false
        imagePosition++
      }
    }
  }

  // Byg CSV
  const csv = rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }).join(',')
  ).join('\n')

  const filename = `shopify_preorder_${season || 'import'}_${new Date().toISOString().slice(0,10)}.csv`

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: csv
  }
}
