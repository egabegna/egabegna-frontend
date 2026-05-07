import { useState, useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import rapportService from '../services/rapportService'
import MiniChart from '../components/shared/MiniChart'

function BoutonExport({ label }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        style={rp.btnExportDisabled}
        disabled>
        📥 {label}
      </button>
      {showTip && (
        <div style={rp.tooltip}>
          Disponible en v2
        </div>
      )}
    </div>
  )
}

function RapportsPage() {
  const today  = new Date().toISOString().split('T')[0]
  const il30j  = new Date(); il30j.setDate(il30j.getDate() - 30)
  const deb30  = il30j.toISOString().split('T')[0]

  const [onglet, setOnglet]       = useState('ventes')
  const [periode, setPeriode]     = useState({ date_debut: deb30, date_fin: today })
  const [groupBy, setGroupBy]     = useState('day')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)

  const charger = useCallback(async () => {
    setLoading(true)
    setData(null)
    try {
      let res
      if (onglet === 'ventes') {
        res = await rapportService.ventes({ ...periode, groupBy })
      } else if (onglet === 'produits') {
        res = await rapportService.topProduits({ ...periode, limite: 20 })
      } else {
        res = await rapportService.employes(periode)
      }
      setData(res.data)
    } catch { }
    finally { setLoading(false) }
  }, [onglet, periode, groupBy])

  return (
    <div style={rp.page}>
      <div style={rp.header}>
        <h1 style={rp.title}>Rapports</h1>
        <BoutonExport label="Exporter" />
      </div>

      {/* Onglets */}
      <div style={rp.tabs}>
        {[
          ['ventes',   '📈 Ventes'],
          ['produits', '📦 Top Produits'],
          ['employes', '👥 Employés'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => { setOnglet(k); setData(null) }}
            style={{ ...rp.tab,
                     borderBottom: onglet === k ? '3px solid #111827' : '3px solid transparent',
                     fontWeight: onglet === k ? 700 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div style={rp.filtres}>
        <input type="date" value={periode.date_debut}
          onChange={e => setPeriode(p => ({ ...p, date_debut: e.target.value }))}
          style={rp.dateInput} />
        <span style={{ color: '#9ca3af' }}>→</span>
        <input type="date" value={periode.date_fin}
          onChange={e => setPeriode(p => ({ ...p, date_fin: e.target.value }))}
          style={rp.dateInput} />

        {onglet === 'ventes' && (
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={rp.select}>
            <option value="day">Par jour</option>
            <option value="week">Par semaine</option>
            <option value="month">Par mois</option>
          </select>
        )}

        <button onClick={charger} disabled={loading} style={rp.btnGenerer}>
          {loading ? 'Calcul...' : '▶ Générer'}
        </button>
      </div>

      {/* Résultats */}
      {loading && <p style={rp.loading}>Calcul en cours...</p>}

      {data && onglet === 'ventes' && (
        <div>
          {/* KPIs */}
          <div style={rp.kpiRow}>
            {[
              { label: "CA total",    val: `${Number(data.totaux?.ca || 0).toLocaleString()} FCFA`, color: '#2563eb' },
              { label: "Nb ventes",   val: data.totaux?.nb_ventes || 0, color: '#374151' },
              { label: "Bénéfice",    val: `${Number(data.totaux?.benefice || 0).toLocaleString()} FCFA`, color: '#16a34a' },
              { label: "Coût achat",  val: `${Number(data.totaux?.cout_achat || 0).toLocaleString()} FCFA`, color: '#d97706' },
            ].map(k => (
              <div key={k.label} style={rp.kpiCard}>
                <div style={{ ...rp.kpiVal, color: k.color }}>{k.val}</div>
                <div style={rp.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Graphique */}
          <div style={rp.chartCard}>
            <div style={rp.cardTitle}>
              Évolution des ventes ({groupBy === 'day' ? 'par jour' : groupBy === 'week' ? 'par semaine' : 'par mois'})
            </div>
            <MiniChart points={data.points || []} color="#2563eb" height={140} />

            {/* Tableau des points */}
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
              <table style={rp.table}>
                <thead><tr style={rp.thead}>
                  <th style={rp.th}>Période</th>
                  <th style={rp.th}>CA</th>
                  <th style={rp.th}>Nb ventes</th>
                </tr></thead>
                <tbody>
                  {(data.points || []).map((p, i) => (
                    <tr key={i} style={rp.tr}>
                      <td style={rp.td}>
                        {p.periode
                          ? new Date(p.periode).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td style={{ ...rp.td, fontWeight: 600, color: '#2563eb' }}>
                        {Number(p.ca).toLocaleString()} FCFA
                      </td>
                      <td style={rp.td}>{p.nb_ventes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {data && onglet === 'produits' && (
        <div style={rp.chartCard}>
          <div style={rp.cardTitle}>Top produits par quantité vendue</div>
          <table style={rp.table}>
            <thead><tr style={rp.thead}>
              {['Rang','Produit','Qté vendue','CA','Bénéfice'].map(h => (
                <th key={h} style={rp.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(data.produits || []).map(p => (
                <tr key={p.produit_id} style={rp.tr}>
                  <td style={{ ...rp.td, fontWeight: 700, color: '#9ca3af' }}>#{p.rang}</td>
                  <td style={{ ...rp.td, fontWeight: 600 }}>{p.produit_nom}</td>
                  <td style={rp.td}>{p.qte_vendue}</td>
                  <td style={{ ...rp.td, color: '#2563eb', fontWeight: 600 }}>
                    {Number(p.ca).toLocaleString()} FCFA
                  </td>
                  <td style={{ ...rp.td, color: '#16a34a', fontWeight: 600 }}>
                    {Number(p.benefice).toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data.produits || []).length === 0 && (
            <p style={rp.empty}>Aucune vente sur la période.</p>
          )}
        </div>
      )}

      {data && onglet === 'employes' && (
        <div style={rp.chartCard}>
          <div style={rp.cardTitle}>Performance par employé</div>
          <table style={rp.table}>
            <thead><tr style={rp.thead}>
              {['Employé','Rôle','Nb ventes','CA total','Panier moyen'].map(h => (
                <th key={h} style={rp.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(data.employes || []).map(e => (
                <tr key={e.employe_id} style={rp.tr}>
                  <td style={{ ...rp.td, fontWeight: 600 }}>{e.employe_nom}</td>
                  <td style={rp.td}>
                    <span style={rp.roleBadge}>{e.employe_role}</span>
                  </td>
                  <td style={rp.td}>{e.nb_ventes}</td>
                  <td style={{ ...rp.td, color: '#2563eb', fontWeight: 600 }}>
                    {Number(e.ca_total).toLocaleString()} FCFA
                  </td>
                  <td style={rp.td}>{Number(e.panier_moyen).toLocaleString()} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data.employes || []).length === 0 && (
            <p style={rp.empty}>Aucune donnée.</p>
          )}
        </div>
      )}

      {!data && !loading && (
        <div style={rp.empty}>
          Sélectionnez une période et cliquez sur Générer.
        </div>
      )}
    </div>
  )
}

const rp = {
  page:    { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  tabs:    { display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20 },
  tab:     { background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer', fontSize: 14, transition: 'border 0.15s' },
  filtres: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  dateInput: { padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 },
  select:  { padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, backgroundColor: '#fff' },
  btnGenerer: { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnExportDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: 'not-allowed' },
  tooltip: { position: 'absolute', bottom: '110%', right: 0, backgroundColor: '#111827', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap', zIndex: 10 },
  kpiRow:  { display: 'flex', gap: 12, marginBottom: 16 },
  kpiCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', flex: 1, textAlign: 'center' },
  kpiVal:  { fontSize: 18, fontWeight: 800, marginBottom: 4 },
  kpiLabel:{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' },
  chartCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 },
  cardTitle: { fontSize: 14, fontWeight: 700, marginBottom: 16 },
  table:   { width: '100%', borderCollapse: 'collapse' },
  thead:   { backgroundColor: '#f9fafb' },
  th:      { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' },
  tr:      { borderBottom: '1px solid #f3f4f6' },
  td:      { padding: '12px 14px', fontSize: 14 },
  roleBadge: { backgroundColor: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 8, fontSize: 12 },
  loading: { color: '#9ca3af', textAlign: 'center', padding: 40 },
  empty:   { textAlign: 'center', color: '#9ca3af', padding: 40 },
}

export default RapportsPage