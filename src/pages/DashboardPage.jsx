import { useState, useEffect } from 'react'
import { useAuthContext } from '../store/AuthContext'
import api from '../services/api'
import rapportService from '../services/rapportService'
import MiniChart from '../components/shared/MiniChart'
import {
  TrendingUp, ShoppingBag, CreditCard, AlertTriangle, Users, Circle,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const BORDER = '#EAECEF'

// ─── Hook responsive ──────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ─── KPICard ──────────────────────────────────
function KPICard({ label, value, sub, color, bg, Icon, isMobile }) {
  return (
    <div style={{
      ...ds.kpiCard,
      padding: isMobile ? '16px 14px 14px' : '22px 20px 18px',
      borderRadius: isMobile ? 12 : 16,
    }}>
      <div style={{ ...ds.kpiAccent, background: color }} />
      <div style={{
        ...ds.kpiIconWrap,
        background: bg,
        width:  isMobile ? 32 : 38,
        height: isMobile ? 32 : 38,
        borderRadius: isMobile ? 9 : 11,
        marginBottom: isMobile ? 10 : 16,
      }}>
        <Icon size={isMobile ? 15 : 18} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ ...ds.kpiLabel, fontSize: isMobile ? 9 : 11 }}>{label}</div>
      <div style={{ ...ds.kpiVal, color, fontSize: isMobile ? 16 : 21 }}>{value}</div>
      {sub && <div style={{ ...ds.kpiSub, fontSize: isMobile ? 10 : 11 }}>{sub}</div>}
    </div>
  )
}

// ─── AlerteStock ──────────────────────────────
function AlerteStock({ produit }) {
  const rupture = produit.stock === 0
  const color   = rupture ? '#c0392b' : '#C89A3C'
  const bg      = rupture ? '#fef1f1' : '#fef8ec'
  return (
    <div style={{ ...ds.alerteItem, background: bg }}>
      <Circle size={7} color={color} fill={color} strokeWidth={0} style={{ flexShrink: 0 }} />
      <span style={ds.alerteNom}>{produit.nom}</span>
      <span style={{ ...ds.alerteStock, color }}>
        {rupture ? 'Rupture' : `${produit.stock} unité(s)`}
      </span>
    </div>
  )
}

// ─── DashboardPage ────────────────────────────
function DashboardPage() {
  const { nom_boutique, role }      = useAuthContext()
  const isMobile                    = useIsMobile()
  const [dashboard, setDashboard]   = useState(null)
  const [rapportSemaine, setRapportSemaine] = useState(null)
  const [topProduits, setTopProduits] = useState([])
  const [alertes, setAlertes]       = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const today  = new Date()
    const il7j   = new Date(today)
    il7j.setDate(today.getDate() - 6)
    const fmt    = d => d.toISOString().split('T')[0]
    const debutJ = fmt(today)
    const isManager = ['proprietaire', 'manager'].includes(role)

    if (isManager) {
      Promise.all([
        rapportService.dashboard({ date_debut: debutJ, date_fin: debutJ }),
        rapportService.ventes({ groupBy: 'day', date_debut: fmt(il7j), date_fin: debutJ }),
        rapportService.topProduits({ limite: 5, date_debut: fmt(il7j), date_fin: debutJ }),
      ]).then(([dRes, vRes, tRes]) => {
        setDashboard(dRes.data)
        setRapportSemaine(vRes.data)
        setTopProduits(tRes.data.produits || [])
      }).catch(() => {})
      .finally(() => setLoading(false))
    } else {
      api.get('/api/ventes/', { params: { date_debut: debutJ, date_fin: debutJ } })
        .then(res => {
          const ventes  = res.data.results || res.data
          const totalCA = ventes.reduce((acc, v) => acc + Number(v.total || 0), 0)
          setDashboard({
            chiffre_affaires: { total: totalCA, nb_ventes: ventes.length },
            benefice_brut: totalCA,
            depenses: { total: 0, par_type: [] },
            creances: { total_restant: 0, nb_actives: 0 },
            resultat_net: totalCA,
          })
          setRapportSemaine(null)
        }).catch(() => {})
        .finally(() => setLoading(false))

      rapportService.topProduits({ limite: 5 })
        .then(res => setTopProduits(res.data.produits || []))
        .catch(() => {})
    }

    import('../services/produitService').then(m => {
      m.default.getProduits({ stock_faible: 'true', actif: 'true' })
        .then(r => setAlertes(r.data.slice(0, 5)))
        .catch(() => {})
    })
  }, [role])

  if (loading) return <div style={ds.page}><p style={ds.loading}>Chargement…</p></div>

  const ca       = Number(dashboard?.chiffre_affaires?.total || 0)
  const benefice = Number(dashboard?.benefice_brut || 0)
  const depenses = Number(dashboard?.depenses?.total || 0)
  const creances = Number(dashboard?.creances?.total_restant || 0)
  const nbVentes = dashboard?.chiffre_affaires?.nb_ventes || 0
  const maxCA    = Math.max(...(topProduits.map(p => Number(p.ca))), 1)

  const dateStr  = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const kpis = [
    { Icon: ShoppingBag, label: "Chiffre d'affaires", value: `${ca.toLocaleString()} FCFA`,       sub: `${nbVentes} vente(s) aujourd'hui`, color: '#1B2D5B', bg: '#EEF1F8' },
    { Icon: TrendingUp,  label: 'Bénéfice brut',       value: `${benefice.toLocaleString()} FCFA`, sub: null,                               color: '#2D7A4F', bg: '#EBF5EF' },
    { Icon: CreditCard,  label: 'Dépenses',             value: `${depenses.toLocaleString()} FCFA`, sub: null,                               color: '#C89A3C', bg: '#FBF5E9' },
    { Icon: Users,       label: 'Créances actives',     value: `${creances.toLocaleString()} FCFA`, sub: `${dashboard?.creances?.nb_actives || 0} client(s)`, color: '#546e7a', bg: '#EEF2F4' },
  ]

  return (
    <div style={{
      ...ds.page,
      padding: isMobile ? '16px 12px' : '36px 32px',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        ...ds.header,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        gap: isMobile ? 6 : 0,
        marginBottom: isMobile ? 20 : 32,
      }}>
        <div>
          <p style={ds.headerEyebrow}>Tableau de bord</p>
          <h1 style={{ ...ds.title, fontSize: isMobile ? 22 : 28 }}>{nom_boutique}</h1>
          <div style={ds.titleUnderline} />
        </div>
        <div style={{
          ...ds.headerDate,
          // Sur mobile, date sous le titre, pas à droite
          paddingTop: isMobile ? 8 : 4,
        }}>
          {dateStr}
        </div>
      </div>

      {/* ── KPI GRID — 2×2 sur mobile, 4 colonnes sur desktop ── */}
      <div style={{
        ...ds.kpiGrid,
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 10 : 14,
        marginBottom: isMobile ? 14 : 20,
      }}>
        {kpis.map(k => (
          <KPICard key={k.label} {...k} isMobile={isMobile} />
        ))}
      </div>

      {/* ── MAIN GRID — colonne unique sur mobile ── */}
      <div style={{
        ...ds.mainGrid,
        gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
        gap: isMobile ? 12 : 14,
      }}>

        {/* Graphique ventes */}
        <div style={{
          ...ds.chartCard,
          padding: isMobile ? 16 : 24,
          borderRadius: isMobile ? 12 : 16,
        }}>
          <div style={ds.cardHeader}>
            <span style={ds.cardTitle}>Ventes · 7 derniers jours</span>
          </div>
          {rapportSemaine ? (
            <>
              <MiniChart points={rapportSemaine.points || []} color="#1B2D5B" height={isMobile ? 90 : 120} />
              {/* Légende : scrollable horizontalement sur mobile */}
              <div style={{
                ...ds.chartLegend,
                overflowX: isMobile ? 'auto' : 'visible',
                gap: isMobile ? 0 : undefined,
                paddingBottom: isMobile ? 4 : 0,
              }}>
                {(rapportSemaine.points || []).map((p, i) => (
                  <div key={i} style={{
                    ...ds.chartPoint,
                    minWidth: isMobile ? 44 : undefined,
                  }}>
                    <div style={ds.chartDay}>
                      {new Date(p.periode).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ ...ds.chartAmount, fontSize: isMobile ? 10 : 11 }}>
                      {Number(p.ca).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={ds.empty}>Graphique disponible pour managers.</p>
          )}
        </div>

        {/* Colonne latérale */}
        <div style={ds.sideCol}>

          {/* Top 5 produits */}
          <div style={{
            ...ds.card,
            padding: isMobile ? 16 : 22,
            borderRadius: isMobile ? 12 : 16,
          }}>
            <div style={ds.cardHeader}>
              <span style={ds.cardTitle}>Top 5 produits</span>
            </div>
            {topProduits.length === 0
              ? <p style={ds.empty}>Aucune vente récente.</p>
              : topProduits.map((p, i) => {
                  const pct    = Math.round((Number(p.ca) / maxCA) * 100)
                  const isGold = i >= 3
                  return (
                    <div key={p.produit_id} style={{
                      ...ds.topRow,
                      borderBottom: i < topProduits.length - 1 ? '1px solid #F0F0F0' : 'none',
                      padding: isMobile ? '8px 0' : '10px 0',
                      gap: isMobile ? 8 : 12,
                    }}>
                      <span style={{ ...ds.topRang, fontSize: isMobile ? 12 : 13 }}>
                        {String(p.rang).padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...ds.topNom, fontSize: isMobile ? 12 : 13 }}>{p.produit_nom}</div>
                        <div style={ds.topBarBg}>
                          <div style={{
                            ...ds.topBarFill,
                            width: `${pct}%`,
                            background: isGold ? '#C89A3C' : '#1B2D5B',
                            opacity: isGold ? 0.65 : (1 - i * 0.18),
                          }} />
                        </div>
                      </div>
                      <div style={ds.topRight}>
                        <div style={{ ...ds.topCA, fontSize: isMobile ? 11 : 12 }}>
                          {Number(p.ca).toLocaleString()} F
                        </div>
                        <div style={ds.topQte}>{p.qte_vendue} vendus</div>
                      </div>
                    </div>
                  )
                })
            }
          </div>

          {/* Alertes stock */}
          {alertes.length > 0 && (
            <div style={{
              ...ds.card,
              padding: isMobile ? 16 : 22,
              borderRadius: isMobile ? 12 : 16,
            }}>
              <div style={ds.cardHeader}>
                <span style={ds.cardTitle}>Alertes stock</span>
                <AlertTriangle size={14} color="#C89A3C" strokeWidth={2} />
              </div>
              {alertes.map(p => <AlerteStock key={p.id} produit={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ds = {
  page:           { padding: '36px 32px', maxWidth: 1120, margin: '0 auto', background: BG, minHeight: '100vh', fontFamily: "'DM Sans', 'Inter', sans-serif" },
  header:         { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 },
  headerEyebrow:  { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:          { fontSize: 28, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline: { width: 36, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  headerDate:     { fontSize: 12, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'capitalize', paddingTop: 4 },
  loading:        { color: MUTED, textAlign: 'center', padding: 80, letterSpacing: '1px', fontSize: 13 },
  kpiGrid:        { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 },
  kpiCard:        { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 20px 18px', position: 'relative', overflow: 'hidden' },
  kpiAccent:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0' },
  kpiIconWrap:    { width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  kpiLabel:       { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: MUTED, marginBottom: 6 },
  kpiVal:         { fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 },
  kpiSub:         { fontSize: 11, color: MUTED, marginTop: 2 },
  mainGrid:       { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 },
  sideCol:        { display: 'flex', flexDirection: 'column', gap: 14 },
  chartCard:      { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 },
  card:           { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 },
  cardHeader:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` },
  cardTitle:      { fontSize: 11, fontWeight: 700, color: NAVY, letterSpacing: '2px', textTransform: 'uppercase' },
  chartLegend:    { display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` },
  chartPoint:     { textAlign: 'center', flex: 1 },
  chartDay:       { fontSize: 10, color: MUTED, fontWeight: 500, marginBottom: 3, textTransform: 'capitalize' },
  chartAmount:    { fontSize: 11, fontWeight: 700, color: NAVY },
  topRow:         { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' },
  topRang:        { fontSize: 13, fontWeight: 800, color: GOLD, width: 24, flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  topNom:         { fontSize: 13, color: NAVY, fontWeight: 500, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  topBarBg:       { height: 3, background: BG, borderRadius: 2, overflow: 'hidden' },
  topBarFill:     { height: '100%', borderRadius: 2 },
  topRight:       { textAlign: 'right', flexShrink: 0 },
  topCA:          { fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 2 },
  topQte:         { fontSize: 10, color: MUTED },
  alerteItem:     { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, marginBottom: 8 },
  alerteNom:      { flex: 1, fontSize: 13, color: NAVY, fontWeight: 500 },
  alerteStock:    { fontSize: 11, fontWeight: 700 },
  empty:          { color: MUTED, fontSize: 13, textAlign: 'center', padding: 20 },
}

export default DashboardPage