import { useState, useEffect, useCallback, useRef } from 'react'
import signalementService from '../services/signalementService'
import {
  Info, AlertTriangle, AlertOctagon, CheckCheck,
  Bell, BellOff, ShieldAlert, ChevronDown,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

const NIVEAU_CONFIG = {
  info:          { bg: '#EEF1F8', color: NAVY, border: NAVY, Icon: Info,          label: 'Info'          },
  avertissement: { bg: '#FBF5E9', color: GOLD, border: GOLD, Icon: AlertTriangle, label: 'Avertissement' },
  critique:      { bg: '#FEF1F1', color: RED,  border: RED,  Icon: AlertOctagon,  label: 'Critique'      },
}

const TYPE_LABELS = {
  stock_anormal:        'Stock anormal',
  difference_caisse:    'Différence caisse',
  comportement_suspect: 'Comportement suspect',
  erreur_saisie:        'Erreur saisie',
}

// ─── Select custom ────────────────────────────
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value) || options[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ ...cs.trigger, borderColor: open ? NAVY : BORDER }}
      >
        <span style={{ flex: 1, textAlign: 'left', color: value ? NAVY : MUTED, fontSize: 12, fontWeight: value ? 600 : 400 }}>
          {selected?.label}
        </span>
        <ChevronDown
          size={13} color={MUTED} strokeWidth={2}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </button>
      {open && (
        <div style={cs.dropdown}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              style={{
                ...cs.option,
                background: value === o.value ? '#EEF1F8' : WHITE,
                color:      value === o.value ? NAVY : '#6B7A99',
                fontWeight: value === o.value ? 700 : 400,
              }}
              onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = BG }}
              onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = WHITE }}
            >
              {value === o.value && <div style={cs.dot} />}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const cs = {
  trigger: {
    display:      'flex',
    alignItems:   'center',
    gap:          8,
    padding:      '8px 12px',
    borderRadius: 9,
    border:       `1.5px solid ${BORDER}`,
    background:   WHITE,
    cursor:       'pointer',
    minWidth:     150,
    transition:   'border-color 0.15s',
  },
  dropdown: {
    position:     'absolute',
    top:          'calc(100% + 4px)',
    left:         0,
    minWidth:     '100%',
    background:   WHITE,
    border:       `1.5px solid ${BORDER}`,
    borderRadius: 10,
    boxShadow:    '0 8px 24px rgba(0,0,0,0.08)',
    zIndex:       20,
    overflow:     'hidden',
  },
  option: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
    padding:    '9px 14px',
    fontSize:   12,
    cursor:     'pointer',
    transition: 'background 0.1s',
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: '50%',
    background:   GOLD,
    flexShrink:   0,
  },
}

// ─── Badges ───────────────────────────────────
function NiveauBadge({ niveau }) {
  const c = NIVEAU_CONFIG[niveau] || NIVEAU_CONFIG.info
  const { Icon } = c
  return (
    <span style={{ ...s.badge, background: c.bg, color: c.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon size={10} strokeWidth={2.5} />
      {c.label}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span style={{ ...s.badge, background: BG, color: MUTED }}>
      {TYPE_LABELS[type] || type.replace(/_/g, ' ')}
    </span>
  )
}

function NouveauBadge() {
  return (
    <span style={{ ...s.badge, background: '#EEF1F8', color: NAVY, fontWeight: 800, fontSize: 10, letterSpacing: '1px' }}>
      NOUVEAU
    </span>
  )
}

// ─── Page principale ──────────────────────────
function SignalementsPage({ onCountUpdate }) {
  const [signalements, setSignalements] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filtre, setFiltre]             = useState({ lu: '', niveau: '', type: '' })
  const [msg, setMsg]                   = useState('')

  const charger = useCallback(async () => {
    try {
      const params = {}
      if (filtre.lu     !== '') params.lu     = filtre.lu
      if (filtre.niveau !== '') params.niveau  = filtre.niveau
      if (filtre.type   !== '') params.type    = filtre.type
      const res = await signalementService.liste(params)
      setSignalements(res.data.results || res.data)
    } catch { }
    finally { setLoading(false) }
  }, [filtre])

  useEffect(() => { charger() }, [charger])

  const handleLire = async (id) => {
    await signalementService.lire(id)
    setSignalements(prev => prev.map(s => s.id === id ? { ...s, lu: true } : s))
    onCountUpdate?.()
  }

  const handleLireTout = async () => {
    await signalementService.lireTout()
    setSignalements(prev => prev.map(s => ({ ...s, lu: true })))
    setMsg('Tous les signalements marqués comme lus.')
    onCountUpdate?.()
    setTimeout(() => setMsg(''), 3000)
  }

  const nonLus    = signalements.filter(s => !s.lu).length
  const critiques = signalements.filter(s => s.niveau === 'critique'      && !s.lu).length
  const avertis   = signalements.filter(s => s.niveau === 'avertissement' && !s.lu).length

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Monitoring</p>
          <h1 style={s.title}>
            Signalements
            {nonLus > 0 && <span style={s.countBadge}>{nonLus}</span>}
          </h1>
          <div style={s.titleUnderline} />
        </div>
        {nonLus > 0 && (
          <button onClick={handleLireTout} style={s.btnLireTout}>
            <CheckCheck size={14} strokeWidth={2.5} />
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* ── STATS ── */}
      <div style={s.statsRow}>
        {[
          { label: 'Non lus',     val: nonLus,              Icon: Bell,         bg: '#EEF1F8', color: NAVY         },
          { label: 'Critiques',   val: critiques,           Icon: AlertOctagon, bg: '#FEF1F1', color: RED          },
          { label: 'Avertissem.', val: avertis,             Icon: AlertTriangle,bg: '#FBF5E9', color: GOLD         },
          { label: 'Total',       val: signalements.length, Icon: ShieldAlert,  bg: '#EEE9F8', color: '#5b21b6'    },
        ].map(({ label, val, Icon, bg, color }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: bg }}>
              <Icon size={16} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={s.statVal}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MESSAGE ── */}
      {msg && <div style={s.alertSuccess}>{msg}</div>}

      {/* ── FILTRES ── */}
      <div style={s.filtresCard}>
        <span style={s.filtreLabel}>Filtrer</span>

        <CustomSelect
          value={filtre.lu}
          onChange={val => setFiltre(p => ({ ...p, lu: val }))}
          options={[
            { value: '',      label: 'Tous statuts' },
            { value: 'false', label: 'Non lus'      },
            { value: 'true',  label: 'Lus'          },
          ]}
        />

        <CustomSelect
          value={filtre.niveau}
          onChange={val => setFiltre(p => ({ ...p, niveau: val }))}
          options={[
            { value: '',              label: 'Tous niveaux'  },
            { value: 'info',          label: 'Info'          },
            { value: 'avertissement', label: 'Avertissement' },
            { value: 'critique',      label: 'Critique'      },
          ]}
        />

        <CustomSelect
          value={filtre.type}
          onChange={val => setFiltre(p => ({ ...p, type: val }))}
          options={[
            { value: '',                       label: 'Tous types'           },
            { value: 'stock_anormal',          label: 'Stock anormal'        },
            { value: 'difference_caisse',      label: 'Différence caisse'    },
            { value: 'comportement_suspect',   label: 'Comportement suspect' },
            { value: 'erreur_saisie',          label: 'Erreur saisie'        },
          ]}
        />

        <span style={s.resultCount}>
          {signalements.length} signalement{signalements.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── LISTE ── */}
      {loading ? (
        <p style={s.loading}>Chargement...</p>
      ) : signalements.length === 0 ? (
        <div style={s.tableCard}>
          <div style={s.empty}>
            <BellOff size={28} color={MUTED} strokeWidth={1.3} />
            <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
              Aucun signalement pour ces critères.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {signalements.map(sig => {
            const nc = NIVEAU_CONFIG[sig.niveau] || NIVEAU_CONFIG.info
            const { Icon } = nc
            return (
              <div
                key={sig.id}
                style={{
                  ...s.card,
                  borderLeft: `3px solid ${sig.lu ? BORDER : nc.border}`,
                  opacity: sig.lu ? 0.65 : 1,
                }}
              >
                <div style={{ ...s.niveauIcon, background: nc.bg }}>
                  <Icon size={16} color={nc.color} strokeWidth={2} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={s.cardHeader}>
                    <NiveauBadge niveau={sig.niveau} />
                    <TypeBadge   type={sig.type}    />
                    {!sig.lu && <NouveauBadge />}
                  </div>
                  <p style={s.message}>{sig.message}</p>
                  <div style={s.meta}>
                    <span>{new Date(sig.date).toLocaleString('fr-FR')}</span>
                    {sig.employe_nom && (
                      <>
                        <span style={s.metaDot}>·</span>
                        <span>{sig.employe_nom}</span>
                      </>
                    )}
                  </div>
                </div>

                {!sig.lu && (
                  <button onClick={() => handleLire(sig.id)} style={s.btnLire}>
                    <CheckCheck size={12} strokeWidth={2.5} />
                    <span>Marquer lu</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────
const s = {
  page:          { padding: '32px 28px', maxWidth: 900, margin: '0 auto' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  countBadge:    { background: RED, color: WHITE, fontSize: 12, fontWeight: 800, padding: '2px 9px', borderRadius: 20 },

  btnLireTout: { display: 'flex', alignItems: 'center', gap: 8, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5`, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 },

  statsRow: { display: 'flex', gap: 12, marginBottom: 24 },
  statCard: { display: 'flex', alignItems: 'center', gap: 12, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', flex: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:  { fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statLabel:{ fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 },

  alertSuccess: { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500 },

  filtresCard: { display: 'flex', alignItems: 'center', gap: 10, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 18px', marginBottom: 20, flexWrap: 'wrap' },
  filtreLabel: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', marginRight: 4 },
  resultCount: { marginLeft: 'auto', fontSize: 12, color: MUTED, fontWeight: 500 },

  tableCard: { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' },
  card:      { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'opacity 0.2s' },
  niveauIcon:{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },

  cardHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  badge:      { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  message:    { fontSize: 13, color: NAVY, margin: '0 0 8px', lineHeight: 1.6, fontWeight: 500 },
  meta:       { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: MUTED },
  metaDot:    { color: BORDER },

  btnLire: { display: 'flex', alignItems: 'center', gap: 5, background: BG, color: NAVY, border: `1px solid ${BORDER}`, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 },

  loading: { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:   { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default SignalementsPage