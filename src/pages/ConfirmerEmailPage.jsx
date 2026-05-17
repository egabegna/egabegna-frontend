import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import api from '../services/api'

const NAVY  = '#1B2D5B'
const MUTED = '#B0BEC5'
const GREEN = '#2D7A4F'
const WHITE = '#FFFFFF'
const BG    = '#F4F5F7'

const ETAPES = { CHARGEMENT: 'chargement', SUCCES: 'succes', ERREUR: 'erreur' }

function ConfirmerEmailPage() {
  const { token }                 = useParams()
  const [etape, setEtape]         = useState(ETAPES.CHARGEMENT)
  const [message, setMessage]     = useState('')

  useEffect(() => {
    api.get(`/api/auth/confirmer-email/${token}/`)
      .then(res => {
        setMessage(res.data.detail)
        setEtape(ETAPES.SUCCES)
      })
      .catch(err => {
        setMessage(err.response?.data?.detail || 'Lien invalide ou expiré.')
        setEtape(ETAPES.ERREUR)
      })
  }, [token])

  return (
    <div style={s.page}>
      <div style={s.card}>
        {etape === ETAPES.CHARGEMENT && (
          <p style={{ color: MUTED, fontSize: 13 }}>Vérification en cours...</p>
        )}
        {etape === ETAPES.SUCCES && (
          <>
            <div style={s.icon}>
              <CheckCircle size={32} color={GREEN} strokeWidth={1.5} />
            </div>
            <h1 style={s.title}>Email confirmé ✓</h1>
            <p style={s.text}>{message}</p>
            <Link to="/connexion" style={s.btn}>Se connecter</Link>
          </>
        )}
        {etape === ETAPES.ERREUR && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={s.title}>Lien invalide</h1>
            <p style={s.text}>{message}</p>
            <Link to="/profil" style={s.btn}>Retour au profil</Link>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  page:  { minHeight: '100vh', backgroundColor: BG, display: 'flex',
           alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:  { backgroundColor: WHITE, borderRadius: 16, padding: '48px 40px',
           maxWidth: 420, width: '100%', textAlign: 'center',
           boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  icon:  { width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EBF5EF',
           display: 'flex', alignItems: 'center', justifyContent: 'center',
           margin: '0 auto 20px' },
  title: { fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 12px' },
  text:  { fontSize: 14, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' },
  btn:   { display: 'inline-block', backgroundColor: NAVY, color: WHITE,
           textDecoration: 'none', padding: '11px 24px', borderRadius: 10,
           fontSize: 14, fontWeight: 700 },
}

export default ConfirmerEmailPage