const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'

function PageHeader({ eyebrow, title, actions }) {
  return (
    <div style={s.bar}>
      <div style={s.left}>
        {eyebrow && <p style={s.eyebrow}>{eyebrow}</p>}
        <div style={s.titleRow}>
          <h1 style={s.title}>{title}</h1>
          <div style={s.underline} />
        </div>
      </div>
      {actions && <div style={s.actions}>{actions}</div>}
    </div>
  )
}

const SIDEBAR_W = 220

const s = {
  bar: {
    position:        'fixed',
    top:             0,
    left:            SIDEBAR_W,
    right:           0,
    height:          72,
    backgroundColor: WHITE,
    borderBottom:    `1px solid ${BORDER}`,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '0 28px',
    zIndex:          19,
    boxShadow:       '0 1px 4px rgba(0,0,0,0.04)',
  },
  left:     { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  eyebrow:  { fontSize: 10, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#B0BEC5', margin: 0 },
  titleRow: { display: 'flex', flexDirection: 'column' },
  title:    { fontSize: 20, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.3px' },
  underline:{ width: 24, height: 3, background: GOLD, borderRadius: 2, marginTop: 5 },
  actions:  { display: 'flex', gap: 10, alignItems: 'center' },
}

export default PageHeader