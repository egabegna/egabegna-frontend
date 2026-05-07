import { useState, useEffect } from 'react'
import { useAuthContext } from '../store/AuthContext'
import rapportService from '../services/rapportService'
import MiniChart from '../components/shared/MiniChart'

function KPICard({ label, value, sub, color = '#2563eb', icon }) {
  return (
    <div style={ds.kpiCard}>
      <div style={ds.kpiIcon}>{icon}</div>
      <div style={{ ...ds.kpiVal, color }}>{value}</div>
      <div style={ds.kpiLabel}>{label}</div>
      {sub && <div style={ds.kpiSub}>{sub}</div>}
    </div>
  )
}

function AlerteStock({ produit }) {
  const couleur = produit.stock === 0 ? '#dc2626' : '#d97706'
  const bg      = produit.stock === 0 ? '#fee2e2' : '#fef3c7'
  return (
    <div style={{ ...ds.alerteItem, backgroundColor: bg, borderColor: couleur }}>
      <span style={{ fontWeight: 600, color: couleur }}>
        {produit.stock === 0 ? '🔴 Rupture' : '🟡 Stock faible'}
      </span>
      <span style={{ fontSize: 14, marginLeft: 8 }}>{produit.nom}</span>
      <span style={{ marginLeft: 'auto', color: couleur, fontWeight: 600 }}>
        {produit.stock} unité(s)
      </span>
    </div>
  )
}

function DashboardPage() {
  const { role, nom_boutique }      = useAuthContext()
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
    const debut7 = fmt(il7j)
    const fin    = fmt(today)
    const debutJ = fin

    Promise.all([
      rapportService.dashboard({ date_debut: debutJ, date_fin: fin }),
      rapportService.ventes({ groupBy: 'day', date_debut: debut7, date_fin: fin }),
      rapportService.topProduits({ limite: 5, date_debut: debut7, date_fin: fin }),
    ]).then(([dRes, vRes, tRes]) => {
      setDashboard(dRes.data)
      setRapportSemaine(vRes.data)
      setTopProduits(tRes.data.produits || [])
    }).catch(() => {})
    .finally(() => setLoading(false))

    // Alertes stock faible
    import('../services/produitService').then(m => {
      m.default.getProduits({ stock_faible: 'true', actif: 'true' })
        .then(r => setAlertes(r.data.slice(0, 5)))
        .catch(() => {})
    })
  }, [])

  if (loading) return <div style={ds.page}><p style={ds.loading}>Chargement...</p></div>

  const ca        = Number(dashboard?.chiffre_affaires?.total || 0)
  const benefice  = Number(dashboard?.benefice_brut || 0)
  const depenses  = Number(dashboard?.depenses?.total || 0)
  const creances  = Number(dashboard?.creances?.total_restant || 0)
  const nbVentes  = dashboard?.chiffre_affaires?.nb_ventes || 0

  return (
    <div style={ds.page}>
      <div style={ds.header}>
        <div>
          <h1 style={ds.title}>Dashboard</h1>
          <p style={ds.sub}>{nom_boutique} · Aujourd'hui</p>
        </div>
      </div>

      {/* KPIs du jour */}
      <div style={ds.kpiGrid}>
        <KPICard icon="💰" label="CA du jour"      value={`${ca.toLocaleString()} FCFA`}
          sub={`${nbVentes} vente(s)`} color="#2563eb" />
        <KPICard icon="📈" label="Bénéfice brut"  value={`${benefice.toLocaleString()} FCFA`}
          color="#16a34a" />
        <KPICard icon="💸" label="Dépenses"        value={`${depenses.toLocaleString()} FCFA`}
          color="#d97706" />
        <KPICard icon="📋" label="Créances actives" value={`${creances.toLocaleString()} FCFA`}
          sub={`${dashboard?.creances?.nb_actives || 0} client(s)`} color="#7c3aed" />
      </div>

      <div style={ds.mainGrid}>
        {/* Graphique 7 jours */}
        <div style={ds.chartCard}>
          <div style={ds.cardTitle}>Ventes — 7 derniers jours</div>
          <MiniChart
            points={rapportSemaine?.points || []}
            color="#2563eb"
            height={120}
          />
          <div style={ds.chartLegend}>
            {(rapportSemaine?.points || []).map((p, i) => (
              <div key={i} style={ds.chartPoint}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  {new Date(p.periode).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {Number(p.ca).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top 5 produits */}
          <div style={ds.card}>
            <div style={ds.cardTitle}>Top 5 produits</div>
            {topProduits.length === 0
              ? <p style={ds.empty}>Aucune vente récente.</p>
              : topProduits.map((p, i) => (
                <div key={p.produit_id} style={ds.topRow}>
                  <span style={ds.topRang}>#{p.rang}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{p.produit_nom}</span>
                  <span style={ds.topQte}>{p.qte_vendue} vendus</span>
                  <span style={ds.topCA}>{Number(p.ca).toLocaleString()} FCFA</span>
                </div>
              ))
            }
          </div>

          {/* Alertes stock */}
          {alertes.length > 0 && (
            <div style={ds.card}>
              <div style={ds.cardTitle}>⚠️ Alertes stock</div>
              {alertes.map(p => <AlerteStock key={p.id} produit={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ds = {
  page:    { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
  header:  { marginBottom: 24 },
  title:   { fontSize: 26, fontWeight: 800, margin: 0 },
  sub:     { fontSize: 13, color: '#6b7280', marginTop: 4 },
  loading: { color: '#9ca3af', textAlign: 'center', padding: 60 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  kpiCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 16px', textAlign: 'center' },
  kpiIcon: { fontSize: 28, marginBottom: 8 },
  kpiVal:  { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  kpiLabel:{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSub:  { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  mainGrid:{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 },
  chartCard:{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 },
  card:    { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 },
  cardTitle:{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#374151' },
  chartLegend: { display: 'flex', justifyContent: 'space-between', marginTop: 8 },
  chartPoint:  { textAlign: 'center', flex: 1 },
  topRow:  { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f9fafb' },
  topRang: { fontSize: 13, color: '#9ca3af', fontWeight: 700, width: 24 },
  topQte:  { fontSize: 12, color: '#6b7280' },
  topCA:   { fontSize: 13, fontWeight: 700, color: '#2563eb' },
  alerteItem: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 8, border: '1px solid', marginBottom: 8, fontSize: 13 },
  empty:   { color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 12 },
}

export default DashboardPage