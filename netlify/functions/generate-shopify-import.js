// netlify/functions/generate-shopify-import.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  const { styles, season } = JSON.parse(event.body || '{}')
  if (!styles || styles.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ingen styles valgt' }) }
  }
  const headers = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
    'Option1 Name', 'Option1 Value',
    'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
    'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service',
    'Variant Price', 'Variant Compare At Price',
    'Variant Requires Shipping', 'Variant Taxable',
    'Image Src', 'Image Position', 'Image Alt Text', 'Status'
  ]
  const rows = [headers]
  for (const style of styles) {
    const styleNo = style.styleNo || style.id
    const colors  = style.colors  || ['Default']
    const sizes   = style.sizes   || ['One Size']
    for (const color of colors) {
      const handle = `${styleNo}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const title     = `${style.styleNameWebshop || style.name} - ${color}`
      const hasPrice  = style.prices?.dkk_rrp
      const price     = hasPrice ? style.prices.dkk_rrp : ''
      const compareAt = hasPrice ? style.prices.dkk_wsp : ''
      const tags      = ['preorder', season, styleNo].filter(Boolean).join(', ')
      const imageUrl  = Array.isArray(style.images) && style.images.length > 0 ? style.images[0] : ''
      const weightGrams = style.weight ? Math.round(style.weight * 1000) : '0'
      let firstRow = true
      for (const size of sizes) {
        const sku = `${styleNo}\\${color}\\${size}`
        const row = firstRow
          ? [handle, title, style.styleDescription || '', style.brandName || 'SPY Systems', style.type || style.category || '', tags, 'FALSE', 'Size', size, sku, weightGrams, 'shopify', '0', 'deny', 'manual', price, compareAt, 'TRUE', 'TRUE', imageUrl, '1', title, 'draft']
          : [handle, '', '', '', '', '', '', 'Size', size, sku, weightGrams, 'shopify', '0', 'deny', 'manual', price, compareAt, 'TRUE', 'TRUE', '', '', '', 'draft']
        rows.push(row)
        firstRow = false
      }
    }
  }
  const csv = rows.map(row => row.map(cell => { const s = String(cell ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s }).join(',')).join('\n')
  const filename = `shopify_preorder_${season || 'import'}_${new Date().toISOString().slice(0, 10)}.csv`
  return { statusCode: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` }, body: csv }
}
