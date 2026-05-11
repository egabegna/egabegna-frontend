import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { Menu } from 'lucide-react'

const SIDEBAR_W  = 220
const TOPBAR_H   = 68
const BREAKPOINT = 768
const NAVY       = '#1B2D5B'

function AppLayout({ children }) {
  const [mobile, setMobile]         = useState(window.innerWidth <= BREAKPOINT)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => {
      const isMobile = window.innerWidth <= BREAKPOINT
      setMobile(isMobile)
      if (!isMobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={ds.root}>

      {/* ── SIDEBAR ── */}
      {!mobile ? (
        <Sidebar mobileOpen={false} onClose={() => {}} />
      ) : (
        mobileOpen && (
          <Sidebar mobileOpen={true} onClose={() => setMobileOpen(false)} />
        )
      )}

      {/* ── ZONE CONTENU ── */}
      <div style={{
        ...ds.contentZone,
        marginLeft: mobile ? 0 : SIDEBAR_W,
      }}>

        {/* ── TOPBAR ── */}
        <div style={ds.topbar}>
          {mobile && (
            <button
              onClick={() => setMobileOpen(v => !v)}
              style={ds.menuBtn}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} color={NAVY} strokeWidth={1.8} />
            </button>
          )}
          <Topbar />
        </div>

        {/* ── PAGE ── */}
        <main style={ds.main}>
          {children}
        </main>

      </div>
    </div>
  )
}

const ds = {
  root: {
    display:         'flex',
    minHeight:       '100vh',
    backgroundColor: '#F4F5F7',
  },
  contentZone: {
    flex:          1,
    minWidth:      0,
    display:       'flex',
    flexDirection: 'column',
  },
  topbar: {
    display:         'flex',
    alignItems:      'center',
    height:          TOPBAR_H,
    backgroundColor: '#FFFFFF',
    borderBottom:    '1px solid #EAECEF',
    padding:         '0 28px',
    gap:             12,
    position:        'sticky',
    top:             0,
    zIndex:          40,
  },
  menuBtn: {
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    padding:        '6px',
    borderRadius:   8,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  main: {
    flex:     1,
    minWidth: 0,
  },
}

export default AppLayout