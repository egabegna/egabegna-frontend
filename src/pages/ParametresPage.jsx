import { useState, useEffect, useRef } from 'react'
import { useAuthContext } from '../store/AuthContext'
import boutiqueService from '../services/boutiqueService'

const DEVISES = [
  { value: 'XOF', label: 'Franc CFA — XOF' },
  { value: 'EUR', label: 'Euro — EUR' },
  { value: 'USD', label: 'Dollar — USD' },
  { value: 'GNF', label: 'Franc Guinéen — GNF' },
  { value: 'MAD', label: 'Dirham Marocain — MAD' },
]

function ParametresPage() {
  const { nom_boutique, setSession, role } = useAuthContext()
  const [form, setForm]         = useState({
    nom: '', adresse: '', telephone: '', devise: 'XOF'
  })
  const [logo, setLogo]         = useState(null)   // base64 preview
  const [logoBase64, setLogoBase64] = useState('')
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]           = useState({ type: '', text: '' })
  const [logoError, setLogoError] = useState('')
  const fileRef                 = useRef(null)

  useEffect(() => {
    boutiqueService.get().then(res => {
      const b = res.data
      setForm({
        nom:       b.nom       || '',
        adresse:   b.adresse   || '',
        telephone: b.telephone || '',
        devise:    b.devise    || 'XOF',
      })
      if (b.logo_url) setLogo(b.logo_url)
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  // ── Upload logo ──────────────────────────────
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoError('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Format accepté : jpg, png, webp.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image trop lourde (max 2MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setLogo(ev.target.result)
      setLogoBase64(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const retirerLogo = () => {
    setLogo(null)
    setLogoBase64('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Soumission ───────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) {
      setMsg({ type: 'error', text: 'Le nom de la boutique est requis.' })
      return
    }
    setSubmitting(true)
    setMsg({ type: '', text: '' })

    try {
      const payload = { ...form }
      if (logoBase64) payload.logo_base64 = logoBase64

      const res = await boutiqueService.patch(payload)

      // Mettre à jour le context
      setSession({
        access:       localStorage.getItem('access_token'),
        refresh:      localStorage.getItem('refresh_token'),
        role:         localStorage.getItem('role'),
        nom_boutique: res.data.nom,
        devise:       res.data.devise,
        logo:         res.data.logo_url || '',
      })

      setMsg({ type: 'success', text: 'Paramètres enregistrés.' })
      setLogoBase64('')
    } catch (err) {
      const d = err.response?.data
      setMsg({
        type: 'error',
        text: d?.detail || d?.nom?.[0] || 'Erreur lors de la sauvegarde.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={ps.page}><p style={ps.loading}>Chargement...</p></div>

  return (
    <div style={ps.page}>
      <h1 style={ps.title}>Paramètres boutique</h1>

      {msg.text && (
        <div style={msg.type === 'success' ? ps.alertSuccess : ps.alertError}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={ps.card}>

          {/* Logo */}
          <div style={ps.section}>
            <div style={ps.sectionTitle}>Logo</div>
            <div style={ps.logoZone}>
              {logo ? (
                <div style={ps.logoPreviewWrapper}>
                  <img src={logo} alt="Logo boutique" style={ps.logoPreview} />
                  <button type="button" onClick={retirerLogo} style={ps.btnRetirerLogo}>
                    ✕ Retirer
                  </button>
                </div>
              ) : (
                <div
                  style={ps.logoUpload}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563eb' }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#d1d5db' }}
                  onDrop={e => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = '#d1d5db'
                    const file = e.dataTransfer.files[0]
                    if (file) {
                      const fakeEvent = { target: { files: [file] } }
                      handleLogoChange(fakeEvent)
                    }
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>
                    Cliquez ou déposez votre logo ici
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    JPG, PNG ou WebP · Max 2MB
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              {logoError && (
                <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
                  {logoError}
                </p>
              )}
            </div>
          </div>

          {/* Informations boutique */}
          <div style={ps.section}>
            <div style={ps.sectionTitle}>Informations</div>
            <div style={ps.grid}>
              <PField label="Nom de la boutique *" name="nom"
                value={form.nom} onChange={handleChange} />
              <PField label="Téléphone" name="telephone"
                value={form.telephone} onChange={handleChange} type="tel" />
            </div>
            <PField label="Adresse" name="adresse"
              value={form.adresse} onChange={handleChange} />
          </div>

          {/* Devise */}
          <div style={ps.section}>
            <div style={ps.sectionTitle}>Devise</div>
            <div style={ps.deviseGrid}>
              {DEVISES.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, devise: d.value }))}
                  style={{
                    ...ps.deviseBtn,
                    backgroundColor: form.devise === d.value ? '#111827' : '#f9fafb',
                    color:           form.devise === d.value ? '#fff'    : '#374151',
                    border:          form.devise === d.value
                      ? '2px solid #111827'
                      : '2px solid #e5e7eb',
                  }}>
                  <span style={ps.deviseSym}>{d.value}</span>
                  <span style={ps.deviseNom}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...ps.btnSave,
              opacity: submitting ? 0.7 : 1,
              cursor:  submitting ? 'not-allowed' : 'pointer',
            }}>
            {submitting ? 'Enregistrement...' : '💾 Enregistrer les paramètres'}
          </button>
        </div>
      </form>

      {/* Section notifications push */}
      <NotificationsPush />
    </div>
  )
}

function PField({ label, name, value, onChange, type = 'text' }) {
  return (
    <div style={ps.fieldGroup}>
      <label style={ps.label}>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange}
        style={ps.input} />
    </div>
  )
}

// ── Section notifications push ────────────────
function NotificationsPush() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [testLoading, setTestLoading] = useState(false)

  const demanderPermission = async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const testerNotification = async () => {
    setTestLoading(true)
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        await reg.showNotification('🔴 Test Egabégna', {
          body:    'Ceci est une notification de test.',
          icon:    '/icons/icon-192x192.png',
          badge:   '/icons/icon-192x192.png',
          data:    { url: '/signalements' },
          actions: [{ action: 'voir', title: 'Voir les signalements' }],
        })
      } else {
        new Notification('🔴 Test Egabégna', {
          body: 'Ceci est une notification de test.',
        })
      }
    } catch (err) {
      console.error('Erreur notification:', err)
    } finally {
      setTestLoading(false)
    }
  }

  const STATUTS = {
    granted:     { label: 'Activées ✓',       color: '#16a34a', bg: '#dcfce7' },
    denied:      { label: 'Bloquées ✗',        color: '#dc2626', bg: '#fee2e2' },
    default:     { label: 'Non configurées',   color: '#d97706', bg: '#fef3c7' },
    unsupported: { label: 'Non supportées',    color: '#6b7280', bg: '#f3f4f6' },
  }
  const s = STATUTS[permission] || STATUTS.unsupported

  return (
    <div style={ps.pushCard}>
      <div style={ps.sectionTitle}>Notifications push</div>
      <p style={ps.pushDesc}>
        Recevez des alertes en temps réel pour les signalements critiques
        (rupture de stock, anomalie caisse) même si l'application est fermée.
      </p>

      <div style={ps.pushStatus}>
        <span style={{ ...ps.pushBadge, backgroundColor: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {permission !== 'granted' && permission !== 'unsupported' && (
          <button onClick={demanderPermission} style={ps.btnPush}>
            🔔 Activer les notifications
          </button>
        )}

        {permission === 'granted' && (
          <button onClick={testerNotification} disabled={testLoading}
            style={ps.btnPushTest}>
            {testLoading ? 'Envoi...' : '🧪 Tester une notification'}
          </button>
        )}

        {permission === 'denied' && (
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Les notifications sont bloquées dans votre navigateur.
            Allez dans les paramètres du navigateur pour les réactiver.
          </p>
        )}
      </div>
    </div>
  )
}

const ps = {
  page:    { padding: '32px 24px', maxWidth: 700, margin: '0 auto' },
  title:   { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  loading: { color: '#9ca3af', textAlign: 'center', padding: 60 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 },
  card:    { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 28, marginBottom: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 },
  fieldGroup: { marginBottom: 14 },
  label:   { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input:   { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  logoZone:{ },
  logoUpload: { border: '2px dashed #d1d5db', borderRadius: 10, padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' },
  logoPreviewWrapper: { display: 'flex', alignItems: 'center', gap: 20 },
  logoPreview: { width: 100, height: 100, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' },
  btnRetirerLogo: { background: 'none', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  deviseGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  deviseBtn:  { padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' },
  deviseSym:  { display: 'block', fontSize: 16, fontWeight: 800, marginBottom: 4 },
  deviseNom:  { display: 'block', fontSize: 11, opacity: 0.8 },
  btnSave: { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, width: '100%', transition: 'opacity 0.2s' },
  pushCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 },
  pushDesc: { fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 16px' },
  pushStatus: { },
  pushBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600 },
  btnPush:     { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnPushTest: { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
}

export default ParametresPage