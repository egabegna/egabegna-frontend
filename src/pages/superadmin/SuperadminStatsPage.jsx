import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import superadminService from '../../services/superadminService'
import {
  ArrowLeft, TrendingUp, ShoppingCart, Store,
  ShieldCheck, Trophy, RefreshCw, Activity,
  Wallet, BarChart3,
} from 'lucide-react'

const D = {
  bg:       '#0B1120',
  surface:  '#131C2E',
  surface2: '#1A2540',
  border:   '#1F2D45',
  text:     '#F0F4FF',
  muted:    '#5B7099',
  subtle:   '#8FA3C4',
  purple:   '#7C5CFC',
  purpleL:  '#9B80FF',
  green:    '#22C55E',
  greenL:   '#BBF7D0',
  red:      '#EF4444',
  redL:     '#FCA5A5',
  redD:     '#450A0A',
  gold:     '#F59E0B',
  cyan:     '#06B6D4',
  cyanL:    '#A5F3FC',
  white:    '#FFFFFF',
}

// ── Courbe SVG ────────────────────────────────
function Courbe({ points, color = D.purple, height = 180 }) {
  if (!points || points.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.muted, fontSize: 13 }}>
      Pas assez de données
    </div>
  )

  const values = points.map(p => Number(p.ca) || 0)
  const max    = Math.max(...values) || 1
  const min    = Math.min(...values)
  const range  = max - min || 1
  const W = 600, H = height, PAD = 16

  const toX = i => PAD + (i / (values.length - 1)) * (W - PAD * 2)
  const toY = v => H - PAD - ((v - min) / range) * (H - PAD * 2 - 10)

  const pathD  = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')
  const areaD  = [`M ${toX(0)} ${H}`, ...values.map((v, i) => `L ${toX(i)} ${toY(v)}`), `L ${toX(values.length - 1)} ${H}`, 'Z'].join(' ')
  const gradId = `grad-${color.replace('#','')}`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1={PAD} x2={W - PAD} y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)}
            stroke={D.border} strokeWidth="1" strokeDasharray="4 4" />
        ))}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(v)} r="5" fill={D.surface} stroke={color} strokeWidth="2.5" />
            <circle cx={toX(i)} cy={toY(v)} r="2" fill={color} />
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '0 16px' }}>
        {points.map((p, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: D.muted }}>
              {new Date(p.periode).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: D.text, marginTop: 2 }}>
              {Number(p.ca).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────
function KpiCard({ label, value, sub, Icon, color, colorBg }) {
  return (
    <div style={s.kpiCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ ...s.kpiVal, color }}>{value}</div>
          {sub && <div style={s.kpiSub}>{sub}</div>}
          <div style={s.kpiLabel}>{label}</div>
        </div>
        <div style={{ ...s.kpiIcon, background: colorBg }}>
          <Icon size={17} color={color} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────
function SuperadminStatsPage() {
  const navigate          = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [groupBy, setGroupBy]     = useState('month')
  const [error, setError]         = useState('')

  const charger = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await superadminService.getStatsGlobales({ groupBy })
      setStats(res.data)
      setError('')
    } catch {
      setError('Erreur de chargement des statistiques.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { charger() }, [groupBy])

  // Variation CA (dernier point vs avant-dernier)
  const variation = stats?.courbe?.length >= 2
    ? (() => {
        const arr = stats.courbe
        const last = Number(arr[arr.length - 1].ca)
        const prev = Number(arr[arr.length - 2].ca)
        return prev > 0 ? Math.round(((last - prev) / prev) * 100) : null
      })()
    : null

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/superadmin/boutiques')} style={s.backBtn}>
            <ArrowLeft size={14} strokeWidth={2.5} /><span>Retour</span>
          </button>
          <div>
            <div style={s.superBadge}>
              <Activity size={10} strokeWidth={2.5} /> SUPERADMIN
            </div>
            <h1 style={s.title}>Statistiques globales</h1>
            <div style={s.titleUnderline} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Groupby toggle */}
          <div style={s.toggleGroup}>
            {[
              { key: 'week',  label: 'Semaine' },
              { key: 'month', label: 'Mois'    },
            ].map(g => (
              <button key={g.key} onClick={() => setGroupBy(g.key)}
                style={{
                  ...s.toggleBtn,
                  background: groupBy === g.key ? D.purple : 'transparent',
                  color:      groupBy === g.key ? D.white  : D.muted,
                }}>
                {g.label}
              </button>
            ))}
          </div>

          <button onClick={() => charger(true)} style={s.refreshBtn} title="Actualiser">
            <RefreshCw size={14} strokeWidth={2} color={refreshing ? D.purple : D.muted}
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {error && <div style={s.alertError}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <p style={{ color: D.muted, fontSize: 14 }}>Chargement des statistiques...</p>
        </div>
      ) : stats && (
        <>
          {/* KPIs */}
          <div style={s.kpiGrid}>
            <KpiCard
              label="Chiffre d'affaires"
              value={Number(stats.ca_total).toLocaleString()}
              sub="FCFA"
              Icon={Wallet}
              color={D.purpleL}
              colorBg='rgba(124,92,252,0.15)'
            />
            <KpiCard
              label="Ventes totales"
              value={stats.nb_ventes}
              Icon={ShoppingCart}
              color={D.cyan}
              colorBg='rgba(6,182,212,0.12)'
            />
            <KpiCard
              label="Boutiques enregistrées"
              value={stats.nb_boutiques}
              Icon={Store}
              color={D.green}
              colorBg='rgba(34,197,94,0.12)'
            />
            <KpiCard
              label="Boutiques actives"
              value={stats.nb_boutiques_actives}
              Icon={ShieldCheck}
              color={D.gold}
              colorBg='rgba(245,158,11,0.12)'
            />
            {variation != null && (
              <KpiCard
                label={`Variation CA (${groupBy === 'week' ? 'sem.' : 'mois'})`}
                value={`${variation >= 0 ? '+' : ''}${variation}%`}
                Icon={variation >= 0 ? TrendingUp : BarChart3}
                color={variation >= 0 ? D.green : D.red}
                colorBg={variation >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}
              />
            )}
          </div>

          {/* Courbe */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.cardTitle}>
                <TrendingUp size={12} color={D.muted} strokeWidth={2} />
                Courbe de croissance — CA par {groupBy === 'week' ? 'semaine' : 'mois'}
              </div>
              {stats.courbe?.length > 0 && (
                <span style={{ fontSize: 11, color: D.muted }}>
                  {stats.courbe.length} période{stats.courbe.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={s.cardDivider} />
            <Courbe points={stats.courbe} color={D.purple} height={180} />
          </div>

          {/* Top boutiques */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.cardTitle}>
                <Trophy size={12} color={D.muted} strokeWidth={2} />
                Top boutiques
              </div>
            </div>
            <div style={s.cardDivider} />

            {!stats.top_boutiques?.length ? (
              <div style={{ textAlign: 'center', padding: '32px', color: D.muted, fontSize: 13 }}>
                Aucune vente enregistrée.
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Rang', 'Boutique', 'Chiffre d\'affaires', 'Nb ventes'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.top_boutiques.map((b, i) => {
                    const initiales = b.boutique_nom
                      ? b.boutique_nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                      : '?'
                    const medalColor = i === 0 ? D.gold : i === 1 ? D.subtle : i === 2 ? '#CD7F32' : D.muted
                    // barre de progression relative
                    const maxCa = Number(stats.top_boutiques[0]?.ca || 1)
                    const pct   = Math.round((Number(b.ca) / maxCa) * 100)

                    return (
                      <tr key={i}
                        style={{ ...s.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                        onMouseEnter={ev => ev.currentTarget.style.backgroundColor = D.surface2}
                        onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                      >
                        {/* Rang */}
                        <td style={{ ...s.td, width: 60 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: medalColor }}>
                            #{i + 1}
                          </span>
                        </td>

                        {/* Boutique */}
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 800,
                              background: i === 0 ? 'rgba(245,158,11,0.18)' : 'rgba(124,92,252,0.15)',
                              color:      i === 0 ? D.gold : D.purpleL,
                              flexShrink: 0,
                            }}>
                              {initiales}
                            </div>
                            <span style={{ fontWeight: 700, color: D.text, fontSize: 13 }}>
                              {b.boutique_nom}
                            </span>
                          </div>
                        </td>

                        {/* CA avec barre */}
                        <td style={s.td}>
                          <div style={{ fontWeight: 800, color: D.purpleL, fontSize: 13, marginBottom: 4 }}>
                            {Number(b.ca).toLocaleString()} FCFA
                          </div>
                          <div style={{ height: 4, background: D.surface2, borderRadius: 2, width: 120 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: D.purple, borderRadius: 2 }} />
                          </div>
                        </td>

                        {/* Nb ventes */}
                        <td style={s.td}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'rgba(6,182,212,0.12)', color: D.cyan,
                            padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          }}>
                            <ShoppingCart size={10} strokeWidth={2} />
                            {b.nb_ventes}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const s = {
  page:          { minHeight: '100vh', background: D.bg, color: D.text, padding: '28px 36px', boxSizing: 'border-box' },
  topbar:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  backBtn:       { display: 'inline-flex', alignItems: 'center', gap: 8, background: D.surface, color: D.subtle, border: `1px solid ${D.border}`, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  superBadge:    { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(124,92,252,0.2)', color: D.purpleL, fontSize: 10, fontWeight: 800, letterSpacing: '2px', padding: '4px 10px', borderRadius: 6, marginBottom: 8, border: '1px solid rgba(124,92,252,0.3)' },
  title:         { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: D.text },
  titleUnderline:{ width: 32, height: 3, background: D.purple, borderRadius: 2, marginTop: 10 },
  toggleGroup:   { display: 'flex', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9, padding: 3, gap: 2 },
  toggleBtn:     { padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s' },
  refreshBtn:    { display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9, width: 38, height: 38, cursor: 'pointer' },
  alertError:    { background: D.redD, border: `1px solid rgba(239,68,68,0.3)`, color: D.redL, borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13 },
  kpiGrid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 },
  kpiCard:       { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, padding: '16px 20px' },
  kpiIcon:       { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiVal:        { fontSize: 22, fontWeight: 800, lineHeight: 1, marginBottom: 2 },
  kpiSub:        { fontSize: 10, color: D.muted, fontWeight: 600, letterSpacing: '1px', marginBottom: 4 },
  kpiLabel:      { fontSize: 11, color: D.muted, fontWeight: 500, marginTop: 4 },
  card:          { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 20 },
  cardHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle:     { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '1.5px' },
  cardDivider:   { height: 1, background: D.border, marginBottom: 20 },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '1.5px', background: D.surface2, borderBottom: `1px solid ${D.border}` },
  tr:            { borderBottom: `1px solid ${D.border}`, transition: 'background 0.1s', cursor: 'default' },
  td:            { padding: '13px 14px', fontSize: 13, verticalAlign: 'middle' },
}

export default SuperadminStatsPage