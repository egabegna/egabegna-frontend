import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import authService from '../services/authService'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'
const GREEN  = '#2D7A4F'
const RED    = '#c0392b'

function MotDePasseOubliePage() {
  const [email, setEmail]       = useState('')
  const [envoye, setEnvoye]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email requis.'); return }
    setLoading(true)
    setError('')

    try {
      await authService.resetPasswordDemande(email.trim())
      setEnvoye(true)
    } catch {
      // Toujours afficher le message générique
      setEnvoye(true)
    } finally {
      setLoading(false)
    }
  }

  // ── Écran succès ──
  if (envoye) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.successIcon}>
          <CheckCircle size={32} color={GREEN} strokeWidth={1.5} />
        </div>
        <h1 style={s.title}>Email envoyé</h1>
        <p style={s.successText}>
          Si un compte existe avec l'adresse <strong>{email}</strong>,
          vous recevrez un lien de réinitialisation dans quelques minutes.
        </p>
        <p style={s.successHint}>
          Vérifiez aussi vos spams.
        </p>
        <Link to="/connexion" style={s.btnPrimary}>
          Retour à la connexion
        </Link>
      </div>
    </div>
  )

  // ── Formulaire ──
  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.iconWrap}>
          <Mail size={24} color={GOLD} strokeWidth={1.5} />
        </div>

        <h1 style={s.title}>Mot de passe oublié</h1>
        <p style={s.subtitle}>
          Entrez votre email et nous vous enverrons un lien
          pour réinitialiser votre mot de passe.
        </p>

        {error && <div style={s.alertError}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={s.fieldGroup}>
            <label style={s.label}>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="votre@email.com"
              style={s.input}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              ...s.btnPrimary,
              opacity: (loading || !email.trim()) ? 0.6 : 1,
              cursor:  (loading || !email.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <Link to="/connexion" style={s.lienRetour}>
          <ArrowLeft size={13} strokeWidth={2} />
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}

const s = {
  page:    { minHeight: '100vh', backgroundColor: BG, display: 'flex',
             alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:    { backgroundColor: WHITE, borderRadius: 16, padding: '40px 36px',
             width: '100%', maxWidth: 420,
             boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  iconWrap:{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#FBF5E9',
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             margin: '0 auto 20px' },
  successIcon: { width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EBF5EF',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 margin: '0 auto 20px' },
  title:   { fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 10px',
             letterSpacing: '-0.3px' },
  subtitle:{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' },
  successText: { fontSize: 14, color: NAVY, lineHeight: 1.6, margin: '0 0 8px' },
  successHint: { fontSize: 12, color: MUTED, margin: '0 0 24px' },
  alertError:  { backgroundColor: '#FEF1F1', border: '1px solid #FBBCBC',
                 color: RED, borderRadius: 10, padding: '10px 14px',
                 marginBottom: 16, fontSize: 13, textAlign: 'left' },
  fieldGroup:  { marginBottom: 16, textAlign: 'left' },
  label:       { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
                 letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:       { width: '100%', padding: '11px 14px', borderRadius: 10,
                 border: `1.5px solid ${BORDER}`, fontSize: 14, color: NAVY,
                 boxSizing: 'border-box', outline: 'none', backgroundColor: WHITE },
  btnPrimary:  { display: 'block', width: '100%', backgroundColor: NAVY, color: WHITE,
                 border: 'none', padding: '12px', borderRadius: 10, fontSize: 14,
                 fontWeight: 700, cursor: 'pointer', textDecoration: 'none',
                 marginBottom: 20, transition: 'opacity 0.2s' },
  lienRetour:  { display: 'inline-flex', alignItems: 'center', gap: 6,
                 color: MUTED, fontSize: 13, textDecoration: 'none' },
}

export default MotDePasseOubliePage