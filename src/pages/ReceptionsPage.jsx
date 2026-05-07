import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import receptionService from '../services/receptionService'
import fournisseurService from '../services/fournisseurService'
import produitService from '../services/produitService'
import StatutBadge from '../components/shared/StatutBadge'

function ReceptionsPage() {
  const { role }                      = useAuthContext()
  const [receptions, setReceptions]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [fournisseurs, setFournisseurs] = useState([])
  const [produits, setProduits]       = useState([])
  const [selected, setSelected]       = useState(null)
  const [msg, setMsg]                 = useState({ type: '', text: '' })

  // Formulaire
  const [fournisseurId, setFournisseurId] = useState('')
  const [note, setNote]                   = useState('')
  const [lignes, setLignes]               = useState([
    { produit_id: '', quantite: 1, prix_achat: '' }
  ])
  const [submitting, setSubmitting]       = useState(false)
  const [formError, setFormError]         = useState('')

  const charger = useCallback(async () => {
    try {
      const [rRes, fRes, pRes] = await Promise.all([
        receptionService.liste(),
        fournisseurService.liste({ actif: true }),
        produitService.getProduits({ actif: 'true' }),
      ])
      setReceptions(rRes.data.results || rRes.data)
      setFournisseurs(fRes.data)
      setProduits(pRes.data)
    } catch { setMsg({ type: 'error', text: 'Erreur de chargement.' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { charger() }, [charger])

  const ajouterLigne = () => {
    setLignes(p => [...p, { produit_id: '', quantite: 1, prix_achat: '' }])
  }

  const modifierLigne = (i, field, val) => {
    setLignes(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  const retirerLigne = (i) => {
    setLignes(p => p.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const lignesValides = lignes.filter(l => l.produit_id && l.quantite > 0 && l.prix_achat)
    if (lignesValides.length === 0) {
      setFormError('Ajoutez au moins une ligne complète.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await receptionService.creer({
        fournisseur_id: fournisseurId || null,
        note,
        lignes: lignesValides.map(l => ({
          produit_id: Number(l.produit_id),
          quantite:   Number(l.quantite),
          prix_achat: Number(l.prix_achat),
        })),
      })
      setMsg({ type: 'success', text: 'Réception créée.' })
      setShowForm(false)
      setLignes([{ produit_id: '', quantite: 1, prix_achat: '' }])
      setFournisseurId('')
      setNote('')
      await charger()
    } catch (err) {
      const d = err.response?.data
      setFormError(
        Array.isArray(d?.detail) ? d.detail.join('\n') : d?.detail || 'Erreur.'
      )
    } finally { setSubmitting(false) }
  }

  const handleAction = async (id, action) => {
    try {
      if (action === 'valider') await receptionService.valider(id)
      else                      await receptionService.annuler(id)
      setMsg({ type: 'success', text: `Réception ${action === 'valider' ? 'validée' : 'annulée'}.` })
      setSelected(null)
      await charger()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur.' })
    }
  }

  return (
    <div style={rs.page}>
      <div style={rs.header}>
        <div>
          <h1 style={rs.title}>Réceptions</h1>
          <p style={rs.sub}>{receptions.length} réception(s)</p>
        </div>
        {['proprietaire', 'manager'].includes(role) && (
          <button onClick={() => setShowForm(v => !v)} style={rs.btnPrimary}>
            {showForm ? 'Fermer' : '+ Nouvelle réception'}
          </button>
        )}
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? rs.alertSuccess : rs.alertError}>
          {msg.text}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={rs.formCard}>
          <h3 style={rs.formTitle}>Nouvelle réception</h3>
          <form onSubmit={handleSubmit}>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={rs.label}>Fournisseur (optionnel)</label>
                <select value={fournisseurId}
                  onChange={e => setFournisseurId(e.target.value)} style={rs.select}>
                  <option value="">— Sans fournisseur —</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={rs.label}>Note</label>
                <input value={note} onChange={e => setNote(e.target.value)} style={rs.input} />
              </div>
            </div>

            {/* Lignes */}
            <div style={rs.lignesHeader}>
              <span style={rs.label}>Produits reçus</span>
              <button type="button" onClick={ajouterLigne} style={rs.btnAdd}>+ Ligne</button>
            </div>

            {lignes.map((l, i) => (
              <div key={i} style={rs.ligneRow}>
                <select value={l.produit_id}
                  onChange={e => modifierLigne(i, 'produit_id', e.target.value)}
                  style={{ ...rs.select, flex: 2 }}>
                  <option value="">— Choisir produit —</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} (stock: {p.stock})</option>
                  ))}
                </select>
                <input
                  type="number" min="1" value={l.quantite}
                  onChange={e => modifierLigne(i, 'quantite', e.target.value)}
                  placeholder="Qté" style={{ ...rs.input, width: 80 }}
                />
                <input
                  type="number" min="0" value={l.prix_achat}
                  onChange={e => modifierLigne(i, 'prix_achat', e.target.value)}
                  placeholder="Prix achat" style={{ ...rs.input, width: 120 }}
                />
                <button type="button" onClick={() => retirerLigne(i)}
                  style={rs.btnRemove} disabled={lignes.length === 1}>✕</button>
              </div>
            ))}

            {formError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={submitting} style={rs.btnPrimary}>
                {submitting ? '...' : 'Créer la réception'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste réceptions */}
      {loading ? <p style={rs.loading}>Chargement...</p> : (
        <div style={rs.liste}>
          {receptions.map(r => (
            <div key={r.id} style={rs.card}
              onClick={() => setSelected(r === selected ? null : r)}>
              <div style={rs.cardHeader}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Réception #{r.id}
                    {r.fournisseur_nom !== '—' && (
                      <span style={{ color: '#6b7280', fontWeight: 400 }}>
                        {' '}— {r.fournisseur_nom}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {r.employe_nom} · {new Date(r.date).toLocaleString('fr-FR')}
                    · {r.lignes?.length || 0} produit(s)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>
                    {Number(r.total).toLocaleString()} FCFA
                  </span>
                  <StatutBadge statut={r.statut} />
                </div>
              </div>

              {/* Détail + actions */}
              {selected?.id === r.id && (
                <div style={rs.detail} onClick={e => e.stopPropagation()}>
                  <table style={rs.detailTable}>
                    <thead>
                      <tr>
                        {['Produit', 'Qté', 'Prix achat', 'Sous-total'].map(h => (
                          <th key={h} style={rs.dth}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.lignes?.map(l => (
                        <tr key={l.id}>
                          <td style={rs.dtd}>{l.produit_nom}</td>
                          <td style={rs.dtd}>{l.quantite}</td>
                          <td style={rs.dtd}>{Number(l.prix_achat).toLocaleString()} FCFA</td>
                          <td style={rs.dtd}>{Number(l.sous_total).toLocaleString()} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {r.statut === 'en_attente' && ['proprietaire', 'manager'].includes(role) && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button onClick={() => handleAction(r.id, 'valider')}
                        style={rs.btnValider}>✓ Valider (augmente le stock)</button>
                      <button onClick={() => handleAction(r.id, 'annuler')}
                        style={rs.btnAnnuler}>✕ Annuler</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {receptions.length === 0 && <p style={rs.empty}>Aucune réception.</p>}
        </div>
      )}
    </div>
  )
}

const rs = {
  page:    { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  sub:     { fontSize: 13, color: '#6b7280', marginTop: 4 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  formCard:  { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24, marginBottom: 20 },
  formTitle: { fontSize: 15, fontWeight: 600, marginBottom: 16, margin: '0 0 16px' },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input:     { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  select:    { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' },
  lignesHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ligneRow:  { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  btnAdd:    { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnRemove: { backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  btnPrimary:  { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnValider:  { backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnAnnuler:  { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  liste:     { display: 'flex', flexDirection: 'column', gap: 10 },
  card:      { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', cursor: 'pointer' },
  cardHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detail:    { marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' },
  detailTable:{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 },
  dth:       { padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' },
  dtd:       { padding: '8px 12px', fontSize: 13 },
  loading:   { color: '#9ca3af', textAlign: 'center', padding: 30 },
  empty:     { textAlign: 'center', color: '#9ca3af', padding: 30 },
}

export default ReceptionsPage