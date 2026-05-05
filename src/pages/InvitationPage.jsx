import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthContext } from '../store/AuthContext'
import { getPasswordStrength } from '../utils/passwordStrength'

// ─────────────────────────────────────────────
const ETAPES = { CHARGEMENT: 'chargement', ERREUR: 'erreur', FORMULAIRE: 'formulaire', SUCCES: 'succes' }

function InvitationPage() {
  const { token }          = useParams()
  const navigate           = useNavigate()
  const { setSession }     = useAuthContext()

  const [etape, setEtape]           = useState(ETAPES.CHARGEMENT)
  const [employe, setEmploye]       = useState(null)   // { nom, email_masque }
  const [erreurPage, setErreurPage] = useState('')

  const [otp, setOtp]               = useState(['', '', '', '', '', ''])
  const [mdp, setMdp]               = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [showMdp, setShowMdp]       = useState(false)
  const [errors, setErrors]         = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [otpExpire, setOtpExpire]   = useState(false)
  const [renvoyant, setRenvoyant]   = useState(false)
  const [renvoyeMsg, setRenvoyeMsg] = useState('')

  const inputsRef = useRef([])
  const strength  = getPasswordStrength(mdp)

  // ── 1. Valider le token au chargement ─────
  useEffect(() => {
    const validerToken = async () => {
      try {
        const res = await api.get(`/api/auth/invitation/${token}/`)
        setEmploye(res.data)
        setEtape(ETAPES.FORMULAIRE)
      } catch (err) {
        const msg = err.response?.data?.detail || 'Lien invalide ou expiré.'
        setErreurPage(msg)
        setEtape(ETAPES.ERREUR)
      }
    }
    validerToken()
  }, [token])

  // ── 2. Focus premier input OTP au montage ─
  useEffect(() => {
    if (etape === ETAPES.FORMULAIRE) {
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    }
  }, [etape])

  // ── 3. Gestion des 6 cases OTP ────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return   // chiffres uniquement

    const nouveau = [...otp]
    nouveau[index] = value.slice(-1)   // 1 chiffre max par case
    setOtp(nouveau)
    setErrors(prev => ({ ...prev, otp: '' }))
    setOtpExpire(false)

    // Focus automatique case suivante
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Case vide + backspace → reculer
        const nouveau  = [...otp]
        nouveau[index - 1] = ''
        setOtp(nouveau)
        inputsRef.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft'  && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!paste) return
    const nouveau = [...otp]
    paste.split('').forEach((c, i) => { if (i < 6) nouveau[i] = c })
    setOtp(nouveau)
    // Focus sur la dernière case remplie
    const dernierIndex = Math.min(paste.length, 5)
    inputsRef.current[dernierIndex]?.focus()
  }

  const codeOtp = otp.join('')

  // ── 4. Validation mdp ─────────────────────
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
    codeOtp.length === 6 &&
    mdp.length >= 8 &&
    mdp === confirmMdp

  // ── 5. Soumission activation ──────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setOtpExpire(false)

    try {
      const res = await api.post('/api/auth/activation/', {
        email:           employe.email,   // backend identifie par email
        code:            codeOtp,
        mot_de_passe:    mdp,
        confirmation_mdp: confirmMdp,
      })

      setSession(res.data)
      setEtape(ETAPES.SUCCES)
      setTimeout(() => navigate('/dashboard'), 1500)

    } catch (err) {
      const detail = err.response?.data?.detail || ''

      if (detail.toLowerCase().includes('expiré')) {
        setOtpExpire(true)
        setErrors(prev => ({ ...prev, otp: 'Code expiré.' }))
      } else if (detail.toLowerCase().includes('invalide')) {
        setErrors(prev => ({ ...prev, otp: 'Code incorrect.' }))
        // Vider les cases OTP
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => inputsRef.current[0]?.focus(), 50)
      } else {
        setErrors(prev => ({ ...prev, global: detail || 'Erreur lors de l\'activation.' }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── 6. Renvoyer un code OTP ───────────────
  const handleRenvoyerCode = useCallback(async () => {
    setRenvoyant(true)
    setRenvoyeMsg('')
    setOtpExpire(false)
    setErrors({})
    setOtp(['', '', '', '', '', ''])

    try {
      // Re-valider le token → déclenche un nouvel OTP
      await api.get(`/api/auth/invitation/${token}/`)
      setRenvoyeMsg('Un nouveau code a été envoyé par email.')
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Impossible de renvoyer le code.'
      setErrors(prev => ({ ...prev, global: msg }))
    } finally {
      setRenvoyant(false)
    }
  }, [token])

  // ─────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────

  if (etape === ETAPES.CHARGEMENT) return <PageChargement />
  if (etape === ETAPES.ERREUR)     return <PageErreur message={erreurPage} />
  if (etape === ETAPES.SUCCES)     return <PageSucces />

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.titre}>Egabégna</h1>
          <p style={styles.sousTitre}>Activation de votre compte</p>
          {employe && (
            <div style={styles.employeInfo}>
              Bienvenue <strong>{employe.nom}</strong> —{' '}
              <span style={{ color: '#6b7280' }}>{employe.email_masque}</span>
            </div>
          )}
        </div>

        {/* Messages */}
        {errors.global && <div style={styles.alertError}>{errors.global}</div>}
        {renvoyeMsg    && <div style={styles.alertSuccess}>{renvoyeMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Cases OTP ── */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>
              Code reçu par email
            </label>
            <div style={styles.otpRow} onPaste={handleOtpPaste}>
              {otp.map((chiffre, i) => (
                <input
                  key={i}
                  ref={el => inputsRef.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={chiffre}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    ...styles.otpInput,
                    borderColor: errors.otp
                      ? '#ef4444'
                      : chiffre ? '#111827' : '#d1d5db',
                    backgroundColor: chiffre ? '#f9fafb' : '#fff',
                  }}
                />
              ))}
            </div>

            {errors.otp && (
              <p style={styles.errorMsg}>{errors.otp}</p>
            )}

            {/* Renvoyer un code */}
            {otpExpire ? (
              <button type="button" onClick={handleRenvoyerCode}
                disabled={renvoyant}
                style={{ ...styles.btnLien, opacity: renvoyant ? 0.6 : 1 }}>
                {renvoyant ? 'Envoi...' : '↻ Renvoyer un nouveau code'}
              </button>
            ) : (
              <button type="button" onClick={handleRenvoyerCode}
                disabled={renvoyant}
                style={{ ...styles.btnLienGris, opacity: renvoyant ? 0.6 : 1 }}>
                {renvoyant ? 'Envoi...' : 'Je n\'ai pas reçu le code'}
              </button>
            )}
          </div>

          {/* ── Mot de passe ── */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>Choisir un mot de passe</label>

            <div style={styles.fieldGroup}>
              <input
                type={showMdp ? 'text' : 'password'}
                placeholder="Minimum 8 caractères"
                value={mdp}
                onChange={handleMdpChange}
                style={{
                  ...styles.input,
                  borderColor: errors.mdp ? '#ef4444' : '#d1d5db',
                }}
              />
              {errors.mdp && <span style={styles.errorMsg}>{errors.mdp}</span>}

              {/* Indicateur force */}
              {mdp && (
                <div style={styles.strengthRow}>
                  <div style={styles.strengthBar}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        ...styles.strengthSeg,
                        backgroundColor: i <= strength.score
                          ? strength.color : '#e5e7eb',
                      }} />
                    ))}
                  </div>
                  <span style={{ color: strength.color, fontSize: 12, fontWeight: 600 }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <input
                type={showMdp ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={confirmMdp}
                onChange={handleConfirmChange}
                style={{
                  ...styles.input,
                  borderColor: errors.confirmMdp ? '#ef4444' : '#d1d5db',
                }}
              />
              {errors.confirmMdp && (
                <span style={styles.errorMsg}>{errors.confirmMdp}</span>
              )}
            </div>

            <label style={styles.showMdp}>
              <input type="checkbox" checked={showMdp}
                onChange={() => setShowMdp(v => !v)} />
              {' '}Afficher les mots de passe
            </label>
          </div>

          {/* ── Submit ── */}
          <button type="submit"
            disabled={submitting || !isFormValid()}
            style={{
              ...styles.btnPrimary,
              opacity: (submitting || !isFormValid()) ? 0.6 : 1,
              cursor:  (submitting || !isFormValid()) ? 'not-allowed' : 'pointer',
            }}>
            {submitting ? 'Activation...' : 'Activer mon compte'}
          </button>

        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sous-pages
// ─────────────────────────────────────────────

function PageChargement() {
  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, textAlign: 'center', padding: 60 }}>
        <p style={{ color: '#6b7280' }}>Vérification du lien...</p>
      </div>
    </div>
  )
}

function PageErreur({ message }) {
  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Lien invalide
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
          {message}
        </p>
        <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 16 }}>
          Contactez votre propriétaire pour recevoir un nouveau lien.
        </p>
      </div>
    </div>
  )
}

function PageSucces() {
  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Compte activé !
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Redirection vers votre dashboard...
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', backgroundColor: '#f9fafb', padding: '24px 16px' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: '40px 36px',
          width: '100%', maxWidth: 460,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  header:      { textAlign: 'center', marginBottom: 28 },
  titre:       { fontSize: 26, fontWeight: 700, margin: 0 },
  sousTitre:   { color: '#6b7280', marginTop: 4, marginBottom: 12, fontSize: 14 },
  employeInfo: { backgroundColor: '#f9fafb', borderRadius: 8,
                 padding: '10px 14px', fontSize: 14, marginTop: 8 },

  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                  color: '#dc2626', borderRadius: 8, padding: '10px 14px',
                  marginBottom: 16, fontSize: 14 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                  color: '#15803d', borderRadius: 8, padding: '10px 14px',
                  marginBottom: 16, fontSize: 14 },

  section:      { marginBottom: 24 },
  sectionLabel: { display: 'block', fontSize: 13, fontWeight: 600,
                  color: '#374151', marginBottom: 12,
                  textTransform: 'uppercase', letterSpacing: '0.5px' },

  otpRow:   { display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 },
  otpInput: { width: 46, height: 56, textAlign: 'center', fontSize: 22,
              fontWeight: 700, border: '2px solid #d1d5db', borderRadius: 10,
              outline: 'none', transition: 'border-color 0.15s',
              fontFamily: 'monospace' },

  btnLien:     { display: 'block', margin: '8px auto 0', background: 'none',
                 border: 'none', color: '#2563eb', fontSize: 13,
                 cursor: 'pointer', textDecoration: 'underline', padding: 0 },
  btnLienGris: { display: 'block', margin: '8px auto 0', background: 'none',
                 border: 'none', color: '#9ca3af', fontSize: 12,
                 cursor: 'pointer', padding: 0 },

  fieldGroup:   { marginBottom: 14 },
  input:        { width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1.5px solid #d1d5db', fontSize: 14,
                  boxSizing: 'border-box', outline: 'none' },
  errorMsg:     { color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' },

  strengthRow:  { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBar:  { display: 'flex', gap: 4, flex: 1 },
  strengthSeg:  { height: 4, flex: 1, borderRadius: 2, transition: 'background-color 0.3s' },

  showMdp:    { fontSize: 13, color: '#6b7280', cursor: 'pointer', display: 'block' },
  btnPrimary: { width: '100%', padding: 12, borderRadius: 8,
                backgroundColor: '#111827', color: '#fff', border: 'none',
                fontSize: 15, fontWeight: 600, marginTop: 8, transition: 'opacity 0.2s' },
}

export default InvitationPage