import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import superadminService from '../../services/superadminService'

function SuperadminBoutiqueDetailPage() {
  const { id }                 = useParams()
  const navigate               = useNavigate()
  const [boutique, setBoutique]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm]     = useState(false)
  const [message, setMessage]     = useState(null)

  const fetchBoutique = async () => {
    try {
      const res = await superadminService.getBoutique(id)
      setBoutique(res.data)
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBoutique() }, [id])

  const handleToggle = async () => {
    setActionLoading(true)
    setMessage(null)
    try {
      if (boutique.active) {
        await superadminService.bloquer(id)
        setMessage({ type: 'success', text: 'Boutique bloquée avec succès.' })
      } else {
        await superadminService.debloquer(id)
        setMessage({ type: 'success', text: 'Boutique débloquée avec succès.' })
      }
      await fetchBoutique()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur.' })
    } finally {
      setActionLoading(false)
      setConfirm(false)
    }
  }

  if (loading) return <div style={styles.page}><p style={{ color: '#94a3b8' }}>Chargement...</p></div>
  if (!boutique) return null

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <button onClick={() => navigate('/superadmin/boutiques')} style={styles.backBtn}>
          ← Retour
        </button>
      </div>

      {message && (
        <div style={{
          ...styles.alert,
          backgroundColor: message.type === 'success' ? '#14532d' : '#450a0a',
          color: message.type === 'success' ? '#86efac' : '#fca5a5',
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.boutiqueName}>{boutique.nom}</h2>
            <span style={{
              ...styles.badge,
              backgroundColor: boutique.active ? '#14532d' : '#450a0a',
              color: boutique.active ? '#86efac' : '#fca5a5',
            }}>
              {boutique.active ? '● Actif' : '● Bloqué'}
            </span>
          </div>

          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              style={{
                ...styles.actionBtn,
                backgroundColor: boutique.active ? '#7f1d1d' : '#14532d',
                color: boutique.active ? '#fca5a5' : '#86efac',
              }}>
              {boutique.active ? 'Bloquer cette boutique' : 'Débloquer cette boutique'}
            </button>
          ) : (
            <div style={styles.confirmBox}>
              <p style={styles.confirmText}>
                {boutique.active
                  ? `Confirmer le blocage de «${boutique.nom}» ?`
                  : `Confirmer le déblocage de «${boutique.nom}» ?`}
              </p>
              <div style={styles.confirmBtns}>
                <button onClick={handleToggle} disabled={actionLoading}
                  style={{ ...styles.confirmYes, opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading ? '...' : 'Confirmer'}
                </button>
                <button onClick={() => setConfirm(false)} style={styles.confirmNo}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Propriétaire</h3>
          <div style={styles.infoGrid}>
            <Info label="Nom"       value={boutique.proprietaire_nom} />
            <Info label="Email"     value={boutique.proprietaire_email} />
            <Info label="Adresse"   value={boutique.adresse || '—'} />
            <Info label="Téléphone" value={boutique.telephone || '—'} />
            <Info label="Inscrit le" value={new Date(boutique.date_inscription).toLocaleDateString('fr-FR')} />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            Employés ({boutique.employes?.length || 0})
          </h3>
          {boutique.employes?.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Nom</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Rôle</th>
                  <th style={styles.th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {boutique.employes.map(e => (
                  <tr key={e.id} style={styles.tr}>
                    <td style={styles.td}>{e.nom_complet}</td>
                    <td style={styles.td}>{e.email}</td>
                    <td style={styles.td}>{e.role}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.employeBadge,
                        backgroundColor: e.actif ? '#14532d' : '#450a0a',
                        color: e.actif ? '#86efac' : '#fca5a5',
                      }}>
                        {e.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#64748b' }}>Aucun employé.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#f1f5f9' }}>{value}</div>
    </div>
  )
}

const styles = {
  page:    { minHeight: '100vh', backgroundColor: '#0f172a',
             color: '#f1f5f9', padding: '24px 32px' },
  topbar:  { marginBottom: 20 },
  backBtn: { backgroundColor: '#1e293b', color: '#94a3b8', border: 'none',
             padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  alert:   { borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 },
  card:    { backgroundColor: '#1e293b', borderRadius: 12, padding: 28 },
  cardHeader: { display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  boutiqueName: { fontSize: 22, fontWeight: 700, margin: '0 0 8px' },
  badge:   { padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  actionBtn: { padding: '10px 20px', borderRadius: 8, border: 'none',
               fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  confirmBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 16, maxWidth: 320 },
  confirmText: { fontSize: 14, color: '#f1f5f9', marginBottom: 12 },
  confirmBtns: { display: 'flex', gap: 8 },
  confirmYes:  { backgroundColor: '#7c3aed', color: '#fff', border: 'none',
                 padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  confirmNo:   { backgroundColor: '#334155', color: '#f1f5f9', border: 'none',
                 padding: '8px 16px', borderRadius: 8, cursor: 'pointer' },
  section:      { marginTop: 28 },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 14,
                  color: '#94a3b8', textTransform: 'uppercase',
                  letterSpacing: 1, fontSize: 12 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  table:  { width: '100%', borderCollapse: 'collapse' },
  thead:  { backgroundColor: '#0f172a' },
  th:     { padding: '10px 14px', textAlign: 'left', fontSize: 11,
            color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  tr:     { borderBottom: '1px solid #0f172a' },
  td:     { padding: '12px 14px', fontSize: 14 },
  employeBadge: { padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
}

export default SuperadminBoutiqueDetailPage