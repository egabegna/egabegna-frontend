import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Mail, Ban, ChevronRight,
         Package, Send, CheckCircle, Clock,
         AlertTriangle, XCircle, ArrowLeft } from 'lucide-react'
import commandeService  from '../services/commandeService'
import fournisseurService from '../services/fournisseurService'
import produitService   from '../services/produitService'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

// ── Badge statut ──────────────────────────────
const STATUT_CONFIG = {
  brouillon:           { label: 'Brouillon',          color: MUTED,    bg: BG,        Icon: Package     },
  envoyee:             { label: 'Envoyée',             color: '#1a6fa0', bg: '#E8F4FD', Icon: Send        },
  partiellement_recue: { label: 'Partielle',           color: GOLD,     bg: '#FBF5E9', Icon: Clock       },
  complete:            { label: 'Complète',            color: GREEN,    bg: '#EBF5EF', Icon: CheckCircle },
  annulee:             { label: 'Annulée',             color: RED,      bg: '#FEF1F1', Icon: XCircle     },
  en_retard:           { label: 'En retard',           color: '#9a3412', bg: '#FFF4E6', Icon: AlertTriangle },
}

function BadgeStatut({ statut }) {
  const cfg  = STATUT_CONFIG[statut] || STATUT_CONFIG.brouillon
  const { Icon } = cfg
  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      gap:             5,
      backgroundColor: cfg.bg,
      color:           cfg.color,
      fontSize:        11,
      fontWeight:      700,
      padding:         '3px 10px',
      borderRadius:    20,
    }}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}

// ── Formulaire commande ───────────────────────
function CommandeForm({ onClose, onSave }) {
  const [fournisseurs, setFournisseurs] = useState([])
  const [produits, setProduits]         = useState([])
  const [form, setForm]                 = useState({
    fournisseur_id:        '',
    date_reception_prevue: '',
    note:                  '',
  })
  const [lignes, setLignes]             = useState([
    { produit_id: '', qte_commandee: 1, prix_unitaire_estime: '' }
  ])
  const [submitting, setSubmitting]     = useState(false)
  const [errors, setErrors]             = useState({})

  useEffect(() => {
    Promise.all([
      fournisseurService.liste(),
      produitService.getProduits(),
    ]).then(([fRes, pRes]) => {
      setFournisseurs(fRes.data.results || fRes.data)
      setProduits(pRes.data.results || pRes.data)
    })
  }, [])

  const ajouterLigne = () => setLignes(prev => [
    ...prev,
    { produit_id: '', qte_commandee: 1, prix_unitaire_estime: '' }
  ])

  const retirerLigne = (i) => {
    if (lignes.length === 1) return
    setLignes(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateLigne = (i, champ, val) => {
    setLignes(prev => prev.map((l, idx) =>
      idx === i ? { ...l, [champ]: val } : l
    ))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.fournisseur_id) {
      setErrors({ fournisseur_id: 'Fournisseur requis.' })
      return
    }
    if (lignes.some(l => !l.produit_id)) {
      setErrors({ lignes: 'Tous les produits doivent être sélectionnés.' })
      return
    }

    setSubmitting(true)
    try {
      await commandeService.creer({
        ...form,
        fournisseur_id:        Number(form.fournisseur_id),
        date_reception_prevue: form.date_reception_prevue || null,
        lignes: lignes.map(l => ({
          produit_id:           Number(l.produit_id),
          qte_commandee:        Number(l.qte_commandee),
          prix_unitaire_estime: l.prix_unitaire_estime
            ? Number(l.prix_unitaire_estime) : null,
        })),
      })
      onSave()
    } catch (err) {
      const d = err.response?.data || {}
      setErrors(d)
    } finally { setSubmitting(false) }
  }

  return (
    <div style={fm.overlay} onClick={onClose}>
      <div style={fm.modal} onClick={e => e.stopPropagation()}>
        <div style={fm.header}>
          <h2 style={fm.title}>Nouvelle commande</h2>
          <button onClick={onClose} style={fm.closeBtn}><X size={16} /></button>
        </div>
        <div style={fm.body}>
          <form onSubmit={handleSubmit} noValidate>

            {/* Fournisseur */}
            <div style={fm.fieldGroup}>
              <label style={fm.label}>Fournisseur *</label>
              <select
                value={form.fournisseur_id}
                onChange={e => setForm(p => ({ ...p, fournisseur_id: e.target.value }))}
                style={{ ...fm.input, borderColor: errors.fournisseur_id ? RED : BORDER }}
              >
                <option value="">— Choisir un fournisseur —</option>
                {fournisseurs.map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
              {errors.fournisseur_id && (
                <span style={fm.errorMsg}>{errors.fournisseur_id}</span>
              )}
            </div>

            {/* Date prévue */}
            <div style={fm.fieldGroup}>
              <label style={fm.label}>Date de livraison prévue</label>
              <input
                type="datetime-local"
                value={form.date_reception_prevue}
                onChange={e => setForm(p => ({ ...p, date_reception_prevue: e.target.value }))}
                style={fm.input}
              />
            </div>

            {/* Note */}
            <div style={fm.fieldGroup}>
              <label style={fm.label}>Note</label>
              <textarea
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                rows={2}
                style={fm.input}
              />
            </div>

            {/* Lignes */}
            <div style={fm.fieldGroup}>
              <label style={fm.label}>Produits *</label>
              {errors.lignes && (
                <span style={{ ...fm.errorMsg, display: 'block', marginBottom: 8 }}>
                  {errors.lignes}
                </span>
              )}

              {lignes.map((l, i) => (
                <div key={i} style={fm.ligneRow}>
                  <select
                    value={l.produit_id}
                    onChange={e => updateLigne(i, 'produit_id', e.target.value)}
                    style={{ ...fm.input, flex: 2, margin: 0 }}
                  >
                    <option value="">— Produit —</option>
                    {produits.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                  <input
                    type="number" min="1"
                    value={l.qte_commandee}
                    onChange={e => updateLigne(i, 'qte_commandee', e.target.value)}
                    placeholder="Qté"
                    style={{ ...fm.input, flex: 0.5, margin: 0, textAlign: 'center' }}
                  />
                  <input
                    type="number" min="0"
                    value={l.prix_unitaire_estime}
                    onChange={e => updateLigne(i, 'prix_unitaire_estime', e.target.value)}
                    placeholder="Prix estimé"
                    style={{ ...fm.input, flex: 1, margin: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => retirerLigne(i)}
                    disabled={lignes.length === 1}
                    style={{
                      ...fm.iconBtn,
                      opacity: lignes.length === 1 ? 0.3 : 1,
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              <button type="button" onClick={ajouterLigne} style={fm.btnAjouter}>
                <Plus size={12} strokeWidth={2.5} />
                Ajouter une ligne
              </button>
            </div>

            <div style={fm.actions}>
              <button type="button" onClick={onClose} style={fm.btnSecondary}>
                Annuler
              </button>
              <button type="submit" disabled={submitting} style={fm.btnPrimary}>
                {submitting ? '...' : 'Créer la commande'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

const fm = {
  overlay:    { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 50, padding: 16 },
  modal:      { backgroundColor: WHITE, borderRadius: 14, width: '100%',
                maxWidth: 620, maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header:     { display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '18px 24px',
                borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0,
                backgroundColor: WHITE, zIndex: 1 },
  title:      { fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 },
  closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: MUTED },
  body:       { padding: 24 },
  fieldGroup: { marginBottom: 16 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
                letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:      { width: '100%', padding: '9px 12px', borderRadius: 9,
                border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
                boxSizing: 'border-box', outline: 'none', background: WHITE,
                resize: 'vertical' },
  errorMsg:   { color: RED, fontSize: 12, marginTop: 4 },
  ligneRow:   { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  iconBtn:    { background: '#FEF1F1', border: 'none', color: RED, cursor: 'pointer',
                padding: '7px 10px', borderRadius: 8, display: 'flex', flexShrink: 0 },
  btnAjouter: { display: 'flex', alignItems: 'center', gap: 5, background: BG,
                color: NAVY, border: `1px dashed ${BORDER}`, padding: '7px 12px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12, marginTop: 4 },
  actions:    { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  btnPrimary:  { display: 'flex', alignItems: 'center', gap: 6, background: NAVY,
                 color: WHITE, border: 'none', padding: '10px 18px',
                 borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ display: 'flex', alignItems: 'center', gap: 6, background: BG,
                 color: NAVY, border: 'none', padding: '10px 16px',
                 borderRadius: 9, fontSize: 13, cursor: 'pointer' },
}

// ── Détail commande ───────────────────────────
function CommandeDetail({ commandeId, onRetour, onRefresh }) {
  const [commande, setCommande]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [msg, setMsg]                 = useState({ type: '', text: '' })

  const charger = useCallback(async () => {
    try {
      const res = await commandeService.detail(commandeId)
      setCommande(res.data)
    } catch { }
    finally { setLoading(false) }
  }, [commandeId])

  useEffect(() => { charger() }, [charger])

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 3500)
  }

  const action = async (fn, label) => {
    setActionLoading(label)
    try {
      await fn()
      await charger()
      showMsg('success', `${label} effectué.`)
    } catch (err) {
      showMsg('error', err.response?.data?.detail || `Erreur lors de ${label}.`)
    } finally { setActionLoading('') }
  }

  if (loading) return (
    <p style={{ color: MUTED, textAlign: 'center', padding: 60 }}>
      Chargement...
    </p>
  )
  if (!commande) return null

  const canEnvoyer  = commande.statut === 'brouillon'
  const canAnnuler  = !['complete', 'annulee'].includes(commande.statut)
  const canEmail    = commande.fournisseur && commande.fournisseur_email
  const estAnnulee  = commande.statut === 'annulee'

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onRetour} style={dt.btnRetour}>
          <ArrowLeft size={13} strokeWidth={2} />
          Commandes
        </button>
        <span style={{ color: MUTED }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          Commande #{commande.id}
        </span>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={msg.type === 'success' ? dt.alertSuccess : dt.alertError}>
          {msg.text}
        </div>
      )}

      {/* Header commande */}
      <div style={dt.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: 0 }}>
              Commande #{commande.id}
            </h2>
            <BadgeStatut statut={commande.statut} />
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>
            Fournisseur : <strong style={{ color: NAVY }}>{commande.fournisseur_nom}</strong>
            {' · '}
            Créée le {new Date(commande.date_creation).toLocaleDateString('fr-FR')}
          </div>
          {commande.date_reception_prevue && (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
              Livraison prévue : {new Date(commande.date_reception_prevue).toLocaleDateString('fr-FR')}
            </div>
          )}
          {estAnnulee && commande.date_annulation && (
            <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>
              Annulée le : {new Date(commande.date_annulation).toLocaleString('fr-FR')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canEnvoyer && (
            <button
              onClick={() => action(
                () => commandeService.envoyer(commande.id), 'Envoi'
              )}
              disabled={!!actionLoading}
              style={dt.btnAction}
            >
              <Send size={13} strokeWidth={2} />
              {actionLoading === 'Envoi' ? '...' : 'Marquer envoyée'}
            </button>
          )}
          {canEmail && (
            <button
              onClick={() => action(
                () => commandeService.envoyerEmail(commande.id), 'Email'
              )}
              disabled={!!actionLoading}
              style={{ ...dt.btnAction, background: '#E8F4FD', color: '#1a6fa0',
                       border: '1px solid #93c5fd' }}
            >
              <Mail size={13} strokeWidth={2} />
              {actionLoading === 'Email' ? '...' : 'Envoyer email'}
            </button>
          )}
          {canAnnuler && (
            <button
              onClick={() => action(
                () => commandeService.annuler(commande.id), 'Annulation'
              )}
              disabled={!!actionLoading}
              style={{ ...dt.btnAction, background: '#FEF1F1', color: RED,
                       border: '1px solid #FBBCBC' }}
            >
              <Ban size={13} strokeWidth={2} />
              {actionLoading === 'Annulation' ? '...' : 'Annuler'}
            </button>
          )}
        </div>
      </div>

      {/* Tableau comparatif commandé / reçu / écart */}
      <div style={dt.tableCard}>
        <div style={dt.tableHeader}>
          Suivi des articles
        </div>
        <table style={dt.table}>
          <thead>
            <tr style={dt.thead}>
              {['Produit', 'Commandé', 'Reçu', 'Restant', 'Prix estimé', 'Total estimé'].map(h => (
                <th key={h} style={dt.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commande.lignes?.map((l, i) => {
              const restant = l.qte_restante
              const complet = l.est_complete
              return (
                <tr key={l.id} style={{
                  ...dt.tr,
                  background: i % 2 === 0 ? WHITE : '#FAFBFC',
                }}>
                  <td style={dt.td}>
                    <span style={{ fontWeight: 600, color: NAVY }}>
                      {l.produit_nom}
                    </span>
                  </td>
                  <td style={dt.td}>{l.qte_commandee}</td>
                  <td style={dt.td}>
                    <span style={{ color: l.qte_recue > 0 ? GREEN : MUTED }}>
                      {l.qte_recue}
                    </span>
                  </td>
                  <td style={dt.td}>
                    <span style={{
                      fontWeight: 700,
                      color: complet ? GREEN : restant > 0 ? RED : MUTED,
                    }}>
                      {complet ? '✓ Complet' : restant}
                    </span>
                  </td>
                  <td style={dt.td}>
                    {l.prix_unitaire_estime
                      ? `${Number(l.prix_unitaire_estime).toLocaleString()} FCFA`
                      : '—'}
                  </td>
                  <td style={dt.td}>
                    {l.sous_total_estime
                      ? `${Number(l.sous_total_estime).toLocaleString()} FCFA`
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${BORDER}` }}>
              <td colSpan={5} style={{ ...dt.td, fontWeight: 700, textAlign: 'right' }}>
                Total estimé
              </td>
              <td style={{ ...dt.td, fontWeight: 800, color: NAVY }}>
                {commande.total_estime
                  ? `${Number(commande.total_estime).toLocaleString()} FCFA`
                  : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {commande.note && (
        <div style={dt.noteCard}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MUTED,
                         textTransform: 'uppercase', letterSpacing: 1 }}>
            Note
          </span>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: NAVY }}>
            {commande.note}
          </p>
        </div>
      )}
    </div>
  )
}

const dt = {
  btnRetour:    { display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                  border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13,
                  padding: '4px 8px', borderRadius: 6 },
  alertSuccess: { background: '#EBF5EF', border: '1px solid #A8D5B5',
                  color: GREEN, borderRadius: 10, padding: '10px 16px',
                  marginBottom: 16, fontSize: 13 },
  alertError:   { background: '#FEF1F1', border: '1px solid #FBBCBC',
                  color: RED, borderRadius: 10, padding: '10px 16px',
                  marginBottom: 16, fontSize: 13 },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  backgroundColor: WHITE, border: `1px solid ${BORDER}`,
                  borderRadius: 14, padding: '20px 24px', marginBottom: 20,
                  flexWrap: 'wrap', gap: 16 },
  btnAction:    { display: 'flex', alignItems: 'center', gap: 6, background: '#EEF1F8',
                  color: NAVY, border: `1px solid ${BORDER}`, padding: '8px 14px',
                  borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  tableCard:    { background: WHITE, border: `1px solid ${BORDER}`,
                  borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  tableHeader:  { padding: '14px 20px', borderBottom: `1px solid ${BORDER}`,
                  fontSize: 11, fontWeight: 700, color: NAVY,
                  textTransform: 'uppercase', letterSpacing: '1.5px' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  thead:        { backgroundColor: BG },
  th:           { padding: '10px 16px', textAlign: 'left', fontSize: 10,
                  fontWeight: 700, color: MUTED, textTransform: 'uppercase',
                  letterSpacing: '1.5px' },
  tr:           { borderBottom: `1px solid ${BG}` },
  td:           { padding: '12px 16px', fontSize: 13, verticalAlign: 'middle' },
  noteCard:     { background: WHITE, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '16px 20px' },
}

// ── Page principale ───────────────────────────
function CommandesPage() {
  const [commandes, setCommandes]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [detailId, setDetailId]     = useState(null)
  const [filtreStatut, setFiltreStatut] = useState('')

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const params = filtreStatut ? { statut: filtreStatut } : {}
      const res    = await commandeService.liste(params)
      setCommandes(res.data)
    } catch { }
    finally { setLoading(false) }
  }, [filtreStatut])

  useEffect(() => { charger() }, [charger])

  const apres = () => {
    setShowForm(false)
    charger()
  }

  if (detailId) return (
    <div style={pg.page}>
      <CommandeDetail
        commandeId={detailId}
        onRetour={() => setDetailId(null)}
        onRefresh={charger}
      />
    </div>
  )

  return (
    <div style={pg.page}>

      {/* Header */}
      <div style={pg.header}>
        <div>
          <p style={pg.eyebrow}>Achats</p>
          <h1 style={pg.title}>Commandes fournisseurs</h1>
          <div style={pg.underline} />
        </div>
        <button onClick={() => setShowForm(true)} style={pg.btnPrimary}>
          <Plus size={15} strokeWidth={2.5} />
          <span>Nouvelle commande</span>
        </button>
      </div>

      {/* Filtres statut */}
      <div style={pg.filtresRow}>
        {['', ...Object.keys(STATUT_CONFIG)].map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            style={{
              ...pg.filtreBtn,
              backgroundColor: filtreStatut === s ? NAVY  : WHITE,
              color:           filtreStatut === s ? WHITE : MUTED,
              borderColor:     filtreStatut === s ? NAVY  : BORDER,
            }}>
            {s ? STATUT_CONFIG[s].label : 'Toutes'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p style={pg.loading}>Chargement...</p>
      ) : commandes.length === 0 ? (
        <div style={pg.empty}>
          <Package size={32} color={MUTED} strokeWidth={1.3} />
          <p style={{ color: MUTED, margin: '12px 0 0' }}>
            Aucune commande.
          </p>
        </div>
      ) : (
        <div style={pg.tableCard}>
          <table style={pg.table}>
            <thead>
              <tr style={pg.thead}>
                {['#', 'Fournisseur', 'Statut', 'Lignes', 'Total estimé',
                  'Date prévue', ''].map(h => (
                  <th key={h} style={pg.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.map((c, i) => (
                <tr key={c.id} style={{
                  ...pg.tr,
                  background: i % 2 === 0 ? WHITE : '#FAFBFC',
                }}>
                  <td style={pg.td}>
                    <span style={{ fontWeight: 700, color: NAVY }}>#{c.id}</span>
                  </td>
                  <td style={pg.td}>{c.fournisseur_nom}</td>
                  <td style={pg.td}><BadgeStatut statut={c.statut} /></td>
                  <td style={pg.td}>{c.nb_lignes} article(s)</td>
                  <td style={pg.td}>
                    {c.total_estime
                      ? `${Number(c.total_estime).toLocaleString()} FCFA`
                      : '—'}
                  </td>
                  <td style={pg.td}>
                    {c.date_reception_prevue
                      ? new Date(c.date_reception_prevue).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td style={pg.td}>
                    <button
                      onClick={() => setDetailId(c.id)}
                      style={pg.btnVoir}
                    >
                      <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CommandeForm onClose={() => setShowForm(false)} onSave={apres} />
      )}
    </div>
  )
}

const pg = {
  page:      { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },
  header:    { display: 'flex', justifyContent: 'space-between',
               alignItems: 'flex-start', marginBottom: 20 },
  eyebrow:   { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px',
               textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:     { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0 },
  underline: { width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  filtresRow:{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  filtreBtn: { padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
               cursor: 'pointer', fontSize: 12, fontWeight: 600,
               transition: 'all 0.15s' },
  btnPrimary:{ display: 'flex', alignItems: 'center', gap: 6, background: NAVY,
               color: WHITE, border: 'none', padding: '10px 18px',
               borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  tableCard: { background: WHITE, border: `1px solid ${BORDER}`,
               borderRadius: 14, overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  thead:     { backgroundColor: BG },
  th:        { padding: '11px 16px', textAlign: 'left', fontSize: 10,
               fontWeight: 700, color: MUTED, textTransform: 'uppercase',
               letterSpacing: '1.5px' },
  tr:        { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:        { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },
  btnVoir:   { background: BG, border: 'none', padding: '6px 10px',
               borderRadius: 8, cursor: 'pointer', display: 'flex', color: NAVY },
  loading:   { color: MUTED, textAlign: 'center', padding: 60, fontSize: 13 },
  empty:     { textAlign: 'center', padding: 80, display: 'flex',
               flexDirection: 'column', alignItems: 'center' },
}

export default CommandesPage