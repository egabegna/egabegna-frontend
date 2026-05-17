import { useState, useEffect, useRef } from 'react'
import ConfigurationSection from '../components/ConfigurationSection'
import DeuxFacteursSection from '../components/DeuxFacteursSection'
import { useAuthContext } from '../store/AuthContext'
import boutiqueService from '../services/boutiqueService'
import {
  Save, ImagePlus, X, Bell, BellOff, BellRing,
  Store, Phone, MapPin, Coins, FlaskConical,
  Settings, Percent, ShoppingBag, GitBranch,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

const DEVISES = [
  { value: 'XOF', label: 'Franc CFA',       sym: 'FCFA' },
  { value: 'EUR',  label: 'Euro',            sym: 'EUR'  },
  { value: 'USD',  label: 'Dollar US',       sym: 'USD'  },
  { value: 'GHS',  label: 'Cedi Ghanéen',    sym: 'GHS'  },
  { value: 'NGN',  label: 'Naira Nigérian',  sym: 'NGN'  },
]

// ─── Styles injectés (responsive) ────────────
const CSS = `
  .pm-page { padding: 32px 28px; max-width: 760px; margin: 0 auto; }
  .pm-card { background: ${WHITE}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; }
  .pm-row  { display: flex; gap: 14px; flex-wrap: wrap; }
  .pm-fg   { margin-bottom: 14px; flex: 1; min-width: 180px; }
  .pm-devise-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .pm-logo-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .pm-notif-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pm-tab-bar { display: flex; border-bottom: 1.5px solid ${BORDER}; margin-bottom: 24px; gap: 4px; }
  .pm-tab {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none; padding: 10px 18px;
    cursor: pointer; font-size: 13px; transition: all 0.15s;
    border-bottom: 2.5px solid transparent; margin-bottom: -1.5px;
    font-family: inherit;
  }
  @media (max-width: 600px) {
    .pm-page { padding: 16px 14px; }
    .pm-card { padding: 16px 14px; }
    .pm-row  { flex-direction: column; gap: 0; }
    .pm-fg   { min-width: unset; width: 100%; }
    .pm-devise-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .pm-logo-row { flex-direction: column; align-items: flex-start; gap: 12px; }
    .pm-notif-actions { flex-direction: column; align-items: flex-start; gap: 8px; }
    .pm-tab { padding: 10px 12px; font-size: 12px; }
  }
  @media (max-width: 360px) {
    .pm-devise-grid { grid-template-columns: repeat(2, 1fr); }
  }
`

function InjectStyles() {
  useEffect(() => {
    const id = 'pm-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
  }, [])
  return null
}

// ─── Champ input ──────────────────────────────
function PField({ label, name, value, onChange, type = 'text', Icon }) {
  return (
    <div className="pm-fg">
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

// ─── Section header ───────────────────────────
function SectionHead({ Icon, title }) {
  return (
    <>
      <div style={s.sectionHeader}>
        <Icon size={14} color={NAVY} strokeWidth={2} />
        <span style={s.sectionTitle}>{title}</span>
      </div>
      <div style={s.sectionDivider} />
    </>
  )
}

// ─── Notifications push ───────────────────────
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
        await reg.showNotification('Test Egabegna', {
          body: 'Ceci est une notification de test.',
          icon: '/icons/icon-192x192.png',
          data: { url: '/signalements' },
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
    <div className="pm-card">
      <SectionHead Icon={Bell} title="Notifications push" />
      <p style={s.pushDesc}>
        Recevez des alertes en temps réel pour les signalements critiques
        (rupture de stock, anomalie caisse) même si l'application est fermée.
      </p>
      <div className="pm-notif-actions">
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
          <button
            onClick={testerNotification}
            disabled={testLoading}
            style={{ ...s.btnAction, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5` }}
          >
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

// ─── Onglet 1 : Infos boutique ────────────────
function OngletInfos({ boutiqueService: _bs, setAuth }) {
  const [form, setForm]             = useState({ nom: '', adresse: '', telephone: '' })
  const [logo, setLogo]             = useState(null)
  const [logoBase64, setLogoBase64] = useState('')
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]               = useState({ type: '', text: '' })
  const [logoError, setLogoError]   = useState('')
  const [dragging, setDragging]     = useState(false)
  const fileRef                     = useRef(null)

  useEffect(() => {
    boutiqueService.get().then(res => {
      const b = res.data
      setForm({ nom: b.nom || '', adresse: b.adresse || '', telephone: b.telephone || '' })
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
    reader.onload = ev => { setLogo(ev.target.result); setLogoBase64(ev.target.result) }
    reader.readAsDataURL(file)
  }

  const retirerLogo = () => {
    setLogo(null); setLogoBase64('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) { setMsg({ type: 'error', text: 'Le nom de la boutique est requis.' }); return }
    setSubmitting(true)
    setMsg({ type: '', text: '' })
    try {
      const payload = { ...form }
      if (logoBase64) payload.logo_base64 = logoBase64
      const res = await boutiqueService.patch(payload)
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

  if (loading) return <p style={s.loading}>Chargement...</p>

  return (
    <form onSubmit={handleSubmit}>

      {/* Messages */}
      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      {/* Logo */}
      <div className="pm-card">
        <SectionHead Icon={ImagePlus} title="Logo de la boutique" />
        {logo ? (
          <div className="pm-logo-row">
            <img src={logo} alt="Logo boutique" style={s.logoPreview} />
            <div>
              <p style={{ fontSize: 13, color: MUTED, margin: '0 0 10px' }}>
                Logo actuel · JPG, PNG ou WebP · Max 2 MB
              </p>
              <button
                type="button" onClick={retirerLogo}
                style={{ ...s.btnAction, background: '#FEF1F1', color: RED, border: `1px solid #FBBCBC` }}
              >
                <X size={12} strokeWidth={2.5} /><span>Retirer le logo</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{ ...s.logoUpload, borderColor: dragging ? NAVY : BORDER, background: dragging ? '#EEF1F8' : BG }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]) }}
          >
            <div style={s.logoUploadIcon}>
              <ImagePlus size={22} color={MUTED} strokeWidth={1.5} />
            </div>
            <p style={{ margin: '8px 0 4px', fontSize: 13, color: NAVY, fontWeight: 600 }}>
              Appuyez pour ajouter un logo
            </p>
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>JPG, PNG ou WebP · Max 2 MB</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => processFile(e.target.files[0])} style={{ display: 'none' }} />
        {logoError && <p style={{ color: RED, fontSize: 12, marginTop: 8 }}>{logoError}</p>}
      </div>

      {/* Informations */}
      <div className="pm-card">
        <SectionHead Icon={Store} title="Informations" />
        <div className="pm-row">
          <PField label="Nom de la boutique *" name="nom"       value={form.nom}       onChange={handleChange} Icon={Store} />
          <PField label="Téléphone"             name="telephone" value={form.telephone} onChange={handleChange} Icon={Phone} type="tel" />
        </div>
        <PField label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} Icon={MapPin} />
      </div>

      {/* Bouton save */}
      <button
        type="submit"
        disabled={submitting}
        style={{ ...s.btnSave, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        <Save size={15} strokeWidth={2.5} />
        <span>{submitting ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
      </button>
    </form>
  )
}

// ─── Onglet 2 : Configuration boutique ───────
function OngletConfiguration() {
  const [devise, setDevise] = useState('FCFA')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState({ type: '', text: '' })
  const { setAuth }           = useAuthContext()

  useEffect(() => {
    boutiqueService.get().then(res => {
      setDevise(res.data.devise || 'FCFA')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const saveDevise = async (val) => {
    setDevise(val)
    setSaving(true)
    try {
      const res = await boutiqueService.patch({ devise: val })
      setAuth(prev => ({ ...prev, devise: res.data.devise }))
      localStorage.setItem('devise', res.data.devise)
      setMsg({ type: 'success', text: 'Devise mise à jour.' })
      setTimeout(() => setMsg({ type: '', text: '' }), 2500)
    } catch {
      setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Devise */}
      <div className="pm-card">
        <SectionHead Icon={Coins} title="Devise" />
        {msg.text && (
          <div style={{ ...(msg.type === 'success' ? s.alertSuccess : s.alertError), marginBottom: 14 }}>
            {msg.text}
          </div>
        )}
        {loading ? (
          <p style={s.loading}>Chargement...</p>
        ) : (
          <div className="pm-devise-grid">
            {DEVISES.map(d => {
              const actif = devise === d.value
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => saveDevise(d.value)}
                  disabled={saving}
                  style={{
                    ...s.deviseBtn,
                    background: actif ? NAVY  : WHITE,
                    color:      actif ? WHITE : NAVY,
                    border:     actif ? `2px solid ${NAVY}` : `2px solid ${BORDER}`,
                    boxShadow:  actif ? '0 2px 8px rgba(27,45,91,0.18)' : 'none',
                    opacity:    saving ? 0.7 : 1,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, display: 'block', marginBottom: 3 }}>{d.sym}</span>
                  <span style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.3 }}>{d.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <ConfigurationSection />
      {/* <NotificationsPush /> */}
      <div id="section-2fa">
        <DeuxFacteursSection />
      </div>

    </>
  )
}

// ─── Page principale ──────────────────────────
function ParametresPage() {
  const { setAuth } = useAuthContext()
  const [searchParams] = useSearchParams()
  const [onglet, setOnglet] = useState(searchParams.get('tab') || 'infos')

  const ONGLETS = [
    { key: 'infos',  label: 'Infos boutique',       Icon: Store    },
    { key: 'config', label: 'Configuration',         Icon: Settings },
  ]

  return (
    <div className="pm-page">
      <InjectStyles />

      {/* HEADER */}
      <div style={s.header}>
        <p style={s.eyebrow}>Boutique</p>
        <h1 style={s.title}>Paramètres</h1>
        <div style={s.titleUnderline} />
      </div>

      {/* ONGLETS */}
      <div className="pm-tab-bar">
        {ONGLETS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className="pm-tab"
            onClick={() => setOnglet(key)}
            style={{
              color:        onglet === key ? NAVY  : MUTED,
              borderBottom: onglet === key ? `2.5px solid ${GOLD}` : '2.5px solid transparent',
              fontWeight:   onglet === key ? 700   : 500,
            }}
          >
            <Icon size={13} strokeWidth={2} color={onglet === key ? NAVY : MUTED} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* CONTENU */}
      {onglet === 'infos'  && <OngletInfos setAuth={setAuth} />}
      {onglet === 'config' && <OngletConfiguration />}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────
const s = {
  header:        { marginBottom: 28 },
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },

  alertSuccess: { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, fontWeight: 500 },
  alertError:   { background: '#FEF1F1', border: '1px solid #FBBCBC', color: RED,   borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13 },

  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle:  { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  sectionDivider:{ height: 1, background: BORDER, marginBottom: 18 },

  label:     { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:     { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE },
  inputIcon: { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },

  logoUpload:     { border: `2px dashed ${BORDER}`, borderRadius: 12, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  logoUploadIcon: { width: 48, height: 48, background: BG, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  logoPreview:    { width: 80, height: 80, objectFit: 'contain', borderRadius: 10, border: `1px solid ${BORDER}`, flexShrink: 0 },

  deviseBtn: { padding: '11px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', fontFamily: 'inherit' },

  btnSave:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', marginBottom: 20 },
  btnPrimary:{ display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnAction: { display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none' },
  badge:     { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },

  pushDesc: { fontSize: 13, color: MUTED, lineHeight: 1.7, margin: '0 0 16px' },
  loading:  { color: MUTED, textAlign: 'center', padding: 60, fontSize: 13 },
}

export default ParametresPage