import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import AuthBackground from '../components/shared/AuthBackground'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const INITIAL_FORM   = { email: '', mot_de_passe: '' }
const INITIAL_ERRORS = { email: '', mot_de_passe: '', global: '' }

function useIsMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  })
  return isMobile
}

function ConnexionPage() {
  const isMobile              = useIsMobile()
  const [form, setForm]       = useState(INITIAL_FORM)
  const [errors, setErrors]   = useState(INITIAL_ERRORS)
  const [loading, setLoading] = useState(false)
  const [showMdp, setShowMdp] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '', global: '' }))
  }

  const isFormValid = () => form.email.trim() && form.mot_de_passe.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors(INITIAL_ERRORS)
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login/`, {
        email: form.email.trim(),
        mot_de_passe: form.mot_de_passe,
      })
      const data = response.data

      if (data.multi_boutique) {
        localStorage.setItem('mb_email', form.email.trim())
        localStorage.setItem('mb_boutiques', JSON.stringify(data.boutiques))
        window.location.href = '/choisir-boutique'
        return
      }

      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('role', data.role)
      localStorage.setItem('nom_boutique', data.nom_boutique)
      window.location.href = '/dashboard'
    } catch (err) {
      const detail = err.response?.data?.detail
      setErrors(prev => ({ ...prev, global: detail || 'Email ou mot de passe incorrect.' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthBackground>
      <div style={{
        ...s.card,
        borderRadius:  isMobile ? 14 : 18,
        padding:       isMobile ? '28px 20px' : '40px 36px',
        width:         isMobile ? 'calc(100% - 32px)' : '100%',
        maxWidth:      420,
        boxShadow:     isMobile
          ? '0 8px 32px rgba(0,0,0,0.18)'
          : '0 20px 60px rgba(0,0,0,0.28)',
      }}>

        {/* Brand */}
        <div style={{ ...s.brand, marginBottom: isMobile ? 22 : 28 }}>
          <div style={{
            ...s.brandIcon,
            width:  isMobile ? 48 : 56,
            height: isMobile ? 48 : 56,
            marginBottom: isMobile ? 10 : 14,
          }}>
            <img
              src="/icons/egabegna-icon.svg"
              alt="Egabégna"
              style={{ width: isMobile ? 24 : 40, height: isMobile ? 24 : 74 }}
            />
          </div>
          <h1 style={{ ...s.title, fontSize: isMobile ? 20 : 24 }}>Egabégna</h1>
          <div style={s.titleUnderline} />
          <p style={{ ...s.subtitle, fontSize: isMobile ? 12 : 13 }}>
            Connexion à votre boutique
          </p>
        </div>

        {errors.global && <div style={s.alertError}>{errors.global}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Email</label>
            <div style={{ position: 'relative' }}>
              <div style={s.inputIcon}><Mail size={13} color={MUTED} strokeWidth={1.8} /></div>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="votre@email.com" autoComplete="email"
                style={{ ...s.input, paddingLeft: 36, fontSize: isMobile ? 16 : 13 }} />
            </div>
          </div>

          {/* Mot de passe */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={s.inputIcon}><Lock size={13} color={MUTED} strokeWidth={1.8} /></div>
              <input name="mot_de_passe" type={showMdp ? 'text' : 'password'}
                value={form.mot_de_passe} onChange={handleChange}
                placeholder="••••••••" autoComplete="current-password"
                style={{ ...s.input, paddingLeft: 36, paddingRight: 40, fontSize: isMobile ? 16 : 13 }} />
              <button type="button" onClick={() => setShowMdp(v => !v)} style={s.eyeBtn} tabIndex={-1}>
                {showMdp
                  ? <EyeOff size={14} color={MUTED} strokeWidth={1.8} />
                  : <Eye    size={14} color={MUTED} strokeWidth={1.8} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !isFormValid()}
            style={{
              ...s.btnSubmit,
              padding:   isMobile ? '14px' : '12px',
              fontSize:  isMobile ? 15 : 14,
              marginTop: isMobile ? 12 : 8,
              opacity:   (loading || !isFormValid()) ? 0.55 : 1,
              cursor:    (loading || !isFormValid()) ? 'not-allowed' : 'pointer',
            }}>
            {loading
              ? 'Connexion...'
              : <><LogIn size={15} strokeWidth={2.5} /><span>Se connecter</span></>}
          </button>

          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <Link to="/mot-de-passe-oublie"
              style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
          </div>
        </form>

        <p style={{ ...s.foot, marginTop: isMobile ? 18 : 22, fontSize: isMobile ? 12 : 13 }}>
          Pas encore de compte ?{' '}
          <Link to="/inscription" style={s.link}>S'inscrire</Link>
        </p>
      </div>
    </AuthBackground>
  )
}

const s = {
  card:          { background: WHITE, borderRadius: 18, padding: '40px 36px', width: '100%', maxWidth: 420, border: `1px solid ${BORDER}`, boxShadow: '0 20px 60px rgba(0,0,0,0.28)' },
  brand:         { textAlign: 'center', marginBottom: 28 },
  brandIcon:     { width: 63, height: 63, background: NAVY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(27,45,91,0.35)' },
  brandLetter:   { fontSize: 26, fontWeight: 800, color: GOLD },
  title:         { fontSize: 24, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 28, height: 3, background: GOLD, borderRadius: 2, margin: '8px auto 10px' },
  subtitle:      { fontSize: 13, color: MUTED, margin: 0 },
  alertError:    { background: '#FEF1F1', border: '1px solid #FBBCBC', color: RED, borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 13 },
  fieldGroup:    { marginBottom: 16 },
  label:         { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:         { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, outline: 'none', boxSizing: 'border-box', background: WHITE },
  inputIcon:     { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  eyeBtn:        { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },
  btnSubmit:     { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, background: NAVY, color: WHITE, border: 'none', fontSize: 14, fontWeight: 700, marginTop: 8, transition: 'opacity 0.2s' },
  foot:          { textAlign: 'center', marginTop: 22, fontSize: 13, color: MUTED },
  link:          { color: NAVY, fontWeight: 700, textDecoration: 'none' },
}

export default ConnexionPage
