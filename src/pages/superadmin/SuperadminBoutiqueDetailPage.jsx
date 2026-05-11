import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import superadminService from '../../services/superadminService'
import {
  ArrowLeft, Store, Mail, Phone, MapPin, Calendar,
  ShieldOff, ShieldCheck, Users, AlertTriangle, X,
  Package, ShoppingCart, Wallet, TrendingUp, BarChart3,
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
  cyan:     '#06B6D4',
  cyanL:    '#A5F3FC',
  white:    '#FFFFFF',
}

const ROLE_CONFIG = {
  proprietaire: { bg: 'rgba(124,92,252,0.18)', color: '#9B80FF' },
  manager:      { bg: 'rgba(240,180,40,0.15)',  color: '#F59E0B' },
  vendeur:      { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E' },
  ambulant:     { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
}

// ── Courbe ventes/jour ────────────────────────
function CourbeSVG({ points, color = D.purple, height = 160 }) {
  if (!points || points.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.muted, fontSize: 13 }}>
      Pas assez de données pour afficher la courbe.
    </div>
  )

  const values = points.map(p => Number(p.ca || p.total || 0))
  const max    = Math.max(...values) || 1
  const min    = Math.min(...values)
  const range  = max - min || 1
  const W = 600, H = height, PAD = 16

  const toX = i => PAD + (i / (values.length - 1)) * (W - PAD * 2)
  const toY = v => H - PAD - ((v - min) / range) * (H - PAD * 2 - 8)

  const pathD = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')
  const areaD = [`M ${toX(0)} ${H}`, ...values.map((v, i) => `L ${toX(i)} ${toY(v)}`), `L ${toX(values.length - 1)} ${H}`, 'Z'].join(' ')

  // N'afficher que max 7 labels pour éviter le chevauchement
  const step  = Math.ceil(points.length / 7)
  const shown = points.filter((_, i) => i % step === 0 || i === points.length - 1)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
        <defs>
          <linearGradient id="vgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t}
            x1={PAD} x2={W - PAD}
            y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)}
            stroke={D.border} strokeWidth="1" strokeDasharray="4 4"
          />
        ))}
        <path d={areaD} fill="url(#vgrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(v)} r="4.5" fill={D.surface} stroke={color} strokeWidth="2.5" />
            <circle cx={toX(i)} cy={toY(v)} r="2"   fill={color} />
          </g>
        ))}
      </svg>

      {/* Labels x */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '0 16px' }}>
        {shown.map((p, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: D.muted }}>
              {new Date(p.date || p.periode).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: D.text, marginTop: 2 }}>
              {Number(p.ca || p.total || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPI card ──────────────────────────────────
function KpiCard({ label, value, sub, Icon, color, colorBg }) {
  return (
    <div style={s.kpiCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 10, color: D.muted, fontWeight: 600, letterSpacing: '1px', marginTop: 2 }}>{sub}</div>}
          <div style={{ fontSize: 11, color: D.muted, fontWeight: 500, marginTop: 6 }}>{label}</div>
        </div>
        <div style={{ ...s.kpiIcon, background: colorBg }}>
          <Icon size={16} color={color} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}

// ── Section title ──────────────────────────────
function SectionTitle({ Icon, label }) {
  return (
    <div style={s.sectionTitle}>
      <Icon size={12} color={D.muted} strokeWidth={2} />
      {label}
    </div>
  )
}

// ── Info item ─────────────────────────────────
function InfoItem({ label, value, Icon }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 5 }}>
        {Icon && <Icon size={11} color={D.muted} strokeWidth={1.8} />}
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{value || '—'}</div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────
function StatusBadge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: active ? D.greenD : D.redD,
      color:      active ? D.greenL : D.redL,
    }}>
      {active ? <ShieldCheck size={10} strokeWidth={2} /> : <ShieldOff size={10} strokeWidth={2} />}
      {active ? 'Actif' : 'Bloqué'}
    </span>
  )
}

// ── Page principale ───────────────────────────
function SuperadminBoutiqueDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [boutique, setBoutique]           = useState(null)
  const [loading, setLoading]             = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm]             = useState(false)
  const [message, setMessage]             = useState(null)

  const fetchBoutique = async () => {
    try {
      const res = await superadminService.getBoutique(id)
      setBoutique(res.data)
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBoutique() }, [id])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(t)
  }, [message])

  const handleToggle = async () => {
    setActionLoading(true)
    setMessage(null)
    try {
      if (boutique.active) {
        await superadminService.bloquer(id)
        setMessage({ type: 'success', text: 'Boutique bloquée avec succès.' })
      } else {
        await superadminService.debloquer(id)
        setMessage({ type: 'success', text: 'Boutique débloquée avec succès.' })
      }
      await fetchBoutique()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur.' })
    } finally {
      setActionLoading(false)
      setConfirm(false)
    }
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: D.muted, fontSize: 14 }}>Chargement...</p>
    </div>
  )

  if (!boutique) return null

  const initiales  = boutique.nom?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const actifs     = boutique.employes?.filter(e => e.actif && !e.bloque) || []
  const inactifs   = boutique.employes?.filter(e => !e.actif || e.bloque) || []

  // Stats agrégées
  const ca          = Number(boutique.ca_total || boutique.chiffre_affaires || 0)
  const nbVentes    = Number(boutique.nb_ventes || boutique.total_ventes || 0)
  const nbProduits  = Number(boutique.nb_produits || boutique.stock?.length || 0)
  const stockTotal  = boutique.stock?.reduce((a, p) => a + Number(p.stock || p.quantite || 0), 0) || 0
  const panierMoyen = nbVentes > 0 ? Math.round(ca / nbVentes) : 0

  // Produits en rupture
  const enRupture   = boutique.stock?.filter(p => Number(p.stock || p.quantite || 0) === 0) || []

  return (
    <div style={s.page}>

      {/* TOPBAR */}
      <div style={s.topbar}>
        <button onClick={() => navigate('/superadmin/boutiques')} style={s.backBtn}>
          <ArrowLeft size={14} strokeWidth={2.5} /><span>Retour aux boutiques</span>
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div style={{
          ...s.alert,
          background: message.type === 'success' ? D.greenD : D.redD,
          color:      message.type === 'success' ? D.greenL : D.redL,
          border:     `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* ── HEADER BOUTIQUE ── */}
      <div style={s.mainCard}>
        <div style={s.cardHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              ...s.boutiqueAvatar,
              background: boutique.active ? 'rgba(124,92,252,0.18)' : 'rgba(239,68,68,0.12)',
              color:      boutique.active ? D.purpleL : D.redL,
            }}>
              {initiales}
            </div>
            <div>
              <h2 style={s.boutiqueName}>{boutique.nom}</h2>
              <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                <StatusBadge active={boutique.active} />
                <span style={{ fontSize: 11, color: D.muted }}>
                  {boutique.employes?.length || 0} employé{(boutique.employes?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Bloquer / Débloquer */}
          {!confirm ? (
            <button onClick={() => setConfirm(true)} style={{
              ...s.actionBtn,
              background: boutique.active ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
              color:      boutique.active ? D.redL : D.greenL,
              border:     `1px solid ${boutique.active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            }}>
              {boutique.active
                ? <><ShieldOff size={14} strokeWidth={2} /><span>Bloquer</span></>
                : <><ShieldCheck size={14} strokeWidth={2} /><span>Débloquer</span></>}
            </button>
          ) : (
            <div style={s.confirmBox}>
              <div style={s.confirmHeader}>
                <AlertTriangle size={14} color={D.gold} strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 700, color: D.gold }}>Confirmation</span>
                <button onClick={() => setConfirm(false)} style={s.confirmClose}>
                  <X size={12} strokeWidth={2.5} color={D.muted} />
                </button>
              </div>
              <p style={s.confirmText}>
                {boutique.active
                  ? `Bloquer «${boutique.nom}» ? Les utilisateurs perdront l'accès.`
                  : `Débloquer «${boutique.nom}» ? Les accès seront rétablis.`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleToggle} disabled={actionLoading} style={{
                  ...s.confirmYes,
                  background: boutique.active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                  color:      boutique.active ? D.redL : D.greenL,
                  border:     `1px solid ${boutique.active ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
                  opacity:    actionLoading ? 0.6 : 1,
                }}>
                  {actionLoading ? 'En cours...' : 'Confirmer'}
                </button>
                <button onClick={() => setConfirm(false)} style={s.confirmNo}>Annuler</button>
              </div>
            </div>
          )}
        </div>

        <div style={s.divider} />

        {/* ── INFOS ── */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle Icon={Store} label="Propriétaire & coordonnées" />
          <div style={s.infoGrid}>
            <InfoItem label="Nom complet" value={boutique.proprietaire_nom} />
            <InfoItem label="Email"       value={boutique.proprietaire_email} Icon={Mail} />
            <InfoItem label="Téléphone"   value={boutique.telephone}          Icon={Phone} />
            <InfoItem label="Adresse"     value={boutique.adresse}            Icon={MapPin} />
            <InfoItem label="Inscription" value={new Date(boutique.date_inscription).toLocaleDateString('fr-FR')} Icon={Calendar} />
          </div>
        </div>

        <div style={s.divider} />

        {/* ── KPIs FINANCIERS ── */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle Icon={Wallet} label="Performance financière" />
          <div style={s.kpiGrid}>
            <KpiCard label="Chiffre d'affaires" value={ca.toLocaleString()}          sub="FCFA"  Icon={Wallet}       color={D.purpleL} colorBg='rgba(124,92,252,0.15)' />
            <KpiCard label="Ventes totales"      value={nbVentes}                              Icon={ShoppingCart} color={D.cyan}    colorBg='rgba(6,182,212,0.12)' />
            <KpiCard label="Panier moyen"        value={panierMoyen.toLocaleString()} sub="FCFA" Icon={TrendingUp}   color={D.green}   colorBg='rgba(34,197,94,0.12)' />
            <KpiCard label="Produits"            value={nbProduits}                            Icon={Package}      color={D.gold}    colorBg='rgba(245,158,11,0.12)' />
            <KpiCard label="Unités en stock"     value={stockTotal}                            Icon={BarChart3}    color={D.subtle}  colorBg={D.surface2} />
            {enRupture.length > 0 && (
              <KpiCard label="En rupture de stock" value={enRupture.length} Icon={ShieldOff} color={D.red} colorBg='rgba(239,68,68,0.12)' />
            )}
          </div>
        </div>

        <div style={s.divider} />

        {/* ── COURBE VENTES PAR JOUR ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <SectionTitle Icon={TrendingUp} label="Ventes par jour" />
            {boutique.ventes_par_jour?.length > 0 && (
              <span style={{ fontSize: 11, color: D.muted }}>
                {boutique.ventes_par_jour.length} jour{boutique.ventes_par_jour.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ background: D.surface2, borderRadius: 12, padding: '16px 20px' }}>
            <CourbeSVG points={boutique.ventes_par_jour} color={D.purple} height={160} />
          </div>
        </div>

        <div style={s.divider} />

        {/* ── STOCK PRODUITS ── */}
        {boutique.stock?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionTitle Icon={Package} label={`Stock produits (${boutique.stock.length})`} />
              {enRupture.length > 0 && (
                <span style={{ fontSize: 11, color: D.red, fontWeight: 700 }}>
                  {enRupture.length} en rupture
                </span>
              )}
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Produit', 'Stock', 'Prix vente', 'Statut'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boutique.stock.map((p, i) => {
                  const qte      = Number(p.stock || p.quantite || 0)
                  const isRupture = qte === 0
                  const isFaible  = qte > 0 && qte <= (p.seuil_alerte || 5)
                  return (
                    <tr key={p.id || i}
                      style={{ ...s.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                      onMouseEnter={ev => ev.currentTarget.style.backgroundColor = D.hover}
                      onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      <td style={s.td}>
                        <span style={{ fontWeight: 700, color: D.text, fontSize: 13 }}>{p.nom}</span>
                        {p.categorie && <div style={{ fontSize: 11, color: D.muted, marginTop: 1 }}>{p.categorie}</div>}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          fontWeight: 800, fontSize: 14,
                          color: isRupture ? D.red : isFaible ? D.gold : D.green,
                        }}>
                          {qte}
                        </span>
                        {p.unite && <span style={{ fontSize: 11, color: D.muted, marginLeft: 4 }}>{p.unite}</span>}
                      </td>
                      <td style={s.td}>
                        {p.prix_vente
                          ? <span style={{ fontWeight: 700, color: D.purpleL }}>{Number(p.prix_vente).toLocaleString()} FCFA</span>
                          : <span style={{ color: D.muted }}>—</span>}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: isRupture ? D.redD    : isFaible ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                          color:      isRupture ? D.redL    : isFaible ? D.gold                  : D.green,
                        }}>
                          {isRupture ? 'Rupture' : isFaible ? 'Stock faible' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {boutique.stock?.length > 0 && <div style={s.divider} />}

        {/* ── EMPLOYÉS ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <SectionTitle Icon={Users} label={`Employés (${boutique.employes?.length || 0})`} />
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 11, color: D.green, fontWeight: 600 }}>
                {actifs.length} actif{actifs.length !== 1 ? 's' : ''}
              </span>
              {inactifs.length > 0 && (
                <span style={{ fontSize: 11, color: D.red, fontWeight: 600 }}>
                  · {inactifs.length} inactif{inactifs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {!boutique.employes?.length ? (
            <div style={s.emptyBox}>
              <Users size={22} color={D.muted} strokeWidth={1.3} />
              <p style={{ margin: '8px 0 0', color: D.muted, fontSize: 13 }}>Aucun employé enregistré.</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['Employé', 'Email', 'Rôle', 'Statut'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boutique.employes.map((e, i) => {
                  const rc   = ROLE_CONFIG[e.role] || { bg: D.surface2, color: D.subtle }
                  const init = e.nom_complet?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
                  return (
                    <tr key={e.id}
                      style={{ ...s.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                      onMouseEnter={ev => ev.currentTarget.style.backgroundColor = D.hover}
                      onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: rc.bg, color: rc.color, flexShrink: 0 }}>
                            {init}
                          </div>
                          <span style={{ fontWeight: 600, color: D.text, fontSize: 13 }}>{e.nom_complet}</span>
                        </div>
                      </td>
                      <td style={{ ...s.td, color: D.subtle, fontSize: 12 }}>{e.email}</td>
                      <td style={s.td}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>
                          {e.role}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: e.actif ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color:      e.actif ? D.greenL : D.redL,
                        }}>
                          {e.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  page:          { minHeight: '100vh', background: D.bg, color: D.text, padding: '28px 36px', boxSizing: 'border-box' },
  topbar:        { marginBottom: 20 },
  backBtn:       { display: 'inline-flex', alignItems: 'center', gap: 8, background: D.surface, color: D.subtle, border: `1px solid ${D.border}`, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  alert:         { borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, fontWeight: 500 },
  mainCard:      { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, padding: '24px 28px' },
  cardHead:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  boutiqueAvatar:{ width: 54, height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 },
  boutiqueName:  { fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: D.text },
  actionBtn:     { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  confirmBox:    { background: D.bg, border: `1px solid ${D.border}`, borderRadius: 12, padding: '14px 16px', maxWidth: 320 },
  confirmHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  confirmClose:  { background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', padding: 2, display: 'flex' },
  confirmText:   { fontSize: 12, color: D.subtle, marginBottom: 12, lineHeight: 1.5 },
  confirmYes:    { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  confirmNo:     { background: D.surface2, color: D.subtle, border: `1px solid ${D.border}`, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  divider:       { height: 1, background: D.border, margin: '24px 0' },
  sectionTitle:  { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 },
  infoGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 },
  kpiGrid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  kpiCard:       { background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 12, padding: '14px 18px' },
  kpiIcon:       { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '1.5px', background: D.surface2, borderBottom: `1px solid ${D.border}` },
  tr:            { borderBottom: `1px solid ${D.border}`, transition: 'background 0.1s' },
  td:            { padding: '12px 14px', fontSize: 13, verticalAlign: 'middle' },
  emptyBox:      { textAlign: 'center', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: D.surface2, borderRadius: 10 },
}

export default SuperadminBoutiqueDetailPage