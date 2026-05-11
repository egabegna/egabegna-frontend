import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import ambulantService from '../services/ambulantService'
import employeService  from '../services/employeService'
import produitService  from '../services/produitService'
import StatutBadge     from '../components/shared/StatutBadge'
import {
  Play, Square, ArrowLeft, Plus, X,
  Users, Clock, CheckCircle, TrendingUp, Coins,
} from 'lucide-react'

const NAVY    = '#1B2D5B'
const GOLD    = '#C89A3C'
const GREEN   = '#2D7A4F'
const PURPLE  = '#5b21b6'
const MUTED   = '#B0BEC5'
const BORDER  = '#EAECEF'
const BG      = '#F4F5F7'
const WHITE   = '#FFFFFF'

// ─── Hook responsive ──────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ─── InfoItem ───────────────────────────────
function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{value}</div>
    </div>
  )
}

function AmbulantPage() {
  const { role }                          = useAuthContext()
  const isMobile                          = useIsMobile()
  const [sessions, setSessions]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [view, setView]                   = useState('liste')
  const [sessionActive, setSessionActive] = useState(null)
  const [msg, setMsg]                     = useState({ type: '', text: '' })

  const [employes, setEmployes]   = useState([])
  const [produits, setProduits]   = useState([])
  const [dForm, setDForm]         = useState({ employe_id: '', taux_commission: 0, note: '' })
  const [dProduits, setDProduits] = useState([{ produit_id: '', qte_depart: 1 }])
  const [dSubmitting, setDSubmitting] = useState(false)
  const [dError, setDError]           = useState('')

  const [retours, setRetours]     = useState([])
  const [cNote, setCNote]         = useState('')
  const [cSubmitting, setCSubmitting] = useState(false)
  const [cError, setCError]           = useState('')

  const canManage = ['proprietaire', 'manager'].includes(role)

  const charger = useCallback(async () => {
    try {
      const [sRes, eRes, pRes] = await Promise.all([
        ambulantService.liste(),
        employeService.liste(),
        produitService.getProduits({ actif: 'true' }),
      ])
      setSessions(sRes.data)
      setEmployes(eRes.data.filter(e => e.role === 'ambulant'))
      setProduits(pRes.data)
    } catch {
      setMsg({ type: 'error', text: 'Erreur de chargement.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  useEffect(() => {
    if (!msg.text) return
    const t = setTimeout(() => setMsg({ type: '', text: '' }), 3500)
    return () => clearTimeout(t)
  }, [msg.text])

  // ── Démarrage ──────────────────────────────
  const ajouterProduitD = () =>
    setDProduits(p => [...p, { produit_id: '', qte_depart: 1 }])

  const modifierProduitD = (i, field, val) =>
    setDProduits(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleDemarrer = async e => {
    e.preventDefault()
    const produitsValides = dProduits.filter(p => p.produit_id && p.qte_depart > 0)
    if (!dForm.employe_id) { setDError('Choisissez un employé ambulant.'); return }
    if (produitsValides.length === 0) { setDError('Ajoutez au moins un produit.'); return }
    setDSubmitting(true)
    setDError('')
    try {
      await ambulantService.demarrer({
        employe_id:      Number(dForm.employe_id),
        taux_commission: Number(dForm.taux_commission),
        note:            dForm.note,
        produits:        produitsValides.map(p => ({
          produit_id: Number(p.produit_id),
          qte_depart: Number(p.qte_depart),
        })),
      })
      setMsg({ type: 'success', text: 'Session démarrée. Stock réduit.' })
      setView('liste')
      await charger()
    } catch (err) {
      const d = err.response?.data
      setDError(Array.isArray(d?.detail) ? d.detail.join('\n') : d?.detail || 'Erreur.')
    } finally { setDSubmitting(false) }
  }

  // ── Clôture ────────────────────────────────
  const ouvrirCloture = async (session) => {
    const res = await ambulantService.detail(session.id)
    setSessionActive(res.data)
    setRetours(res.data.stocks.map(s => ({
      stock_ambulant_id: s.id,
      produit_nom:       s.produit_nom,
      qte_depart:        s.qte_depart,
      qte_vendue:        s.qte_vendue,
      qte_disponible:    s.qte_disponible,
      prix_unitaire:     s.prix_unitaire,
      qte_retour:        s.qte_disponible,
    })))
    setView('cloturer')
  }

  const modifierRetour = (i, val) =>
    setRetours(p => p.map((r, idx) => idx === i ? { ...r, qte_retour: Number(val) } : r))

  const commissionPrevisionnelle = sessionActive
    ? retours.reduce((acc, r) => {
        const vendu = r.qte_depart - r.qte_retour
        return acc + vendu * Number(r.prix_unitaire)
      }, 0) * Number(sessionActive.taux_commission) / 100
    : 0

  const handleCloturer = async e => {
    e.preventDefault()
    setCSubmitting(true)
    setCError('')
    try {
      await ambulantService.cloturer(sessionActive.id, {
        retours: retours.map(r => ({
          stock_ambulant_id: r.stock_ambulant_id,
          qte_retour:        r.qte_retour,
        })),
        note: cNote,
      })
      setMsg({ type: 'success', text: 'Session clôturée. Commission calculée.' })
      setView('liste')
      setSessionActive(null)
      await charger()
    } catch (err) {
      setCError(err.response?.data?.detail || 'Erreur de clôture.')
    } finally { setCSubmitting(false) }
  }

  // ── VUE DÉMARRER ───────────────────────────
  if (view === 'demarrer') return (
    <div style={{ ...s.page, padding: isMobile ? '16px 12px' : '32px 28px' }}>
      <div style={{ ...s.header, marginBottom: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          <button onClick={() => setView('liste')} style={s.btnBack}>
            <ArrowLeft size={14} strokeWidth={2.5} /><span>Retour</span>
          </button>
          <div>
            <p style={s.eyebrow}>Ambulant</p>
            <h1 style={{ ...s.title, fontSize: isMobile ? 18 : 26 }}>Démarrer une session</h1>
            <div style={s.titleUnderline} />
          </div>
        </div>
      </div>

      <div style={{ ...s.formCard, padding: isMobile ? '14px 14px' : '20px 24px' }}>
        <div style={s.formHeader}><span style={s.formTitle}>Informations de session</span></div>
        <div style={s.formDivider} />
        <form onSubmit={handleDemarrer} noValidate>

          {/* Sur mobile, champs en colonne */}
          <div style={{ ...s.row, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0 : 12 }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Employé ambulant *</label>
              <select value={dForm.employe_id}
                onChange={e => setDForm(p => ({ ...p, employe_id: e.target.value }))}
                style={{ ...s.select, width: '100%' }}>
                <option value="">— Choisir un employé —</option>
                {employes.map(e => (
                  <option key={e.id} value={e.id}>{e.nom_complet}</option>
                ))}
              </select>
            </div>
            <div style={{ ...s.fieldGroup, flex: isMobile ? 'unset' : 1 }}>
              <label style={s.label}>Taux commission (%)</label>
              <input type="number" min="0" max="100"
                value={dForm.taux_commission}
                onChange={e => setDForm(p => ({ ...p, taux_commission: e.target.value }))}
                style={{ ...s.input, width: isMobile ? '100%' : undefined }} />
            </div>
          </div>

          {/* Produits */}
          <div style={s.lignesHeader}>
            <label style={s.label}>Produits à emporter</label>
            <button type="button" onClick={ajouterProduitD} style={s.btnAdd}>
              <Plus size={12} strokeWidth={2.5} /><span>Ajouter</span>
            </button>
          </div>

          <div style={s.lignesContainer}>
            {/* Header — masqué sur mobile */}
            {!isMobile && (
              <div style={s.ligneRowHeader}>
                <span style={{ flex: 3, ...s.colLabel }}>Produit</span>
                <span style={{ width: 110, ...s.colLabel }}>Quantité</span>
                <span style={{ width: 100, ...s.colLabel }}>Stock max</span>
                <span style={{ width: 32 }} />
              </div>
            )}

            {dProduits.map((item, i) => {
              const info = produits.find(p => p.id === Number(item.produit_id))

              if (isMobile) {
                // Carte compacte sur mobile
                return (
                  <div key={i} style={{
                    background: WHITE,
                    borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                    padding: '12px',
                    marginBottom: 10,
                    position: 'relative',
                  }}>
                    <button type="button"
                      onClick={() => setDProduits(p => p.filter((_, idx) => idx !== i))}
                      disabled={dProduits.length === 1}
                      style={{
                        ...s.btnRemove,
                        opacity: dProduits.length === 1 ? 0.3 : 1,
                        cursor: dProduits.length === 1 ? 'not-allowed' : 'pointer',
                        position: 'absolute', top: 10, right: 10,
                        width: 28, height: 28,
                      }}>
                      <X size={12} strokeWidth={2.5} />
                    </button>

                    <label style={{ ...s.label, marginBottom: 4 }}>Produit</label>
                    <select value={item.produit_id}
                      onChange={e => modifierProduitD(i, 'produit_id', e.target.value)}
                      style={{ ...s.select, width: '100%', marginBottom: 10 }}>
                      <option value="">— Choisir un produit —</option>
                      {produits.map(p => (
                        <option key={p.id} value={p.id}>{p.nom} (stock : {p.stock})</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ ...s.label, marginBottom: 4 }}>Quantité</label>
                        <input type="number" min="1"
                          max={info?.stock || 9999}
                          value={item.qte_depart}
                          onChange={e => modifierProduitD(i, 'qte_depart', e.target.value)}
                          style={{ ...s.input, textAlign: 'center' }}
                        />
                      </div>
                      {info && (
                        <div style={{ paddingTop: 18, fontSize: 12, color: GOLD, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          max : {info.stock}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              // Desktop row
              return (
                <div key={i} style={s.ligneRow}>
                  <select value={item.produit_id}
                    onChange={e => modifierProduitD(i, 'produit_id', e.target.value)}
                    style={{ ...s.select, flex: 3 }}>
                    <option value="">— Choisir un produit —</option>
                    {produits.map(p => (
                      <option key={p.id} value={p.id}>{p.nom} (stock : {p.stock})</option>
                    ))}
                  </select>
                  <input type="number" min="1"
                    max={info?.stock || 9999}
                    value={item.qte_depart}
                    onChange={e => modifierProduitD(i, 'qte_depart', e.target.value)}
                    style={{ ...s.input, width: 110, textAlign: 'center' }}
                  />
                  <span style={{ width: 100, fontSize: 12, color: info ? GOLD : MUTED, fontWeight: 600 }}>
                    {info ? `max : ${info.stock}` : '—'}
                  </span>
                  <button type="button"
                    onClick={() => setDProduits(p => p.filter((_, idx) => idx !== i))}
                    disabled={dProduits.length === 1}
                    style={{ ...s.btnRemove, opacity: dProduits.length === 1 ? 0.3 : 1, cursor: dProduits.length === 1 ? 'not-allowed' : 'pointer' }}>
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>
              )
            })}
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Note</label>
            <input value={dForm.note}
              onChange={e => setDForm(p => ({ ...p, note: e.target.value }))}
              style={s.input} />
          </div>

          {dError && (
            <div style={{ color: '#c0392b', fontSize: 12, padding: '8px 12px', background: '#FEF1F1', borderRadius: 8, border: '1px solid #FBBCBC', marginBottom: 12 }}>
              {dError}
            </div>
          )}

          <div style={s.formActions}>
            <button type="submit" disabled={dSubmitting}
              style={{
                ...s.btnPrimary,
                width: isMobile ? '100%' : undefined,
                justifyContent: isMobile ? 'center' : undefined,
                opacity: dSubmitting ? 0.6 : 1,
                cursor: dSubmitting ? 'not-allowed' : 'pointer',
              }}>
              <Play size={14} strokeWidth={2.5} />
              <span>{dSubmitting ? 'Démarrage...' : 'Démarrer la session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // ── VUE CLÔTURER ───────────────────────────
  if (view === 'cloturer' && sessionActive) return (
    <div style={{ ...s.page, padding: isMobile ? '16px 12px' : '32px 28px' }}>
      <div style={{ ...s.header, marginBottom: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          <button onClick={() => setView('liste')} style={s.btnBack}>
            <ArrowLeft size={14} strokeWidth={2.5} /><span>Retour</span>
          </button>
          <div>
            <p style={s.eyebrow}>Ambulant</p>
            <h1 style={{ ...s.title, fontSize: isMobile ? 17 : 26 }}>
              Clôturer la session {sessionActive.id}
            </h1>
            <div style={s.titleUnderline} />
          </div>
        </div>
      </div>

      <div style={{ ...s.formCard, padding: isMobile ? '14px 12px' : '20px 24px' }}>
        {/* Info box — colonne sur mobile */}
        <div style={{
          ...s.infoBox,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 32,
        }}>
          <InfoItem label="Employé"    value={sessionActive.employe_nom} />
          <InfoItem label="Commission" value={`${sessionActive.taux_commission}%`} />
          <InfoItem label="Départ"     value={new Date(sessionActive.date_depart).toLocaleString('fr-FR')} />
        </div>

        <div style={s.formHeader}><span style={s.formTitle}>Saisir les retours</span></div>
        <div style={s.formDivider} />

        <form onSubmit={handleCloturer} noValidate>
          {isMobile ? (
            /* ── Retours en cartes sur mobile ── */
            <div style={{ marginBottom: 16 }}>
              {retours.map((r, i) => (
                <div key={r.stock_ambulant_id} style={{
                  background: i % 2 === 0 ? WHITE : '#FAFBFC',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 10,
                }}>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 10 }}>
                    {r.produit_nom}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {[
                      { label: 'Emporté',     val: r.qte_depart,     color: NAVY  },
                      { label: 'Vendu',       val: r.qte_vendue,     color: r.qte_vendue > 0 ? GREEN : MUTED },
                      { label: 'Disponible',  val: r.qte_disponible, color: r.qte_disponible > 0 ? GOLD : GREEN },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{
                        background: BG,
                        borderRadius: 8,
                        padding: '6px 10px',
                        textAlign: 'center',
                        flex: 1,
                        minWidth: 70,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ ...s.label, marginBottom: 0, whiteSpace: 'nowrap' }}>Retour</label>
                    <input type="number" min="0" max={r.qte_disponible}
                      value={r.qte_retour}
                      onChange={e => modifierRetour(i, e.target.value)}
                      style={{ ...s.input, width: 90, textAlign: 'center' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Table desktop ── */
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Produit', 'Emporté', 'Vendu', 'Disponible', 'Retour'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {retours.map((r, i) => (
                    <tr key={r.stock_ambulant_id} style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}>
                      <td style={{ ...s.td, fontWeight: 700, color: NAVY }}>{r.produit_nom}</td>
                      <td style={s.td}>{r.qte_depart}</td>
                      <td style={s.td}>
                        <span style={{ fontWeight: 600, color: r.qte_vendue > 0 ? GREEN : MUTED }}>
                          {r.qte_vendue}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.badge,
                          background: r.qte_disponible > 0 ? '#FBF5E9' : '#EBF5EF',
                          color: r.qte_disponible > 0 ? GOLD : GREEN,
                        }}>
                          {r.qte_disponible}
                        </span>
                      </td>
                      <td style={s.td}>
                        <input type="number" min="0" max={r.qte_disponible}
                          value={r.qte_retour}
                          onChange={e => modifierRetour(i, e.target.value)}
                          style={{ ...s.input, width: 80, textAlign: 'center' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Commission */}
          <div style={s.commissionBox}>
            <div style={s.commissionTitle}>
              <Coins size={13} color={PURPLE} strokeWidth={2} />
              Récapitulatif commission
            </div>
            {[
              {
                label: 'Taux appliqué',
                val: `${sessionActive.taux_commission}%`,
                bold: false,
              },
              {
                label: 'CA vendu estimé',
                val: `${retours.reduce((acc, r) => acc + (r.qte_depart - r.qte_retour) * Number(r.prix_unitaire), 0).toLocaleString()} FCFA`,
                bold: false,
              },
              {
                label: 'Commission à verser',
                val: `${commissionPrevisionnelle.toLocaleString(undefined, { maximumFractionDigits: 0 })} FCFA`,
                bold: true,
              },
            ].map(({ label, val, bold }) => (
              <div key={label} style={s.commissionRow}>
                <span style={{ fontSize: bold ? (isMobile ? 13 : 14) : (isMobile ? 12 : 13), fontWeight: bold ? 700 : 400, color: NAVY }}>{label}</span>
                <span style={{ fontSize: bold ? (isMobile ? 14 : 16) : (isMobile ? 12 : 13), fontWeight: bold ? 800 : 600, color: bold ? PURPLE : NAVY }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ ...s.fieldGroup, marginTop: 16 }}>
            <label style={s.label}>Note de clôture</label>
            <input value={cNote} onChange={e => setCNote(e.target.value)} style={s.input} />
          </div>

          {cError && (
            <div style={{ color: '#c0392b', fontSize: 12, padding: '8px 12px', background: '#FEF1F1', borderRadius: 8, border: '1px solid #FBBCBC', marginBottom: 12 }}>
              {cError}
            </div>
          )}

          <div style={s.formActions}>
            <button type="submit" disabled={cSubmitting}
              style={{
                ...s.btnPrimary,
                background: PURPLE,
                width: isMobile ? '100%' : undefined,
                justifyContent: isMobile ? 'center' : undefined,
                opacity: cSubmitting ? 0.6 : 1,
                cursor: cSubmitting ? 'not-allowed' : 'pointer',
              }}>
              <Square size={13} strokeWidth={2.5} />
              <span>{cSubmitting ? 'Clôture en cours...' : 'Clôturer la session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // ── VUE LISTE ──────────────────────────────
  const enCours   = sessions.filter(s => s.statut === 'en_cours')
  const terminees = sessions.filter(s => s.statut === 'terminee')

  return (
    <div style={{ ...s.page, padding: isMobile ? '16px 12px' : '32px 28px' }}>
      <div style={{
        ...s.header,
        marginBottom: isMobile ? 16 : 24,
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 14 : 0,
      }}>
        <div>
          <p style={s.eyebrow}>Gestion</p>
          <h1 style={{ ...s.title, fontSize: isMobile ? 22 : 26 }}>Mode Ambulant</h1>
          <div style={s.titleUnderline} />
        </div>
        {canManage && (
          <button onClick={() => setView('demarrer')} style={{
            ...s.btnPrimary,
            width: isMobile ? '100%' : undefined,
            justifyContent: isMobile ? 'center' : undefined,
          }}>
            <Play size={15} strokeWidth={2.5} /><span>Démarrer une session</span>
          </button>
        )}
      </div>

      {/* Stats — 2 colonnes sur mobile */}
      <div style={{
        ...s.statsRow,
        flexWrap: 'wrap',
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 16 : 24,
      }}>
        {[
          { label: 'Total sessions', val: sessions.length,    Icon: Users,       bg: '#EEF1F8', color: NAVY   },
          { label: 'En cours',       val: enCours.length,     Icon: Clock,       bg: '#FBF5E9', color: GOLD   },
          { label: 'Terminées',      val: terminees.length,   Icon: CheckCircle, bg: '#EBF5EF', color: GREEN  },
          { label: 'CA total',
            val: `${sessions.reduce((a, s) => a + Number(s.total_vendu || 0), 0).toLocaleString()} F`,
            Icon: TrendingUp, bg: '#EEE9F8', color: PURPLE },
        ].map(({ label, val, Icon, bg, color }) => (
          <div key={label} style={{
            ...s.statCard,
            flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
            padding: isMobile ? '12px 14px' : '14px 18px',
          }}>
            <div style={{ ...s.statIcon, background: bg }}>
              <Icon size={16} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ ...s.statVal, fontSize: isMobile ? 17 : 20 }}>{val}</div>
              <div style={{ ...s.statLabel, fontSize: isMobile ? 10 : 11 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <p style={s.loading}>Chargement...</p>
      ) : sessions.length === 0 ? (
        <div style={s.tableCard}>
          <div style={s.empty}>
            <Users size={28} color={MUTED} strokeWidth={1.3} />
            <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>Aucune session ambulant.</p>
          </div>
        </div>
      ) : (
        <div style={s.tableCard}>
          <div style={s.liste}>
            {sessions.map((sess, i) => (
              <div key={sess.id}
                style={{
                  ...s.sessionCard,
                  padding: isMobile ? '14px 12px' : '16px 20px',
                  background: i % 2 === 0 ? WHITE : '#FAFBFC',
                  borderBottom: i < sessions.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}
                onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
              >
                {isMobile ? (
                  /* ── Carte mobile ── */
                  <div>
                    {/* Ligne 1 : badge id + statut */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{
                        ...s.idBadge,
                        background: sess.statut === 'en_cours' ? '#FBF5E9' : '#EBF5EF',
                        color: sess.statut === 'en_cours' ? GOLD : GREEN,
                      }}>
                        #{sess.id}
                      </div>
                      <StatutBadge statut={sess.statut} />
                    </div>

                    {/* Nom + date */}
                    <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 2 }}>
                      {sess.employe_nom}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span>{new Date(sess.date_depart).toLocaleString('fr-FR')}</span>
                      {sess.taux_commission > 0 && (
                        <><span>·</span><span>Commission {sess.taux_commission}%</span></>
                      )}
                    </div>

                    {/* Stock tags */}
                    {sess.stocks?.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {sess.stocks.map(stock => (
                          <span key={stock.id} style={s.stockTag}>
                            {stock.produit_nom} : {stock.qte_vendue}/{stock.qte_depart}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Montants + bouton */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: NAVY, fontSize: 15 }}>
                          {Number(sess.total_vendu).toLocaleString()} FCFA
                        </div>
                        {sess.statut === 'terminee' && sess.commission_totale > 0 && (
                          <div style={{ color: PURPLE, fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                            Commission : {Number(sess.commission_totale).toLocaleString()} FCFA
                          </div>
                        )}
                      </div>
                      {sess.statut === 'en_cours' && canManage && (
                        <button onClick={() => ouvrirCloture(sess)} style={s.btnCloturer}>
                          <Square size={11} strokeWidth={2.5} /><span>Clôturer</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── Ligne desktop ── */
                  <div style={s.cardMain}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{
                        ...s.idBadge,
                        background: sess.statut === 'en_cours' ? '#FBF5E9' : '#EBF5EF',
                        color: sess.statut === 'en_cours' ? GOLD : GREEN,
                      }}>
                        {sess.id}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>
                          {sess.employe_nom}
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, marginTop: 2, display: 'flex', gap: 8 }}>
                          <span>{new Date(sess.date_depart).toLocaleString('fr-FR')}</span>
                          {sess.taux_commission > 0 && (
                            <><span>·</span><span>Commission {sess.taux_commission}%</span></>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {sess.stocks?.map(stock => (
                            <span key={stock.id} style={s.stockTag}>
                              {stock.produit_nom} : {stock.qte_vendue}/{stock.qte_depart}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ marginBottom: 8 }}>
                        <StatutBadge statut={sess.statut} />
                      </div>
                      <div style={{ fontWeight: 800, color: NAVY, fontSize: 14 }}>
                        {Number(sess.total_vendu).toLocaleString()} FCFA
                      </div>
                      {sess.statut === 'terminee' && sess.commission_totale > 0 && (
                        <div style={{ color: PURPLE, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                          Commission : {Number(sess.commission_totale).toLocaleString()} FCFA
                        </div>
                      )}
                      {sess.statut === 'en_cours' && canManage && (
                        <button onClick={() => ouvrirCloture(sess)} style={{ ...s.btnCloturer, marginTop: 10 }}>
                          <Square size={11} strokeWidth={2.5} /><span>Clôturer</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page:           { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:        { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:          { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline: { width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  btnPrimary:     { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:   { display: 'flex', alignItems: 'center', gap: 8, background: BG, color: NAVY, border: 'none', padding: '11px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnBack:        { display: 'flex', alignItems: 'center', gap: 6, background: BG, color: NAVY, border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  btnCloturer:    { display: 'flex', alignItems: 'center', gap: 6, background: '#EEE9F8', color: PURPLE, border: `1px solid #C4B5FD`, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 },
  statsRow:       { display: 'flex', gap: 12, marginBottom: 24 },
  statCard:       { display: 'flex', alignItems: 'center', gap: 12, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', flex: 1 },
  statIcon:       { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:        { fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statLabel:      { fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 },
  alertSuccess:   { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500 },
  alertError:     { background: '#FEF1F1', border: '1px solid #FBBCBC', color: '#c0392b', borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13 },
  formCard:       { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 },
  formHeader:     { marginBottom: 14 },
  formTitle:      { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  formDivider:    { height: 1, background: BORDER, marginBottom: 18 },
  formActions:    { marginTop: 16 },
  row:            { display: 'flex', gap: 12 },
  fieldGroup:     { marginBottom: 16, flex: 1 },
  label:          { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:          { padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE, width: '100%' },
  select:         { padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', background: WHITE },
  lignesHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lignesContainer:{ background: BG, borderRadius: 10, padding: '12px 14px', marginBottom: 16 },
  ligneRowHeader: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` },
  colLabel:       { fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px' },
  ligneRow:       { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  btnAdd:         { display: 'flex', alignItems: 'center', gap: 6, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5`, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 },
  btnRemove:      { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF1F1', color: '#c0392b', border: 'none', padding: '8px', borderRadius: 8, width: 32, height: 32, flexShrink: 0 },
  infoBox:        { display: 'flex', gap: 32, background: BG, borderRadius: 10, padding: '14px 18px', marginBottom: 20, border: `1px solid ${BORDER}` },
  table:          { width: '100%', borderCollapse: 'collapse', marginBottom: 16 },
  th:             { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG, borderBottom: `1px solid ${BORDER}` },
  tr:             { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:             { padding: '11px 14px', fontSize: 13, verticalAlign: 'middle' },
  badge:          { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  commissionBox:  { background: '#F5F0FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '16px 20px', marginBottom: 16 },
  commissionTitle:{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: PURPLE, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 },
  commissionRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid #EDE9FE` },
  tableCard:      { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' },
  liste:          { display: 'flex', flexDirection: 'column' },
  sessionCard:    { padding: '16px 20px', transition: 'background 0.1s', cursor: 'default' },
  cardMain:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  idBadge:        { padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 2 },
  stockTag:       { background: BG, color: NAVY, border: `1px solid ${BORDER}`, padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 },
  loading:        { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:          { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default AmbulantPage