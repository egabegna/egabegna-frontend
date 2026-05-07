// Graphique SVG pur — sans dépendance externe
function MiniChart({ points = [], color = '#2563eb', height = 80 }) {
  if (points.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
      Pas assez de données
    </div>
  )

  const values  = points.map(p => Number(p.ca) || 0)
  const max     = Math.max(...values) || 1
  const min     = Math.min(...values)
  const range   = max - min || 1
  const W       = 600
  const H       = height
  const PAD     = 8

  const toX = (i) => PAD + (i / (values.length - 1)) * (W - PAD * 2)
  const toY = (v) => H - PAD - ((v - min) / range) * (H - PAD * 2)

  const pathD = values.map((v, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`
  ).join(' ')

  const areaD = [
    `M ${toX(0)} ${H}`,
    ...values.map((v, i) => `L ${toX(i)} ${toY(v)}`),
    `L ${toX(values.length - 1)} ${H}`,
    'Z'
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#grad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3.5"
          fill="#fff" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  )
}

export default MiniChart