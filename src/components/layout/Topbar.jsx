import { useLocation } from 'react-router-dom'
import { useAuthContext } from '../../store/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { useSignalementsCount } from '../../hooks/useSignalements'
import { AlertTriangle, LogOut, Store } from 'lucide-react'

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
    <div style={ds.wrap}>
            {/* ── GAUCHE : Boutique + Date ── */}
      <div style={ds.left}>
        <div style={ds.boutiqueRow}>
          {logo ? (
            <img src={logo} alt="Logo" style={{
              width: 32, height: 32, borderRadius: 8, objectFit: 'contain'
            }} />
          ) : (
            <Store size={15} color={GOLD} strokeWidth={1.8} />
          )}
          <span style={ds.boutiqueName}>{nom_boutique || '—'}</span>
        </div>
        <div style={ds.date}>{dateStr}</div>
      </div>

      {/* ── CENTRE : Titre page ── */}
      <div style={ds.center}>
        <span style={ds.pageEyebrow}>Navigation</span>
        <span style={ds.pageTitle}>{pageTitle}</span>
      </div>
      

      {/* ── DROITE : Actions ── */}
      <div style={ds.right}>

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

        <div style={ds.sep} />

        {/* Avatar + rôle */}
        <div style={ds.userInfo}>
          <div style={ds.userName}>{nom_boutique}</div>
          <div style={ds.userRole}>{role}</div>
        </div>
        <div style={ds.avatar}>{initiales}</div>

        <div style={ds.sep} />

        {/* Déconnexion */}
        <button onClick={logout} style={ds.logoutBtn} title="Déconnexion">
          <LogOut size={15} color={MUTED} strokeWidth={1.8} />
        </button>

      </div>
    </div>
  )
}

const ds = {
  wrap: {
    display:        'flex',
    alignItems:     'center',
    flex:           1,
    height:         '100%',
    gap:            24,
  },

  /* Gauche */
  left: {
    display:       'flex',
    flexDirection: 'column',
    gap:           2,
    flexShrink:    0,
  },
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

  /* Centre */
  center: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            2,
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

  /* Droite */
  right: {
    display:    'flex',
    alignItems: 'center',
    gap:        10,
    flexShrink: 0,
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
    position:   'absolute',
    top:        0,
    right:      0,
    background: '#c0392b',
    color:      '#fff',
    fontSize:   9,
    fontWeight: 700,
    padding:    '1px 4px',
    borderRadius: 6,
    minWidth:   14,
    textAlign:  'center',
    lineHeight: '14px',
  },

  sep: {
    width:      1,
    height:     22,
    background: BORDER,
  },

  userInfo: {
    textAlign: 'right',
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