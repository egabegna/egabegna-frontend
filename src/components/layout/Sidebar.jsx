import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../../store/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { useSignalementsCount } from '../../hooks/useSignalements'
import {
  LayoutDashboard, ShoppingCart, Package, Tag, Users, Truck,
  PackageCheck, PersonStanding, Wallet, BarChart2, AlertTriangle,
  Settings, LogOut, ChevronDown,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'

const GROUPES_PROPRIETAIRE = [
  {
    label: 'Principal',
    liens: [
      { path: '/dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
      { path: '/ventes',    label: 'Ventes',       Icon: ShoppingCart },
    ]
  },
  {
    label: 'Stock',
    liens: [
      { path: '/produits',   label: 'Produits',    Icon: Package },
      { path: '/categories', label: 'Catégories',  Icon: Tag },
      { path: '/receptions', label: 'Réceptions',  Icon: PackageCheck },
    ]
  },
  {
    label: 'Équipe',
    liens: [
      { path: '/employes', label: 'Employés', Icon: Users },
      { path: '/ambulant', label: 'Ambulant', Icon: PersonStanding },
    ]
  },
  {
    label: 'Achats',
    liens: [
      { path: '/fournisseurs', label: 'Fournisseurs', Icon: Truck },
    ]
  },
  {
    label: 'Finances',
    liens: [
      { path: '/finances', label: 'Finances', Icon: Wallet },
      { path: '/rapports', label: 'Rapports', Icon: BarChart2 },
    ]
  },
  {
    label: 'Système',
    liens: [
      { path: '/signalements', label: 'Signalements', Icon: AlertTriangle, badge: true },
      { path: '/parametres',   label: 'Paramètres',   Icon: Settings },
    ]
  },
]

const GROUPES_MANAGER = GROUPES_PROPRIETAIRE

const GROUPES_VENDEUR = [
  {
    label: 'Principal',
    liens: [
      { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { path: '/ventes',    label: 'Ventes',    Icon: ShoppingCart },
    ]
  },
  {
    label: 'Stock',
    liens: [
      { path: '/produits', label: 'Produits', Icon: Package },
    ]
  },
  {
    label: 'Système',
    liens: [
      { path: '/signalements', label: 'Signalements', Icon: AlertTriangle, badge: true },
    ]
  },
]

// Inject responsive CSS once
const SIDEBAR_CSS = `
  .sb-sidebar {
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    width: 220px;
    background: #fff;
    border-right: 1px solid ${BORDER};
    display: flex;
    flex-direction: column;
    z-index: 30;
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* On desktop: always visible */
  @media (min-width: 641px) {
    .sb-sidebar {
      transform: translateX(0) !important;
    }
    .sb-overlay {
      display: none !important;
    }
  }

  /* On mobile: slide in/out */
  @media (max-width: 640px) {
    .sb-sidebar {
      width: 260px;
      transform: translateX(-100%);
      box-shadow: none;
    }
    .sb-sidebar.sb-open {
      transform: translateX(0);
      box-shadow: 4px 0 24px rgba(0,0,0,0.13);
    }
    .sb-overlay {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      z-index: 29;
      animation: sb-fade-in 0.2s ease;
    }
    @keyframes sb-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  }
`

function InjectStyles() {
  useEffect(() => {
    const id = 'sb-responsive-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id
      el.textContent = SIDEBAR_CSS
      document.head.appendChild(el)
    }
  }, [])
  return null
}

function Sidebar({ mobileOpen, onClose }) {
  const { role, nom_boutique } = useAuthContext()
  const { logout }             = useAuth()
  const { nonLus }             = useSignalementsCount()
  const [ouverts, setOuverts]  = useState({
    'Principal': true,
    'Stock': true,
    'Équipe': true,
    'Achats': true,
    'Finances': true,
    'Système': true,
  })

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const groupes = ['proprietaire', 'manager'].includes(role)
    ? GROUPES_PROPRIETAIRE
    : GROUPES_VENDEUR

  const toggle = (label) => {
    setOuverts(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <>
      <InjectStyles />

      {/* Overlay — mobile only, via CSS */}
      {mobileOpen && (
        <div className="sb-overlay" onClick={onClose} />
      )}

      <aside className={`sb-sidebar${mobileOpen ? ' sb-open' : ''}`}>

      {/* ── HEADER LOGO ── */}
      <div style={s.header}>
        <div style={s.logoMark}>
          <img
            src="/icons/egabegna-icon.svg"
            alt="Egabégna"
            style={{ width: 20, height: 20 }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={s.appName}>EGABEGNA</div>
          <div style={s.boutiqueName}>{nom_boutique || '—'}</div>
        </div>
      </div>

        <div style={s.divider} />

        {/* ── NAVIGATION PAR GROUPES ── */}
        <nav style={s.nav}>
          {groupes.map(groupe => {
            const isOpen = ouverts[groupe.label]
            return (
              <div key={groupe.label} style={s.groupe}>
                <button
                  onClick={() => toggle(groupe.label)}
                  style={s.groupeHeader}
                >
                  <span style={s.groupeLabel}>{groupe.label}</span>
                  <ChevronDown
                    size={12}
                    strokeWidth={2}
                    color={MUTED}
                    style={{
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {isOpen && (
                  <div style={s.groupeLiens}>
                    {groupe.liens.map(({ path, label, Icon, badge }) => (
                      <NavLink
                        key={path}
                        to={path}
                        onClick={onClose}
                        style={({ isActive }) => ({
                          ...s.lien,
                          backgroundColor: isActive ? NAVY : 'transparent',
                          color:           isActive ? '#fff' : '#6B7A99',
                        })}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={16}
                              strokeWidth={isActive ? 2 : 1.6}
                              color={isActive ? GOLD : '#6B7A99'}
                              style={{ flexShrink: 0 }}
                            />
                            <span style={{
                              ...s.lienLabel,
                              fontWeight: isActive ? 600 : 400,
                              color:      isActive ? '#fff' : '#6B7A99',
                            }}>
                              {label}
                            </span>
                            {badge && nonLus > 0 && (
                              <span style={s.badge}>{nonLus > 99 ? '99+' : nonLus}</span>
                            )}
                            {isActive && <div style={s.activeBar} />}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── FOOTER ── */}
        <div style={s.footer}>
          <div style={s.roleRow}>
            <div style={s.roleAvatar}>
              {role ? role.charAt(0).toUpperCase() + role.slice(1, 3) : '—'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={s.roleName}>{nom_boutique || '—'}</div>
              <div style={s.roleTag}>{role}</div>
            </div>
          </div>
          <button onClick={logout} style={s.btnLogout}>
            <LogOut size={14} color="#c0392b" strokeWidth={1.8} />
            <span>Déconnexion</span>
          </button>
        </div>

      </aside>
    </>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 16px 18px',
  },
  logoMark: {
    width: 34, height: 34, borderRadius: 9,
    background: 'transport', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    border: `1px solid ${NAVY}`,
  },
  appName: {
    fontSize: 13, fontWeight: 800, color: NAVY,
    letterSpacing: '2.5px', lineHeight: 1.1,
  },
  boutiqueName: {
    fontSize: 10, color: MUTED, marginTop: 2,
    whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', maxWidth: 150, letterSpacing: '0.3px',
  },
  divider: { height: 1, background: BORDER, margin: '0 16px' },
  nav: { flex: 1, overflowY: 'auto', padding: '8px 10px' },
  groupe: { marginBottom: 4 },
  groupeHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', background: 'none', border: 'none',
    padding: '8px 12px', cursor: 'pointer',
  },
  groupeLabel: {
    fontSize: 10, fontWeight: 700, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '1.5px',
  },
  groupeLiens: { paddingLeft: 0 },
  lien: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 9,
    fontSize: 13, textDecoration: 'none',
    marginBottom: 2, position: 'relative',
    transition: 'background 0.15s',
  },
  lienLabel: { flex: 1, fontSize: 13 },
  badge: {
    backgroundColor: '#c0392b', color: '#fff',
    fontSize: 10, fontWeight: 700, padding: '1px 5px',
    borderRadius: 8, minWidth: 16, textAlign: 'center',
  },
  activeBar: {
    position: 'absolute', right: 0, top: '50%',
    transform: 'translateY(-50%)', width: 3, height: 16,
    borderRadius: '2px 0 0 2px', background: GOLD,
  },
  footer: {
    padding: '14px 14px', borderTop: `1px solid ${BORDER}`,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  roleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  roleAvatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: NAVY, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
    textTransform: 'uppercase', flexShrink: 0,
  },
  roleName: {
    fontSize: 12, fontWeight: 600, color: NAVY,
    whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', maxWidth: 140,
  },
  roleTag: {
    fontSize: 10, color: MUTED, textTransform: 'capitalize',
    letterSpacing: '0.3px', marginTop: 1,
  },
  btnLogout: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', backgroundColor: '#fef1f1',
    color: '#c0392b', border: '1px solid #fdd',
    padding: '10px 12px', borderRadius: 8,
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
}

export default Sidebar