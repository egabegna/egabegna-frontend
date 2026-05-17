import { useState, useEffect } from 'react'
import { User, Mail, Phone, Shield, Save, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthContext } from '../store/AuthContext'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'
const GREEN  = '#2D7A4F'
const RED    = '#c0392b'

function ProfilPage() {
  const { setAuth }               = useAuthContext()
  const [profil, setProfil]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState({ prenom: '', nom: '', telephone: '' })
  const [emailForm, setEmailForm] = useState({ nouvel_email: '', mot_de_passe: '' })
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [msg, setMsg]             = useState({ type: '', text: '' })

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  useEffect(() => {
    api.get('/api/auth/me/').then(res => {
      setProfil(res.data)
      setForm({
        prenom:    res.data.prenom    || '',
        nom:       res.data.nom       || '',
        telephone: res.data.telephone || '',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmitProfil = async e => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.patch('/api/auth/me/', form)
      setProfil(prev => ({ ...prev, ...res.data }))
      // Mettre à jour le context si le nom change
      setAuth(prev => ({ ...prev }))
      showMsg('success', 'Profil mis à jour.')
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Erreur.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitEmail = async e => {
    e.preventDefault()
    setEmailSubmitting(true)
    try {
      await api.post('/api/auth/changer-email/', emailForm)
      setShowEmailForm(false)
      setEmailForm({ nouvel_email: '', mot_de_passe: '' })
      showMsg('success', `Email de confirmation envoyé à ${emailForm.nouvel_email}.`)
    } catch (err) {
      const d = err.response?.data
      showMsg('error',
        d?.nouvel_email?.[0] || d?.mot_de_passe?.[0] || d?.detail || 'Erreur.'
      )
    } finally {
      setEmailSubmitting(false)
    }
  }

  if (loading) return <div style={s.page}><p style={s.loading}>Chargement...</p></div>

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <p style={s.eyebrow}>Mon compte</p>
        <h1 style={s.title}>Profil</h1>
        <div style={s.underline} />
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      {/* Infos personnelles */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <User size={14} color={NAVY} strokeWidth={2} />
          <span style={s.cardTitle}>Informations personnelles</span>
        </div>
        <div style={s.divider} />

        <form onSubmit={handleSubmitProfil}>
          <div style={s.row}>
            <PField label="Prénom" name="prenom"
              value={form.prenom} onChange={handleChange} />
            <PField label="Nom"    name="nom"
              value={form.nom}    onChange={handleChange} />
          </div>
          <PField label="Téléphone" name="telephone" type="tel"
            value={form.telephone} onChange={handleChange} />

          <button type="submit" disabled={submitting} style={s.btnPrimary}>
            <Save size={13} strokeWidth={2.5} />
            <span>{submitting ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </form>
      </div>

      {/* Email */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <Mail size={14} color={NAVY} strokeWidth={2} />
          <span style={s.cardTitle}>Adresse email</span>
        </div>
        <div style={s.divider} />

        <div style={s.emailRow}>
          <div>
            <div style={s.emailActuel}>{profil?.email}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              Email actuel — actif jusqu'à confirmation du changement
            </div>
          </div>
          {!showEmailForm && (
            <button onClick={() => setShowEmailForm(true)} style={s.btnSecondary}>
              Changer
            </button>
          )}
        </div>

        {showEmailForm && (
          <form onSubmit={handleSubmitEmail} style={s.emailForm}>
            <PField label="Nouvelle adresse email" name="nouvel_email"
              type="email"
              value={emailForm.nouvel_email}
              onChange={e => setEmailForm(p => ({ ...p, nouvel_email: e.target.value }))} />
            <PField label="Confirmez votre mot de passe" name="mot_de_passe"
              type="password"
              value={emailForm.mot_de_passe}
              onChange={e => setEmailForm(p => ({ ...p, mot_de_passe: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={emailSubmitting}
                style={s.btnPrimary}>
                {emailSubmitting ? 'Envoi...' : 'Envoyer la confirmation'}
              </button>
              <button type="button"
                onClick={() => { setShowEmailForm(false); setEmailForm({ nouvel_email: '', mot_de_passe: '' }) }}
                style={s.btnSecondary}>
                <X size={13} strokeWidth={2} />
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

    {/* Statut 2FA — au lieu de <DeuxFacteursSection /> */}
    <div style={s.card}>
    <div style={s.cardHeader}>
        <Shield size={14} color={NAVY} strokeWidth={2} />
        <span style={s.cardTitle}>Authentification à deux facteurs</span>
    </div>
    <div style={s.divider} />

    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: profil?.deux_fa_actif ? GREEN : '#d1d5db',
            flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>
            {profil?.deux_fa_actif ? 'Activée' : 'Non configurée'}
        </span>
        </div>
        <Link to="/parametres?tab=config" style={{
        fontSize: 13, color: NAVY, fontWeight: 600, textDecoration: 'none'
        }}>
        Gérer →
        </Link>
    </div>
    </div>

    </div>
  )
}

function PField({ label, name, value, onChange, type = 'text' }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange}
        style={s.input} />
    </div>
  )
}

const s = {
  page:    { padding: '32px 28px', maxWidth: 700, margin: '0 auto' },
  header:  { marginBottom: 28 },
  eyebrow: { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px',
             textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:   { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0 },
  underline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  alertSuccess: { background: '#EBF5EF', border: '1px solid #A8D5B5',
                  color: GREEN, borderRadius: 10, padding: '10px 16px',
                  marginBottom: 20, fontSize: 13 },
  alertError:   { background: '#FEF1F1', border: '1px solid #FBBCBC',
                  color: RED, borderRadius: 10, padding: '10px 16px',
                  marginBottom: 20, fontSize: 13 },
  card:     { background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:  { fontSize: 11, fontWeight: 700, color: NAVY,
                textTransform: 'uppercase', letterSpacing: '1.5px' },
  divider:    { height: 1, background: BORDER, marginBottom: 18 },
  row:        { display: 'flex', gap: 14 },
  fieldGroup: { marginBottom: 14, flex: 1 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
                letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:      { width: '100%', padding: '10px 12px', borderRadius: 9,
                border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
                boxSizing: 'border-box', outline: 'none', background: WHITE },
  emailRow:   { display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12 },
  emailActuel:{ fontSize: 14, fontWeight: 600, color: NAVY },
  emailForm:  { borderTop: `1px solid ${BORDER}`, paddingTop: 16, marginTop: 8 },
  btnPrimary:  { display: 'inline-flex', alignItems: 'center', gap: 6,
                 background: NAVY, color: WHITE, border: 'none',
                 padding: '10px 18px', borderRadius: 9, fontSize: 13,
                 fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ display: 'inline-flex', alignItems: 'center', gap: 6,
                 background: BG, color: NAVY, border: `1px solid ${BORDER}`,
                 padding: '9px 16px', borderRadius: 9, fontSize: 13, cursor: 'pointer' },
  loading:    { color: MUTED, textAlign: 'center', padding: 60, fontSize: 13 },
}

export default ProfilPage