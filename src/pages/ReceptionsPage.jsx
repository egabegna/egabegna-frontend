import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthContext } from '../store/AuthContext'
import receptionService from '../services/receptionService'
import fournisseurService from '../services/fournisseurService'
import produitService from '../services/produitService'
import StatutBadge from '../components/shared/StatutBadge'
import {
  Plus, X, PackageCheck, ChevronDown, ChevronUp,
  Truck, ClipboardList, ShieldCheck, Ban, Search,
  Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'

// ─── Select natif stylé ───────────────────────
function NativeSelect({ value, onChange, children, style = {} }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width:            '100%',
          padding:          '10px 32px 10px 12px',
          borderRadius:     9,
          border:           `1.5px solid ${BORDER}`,
          fontSize:         13,
          color:            NAVY,
          boxSizing:        'border-box',
          background:       WHITE,
          appearance:       'none',
          WebkitAppearance: 'none',
          outline:          'none',
          cursor:           'pointer',
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={13} color={MUTED} strokeWidth={2}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
    </div>
  )
}

// ─── Calendrier custom ────────────────────────
const JOURS_CAL   = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MOIS_FR_CAL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function CustomDatePicker({ value, onChange, placeholder = 'Filtrer par date' }) {
  const [open, setOpen]         = useState(false)
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date())
  const ref                     = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = value ? new Date(value) : null

  const handleSelect = (date) => {
    onChange(date.toISOString().split('T')[0])
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const firstDay    = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const lastDay     = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells       = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)

  const todayD     = new Date()
  const isToday    = d => d === todayD.getDate() && viewDate.getMonth() === todayD.getMonth() && viewDate.getFullYear() === todayD.getFullYear()
  const isSelected = d => selected && d === selected.getDate() && viewDate.getMonth() === selected.getMonth() && viewDate.getFullYear() === selected.getFullYear()

  const displayValue = selected
    ? selected.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ ...dp.trigger, borderColor: open ? NAVY : BORDER }}
      >
        <Calendar size={13} color={value ? NAVY : MUTED} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', color: value ? NAVY : MUTED, fontSize: 13, fontWeight: value ? 600 : 400 }}>
          {displayValue || placeholder}
        </span>
        {value && (
          <button onClick={handleClear} style={dp.clearBtn} type="button">
            <X size={11} color={MUTED} strokeWidth={2.5} />
          </button>
        )}
      </button>

      {open && (
        <div style={dp.calendar}>
          <div style={dp.calHeader}>
            <button onClick={prevMonth} style={dp.navBtn} type="button">
              <ChevronLeft size={14} color={NAVY} strokeWidth={2} />
            </button>
            <span style={dp.monthLabel}>
              {MOIS_FR_CAL[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button onClick={nextMonth} style={dp.navBtn} type="button">
              <ChevronRight size={14} color={NAVY} strokeWidth={2} />
            </button>
          </div>

          <div style={dp.weekRow}>
            {JOURS_CAL.map(j => <div key={j} style={dp.weekDay}>{j}</div>)}
          </div>

          <div style={dp.grid}>
            {cells.map((d, i) => (
              <div
                key={i}
                onClick={() => d && handleSelect(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
                style={{
                  ...dp.cell,
                  background:   d && isSelected(d) ? NAVY : d && isToday(d) ? '#EEF1F8' : 'transparent',
                  color:        d && isSelected(d) ? WHITE : d && isToday(d) ? NAVY : d ? '#374151' : 'transparent',
                  fontWeight:   d && (isSelected(d) || isToday(d)) ? 700 : 400,
                  cursor:       d ? 'pointer' : 'default',
                  borderRadius: 8,
                }}
                onMouseEnter={e => { if (d && !isSelected(d)) e.currentTarget.style.background = BG }}
                onMouseLeave={e => { if (d && !isSelected(d)) e.currentTarget.style.background = isToday(d) ? '#EEF1F8' : 'transparent' }}
              >
                {d || ''}
              </div>
            ))}
          </div>

          <div style={dp.footer}>
            <button onClick={() => handleSelect(todayD)} style={dp.todayBtn} type="button">
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const dp = {
  trigger: {
    display:      'flex',
    alignItems:   'center',
    gap:          8,
    padding:      '8px 14px',
    borderRadius: 9,
    border:       `1.5px solid ${BORDER}`,
    background:   WHITE,
    cursor:       'pointer',
    minWidth:     180,
    transition:   'border-color 0.15s',
    height:       '100%',
  },
  clearBtn: {
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    padding:    0,
    display:    'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  calendar: {
    position:     'absolute',
    top:          'calc(100% + 4px)',
    right:        0,
    background:   WHITE,
    border:       `1.5px solid ${BORDER}`,
    borderRadius: 14,
    boxShadow:    '0 12px 40px rgba(0,0,0,0.10)',
    zIndex:       30,
    padding:      14,
    width:        260,
  },
  calHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   10,
  },
  monthLabel: { fontSize: 13, fontWeight: 700, color: NAVY, letterSpacing: '0.3px' },
  navBtn: {
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    padding:        4,
    borderRadius:   6,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 },
  weekDay: { textAlign: 'center', fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.5px', padding: '4px 0', textTransform: 'uppercase' },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  cell:    { textAlign: 'center', fontSize: 12, padding: '6px 2px', transition: 'background 0.1s', userSelect: 'none' },
  footer:  { marginTop: 10, paddingTop: 8, borderTop: `1px solid ${BORDER}`, textAlign: 'center' },
  todayBtn:{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: GOLD, fontWeight: 700, padding: '4px 10px', borderRadius: 6 },
}

// ─── Page principale ──────────────────────────
function ReceptionsPage() {
  const { role }                          = useAuthContext()
  const [receptions, setReceptions]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [fournisseurs, setFournisseurs]   = useState([])
  const [produits, setProduits]           = useState([])
  const [categories, setCategories]       = useState([])
  const [selected, setSelected]           = useState(null)
  const [msg, setMsg]                     = useState({ type: '', text: '' })
  const [search, setSearch]               = useState('')
  const [dateFiltre, setDateFiltre]       = useState('')

  const [fournisseurId, setFournisseurId] = useState('')
  const [note, setNote]                   = useState('')
  const [lignes, setLignes]               = useState([{ produit_id: '', quantite: 1, prix_achat: '' }])
  const [submitting, setSubmitting]       = useState(false)
  const [formError, setFormError]         = useState('')

  const [showNewProduit, setShowNewProduit]   = useState(false)
  const [newProduit, setNewProduit]           = useState({ nom: '', prix_achat: '', categorie: '' })
  const [creatingProduit, setCreatingProduit] = useState(false)

  const canManage = ['proprietaire', 'manager'].includes(role)

  const charger = useCallback(async () => {
    try {
      const [rRes, fRes, pRes, catRes] = await Promise.all([
        receptionService.liste(),
        fournisseurService.liste({ actif: true }),
        produitService.getProduits({ actif: 'true' }),
        produitService.getCategories(),
      ])
      setReceptions(rRes.data.results || rRes.data)
      setFournisseurs(fRes.data)
      setProduits(pRes.data)
      setCategories(catRes.data)
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

  const resetForm = () => {
    setLignes([{ produit_id: '', quantite: 1, prix_achat: '' }])
    setFournisseurId('')
    setNote('')
    setFormError('')
    setShowNewProduit(false)
    setNewProduit({ nom: '', prix_achat: '', categorie: '' })
  }

  const ajouterLigne  = () => setLignes(p => [...p, { produit_id: '', quantite: 1, prix_achat: '' }])
  const modifierLigne = (i, field, val) => setLignes(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  const retirerLigne  = (i) => setLignes(p => p.filter((_, idx) => idx !== i))

  const handleCreateProduit = async () => {
    const nomP = newProduit.nom.trim()
    const prixAchat = newProduit.prix_achat
    if (!nomP || !prixAchat || Number(prixAchat) <= 0) return
    setCreatingProduit(true)
    try {
      const payload = {
        nom: nomP,
        prix_achat: Number(prixAchat),
        prix_vente: Math.round(Number(prixAchat) * 1.5),
        categorie: newProduit.categorie || null,
        stock: 0,
      }
      const res = await produitService.creerProduit(payload)
      const nouveau = res.data
      setProduits(prev => [...prev, nouveau])
      const idxVide = lignes.findIndex(l => !l.produit_id)
      if (idxVide >= 0) {
        modifierLigne(idxVide, 'produit_id', String(nouveau.id))
        modifierLigne(idxVide, 'prix_achat', prixAchat)
      } else {
        setLignes(prev => [...prev, { produit_id: String(nouveau.id), quantite: 1, prix_achat: prixAchat }])
      }
      setNewProduit({ nom: '', prix_achat: '', categorie: '' })
      setShowNewProduit(false)
      setMsg({ type: 'success', text: `Produit "${nouveau.nom}" créé.` })
    } catch (err) {
      const d = err.response?.data
      setMsg({ type: 'error', text: d?.detail || d?.nom?.[0] || 'Erreur création produit.' })
    } finally {
      setCreatingProduit(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const lignesValides = lignes.filter(l => l.produit_id && l.quantite > 0 && l.prix_achat)
    if (lignesValides.length === 0) { setFormError('Ajoutez au moins une ligne complète.'); return }
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
      setMsg({ type: 'success', text: 'Réception créée avec succès.' })
      setShowForm(false)
      resetForm()
      await charger()
    } catch (err) {
      const d = err.response?.data
      setFormError(Array.isArray(d?.detail) ? d.detail.join('\n') : d?.detail || 'Erreur.')
    } finally {
      setSubmitting(false) }
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

  const enAttente = receptions.filter(r => r.statut === 'en_attente')
  const validees  = receptions.filter(r => r.statut === 'validee')
  const annulees  = receptions.filter(r => r.statut === 'annulee')

  // Filtrage : texte + date
  const filtered = receptions.filter(r => {
    const q = search.toLowerCase()
    const matchTexte = (
      String(r.id).includes(q) ||
      r.fournisseur_nom?.toLowerCase().includes(q) ||
      r.employe_nom?.toLowerCase().includes(q) ||
      r.note?.toLowerCase().includes(q)
    )
    const matchDate = !dateFiltre || r.date?.startsWith(dateFiltre)
    return matchTexte && matchDate
  })

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Gestion</p>
          <h1 style={s.title}>Réceptions</h1>
          <div style={s.titleUnderline} />
        </div>
        {canManage && (
          <button
            onClick={() => { setShowForm(v => !v); resetForm(); setMsg({ type: '', text: '' }) }}
            style={showForm ? s.btnSecondary : s.btnPrimary}
          >
            {showForm
              ? <><X size={15} strokeWidth={2.5} /><span>Annuler</span></>
              : <><Plus size={15} strokeWidth={2.5} /><span>Nouvelle réception</span></>
            }
          </button>
        )}
      </div>

      {/* STATS */}
      <div style={s.statsRow}>
        {[
          { label: 'Total',      val: receptions.length, Icon: PackageCheck,  bg: '#EEF1F8', color: NAVY      },
          { label: 'En attente', val: enAttente.length,  Icon: ClipboardList, bg: '#FBF5E9', color: GOLD      },
          { label: 'Validées',   val: validees.length,   Icon: ShieldCheck,   bg: '#EBF5EF', color: GREEN     },
          { label: 'Annulées',   val: annulees.length,   Icon: Ban,           bg: '#FEF1F1', color: '#c0392b' },
        ].map(({ label, val, Icon, bg, color }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: bg }}>
              <Icon size={16} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={s.statVal}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MESSAGES */}
      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      {/* FORMULAIRE */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <span style={s.formTitle}>Nouvelle réception</span>
          </div>
          <div style={s.formDivider} />
          <form onSubmit={handleSubmit} noValidate>

            <div style={s.row}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Fournisseur (optionnel)</label>
                <NativeSelect value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}>
                  <option value="">— Sans fournisseur —</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </NativeSelect>
              </div>
              <div style={{ ...s.fieldGroup, flex: 2 }}>
                <label style={s.label}>Note</label>
                <input value={note} onChange={e => setNote(e.target.value)} style={{ ...s.input, width: '100%' }} />
              </div>
            </div>

            <div style={s.lignesHeader}>
              <label style={s.label}>Produits reçus</label>
              <button type="button" onClick={ajouterLigne} style={s.btnAdd}>
                <Plus size={12} strokeWidth={2.5} /><span>Ajouter une ligne</span>
              </button>
            </div>

            <div style={s.lignesContainer}>
              <div style={s.ligneRowHeader}>
                <span style={{ flex: 3, ...s.colLabel }}>Produit</span>
                <span style={{ width: 80, ...s.colLabel }}>Quantité</span>
                <span style={{ width: 130, ...s.colLabel }}>Prix achat (FCFA)</span>
                <span style={{ width: 32 }} />
              </div>

              {lignes.map((l, i) => (
                <div key={i} style={s.ligneRow}>
                  <NativeSelect
                    value={l.produit_id}
                    onChange={e => modifierLigne(i, 'produit_id', e.target.value)}
                    style={{ flex: 3 }}
                  >
                    <option value="">— Choisir un produit —</option>
                    {produits.map(p => (
                      <option key={p.id} value={p.id}>{p.nom} (stock : {p.stock})</option>
                    ))}
                  </NativeSelect>
                  <input
                    type="number" min="1" value={l.quantite}
                    onChange={e => modifierLigne(i, 'quantite', e.target.value)}
                    placeholder="1"
                    style={{ ...s.input, width: 80, textAlign: 'center' }}
                  />
                  <input
                    type="number" min="0" value={l.prix_achat}
                    onChange={e => modifierLigne(i, 'prix_achat', e.target.value)}
                    placeholder="0"
                    style={{ ...s.input, width: 130 }}
                  />
                  <button
                    type="button"
                    onClick={() => retirerLigne(i)}
                    disabled={lignes.length === 1}
                    style={{ ...s.btnRemove, opacity: lignes.length === 1 ? 0.3 : 1, cursor: lignes.length === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              {!showNewProduit ? (
                <button
                  type="button"
                  onClick={() => setShowNewProduit(true)}
                  style={{ ...s.btnAdd, background: '#EEF1F8', color: NAVY, border: `1px solid ${BORDER}`, marginTop: 8, width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={12} strokeWidth={2} />
                  <span>Nouveau produit</span>
                </button>
              ) : (
                <div style={s.newProduitBox}>
                  <input
                    placeholder="Nom du produit *"
                    value={newProduit.nom}
                    onChange={e => setNewProduit(p => ({ ...p, nom: e.target.value }))}
                    style={{ ...s.input, fontSize: 12, width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number" placeholder="Prix achat *"
                      value={newProduit.prix_achat}
                      onChange={e => setNewProduit(p => ({ ...p, prix_achat: e.target.value }))}
                      style={{ ...s.input, fontSize: 12, flex: 1 }}
                    />
                    <NativeSelect
                      value={newProduit.categorie}
                      onChange={e => setNewProduit(p => ({ ...p, categorie: e.target.value }))}
                      style={{ flex: 1 }}
                    >
                      <option value="">— Catégorie —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </NativeSelect>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={handleCreateProduit}
                      disabled={creatingProduit || !newProduit.nom.trim() || !newProduit.prix_achat}
                      style={{ ...s.btnPrimary, fontSize: 11, padding: '6px 12px', opacity: creatingProduit || !newProduit.nom.trim() || !newProduit.prix_achat ? 0.5 : 1 }}
                    >
                      {creatingProduit ? '...' : 'Créer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewProduit(false); setNewProduit({ nom: '', prix_achat: '', categorie: '' }) }}
                      style={{ ...s.btnSecondary, fontSize: 11, padding: '6px 12px' }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <div style={{ color: '#c0392b', fontSize: 12, marginTop: 10, padding: '8px 12px', background: '#FEF1F1', borderRadius: 8, border: '1px solid #FBBCBC' }}>
                {formError}
              </div>
            )}

            <div style={s.formActions}>
              <button
                type="submit"
                disabled={submitting}
                style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Création en cours...' : 'Créer la réception'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTE */}
      <div style={s.tableCard}>
        <div style={s.tableToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            {/* Barre de recherche */}
            <div style={s.searchWrap}>
              <Search size={14} color={MUTED} strokeWidth={1.8} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par ID, fournisseur, employé..."
                style={s.searchInput}
              />
              {search && (
                <button onClick={() => setSearch('')} style={s.clearBtn}>
                  <X size={13} color={MUTED} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Calendrier filtre date */}
            <CustomDatePicker
              value={dateFiltre}
              onChange={setDateFiltre}
              placeholder="Filtrer par date"
            />
          </div>

          <span style={{ ...s.resultCount, marginLeft: 16, flexShrink: 0 }}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p style={s.loading}>Chargement...</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <PackageCheck size={28} color={MUTED} strokeWidth={1.3} />
            <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
              {search || dateFiltre ? 'Aucun résultat pour ces critères.' : 'Aucune réception enregistrée.'}
            </p>
          </div>
        ) : (
          <div style={s.liste}>
            {filtered.map(r => {
              const isOpen = selected?.id === r.id
              return (
                <div key={r.id} style={s.receptionCard} onClick={() => setSelected(r === selected ? null : r)}>
                  <div style={s.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        ...s.idBadge,
                        background: r.statut === 'validee' ? '#EBF5EF' : r.statut === 'annulee' ? '#FEF1F1' : '#FBF5E9',
                        color:      r.statut === 'validee' ? GREEN : r.statut === 'annulee' ? '#c0392b' : GOLD,
                      }}>
                        {r.numero_boutique || r.id}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>
                          {r.fournisseur_nom && r.fournisseur_nom !== '—' ? r.fournisseur_nom : 'Sans fournisseur'}
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, marginTop: 2, display: 'flex', gap: 8 }}>
                          <span>{r.employe_nom}</span>
                          <span>·</span>
                          <span>{new Date(r.date).toLocaleString('fr-FR')}</span>
                          <span>·</span>
                          <span>{r.lignes?.length || 0} produit{(r.lignes?.length || 0) > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: NAVY, fontSize: 14 }}>
                        {Number(r.total).toLocaleString()} FCFA
                      </span>
                      <StatutBadge statut={r.statut} />
                      {isOpen
                        ? <ChevronUp size={15} color={MUTED} strokeWidth={2} />
                        : <ChevronDown size={15} color={MUTED} strokeWidth={2} />
                      }
                    </div>
                  </div>

                  {isOpen && (
                    <div style={s.detail} onClick={e => e.stopPropagation()}>
                      <table style={s.detailTable}>
                        <thead>
                          <tr>
                            {['Produit', 'Quantité', 'Prix achat', 'Sous-total'].map(h => (
                              <th key={h} style={s.dth}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.lignes?.map(l => (
                            <tr key={l.id} style={{ borderBottom: `1px solid ${BG}` }}>
                              <td style={s.dtd}><span style={{ fontWeight: 600, color: NAVY }}>{l.produit_nom}</span></td>
                              <td style={s.dtd}>{l.quantite}</td>
                              <td style={s.dtd}>{Number(l.prix_achat).toLocaleString()} FCFA</td>
                              <td style={s.dtd}><span style={{ fontWeight: 700, color: GREEN }}>{Number(l.sous_total).toLocaleString()} FCFA</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {r.statut === 'en_attente' && canManage && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          <button onClick={() => handleAction(r.id, 'valider')} style={s.btnValider}>
                            <ShieldCheck size={13} strokeWidth={2} />
                            <span>Valider (augmente le stock)</span>
                          </button>
                          <button onClick={() => handleAction(r.id, 'annuler')} style={s.btnAnnuler}>
                            <Ban size={13} strokeWidth={2} />
                            <span>Annuler</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page:          { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  btnPrimary:    { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:  { display: 'flex', alignItems: 'center', gap: 8, background: BG, color: NAVY, border: 'none', padding: '11px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  statsRow:      { display: 'flex', gap: 12, marginBottom: 24 },
  statCard:      { display: 'flex', alignItems: 'center', gap: 12, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', flex: 1 },
  statIcon:      { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:       { fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statLabel:     { fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 },
  alertSuccess:  { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500 },
  alertError:    { background: '#FEF1F1', border: '1px solid #FBBCBC', color: '#c0392b', borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13 },
  formCard:      { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 },
  formHeader:    { marginBottom: 14 },
  formTitle:     { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  formDivider:   { height: 1, background: BORDER, marginBottom: 18 },
  formActions:   { marginTop: 16 },
  row:           { display: 'flex', gap: 12 },
  fieldGroup:    { marginBottom: 16, flex: 1 },
  label:         { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:         { padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE },
  lignesHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lignesContainer:{ background: BG, borderRadius: 10, padding: '12px 14px', marginBottom: 4 },
  ligneRowHeader:{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` },
  colLabel:      { fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px' },
  ligneRow:      { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  btnAdd:        { display: 'flex', alignItems: 'center', gap: 6, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5`, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 },
  btnRemove:     { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF1F1', color: '#c0392b', border: 'none', padding: '8px', borderRadius: 8, width: 32, height: 32, flexShrink: 0 },
  newProduitBox: { background: WHITE, borderRadius: 8, padding: 10, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, border: `1.5px solid ${BORDER}` },
  tableCard:     { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' },
  tableToolbar:  { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, gap: 10 },
  searchWrap:    { display: 'flex', alignItems: 'center', gap: 8, background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '8px 14px', flex: 1 },
  searchInput:   { border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', flex: 1 },
  clearBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  resultCount:   { fontSize: 12, color: MUTED, fontWeight: 500 },
  liste:         { display: 'flex', flexDirection: 'column' },
  receptionCard: { padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 0.1s' },
  cardHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  idBadge:       { padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, flexShrink: 0 },
  detail:        { marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` },
  detailTable:   { width: '100%', borderCollapse: 'collapse', marginBottom: 8 },
  dth:           { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG },
  dtd:           { padding: '10px 12px', fontSize: 13, verticalAlign: 'middle' },
  btnValider:    { display: 'flex', alignItems: 'center', gap: 6, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5`, padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  btnAnnuler:    { display: 'flex', alignItems: 'center', gap: 6, background: '#FEF1F1', color: '#c0392b', border: '1px solid #FBBCBC', padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  loading:       { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:         { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default ReceptionsPage