import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react'
import authService from '../services/authService'
import { getPasswordStrength } from '../utils/passwordStrength'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'
const GREEN  = '#2D7A4F'
const RED    = '#c0392b'

const ETAPES = {
  CHARGEMENT: 'chargement',
  FORMULAIRE: 'formulaire',
  SUCCES:     'succes',
  ERREUR:     'erreur',
}

function ResetPasswordPage() {
  const { token }    = useParams()
  const navigate     = useNavigate()

  const [etape, setEtape]         = useState(ETAPES.CHARGEMENT)
  const [erreurPage, setErreurPage] = useState('')
  const [mdp, setMdp]             = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [showMdp, setShowMdp]     = useState(false)
  const [errors, setErrors]       = useState({})
  const [submitting, setSubmitting] = useState(false)

  const strength = getPasswordStrength(mdp)

  // ── Valider le token au chargement ──
  useEffect(() => {
    // On ne peut pas valider le token sans l'envoyer au backend
    // On affiche directement le formulaire — la validation se fait à la soumission
    // Si le token est invalide → erreur à la soumission
    if (token) {
      setEtape(ETAPES.FORMULAIRE)
    } else {
      setErreurPage('Lien invalide.')
      setEtape(ETAPES.ERREUR)
    }
  }, [token])

  const handleMdpChange = (e) => {
    setMdp(e.target.value)
    setErrors(prev => ({
      ...prev,
      mdp: e.target.value.length >= 8 ? '' : 'Minimum 8 caractères.',
    }))
  }

  const handleConfirmChange = (e) => {
    setConfirmMdp(e.target.value)
    setErrors(prev => ({
      ...prev,
      confirmMdp: e.target.value === mdp ? '' : 'Les mots de passe ne correspondent pas.',
    }))
  }

  const isFormValid = () =>
    mdp.length >= 8 && mdp === confirmMdp

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid()) return
    setSubmitting(true)
    setErrors({})

    try {
      await authService.resetPasswordConfirm(token, mdp, confirmMdp)
      setEtape(ETAPES.SUCCES)
      setTimeout(() => navigate('/connexion'), 3000)
    } catch (err) {
      const detail = err.response?.data?.detail || ''

      if (detail.includes('expiré')) {
        setErreurPage('Ce lien a expiré. Faites une nouvelle demande.')
        setEtape(ETAPES.ERREUR)
      } else if (detail.includes('utilisé')) {
        setErreurPage('Ce lien a déjà été utilisé.')
        setEtape(ETAPES.ERREUR)
      } else if (detail.includes('invalide')) {
        setErreurPage('Lien de réinitialisation invalide.')
        setEtape(ETAPES.ERREUR)
      } else {
        setErrors({ global: detail || 'Erreur lors de la réinitialisation.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Chargement ──
  if (etape === ETAPES.CHARGEMENT) return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={{ color: MUTED, fontSize: 13 }}>Vérification du lien...</p>
      </div>
    </div>
  )

  // ── Erreur ──
  if (etape === ETAPES.ERREUR) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.erreurIcon}>⚠️</div>
        <h1 style={s.title}>Lien invalide</h1>
        <p style={{ ...s.subtitle, marginBottom: 24 }}>{erreurPage}</p>
        <Link to="/mot-de-passe-oublie" style={s.btnPrimary}>
          Faire une nouvelle demande
        </Link>
        <Link to="/connexion" style={s.lienRetour}>
          <ArrowLeft size={13} strokeWidth={2} />
          Retour à la connexion
        </Link>
      </div>
    </div>
  )

  // ── Succès ──
  if (etape === ETAPES.SUCCES) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.successIcon}>
          <CheckCircle size={32} color={GREEN} strokeWidth={1.5} />
        </div>
        <h1 style={s.title}>Mot de passe modifié</h1>
        <p style={s.subtitle}>
          Votre mot de passe a été réinitialisé avec succès.
          Redirection vers la connexion dans 3 secondes...
        </p>
        <Link to="/connexion" style={s.btnPrimary}>
          Se connecter maintenant
        </Link>
      </div>
    </div>
  )

  // ── Formulaire ──
  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.iconWrap}>
          <KeyRound size={24} color={GOLD} strokeWidth={1.5} />
        </div>

        <h1 style={s.title}>Nouveau mot de passe</h1>
        <p style={s.subtitle}>
          Choisissez un mot de passe sécurisé d'au moins 8 caractères.
        </p>

        {errors.global && (
          <div style={s.alertError}>{errors.global}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Mot de passe */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Nouveau mot de passe</label>
            <input
              type={showMdp ? 'text' : 'password'}
              value={mdp}
              onChange={handleMdpChange}
              placeholder="Minimum 8 caractères"
              style={{
                ...s.input,
                borderColor: errors.mdp ? RED : BORDER,
              }}
            />
            {errors.mdp && (
              <span style={s.errorMsg}>{errors.mdp}</span>
            )}

            {/* Indicateur force */}
            {mdp && (
              <div style={s.strengthRow}>
                <div style={s.strengthBar}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      ...s.strengthSeg,
                      backgroundColor: i <= strength.score
                        ? strength.color : '#e5e7eb',
                    }} />
                  ))}
                </div>
                <span style={{
                  color: strength.color, fontSize: 11, fontWeight: 600
                }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Confirmer le mot de passe</label>
            <input
              type={showMdp ? 'text' : 'password'}
              value={confirmMdp}
              onChange={handleConfirmChange}
              placeholder="Répéter le mot de passe"
              style={{
                ...s.input,
                borderColor: errors.confirmMdp ? RED : BORDER,
              }}
            />
            {errors.confirmMdp && (
              <span style={s.errorMsg}>{errors.confirmMdp}</span>
            )}
          </div>

          {/* Toggle affichage */}
          <label style={s.showMdp}>
            <input
              type="checkbox"
              checked={showMdp}
              onChange={() => setShowMdp(v => !v)}
            />
            {' '}Afficher les mots de passe
          </label>

          <button
            type="submit"
            disabled={submitting || !isFormValid()}
            style={{
              ...s.btnPrimary,
              opacity: (submitting || !isFormValid()) ? 0.6 : 1,
              cursor:  (submitting || !isFormValid()) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Modification...' : 'Modifier mon mot de passe'}
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
             width: '100%', maxWidth: 440,
             boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  iconWrap:    { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FBF5E9',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 margin: '0 auto 20px' },
  successIcon: { width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EBF5EF',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 margin: '0 auto 20px' },
  erreurIcon:  { fontSize: 48, marginBottom: 16 },
  title:   { fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 10px',
             letterSpacing: '-0.3px' },
  subtitle:{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' },
  alertError:  { backgroundColor: '#FEF1F1', border: '1px solid #FBBCBC',
                 color: RED, borderRadius: 10, padding: '10px 14px',
                 marginBottom: 16, fontSize: 13, textAlign: 'left' },
  fieldGroup:  { marginBottom: 16, textAlign: 'left' },
  label:       { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
                 letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:       { width: '100%', padding: '11px 14px', borderRadius: 10,
                 border: `1.5px solid ${BORDER}`, fontSize: 14, color: NAVY,
                 boxSizing: 'border-box', outline: 'none', backgroundColor: WHITE },
  errorMsg:    { color: RED, fontSize: 12, marginTop: 4, display: 'block' },
  strengthRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  strengthBar: { display: 'flex', gap: 4, flex: 1 },
  strengthSeg: { height: 4, flex: 1, borderRadius: 2, transition: 'background-color 0.3s' },
  showMdp:     { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                 color: MUTED, cursor: 'pointer', marginBottom: 20, textAlign: 'left' },
  btnPrimary:  { display: 'block', width: '100%', backgroundColor: NAVY, color: WHITE,
                 border: 'none', padding: '12px', borderRadius: 10, fontSize: 14,
                 fontWeight: 700, cursor: 'pointer', textDecoration: 'none',
                 marginBottom: 16, transition: 'opacity 0.2s', boxSizing: 'border-box' },
  lienRetour:  { display: 'inline-flex', alignItems: 'center', gap: 6,
                 color: MUTED, fontSize: 13, textDecoration: 'none' },
}

export default ResetPasswordPage