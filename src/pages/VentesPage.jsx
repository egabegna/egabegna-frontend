import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthContext } from '../store/AuthContext'
import { useDebounce }    from '../hooks/useDebounce'
import venteService       from '../services/venteService'
import produitService     from '../services/produitService'
import {
  Search, X, Minus, Plus, Banknote, Smartphone,
  ClipboardList, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronDown, Calendar,
  ShoppingCart,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const TOPBAR_H = 68

const MODES = [
  { value: 'cash',         label: 'Cash',        Icon: Banknote     },
  { value: 'mobile_money', label: 'Mobile Money', Icon: Smartphone   },
  { value: 'credit',       label: 'Crédit',       Icon: ClipboardList },
]

// ── useIsMobile ───────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ── AutocompleteProduit ───────────────────────
function AutocompleteProduit({ onSelect, boutiqueProduits }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const debouncedQ        = useDebounce(query, 200)
  const ref               = useRef(null)

  const resultats = boutiqueProduits.filter(p =>
    p.actif && p.nom.toLowerCase().includes(debouncedQ.toLowerCase())
  ).slice(0, 8)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const choisir = (produit) => { onSelect(produit); setQuery(''); setOpen(false) }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={vs.searchWrap}>
        <Search size={15} color={MUTED} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <input value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un produit..."
          style={vs.searchInput} autoComplete="off" />
      </div>
      {open && debouncedQ && (
        <div style={vs.dropdown}>
          {resultats.length === 0 ? (
            <div style={{ padding: '12px 16px', color: MUTED, fontSize: 13 }}>Aucun produit trouvé.</div>
          ) : resultats.map(p => (
            <div key={p.id} onClick={() => choisir(p)} style={vs.dropdownItem}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = BG}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = WHITE}>
              <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{p.nom}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, display: 'flex', gap: 8 }}>
                <span>{Number(p.prix_vente).toLocaleString()} FCFA</span>
                <span>·</span>
                <span style={{ color: p.stock === 0 ? '#c0392b' : MUTED }}>
                  {p.stock === 0 ? 'Rupture' : `Stock : ${p.stock}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── LigneVenteRow ─────────────────────────────
function LigneVenteRow({ ligne, onQteChange, onRemove, compact }) {
  const stockOk = ligne.produit.stock >= ligne.quantite
  return (
    <div style={{ ...vs.ligneRow, flexWrap: compact ? 'wrap' : 'nowrap', gap: compact ? 8 : 12 }}>
      <div style={{ flex: 1, minWidth: 0, width: compact ? '100%' : 'auto' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: NAVY, marginBottom: 2 }}>{ligne.produit.nom}</div>
        <div style={{ fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{Number(ligne.produit.prix_vente).toLocaleString()} FCFA / unité</span>
          {!stockOk && (
            <span style={{ color: '#c0392b', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle size={11} strokeWidth={2} />
              Stock insuffisant ({ligne.produit.stock})
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 'auto' : 12, width: compact ? '100%' : 'auto', justifyContent: compact ? 'space-between' : 'flex-end' }}>
        <div style={vs.qteControl}>
          <button onClick={() => onQteChange(ligne.produit.id, ligne.quantite - 1)} style={vs.qteBtn} disabled={ligne.quantite <= 1}>
            <Minus size={13} strokeWidth={2} />
          </button>
          <span style={vs.qteVal}>{ligne.quantite}</span>
          <button onClick={() => onQteChange(ligne.produit.id, ligne.quantite + 1)} style={vs.qteBtn}>
            <Plus size={13} strokeWidth={2} />
          </button>
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: NAVY, minWidth: 80, textAlign: 'right' }}>
          {(ligne.produit.prix_vente * ligne.quantite).toLocaleString()} F
        </div>
        <button onClick={() => onRemove(ligne.produit.id)} style={vs.removeBtn}>
          <X size={14} strokeWidth={2} color="#c0392b" />
        </button>
      </div>
    </div>
  )
}

// ── NouvelleVenteForm ─────────────────────────
function NouvelleVenteForm({ produits, onSuccess, compact }) {
  const [lignes, setLignes]         = useState([])
  const [mode, setMode]             = useState('cash')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const total        = lignes.reduce((acc, l) => acc + Number(l.produit.prix_vente) * l.quantite, 0)
  const stockInvalide = lignes.some(l => l.produit.stock < l.quantite)

  const ajouterProduit = (produit) => {
    setError('')
    setLignes(prev => {
      const existe = prev.find(l => l.produit.id === produit.id)
      if (existe) return prev.map(l => l.produit.id === produit.id ? { ...l, quantite: l.quantite + 1 } : l)
      return [...prev, { produit, quantite: 1 }]
    })
  }

  const changerQte   = (id, qte) => { if (qte < 1) return; setLignes(prev => prev.map(l => l.produit.id === id ? { ...l, quantite: qte } : l)) }
  const retirerLigne = (id)      => setLignes(prev => prev.filter(l => l.produit.id !== id))

  const handleSubmit = async () => {
    if (lignes.length === 0) { setError('Ajoutez au moins un produit.'); return }
    if (stockInvalide)        { setError('Stock insuffisant sur un ou plusieurs produits.'); return }
    setSubmitting(true); setError('')
    try {
      await venteService.creer({ mode_paiement: mode, lignes: lignes.map(l => ({ produit_id: l.produit.id, quantite: l.quantite })) })
      setLignes([]); setMode('cash')
      onSuccess()
    } catch (err) {
      const d = err.response?.data?.detail
      setError(Array.isArray(d) ? d.join('\n') : d || 'Erreur lors de la vente.')
    } finally { setSubmitting(false) }
  }

  const disabled = submitting || lignes.length === 0 || stockInvalide

  return (
    <div style={vs.formCard}>
      <div style={vs.formHeader}>
        <span style={vs.formEyebrow}>Nouvelle vente</span>
        {lignes.length > 0 && <span style={vs.formBadge}>{lignes.length} art.</span>}
      </div>
      <div style={vs.formDivider} />

      <div style={{ marginBottom: 14 }}>
        <AutocompleteProduit onSelect={ajouterProduit} boutiqueProduits={produits} />
      </div>

      <div style={vs.lignesWrap}>
        {lignes.length === 0 ? (
          <div style={vs.vide}>Aucun produit ajouté.</div>
        ) : lignes.map(l => (
          <LigneVenteRow key={l.produit.id} ligne={l} onQteChange={changerQte} onRemove={retirerLigne} compact={compact} />
        ))}
      </div>

      {/* Mode paiement */}
      <div style={{ marginTop: 14 }}>
        <div style={vs.modeLabel}>Mode de paiement</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {MODES.map(({ value, label, Icon }) => {
            const actif = mode === value
            return (
              <button key={value} onClick={() => setMode(value)} style={{
                ...vs.modeBtn,
                background: actif ? NAVY : WHITE,
                color:      actif ? WHITE : '#6B7A99',
                border:     actif ? `1.5px solid ${NAVY}` : `1.5px solid ${BORDER}`,
                fontSize:   compact ? 11 : 12,
                padding:    compact ? '8px 6px' : '9px 8px',
              }}>
                <Icon size={13} strokeWidth={1.8} color={actif ? GOLD : MUTED} />
                <span style={{ display: compact ? 'none' : 'inline' }}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Total */}
      <div style={{ ...vs.totalRow, flexDirection: compact ? 'column' : 'row', gap: compact ? 12 : 0 }}>
        <div>
          <div style={vs.totalEyebrow}>Total</div>
          <div style={vs.totalVal}>{total.toLocaleString()} FCFA</div>
        </div>
        <button onClick={handleSubmit} disabled={disabled}
          style={{ ...vs.btnValider, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', width: compact ? '100%' : 'auto', justifyContent: 'center' }}>
          <CheckCircle size={16} strokeWidth={2} />
          <span>{submitting ? 'Enregistrement...' : 'Valider la vente'}</span>
        </button>
      </div>

      {error && <div style={vs.alertError}>{error}</div>}
    </div>
  )
}

// ── InfoItem ──────────────────────────────────
function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{value}</div>
    </div>
  )
}

// ── VenteDrawer ───────────────────────────────
function VenteDrawer({ vente, role, onClose, onAnnuler }) {
  const [annulant, setAnnulant] = useState(false)
  const [confirm, setConfirm]   = useState(false)
  const [error, setError]       = useState('')
  const isMobile                = useIsMobile()

  const handleAnnuler = async () => {
    setAnnulant(true); setError('')
    try {
      await venteService.annuler(vente.id)
      onAnnuler(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur.')
    } finally { setAnnulant(false); setConfirm(false) }
  }

  const validee = vente.statut === 'validee'

  return (
    <div style={dr.overlay} onClick={onClose}>
      <div style={{ ...dr.drawer, maxWidth: isMobile ? '100%' : 440, borderRadius: isMobile ? '16px 16px 0 0' : 0 }}
        onClick={e => e.stopPropagation()}>
        <div style={dr.header}>
          <div>
            <div style={dr.drawerEyebrow}>Détail de vente</div>
            <h2 style={dr.drawerTitle}>Vente #{vente.id}</h2>
            <div style={dr.drawerDate}>{new Date(vente.date).toLocaleString('fr-FR')}</div>
          </div>
          <button onClick={onClose} style={dr.closeBtn}><X size={18} color={MUTED} strokeWidth={2} /></button>
        </div>
        <div style={dr.body}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 4 }}>
            <InfoItem label="Employé"  value={vente.employe_nom} />
            <InfoItem label="Paiement" value={vente.mode_paiement} />
            <InfoItem label="Statut"   value={
              <span style={{ ...dr.statutBadge, background: validee ? '#EBF5EF' : '#FEF1F1', color: validee ? GREEN : '#c0392b' }}>
                {validee ? 'Validée' : 'Annulée'}
              </span>
            } />
          </div>
          <div style={{ height: 1, background: BORDER, margin: '14px 0' }} />
          <div style={dr.sectionTitle}>Articles ({vente.nb_articles})</div>
          {vente.lignes.map(l => (
            <div key={l.id} style={dr.ligne}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{l.produit_nom}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{Number(l.prix_unitaire).toLocaleString()} × {l.quantite}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{Number(l.sous_total).toLocaleString()} FCFA</div>
            </div>
          ))}
          <div style={dr.totalRow}>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>Total</span>
            <span style={dr.totalVal}>{Number(vente.total).toLocaleString()} FCFA</span>
          </div>
          {vente.note && <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>Note : {vente.note}</p>}
          {['proprietaire', 'manager'].includes(role) && validee && (
            <div style={{ marginTop: 20 }}>
              {error && <div style={dr.alertError}>{error}</div>}
              {!confirm ? (
                <button onClick={() => setConfirm(true)} style={dr.btnAnnuler}>Annuler cette vente</button>
              ) : (
                <div style={dr.confirmBox}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: NAVY }}>Confirmer l'annulation ? Le stock sera re-crédité.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleAnnuler} disabled={annulant} style={dr.btnConfirm}>{annulant ? '...' : 'Confirmer'}</button>
                    <button onClick={() => setConfirm(false)} style={dr.btnCancel}>Retour</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CustomSelect ──────────────────────────────
function CustomSelect({ name, value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const selected = options.find(o => o.value === value) || options[0]
  const handleSelect = (val) => { onChange({ target: { name, value: val } }); setOpen(false) }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ ...cs.trigger, borderColor: open ? NAVY : BORDER }}>
        <span style={{ flex: 1, textAlign: 'left', color: value ? NAVY : MUTED }}>{selected?.label}</span>
        <ChevronDown size={13} color={MUTED} strokeWidth={2}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={cs.dropdown}>
          {options.map(o => (
            <div key={o.value} onClick={() => handleSelect(o.value)}
              style={{ ...cs.option, background: value === o.value ? '#EEF1F8' : WHITE, color: value === o.value ? NAVY : '#6B7A99', fontWeight: value === o.value ? 700 : 400 }}
              onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = BG }}
              onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = WHITE }}>
              {value === o.value && <div style={cs.activeDot} />}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
const cs = {
  trigger:  { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, background: WHITE, cursor: 'pointer', fontSize: 12, fontWeight: 500, minWidth: 120, transition: 'border-color 0.15s' },
  dropdown: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 30, overflow: 'hidden' },
  option:   { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 12, cursor: 'pointer', transition: 'background 0.1s' },
  activeDot:{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 },
}

// ── CustomDatePicker ──────────────────────────
const JOURS   = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function CustomDatePicker({ name, value, onChange, placeholder = 'Date' }) {
  const [open, setOpen]       = useState(false)
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date())
  const ref                   = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const selected   = value ? new Date(value) : null
  const handleSelect = (date) => { onChange({ target: { name, value: date.toISOString().split('T')[0] } }); setOpen(false) }
  const handleClear  = (e)    => { e.stopPropagation(); onChange({ target: { name, value: '' } }) }
  const prevMonth  = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth  = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const firstDay   = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const lastDay    = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)
  const today      = new Date()
  const isToday    = d => d === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear()
  const isSelected = d => selected && d === selected.getDate() && viewDate.getMonth() === selected.getMonth() && viewDate.getFullYear() === selected.getFullYear()
  const displayValue = selected ? selected.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ ...dp.trigger, borderColor: open ? NAVY : BORDER }}>
        <Calendar size={13} color={value ? NAVY : MUTED} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', color: value ? NAVY : MUTED, fontSize: 12, fontWeight: value ? 600 : 400 }}>
          {displayValue || placeholder}
        </span>
        {value && <button onClick={handleClear} style={dp.clearBtn} type="button"><X size={11} color={MUTED} strokeWidth={2.5} /></button>}
      </button>
      {open && (
        <div style={dp.calendar}>
          <div style={dp.calHeader}>
            <button onClick={prevMonth} style={dp.navBtn} type="button"><ChevronLeft size={14} color={NAVY} strokeWidth={2} /></button>
            <span style={dp.monthLabel}>{MOIS_FR[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={nextMonth} style={dp.navBtn} type="button"><ChevronRight size={14} color={NAVY} strokeWidth={2} /></button>
          </div>
          <div style={dp.weekRow}>{JOURS.map(j => <div key={j} style={dp.weekDay}>{j}</div>)}</div>
          <div style={dp.grid}>
            {cells.map((d, i) => (
              <div key={i}
                onClick={() => d && handleSelect(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
                style={{ ...dp.cell, background: d && isSelected(d) ? NAVY : d && isToday(d) ? '#EEF1F8' : 'transparent', color: d && isSelected(d) ? WHITE : d && isToday(d) ? NAVY : d ? '#374151' : 'transparent', fontWeight: d && (isSelected(d) || isToday(d)) ? 700 : 400, cursor: d ? 'pointer' : 'default', borderRadius: 8 }}
                onMouseEnter={e => { if (d && !isSelected(d)) e.currentTarget.style.background = BG }}
                onMouseLeave={e => { if (d && !isSelected(d)) e.currentTarget.style.background = isToday(d) ? '#EEF1F8' : 'transparent' }}>
                {d || ''}
              </div>
            ))}
          </div>
          <div style={dp.footer}>
            <button onClick={() => handleSelect(today)} style={dp.todayBtn} type="button">Aujourd'hui</button>
          </div>
        </div>
      )}
    </div>
  )
}
const dp = {
  trigger:    { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, background: WHITE, cursor: 'pointer', minWidth: 120, transition: 'border-color 0.15s' },
  clearBtn:   { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 },
  calendar:   { position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.10)', zIndex: 30, padding: 14, width: 256 },
  calHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthLabel: { fontSize: 13, fontWeight: 700, color: NAVY },
  navBtn:     { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
  weekRow:    { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 },
  weekDay:    { textAlign: 'center', fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.5px', padding: '4px 0', textTransform: 'uppercase' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  cell:       { textAlign: 'center', fontSize: 12, padding: '6px 2px', transition: 'background 0.1s', userSelect: 'none' },
  footer:     { marginTop: 10, paddingTop: 8, borderTop: `1px solid ${BORDER}`, textAlign: 'center' },
  todayBtn:   { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: GOLD, fontWeight: 700, padding: '4px 10px', borderRadius: 6 },
}

// ── HistoriqueVentes ──────────────────────────
function HistoriqueVentes({ role, refreshKey }) {
  const [ventes, setVentes]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [filtres, setFiltres]         = useState({ statut: '', mode_paiement: '', date_debut: '', date_fin: '' })
  const [totalJour, setTotalJour]     = useState(0)
  const [page, setPage]               = useState(1)
  const [hasNext, setHasNext]         = useState(false)
  const [searchEmploye, setSearchEmploye] = useState('')
  const [showFiltres, setShowFiltres] = useState(false)
  const isMobile                      = useIsMobile()

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, ...filtres }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const res = await venteService.liste(params)
      setVentes(res.data.results || res.data)
      setHasNext(!!res.data.next)
      const auj = new Date().toISOString().split('T')[0]
      const resJ = await venteService.liste({ date_debut: auj, date_fin: auj, statut: 'validee', page_size: 100 })
      const vj = resJ.data.results || resJ.data
      setTotalJour(vj.reduce((acc, v) => acc + Number(v.total), 0))
    } catch {}
    finally { setLoading(false) }
  }, [page, filtres])

  useEffect(() => { charger() }, [charger, refreshKey])

  const handleFiltreChange = (e) => { setFiltres(prev => ({ ...prev, [e.target.name]: e.target.value })); setPage(1) }

  const ventesFiltrees = ventes.filter(v =>
    !searchEmploye || v.employe_nom?.toLowerCase().includes(searchEmploye.toLowerCase())
  )

  return (
    <div style={{ ...hs.wrapper, borderRadius: isMobile ? 14 : 16 }}>
      {/* Header */}
      <div style={hs.headerRow}>
        <span style={hs.title}>Historique</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMobile && (
            <button onClick={() => setShowFiltres(v => !v)}
              style={{ ...hs.filterToggle, background: showFiltres ? NAVY : BG, color: showFiltres ? WHITE : NAVY }}>
              Filtres {showFiltres ? '▲' : '▼'}
            </button>
          )}
          <div style={hs.totalJour}>
            CA · <strong>{totalJour.toLocaleString()} F</strong>
          </div>
        </div>
      </div>

      {/* Filtres : toujours visibles desktop, toggle mobile */}
      {(!isMobile || showFiltres) && (
        <div style={{ ...hs.filtres, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CustomSelect name="statut" value={filtres.statut} onChange={handleFiltreChange}
              options={[{ value: '', label: 'Tous statuts' }, { value: 'validee', label: 'Validée' }, { value: 'annulee', label: 'Annulée' }]} />
            <CustomSelect name="mode_paiement" value={filtres.mode_paiement} onChange={handleFiltreChange}
              options={[{ value: '', label: 'Tous modes' }, { value: 'cash', label: 'Cash' }, { value: 'mobile_money', label: 'Mobile Money' }, { value: 'credit', label: 'Crédit' }]} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CustomDatePicker name="date_debut" value={filtres.date_debut} onChange={handleFiltreChange} placeholder="Début" />
            <CustomDatePicker name="date_fin"   value={filtres.date_fin}   onChange={handleFiltreChange} placeholder="Fin"   />
          </div>
        </div>
      )}

      {/* Recherche employé */}
      <div style={hs.searchBar}>
        <div style={hs.searchWrap}>
          <Search size={14} color={MUTED} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <input value={searchEmploye} onChange={e => setSearchEmploye(e.target.value)}
            placeholder="Rechercher par employé..." style={hs.searchInput} />
          {searchEmploye && (
            <button onClick={() => setSearchEmploye('')} style={hs.clearBtn}>
              <X size={13} color={MUTED} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div style={hs.liste}>
        {loading ? (
          <p style={hs.empty}>Chargement...</p>
        ) : ventesFiltrees.length === 0 ? (
          <p style={hs.empty}>{searchEmploye ? 'Aucun résultat.' : 'Aucune vente.'}</p>
        ) : ventesFiltrees.map(v => (
          <div key={v.id} onClick={() => setSelected(v)} style={hs.row}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = BG}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = WHITE}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                Vente {v.numero_boutique || v.id}
                {v.statut === 'annulee' && <span style={hs.annuleeBadge}>Annulée</span>}
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>
                {v.employe_nom} · {new Date(v.date).toLocaleDateString('fr-FR')}
                {!isMobile && ` · ${v.nb_articles} art. · ${v.mode_paiement}`}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: v.statut === 'annulee' ? MUTED : NAVY, flexShrink: 0 }}>
              {Number(v.total).toLocaleString()} F
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={hs.pagination}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...hs.pageBtn, opacity: page <= 1 ? 0.4 : 1 }}>
          <ChevronLeft size={15} strokeWidth={2} /><span>Précédent</span>
        </button>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>Page {page}</span>
        <button disabled={!hasNext} onClick={() => setPage(p => p + 1)} style={{ ...hs.pageBtn, opacity: !hasNext ? 0.4 : 1 }}>
          <span>Suivant</span><ChevronRight size={15} strokeWidth={2} />
        </button>
      </div>

      {selected && (
        <VenteDrawer vente={selected} role={role}
          onClose={() => setSelected(null)}
          onAnnuler={() => { setSelected(null); charger() }} />
      )}
    </div>
  )
}

// ── VentesPage ────────────────────────────────
function VentesPage() {
  const { role }                    = useAuthContext()
  const [produits, setProduits]     = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')
  const [mobileView, setMobileView] = useState('vente') // 'vente' | 'historique'
  const isMobile                    = useIsMobile()

  useEffect(() => {
    produitService.getProduits({ actif: 'true' }).then(r => setProduits(r.data)).catch(() => {})
  }, [])

  const apresVente = () => {
    setSuccessMsg('Vente enregistrée avec succès.')
    setRefreshKey(k => k + 1)
    setTimeout(() => setSuccessMsg(''), 3000)
    produitService.getProduits({ actif: 'true' }).then(r => setProduits(r.data)).catch(() => {})
    if (isMobile) setMobileView('historique')
  }

  return (
    <div style={{
      padding:       isMobile ? '12px 12px' : '24px 28px',
      maxWidth:      1200,
      margin:        '0 auto',
      height:        isMobile ? 'auto' : `calc(100vh - ${TOPBAR_H}px)`,
      display:       'flex',
      flexDirection: 'column',
      boxSizing:     'border-box',
    }}>

      {successMsg && <div style={vs.alertSuccess}>{successMsg}</div>}

      {/* Mobile : toggle tabs */}
      {isMobile && (
        <div style={mob.tabs}>
          <button onClick={() => setMobileView('vente')}
            style={{ ...mob.tab, background: mobileView === 'vente' ? NAVY : WHITE, color: mobileView === 'vente' ? WHITE : MUTED }}>
            <ShoppingCart size={14} strokeWidth={2} />
            <span>Nouvelle vente</span>
          </button>
          <button onClick={() => setMobileView('historique')}
            style={{ ...mob.tab, background: mobileView === 'historique' ? NAVY : WHITE, color: mobileView === 'historique' ? WHITE : MUTED }}>
            <ClipboardList size={14} strokeWidth={2} />
            <span>Historique</span>
          </button>
        </div>
      )}

      {/* Desktop : layout 2 colonnes */}
      {!isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, flex: 1, minHeight: 0 }}>
          <div style={{ position: 'sticky', top: 0, height: 'fit-content', alignSelf: 'start' }}>
            <NouvelleVenteForm produits={produits} onSuccess={apresVente} compact={false} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <HistoriqueVentes role={role} refreshKey={refreshKey} />
          </div>
        </div>
      ) : (
        /* Mobile : une vue à la fois */
        <div style={{ flex: 1 }}>
          {mobileView === 'vente' && (
            <NouvelleVenteForm produits={produits} onSuccess={apresVente} compact={true} />
          )}
          {mobileView === 'historique' && (
            <HistoriqueVentes role={role} refreshKey={refreshKey} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────
const mob = {
  tabs: { display: 'flex', gap: 8, marginBottom: 14, background: BG, padding: 4, borderRadius: 12 },
  tab:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' },
}

const vs = {
  formCard:    { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 },
  formHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  formEyebrow: { fontSize: 11, fontWeight: 700, color: NAVY, letterSpacing: '2px', textTransform: 'uppercase' },
  formBadge:   { background: NAVY, color: WHITE, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.5px' },
  formDivider: { height: 1, background: BORDER, marginBottom: 14 },
  searchWrap:  { display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '9px 14px', background: BG },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent' },
  dropdown:    { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 260, overflowY: 'auto' },
  dropdownItem:{ padding: '10px 14px', cursor: 'pointer', background: WHITE, borderBottom: `1px solid ${BORDER}`, transition: 'background 0.1s' },
  lignesWrap:  { minHeight: 48 },
  ligneRow:    { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${BG}` },
  qteControl:  { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  qteBtn:      { width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: BG, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY },
  qteVal:      { fontSize: 14, fontWeight: 700, minWidth: 22, textAlign: 'center', color: NAVY },
  removeBtn:   { background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' },
  vide:        { textAlign: 'center', color: MUTED, padding: '20px 0', fontSize: 13 },
  modeLabel:   { fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 },
  modeBtn:     { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  totalRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` },
  totalEyebrow:{ fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 },
  totalVal:    { fontSize: 22, fontWeight: 800, color: NAVY, letterSpacing: '-0.5px' },
  btnValider:  { display: 'flex', alignItems: 'center', gap: 8, background: GREEN, color: WHITE, border: 'none', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, transition: 'opacity 0.2s' },
  alertSuccess:{ background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 9, padding: '10px 16px', marginBottom: 14, fontSize: 13, fontWeight: 500 },
  alertError:  { background: '#FEF1F1', border: '1px solid #FBBCBC', color: '#c0392b', borderRadius: 9, padding: '10px 14px', marginTop: 12, fontSize: 13 },
}

const hs = {
  wrapper:       { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  headerRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 },
  title:         { fontSize: 11, fontWeight: 700, color: NAVY, letterSpacing: '2px', textTransform: 'uppercase' },
  totalJour:     { fontSize: 11, color: GREEN, background: '#EBF5EF', padding: '4px 10px', borderRadius: 20, fontWeight: 500 },
  filterToggle:  { display: 'flex', alignItems: 'center', gap: 5, border: 'none', padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 },
  filtres:       { display: 'flex', gap: 8, padding: '10px 14px', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 },
  searchBar:     { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, background: WHITE },
  searchWrap:    { display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px', background: BG },
  searchInput:   { flex: 1, border: 'none', outline: 'none', fontSize: 12, color: NAVY, background: 'transparent' },
  clearBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 },
  liste:         { flex: 1, overflowY: 'auto', minHeight: 0 },
  row:           { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${BG}`, cursor: 'pointer', transition: 'background 0.1s', background: WHITE },
  annuleeBadge:  { background: '#FEF1F1', color: '#c0392b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8 },
  pagination:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 },
  pageBtn:       { display: 'flex', alignItems: 'center', gap: 4, background: BG, border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: NAVY, fontWeight: 500 },
  empty:         { color: MUTED, textAlign: 'center', padding: 24, fontSize: 13 },
}

const dr = {
  overlay:       { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 40, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' },
  drawer:        { background: WHITE, width: '100%', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)', overflowY: 'auto' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 18px 16px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: WHITE, zIndex: 1 },
  drawerEyebrow: { fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 },
  drawerTitle:   { margin: 0, fontSize: 18, fontWeight: 800, color: NAVY, letterSpacing: '-0.3px' },
  drawerDate:    { fontSize: 12, color: MUTED, marginTop: 3 },
  closeBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' },
  body:          { padding: 18, flex: 1 },
  sectionTitle:  { fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 },
  ligne:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BG}` },
  totalRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: `2px solid ${NAVY}` },
  totalVal:      { fontSize: 18, fontWeight: 800, color: NAVY },
  statutBadge:   { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' },
  btnAnnuler:    { width: '100%', background: '#FEF1F1', color: '#c0392b', border: '1px solid #FBBCBC', padding: '10px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  confirmBox:    { background: '#FEF1F1', border: '1px solid #FBBCBC', borderRadius: 9, padding: 16 },
  btnConfirm:    { background: '#c0392b', color: WHITE, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  btnCancel:     { background: BG, color: NAVY, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  alertError:    { background: '#FEF1F1', border: '1px solid #FBBCBC', color: '#c0392b', borderRadius: 9, padding: '10px 14px', marginBottom: 12, fontSize: 13 },
}

export default VentesPage