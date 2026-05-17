import { useState } from 'react'
import { Shield, ShieldCheck, ShieldOff, QrCode } from 'lucide-react'
import api from '../services/api'

const NAVY  = '#1B2D5B'
const GOLD  = '#C89A3C'
const MUTED = '#B0BEC5'
const GREEN = '#2D7A4F'
const RED   = '#c0392b'
const WHITE = '#FFFFFF'
const BG    = '#F4F5F7'
const BORDER = '#EAECEF'

function DeuxFacteursSection() {
  const [etape, setEtape]       = useState('idle') // idle | qrcode | desactiver
  const [qrCode, setQrCode]     = useState('')
  const [secret, setSecret]     = useState('')
  const [code, setCode]         = useState('')
  const [mdpConfirm, setMdpConfirm] = useState('')
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState({ type: '', text: '' })
  const [actif, setActif]       = useState(false)

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const handleActiver = async () => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/2fa/activer/')
      setQrCode(res.data.qr_code)
      setSecret(res.data.secret)
      setEtape('qrcode')
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifier = async () => {
    if (code.length < 6) return
    setLoading(true)
    try {
      await api.post('/api/auth/2fa/verifier/', { code })
      setActif(true)
      setEtape('idle')
      setCode('')
      showMsg('success', '2FA activée avec succès.')
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Code invalide.')
    } finally {
      setLoading(false)
    }
  }

  const handleDesactiver = async () => {
    if (!mdpConfirm) return
    setLoading(true)
    try {
      await api.post('/api/auth/2fa/desactiver/', { mot_de_passe: mdpConfirm })
      setActif(false)
      setEtape('idle')
      setMdpConfirm('')
      showMsg('success', '2FA désactivée.')
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={cs.card}>
      <div style={cs.header}>
        <Shield size={14} color={NAVY} strokeWidth={2} />
        <span style={cs.title}>Authentification à deux facteurs (2FA)</span>
        {actif && (
          <span style={{ ...cs.badge, background: '#EBF5EF', color: GREEN }}>
            Activée
          </span>
        )}
      </div>
      <div style={cs.divider} />

      {msg.text && (
        <div style={msg.type === 'success' ? cs.alertSuccess : cs.alertError}>
          {msg.text}
        </div>
      )}

      <p style={cs.desc}>
        Sécurisez votre compte avec une application d'authentification
        (Google Authenticator, Authy, etc.).
      </p>

      {/* État idle */}
      {etape === 'idle' && !actif && (
        <button onClick={handleActiver} disabled={loading} style={cs.btnPrimary}>
          <QrCode size={13} strokeWidth={2} />
          <span>{loading ? 'Chargement...' : 'Activer la 2FA'}</span>
        </button>
      )}

      {etape === 'idle' && actif && (
        <button onClick={() => setEtape('desactiver')} style={cs.btnDanger}>
          <ShieldOff size={13} strokeWidth={2} />
          <span>Désactiver la 2FA</span>
        </button>
      )}

      {/* QR Code */}
      {etape === 'qrcode' && (
        <div style={{ textAlign: 'center' }}>
          <p style={cs.step}>
            1. Scannez ce QR code avec votre application d'authentification
          </p>
          {qrCode && (
            <img src={qrCode} alt="QR Code 2FA"
              style={{ width: 180, height: 180, margin: '0 auto 16px',
                       display: 'block', borderRadius: 8 }} />
          )}
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
            Clé manuelle : <code style={{ background: BG, padding: '2px 6px',
                                          borderRadius: 4, fontSize: 11 }}>
              {secret}
            </code>
          </p>
          <p style={cs.step}>
            2. Entrez le code affiché dans l'application
          </p>
          <div style={cs.otpRow}>
            {[0,1,2,3,4,5].map(i => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[i] || ''}
                onChange={e => {
                  const chars = code.split('')
                  chars[i]    = e.target.value.replace(/\D/g, '').slice(-1)
                  setCode(chars.join(''))
                }}
                style={cs.otpInput}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={handleVerifier}
              disabled={loading || code.length < 6}
              style={{ ...cs.btnPrimary,
                       opacity: (loading || code.length < 6) ? 0.6 : 1 }}>
              <ShieldCheck size={13} strokeWidth={2} />
              <span>{loading ? '...' : 'Confirmer'}</span>
            </button>
            <button onClick={() => { setEtape('idle'); setCode('') }}
              style={cs.btnSecondary}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Désactivation */}
      {etape === 'desactiver' && (
        <div>
          <p style={cs.step}>
            Confirmez votre mot de passe pour désactiver la 2FA
          </p>
          <input
            type="password"
            value={mdpConfirm}
            onChange={e => setMdpConfirm(e.target.value)}
            placeholder="Votre mot de passe"
            style={{ ...cs.input, marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDesactiver}
              disabled={loading || !mdpConfirm}
              style={{ ...cs.btnDanger,
                       opacity: (loading || !mdpConfirm) ? 0.6 : 1 }}>
              {loading ? '...' : 'Confirmer la désactivation'}
            </button>
            <button onClick={() => { setEtape('idle'); setMdpConfirm('') }}
              style={cs.btnSecondary}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const cs = {
  card:    { background: WHITE, border: `1px solid ${BORDER}`,
             borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  header:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  title:   { fontSize: 11, fontWeight: 700, color: NAVY,
             textTransform: 'uppercase', letterSpacing: '1.5px', flex: 1 },
  badge:   { padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  divider: { height: 1, background: BORDER, marginBottom: 18 },
  desc:    { fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 16px' },
  step:    { fontSize: 12, color: NAVY, fontWeight: 600, marginBottom: 12 },
  alertSuccess: { background: '#EBF5EF', border: '1px solid #A8D5B5',
                  color: GREEN, borderRadius: 10, padding: '10px 14px',
                  marginBottom: 14, fontSize: 13 },
  alertError:   { background: '#FEF1F1', border: '1px solid #FBBCBC',
                  color: RED, borderRadius: 10, padding: '10px 14px',
                  marginBottom: 14, fontSize: 13 },
  otpRow:  { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 },
  otpInput:{ width: 40, height: 48, textAlign: 'center', fontSize: 18,
             fontWeight: 700, border: `2px solid ${BORDER}`, borderRadius: 8,
             outline: 'none', fontFamily: 'monospace' },
  input:   { width: '100%', padding: '10px 12px', borderRadius: 9,
             border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
             boxSizing: 'border-box', outline: 'none', background: WHITE },
  btnPrimary:  { display: 'inline-flex', alignItems: 'center', gap: 6,
                 background: NAVY, color: WHITE, border: 'none',
                 padding: '9px 16px', borderRadius: 9, fontSize: 12,
                 fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ display: 'inline-flex', alignItems: 'center', gap: 6,
                 background: BG, color: NAVY, border: 'none',
                 padding: '9px 16px', borderRadius: 9, fontSize: 12, cursor: 'pointer' },
  btnDanger:   { display: 'inline-flex', alignItems: 'center', gap: 6,
                 background: '#FEF1F1', color: RED, border: '1px solid #FBBCBC',
                 padding: '9px 16px', borderRadius: 9, fontSize: 12,
                 fontWeight: 700, cursor: 'pointer' },
}

export default DeuxFacteursSection