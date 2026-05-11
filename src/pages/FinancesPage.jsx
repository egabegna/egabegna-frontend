import { useState, useEffect, useCallback, useRef } from 'react'
import rapportService from '../services/rapportService'
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart2,
  Plus, X, ChevronDown, ChevronLeft, ChevronRight, Calendar, DollarSign,
} from 'lucide-react'
import api from '../services/api'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

const TYPES_DEPENSE = ['loyer','salaire','transport','electricite','eau','telephone','maintenance','autre']

const TYPE_COLORS = {
  loyer:        { bg: '#EEF1F8', color: NAVY  },
  salaire:      { bg: '#EBF5EF', color: GREEN },
  transport:    { bg: '#FBF5E9', color: GOLD  },
  electricite:  { bg: '#FEF1F1', color: RED   },
  eau:          { bg: '#E8F4FD', color: '#1a6fa0' },
  telephone:    { bg: '#EEE9F8', color: '#5b21b6' },
  maintenance:  { bg: '#FFF4E6', color: '#9a3412' },
  autre:        { bg: BG,        color: MUTED },
}

const STATUT_CONFIG = {
  en_cours:                 { bg: '#EEF1F8', color: NAVY,  label: 'En cours'   },
  partiellement_remboursee: { bg: '#FBF5E9', color: GOLD,  label: 'Partiel'    },
  remboursee:               { bg: '#EBF5EF', color: GREEN, label: 'Remboursée' },
  perdue:                   { bg: '#FEF1F1', color: RED,   label: 'Perdue'     },
}

const fmt  = n => Number(n || 0).toLocaleString('fr-FR')
const fmtD = s => s ? new Date(s).toLocaleDateString('fr-FR') : '—'
const today30 = () => {
  const fin   = new Date()
  const debut = new Date()
  debut.setDate(fin.getDate() - 30)
  const iso = d => d.toISOString().split('T')[0]
  return { date_debut: iso(debut), date_fin: iso(fin) }
}

// ─── Badge type ───────────────────────────────
function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || { bg: BG, color: MUTED }
  return <span style={{ ...s.badge, background: c.bg, color: c.color }}>{type}</span>
}

function StatutBadge({ statut }) {
  const c = STATUT_CONFIG[statut] || { bg: BG, color: MUTED, label: statut }
  return <span style={{ ...s.badge, background: c.bg, color: c.color }}>{c.label}</span>
}

function Field({ label, name, type = 'text', value, onChange, required = true, placeholder }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      <input
        name={name} type={type} value={value}
        onChange={onChange} required={required}
        placeholder={placeholder}
        style={s.input}
      />
    </div>
  )
}

// ─── Select custom ────────────────────────────
function CustomSelect({ name, value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value) || options[0]

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } })
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 160 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ ...cs.trigger, borderColor: open ? NAVY : BORDER, width: '100%' }}
      >
        <span style={{ flex: 1, textAlign: 'left', color: value ? NAVY : MUTED, fontSize: 13, fontWeight: value ? 600 : 400 }}>
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
              onClick={() => handleSelect(o.value)}
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
    padding:      '10px 12px',
    borderRadius: 9,
    border:       `1.5px solid ${BORDER}`,
    background:   WHITE,
    cursor:       'pointer',
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
    fontSize:   13,
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


// ─── Calendrier custom ────────────────────────
const JOURS_CAL  = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MOIS_FR_CAL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function CustomDatePicker({ name, value, onChange, placeholder = 'Date' }) {
  const [open, setOpen]         = useState(false)
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date())
  const ref                     = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = value ? new Date(value) : null

  const handleSelect = (date) => {
    onChange({ target: { name, value: date.toISOString().split('T')[0] } })
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({ target: { name, value: '' } })
  }

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const firstDay    = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const lastDay     = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells       = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)

  const todayD = new Date()
  const isToday    = d => d === todayD.getDate() && viewDate.getMonth() === todayD.getMonth() && viewDate.getFullYear() === todayD.getFullYear()
  const isSelected = d => selected && d === selected.getDate() && viewDate.getMonth() === selected.getMonth() && viewDate.getFullYear() === selected.getFullYear()

  const displayValue = selected
    ? selected.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ ...dp.trigger, borderColor: open ? NAVY : BORDER }}
      >
        <Calendar size={13} color={value ? NAVY : MUTED} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', color: value ? NAVY : MUTED, fontSize: 12, fontWeight: value ? 600 : 400 }}>
          {displayValue || placeholder}
        </span>
        {value && (
          <button onClick={handleClear} style={dp.clearBtn} type="button">
            <X size={11} color={MUTED} strokeWidth={2.5} />
          </button>
        )}
      </button>

      {open && (
        <div style={dp.calendar}>
          <div style={dp.calHeader}>
            <button onClick={prevMonth} style={dp.navBtn} type="button">
              <ChevronLeft size={14} color={NAVY} strokeWidth={2} />
            </button>
            <span style={dp.monthLabel}>
              {MOIS_FR_CAL[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={nextMonth} style={dp.navBtn} type="button">
              <ChevronRight size={14} color={NAVY} strokeWidth={2} />
            </button>
          </div>

          <div style={dp.weekRow}>
            {JOURS_CAL.map(j => (
              <div key={j} style={dp.weekDay}>{j}</div>
            ))}
          </div>

          <div style={dp.grid}>
            {cells.map((d, i) => (
              <div
                key={i}
                onClick={() => d && handleSelect(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
                style={{
                  ...dp.cell,
                  background:   d && isSelected(d) ? NAVY : d && isToday(d) ? '#EEF1F8' : 'transparent',
                  color:        d && isSelected(d) ? WHITE : d && isToday(d) ? NAVY : d ? '#374151' : 'transparent',
                  fontWeight:   d && (isSelected(d) || isToday(d)) ? 700 : 400,
                  cursor:       d ? 'pointer' : 'default',
                  borderRadius: 8,
                }}
                onMouseEnter={e => { if (d && !isSelected(d)) e.currentTarget.style.background = BG }}
                onMouseLeave={e => { if (d && !isSelected(d)) e.currentTarget.style.background = isToday(d) ? '#EEF1F8' : 'transparent' }}
              >
                {d || ''}
              </div>
            ))}
          </div>

          <div style={dp.footer}>
            <button onClick={() => handleSelect(todayD)} style={dp.todayBtn} type="button">
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const dp = {
  trigger: {
    display:      'flex',
    alignItems:   'center',
    gap:          7,
    padding:      '7px 12px',
    borderRadius: 9,
    border:       `1.5px solid ${BORDER}`,
    background:   WHITE,
    cursor:       'pointer',
    minWidth:     140,
    transition:   'border-color 0.15s',
  },
  clearBtn: {
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    padding:    0,
    display:    'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  calendar: {
    position:     'absolute',
    top:          'calc(100% + 4px)',
    left:         0,
    background:   WHITE,
    border:       `1.5px solid ${BORDER}`,
    borderRadius: 14,
    boxShadow:    '0 12px 40px rgba(0,0,0,0.10)',
    zIndex:       30,
    padding:      14,
    width:        260,
  },
  calHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   10,
  },
  monthLabel: {
    fontSize:      13,
    fontWeight:    700,
    color:         NAVY,
    letterSpacing: '0.3px',
  },
  navBtn: {
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    padding:        4,
    borderRadius:   6,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  weekRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom:        4,
  },
  weekDay: {
    textAlign:     'center',
    fontSize:      10,
    fontWeight:    700,
    color:         MUTED,
    letterSpacing: '0.5px',
    padding:       '4px 0',
    textTransform: 'uppercase',
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap:                 2,
  },
  cell: {
    textAlign:  'center',
    fontSize:   12,
    padding:    '6px 2px',
    transition: 'background 0.1s',
    userSelect: 'none',
  },
  footer: {
    marginTop:  10,
    paddingTop: 8,
    borderTop:  `1px solid ${BORDER}`,
    textAlign:  'center',
  },
  todayBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    fontSize:     12,
    color:        GOLD,
    fontWeight:   700,
    padding:      '4px 10px',
    borderRadius: 6,
  },
}

// ─── PeriodePicker ────────────────────────────
function PeriodePicker({ value, onChange }) {
  const PRESETS = [
    { label: "Aujourd'hui", days: 0  },
    { label: '7 jours',     days: 7  },
    { label: '30 jours',    days: 30 },
    { label: '3 mois',      days: 90 },
  ]

  const [activePreset, setActivePreset] = useState(30)  // null = période custom

  const appliquer = (days) => {
    setActivePreset(days)
    const fin   = new Date()
    const debut = new Date()
    debut.setDate(fin.getDate() - days)
    const iso = d => d.toISOString().split('T')[0]
    onChange({ date_debut: iso(debut), date_fin: iso(fin) })
  }

  return (
    <div style={pp.wrap}>
      {PRESETS.map(p => {
        const actif = activePreset === p.days
        return (
          <button
            key={p.label}
            onClick={() => appliquer(p.days)}
            style={{
              ...pp.btn,
              background:   actif ? NAVY  : WHITE,
              color:        actif ? WHITE : NAVY,
              border:       `1.5px solid ${actif ? NAVY : BORDER}`,
              fontWeight:   actif ? 700   : 500,
            }}
          >
            {p.label}
          </button>
        )
      })}
      <div style={{ width: 1, height: 22, background: BORDER }} />
      <CustomDatePicker
        name="date_debut"
        value={value.date_debut}
        onChange={e => { setActivePreset(null); onChange({ ...value, date_debut: e.target.value }) }}
        placeholder="Début"
      />
      <span style={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>→</span>
      <CustomDatePicker
        name="date_fin"
        value={value.date_fin}
        onChange={e => { setActivePreset(null); onChange({ ...value, date_fin: e.target.value }) }}
        placeholder="Fin"
      />
    </div>
  )
}

const pp = {
  wrap: {
    display:    'flex',
    gap:        6,
    flexWrap:   'wrap',
    alignItems: 'center',
  },
  btn: {
    padding:      '7px 14px',
    borderRadius: 9,
    cursor:       'pointer',
    fontSize:     12,
    transition:   'all 0.15s',
  },
}

// ─── CreanceCard ──────────────────────────────
function CreanceCard({ creance, onPaiement }) {
  const [montant, setMontant]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [paying, setPaying]     = useState(false)

  const restant = Number(creance.montant_restant || 0)
  const paye    = Number(creance.montant_paye    || 0)
  const total   = Number(creance.montant_total   || 0)
  const pct     = total > 0 ? Math.min(100, (paye / total) * 100) : 0
  const clos    = creance.statut === 'remboursee' || creance.statut === 'perdue'

  const handlePay = async () => {
    if (!montant || isNaN(montant)) return
    setPaying(true)
    await onPaiement(creance, montant)
    setMontant('')
    setShowForm(false)
    setPaying(false)
  }

  return (
    <div style={s.creanceCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ ...s.avatar, background: '#EEF1F8', color: NAVY }}>
            {creance.nom_client?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{creance.nom_client}</div>
            {(creance.telephone_client || creance.date_echeance) && (
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                {creance.telephone_client}{creance.telephone_client && creance.date_echeance ? ' · ' : ''}
                {creance.date_echeance && `Échéance : ${fmtD(creance.date_echeance)}`}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <StatutBadge statut={creance.statut} />
          <div style={{ fontWeight: 800, color: NAVY, fontSize: 15, marginTop: 6 }}>
            {fmt(restant)} <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>FCFA restant</span>
          </div>
        </div>
      </div>

      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${pct}%`, background: clos ? MUTED : GREEN }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginTop: 5 }}>
        <span>Payé : {fmt(paye)} FCFA</span>
        <span>Total : {fmt(total)} FCFA</span>
      </div>

      {!clos && (
        <div style={{ marginTop: 12 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={s.btnAction2}>
              <Plus size={12} strokeWidth={2.5} />
              <span>Enregistrer paiement</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number" value={montant}
                onChange={e => setMontant(e.target.value)}
                placeholder={`Max : ${fmt(restant)} FCFA`}
                style={{ ...s.input, flex: 1, fontSize: 12 }}
              />
              <button onClick={handlePay} disabled={paying}
                style={{ ...s.btnPrimary, padding: '8px 14px', fontSize: 12 }}>
                {paying ? '...' : 'OK'}
              </button>
              <button onClick={() => setShowForm(false)} style={s.iconBtn}>
                <X size={14} color={MUTED} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────
function FinancesPage() {
  const [periode, setPeriode]   = useState(today30)
  const [dashboard, setDashboard] = useState(null)
  const [depenses, setDepenses] = useState([])
  const [creances, setCreances] = useState([])
  const [onglet, setOnglet]     = useState('kpis')
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState({ type: '', text: '' })

  const DEP_INIT = { type: 'autre', montant: '', description: '', date: new Date().toISOString().split('T')[0] }
  const [showDepForm, setShowDepForm]     = useState(false)
  const [depForm, setDepForm]             = useState(DEP_INIT)
  const [depSubmitting, setDepSubmitting] = useState(false)

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 3500)
  }

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, depRes, creRes] = await Promise.all([
        rapportService.dashboard(periode),
        api.get('/api/depenses/', { params: { date_debut: periode.date_debut, date_fin: periode.date_fin } }),
        api.get('/api/creances/'),
      ])
      setDashboard(dRes.data)
      setDepenses(depRes.data.results || depRes.data)
      setCreances(creRes.data.results || creRes.data)
    } catch { }
    finally { setLoading(false) }
  }, [periode])

  useEffect(() => { charger() }, [charger])

  const handleDepSubmit = async e => {
    e.preventDefault()
    setDepSubmitting(true)
    try {
      await api.post('/api/depenses/', { ...depForm, montant: Number(depForm.montant) })
      showMsg('success', 'Dépense ajoutée avec succès.')
      setShowDepForm(false)
      setDepForm(DEP_INIT)
      await charger()
    } catch { showMsg('error', "Erreur lors de l'ajout.") }
    finally { setDepSubmitting(false) }
  }

  const handleDepChange = e => {
    const { name, value } = e.target
    setDepForm(p => ({ ...p, [name]: value }))
  }

  const handlePaiement = async (creance, montant) => {
    try {
      await api.post(`/api/creances/${creance.id}/paiement/`, { montant: Number(montant) })
      showMsg('success', 'Paiement enregistré.')
      await charger()
    } catch { showMsg('error', 'Erreur lors du paiement.') }
  }

  const ca       = Number(dashboard?.chiffre_affaires?.total || 0)
  const benefice = Number(dashboard?.benefice_brut           || 0)
  const depTotal = Number(dashboard?.depenses?.total         || 0)
  const creTotal = Number(dashboard?.creances?.total_restant || 0)
  const resultat = Number(dashboard?.resultat_net            || 0)

  const ONGLETS = [
    { key: 'kpis',     label: 'Aperçu',   Icon: BarChart2    },
    { key: 'depenses', label: 'Dépenses', Icon: TrendingDown },
    { key: 'creances', label: 'Créances', Icon: AlertCircle  },
  ]

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Gestion</p>
          <h1 style={s.title}>Finances</h1>
          <div style={s.titleUnderline} />
        </div>
        <PeriodePicker value={periode} onChange={setPeriode} />
      </div>

      {/* ── KPI STATS ── */}
      <div style={s.statsRow}>
        {[
          { label: "Chiffre d'affaires", val: ca,       Icon: Wallet,       bg: '#EEF1F8', color: NAVY  },
          { label: 'Bénéfice brut',      val: benefice, Icon: TrendingUp,   bg: '#EBF5EF', color: GREEN },
          { label: 'Dépenses',           val: depTotal, Icon: TrendingDown, bg: '#FBF5E9', color: GOLD  },
          { label: 'Créances restantes', val: creTotal, Icon: AlertCircle,  bg: '#EEE9F8', color: '#5b21b6' },
          { label: 'Résultat net',       val: resultat, Icon: DollarSign,
            bg: resultat >= 0 ? '#EBF5EF' : '#FEF1F1',
            color: resultat >= 0 ? GREEN : RED },
        ].map(({ label, val, Icon, bg, color }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: bg }}>
              <Icon size={16} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ ...s.statVal, color }}>{fmt(val)}</div>
              <div style={s.statValUnit}>FCFA</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MESSAGES ── */}
      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      {/* ── ONGLETS ── */}
      <div style={s.tabs}>
        {ONGLETS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setOnglet(key)}
            style={{
              ...s.tab,
              color:        onglet === key ? NAVY : MUTED,
              borderBottom: onglet === key ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
              fontWeight:   onglet === key ? 700 : 500,
            }}
          >
            <Icon size={13} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── APERÇU ── */}
      {onglet === 'kpis' && (
        <div>
          {(dashboard?.depenses?.par_type?.length > 0) ? (
            <div style={s.tableCard}>
              <div style={s.sectionHeader}>
                <span style={s.sectionTitle}>Répartition des dépenses</span>
              </div>
              <div style={{ padding: '8px 20px 16px' }}>
                {dashboard.depenses.par_type.map(d => {
                  const pct = depTotal > 0 ? (Number(d.total) / depTotal * 100).toFixed(1) : 0
                  const c   = TYPE_COLORS[d.type] || { color: MUTED }
                  return (
                    <div key={d.type} style={s.depRow}>
                      <TypeBadge type={d.type} />
                      <div style={s.depBarTrack}>
                        <div style={{ ...s.depBarFill, width: `${pct}%`, background: c.color }} />
                      </div>
                      <span style={s.depPct}>{pct}%</span>
                      <span style={s.depVal}>{fmt(d.total)} FCFA</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : !loading && (
            <div style={s.tableCard}>
              <div style={s.empty}>
                <BarChart2 size={28} color={MUTED} strokeWidth={1.3} />
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>Aucune donnée pour cette période.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DÉPENSES ── */}
      {onglet === 'depenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              onClick={() => setShowDepForm(v => !v)}
              style={showDepForm ? s.btnSecondary : s.btnPrimary}
            >
              {showDepForm
                ? <><X size={15} strokeWidth={2.5} /><span>Annuler</span></>
                : <><Plus size={15} strokeWidth={2.5} /><span>Ajouter une dépense</span></>
              }
            </button>
          </div>

          {showDepForm && (
            <div style={s.formCard}>
              <div style={s.formHeader}>
                <span style={s.formTitle}>Nouvelle dépense</span>
              </div>
              <div style={s.formDivider} />
              <form onSubmit={handleDepSubmit} noValidate>
                <div style={s.row}>
                  {/* Select type custom */}
                  <CustomSelect
                    name="type"
                    value={depForm.type}
                    onChange={handleDepChange}
                    options={TYPES_DEPENSE.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                  />
                  <Field label="Montant (FCFA) *" name="montant" type="number" value={depForm.montant} onChange={handleDepChange} />
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Date *</label>
                    <CustomDatePicker
                      name="date"
                      value={depForm.date}
                      onChange={handleDepChange}
                      placeholder="Choisir une date"
                    />
                  </div>
                </div>
                <Field
                  label="Description (optionnel)" name="description"
                  value={depForm.description} onChange={handleDepChange}
                  required={false} placeholder="Détails de la dépense..."
                />
                <div style={s.formActions}>
                  <button
                    type="submit"
                    disabled={depSubmitting || !depForm.montant}
                    style={{
                      ...s.btnPrimary,
                      opacity: depSubmitting || !depForm.montant ? 0.5 : 1,
                      cursor:  depSubmitting || !depForm.montant ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {depSubmitting ? 'Enregistrement...' : 'Enregistrer la dépense'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={s.tableCard}>
            <div style={s.tableToolbar}>
              <span style={s.resultCount}>
                {depenses.length} dépense{depenses.length !== 1 ? 's' : ''}
              </span>
              <span style={{ ...s.statVal, fontSize: 14, color: GOLD }}>
                Total : {fmt(depenses.reduce((a, d) => a + Number(d.montant || 0), 0))} FCFA
              </span>
            </div>
            {loading ? (
              <p style={s.loading}>Chargement...</p>
            ) : depenses.length === 0 ? (
              <div style={s.empty}>
                <TrendingDown size={28} color={MUTED} strokeWidth={1.3} />
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>Aucune dépense sur cette période.</p>
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Date', 'Type', 'Description', 'Montant'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {depenses.map((d, i) => (
                    <tr key={d.id}
                      style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}
                      onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                      onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                    >
                      <td style={s.td}>{fmtD(d.date)}</td>
                      <td style={s.td}><TypeBadge type={d.type} /></td>
                      <td style={{ ...s.td, color: MUTED }}>{d.description || '—'}</td>
                      <td style={s.td}>
                        <span style={{ fontWeight: 700, color: GOLD }}>{fmt(d.montant)} FCFA</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── CRÉANCES ── */}
      {onglet === 'creances' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <span style={s.resultCount}>
              {creances.length} créance{creances.length !== 1 ? 's' : ''}
            </span>
          </div>
          {loading ? (
            <p style={s.loading}>Chargement...</p>
          ) : creances.length === 0 ? (
            <div style={s.tableCard}>
              <div style={s.empty}>
                <AlertCircle size={28} color={MUTED} strokeWidth={1.3} />
                <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>Aucune créance enregistrée.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {creances.map(c => (
                <CreanceCard key={c.id} creance={c} onPaiement={handlePaiement} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────
const s = {
  page:          { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },

  btnPrimary:  { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ display: 'flex', alignItems: 'center', gap: 8, background: BG,   color: NAVY,  border: 'none', padding: '11px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },

  statsRow: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  statCard: { display: 'flex', alignItems: 'center', gap: 12, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 160 },
  statIcon: { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:  { fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statValUnit: { fontSize: 10, color: MUTED, fontWeight: 500, letterSpacing: '0.5px' },
  statLabel:{ fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 },

  alertSuccess: { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500 },
  alertError:   { background: '#FEF1F1', border: '1px solid #FBBCBC', color: RED,   borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13 },

  tabs: { display: 'flex', borderBottom: `1.5px solid ${BORDER}`, marginBottom: 24, gap: 4 },
  tab:  { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: '10px 18px', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s', borderBottom: '2.5px solid transparent' },

  tableCard:    { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  sectionHeader:{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  tableToolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  resultCount:  { fontSize: 12, color: MUTED, fontWeight: 500 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th:    { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG, borderBottom: `1px solid ${BORDER}` },
  tr:    { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:    { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },

  badge:  { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  avatar: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px', flexShrink: 0 },

  formCard:    { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 },
  formHeader:  { marginBottom: 14 },
  formTitle:   { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  formDivider: { height: 1, background: BORDER, marginBottom: 18 },
  formActions: { marginTop: 8 },

  row:        { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  fieldGroup: { marginBottom: 16, flex: 1, minWidth: 160 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:      { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE },

  depRow:      { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  depBarTrack: { flex: 1, height: 6, background: BG, borderRadius: 4, overflow: 'hidden' },
  depBarFill:  { height: '100%', borderRadius: 4, transition: 'width 0.3s' },
  depPct:      { fontSize: 12, color: MUTED, width: 38, textAlign: 'right' },
  depVal:      { fontSize: 12, fontWeight: 700, color: NAVY, width: 150, textAlign: 'right' },

  creanceCard:  { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 22px' },
  progressTrack:{ height: 6, background: BG, borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  progressFill: { height: '100%', borderRadius: 4, transition: 'width 0.4s' },

  btnAction2: { display: 'flex', alignItems: 'center', gap: 5, background: '#EEF1F8', color: NAVY, border: `1px solid ${BORDER}`, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  iconBtn:    { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },

  loading: { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:   { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default FinancesPage