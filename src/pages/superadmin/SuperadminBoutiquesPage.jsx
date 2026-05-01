import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuperadmin } from '../../store/SuperadminContext'
import superadminService from '../../services/superadminService'

function SuperadminBoutiquesPage() {
  const { saLogout }  = useSuperadmin()
  const navigate      = useNavigate()
  const [boutiques, setBoutiques] = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          superadminService.getBoutiques(),
          superadminService.getStats(),
        ])
        setBoutiques(bRes.data)
        setStats(sRes.data)
      } catch {
        setError('Erreur lors du chargement.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div style={styles.page}><p style={styles.loading}>Chargement...</p></div>

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <span style={styles.badge}>SUPERADMIN</span>
          <h1 style={styles.title}>Gestion des boutiques</h1>
        </div>
        <button onClick={saLogout} style={styles.logoutBtn}>Déconnexion</button>
      </div>

      {error && <div style={styles.alertError}>{error}</div>}

      {stats && (
        <div style={styles.statsRow}>
          <StatCard label="Total"   value={stats.boutiques_total}   color="#3b82f6" />
          <StatCard label="Actives" value={stats.boutiques_actives} color="#22c55e" />
          <StatCard label="Bloquées" value={stats.boutiques_bloquees} color="#ef4444" />
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Boutique</th>
              <th style={styles.th}>Propriétaire</th>
              <th style={styles.th}>Employés</th>
              <th style={styles.th}>Date inscription</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {boutiques.map(b => (
              <tr key={b.id} style={styles.tr}
                onClick={() => navigate(`/superadmin/boutiques/${b.id}`)}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={styles.td}>{b.nom}</td>
                <td style={styles.td}>
                  <div>{b.proprietaire_nom}</div>
                  <div style={styles.email}>{b.proprietaire_email}</div>
                </td>
                <td style={styles.td}>{b.nb_employes}</td>
                <td style={styles.td}>
                  {new Date(b.date_inscription).toLocaleDateString('fr-FR')}
                </td>
                <td style={styles.td}>
                  <Badge active={b.active} />
                </td>
                <td style={styles.td} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/superadmin/boutiques/${b.id}`)}
                    style={styles.detailBtn}>
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {boutiques.length === 0 && (
          <p style={styles.empty}>Aucune boutique enregistrée.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

function Badge({ active }) {
  return (
    <span style={{
      ...styles.badge2,
      backgroundColor: active ? '#14532d' : '#450a0a',
      color: active ? '#86efac' : '#fca5a5',
    }}>
      {active ? '● Actif' : '● Bloqué'}
    </span>
  )
}

const styles = {
  page:    { minHeight: '100vh', backgroundColor: '#0f172a',
             color: '#f1f5f9', padding: '24px 32px' },
  topbar:  { display: 'flex', justifyContent: 'space-between',
             alignItems: 'flex-start', marginBottom: 28 },
  badge:   { backgroundColor: '#7c3aed', color: '#fff', fontSize: 10,
             fontWeight: 700, letterSpacing: 2, padding: '3px 8px',
             borderRadius: 4, display: 'inline-block', marginBottom: 6 },
  title:   { fontSize: 22, fontWeight: 700, margin: 0 },
  logoutBtn: { backgroundColor: '#334155', color: '#f1f5f9', border: 'none',
               padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 28 },
  statCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: '16px 24px',
              flex: 1, textAlign: 'center' },
  statValue: { fontSize: 32, fontWeight: 700 },
  statLabel: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  tableWrapper: { backgroundColor: '#1e293b', borderRadius: 12, overflow: 'hidden' },
  table:  { width: '100%', borderCollapse: 'collapse' },
  thead:  { backgroundColor: '#0f172a' },
  th:     { padding: '12px 16px', textAlign: 'left', fontSize: 12,
            fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase',
            letterSpacing: 1 },
  tr:     { borderBottom: '1px solid #0f172a', cursor: 'pointer', transition: 'background 0.15s' },
  td:     { padding: '14px 16px', fontSize: 14 },
  email:  { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge2: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  detailBtn: { backgroundColor: '#334155', color: '#f1f5f9', border: 'none',
               padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  loading: { color: '#94a3b8', textAlign: 'center', marginTop: 80 },
  alertError: { backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 14 },
  empty: { textAlign: 'center', color: '#64748b', padding: 40 },
}

export default SuperadminBoutiquesPage