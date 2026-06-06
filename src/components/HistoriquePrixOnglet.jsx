import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import produitService from '../services/produitService'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'
const ORANGE = '#ea580c'

// ── Tooltip personnalisé ──────────────────────
function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div style={{
      backgroundColor: WHITE,
      border:          `1px solid ${BORDER}`,
      borderRadius:    8,
      padding:         '10px 14px',
      boxShadow:       '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>
        {Number(val).toLocaleString('fr-FR')} FCFA
      </div>
      {payload[0].payload?.fournisseur_nom && (
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          {payload[0].payload.fournisseur_nom}
        </div>
      )}
      {payload[0].payload?.variation_pct !== null &&
       payload[0].payload?.variation_pct !== undefined && (
        <div style={{
          fontSize:   11,
          fontWeight: 700,
          color:      payload[0].payload.variation_pct >= 0 ? RED : GREEN,
          marginTop:  2,
        }}>
          {payload[0].payload.variation_pct >= 0 ? '+' : ''}
          {payload[0].payload.variation_pct}%
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────
function HistoriquePrixOnglet({ produitId }) {
  const [historique, setHistorique] = useState(null)
  const [analyse, setAnalyse]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    Promise.all([
      produitService.historiquePrix(produitId),
      produitService.analysePrix(produitId),
    ]).then(([hRes, aRes]) => {
      setHistorique(hRes.data)
      setAnalyse(aRes.data)
    }).catch(() => {
      setError('Erreur lors du chargement.')
    }).finally(() => setLoading(false))
  }, [produitId])

  if (loading) return (
    <p style={{ color: MUTED, padding: 40, textAlign: 'center' }}>
      Chargement...
    </p>
  )
  if (error) return (
    <p style={{ color: RED, padding: 40, textAlign: 'center' }}>{error}</p>
  )
  if (!historique || historique.nb_entrees === 0) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <TrendingUp size={32} color={MUTED} strokeWidth={1.3} />
      <p style={{ color: MUTED, margin: '12px 0 0', fontSize: 13 }}>
        Aucun historique de prix disponible.
        <br />Les prix sont enregistrés automatiquement à chaque réception.
      </p>
    </div>
  )

  // Données graphique
  const donneesGraphe = [...historique.historique]
    .reverse()
    .map(h => ({
      date:           new Date(h.date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short',
      }),
      prix:           Number(h.prix_achat),
      fournisseur_nom:h.fournisseur_nom,
      variation_pct:  h.variation_pct,
    }))

  const prixMin = Math.min(...donneesGraphe.map(d => d.prix))
  const prixMax = Math.max(...donneesGraphe.map(d => d.prix))

  return (
    <div>
      {/* Badge hausse anormale */}
      {analyse?.hausse_anormale && (
        <div style={s.alertHausse}>
          <AlertTriangle size={16} color={ORANGE} strokeWidth={2} />
          <div>
            <strong>Hausse anormale détectée</strong>
            <span style={{ marginLeft: 8, fontSize: 12 }}>
              +{analyse.variation_3_mois || analyse.variation_globale}%
              sur les 3 derniers mois — seuil : {analyse.seuil_alerte_pct}%
            </span>
          </div>
        </div>
      )}

      {/* KPIs variation */}
      {analyse?.analyse_possible && (
        <div style={s.kpiRow}>
          <KpiVariation
            label="Variation globale"
            valeur={analyse.variation_globale}
          />
          <KpiVariation
            label="Variation 3 mois"
            valeur={analyse.variation_3_mois}
          />
          <KpiVariation
            label="Variation 6 mois"
            valeur={analyse.variation_6_mois}
          />
          {analyse.meilleur_fournisseur && (
            <div style={s.kpiCard}>
              <div style={s.kpiLabel}>Meilleur prix</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>
                {analyse.meilleur_fournisseur.nom}
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>
                {Number(analyse.meilleur_fournisseur.prix_moyen).toLocaleString()} FCFA moy.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Graphique linéaire */}
      <div style={s.card}>
        <div style={s.cardTitle}>Évolution du prix d'achat</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={donneesGraphe}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: MUTED }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: MUTED }}
              axisLine={false}
              tickLine={false}
              domain={[prixMin * 0.95, prixMax * 1.05]}
              tickFormatter={v => `${(v/1000).toFixed(0)}k`}
            />
            <Tooltip content={<TooltipCustom />} />
            <ReferenceLine
              y={prixMin}
              stroke={GREEN}
              strokeDasharray="4 4"
              label={{ value: 'Min', fill: GREEN, fontSize: 10 }}
            />
            <ReferenceLine
              y={prixMax}
              stroke={RED}
              strokeDasharray="4 4"
              label={{ value: 'Max', fill: RED, fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="prix"
              stroke={NAVY}
              strokeWidth={2.5}
              dot={{ fill: NAVY, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: GOLD }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau comparatif fournisseurs */}
      {analyse?.comparaison_fournisseurs?.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>Comparaison fournisseurs</div>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Fournisseur', 'Prix moyen', 'Prix min', 'Prix max', 'Livraisons'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyse.comparaison_fournisseurs.map((f, i) => (
                <tr key={f.fournisseur_id} style={{
                  ...s.tr,
                  background: i === 0 ? '#EBF5EF' : i % 2 === 0 ? WHITE : '#FAFBFC',
                }}>
                  <td style={s.td}>
                    <span style={{ fontWeight: 600, color: NAVY }}>
                      {f.fournisseur_nom}
                    </span>
                    {i === 0 && (
                      <span style={s.badgeMeilleur}>Meilleur prix</span>
                    )}
                  </td>
                  <td style={{ ...s.td, fontWeight: 700, color: i === 0 ? GREEN : NAVY }}>
                    {Number(f.prix_moyen).toLocaleString()} FCFA
                  </td>
                  <td style={{ ...s.td, color: GREEN }}>
                    {Number(f.prix_min).toLocaleString()} FCFA
                  </td>
                  <td style={{ ...s.td, color: RED }}>
                    {Number(f.prix_max).toLocaleString()} FCFA
                  </td>
                  <td style={{ ...s.td, color: MUTED }}>
                    {f.nb_livraisons}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tableau historique brut */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          Historique détaillé ({historique.nb_entrees} entrée(s))
        </div>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              {['Date', 'Prix achat', 'Variation', 'Fournisseur', 'Réception'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historique.historique.map((h, i) => (
              <tr key={h.id} style={{
                ...s.tr,
                background: i % 2 === 0 ? WHITE : '#FAFBFC',
              }}>
                <td style={s.td}>
                  {new Date(h.date).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ ...s.td, fontWeight: 700, color: NAVY }}>
                  {Number(h.prix_achat).toLocaleString()} FCFA
                </td>
                <td style={s.td}>
                  {h.variation_pct !== null ? (
                    <span style={{
                      display:         'inline-flex',
                      alignItems:      'center',
                      gap:             4,
                      fontSize:        12,
                      fontWeight:      700,
                      color:           h.variation_pct > 0 ? RED : GREEN,
                    }}>
                      {h.variation_pct > 0
                        ? <TrendingUp  size={12} strokeWidth={2.5} />
                        : <TrendingDown size={12} strokeWidth={2.5} />
                      }
                      {h.variation_pct > 0 ? '+' : ''}{h.variation_pct}%
                      {h.variation_pct > 20 && (
                        <AlertTriangle size={11} color={ORANGE} strokeWidth={2.5} />
                      )}
                    </span>
                  ) : '—'}
                </td>
                <td style={s.td}>{h.fournisseur_nom}</td>
                <td style={{ ...s.td, color: MUTED }}>
                  {h.reception_id ? `#${h.reception_id}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── KPI variation ─────────────────────────────
function KpiVariation({ label, valeur }) {
  if (valeur === null || valeur === undefined) return (
    <div style={s.kpiCard}>
      <div style={s.kpiLabel}>{label}</div>
      <div style={{ fontSize: 14, color: MUTED }}>—</div>
    </div>
  )

  const positif = valeur >= 0
  return (
    <div style={s.kpiCard}>
      <div style={s.kpiLabel}>{label}</div>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        5,
        fontSize:   18,
        fontWeight: 800,
        color:      positif ? RED : GREEN,
      }}>
        {positif
          ? <TrendingUp  size={16} strokeWidth={2} />
          : <TrendingDown size={16} strokeWidth={2} />
        }
        {positif ? '+' : ''}{valeur}%
      </div>
    </div>
  )
}

const s = {
  alertHausse: {
    display:         'flex',
    alignItems:      'center',
    gap:             10,
    backgroundColor: '#FFF4E6',
    border:          `1px solid #fed7aa`,
    color:           ORANGE,
    borderRadius:    10,
    padding:         '12px 16px',
    marginBottom:    16,
    fontSize:        13,
  },
  kpiRow:   { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  kpiCard:  { flex: 1, minWidth: 120, backgroundColor: WHITE,
              border: `1px solid ${BORDER}`, borderRadius: 10,
              padding: '12px 16px' },
  kpiLabel: { fontSize: 10, fontWeight: 600, color: MUTED,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  card:     { backgroundColor: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: '16px 20px', marginBottom: 16 },
  cardTitle:{ fontSize: 11, fontWeight: 700, color: NAVY,
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 },
  table:    { width: '100%', borderCollapse: 'collapse' },
  thead:    { backgroundColor: BG },
  th:       { padding: '9px 14px', textAlign: 'left', fontSize: 10,
              fontWeight: 700, color: MUTED, textTransform: 'uppercase',
              letterSpacing: '1.5px' },
  tr:       { borderBottom: `1px solid ${BG}` },
  td:       { padding: '11px 14px', fontSize: 13, verticalAlign: 'middle' },
  badgeMeilleur: {
    marginLeft:      8,
    backgroundColor: '#EBF5EF',
    color:           GREEN,
    fontSize:        10,
    fontWeight:      700,
    padding:         '2px 6px',
    borderRadius:    20,
  },
}

export default HistoriquePrixOnglet