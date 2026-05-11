import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuperadmin } from '../../store/SuperadminContext'
import superadminService from '../../services/superadminService'
import {
  Store, Users, ShieldOff, ShieldCheck, LogOut,
  ArrowRight, Search, X, TrendingUp, BarChart3,
  ArrowLeft, RefreshCw,
} from 'lucide-react'

const D = {
  bg:       '#0B1120',
  surface:  '#131C2E',
  surface2: '#1A2540',
  border:   '#1F2D45',
  hover:    '#1E2E4A',
  text:     '#F0F4FF',
  muted:    '#5B7099',
  subtle:   '#8FA3C4',
  purple:   '#7C5CFC',
  purpleL:  '#9B80FF',
  green:    '#22C55E',
  greenL:   '#BBF7D0',
  greenD:   '#14532D',
  red:      '#EF4444',
  redL:     '#FCA5A5',
  redD:     '#450A0A',
  gold:     '#F59E0B',
  white:    '#FFFFFF',
}

function StatCard({ label, value, Icon, color, colorBg, trend }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, background: colorBg }}>
        <Icon size={18} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ ...s.statVal, color }}>{value}</div>
        <div style={s.statLabel}>{label}</div>
      </div>
      {trend != null && (
        <div style={{ fontSize: 11, color: trend >= 0 ? D.green : D.red, fontWeight: 700 }}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: active ? D.greenD : D.redD,
      color:      active ? D.greenL : D.redL,
    }}>
      {active ? <ShieldCheck size={10} strokeWidth={2} /> : <ShieldOff size={10} strokeWidth={2} />}
      {active ? 'Actif' : 'Bloqué'}
    </span>
  )
}

function SuperadminBoutiquesPage() {
  const { saLogout } = useSuperadmin()
  const navigate     = useNavigate()

  const [boutiques, setBoutiques]   = useState([])
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [filterStatut, setFilterStatut] = useState('tous') // tous | actif | bloque

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [bRes, sRes] = await Promise.all([
        superadminService.getBoutiques(),
        superadminService.getStats(),
      ])
      setBoutiques(bRes.data)
      setStats(sRes.data)
      setError('')
    } catch {
      setError('Erreur lors du chargement des données.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = boutiques.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = (
      b.nom?.toLowerCase().includes(q) ||
      b.proprietaire_nom?.toLowerCase().includes(q) ||
      b.proprietaire_email?.toLowerCase().includes(q)
    )
    const matchStatut =
      filterStatut === 'tous'   ? true :
      filterStatut === 'actif'  ? b.active :
      filterStatut === 'bloque' ? !b.active : true
    return matchSearch && matchStatut
  })

  const tauxActivite = stats
    ? Math.round((stats.boutiques_actives / (stats.boutiques_total || 1)) * 100)
    : null

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...s.superBadge, marginBottom: 16 }}>
          <TrendingUp size={10} strokeWidth={2.5} /> SUPERADMIN
        </div>
        <p style={{ color: D.muted, fontSize: 14 }}>Chargement des données...</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>

      {/* TOPBAR */}
      <div style={s.topbar}>
        <div>
          <div style={s.superBadge}>
            <TrendingUp size={10} strokeWidth={2.5} /> SUPERADMIN
          </div>
          <h1 style={s.title}>Gestion des boutiques</h1>
          <div style={s.titleUnderline} />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => fetchData(true)} style={s.refreshBtn} title="Actualiser">
            <RefreshCw size={14} strokeWidth={2} color={refreshing ? D.purple : D.muted}
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={() => navigate('/superadmin/stats')} style={s.statsBtn}>
            <BarChart3 size={14} strokeWidth={2} />
            <span>Statistiques</span>
          </button>
          <button onClick={saLogout} style={s.logoutBtn}>
            <LogOut size={14} strokeWidth={2} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {error && <div style={s.alertError}>{error}</div>}

      {/* STATS */}
      {stats && (
        <div style={s.statsRow}>
          <StatCard label="Total boutiques"  value={stats.boutiques_total}    Icon={Store}       color={D.purpleL} colorBg='rgba(124,92,252,0.15)' />
          <StatCard label="Actives"          value={stats.boutiques_actives}  Icon={ShieldCheck} color={D.green}   colorBg='rgba(34,197,94,0.12)'  />
          <StatCard label="Bloquées"         value={stats.boutiques_bloquees} Icon={ShieldOff}   color={D.red}     colorBg='rgba(239,68,68,0.12)'   />
          <StatCard label="Employés total"   value={boutiques.reduce((a, b) => a + (b.nb_employes || 0), 0)} Icon={Users} color={D.gold} colorBg='rgba(245,158,11,0.12)' />

          {/* Taux activité */}
          {tauxActivite != null && (
            <div style={{ ...s.statCard, flexDirection: 'column', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 52, height: 52 }}>
                <svg viewBox="0 0 36 36" style={{ width: 52, height: 52, transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15" fill="none" stroke={D.surface2} strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke={D.purple} strokeWidth="3"
                    strokeDasharray={`${tauxActivite * 0.942} 94.2`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: D.purpleL }}>
                  {tauxActivite}%
                </div>
              </div>
              <div style={s.statLabel}>Taux d'activité</div>
            </div>
          )}
        </div>
      )}

      {/* TABLE */}
      <div style={s.tableCard}>
        <div style={s.toolbar}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
            <div style={s.searchWrap}>
              <Search size={14} color={D.muted} strokeWidth={1.8} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom, propriétaire, email..."
                style={s.searchInput}
              />
              {search && (
                <button onClick={() => setSearch('')} style={s.clearBtn}>
                  <X size={13} color={D.muted} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Filtres statut */}
            <div style={s.filterRow}>
              {[
                { key: 'tous',   label: 'Tous' },
                { key: 'actif',  label: 'Actives' },
                { key: 'bloque', label: 'Bloquées' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterStatut(f.key)}
                  style={{
                    ...s.filterBtn,
                    background: filterStatut === f.key ? 'rgba(124,92,252,0.2)' : 'transparent',
                    color:      filterStatut === f.key ? D.purpleL : D.muted,
                    border:     `1px solid ${filterStatut === f.key ? 'rgba(124,92,252,0.4)' : D.border}`,
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <span style={s.resultCount}>
            {filtered.length} / {boutiques.length} boutique{boutiques.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>
            <Store size={32} color={D.muted} strokeWidth={1.2} />
            <p style={{ margin: '12px 0 0', color: D.muted, fontSize: 13 }}>
              {search ? 'Aucun résultat pour cette recherche.' : 'Aucune boutique enregistrée.'}
            </p>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Boutique', 'Propriétaire', 'Employés', 'Inscription', 'Statut', ''].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const initiales = b.nom
                  ? b.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                  : '?'
                return (
                  <tr
                    key={b.id}
                    style={{ ...s.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                    onClick={() => navigate(`/superadmin/boutiques/${b.id}`)}
                    onMouseEnter={ev => ev.currentTarget.style.backgroundColor = D.hover}
                    onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                  >
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          ...s.avatar,
                          background: b.active ? 'rgba(124,92,252,0.18)' : 'rgba(239,68,68,0.12)',
                          color:      b.active ? D.purpleL : D.redL,
                        }}>
                          {initiales}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: D.text, fontSize: 13 }}>{b.nom}</div>
                          {b.note && <div style={{ fontSize: 11, color: D.muted, marginTop: 1 }}>{b.note}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: D.text, fontSize: 13 }}>{b.proprietaire_nom}</div>
                      <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>{b.proprietaire_email}</div>
                    </td>
                    <td style={s.td}>
                      <span style={s.countBadge}>
                        <Users size={10} strokeWidth={2} />
                        {b.nb_employes}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: D.subtle, fontSize: 12 }}>
                      {new Date(b.date_inscription).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={s.td}>
                      <StatusBadge active={b.active} />
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/superadmin/boutiques/${b.id}`)}
                        style={s.detailBtn}
                        onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(124,92,252,0.2)'; ev.currentTarget.style.color = D.purpleL; ev.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)' }}
                        onMouseLeave={ev => { ev.currentTarget.style.background = D.surface2; ev.currentTarget.style.color = D.subtle; ev.currentTarget.style.borderColor = D.border }}
                      >
                        <span>Voir</span>
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const s = {
  page:          { minHeight: '100vh', background: D.bg, color: D.text, padding: '28px 36px', boxSizing: 'border-box' },
  topbar:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  superBadge:    { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(124,92,252,0.2)', color: D.purpleL, fontSize: 10, fontWeight: 800, letterSpacing: '2px', padding: '4px 10px', borderRadius: 6, marginBottom: 8, border: '1px solid rgba(124,92,252,0.3)' },
  title:         { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: D.text },
  titleUnderline:{ width: 32, height: 3, background: D.purple, borderRadius: 2, marginTop: 10 },
  refreshBtn:    { display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9, width: 38, height: 38, cursor: 'pointer' },
  statsBtn:      { display: 'flex', alignItems: 'center', gap: 8, background: D.purple, color: D.white, border: 'none', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  logoutBtn:     { display: 'flex', alignItems: 'center', gap: 8, background: D.surface2, color: D.subtle, border: `1px solid ${D.border}`, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  alertError:    { background: D.redD, border: `1px solid rgba(239,68,68,0.3)`, color: D.redL, borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13 },
  statsRow:      { display: 'flex', gap: 14, marginBottom: 24 },
  statCard:      { display: 'flex', alignItems: 'center', gap: 14, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, padding: '14px 20px', flex: 1 },
  statIcon:      { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:       { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  statLabel:     { fontSize: 11, color: D.muted, fontWeight: 500, letterSpacing: '0.5px', marginTop: 3 },
  tableCard:     { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, overflow: 'hidden' },
  toolbar:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${D.border}`, gap: 12 },
  searchWrap:    { display: 'flex', alignItems: 'center', gap: 8, background: D.bg, border: `1.5px solid ${D.border}`, borderRadius: 9, padding: '8px 14px', minWidth: 260 },
  searchInput:   { border: 'none', outline: 'none', fontSize: 13, color: D.text, background: 'transparent', flex: 1 },
  clearBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  filterRow:     { display: 'flex', gap: 6 },
  filterBtn:     { padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s' },
  resultCount:   { fontSize: 12, color: D.muted, fontWeight: 500, flexShrink: 0 },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '1.5px', background: D.surface2, borderBottom: `1px solid ${D.border}` },
  tr:            { borderBottom: `1px solid ${D.border}`, cursor: 'pointer', transition: 'background 0.1s' },
  td:            { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },
  avatar:        { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  countBadge:    { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.12)', color: D.gold, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  detailBtn:     { display: 'inline-flex', alignItems: 'center', gap: 6, background: D.surface2, color: D.subtle, border: `1px solid ${D.border}`, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s' },
  empty:         { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default SuperadminBoutiquesPage