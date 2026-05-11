import { useState, useEffect, useRef } from 'react'
import { useAuthContext } from '../store/AuthContext'
import boutiqueService from '../services/boutiqueService'
import {
  Save, ImagePlus, X, Bell, BellOff, BellRing,
  Store, Phone, MapPin, Coins, FlaskConical,
} from 'lucide-react'

// ─── Design tokens (identiques à EmployesPage) ────────────────────────────────
const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

// ─── Devises ──────────────────────────────────────────────────────────────────
const DEVISES = [
  { value: 'FCFA', label: 'Franc CFA',         sym: 'FCFA' },
  { value: 'EUR', label: 'Euro',               sym: 'EUR' },
  { value: 'USD', label: 'Dollar US',          sym: 'USD' },
  { value: 'GNF', label: 'Franc Guinéen',      sym: 'GNF' },
  { value: 'MAD', label: 'Dirham Marocain',    sym: 'MAD' },
]

// ─── Champ formulaire ─────────────────────────────────────────────────────────
function PField({ label, name, value, onChange, type = 'text', Icon }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={s.inputIcon}>
            <Icon size={13} color={MUTED} strokeWidth={1.8} />
          </div>
        )}
        <input
          name={name} type={type} value={value} onChange={onChange}
          style={{ ...s.input, paddingLeft: Icon ? 36 : 12 }}
        />
      </div>
    </div>
  )
}

// ─── Notifications push ───────────────────────────────────────────────────────
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
        await reg.showNotification('🔴 Test', {
          body: 'Ceci est une notification de test.',
          icon: '/icons/icon-192x192.png',
          data: { url: '/signalements' },
          actions: [{ action: 'voir', title: 'Voir les signalements' }],
        })
      } else {
        new Notification('Test', { body: 'Ceci est une notification de test.' })
      }
    } catch (err) { console.error(err) }
    finally { setTestLoading(false) }
  }

  const STATUTS = {
    granted:     { label: 'Activées',        Icon: BellRing, bg: '#EBF5EF', color: GREEN },
    denied:      { label: 'Bloquées',        Icon: BellOff,  bg: '#FEF1F1', color: RED   },
    default:     { label: 'Non configurées', Icon: Bell,     bg: '#FBF5E9', color: GOLD  },
    unsupported: { label: 'Non supportées',  Icon: BellOff,  bg: BG,        color: MUTED },
  }
  const st = STATUTS[permission] || STATUTS.unsupported
  const { Icon: StIcon } = st

  return (
    <div style={s.sectionCard}>
      <div style={s.sectionHeader}>
        <Bell size={14} color={NAVY} strokeWidth={2} />
        <span style={s.sectionTitle}>Notifications push</span>
      </div>
      <div style={s.sectionDivider} />

      <p style={s.pushDesc}>
        Recevez des alertes en temps réel pour les signalements critiques
        (rupture de stock, anomalie caisse) même si l'application est fermée.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ ...s.badge, background: st.bg, color: st.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <StIcon size={11} strokeWidth={2.5} />
          {st.label}
        </span>

        {permission !== 'granted' && permission !== 'unsupported' && (
          <button onClick={demanderPermission} style={s.btnPrimary}>
            <Bell size={13} strokeWidth={2.5} />
            <span>Activer les notifications</span>
          </button>
        )}

        {permission === 'granted' && (
          <button onClick={testerNotification} disabled={testLoading}
            style={{ ...s.btnAction, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5` }}>
            <FlaskConical size={12} strokeWidth={2} />
            <span>{testLoading ? 'Envoi...' : 'Tester une notification'}</span>
          </button>
        )}

        {permission === 'denied' && (
          <span style={{ fontSize: 12, color: MUTED }}>
            Réactivez les notifications dans les paramètres de votre navigateur.
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
function ParametresPage() {
  const { nom_boutique, role, setAuth } = useAuthContext()
  const [form, setForm]           = useState({ nom: '', adresse: '', telephone: '', devise: 'XOF' })
  const [logo, setLogo]           = useState(null)
  const [logoBase64, setLogoBase64] = useState('')
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]             = useState({ type: '', text: '' })
  const [logoError, setLogoError] = useState('')
  const [dragging, setDragging]   = useState(false)
  const fileRef                   = useRef(null)

  useEffect(() => {
    boutiqueService.get().then(res => {
      const b = res.data
      setForm({ nom: b.nom || '', adresse: b.adresse || '', telephone: b.telephone || '', devise: b.devise || 'XOF' })
      if (b.logo_url) setLogo(b.logo_url)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const processFile = (file) => {
    if (!file) return
    setLogoError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Format accepté : jpg, png, webp.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image trop lourde (max 2 MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      setLogo(ev.target.result)
      setLogoBase64(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoChange = e => processFile(e.target.files[0])

  const retirerLogo = () => {
    setLogo(null)
    setLogoBase64('')
    if (fileRef.current) fileRef.current.value = ''
  }

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
      /*const res = await boutiqueService.patch(payload)
      setSession({
        access:       localStorage.getItem('access_token'),
        refresh:      localStorage.getItem('refresh_token'),
        role:         localStorage.getItem('role'),
        nom_boutique: res.data.nom,
        devise:       res.data.devise,
        logo:         res.data.logo_url || '',
      })*/
      
      const res = await boutiqueService.patch(payload)
      // Mettre à jour uniquement les champs boutique dans le context
      setAuth(prev => ({
        ...prev,
        nom_boutique: res.data.nom,
        devise:       res.data.devise,
        logo:         res.data.logo_url || '',
      }))
      localStorage.setItem('nom_boutique', res.data.nom)
      localStorage.setItem('devise',       res.data.devise)
      localStorage.setItem('logo',         res.data.logo_url || '')
      setMsg({ type: 'success', text: 'Paramètres enregistrés avec succès.' })
      setLogoBase64('')
    } catch (err) {
      const d = err.response?.data
      setMsg({ type: 'error', text: d?.detail || d?.nom?.[0] || 'Erreur lors de la sauvegarde.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={s.page}><p style={s.loading}>Chargement...</p></div>

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Configuration</p>
          <h1 style={s.title}>Paramètres boutique</h1>
          <div style={s.titleUnderline} />
        </div>
      </div>

      {/* ── MESSAGES ── */}
      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── LOGO ── */}
        <div style={s.sectionCard}>
          <div style={s.sectionHeader}>
            <ImagePlus size={14} color={NAVY} strokeWidth={2} />
            <span style={s.sectionTitle}>Logo de la boutique</span>
          </div>
          <div style={s.sectionDivider} />

          {logo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <img src={logo} alt="Logo boutique" style={s.logoPreview} />
              <div>
                <p style={{ fontSize: 13, color: MUTED, margin: '0 0 10px' }}>
                  Logo actuel · JPG, PNG ou WebP · Max 2 MB
                </p>
                <button type="button" onClick={retirerLogo}
                  style={{ ...s.btnAction, background: '#FEF1F1', color: RED, border: `1px solid #FBBCBC` }}>
                  <X size={12} strokeWidth={2.5} />
                  <span>Retirer le logo</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                ...s.logoUpload,
                borderColor: dragging ? NAVY : BORDER,
                background:  dragging ? '#EEF1F8' : BG,
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true)  }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault()
                setDragging(false)
                processFile(e.dataTransfer.files[0])
              }}
            >
              <div style={s.logoUploadIcon}>
                <ImagePlus size={22} color={MUTED} strokeWidth={1.5} />
              </div>
              <p style={{ margin: '8px 0 4px', fontSize: 13, color: NAVY, fontWeight: 600 }}>
                Cliquez ou déposez votre logo ici
              </p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
                JPG, PNG ou WebP · Max 2 MB
              </p>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoChange} style={{ display: 'none' }} />

          {logoError && (
            <p style={{ color: RED, fontSize: 12, marginTop: 8 }}>{logoError}</p>
          )}
        </div>

        {/* ── INFORMATIONS ── */}
        <div style={s.sectionCard}>
          <div style={s.sectionHeader}>
            <Store size={14} color={NAVY} strokeWidth={2} />
            <span style={s.sectionTitle}>Informations</span>
          </div>
          <div style={s.sectionDivider} />

          <div style={s.row}>
            <PField label="Nom de la boutique *" name="nom"       value={form.nom}       onChange={handleChange} Icon={Store}   />
            <PField label="Téléphone"             name="telephone" value={form.telephone} onChange={handleChange} Icon={Phone} type="tel" />
          </div>
          <PField label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} Icon={MapPin} />
        </div>

        {/* ── DEVISE ── */}
        <div style={s.sectionCard}>
          <div style={s.sectionHeader}>
            <Coins size={14} color={NAVY} strokeWidth={2} />
            <span style={s.sectionTitle}>Devise</span>
          </div>
          <div style={s.sectionDivider} />

          <div style={s.deviseGrid}>
            {DEVISES.map(d => {
              const actif = form.devise === d.value
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, devise: d.value }))}
                  style={{
                    ...s.deviseBtn,
                    background:   actif ? NAVY  : WHITE,
                    color:        actif ? WHITE : NAVY,
                    border:       actif ? `2px solid ${NAVY}` : `2px solid ${BORDER}`,
                    boxShadow:    actif ? '0 2px 8px rgba(27,45,91,0.18)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 800, display: 'block', marginBottom: 4 }}>{d.sym}</span>
                  <span style={{ fontSize: 11, opacity: 0.75 }}>{d.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── BOUTON SAVE ── */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            ...s.btnPrimary,
            width: '100%',
            justifyContent: 'center',
            padding: '13px 28px',
            fontSize: 14,
            marginBottom: 20,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={15} strokeWidth={2.5} />
          <span>{submitting ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
        </button>
      </form>

      {/* ── NOTIFICATIONS ── */}
      <NotificationsPush />
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  page:    { padding: '32px 28px', maxWidth: 760, margin: '0 auto' },

  header:        { marginBottom: 28 },
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },

  alertSuccess: { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, fontWeight: 500 },
  alertError:   { background: '#FEF1F1', border: '1px solid #FBBCBC', color: RED,   borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13 },

  sectionCard:   { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle:  { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  sectionDivider:{ height: 1, background: BORDER, marginBottom: 18 },

  row:        { display: 'flex', gap: 14 },
  fieldGroup: { marginBottom: 14, flex: 1 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:      { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE },
  inputIcon:  { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },

  logoUpload:     { border: `2px dashed ${BORDER}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  logoUploadIcon: { width: 48, height: 48, background: BG, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  logoPreview:    { width: 90, height: 90, objectFit: 'contain', borderRadius: 10, border: `1px solid ${BORDER}` },

  deviseGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 },
  deviseBtn:  { padding: '12px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' },

  btnPrimary:{ display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnAction: { display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none' },
  badge:     { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },

  pushDesc: { fontSize: 13, color: MUTED, lineHeight: 1.7, margin: '0 0 16px' },
  loading:  { color: MUTED, textAlign: 'center', padding: 60, fontSize: 13 },
}

export default ParametresPage