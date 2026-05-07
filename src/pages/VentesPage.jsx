import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthContext } from '../store/AuthContext'
import { useDebounce }    from '../hooks/useDebounce'
import venteService       from '../services/venteService'
import produitService     from '../services/produitService'

// ─── Constantes ───────────────────────────────
const MODES = [
  { value: 'cash',         label: '💵 Cash'         },
  { value: 'mobile_money', label: '📱 Mobile Money'  },
  { value: 'credit',       label: '📋 Crédit'        },
]

// ─── Autocomplete produit ─────────────────────
function AutocompleteProduit({ onSelect, boutiqueProduits }) {
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const debouncedQ              = useDebounce(query, 200)
  const ref                     = useRef(null)

  const resultats = boutiqueProduits.filter(p =>
    p.actif && p.nom.toLowerCase().includes(debouncedQ.toLowerCase())
  ).slice(0, 8)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const choisir = (produit) => {
    onSelect(produit)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="🔍 Ajouter un produit..."
        style={vs.searchInput}
        autoComplete="off"
      />
      {open && debouncedQ && resultats.length > 0 && (
        <div style={vs.dropdown}>
          {resultats.map(p => (
            <div key={p.id} onClick={() => choisir(p)}
              style={vs.dropdownItem}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {Number(p.prix_vente).toLocaleString()} FCFA
                · Stock : {p.stock}
                {p.stock === 0 && <span style={{ color: '#dc2626' }}> · RUPTURE</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && debouncedQ && resultats.length === 0 && (
        <div style={vs.dropdown}>
          <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 13 }}>
            Aucun produit trouvé.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Ligne de vente ───────────────────────────
function LigneVenteRow({ ligne, onQteChange, onRemove }) {
  const stockOk = ligne.produit.stock >= ligne.quantite

  return (
    <div style={vs.ligneRow}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{ligne.produit.nom}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {Number(ligne.produit.prix_vente).toLocaleString()} FCFA / unité
          {!stockOk && (
            <span style={{ color: '#dc2626', marginLeft: 8 }}>
              ⚠️ Stock insuffisant (dispo: {ligne.produit.stock})
            </span>
          )}
        </div>
      </div>

      {/* Contrôle quantité */}
      <div style={vs.qteControl}>
        <button
          onClick={() => onQteChange(ligne.produit.id, ligne.quantite - 1)}
          style={vs.qteBtn}
          disabled={ligne.quantite <= 1}>
          −
        </button>
        <span style={vs.qteVal}>{ligne.quantite}</span>
        <button
          onClick={() => onQteChange(ligne.produit.id, ligne.quantite + 1)}
          style={vs.qteBtn}>
          +
        </button>
      </div>

      {/* Sous-total */}
      <div style={vs.sousTotal}>
        {(ligne.produit.prix_vente * ligne.quantite).toLocaleString()} FCFA
      </div>

      <button onClick={() => onRemove(ligne.produit.id)} style={vs.removeBtn}>✕</button>
    </div>
  )
}

// ─── Formulaire nouvelle vente ────────────────
function NouvelleVenteForm({ produits, onSuccess }) {
  const [lignes, setLignes]           = useState([])
  const [mode, setMode]               = useState('cash')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  const total = lignes.reduce(
    (acc, l) => acc + Number(l.produit.prix_vente) * l.quantite, 0
  )

  const stockInvalide = lignes.some(l => l.produit.stock < l.quantite)

  const ajouterProduit = (produit) => {
    setError('')
    setLignes(prev => {
      const existe = prev.find(l => l.produit.id === produit.id)
      if (existe) {
        return prev.map(l =>
          l.produit.id === produit.id
            ? { ...l, quantite: l.quantite + 1 }
            : l
        )
      }
      return [...prev, { produit, quantite: 1 }]
    })
  }

  const changerQte = (produitId, qte) => {
    if (qte < 1) return
    setLignes(prev =>
      prev.map(l => l.produit.id === produitId ? { ...l, quantite: qte } : l)
    )
  }

  const retirerLigne = (produitId) => {
    setLignes(prev => prev.filter(l => l.produit.id !== produitId))
  }

  const handleSubmit = async () => {
    if (lignes.length === 0) { setError('Ajoutez au moins un produit.'); return }
    if (stockInvalide)        { setError('Stock insuffisant sur un ou plusieurs produits.'); return }

    setSubmitting(true)
    setError('')

    try {
      await venteService.creer({
        mode_paiement: mode,
        lignes: lignes.map(l => ({
          produit_id: l.produit.id,
          quantite:   l.quantite,
        })),
      })
      setLignes([])
      setMode('cash')
      onSuccess()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(
        Array.isArray(detail) ? detail.join('\n') : detail || 'Erreur lors de la vente.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={vs.formCard}>
      <h2 style={vs.formTitle}>Nouvelle vente</h2>

      {/* Étape 1 — Ajouter produits */}
      <AutocompleteProduit
        onSelect={ajouterProduit}
        boutiqueProduits={produits}
      />

      {/* Lignes */}
      {lignes.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {lignes.map(l => (
            <LigneVenteRow
              key={l.produit.id}
              ligne={l}
              onQteChange={changerQte}
              onRemove={retirerLigne}
            />
          ))}
        </div>
      )}

      {lignes.length === 0 && (
        <div style={vs.vide}>Aucun produit ajouté.</div>
      )}

      {/* Étape 2 — Mode paiement */}
      <div style={vs.modeRow}>
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            style={{
              ...vs.modeBtn,
              backgroundColor: mode === m.value ? '#111827' : '#f3f4f6',
              color:           mode === m.value ? '#fff'    : '#374151',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Étape 3 — Total + soumettre */}
      <div style={vs.totalRow}>
        <div style={vs.totalLabel}>
          Total : <span style={vs.totalVal}>{total.toLocaleString()} FCFA</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || lignes.length === 0 || stockInvalide}
          style={{
            ...vs.btnValider,
            opacity: (submitting || lignes.length === 0 || stockInvalide) ? 0.6 : 1,
            cursor:  (submitting || lignes.length === 0 || stockInvalide) ? 'not-allowed' : 'pointer',
          }}>
          {submitting ? 'Enregistrement...' : '✓ Valider la vente'}
        </button>
      </div>

      {error && <div style={vs.alertError}>{error}</div>}
    </div>
  )
}

// ─── Drawer détail vente ──────────────────────
function VenteDrawer({ vente, role, onClose, onAnnuler }) {
  const [annulant, setAnnulant] = useState(false)
  const [confirm, setConfirm]   = useState(false)
  const [error, setError]       = useState('')

  const handleAnnuler = async () => {
    setAnnulant(true)
    setError('')
    try {
      await venteService.annuler(vente.id)
      onAnnuler()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur.')
    } finally {
      setAnnulant(false)
      setConfirm(false)
    }
  }

  return (
    <div style={dr.overlay} onClick={onClose}>
      <div style={dr.drawer} onClick={e => e.stopPropagation()}>
        <div style={dr.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17 }}>Vente #{vente.id}</h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
              {new Date(vente.date).toLocaleString('fr-FR')}
            </p>
          </div>
          <button onClick={onClose} style={dr.closeBtn}>✕</button>
        </div>

        <div style={dr.body}>
          {/* Infos */}
          <div style={dr.infoGrid}>
            <InfoItem label="Employé"    value={vente.employe_nom} />
            <InfoItem label="Paiement"   value={vente.mode_paiement} />
            <InfoItem label="Statut"
              value={
                <span style={{
                  ...dr.statutBadge,
                  backgroundColor: vente.statut === 'validee' ? '#dcfce7' : '#fee2e2',
                  color:           vente.statut === 'validee' ? '#16a34a' : '#dc2626',
                }}>
                  {vente.statut === 'validee' ? 'Validée' : 'Annulée'}
                </span>
              }
            />
          </div>

          {/* Lignes */}
          <div style={dr.section}>
            <div style={dr.sectionTitle}>Articles ({vente.nb_articles})</div>
            {vente.lignes.map(l => (
              <div key={l.id} style={dr.ligne}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.produit_nom}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {Number(l.prix_unitaire).toLocaleString()} × {l.quantite}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {Number(l.sous_total).toLocaleString()} FCFA
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={dr.totalRow}>
            <span>Total</span>
            <span style={dr.totalVal}>
              {Number(vente.total).toLocaleString()} FCFA
            </span>
          </div>

          {/* Note */}
          {vente.note && (
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 12 }}>
              Note : {vente.note}
            </p>
          )}

          {/* Annulation — manager+ */}
          {['proprietaire', 'manager'].includes(role) && vente.statut === 'validee' && (
            <div style={{ marginTop: 20 }}>
              {error && <div style={dr.alertError}>{error}</div>}
              {!confirm ? (
                <button onClick={() => setConfirm(true)} style={dr.btnAnnuler}>
                  Annuler cette vente
                </button>
              ) : (
                <div style={dr.confirmBox}>
                  <p style={{ margin: '0 0 12px', fontSize: 14 }}>
                    Confirmer l'annulation ? Le stock sera re-crédité.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleAnnuler} disabled={annulant}
                      style={dr.btnConfirm}>
                      {annulant ? '...' : 'Confirmer'}
                    </button>
                    <button onClick={() => setConfirm(false)} style={dr.btnCancel}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

// ─── Historique des ventes ────────────────────
function HistoriqueVentes({ role, refreshKey }) {
  const [ventes, setVentes]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [filtres, setFiltres]     = useState({ statut: '', mode_paiement: '', date_debut: '', date_fin: '' })
  const [totalJour, setTotalJour] = useState(0)
  const [page, setPage]           = useState(1)
  const [hasNext, setHasNext]     = useState(false)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, ...filtres }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const res = await venteService.liste(params)
      setVentes(res.data.results || res.data)
      setHasNext(!!res.data.next)

      // Total journalier
      const aujourd = new Date().toISOString().split('T')[0]
      const resJour = await venteService.liste({
        date_debut: aujourd,
        date_fin:   aujourd,
        statut:     'validee',
        page_size:  100,
      })
      const ventesJour = resJour.data.results || resJour.data
      setTotalJour(ventesJour.reduce((acc, v) => acc + Number(v.total), 0))
    } catch { }
    finally { setLoading(false) }
  }, [page, filtres])

  useEffect(() => { charger() }, [charger, refreshKey])

  const handleFiltreChange = (e) => {
    setFiltres(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setPage(1)
  }

  return (
    <div style={hs.wrapper}>
      <div style={hs.headerRow}>
        <h2 style={hs.title}>Historique</h2>
        <div style={hs.totalJour}>
          CA aujourd'hui : <strong>{totalJour.toLocaleString()} FCFA</strong>
        </div>
      </div>

      {/* Filtres */}
      <div style={hs.filtres}>
        <select name="statut" value={filtres.statut}
          onChange={handleFiltreChange} style={hs.select}>
          <option value="">Tous statuts</option>
          <option value="validee">Validée</option>
          <option value="annulee">Annulée</option>
        </select>
        <select name="mode_paiement" value={filtres.mode_paiement}
          onChange={handleFiltreChange} style={hs.select}>
          <option value="">Tous modes</option>
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="credit">Crédit</option>
        </select>
        <input name="date_debut" type="date" value={filtres.date_debut}
          onChange={handleFiltreChange} style={hs.dateInput} />
        <input name="date_fin"   type="date" value={filtres.date_fin}
          onChange={handleFiltreChange} style={hs.dateInput} />
      </div>

      {/* Liste */}
      {loading ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>Chargement...</p>
      ) : ventes.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>Aucune vente.</p>
      ) : (
        <>
          {ventes.map(v => (
            <div key={v.id}
              onClick={() => setSelected(v)}
              style={hs.row}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Vente #{v.id}
                  {v.statut === 'annulee' && (
                    <span style={hs.annuleeBadge}>Annulée</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {v.employe_nom} · {new Date(v.date).toLocaleString('fr-FR')}
                  · {v.nb_articles} article(s) · {v.mode_paiement}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15,
                color: v.statut === 'annulee' ? '#9ca3af' : '#111827' }}>
                {Number(v.total).toLocaleString()} FCFA
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div style={hs.pagination}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={hs.pageBtn}>← Précédent</button>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Page {page}</span>
            <button disabled={!hasNext} onClick={() => setPage(p => p + 1)}
              style={hs.pageBtn}>Suivant →</button>
          </div>
        </>
      )}

      {/* Drawer détail */}
      {selected && (
        <VenteDrawer
          vente={selected}
          role={role}
          onClose={() => setSelected(null)}
          onAnnuler={() => { setSelected(null); charger() }}
        />
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────
function VentesPage() {
  const { role }          = useAuthContext()
  const [produits, setProduits] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    produitService.getProduits({ actif: 'true' })
      .then(r => setProduits(r.data))
      .catch(() => {})
  }, [])

  const apresVente = () => {
    setSuccessMsg('Vente enregistrée avec succès ! ✓')
    setRefreshKey(k => k + 1)
    setTimeout(() => setSuccessMsg(''), 3000)
    // Rafraîchir le stock
    produitService.getProduits({ actif: 'true' })
      .then(r => setProduits(r.data))
      .catch(() => {})
  }

  return (
    <div style={vs.page}>
      <h1 style={vs.pageTitle}>Ventes</h1>

      {successMsg && <div style={vs.alertSuccess}>{successMsg}</div>}

      <div style={vs.layout}>
        {/* Colonne gauche — Formulaire */}
        <div style={vs.colLeft}>
          <NouvelleVenteForm produits={produits} onSuccess={apresVente} />
        </div>

        {/* Colonne droite — Historique */}
        <div style={vs.colRight}>
          <HistoriqueVentes role={role} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const vs = {
  page:      { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  pageTitle: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  layout:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' },
  colLeft:   {},
  colRight:  {},

  formCard:  { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 },
  formTitle: { fontSize: 17, fontWeight: 700, marginBottom: 16 },
  searchInput: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  dropdown:  { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 280, overflowY: 'auto' },
  dropdownItem: { padding: '10px 14px', cursor: 'pointer', backgroundColor: '#fff', transition: 'background 0.1s' },

  ligneRow:  { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  qteControl:{ display: 'flex', alignItems: 'center', gap: 8 },
  qteBtn:    { width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: '#f9fafb', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qteVal:    { fontSize: 15, fontWeight: 600, minWidth: 24, textAlign: 'center' },
  sousTotal: { fontSize: 14, fontWeight: 600, minWidth: 100, textAlign: 'right' },
  removeBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: '0 4px' },

  vide:      { textAlign: 'center', color: '#9ca3af', padding: '20px 0', fontSize: 13 },

  modeRow:   { display: 'flex', gap: 8, marginTop: 16 },
  modeBtn:   { flex: 1, padding: '9px 8px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },

  totalRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '2px solid #f3f4f6' },
  totalLabel:{ fontSize: 15, fontWeight: 600 },
  totalVal:  { fontSize: 20, fontWeight: 800, color: '#111827' },
  btnValider:{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 15, fontWeight: 700, transition: 'opacity 0.2s' },

  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 14 },
}

const hs = {
  wrapper:   { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' },
  title:     { fontSize: 16, fontWeight: 700, margin: 0 },
  totalJour: { fontSize: 13, color: '#374151', backgroundColor: '#f0fdf4', padding: '6px 12px', borderRadius: 8 },
  filtres:   { display: 'flex', gap: 8, padding: '12px 20px', flexWrap: 'wrap', borderBottom: '1px solid #f3f4f6' },
  select:    { padding: '7px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, backgroundColor: '#fff' },
  dateInput: { padding: '7px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 },
  row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.1s' },
  annuleeBadge: { backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, marginLeft: 8 },
  pagination:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' },
  pageBtn:   { backgroundColor: '#f3f4f6', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
}

const dr = {
  overlay:    { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40, display: 'flex', justifyContent: 'flex-end' },
  drawer:     { backgroundColor: '#fff', width: '100%', maxWidth: 440, height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', overflowY: 'auto' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 },
  closeBtn:   { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' },
  body:       { padding: 20, flex: 1 },
  infoGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 },
  section:    { marginBottom: 16 },
  sectionTitle:{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  ligne:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f9fafb' },
  totalRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '2px solid #111827' },
  totalVal:   { fontSize: 18, fontWeight: 800 },
  statutBadge:{ padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 },
  btnAnnuler: { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%' },
  confirmBox: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16 },
  btnConfirm: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnCancel:  { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' },
  alertError: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 14 },
}

export default VentesPage