// src/App.jsx
import { useState, useCallback } from 'react'
import { login, logout, fetchStyles, generateImport } from './api.js'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  ink:      '#1c1917',
  stone:    '#78716c',
  dust:     '#e7e5e4',
  paper:    '#f7f5f0',
  white:    '#ffffff',
  moss:     '#3d6b52',
  mossLight:'#d1e8da',
  amber:    '#b45309',
  amberBg:  '#fef3c7',
  red:      '#b91c1c',
  redBg:    '#fee2e2',
  green:    '#166534',
  greenBg:  '#dcfce7',
}

const font = {
  display: "'Cormorant Garamond', serif",
  mono:    "'DM Mono', monospace",
  sans:    "system-ui, sans-serif",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusOf(style) {
  const variantCount = (style.colors?.length || 1) * (style.sizes?.length || 1)
  if (variantCount > 100) return 'over_limit'
  if (!style.prices?.dkk_rrp) return 'no_price'
  return 'ready'
}

function StatusBadge({ style }) {
  const s = statusOf(style)
  const map = {
    ready:      { label: 'Klar',              bg: C.greenBg,  color: C.green  },
    no_price:   { label: 'Mangler pris',      bg: C.amberBg,  color: C.amber  },
    over_limit: { label: 'Over 100 varianter',bg: C.redBg,    color: C.red    },
  }
  const { label, bg, color } = map[s]
  return (
    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: bg, color, fontFamily: font.mono, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  )
}

// ─── Skærme ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      onLogin(username)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.paper, padding: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } input:focus { outline: none; border-color: ${C.moss} !important; } button:hover { opacity: 0.88; }`}</style>

      {/* Logo mark */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: C.moss, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(61,107,82,0.3)' }}>
          <span style={{ color: '#fff', fontSize: 22, fontFamily: font.display, fontWeight: 300 }}>S</span>
        </div>
        <h1 style={{ fontFamily: font.display, fontSize: 34, fontWeight: 300, color: C.ink, letterSpacing: 1, marginBottom: 6 }}>SPY → Shopify</h1>
        <p style={{ fontFamily: font.mono, fontSize: 11, color: C.stone, letterSpacing: 2 }}>PRE-ORDER IMPORTVÆRKTØJ</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: C.stone, marginBottom: 7 }}>BRUGERNAVN</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="din@email.dk" required
            style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.dust}`, borderRadius: 6, fontFamily: font.sans, fontSize: 14, background: C.white, color: C.ink, transition: 'border-color 0.2s' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: font.mono, fontSize: 10, letterSpacing: 2, color: C.stone, marginBottom: 7 }}>ADGANGSKODE</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${C.dust}`, borderRadius: 6, fontFamily: font.sans, fontSize: 14, background: C.white, color: C.ink, transition: 'border-color 0.2s' }} />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: C.redBg, borderRadius: 6, fontFamily: font.mono, fontSize: 12, color: C.red }}>
            ⚠ {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ marginTop: 4, padding: '13px', background: loading ? C.stone : C.moss, color: C.white, border: 'none', borderRadius: 6, fontFamily: font.mono, fontSize: 12, letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s, opacity 0.2s' }}>
          {loading ? <><Spinner /> FORBINDER…</> : 'LOG IND MED SPY →'}
        </button>
      </form>

      <p style={{ marginTop: 40, fontFamily: font.mono, fontSize: 10, color: C.dust, letterSpacing: 1 }}>
        Dine credentials sendes aldrig direkte til SPY — al kommunikation sker via sikker serverside-funktion.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function SearchScreen({ onNext, onLogout }) {
  const [season, setSeason]       = useState('AW26')
  const [search, setSearch]       = useState('')
  const [styles, setStyles]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState({})

  const seasons = ['AW26', 'SS26', 'AW25', 'SS25']
  const selectedCount = Object.values(selected).filter(Boolean).length

  async function handleSearch() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchStyles({ season, search: search || undefined })
      setStyles(data)
    } catch (err) {
      if (err.message.includes('udløbet')) onLogout()
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggle(id) {
    setSelected(p => ({ ...p, [id]: !p[id] }))
  }

  const selectedStyles = (styles || []).filter(s => selected[s.styleNo || s.id])

  return (
    <div style={{ minHeight: '100vh', background: C.paper }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } button:hover { opacity: 0.88; }`}</style>

      {/* Header */}
      <div style={{ background: C.ink, color: C.white, padding: '0 32px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: C.moss, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontFamily: font.display, fontSize: 14 }}>S</span>
          </div>
          <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: 2, color: '#aaa' }}>SPY → SHOPIFY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StepPip label="1 · SØG" active />
          <div style={{ width: 20, height: 1, background: '#444' }} />
          <StepPip label="2 · GENNEMSE" />
          <div style={{ width: 20, height: 1, background: '#444' }} />
          <StepPip label="3 · EKSPORT" />
        </div>
        <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', padding: '5px 14px', borderRadius: 4, fontFamily: font.mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>LOG UD</button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: font.mono, fontSize: 10, color: C.stone, letterSpacing: 3, marginBottom: 8 }}>TRIN 1</p>
          <h2 style={{ fontFamily: font.display, fontSize: 30, fontWeight: 300, color: C.ink, marginBottom: 4 }}>Søg og vælg styles</h2>
          <p style={{ fontFamily: font.sans, fontSize: 13, color: C.stone }}>Henter data direkte fra SPY via API — ingen eksportfiler nødvendige</p>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <select value={season} onChange={e => setSeason(e.target.value)}
            style={{ padding: '10px 14px', border: `1.5px solid ${C.dust}`, borderRadius: 6, fontFamily: font.mono, fontSize: 12, background: C.white, color: C.ink, outline: 'none' }}>
            {seasons.map(s => <option key={s}>{s}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Søg på navn eller style-nr…"
            style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${C.dust}`, borderRadius: 6, fontFamily: font.sans, fontSize: 14, background: C.white, color: C.ink, outline: 'none' }} />
          <button onClick={handleSearch} disabled={loading}
            style={{ padding: '10px 22px', background: loading ? C.stone : C.moss, color: C.white, border: 'none', borderRadius: 6, fontFamily: font.mono, fontSize: 11, letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <><Spinner />HENTER…</> : 'SØG'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: C.redBg, borderRadius: 6, fontFamily: font.mono, fontSize: 12, color: C.red, marginBottom: 16 }}>⚠ {error}</div>
        )}

        {/* Results */}
        {styles === null && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.stone, fontFamily: font.mono, fontSize: 12, letterSpacing: 1 }}>
            Vælg sæson og søg for at hente styles fra SPY
          </div>
        )}

        {styles?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.stone, fontFamily: font.mono, fontSize: 12 }}>
            Ingen styles fundet for denne søgning
          </div>
        )}

        {styles && styles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {styles.map(style => {
              const id = style.styleNo || style.id
              const isSelected = !!selected[id]
              const colors = style.colors || []
              const variantCount = colors.length * (style.sizes?.length || 1)

              return (
                <div key={id} onClick={() => toggle(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', background: isSelected ? C.mossLight : C.white, border: `1.5px solid ${isSelected ? C.moss : C.dust}`, borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s' }}>

                  {/* Checkbox */}
                  <div style={{ width: 19, height: 19, borderRadius: 4, border: `2px solid ${isSelected ? C.moss : '#ccc'}`, background: isSelected ? C.moss : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: font.display, fontSize: 17, color: C.ink }}>{style.name}</span>
                      <span style={{ fontFamily: font.mono, fontSize: 10, color: C.stone, letterSpacing: 1 }}>{id}</span>
                      <StatusBadge style={style} />
                    </div>
                    <div style={{ fontFamily: font.mono, fontSize: 11, color: C.stone, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{style.type || 'Ukendt type'}</span>
                      <span>{colors.length} farver</span>
                      <span>{variantCount} varianter</span>
                      {colors.slice(0, 5).map(c => (
                        <span key={c} style={{ padding: '1px 7px', background: C.dust, borderRadius: 10, fontSize: 10 }}>{c}</span>
                      ))}
                      {colors.length > 5 && <span style={{ color: '#bbb', fontSize: 10 }}>+{colors.length - 5}</span>}
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', fontFamily: font.mono, fontSize: 12, flexShrink: 0 }}>
                    {style.prices?.dkk_rrp
                      ? <><div style={{ fontWeight: 400, color: C.ink }}>{style.prices.dkk_rrp} DKK</div>
                          <div style={{ fontSize: 10, color: C.stone }}>{style.prices.sek_rrp} SEK · €{style.prices.eur_rrp}</div></>
                      : <div style={{ color: C.amber, fontSize: 11 }}>Pris mangler</div>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom action bar */}
        {styles && styles.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: C.white, borderRadius: 7, border: `1px solid ${C.dust}` }}>
            <span style={{ fontFamily: font.mono, fontSize: 12, color: C.stone }}>
              <span style={{ color: C.ink, fontSize: 16, fontFamily: font.display }}>{selectedCount}</span> styles valgt
            </span>
            <button onClick={() => onNext(selectedStyles, season)} disabled={selectedCount === 0}
              style={{ padding: '11px 26px', background: selectedCount > 0 ? C.moss : '#ccc', color: C.white, border: 'none', borderRadius: 6, fontFamily: font.mono, fontSize: 11, letterSpacing: 2, cursor: selectedCount > 0 ? 'pointer' : 'not-allowed' }}>
              GENNEMSE VALGTE →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StepPip({ label, active }) {
  return (
    <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 10, fontFamily: font.mono, letterSpacing: 1, background: active ? C.moss : 'transparent', color: active ? '#fff' : '#666', border: active ? 'none' : '1px solid #333' }}>
      {label}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ReviewScreen({ styles, season, onBack, onExport }) {
  const ready      = styles.filter(s => statusOf(s) === 'ready')
  const noPrice    = styles.filter(s => statusOf(s) === 'no_price')
  const overLimit  = styles.filter(s => statusOf(s) === 'over_limit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    setLoading(true)
    setError('')
    try {
      const blob = await generateImport(styles, season)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shopify_preorder_${season}_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      onExport()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.paper }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } button:hover { opacity: 0.88; }`}</style>

      <div style={{ background: C.ink, color: C.white, padding: '0 32px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: C.moss, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontFamily: font.display, fontSize: 14 }}>S</span>
          </div>
          <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: 2, color: '#aaa' }}>SPY → SHOPIFY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StepPip label="1 · SØG" />
          <div style={{ width: 20, height: 1, background: '#444' }} />
          <StepPip label="2 · GENNEMSE" active />
          <div style={{ width: 20, height: 1, background: '#444' }} />
          <StepPip label="3 · EKSPORT" />
        </div>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: font.mono, fontSize: 10, color: C.stone, letterSpacing: 3, marginBottom: 8 }}>TRIN 2</p>
          <h2 style={{ fontFamily: font.display, fontSize: 30, fontWeight: 300, color: C.ink, marginBottom: 4 }}>Gennemse og godkend</h2>
          <p style={{ fontFamily: font.sans, fontSize: 13, color: C.stone }}>{styles.length} styles · sæson {season}</p>
        </div>

        {/* Advarselsbokse */}
        {overLimit.length > 0 && (
          <div style={{ padding: '13px 16px', background: C.redBg, borderRadius: 6, border: `1px solid #fca5a5`, marginBottom: 12, fontFamily: font.mono, fontSize: 12, color: C.red }}>
            ⚠ <strong>{overLimit.map(s => s.name).join(', ')}</strong> — overstiger 100-variant grænsen og skal oprettes manuelt i Shopify.
          </div>
        )}
        {noPrice.length > 0 && (
          <div style={{ padding: '13px 16px', background: C.amberBg, borderRadius: 6, border: `1px solid #fcd34d`, marginBottom: 12, fontFamily: font.mono, fontSize: 12, color: C.amber }}>
            ℹ <strong>{noPrice.map(s => s.name).join(', ')}</strong> — mangler pris og oprettes som kladde i Shopify.
          </div>
        )}

        {/* Tabel */}
        <div style={{ background: C.white, borderRadius: 7, border: `1px solid ${C.dust}`, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font.mono, fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.paper }}>
                {['Style', 'Type', 'Farver', 'DKK RRP', 'SEK RRP', 'EUR RRP', 'Shopify'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, letterSpacing: 1, color: C.stone, fontWeight: 'normal', borderBottom: `1px solid ${C.dust}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {styles.map((s, i) => (
                <tr key={s.styleNo || s.id} style={{ borderBottom: `1px solid ${C.paper}`, background: i % 2 === 0 ? C.white : '#fbfaf8' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontFamily: font.display, fontSize: 15, color: C.ink }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: C.stone }}>{s.styleNo || s.id}</div>
                  </td>
                  <td style={{ padding: '11px 14px', color: C.stone }}>{s.type || '–'}</td>
                  <td style={{ padding: '11px 14px' }}>{(s.colors || []).length}</td>
                  <td style={{ padding: '11px 14px' }}>{s.prices?.dkk_rrp || <span style={{ color: C.amber }}>–</span>}</td>
                  <td style={{ padding: '11px 14px' }}>{s.prices?.sek_rrp || <span style={{ color: C.amber }}>–</span>}</td>
                  <td style={{ padding: '11px 14px' }}>{s.prices?.eur_rrp ? `€${s.prices.eur_rrp}` : <span style={{ color: C.amber }}>–</span>}</td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge style={s} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Opsummering */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Klar til import', n: ready.length,     bg: C.greenBg,  c: C.green },
            { label: 'Oprettes som kladde', n: noPrice.length,   bg: C.amberBg,  c: C.amber },
            { label: 'Manuel oprettelse', n: overLimit.length, bg: C.redBg,    c: C.red   },
          ].map(item => (
            <div key={item.label} style={{ padding: '16px', background: item.bg, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontFamily: font.display, fontSize: 32, color: item.c }}>{item.n}</div>
              <div style={{ fontFamily: font.mono, fontSize: 10, color: item.c, marginTop: 4, letterSpacing: 1 }}>{item.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: C.redBg, borderRadius: 6, fontFamily: font.mono, fontSize: 12, color: C.red, marginBottom: 16 }}>⚠ {error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack}
            style={{ padding: '11px 20px', background: 'transparent', color: C.stone, border: `1px solid ${C.dust}`, borderRadius: 6, fontFamily: font.mono, fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>
            ← TILBAGE
          </button>
          <button onClick={handleExport} disabled={loading}
            style={{ padding: '11px 26px', background: loading ? C.stone : C.moss, color: C.white, border: 'none', borderRadius: 6, fontFamily: font.mono, fontSize: 11, letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <><Spinner />GENERERER…</> : 'GENERÉR IMPORTFIL →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ExportScreen({ styles, season, onReset }) {
  const importable = styles.filter(s => statusOf(s) !== 'over_limit')
  const manual     = styles.filter(s => statusOf(s) === 'over_limit')

  return (
    <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`button:hover { opacity: 0.88; }`}</style>

      <div style={{ width: 56, height: 56, borderRadius: 28, background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24 }}>✓</div>

      <h2 style={{ fontFamily: font.display, fontSize: 32, fontWeight: 300, color: C.ink, marginBottom: 6, textAlign: 'center' }}>Importfil downloadet</h2>
      <p style={{ fontFamily: font.mono, fontSize: 11, color: C.stone, letterSpacing: 2, marginBottom: 40 }}>SÆSON {season}</p>

      <div style={{ background: C.white, border: `1px solid ${C.dust}`, borderRadius: 8, padding: '24px 28px', maxWidth: 440, width: '100%', marginBottom: 32 }}>
        <p style={{ fontFamily: font.mono, fontSize: 10, color: C.stone, letterSpacing: 2, marginBottom: 14 }}>FILEN INDEHOLDER</p>
        {[
          `${importable.length} styles klar til Shopify-upload`,
          `Alle varianter med lager = 0`,
          `Tag: preorder (aktiverer Timesact)`,
          `Status: draft — Betina publicerer manuelt`,
          ...(manual.length > 0 ? [`${manual.length} styles kræver manuel oprettelse`] : []),
        ].map(item => (
          <div key={item} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.paper}`, fontFamily: font.mono, fontSize: 12, color: C.stone }}>
            <span style={{ color: C.moss, flexShrink: 0 }}>✓</span> {item}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onReset}
          style={{ padding: '12px 24px', background: C.moss, color: C.white, border: 'none', borderRadius: 6, fontFamily: font.mono, fontSize: 11, letterSpacing: 2, cursor: 'pointer' }}>
          NY IMPORT
        </button>
      </div>

      <p style={{ marginTop: 28, fontFamily: font.mono, fontSize: 10, color: C.dust, textAlign: 'center', maxWidth: 340, letterSpacing: 0.5 }}>
        Upload CSV-filen i Shopify Admin → Produkter → Importér. Timesact aktiverer pre-order automatisk via preorder-tagget.
      </p>
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]   = useState('login')
  const [username, setUsername] = useState('')
  const [selectedStyles, setSelectedStyles] = useState([])
  const [season, setSeason] = useState('AW26')

  return (
    <>
      {screen === 'login' && (
        <LoginScreen onLogin={u => { setUsername(u); setScreen('search') }} />
      )}
      {screen === 'search' && (
        <SearchScreen
          onNext={(styles, s) => { setSelectedStyles(styles); setSeason(s); setScreen('review') }}
          onLogout={() => { logout(); setScreen('login') }}
        />
      )}
      {screen === 'review' && (
        <ReviewScreen
          styles={selectedStyles}
          season={season}
          onBack={() => setScreen('search')}
          onExport={() => setScreen('export')}
        />
      )}
      {screen === 'export' && (
        <ExportScreen
          styles={selectedStyles}
          season={season}
          onReset={() => setScreen('search')}
        />
      )}
    </>
  )
}
