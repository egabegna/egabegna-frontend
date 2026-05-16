import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Store, ChevronRight, ShieldOff } from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'
const GREEN  = '#2D7A4F'
const RED    = '#c0392b'

const ROLE_LABELS = {
  proprietaire: 'Propriétaire',
  manager:      'Manager',
  vendeur:      'Vendeur',
  ambulant:     'Ambulant',
}

const ROLE_COLORS = {
  proprietaire: { bg: '#EEF1F8', color: NAVY  },
  manager:      { bg: '#EBF5EF', color: GREEN },
  vendeur:      { bg: '#FBF5E9', color: GOLD  },
  ambulant:     { bg: '#FEF1F1', color: RED   },
}

function ChoisirBoutiquePage() {
  const { choisirBoutique }   = useAuth()
  const navigate              = useNavigate()
  const [loading, setLoading] = useState(null)  // id boutique en cours
  const [error, setError]     = useState('')

  // Récupérer la liste depuis localStorage
  const boutiques = JSON.parse(
    localStorage.getItem('mb_boutiques') || '[]'
  )

  // Si pas de boutiques en attente → redirect connexion
  if (boutiques.length === 0) {
    navigate('/connexion')
    return null
  }

  const handleChoisir = async (boutique) => {
    if (boutique.suspendue) return
    setLoading(boutique.id)
    setError('')

    try {
      await choisirBoutique(boutique.id)
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Erreur lors de la sélection.'
      )
      setLoading(null)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logoWrap}>
            <Store size={24} color={GOLD} strokeWidth={1.8} />
          </div>
          <h1 style={s.title}>Choisir une boutique</h1>
          <p style={s.subtitle}>
            Votre compte est associé à plusieurs boutiques.
            Sélectionnez celle avec laquelle vous souhaitez travailler.
          </p>
        </div>

        {/* Erreur */}
        {error && <div style={s.alertError}>{error}</div>}

        {/* Liste boutiques */}
        <div style={s.liste}>
          {boutiques.map(b => {
            const rc        = ROLE_COLORS[b.role] || { bg: BG, color: MUTED }
            const isLoading = loading === b.id
            const isSuspend = b.suspendue

            return (
              <button
                key={b.id}
                onClick={() => handleChoisir(b)}
                disabled={isSuspend || !!loading}
                style={{
                  ...s.boutiqueBtn,
                  opacity:    isSuspend ? 0.55 : 1,
                  cursor:     isSuspend ? 'not-allowed' : loading ? 'wait' : 'pointer',
                  borderColor: isLoading ? NAVY : BORDER,
                  boxShadow:  isLoading
                    ? `0 0 0 2px ${NAVY}20`
                    : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {/* Logo / Avatar */}
                <div style={s.boutiqueAvatar}>
                  {b.logo ? (
                    <img src={b.logo} alt={b.nom}
                      style={{ width: '100%', height: '100%',
                               objectFit: 'contain', borderRadius: 8 }} />
                  ) : (
                    <Store size={20} color={NAVY} strokeWidth={1.5} />
                  )}
                </div>

                {/* Infos */}
                <div style={s.boutiqueInfo}>
                  <div style={s.boutiqueNom}>{b.nom}</div>
                  <div style={s.boutiqueMeta}>
                    <span style={{ ...s.roleBadge, background: rc.bg, color: rc.color }}>
                      {ROLE_LABELS[b.role] || b.role}
                    </span>
                    {isSuspend && (
                      <span style={s.suspendBadge}>
                        <ShieldOff size={10} strokeWidth={2} />
                        Suspendue
                      </span>
                    )}
                  </div>
                  {isSuspend && (
                    <p style={s.suspendMsg}>
                      Cette boutique est suspendue — contactez l'administrateur.
                    </p>
                  )}
                </div>

                {/* Indicateur droit */}
                <div style={s.boutiqueRight}>
                  {isLoading ? (
                    <div style={s.spinner} />
                  ) : !isSuspend ? (
                    <ChevronRight size={18} color={MUTED} strokeWidth={1.8} />
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>

        {/* Lien retour */}
        <div style={s.footer}>
          <button
            onClick={() => {
              localStorage.removeItem('mb_email')
              localStorage.removeItem('mb_boutiques')
              navigate('/connexion')
            }}
            style={s.btnRetour}
          >
            ← Retour à la connexion
          </button>
        </div>

      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight:       '100vh',
    backgroundColor: BG,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '24px 16px',
  },
  card: {
    backgroundColor: WHITE,
    borderRadius:    16,
    padding:         '40px 36px',
    width:           '100%',
    maxWidth:        480,
    boxShadow:       '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign:    'center',
    marginBottom: 28,
  },
  logoWrap: {
    width:          52,
    height:         52,
    borderRadius:   14,
    backgroundColor: '#FBF5E9',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    margin:         '0 auto 16px',
  },
  title: {
    fontSize:      22,
    fontWeight:    800,
    color:         NAVY,
    margin:        '0 0 8px',
    letterSpacing: '-0.4px',
  },
  subtitle: {
    fontSize:   13,
    color:      MUTED,
    lineHeight: 1.6,
    margin:     0,
  },
  alertError: {
    backgroundColor: '#FEF1F1',
    border:          '1px solid #FBBCBC',
    color:           RED,
    borderRadius:    10,
    padding:         '10px 14px',
    marginBottom:    16,
    fontSize:        13,
  },
  liste: {
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
    marginBottom:  24,
  },
  boutiqueBtn: {
    display:         'flex',
    alignItems:      'center',
    gap:             14,
    width:           '100%',
    backgroundColor: WHITE,
    border:          `1.5px solid ${BORDER}`,
    borderRadius:    12,
    padding:         '14px 16px',
    textAlign:       'left',
    transition:      'all 0.15s',
  },
  boutiqueAvatar: {
    width:          44,
    height:         44,
    borderRadius:   10,
    backgroundColor: BG,
    border:         `1px solid ${BORDER}`,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    overflow:       'hidden',
  },
  boutiqueInfo: {
    flex: 1,
  },
  boutiqueNom: {
    fontSize:   15,
    fontWeight: 700,
    color:      NAVY,
    marginBottom: 5,
  },
  boutiqueMeta: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
    flexWrap:   'wrap',
  },
  roleBadge: {
    padding:      '2px 8px',
    borderRadius: 20,
    fontSize:     11,
    fontWeight:   700,
  },
  suspendBadge: {
    display:         'inline-flex',
    alignItems:      'center',
    gap:             4,
    backgroundColor: '#FEF1F1',
    color:           RED,
    padding:         '2px 8px',
    borderRadius:    20,
    fontSize:        11,
    fontWeight:      700,
  },
  suspendMsg: {
    fontSize:   12,
    color:      MUTED,
    margin:     '6px 0 0',
    lineHeight: 1.5,
  },
  boutiqueRight: {
    flexShrink: 0,
  },
  spinner: {
    width:       18,
    height:      18,
    border:      `2px solid ${BORDER}`,
    borderTop:   `2px solid ${NAVY}`,
    borderRadius: '50%',
    animation:   'spin 0.7s linear infinite',
  },
  footer: {
    textAlign: 'center',
  },
  btnRetour: {
    background:  'none',
    border:      'none',
    color:       MUTED,
    fontSize:    13,
    cursor:      'pointer',
    padding:     '6px 12px',
    borderRadius: 8,
  },
}

export default ChoisirBoutiquePage