import { useState, useCallback, useRef, useEffect } from 'react'
import rapportService from '../services/rapportService'
import MiniChart from '../components/shared/MiniChart'
import {
  TrendingUp, Package, Users, Play, Download,
  BarChart2, Trophy, ChevronDown, ChevronLeft, ChevronRight, Calendar, X,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'

const ROLE_CONFIG = {
  proprietaire: { bg: '#EEE9F8', color: '#5b21b6' },
  manager:      { bg: '#EEF1F8', color: NAVY       },
  vendeur:      { bg: '#EBF5EF', color: GREEN      },
  ambulant:     { bg: '#FBF5E9', color: '#9a3412'  },
}

const fmt  = n => Number(n || 0).toLocaleString('fr-FR')
const fmtD = s => s ? new Date(s).toLocaleDateString('fr-FR') : '—'

// ─── Responsive CSS ───────────────────────────
const RESPONSIVE_CSS = `
  .rp-page { padding: 32px 28px; max-width: 1100px; margin: 0 auto; }

  .rp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 12px;
  }

  .rp-tabs {
    display: flex;
    border-bottom: 1.5px solid ${BORDER};
    margin-bottom: 20px;
    gap: 4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .rp-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 10px 18px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
    border-bottom: 2.5px solid transparent;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .rp-filtres-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${WHITE};
    border: 1px solid ${BORDER};
    border-radius: 12px;
    padding: 14px 20px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .rp-filtres-inner {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .rp-stats-row {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .rp-stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: ${WHITE};
    border: 1px solid ${BORDER};
    border-radius: 12px;
    padding: 14px 18px;
    flex: 1;
    min-width: 180px;
  }

  /* Scrollable table wrapper */
  .rp-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* Mobile row cards — hidden on desktop */
  .rp-card-list { display: none; flex-direction: column; gap: 10px; padding: 12px; }

  /* Tab labels */
  .rp-tab-label { display: inline; }

  @media (max-width: 640px) {
    .rp-page { padding: 16px 14px; }

    .rp-header { align-items: center; }

    .rp-tab { padding: 10px 12px; font-size: 12px; }
    .rp-tab-label { display: none; }

    .rp-filtres-card {
      flex-direction: column;
      align-items: stretch;
      padding: 12px 14px;
      gap: 10px;
    }
    .rp-filtres-inner { flex-wrap: wrap; gap: 8px; }

    /* Generate button full width */
    .rp-btn-generate { width: 100%; justify-content: center; }

    .rp-stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .rp-stat-card { min-width: unset; padding: 10px 12px; gap: 8px; border-radius: 10px; }

    /* Hide desktop table, show cards */
    .rp-table-scroll { display: none; }
    .rp-card-list    { display: flex; }
  }

  @media (max-width: 380px) {
    .rp-stats-row { grid-template-columns: 1fr; }
  }
`

function InjectStyles() {
  useEffect(() => {
    const id = 'rp-responsive-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id
      el.textContent = RESPONSIVE_CSS
      document.head.appendChild(el)
    }
  }, [])
  return null
}

function RoleBadge({ role }) {
  const c = ROLE_CONFIG[role] || { bg: BG, color: MUTED }
  return <span style={{ ...s.badge, background: c.bg, color: c.color }}>{role}</span>
}

function RangBadge({ rang }) {
  const medals = {
    1: { bg: '#FBF5E9', color: GOLD },
    2: { bg: '#F4F5F7', color: '#607D8B' },
    3: { bg: '#FFF3EE', color: '#9a3412' },
  }
  const c = medals[rang] || { bg: BG, color: MUTED }
  return <span style={{ ...s.badge, background: c.bg, color: c.color, fontWeight: 800 }}>#{rang}</span>
}

function BoutonExport() {
  const [showTip, setShowTip] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        disabled
        style={s.btnExportDisabled}
      >
        <Download size={14} strokeWidth={2} />
        <span>Exporter</span>
      </button>
      {showTip && <div style={s.tooltip}>Disponible en v2</div>}
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ ...cs.trigger, borderColor: open ? NAVY : BORDER }}
      >
        <span style={{ flex: 1, textAlign: 'left', color: NAVY, fontSize: 12, fontWeight: 600 }}>
          {selected?.label}
        </span>
        <ChevronDown size={13} color={MUTED} strokeWidth={2}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={cs.dropdown}>
          {options.map(o => (
            <div key={o.value}
              onClick={() => { onChange({ target: { name, value: o.value } }); setOpen(false) }}
              style={{ ...cs.option, background: value === o.value ? '#EEF1F8' : WHITE, color: value === o.value ? NAVY : '#6B7A99', fontWeight: value === o.value ? 700 : 400 }}
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
  trigger:  { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, background: WHITE, cursor: 'pointer', minWidth: 130, transition: 'border-color 0.15s' },
  dropdown: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 20, overflow: 'hidden' },
  option:   { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 12, cursor: 'pointer', transition: 'background 0.1s' },
  dot:      { width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 },
}

// ─── Calendrier custom ────────────────────────
const JOURS_CAL   = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
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

  const selected    = value ? new Date(value) : null
  const handleSelect = (date) => { onChange({ target: { name, value: date.toISOString().split('T')[0] } }); setOpen(false) }
  const handleClear  = (e)    => { e.stopPropagation(); onChange({ target: { name, value: '' } }) }
  const prevMonth    = ()     => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth    = ()     => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const firstDay    = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const lastDay     = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells       = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)

  const todayD     = new Date()
  const isToday    = d => d === todayD.getDate() && viewDate.getMonth() === todayD.getMonth() && viewDate.getFullYear() === todayD.getFullYear()
  const isSelected = d => selected && d === selected.getDate() && viewDate.getMonth() === selected.getMonth() && viewDate.getFullYear() === selected.getFullYear()

  const displayValue = selected
    ? selected.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ ...dp.trigger, borderColor: open ? NAVY : BORDER }}>
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
        <div style={{ ...dp.calendar, right: 0, left: 'auto' }}>
          <div style={dp.calHeader}>
            <button onClick={prevMonth} style={dp.navBtn} type="button"><ChevronLeft size={14} color={NAVY} strokeWidth={2} /></button>
            <span style={dp.monthLabel}>{MOIS_FR_CAL[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={nextMonth} style={dp.navBtn} type="button"><ChevronRight size={14} color={NAVY} strokeWidth={2} /></button>
          </div>
          <div style={dp.weekRow}>{JOURS_CAL.map(j => <div key={j} style={dp.weekDay}>{j}</div>)}</div>
          <div style={dp.grid}>
            {cells.map((d, i) => (
              <div key={i}
                onClick={() => d && handleSelect(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
                style={{ ...dp.cell, background: d && isSelected(d) ? NAVY : d && isToday(d) ? '#EEF1F8' : 'transparent', color: d && isSelected(d) ? WHITE : d && isToday(d) ? NAVY : d ? '#374151' : 'transparent', fontWeight: d && (isSelected(d) || isToday(d)) ? 700 : 400, cursor: d ? 'pointer' : 'default', borderRadius: 8 }}
                onMouseEnter={e => { if (d && !isSelected(d)) e.currentTarget.style.background = BG }}
                onMouseLeave={e => { if (d && !isSelected(d)) e.currentTarget.style.background = isToday(d) ? '#EEF1F8' : 'transparent' }}
              >
                {d || ''}
              </div>
            ))}
          </div>
          <div style={dp.footer}>
            <button onClick={() => handleSelect(todayD)} style={dp.todayBtn} type="button">Aujourd'hui</button>
          </div>
        </div>
      )}
    </div>
  )
}

const dp = {
  trigger:   { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, background: WHITE, cursor: 'pointer', minWidth: 130, transition: 'border-color 0.15s' },
  clearBtn:  { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 },
  calendar:  { position: 'absolute', top: 'calc(100% + 4px)', background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.10)', zIndex: 30, padding: 14, width: 248 },
  calHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthLabel:{ fontSize: 13, fontWeight: 700, color: NAVY, letterSpacing: '0.3px' },
  navBtn:    { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  weekRow:   { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 },
  weekDay:   { textAlign: 'center', fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.5px', padding: '4px 0', textTransform: 'uppercase' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  cell:      { textAlign: 'center', fontSize: 12, padding: '6px 2px', transition: 'background 0.1s', userSelect: 'none' },
  footer:    { marginTop: 10, paddingTop: 8, borderTop: `1px solid ${BORDER}`, textAlign: 'center' },
  todayBtn:  { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: GOLD, fontWeight: 700, padding: '4px 10px', borderRadius: 6 },
}

// ─── Mobile row cards ─────────────────────────
function VenteCard({ p, i }) {
  return (
    <div style={{ background: i % 2 === 0 ? WHITE : '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: MUTED }}>{p.periode ? fmtD(p.periode) : '—'}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{fmt(p.ca)} FCFA</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.nb_ventes} vente{p.nb_ventes !== 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}

function ProduitCard({ p, i }) {
  return (
    <div style={{ background: i % 2 === 0 ? WHITE : '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RangBadge rang={p.rang} />
          <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{p.produit_nom}</span>
        </div>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{p.qte_vendue} unités</span>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: NAVY, fontWeight: 700 }}>CA : {fmt(p.ca)} FCFA</span>
        <span style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>Bén. : {fmt(p.benefice)} FCFA</span>
      </div>
    </div>
  )
}

function EmployeCard({ e, i }) {
  const initiales = e.employe_nom?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{ background: i % 2 === 0 ? WHITE : '#FAFBFC', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...s.avatar, background: '#EEF1F8', color: NAVY }}>{initiales}</div>
          <div>
            <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{e.employe_nom}</div>
            <RoleBadge role={e.employe_role} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{fmt(e.ca_total)} FCFA</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{e.nb_ventes} vente{e.nb_ventes !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: MUTED }}>Panier moyen : {fmt(e.panier_moyen)} FCFA</div>
    </div>
  )
}

// ─── Page principale ──────────────────────────
function RapportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const il30j = new Date(); il30j.setDate(il30j.getDate() - 30)
  const deb30 = il30j.toISOString().split('T')[0]

  const [onglet,  setOnglet]  = useState('ventes')
  const [periode, setPeriode] = useState({ date_debut: deb30, date_fin: today })
  const [groupBy, setGroupBy] = useState('day')
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  const charger = useCallback(async () => {
    setLoading(true)
    setData(null)
    try {
      let res
      if (onglet === 'ventes')        res = await rapportService.ventes({ ...periode, groupBy })
      else if (onglet === 'produits') res = await rapportService.topProduits({ ...periode, limite: 20 })
      else                            res = await rapportService.employes(periode)
      setData(res.data)
    } catch { }
    finally { setLoading(false) }
  }, [onglet, periode, groupBy])

  const ONGLETS = [
    { key: 'ventes',   label: 'Ventes',      Icon: TrendingUp },
    { key: 'produits', label: 'Top Produits', Icon: Package    },
    { key: 'employes', label: 'Employés',     Icon: Users      },
  ]

  const handleDateChange = e => {
    const { name, value } = e.target
    setPeriode(p => ({ ...p, [name]: value }))
  }

  return (
    <div className="rp-page">
      <InjectStyles />

      {/* HEADER */}
      <div className="rp-header">
        <div>
          <p style={s.eyebrow}>Analyse</p>
          <h1 style={s.title}>Rapports</h1>
          <div style={s.titleUnderline} />
        </div>
        <BoutonExport />
      </div>

      {/* ONGLETS */}
      <div className="rp-tabs">
        {ONGLETS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => { setOnglet(key); setData(null) }}
            className="rp-tab"
            style={{
              color:        onglet === key ? NAVY  : MUTED,
              borderBottom: onglet === key ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
              fontWeight:   onglet === key ? 700   : 500,
            }}
          >
            <Icon size={13} strokeWidth={2} />
            <span className="rp-tab-label">{label}</span>
          </button>
        ))}
      </div>

      {/* FILTRES */}
      <div className="rp-filtres-card">
        <div className="rp-filtres-inner">
          <span style={s.filtreLabel}>Période</span>
          <CustomDatePicker name="date_debut" value={periode.date_debut} onChange={handleDateChange} placeholder="Début" />
          <span style={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>→</span>
          <CustomDatePicker name="date_fin"   value={periode.date_fin}   onChange={handleDateChange} placeholder="Fin"   />

          {onglet === 'ventes' && (
            <>
              <div style={{ width: 1, height: 22, background: BORDER, flexShrink: 0 }} />
              <span style={s.filtreLabel}>Grouper</span>
              <CustomSelect
                name="groupBy"
                value={groupBy}
                onChange={e => setGroupBy(e.target.value)}
                options={[
                  { value: 'day',   label: 'Par jour'    },
                  { value: 'week',  label: 'Par semaine' },
                  { value: 'month', label: 'Par mois'    },
                ]}
              />
            </>
          )}
        </div>

        <button
          onClick={charger}
          disabled={loading}
          className="rp-btn-generate"
          style={{ ...s.btnPrimary, opacity: loading ? 0.6 : 1 }}
        >
          <Play size={13} strokeWidth={2.5} style={{ fill: WHITE }} />
          <span>{loading ? 'Calcul...' : 'Générer'}</span>
        </button>
      </div>

      {/* CHARGEMENT */}
      {loading && <p style={s.loading}>Calcul en cours...</p>}

      {/* ÉTAT VIDE */}
      {!data && !loading && (
        <div style={s.tableCard}>
          <div style={s.empty}>
            <BarChart2 size={28} color={MUTED} strokeWidth={1.3} />
            <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
              Sélectionnez une période et cliquez sur Générer.
            </p>
          </div>
        </div>
      )}

      {/* VENTES */}
      {data && onglet === 'ventes' && (
        <div>
          <div className="rp-stats-row">
            {[
              { label: 'CA total',   val: `${fmt(data.totaux?.ca)} FCFA`,        Icon: TrendingUp, bg: '#EEF1F8', color: NAVY      },
              { label: 'Nb ventes',  val: data.totaux?.nb_ventes || 0,            Icon: BarChart2,  bg: '#EBF5EF', color: GREEN     },
              { label: 'Bénéfice',   val: `${fmt(data.totaux?.benefice)} FCFA`,   Icon: Trophy,     bg: '#FBF5E9', color: GOLD      },
              { label: 'Coût achat', val: `${fmt(data.totaux?.cout_achat)} FCFA`, Icon: Package,    bg: '#FEF1F1', color: '#c0392b' },
            ].map(({ label, val, Icon, bg, color }) => (
              <div key={label} className="rp-stat-card">
                <div style={{ ...s.statIcon, background: bg }}>
                  <Icon size={16} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...s.statVal, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={s.tableCard}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}>
                Évolution · {groupBy === 'day' ? 'par jour' : groupBy === 'week' ? 'par semaine' : 'par mois'}
              </span>
            </div>
            <div style={{ padding: '16px 16px 8px' }}>
              <MiniChart points={data.points || []} color={NAVY} height={120} />
            </div>

            {/* Desktop table */}
            <div className="rp-table-scroll">
              <table style={{ ...s.table, minWidth: 400 }}>
                <thead>
                  <tr>
                    {["Période", "Chiffre d'affaires", "Nb ventes"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.points || []).map((p, i) => (
                    <tr key={i} style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}
                      onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                      onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                    >
                      <td style={s.td}>{p.periode ? fmtD(p.periode) : '—'}</td>
                      <td style={s.td}><span style={{ fontWeight: 700, color: NAVY }}>{fmt(p.ca)} FCFA</span></td>
                      <td style={s.td}>{p.nb_ventes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="rp-card-list">
              {(data.points || []).map((p, i) => <VenteCard key={i} p={p} i={i} />)}
            </div>
          </div>
        </div>
      )}

      {/* TOP PRODUITS */}
      {data && onglet === 'produits' && (
        <div style={s.tableCard}>
          <div style={s.tableToolbar}>
            <span style={s.sectionTitle}>Top produits par quantité vendue</span>
            <span style={s.resultCount}>{(data.produits || []).length} produit{(data.produits || []).length !== 1 ? 's' : ''}</span>
          </div>
          {(data.produits || []).length === 0 ? (
            <div style={s.empty}>
              <Package size={28} color={MUTED} strokeWidth={1.3} />
              <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>Aucune vente sur la période.</p>
            </div>
          ) : (
            <>
              <div className="rp-table-scroll">
                <table style={{ ...s.table, minWidth: 480 }}>
                  <thead>
                    <tr>
                      {['Rang', 'Produit', 'Qté vendue', 'CA', 'Bénéfice'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.produits || []).map((p, i) => (
                      <tr key={p.produit_id} style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}
                        onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                        onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                      >
                        <td style={s.td}><RangBadge rang={p.rang} /></td>
                        <td style={{ ...s.td, fontWeight: 700, color: NAVY }}>{p.produit_nom}</td>
                        <td style={s.td}>{p.qte_vendue}</td>
                        <td style={s.td}><span style={{ fontWeight: 700, color: NAVY }}>{fmt(p.ca)} FCFA</span></td>
                        <td style={s.td}><span style={{ fontWeight: 700, color: GREEN }}>{fmt(p.benefice)} FCFA</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rp-card-list">
                {(data.produits || []).map((p, i) => <ProduitCard key={p.produit_id} p={p} i={i} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* EMPLOYÉS */}
      {data && onglet === 'employes' && (
        <div style={s.tableCard}>
          <div style={s.tableToolbar}>
            <span style={s.sectionTitle}>Performance par employé</span>
            <span style={s.resultCount}>{(data.employes || []).length} employé{(data.employes || []).length !== 1 ? 's' : ''}</span>
          </div>
          {(data.employes || []).length === 0 ? (
            <div style={s.empty}>
              <Users size={28} color={MUTED} strokeWidth={1.3} />
              <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>Aucune donnée sur la période.</p>
            </div>
          ) : (
            <>
              <div className="rp-table-scroll">
                <table style={{ ...s.table, minWidth: 520 }}>
                  <thead>
                    <tr>
                      {['Employé', 'Rôle', 'Nb ventes', 'CA total', 'Panier moyen'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.employes || []).map((e, i) => {
                      const initiales = e.employe_nom?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
                      return (
                        <tr key={e.employe_id} style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}
                          onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                          onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                        >
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ ...s.avatar, background: '#EEF1F8', color: NAVY }}>{initiales}</div>
                              <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{e.employe_nom}</span>
                            </div>
                          </td>
                          <td style={s.td}><RoleBadge role={e.employe_role} /></td>
                          <td style={s.td}>{e.nb_ventes}</td>
                          <td style={s.td}><span style={{ fontWeight: 700, color: NAVY }}>{fmt(e.ca_total)} FCFA</span></td>
                          <td style={{ ...s.td, color: MUTED }}>{fmt(e.panier_moyen)} FCFA</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="rp-card-list">
                {(data.employes || []).map((e, i) => <EmployeCard key={e.employe_id} e={e} i={i} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },

  btnPrimary:       { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnExportDisabled:{ display: 'flex', alignItems: 'center', gap: 8, background: BG, color: MUTED, border: `1px solid ${BORDER}`, padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'not-allowed' },
  tooltip:          { position: 'absolute', bottom: '110%', right: 0, background: NAVY, color: WHITE, padding: '6px 12px', borderRadius: 8, fontSize: 12, whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },

  filtreLabel: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' },

  statIcon:  { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:   { fontSize: 14, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statLabel: { fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 3 },

  tableCard:    { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  sectionHeader:{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  tableToolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  resultCount:  { fontSize: 12, color: MUTED, fontWeight: 500 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th:    { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' },
  tr:    { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:    { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },

  badge:  { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  avatar: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },

  loading: { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:   { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default RapportsPage