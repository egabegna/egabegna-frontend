import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import ambulantService from '../services/ambulantService'
import employeService  from '../services/employeService'
import produitService  from '../services/produitService'
import StatutBadge     from '../components/shared/StatutBadge'

function AmbulantPage() {
  const { role }                      = useAuthContext()
  const [sessions, setSessions]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState('liste') // liste | demarrer | cloturer
  const [sessionActive, setSessionActive] = useState(null)
  const [msg, setMsg]                 = useState({ type: '', text: '' })

  // Formulaire démarrage
  const [employes, setEmployes]       = useState([])
  const [produits, setProduits]       = useState([])
  const [dForm, setDForm]             = useState({
    employe_id: '', taux_commission: 0, note: ''
  })
  const [dProduits, setDProduits]     = useState([
    { produit_id: '', qte_depart: 1 }
  ])
  const [dSubmitting, setDSubmitting] = useState(false)
  const [dError, setDError]           = useState('')

  // Formulaire clôture
  const [retours, setRetours]         = useState([])
  const [cNote, setCNote]             = useState('')
  const [cSubmitting, setCSubmitting] = useState(false)
  const [cError, setCError]           = useState('')

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
    } catch { setMsg({ type: 'error', text: 'Erreur de chargement.' }) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { charger() }, [charger])

  // ── Démarrage ──────────────────────────────
  const ajouterProduitD = () => {
    setDProduits(p => [...p, { produit_id: '', qte_depart: 1 }])
  }

  const modifierProduitD = (i, field, val) => {
    setDProduits(p => p.map((item, idx) =>
      idx === i ? { ...item, [field]: val } : item
    ))
  }

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
      setDError(
        Array.isArray(d?.detail) ? d.detail.join('\n') : d?.detail || 'Erreur.'
      )
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
      qte_retour:        s.qte_disponible, // par défaut tout retourner
    })))
    setView('cloturer')
  }

  const modifierRetour = (i, val) => {
    setRetours(p => p.map((r, idx) => idx === i ? { ...r, qte_retour: Number(val) } : r))
  }

  // Commission prévisionnelle
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

  // ── RENDU ──────────────────────────────────
  if (view === 'demarrer') return (
    <div style={as.page}>
      <div style={as.backRow}>
        <button onClick={() => setView('liste')} style={as.btnBack}>← Retour</button>
        <h1 style={as.title}>Démarrer une session</h1>
      </div>

      <div style={as.formCard}>
        <form onSubmit={handleDemarrer}>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={as.label}>Employé ambulant *</label>
              <select value={dForm.employe_id}
                onChange={e => setDForm(p => ({ ...p, employe_id: e.target.value }))}
                style={as.select}>
                <option value="">— Choisir —</option>
                {employes.map(e => (
                  <option key={e.id} value={e.id}>{e.nom_complet}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={as.label}>Taux commission (%)</label>
              <input type="number" min="0" max="100"
                value={dForm.taux_commission}
                onChange={e => setDForm(p => ({ ...p, taux_commission: e.target.value }))}
                style={as.input} />
            </div>
          </div>

          {/* Produits */}
          <div style={as.lignesHeader}>
            <label style={as.label}>Produits à emporter</label>
            <button type="button" onClick={ajouterProduitD} style={as.btnAdd}>+ Produit</button>
          </div>

          {dProduits.map((item, i) => {
            const produitInfo = produits.find(p => p.id === Number(item.produit_id))
            return (
              <div key={i} style={as.ligneRow}>
                <select value={item.produit_id}
                  onChange={e => modifierProduitD(i, 'produit_id', e.target.value)}
                  style={{ ...as.select, flex: 2 }}>
                  <option value="">— Produit —</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (stock: {p.stock})
                    </option>
                  ))}
                </select>
                <input type="number" min="1"
                  max={produitInfo?.stock || 9999}
                  value={item.qte_depart}
                  onChange={e => modifierProduitD(i, 'qte_depart', e.target.value)}
                  placeholder="Quantité"
                  style={{ ...as.input, width: 100 }} />
                {produitInfo && (
                  <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    max: {produitInfo.stock}
                  </span>
                )}
                <button type="button"
                  onClick={() => setDProduits(p => p.filter((_, idx) => idx !== i))}
                  style={as.btnRemove}
                  disabled={dProduits.length === 1}>✕</button>
              </div>
            )
          })}

          <div style={{ marginTop: 12 }}>
            <label style={as.label}>Note</label>
            <input value={dForm.note}
              onChange={e => setDForm(p => ({ ...p, note: e.target.value }))}
              style={as.input} />
          </div>

          {dError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{dError}</p>}

          <button type="submit" disabled={dSubmitting} style={{ ...as.btnPrimary, marginTop: 16 }}>
            {dSubmitting ? 'Démarrage...' : '▶ Démarrer la session'}
          </button>
        </form>
      </div>
    </div>
  )

  if (view === 'cloturer' && sessionActive) return (
    <div style={as.page}>
      <div style={as.backRow}>
        <button onClick={() => setView('liste')} style={as.btnBack}>← Retour</button>
        <h1 style={as.title}>Clôturer session #{sessionActive.id}</h1>
      </div>

      <div style={as.formCard}>
        <div style={as.infoBox}>
          <InfoItem label="Employé"    value={sessionActive.employe_nom} />
          <InfoItem label="Commission" value={`${sessionActive.taux_commission}%`} />
          <InfoItem label="Départ"     value={new Date(sessionActive.date_depart).toLocaleString('fr-FR')} />
        </div>

        <form onSubmit={handleCloturer}>
          <table style={as.table}>
            <thead>
              <tr style={as.thead}>
                {['Produit', 'Emporté', 'Vendu', 'Disponible', 'Retour'].map(h => (
                  <th key={h} style={as.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retours.map((r, i) => (
                <tr key={r.stock_ambulant_id} style={as.tr}>
                  <td style={as.td}>{r.produit_nom}</td>
                  <td style={as.td}>{r.qte_depart}</td>
                  <td style={as.td}>{r.qte_vendue}</td>
                  <td style={as.td}>
                    <span style={{
                      color: r.qte_disponible > 0 ? '#d97706' : '#16a34a',
                      fontWeight: 600,
                    }}>
                      {r.qte_disponible}
                    </span>
                  </td>
                  <td style={as.td}>
                    <input type="number" min="0"
                      max={r.qte_disponible}
                      value={r.qte_retour}
                      onChange={e => modifierRetour(i, e.target.value)}
                      style={{ ...as.input, width: 80 }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Récap commission */}
          <div style={as.commissionBox}>
            <div style={as.commissionTitle}>Récapitulatif commission</div>
            <div style={as.commissionRow}>
              <span>Taux appliqué</span>
              <span>{sessionActive.taux_commission}%</span>
            </div>
            <div style={as.commissionRow}>
              <span>CA vendu estimé</span>
              <span>
                {retours.reduce((acc, r) => {
                  const vendu = r.qte_depart - r.qte_retour
                  return acc + vendu * Number(r.prix_unitaire)
                }, 0).toLocaleString()} FCFA
              </span>
            </div>
            <div style={{ ...as.commissionRow, fontWeight: 700, fontSize: 16 }}>
              <span>Commission à verser</span>
              <span style={{ color: '#7c3aed' }}>
                {commissionPrevisionnelle.toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })} FCFA
              </span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={as.label}>Note de clôture</label>
            <input value={cNote} onChange={e => setCNote(e.target.value)} style={as.input} />
          </div>

          {cError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{cError}</p>}

          <button type="submit" disabled={cSubmitting}
            style={{ ...as.btnPrimary, backgroundColor: '#7c3aed', marginTop: 16 }}>
            {cSubmitting ? 'Clôture...' : '■ Clôturer la session'}
          </button>
        </form>
      </div>
    </div>
  )

  // Vue liste
  return (
    <div style={as.page}>
      <div style={as.header}>
        <div>
          <h1 style={as.title}>Mode Ambulant</h1>
          <p style={as.sub}>{sessions.length} session(s)</p>
        </div>
        {['proprietaire', 'manager'].includes(role) && (
          <button onClick={() => setView('demarrer')} style={as.btnPrimary}>
            ▶ Démarrer session
          </button>
        )}
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? as.alertSuccess : as.alertError}>
          {msg.text}
        </div>
      )}

      {loading ? <p style={as.loading}>Chargement...</p> : (
        <div style={as.liste}>
          {sessions.map(s => (
            <div key={s.id} style={as.card}>
              <div style={as.cardMain}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Session #{s.id} — {s.employe_nom}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {new Date(s.date_depart).toLocaleString('fr-FR')}
                    {s.taux_commission > 0 && ` · Commission ${s.taux_commission}%`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {s.stocks?.map(stock => (
                      <span key={stock.id} style={as.stockTag}>
                        {stock.produit_nom} : {stock.qte_vendue}/{stock.qte_depart}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatutBadge statut={s.statut} />
                  <div style={{ fontWeight: 700, marginTop: 8 }}>
                    {Number(s.total_vendu).toLocaleString()} FCFA
                  </div>
                  {s.statut === 'terminee' && s.commission_totale > 0 && (
                    <div style={{ color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>
                      Commission : {Number(s.commission_totale).toLocaleString()} FCFA
                    </div>
                  )}
                  {s.statut === 'en_cours' && ['proprietaire', 'manager'].includes(role) && (
                    <button onClick={() => ouvrirCloture(s)}
                      style={{ ...as.btnCloturer, marginTop: 8 }}>
                      ■ Clôturer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p style={as.empty}>Aucune session.</p>}
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const as = {
  page:    { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  backRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  sub:     { fontSize: 13, color: '#6b7280', marginTop: 4 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  formCard:  { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input:     { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box', width: '100%' },
  select:    { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' },
  lignesHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ligneRow:  { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  btnAdd:    { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnRemove: { backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  btnPrimary: { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnBack:    { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  btnCloturer:{ backgroundColor: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  infoBox:   { display: 'flex', gap: 32, backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20 },
  table:     { width: '100%', borderCollapse: 'collapse', marginBottom: 16 },
  thead:     { backgroundColor: '#f9fafb' },
  th:        { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' },
  tr:        { borderBottom: '1px solid #f3f4f6' },
  td:        { padding: '10px 12px', fontSize: 14 },
  commissionBox: { backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 16, marginTop: 16 },
  commissionTitle: { fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  commissionRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 },
  liste:     { display: 'flex', flexDirection: 'column', gap: 12 },
  card:      { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px' },
  cardMain:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  stockTag:  { backgroundColor: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 8, fontSize: 12 },
  loading:   { color: '#9ca3af', textAlign: 'center', padding: 30 },
  empty:     { textAlign: 'center', color: '#9ca3af', padding: 30 },
}

export default AmbulantPage