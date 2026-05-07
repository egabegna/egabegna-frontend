import { useState, useEffect, useCallback } from 'react'
import signalementService from '../services/signalementService'

const NIVEAU_STYLES = {
  info:         { bg: '#dbeafe', color: '#1e40af', icon: 'ℹ️' },
  avertissement:{ bg: '#fef3c7', color: '#92400e', icon: '⚠️' },
  critique:     { bg: '#fee2e2', color: '#dc2626', icon: '🔴' },
}

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
    setSignalements(prev =>
      prev.map(s => s.id === id ? { ...s, lu: true } : s)
    )
    onCountUpdate?.()
  }

  const handleLireTout = async () => {
    await signalementService.lireTout()
    setSignalements(prev => prev.map(s => ({ ...s, lu: true })))
    setMsg('Tous les signalements marqués comme lus.')
    onCountUpdate?.()
    setTimeout(() => setMsg(''), 3000)
  }

  const nonLus = signalements.filter(s => !s.lu).length

  return (
    <div style={ss.page}>
      <div style={ss.header}>
        <div>
          <h1 style={ss.title}>
            Signalements
            {nonLus > 0 && (
              <span style={ss.badge}>{nonLus}</span>
            )}
          </h1>
          <p style={ss.sub}>{signalements.length} signalement(s)</p>
        </div>
        {nonLus > 0 && (
          <button onClick={handleLireTout} style={ss.btnLireTout}>
            ✓ Tout marquer comme lu
          </button>
        )}
      </div>

      {msg && <div style={ss.alertSuccess}>{msg}</div>}

      {/* Filtres */}
      <div style={ss.filtres}>
        <select value={filtre.lu}
          onChange={e => setFiltre(p => ({ ...p, lu: e.target.value }))}
          style={ss.select}>
          <option value="">Tous</option>
          <option value="false">Non lus</option>
          <option value="true">Lus</option>
        </select>
        <select value={filtre.niveau}
          onChange={e => setFiltre(p => ({ ...p, niveau: e.target.value }))}
          style={ss.select}>
          <option value="">Tous niveaux</option>
          <option value="info">Info</option>
          <option value="avertissement">Avertissement</option>
          <option value="critique">Critique</option>
        </select>
        <select value={filtre.type}
          onChange={e => setFiltre(p => ({ ...p, type: e.target.value }))}
          style={ss.select}>
          <option value="">Tous types</option>
          <option value="stock_anormal">Stock anormal</option>
          <option value="difference_caisse">Différence caisse</option>
          <option value="comportement_suspect">Comportement suspect</option>
          <option value="erreur_saisie">Erreur saisie</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <p style={ss.loading}>Chargement...</p>
      ) : (
        <div style={ss.liste}>
          {signalements.map(s => {
            const ns = NIVEAU_STYLES[s.niveau] || NIVEAU_STYLES.info
            return (
              <div key={s.id} style={{
                ...ss.card,
                backgroundColor: s.lu ? '#fff' : ns.bg,
                borderLeft: `4px solid ${ns.color}`,
                opacity: s.lu ? 0.7 : 1,
              }}>
                <div style={ss.cardMain}>
                  <div style={{ flex: 1 }}>
                    <div style={ss.cardHeader}>
                      <span style={{ fontSize: 18 }}>{ns.icon}</span>
                      <span style={{ ...ss.niveauBadge,
                                     backgroundColor: ns.bg, color: ns.color }}>
                        {s.niveau}
                      </span>
                      <span style={ss.typeBadge}>{s.type.replace(/_/g, ' ')}</span>
                      {!s.lu && <span style={ss.nonLuDot}>NOUVEAU</span>}
                    </div>
                    <p style={ss.message}>{s.message}</p>
                    <div style={ss.meta}>
                      {new Date(s.date).toLocaleString('fr-FR')}
                      {s.employe_nom && ` · ${s.employe_nom}`}
                    </div>
                  </div>
                  {!s.lu && (
                    <button onClick={() => handleLire(s.id)} style={ss.btnLire}>
                      Marquer lu
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {signalements.length === 0 && (
            <div style={ss.empty}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <p>Aucun signalement.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ss = {
  page:    { padding: '32px 24px', maxWidth: 800, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 },
  sub:     { fontSize: 13, color: '#6b7280', marginTop: 4 },
  badge:   { backgroundColor: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 12 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  filtres: { display: 'flex', gap: 10, marginBottom: 20 },
  select:  { padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, backgroundColor: '#fff' },
  btnLireTout: { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  liste:   { display: 'flex', flexDirection: 'column', gap: 10 },
  card:    { border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', transition: 'opacity 0.2s' },
  cardMain:{ display: 'flex', alignItems: 'flex-start', gap: 12 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  niveauBadge: { padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  typeBadge:   { backgroundColor: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 8, fontSize: 12 },
  nonLuDot:    { backgroundColor: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8 },
  message: { fontSize: 14, color: '#374151', margin: '0 0 6px', lineHeight: 1.5 },
  meta:    { fontSize: 12, color: '#9ca3af' },
  btnLire: { backgroundColor: '#fff', border: '1px solid #d1d5db', color: '#374151', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 },
  loading: { color: '#9ca3af', textAlign: 'center', padding: 30 },
  empty:   { textAlign: 'center', color: '#9ca3af', padding: 40 },
}

export default SignalementsPage