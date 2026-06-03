import { Banknote, Smartphone, CreditCard, Building2 } from 'lucide-react'

const NAVY   = '#1B2D5B'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'

const MODES = [
  {
    value: 'especes',
    label: 'Espèces',
    Icon:  Banknote,
    color: '#2D7A4F',
    bg:    '#EBF5EF',
  },
  {
    value: 'tmoney',
    label: 'Tmoney',
    Icon:  Smartphone,
    color: '#1a6fa0',
    bg:    '#E8F4FD',
  },
  {
    value: 'flooz',
    label: 'Flooz',
    Icon:  Smartphone,
    color: '#C89A3C',
    bg:    '#FBF5E9',
  },
  {
    value: 'virement_bancaire',
    label: 'Bancaire',
    Icon:  Building2,
    color: '#5b21b6',
    bg:    '#EEE9F8',
  },
]

function ModePaiementSelector({ value, onChange }) {
  return (
    <div>
      <label style={s.label}>Mode de paiement</label>
      <div style={s.grid}>
        {MODES.map(({ value: v, label, Icon, color, bg }) => {
          const actif = value === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              style={{
                ...s.btn,
                backgroundColor: actif ? bg    : WHITE,
                borderColor:     actif ? color : BORDER,
                boxShadow:       actif
                  ? `0 0 0 2px ${color}30`
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                ...s.iconWrap,
                backgroundColor: actif ? color : BG,
              }}>
                <Icon
                  size={16}
                  color={actif ? WHITE : MUTED}
                  strokeWidth={1.8}
                />
              </div>
              <span style={{
                ...s.btnLabel,
                color:      actif ? color : MUTED,
                fontWeight: actif ? 700   : 500,
              }}>
                {label}
              </span>
              {actif && (
                <div style={s.checkmark}>✓</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  label: {
    display:       'block',
    fontSize:      11,
    fontWeight:    600,
    color:         MUTED,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom:  10,
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap:                 10,
  },
  btn: {
    position:       'relative',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            8,
    padding:        '14px 8px',
    borderRadius:   12,
    border:         '2px solid',
    cursor:         'pointer',
    transition:     'all 0.15s',
    backgroundColor: WHITE,
  },
  iconWrap: {
    width:          36,
    height:         36,
    borderRadius:   10,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     'background-color 0.15s',
  },
  btnLabel: {
    fontSize:   12,
    transition: 'all 0.15s',
  },
  checkmark: {
    position:        'absolute',
    top:             6,
    right:           8,
    fontSize:        10,
    fontWeight:      700,
    color:           '#2D7A4F',
  },
}

export default ModePaiementSelector