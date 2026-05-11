import { useState } from 'react'
import { useSuperadmin } from '../../store/SuperadminContext'
import superadminService from '../../services/superadminService'
import { Lock, User, ShieldAlert } from 'lucide-react'

const D = {
  bg:       '#0B1120',
  surface:  '#131C2E',
  surface2: '#1A2540',
  border:   '#1F2D45',
  text:     '#F0F4FF',
  muted:    '#5B7099',
  subtle:   '#8FA3C4',
  purple:   '#7C5CFC',
  purpleL:  '#9B80FF',
  red:      '#EF4444',
  redL:     '#FCA5A5',
  redD:     '#450A0A',
}

function SuperadminLoginPage() {
  const { saLogin }           = useSuperadmin()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await superadminService.login(form.username, form.password)
      saLogin(res.data.access, res.data.refresh)
    } catch {
      setError('Identifiants incorrects ou accès non autorisé.')
    } finally {
      setLoading(false)
    }
  }

  const isValid = form.username && form.password

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* ── Logo / Header ── */}
        <div style={s.header}>
          <div style={s.iconWrap}>
            <ShieldAlert size={28} color={D.purpleL} strokeWidth={1.8} />
          </div>
          <div style={s.superBadge}>SUPERADMIN</div>
          <h1 style={s.title}>Egabégna</h1>
          <p style={s.subtitle}>Interface d'administration sécurisée</p>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div style={s.alertError}>
            <Lock size={13} strokeWidth={2} />
            {error}
          </div>
        )}

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit} noValidate>

          <div style={s.fieldGroup}>
            <label style={s.label}>Nom d'utilisateur</label>
            <div style={{
              ...s.inputWrap,
              borderColor: focused === 'username' ? D.purple : D.border,
              boxShadow:   focused === 'username' ? `0 0 0 3px rgba(124,92,252,0.15)` : 'none',
            }}>
              <User size={14} color={focused === 'username' ? D.purpleL : D.muted} strokeWidth={1.8} />
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused('')}
                autoComplete="username"
                style={s.input}
              />
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Mot de passe</label>
            <div style={{
              ...s.inputWrap,
              borderColor: focused === 'password' ? D.purple : D.border,
              boxShadow:   focused === 'password' ? `0 0 0 3px rgba(124,92,252,0.15)` : 'none',
            }}>
              <Lock size={14} color={focused === 'password' ? D.purpleL : D.muted} strokeWidth={1.8} />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                autoComplete="current-password"
                style={s.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isValid}
            style={{
              ...s.btn,
              opacity: (loading || !isValid) ? 0.5 : 1,
              cursor:  (loading || !isValid) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Connexion en cours...' : 'Accéder au panneau'}
          </button>
        </form>

        {/* ── Footer ── */}
        <p style={s.footer}>Accès réservé aux administrateurs Egabégna</p>
      </div>
    </div>
  )
}

const s = {
  page:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg, padding: 16 },
  card:      { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },
  header:    { textAlign: 'center', marginBottom: 32 },
  iconWrap:  { width: 60, height: 60, borderRadius: 16, background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  superBadge:{ display: 'inline-block', background: 'rgba(124,92,252,0.2)', color: D.purpleL, fontSize: 10, fontWeight: 800, letterSpacing: '2.5px', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(124,92,252,0.3)', marginBottom: 12 },
  title:     { fontSize: 26, fontWeight: 800, color: D.text, margin: '0 0 6px', letterSpacing: '-0.5px' },
  subtitle:  { color: D.muted, fontSize: 13, margin: 0 },
  alertError:{ display: 'flex', alignItems: 'center', gap: 8, background: D.redD, border: `1px solid rgba(239,68,68,0.3)`, color: D.redL, borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, fontWeight: 500 },
  fieldGroup:{ marginBottom: 18 },
  label:     { display: 'block', fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: { display: 'flex', alignItems: 'center', gap: 10, background: D.bg, border: `1.5px solid ${D.border}`, borderRadius: 10, padding: '10px 14px', transition: 'border-color 0.15s, box-shadow 0.15s' },
  input:     { flex: 1, border: 'none', outline: 'none', background: 'transparent', color: D.text, fontSize: 13, fontWeight: 500 },
  btn:       { width: '100%', padding: '13px', borderRadius: 10, background: D.purple, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, marginTop: 8, letterSpacing: '0.3px', transition: 'opacity 0.15s' },
  footer:    { textAlign: 'center', color: D.muted, fontSize: 11, marginTop: 24, letterSpacing: '0.3px' },
}

export default SuperadminLoginPage