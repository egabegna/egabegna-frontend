import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getPasswordStrength } from '../utils/passwordStrength'
import { Eye, EyeOff, Mail, Lock, User, Phone, Store, UserPlus } from 'lucide-react'
import AuthBackground from '../components/shared/AuthBackground'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

const INITIAL_FORM   = { prenom: '', nom: '', email: '', telephone: '', nom_boutique: '', mot_de_passe: '', confirmation_mdp: '' }
const INITIAL_ERRORS = { ...INITIAL_FORM, global: '' }

const RESPONSIVE_CSS = `
  .ins-card {
    background: ${WHITE};
    border-radius: 18px;
    padding: 36px 32px 32px;
    width: 100%;
    max-width: 480px;
    border: 1px solid ${BORDER};
    box-shadow: 0 20px 60px rgba(0,0,0,0.28);
    box-sizing: border-box;
  }
  .ins-row { display: flex; gap: 12px; }
  .ins-field-group { margin-bottom: 14px; flex: 1; min-width: 0; }
  @media (max-width: 520px) {
    .ins-card { padding: 26px 18px 28px; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); max-width: 100%; }
    .ins-row { flex-direction: column; gap: 0; }
    .ins-field-group { width: 100%; }
    .ins-card input { font-size: 16px !important; }
    .ins-brand-icon { width: 44px !important; height: 44px !important; margin-bottom: 10px !important; }
    .ins-brand-letter { font-size: 20px !important; }
    .ins-title { font-size: 20px !important; }
    .ins-subtitle { font-size: 12px !important; }
    .ins-brand { margin-bottom: 20px !important; }
    .ins-btn-submit { padding: 14px !important; font-size: 15px !important; }
    .ins-foot { margin-top: 18px !important; font-size: 12px !important; }
  }
  @media (max-width: 360px) {
    .ins-card { padding: 20px 14px 22px; border-radius: 10px; }
  }
`

function InjectStyles() {
  useEffect(() => {
    const id = 'ins-responsive-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id
      el.textContent = RESPONSIVE_CSS
      document.head.appendChild(el)
    }
    return () => {
      const existing = document.getElementById(id)
      if (existing) existing.remove()
    }
  }, [])
  return null
}

function Field({ label, name, type = 'text', value, onChange, error, required = true, Icon }) {
  return (
    <div className="ins-field-group">
      <label style={s.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <div style={s.inputIcon}><Icon size={13} color={MUTED} strokeWidth={1.8} /></div>}
        <input
          name={name} type={type} value={value}
          onChange={onChange} required={required}
          style={{ ...s.input, paddingLeft: Icon ? 36 : 12, borderColor: error ? RED : BORDER }}
        />
      </div>
      {error && <span style={s.errorMsg}>{error}</span>}
    </div>
  )
}

function InscriptionPage() {
  const { inscription }       = useAuth()
  const [form, setForm]       = useState(INITIAL_FORM)
  const [errors, setErrors]   = useState(INITIAL_ERRORS)
  const [loading, setLoading] = useState(false)
  const [showMdp, setShowMdp] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 520)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 520)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const strength = getPasswordStrength(form.mot_de_passe)

  const validate = (name, value) => {
    switch (name) {
      case 'email':            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Email invalide.'
      case 'mot_de_passe':     return value.length >= 8 ? '' : 'Minimum 8 caractères.'
      case 'confirmation_mdp': return value === form.mot_de_passe ? '' : 'Les mots de passe ne correspondent pas.'
      default:                 return value.trim() ? '' : 'Ce champ est requis.'
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name !== 'telephone') setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
    if (name === 'mot_de_passe' && form.confirmation_mdp) {
      setErrors(prev => ({
        ...prev,
        confirmation_mdp: form.confirmation_mdp === value ? '' : 'Les mots de passe ne correspondent pas.',
      }))
    }
  }

  const isFormValid = () =>
    form.prenom && form.nom && form.email && form.nom_boutique &&
    form.mot_de_passe && form.confirmation_mdp &&
    !errors.email && !errors.mot_de_passe && !errors.confirmation_mdp

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors(INITIAL_ERRORS)
    try {
      await inscription({
        nom: form.nom, prenom: form.prenom, email: form.email,
        telephone: form.telephone, nom_boutique: form.nom_boutique,
        mot_de_passe: form.mot_de_passe, confirmation_mdp: form.confirmation_mdp,
      })
    } catch (err) {
      const data = err.response?.data
      if (data?.email)            setErrors(prev => ({ ...prev, email: data.email[0] }))
      if (data?.confirmation_mdp) setErrors(prev => ({ ...prev, confirmation_mdp: data.confirmation_mdp[0] }))
      if (data?.non_field_errors) setErrors(prev => ({ ...prev, global: data.non_field_errors[0] }))
      if (data?.detail)           setErrors(prev => ({ ...prev, global: data.detail }))
    } finally { setLoading(false) }
  }

  const EyeBtn = (
    <button type="button" onClick={() => setShowMdp(v => !v)} style={s.eyeBtn} tabIndex={-1}>
      {showMdp
        ? <EyeOff size={14} color={MUTED} strokeWidth={1.8} />
        : <Eye    size={14} color={MUTED} strokeWidth={1.8} />
      }
    </button>
  )

  return (
    <AuthBackground>
      <InjectStyles />
      <div className="ins-card">

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 26 }}>
          <div style={{
            width: isMobile ? 48 : 56, height: isMobile ? 48 : 56,
            background: NAVY, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 4px 16px rgba(27,45,91,0.35)',
          }}>
            <img
              src="/icons/egabegna-icon.svg"
              alt="Egabégna"
              style={{ width: isMobile ? 24 : 40, height: isMobile ? 24 : 76 }}
            />
          </div>
          <h1 style={{ ...s.title, fontSize: isMobile ? 20 : 24 }}>Egabégna</h1>
          <div style={s.titleUnderline} />
          <p style={{ ...s.subtitle, fontSize: isMobile ? 12 : 13 }}>
            Créer votre boutique
          </p>
        </div>

        {errors.global && <div style={s.alertError}>{errors.global}</div>}

        <form onSubmit={handleSubmit} noValidate>

          <div className="ins-row">
            <Field label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} error={errors.prenom} Icon={User} />
            <Field label="Nom *"    name="nom"    value={form.nom}    onChange={handleChange} error={errors.nom}    Icon={User} />
          </div>

          <Field label="Email *"               name="email"        type="email" value={form.email}        onChange={handleChange} error={errors.email}        Icon={Mail}  />
          <Field label="Téléphone (optionnel)" name="telephone"    type="tel"   value={form.telephone}    onChange={handleChange} required={false}            Icon={Phone} />
          <Field label="Nom de la boutique *"  name="nom_boutique"              value={form.nom_boutique} onChange={handleChange} error={errors.nom_boutique} Icon={Store} />

          <div className="ins-field-group">
            <label style={s.label}>Mot de passe *</label>
            <div style={{ position: 'relative' }}>
              <div style={s.inputIcon}><Lock size={13} color={MUTED} strokeWidth={1.8} /></div>
              <input
                name="mot_de_passe"
                type={showMdp ? 'text' : 'password'}
                value={form.mot_de_passe}
                onChange={handleChange}
                style={{ ...s.input, paddingLeft: 36, paddingRight: 40, borderColor: errors.mot_de_passe ? RED : BORDER }}
              />
              {EyeBtn}
            </div>
            {errors.mot_de_passe && <span style={s.errorMsg}>{errors.mot_de_passe}</span>}
            {form.mot_de_passe && (
              <div style={s.strengthWrapper}>
                <div style={s.strengthBar}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ ...s.strengthSeg, background: i <= strength.score ? strength.color : BORDER }} />
                  ))}
                </div>
                <span style={{ color: strength.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="ins-field-group">
            <label style={s.label}>Confirmer le mot de passe *</label>
            <div style={{ position: 'relative' }}>
              <div style={s.inputIcon}><Lock size={13} color={MUTED} strokeWidth={1.8} /></div>
              <input
                name="confirmation_mdp"
                type={showMdp ? 'text' : 'password'}
                value={form.confirmation_mdp}
                onChange={handleChange}
                style={{ ...s.input, paddingLeft: 36, paddingRight: 40, borderColor: errors.confirmation_mdp ? RED : BORDER }}
              />
              {EyeBtn}
            </div>
            {errors.confirmation_mdp && <span style={s.errorMsg}>{errors.confirmation_mdp}</span>}
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="ins-btn-submit"
            style={{
              ...s.btnSubmit,
              opacity: (loading || !isFormValid()) ? 0.55 : 1,
              cursor:  (loading || !isFormValid()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Création en cours...'
              : <><UserPlus size={15} strokeWidth={2.5} /><span>Créer ma boutique</span></>
            }
          </button>
        </form>

        <p className="ins-foot" style={s.foot}>
          Déjà un compte ?{' '}
          <Link to="/connexion" style={s.link}>Se connecter</Link>
        </p>
      </div>
    </AuthBackground>
  )
}

const s = {
  title:           { fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:  { width: 28, height: 3, background: GOLD, borderRadius: 2, margin: '8px auto 10px' },
  subtitle:        { fontSize: 13, color: MUTED, margin: 0 },
  alertError:      { background: '#FEF1F1', border: '1px solid #FBBCBC', color: RED, borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 13 },
  label:           { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:           { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, outline: 'none', boxSizing: 'border-box', background: WHITE, transition: 'border-color 0.2s' },
  inputIcon:       { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  eyeBtn:          { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },
  errorMsg:        { color: RED, fontSize: 11, marginTop: 4, display: 'block' },
  strengthWrapper: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  strengthBar:     { display: 'flex', gap: 3, flex: 1 },
  strengthSeg:     { height: 4, flex: 1, borderRadius: 2, transition: 'background 0.3s' },
  btnSubmit:       { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, background: NAVY, color: WHITE, border: 'none', fontSize: 14, fontWeight: 700, marginTop: 8, transition: 'opacity 0.2s' },
  foot:            { textAlign: 'center', marginTop: 22, fontSize: 13, color: MUTED },
  link:            { color: NAVY, fontWeight: 700, textDecoration: 'none' },
}

export default InscriptionPage