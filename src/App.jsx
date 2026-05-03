// src/App.jsx
import { useState } from 'react'
import { login, logout, fetchStyles, generateImport } from './api.js'

const C = {
  ink:'#1c1917', stone:'#78716c', dust:'#e7e5e4', paper:'#f7f5f0', white:'#ffffff',
  moss:'#3d6b52', mossLight:'#d1e8da', amber:'#b45309', amberBg:'#fef3c7',
  red:'#b91c1c', redBg:'#fee2e2', green:'#166534', greenBg:'#dcfce7',
}
const font = { display:"'Cormorant Garamond', serif", mono:"'DM Mono', monospace", sans:"system-ui, sans-serif" }

function variantCount(style, excludedColors = {}) {
  const id = style.styleNo || style.id
  const excl = excludedColors[id] || {}
  return (style.colors || []).filter(c => !excl[c]).length * (style.sizes?.length || 1)
}

function statusOf(style, excludedColors = {}) {
  if (variantCount(style, excludedColors) > 100) return 'over_limit'
  if (!style.prices?.dkk_rrp) return 'no_price'
  return 'ready'
}

function StatusBadge({ style, excludedColors = {} }) {
  const s = statusOf(style, excludedColors)
  const map = {
    ready:      { label: 'Klar',               bg: C.greenBg, color: C.green },
    no_price:   { label: 'Mangler pris',       bg: C.amberBg, color: C.amber },
    over_limit: { label: 'For mange varianter', bg: C.redBg,   color: C.red   },
  }
  const { label, bg, color } = map[s]
  return <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background:bg, color, fontFamily:font.mono, whiteSpace:'nowrap' }}>{label}</span>
}

function Spinner() {
  return <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
}

function StepPip({ label, active }) {
  return <div style={{ padding:'4px 12px', borderRadius:20, fontSize:10, fontFamily:font.mono, letterSpacing:1, background:active?C.moss:'transparent', color:active?'#fff':'#666', border:active?'none':'1px solid #333' }}>{label}</div>
}

function Header({ activeStep, onLogout }) {
  return (
    <div style={{ background:C.ink, color:C.white, padding:'0 32px', height:54, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:26, height:26, borderRadius:6, background:C.moss, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ color:'#fff', fontFamily:font.display, fontSize:14 }}>S</span>
        </div>
        <span style={{ fontFamily:font.mono, fontSize:12, letterSpacing:2, color:'#aaa' }}>SPY → SHOPIFY</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <StepPip label="1 · SØG"      active={activeStep===1} />
        <div style={{ width:20, height:1, background:'#444' }} />
        <StepPip label="2 · GENNEMSE" active={activeStep===2} />
        <div style={{ width:20, height:1, background:'#444' }} />
        <StepPip label="3 · EKSPORT"  active={activeStep===3} />
      </div>
      {onLogout
        ? <button onClick={onLogout} style={{ background:'transparent', border:'1px solid #444', color:'#aaa', padding:'5px 14px', borderRadius:4, fontFamily:font.mono, fontSize:10, letterSpacing:1, cursor:'pointer' }}>LOG UD</button>
        : <div style={{ width:80 }} />
      }
    </div>
  )
}

// ── Farvevalg-panel ──────────────────────────────────────────────────────────
function ColorSelector({ style, excludedColors, onToggleColor }) {
  const id = style.styleNo || style.id
  const excl = excludedColors[id] || {}
  const colors = style.colors || []
  const activeCount = colors.filter(c => !excl[c]).length * (style.sizes?.length || 1)
  const isOver = activeCount > 100
  const excludedCount = Object.values(excl).filter(Boolean).length

  return (
    <div style={{ background:C.white, border:`1.5px solid ${isOver?C.red:C.moss}`, borderRadius:8, padding:'16px 18px', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <span style={{ fontFamily:font.display, fontSize:17, color:C.ink }}>{style.name}</span>
          <span style={{ fontFamily:font.mono, fontSize:10, color:C.stone, marginLeft:10 }}>{id}</span>
        </div>
        <div style={{ fontFamily:font.mono, fontSize:12, color:isOver?C.red:C.green, fontWeight:'bold' }}>
          {activeCount} / 100 varianter {isOver ? '⚠ for mange' : '✓ OK'}
        </div>
      </div>

      <div style={{ padding:'8px 12px', background:isOver?C.redBg:C.greenBg, borderRadius:5, fontFamily:font.mono, fontSize:11, color:isOver?C.red:C.green, marginBottom:12 }}>
        {isOver
          ? `Klik på farver der IKKE skal med i pre-order for at udelade dem — indtil tælleren viser 100 eller derunder.`
          : `✓ Antallet er OK. Du kan stadig fjerne farver du ikke ønsker i pre-order.`
        }
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {colors.map(color => {
          const isExcluded = !!excl[color]
          return (
            <button key={color} onClick={() => onToggleColor(id, color)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontFamily:font.mono, cursor:'pointer',
                background: isExcluded ? C.paper : C.mossLight,
                color: isExcluded ? C.stone : C.moss,
                border: `1.5px solid ${isExcluded ? C.dust : C.moss}`,
                textDecoration: isExcluded ? 'line-through' : 'none',
                opacity: isExcluded ? 0.55 : 1, transition:'all 0.15s' }}>
              {color}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop:10, fontFamily:font.mono, fontSize:10, color:C.stone }}>
        {colors.filter(c => !excl[c]).length} farver med · {excludedCount > 0 ? `${excludedCount} udeladt` : 'ingen udeladt'}
      </div>
    </div>
  )
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(username, password); onLogin(username) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.paper, padding:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus{outline:none;border-color:${C.moss}!important} button:hover{opacity:0.88}`}</style>
      <div style={{ marginBottom:40, textAlign:'center' }}>
        <div style={{ width:52, height:52, borderRadius:12, background:C.moss, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 4px 20px rgba(61,107,82,0.3)' }}>
          <span style={{ color:'#fff', fontSize:22, fontFamily:font.display, fontWeight:300 }}>S</span>
        </div>
        <h1 style={{ fontFamily:font.display, fontSize:34, fontWeight:300, color:C.ink, letterSpacing:1, marginBottom:6 }}>SPY → Shopify</h1>
        <p style={{ fontFamily:font.mono, fontSize:11, color:C.stone, letterSpacing:2 }}>PRE-ORDER IMPORTVÆRKTØJ</p>
      </div>
      <form onSubmit={handleSubmit} style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <label style={{ display:'block', fontFamily:font.mono, fontSize:10, letterSpacing:2, color:C.stone, marginBottom:7 }}>BRUGERNAVN</label>
          <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="din@email.dk" required
            style={{ width:'100%', padding:'12px 14px', border:`1.5px solid ${C.dust}`, borderRadius:6, fontFamily:font.sans, fontSize:14, background:C.white, color:C.ink }} />
        </div>
        <div>
          <label style={{ display:'block', fontFamily:font.mono, fontSize:10, letterSpacing:2, color:C.stone, marginBottom:7 }}>ADGANGSKODE</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
            style={{ width:'100%', padding:'12px 14px', border:`1.5px solid ${C.dust}`, borderRadius:6, fontFamily:font.sans, fontSize:14, background:C.white, color:C.ink }} />
        </div>
        {error && <div style={{ padding:'10px 14px', background:C.redBg, borderRadius:6, fontFamily:font.mono, fontSize:12, color:C.red }}>⚠ {error}</div>}
        <button type="submit" disabled={loading}
          style={{ marginTop:4, padding:'13px', background:loading?C.stone:C.moss, color:C.white, border:'none', borderRadius:6, fontFamily:font.mono, fontSize:12, letterSpacing:2, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          {loading ? <><Spinner /> FORBINDER…</> : 'LOG IND MED SPY →'}
        </button>
      </form>
      <p style={{ marginTop:40, fontFamily:font.mono, fontSize:10, color:C.dust, letterSpacing:1 }}>
        Dine credentials sendes aldrig direkte til SPY — al kommunikation sker via sikker serverside-funktion.
      </p>
    </div>
  )
}

// ── Search ───────────────────────────────────────────────────────────────────
function SearchScreen({ onNext, onLogout }) {
  const [season, setSeason]     = useState('AW26')
  const [search, setSearch]     = useState('')
  const [styles, setStyles]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [selected, setSelected] = useState({})
  const seasons = ['AW26','SS26','AW25','SS25']
  const selectedCount = Object.values(selected).filter(Boolean).length

  async function handleSearch() {
    setLoading(true); setError('')
    try { const data = await fetchStyles({ season, search: search||undefined }); setStyles(data) }
    catch (err) { if(err.message.includes('udløbet')) onLogout(); else setError(err.message) }
    finally { setLoading(false) }
  }

  const selectedStyles = (styles||[]).filter(s => selected[s.styleNo||s.id])

  return (
    <div style={{ minHeight:'100vh', background:C.paper }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} button:hover{opacity:0.88}`}</style>
      <Header activeStep={1} onLogout={onLogout} />
      <div style={{ maxWidth:860, margin:'0 auto', padding:'36px 24px' }}>
        <div style={{ marginBottom:28 }}>
          <p style={{ fontFamily:font.mono, fontSize:10, color:C.stone, letterSpacing:3, marginBottom:8 }}>TRIN 1</p>
          <h2 style={{ fontFamily:font.display, fontSize:30, fontWeight:300, color:C.ink, marginBottom:4 }}>Søg og vælg styles</h2>
          <p style={{ fontFamily:font.sans, fontSize:13, color:C.stone }}>Henter data direkte fra SPY — ingen eksportfiler nødvendige</p>
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <select value={season} onChange={e=>setSeason(e.target.value)}
            style={{ padding:'10px 14px', border:`1.5px solid ${C.dust}`, borderRadius:6, fontFamily:font.mono, fontSize:12, background:C.white, color:C.ink, outline:'none' }}>
            {seasons.map(s=><option key={s}>{s}</option>)}
          </select>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}
            placeholder="Søg på navn eller style-nr…"
            style={{ flex:1, padding:'10px 14px', border:`1.5px solid ${C.dust}`, borderRadius:6, fontFamily:font.sans, fontSize:14, background:C.white, color:C.ink, outline:'none' }} />
          <button onClick={handleSearch} disabled={loading}
            style={{ padding:'10px 22px', background:loading?C.stone:C.moss, color:C.white, border:'none', borderRadius:6, fontFamily:font.mono, fontSize:11, letterSpacing:2, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8 }}>
            {loading?<><Spinner/>HENTER…</>:'SØG'}
          </button>
        </div>
        {error && <div style={{ padding:'12px 16px', background:C.redBg, borderRadius:6, fontFamily:font.mono, fontSize:12, color:C.red, marginBottom:16 }}>⚠ {error}</div>}
        {styles===null && !loading && (
          <div style={{ textAlign:'center', padding:'60px 0', color:C.stone, fontFamily:font.mono, fontSize:12, letterSpacing:1 }}>Vælg sæson og søg for at hente styles fra SPY</div>
        )}
        {styles?.length===0 && (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <div style={{ fontFamily:font.mono, fontSize:12, color:C.stone, marginBottom:6 }}>Ingen styles fundet</div>
            <div style={{ fontFamily:font.sans, fontSize:13, color:C.stone }}>Prøv et andet søgeord eller vælg en anden sæson</div>
          </div>
        )}
        {styles && styles.length>0 && (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {styles.map(style => {
                const id = style.styleNo||style.id
                const isSelected = !!selected[id]
                const colors = style.colors||[]
                return (
                  <div key={id} onClick={()=>setSelected(p=>({...p,[id]:!p[id]}))}
                    style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px', background:isSelected?C.mossLight:C.white, border:`1.5px solid ${isSelected?C.moss:C.dust}`, borderRadius:7, cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ width:19, height:19, borderRadius:4, border:`2px solid ${isSelected?C.moss:'#ccc'}`, background:isSelected?C.moss:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isSelected && <span style={{ color:'#fff', fontSize:11 }}>✓</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                        <span style={{ fontFamily:font.display, fontSize:17, color:C.ink }}>{style.name}</span>
                        <span style={{ fontFamily:font.mono, fontSize:10, color:C.stone, letterSpacing:1 }}>{id}</span>
                        <StatusBadge style={style} />
                      </div>
                      <div style={{ fontFamily:font.mono, fontSize:11, color:C.stone, display:'flex', gap:12, flexWrap:'wrap' }}>
                        <span>{style.type||'Ukendt type'}</span>
                        <span>{colors.length} farver</span>
                        <span>{variantCount(style)} varianter</span>
                        {colors.slice(0,5).map(c=><span key={c} style={{ padding:'1px 7px', background:C.dust, borderRadius:10, fontSize:10 }}>{c}</span>)}
                        {colors.length>5 && <span style={{ color:'#bbb', fontSize:10 }}>+{colors.length-5}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', fontFamily:font.mono, fontSize:12, flexShrink:0 }}>
                      {style.prices?.dkk_rrp
                        ? <><div style={{ color:C.ink }}>{style.prices.dkk_rrp} DKK</div><div style={{ fontSize:10, color:C.stone }}>{style.prices.sek_rrp} SEK · €{style.prices.eur_rrp}</div></>
                        : <div style={{ color:C.amber, fontSize:11 }}>Pris mangler</div>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', background:C.white, borderRadius:7, border:`1px solid ${C.dust}` }}>
              <span style={{ fontFamily:font.mono, fontSize:12, color:C.stone }}>
                <span style={{ color:C.ink, fontSize:16, fontFamily:font.display }}>{selectedCount}</span> styles valgt
              </span>
              <button onClick={()=>onNext(selectedStyles, season)} disabled={selectedCount===0}
                style={{ padding:'11px 26px', background:selectedCount>0?C.moss:'#ccc', color:C.white, border:'none', borderRadius:6, fontFamily:font.mono, fontSize:11, letterSpacing:2, cursor:selectedCount>0?'pointer':'not-allowed' }}>
                GENNEMSE VALGTE →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Review ───────────────────────────────────────────────────────────────────
function ReviewScreen({ styles, season, onBack, onExport }) {
  const [excludedColors, setExcludedColors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function toggleColor(styleId, color) {
    setExcludedColors(prev => {
      const current = prev[styleId] || {}
      return { ...prev, [styleId]: { ...current, [color]: !current[color] } }
    })
  }

  const overLimit = styles.filter(s => statusOf(s, excludedColors) === 'over_limit')
  const noPrice   = styles.filter(s => statusOf(s, excludedColors) === 'no_price')
  const ready     = styles.filter(s => statusOf(s, excludedColors) === 'ready')

  async function handleExport() {
    setLoading(true); setError('')
    try {
      const exportStyles = styles
        .filter(s => statusOf(s, excludedColors) !== 'over_limit')
        .map(s => {
          const id = s.styleNo || s.id
          const excl = excludedColors[id] || {}
          return { ...s, colors: (s.colors||[]).filter(c => !excl[c]) }
        })
      const blob = await generateImport(exportStyles, season)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shopify_preorder_${season}_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      onExport()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.paper }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} button:hover{opacity:0.88}`}</style>
      <Header activeStep={2} />
      <div style={{ maxWidth:860, margin:'0 auto', padding:'36px 24px' }}>
        <div style={{ marginBottom:28 }}>
          <p style={{ fontFamily:font.mono, fontSize:10, color:C.stone, letterSpacing:3, marginBottom:8 }}>TRIN 2</p>
          <h2 style={{ fontFamily:font.display, fontSize:30, fontWeight:300, color:C.ink, marginBottom:4 }}>Gennemse og godkend</h2>
          <p style={{ fontFamily:font.sans, fontSize:13, color:C.stone }}>{styles.length} styles · sæson {season}</p>
        </div>

        {/* Farvevalg for styles med for mange varianter */}
        {overLimit.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ padding:'13px 16px', background:C.redBg, borderRadius:6, border:'1px solid #fca5a5', marginBottom:16, fontFamily:font.mono, fontSize:12, color:C.red }}>
              ⚠ <strong>{overLimit.map(s=>s.name).join(', ')}</strong> — har for mange farver til Shopify. Fjern farver der ikke skal med i pre-order nedenfor.
            </div>
            {overLimit.map(s => (
              <ColorSelector key={s.styleNo||s.id} style={s} excludedColors={excludedColors} onToggleColor={toggleColor} />
            ))}
          </div>
        )}

        {/* Vis også color selector for styles der netop er løst (så man kan justere yderligere) */}
        {styles.filter(s => statusOf(s, excludedColors) !== 'over_limit' && Object.keys(excludedColors[s.styleNo||s.id]||{}).length > 0).map(s => (
          <ColorSelector key={s.styleNo||s.id} style={s} excludedColors={excludedColors} onToggleColor={toggleColor} />
        ))}

        {noPrice.length > 0 && (
          <div style={{ padding:'13px 16px', background:C.amberBg, borderRadius:6, border:'1px solid #fcd34d', marginBottom:16, fontFamily:font.mono, fontSize:12, color:C.amber }}>
            ℹ <strong>{noPrice.map(s=>s.name).join(', ')}</strong> — mangler pris og oprettes som kladde i Shopify.
          </div>
        )}

        {/* Tabel */}
        <div style={{ background:C.white, borderRadius:7, border:`1px solid ${C.dust}`, overflow:'hidden', marginBottom:20 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:font.mono, fontSize:12 }}>
            <thead>
              <tr style={{ background:C.paper }}>
                {['Style','Type','Farver valgt','DKK RRP','SEK RRP','EUR RRP','Status'].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, letterSpacing:1, color:C.stone, fontWeight:'normal', borderBottom:`1px solid ${C.dust}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {styles.map((s,i) => {
                const id = s.styleNo||s.id
                const excl = excludedColors[id]||{}
                const activeColors = (s.colors||[]).filter(c=>!excl[c])
                const excludedCount = Object.values(excl).filter(Boolean).length
                return (
                  <tr key={id} style={{ borderBottom:`1px solid ${C.paper}`, background:i%2===0?C.white:'#fbfaf8' }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontFamily:font.display, fontSize:15, color:C.ink }}>{s.name}</div>
                      <div style={{ fontSize:10, color:C.stone }}>{id}</div>
                    </td>
                    <td style={{ padding:'11px 14px', color:C.stone }}>{s.type||'–'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      {activeColors.length}
                      {excludedCount>0 && <span style={{ marginLeft:6, fontSize:10, color:C.stone }}>({excludedCount} udeladt)</span>}
                    </td>
                    <td style={{ padding:'11px 14px' }}>{s.prices?.dkk_rrp||<span style={{ color:C.amber }}>–</span>}</td>
                    <td style={{ padding:'11px 14px' }}>{s.prices?.sek_rrp||<span style={{ color:C.amber }}>–</span>}</td>
                    <td style={{ padding:'11px 14px' }}>{s.prices?.eur_rrp?`€${s.prices.eur_rrp}`:<span style={{ color:C.amber }}>–</span>}</td>
                    <td style={{ padding:'11px 14px' }}><StatusBadge style={s} excludedColors={excludedColors} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Opsummering */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24 }}>
          {[
            { label:'Klar til import',     n:ready.length,     bg:C.greenBg, c:C.green },
            { label:'Oprettes som kladde', n:noPrice.length,   bg:C.amberBg, c:C.amber },
            { label:'Stadig for mange',    n:overLimit.length, bg:C.redBg,   c:C.red   },
          ].map(item=>(
            <div key={item.label} style={{ padding:'16px', background:item.bg, borderRadius:6, textAlign:'center' }}>
              <div style={{ fontFamily:font.display, fontSize:32, color:item.c }}>{item.n}</div>
              <div style={{ fontFamily:font.mono, fontSize:10, color:item.c, marginTop:4, letterSpacing:1 }}>{item.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {overLimit.length > 0 && (
          <div style={{ padding:'12px 16px', background:C.amberBg, borderRadius:6, fontFamily:font.mono, fontSize:12, color:C.amber, marginBottom:16 }}>
            ℹ Styles der stadig har for mange varianter udelades fra importfilen og skal oprettes manuelt i Shopify.
          </div>
        )}

        {error && <div style={{ padding:'12px 16px', background:C.redBg, borderRadius:6, fontFamily:font.mono, fontSize:12, color:C.red, marginBottom:16 }}>⚠ {error}</div>}

        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <button onClick={onBack}
            style={{ padding:'11px 20px', background:'transparent', color:C.stone, border:`1px solid ${C.dust}`, borderRadius:6, fontFamily:font.mono, fontSize:11, letterSpacing:1, cursor:'pointer' }}>
            ← TILBAGE
          </button>
          <button onClick={handleExport} disabled={loading}
            style={{ padding:'11px 26px', background:loading?C.stone:C.moss, color:C.white, border:'none', borderRadius:6, fontFamily:font.mono, fontSize:11, letterSpacing:2, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8 }}>
            {loading?<><Spinner/>GENERERER…</>:'GENERÉR IMPORTFIL →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────
function ExportScreen({ styles, season, onReset }) {
  const importable = styles.filter(s => statusOf(s) !== 'over_limit')
  const manual     = styles.filter(s => statusOf(s) === 'over_limit')
  return (
    <div style={{ minHeight:'100vh', background:C.paper, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`button:hover{opacity:0.88}`}</style>
      <div style={{ width:56, height:56, borderRadius:28, background:C.greenBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, marginBottom:24 }}>✓</div>
      <h2 style={{ fontFamily:font.display, fontSize:32, fontWeight:300, color:C.ink, marginBottom:6, textAlign:'center' }}>Importfil downloadet</h2>
      <p style={{ fontFamily:font.mono, fontSize:11, color:C.stone, letterSpacing:2, marginBottom:40 }}>SÆSON {season}</p>
      <div style={{ background:C.white, border:`1px solid ${C.dust}`, borderRadius:8, padding:'24px 28px', maxWidth:440, width:'100%', marginBottom:20 }}>
        <p style={{ fontFamily:font.mono, fontSize:10, color:C.stone, letterSpacing:2, marginBottom:14 }}>FILEN INDEHOLDER</p>
        {[
          `${importable.length} styles klar til Shopify-upload`,
          'Alle varianter med lager = 0',
          'Tag: preorder (aktiverer Timesact)',
          'Status: draft — publicér manuelt i Shopify',
          ...(manual.length>0?[`${manual.length} styles stadig med for mange farver — opret manuelt`]:[]),
        ].map(item=>(
          <div key={item} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`1px solid ${C.paper}`, fontFamily:font.mono, fontSize:12, color:C.stone }}>
            <span style={{ color:C.moss, flexShrink:0 }}>✓</span> {item}
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 20px', background:C.mossLight, borderRadius:6, maxWidth:440, width:'100%', marginBottom:28, fontFamily:font.mono, fontSize:12, color:C.moss }}>
        <strong>Næste skridt:</strong> Gå til Shopify Admin → Produkter → Importér → Upload CSV-filen
      </div>
      <button onClick={onReset}
        style={{ padding:'12px 24px', background:C.moss, color:C.white, border:'none', borderRadius:6, fontFamily:font.mono, fontSize:11, letterSpacing:2, cursor:'pointer' }}>
        NY IMPORT
      </button>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]               = useState('login')
  const [selectedStyles, setSelectedStyles] = useState([])
  const [season, setSeason]               = useState('AW26')
  return (
    <>
      {screen==='login'  && <LoginScreen  onLogin={()=>setScreen('search')} />}
      {screen==='search' && <SearchScreen onNext={(s,sea)=>{setSelectedStyles(s);setSeason(sea);setScreen('review')}} onLogout={()=>setScreen('login')} />}
      {screen==='review' && <ReviewScreen styles={selectedStyles} season={season} onBack={()=>setScreen('search')} onExport={()=>setScreen('export')} />}
      {screen==='export' && <ExportScreen styles={selectedStyles} season={season} onReset={()=>setScreen('search')} />}
    </>
  )
}
