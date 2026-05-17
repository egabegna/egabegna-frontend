import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import api from '../services/api'
import { useAuthContext } from '../store/AuthContext'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'
const RED    = '#c0392b'

function DeuxFacteursLoginPage() {
  const { setSession }          = useAuthContext()
  const navigate                = useNavigate()
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputsRef               = useRef([])

  const tokenTemp = localStorage.getItem('2fa_token_temp')

  useEffect(() => {
    if (!tokenTemp) { navigate('/connexion'); return }
    setTimeout(() => inputsRef.current[0]?.focus(), 100)
  }, [tokenTemp, navigate])

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const nouveau = [...otp]
    nouveau[i]    = val.slice(-1)
    setOtp(nouveau)
    setError('')
    if (val && i < 5) inputsRef.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const nouveau  = [...otp]
      nouveau[i - 1] = ''
      setOtp(nouveau)
      inputsRef.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste   = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const nouveau = [...otp]
    paste.split('').forEach((c, i) => { if (i < 6) nouveau[i] = c })
    setOtp(nouveau)
    inputsRef.current[Math.min(paste.length, 5)]?.focus()
  }

  const code = otp.join('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length < 6) return
    setSubmitting(true)
    setError('')

    try {
      const res = await api.post('/api/auth/2fa/login/', {
        token_temp: tokenTemp,
        code:       code,
      })

      localStorage.removeItem('2fa_token_temp')
      localStorage.removeItem('2fa_email')
      setSession(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Code invalide.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.iconWrap}>
          <Shield size={24} color={GOLD} strokeWidth={1.5} />
        </div>

        <h1 style={s.title}>Vérification 2FA</h1>
        <p style={s.subtitle}>
          Entrez le code à 6 chiffres de votre application
          d'authentification (Google Authenticator, Authy...).
        </p>

        {error && <div style={s.alertError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.otpRow} onPaste={handlePaste}>
            {otp.map((c, i) => (
              <input
                key={i}
                ref={el => inputsRef.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={c}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  ...s.otpInput,
                  borderColor: error ? RED : c ? NAVY : BORDER,
                  backgroundColor: c ? '#F4F5F7' : WHITE,
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || code.length < 6}
            style={{
              ...s.btnPrimary,
              opacity: (submitting || code.length < 6) ? 0.6 : 1,
              cursor:  (submitting || code.length < 6) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Vérification...' : 'Vérifier'}
          </button>
        </form>

        <Link
          to="/connexion"
          onClick={() => {
            localStorage.removeItem('2fa_token_temp')
            localStorage.removeItem('2fa_email')
          }}
          style={s.lienRetour}
        >
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
  title:   { fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 10px' },
  subtitle:{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' },
  alertError: { backgroundColor: '#FEF1F1', border: '1px solid #FBBCBC',
                color: RED, borderRadius: 10, padding: '10px 14px',
                marginBottom: 16, fontSize: 13 },
  otpRow:  { display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 },
  otpInput:{ width: 46, height: 56, textAlign: 'center', fontSize: 22,
             fontWeight: 700, border: '2px solid', borderRadius: 10,
             outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' },
  btnPrimary: { display: 'block', width: '100%', backgroundColor: NAVY, color: WHITE,
                border: 'none', padding: '12px', borderRadius: 10, fontSize: 14,
                fontWeight: 700, cursor: 'pointer', marginBottom: 16,
                transition: 'opacity 0.2s' },
  lienRetour: { display: 'inline-flex', alignItems: 'center', gap: 6,
                color: MUTED, fontSize: 13, textDecoration: 'none' },
}

export default DeuxFacteursLoginPage