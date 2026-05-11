import { useLocation } from 'react-router-dom'
import { useAuthContext } from '../../store/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { useSignalementsCount } from '../../hooks/useSignalements'
import { AlertTriangle, LogOut, Store } from 'lucide-react'
import { useEffect } from 'react'

const NAVY  = '#1B2D5B'
const GOLD  = '#C89A3C'
const MUTED = '#B0BEC5'
const BORDER = '#EAECEF'

const TITRES = {
  '/dashboard':    'Dashboard',
  '/ventes':       'Ventes',
  '/produits':     'Produits',
  '/categories':   'Catégories',
  '/employes':     'Employés',
  '/fournisseurs': 'Fournisseurs',
  '/receptions':   'Réceptions',
  '/ambulant':     'Mode Ambulant',
  '/finances':     'Finances',
  '/rapports':     'Rapports',
  '/signalements': 'Signalements',
  '/parametres':   'Paramètres',
}

const TOPBAR_CSS = `
  .tb-wrap {
    display: flex;
    align-items: center;
    flex: 1;
    height: 100%;
    gap: 24px;
  }
  .tb-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
  }
  .tb-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .tb-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .tb-userinfo {
    display: block;
  }
  .tb-date {
    display: block;
  }
  .tb-sep {
    width: 1px;
    height: 22px;
    background: ${BORDER};
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .tb-wrap {
      gap: 8px;
    }
    /* Hide date and user info text on mobile */
    .tb-date {
      display: none;
    }
    .tb-userinfo {
      display: none;
    }
    /* Hide center section — page title is shown in sidebar/elsewhere */
    .tb-center {
      display: none;
    }
    /* Left: just logo + boutique name, compact */
    .tb-boutique-name {
      font-size: 13px !important;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Right: tighter gap */
    .tb-right {
      gap: 4px;
    }
    /* Hide first separator on mobile */
    .tb-sep-first {
      display: none;
    }
  }

  @media (max-width: 380px) {
    .tb-boutique-name {
      max-width: 80px;
    }
  }
`

function InjectStyles() {
  useEffect(() => {
    const id = 'tb-responsive-styles'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = TOPBAR_CSS
      document.head.appendChild(style)
    }
  }, [])
  return null
}

function Topbar() {
  const { role, nom_boutique, logo } = useAuthContext()
  const { nonLus }             = useSignalementsCount()
  const { logout }             = useAuth()
  const location               = useLocation()

  const pageTitle = TITRES[location.pathname] || 'Egabegna'
  const initiales = role
    ? role.charAt(0).toUpperCase() + role.slice(1, 3)
    : '—'

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="tb-wrap">
      <InjectStyles />

      {/* ── GAUCHE : Boutique + Date ── */}
      <div className="tb-left">
        <div style={ds.boutiqueRow}>
          {logo ? (
            <img src={logo} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }} />
          ) : (
            <Store size={15} color={GOLD} strokeWidth={1.8} />
          )}
          <span className="tb-boutique-name" style={ds.boutiqueName}>
            {nom_boutique || '—'}
          </span>
        </div>
        <div className="tb-date" style={ds.date}>{dateStr}</div>
      </div>

      {/* ── CENTRE : Titre page ── */}
      <div className="tb-center">
        <span style={ds.pageEyebrow}>Navigation</span>
        <span style={ds.pageTitle}>{pageTitle}</span>
      </div>

      {/* ── DROITE : Actions ── */}
      <div className="tb-right">

        {/* Signalements */}
        <button
          onClick={() => window.location.href = '/signalements'}
          style={ds.iconBtn}
          title="Signalements"
        >
          <AlertTriangle size={18} color={nonLus > 0 ? GOLD : MUTED} strokeWidth={1.8} />
          {nonLus > 0 && (
            <span style={ds.badge}>{nonLus > 99 ? '99+' : nonLus}</span>
          )}
        </button>

        <div className="tb-sep tb-sep-first" />

        {/* Avatar + rôle */}
        <div className="tb-userinfo" style={ds.userInfo}>
          <div style={ds.userName}>{nom_boutique}</div>
          <div style={ds.userRole}>{role}</div>
        </div>
        <div style={ds.avatar}>{initiales}</div>

        <div className="tb-sep" />

        {/* Déconnexion */}
        <button onClick={logout} style={ds.logoutBtn} title="Déconnexion">
          <LogOut size={15} color={MUTED} strokeWidth={1.8} />
        </button>

      </div>
    </div>
  )
}

const ds = {
  boutiqueRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        6,
  },
  boutiqueName: {
    fontSize:      15,
    fontWeight:    800,
    color:         NAVY,
    letterSpacing: '-0.3px',
  },
  date: {
    fontSize:      11,
    color:         MUTED,
    fontWeight:    500,
    letterSpacing: '0.3px',
    textTransform: 'capitalize',
  },
  pageEyebrow: {
    fontSize:      9,
    fontWeight:    600,
    color:         MUTED,
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize:      15,
    fontWeight:    700,
    color:         NAVY,
    letterSpacing: '0.3px',
  },
  iconBtn: {
    position:       'relative',
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    padding:        '6px',
    borderRadius:   8,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  badge: {
    position:     'absolute',
    top:          0,
    right:        0,
    background:   '#c0392b',
    color:        '#fff',
    fontSize:     9,
    fontWeight:   700,
    padding:      '1px 4px',
    borderRadius: 6,
    minWidth:     14,
    textAlign:    'center',
    lineHeight:   '14px',
  },
  userInfo: {
    textAlign:  'right',
    lineHeight: 1.2,
  },
  userName: {
    fontSize:   12,
    fontWeight: 600,
    color:      NAVY,
  },
  userRole: {
    fontSize:      10,
    color:         MUTED,
    textTransform: 'capitalize',
    marginTop:     1,
  },
  avatar: {
    width:          32,
    height:         32,
    borderRadius:   '50%',
    background:     NAVY,
    color:          '#fff',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       10,
    fontWeight:     700,
    textTransform:  'uppercase',
    letterSpacing:  '0.5px',
    flexShrink:     0,
  },
  logoutBtn: {
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    padding:        '6px',
    borderRadius:   8,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    opacity:        0.7,
  },
}

export default Topbar