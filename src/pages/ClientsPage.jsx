import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import clientService from '../services/clientService'
import {
  Plus, X, Search, ChevronRight,
  ShoppingBag, Star, Phone, Mail,
  ArrowLeft, CreditCard,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

// ── Badge fidèle ──────────────────────────────
function BadgeFidele({ fidele }) {
  if (!fidele) return null
  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      gap:             4,
      backgroundColor: '#FBF5E9',
      color:           GOLD,
      fontSize:        11,
      fontWeight:      700,
      padding:         '2px 8px',
      borderRadius:    20,
      border:          `1px solid ${GOLD}30`,
    }}>
      <Star size={9} strokeWidth={2.5} fill={GOLD} />
      Fidèle
    </span>
  )
}

// ── Formulaire client ─────────────────────────
function ClientForm({ client, onClose, onSave }) {
  const isEdit = !!client
  const [form, setForm] = useState({
    nom:       client?.nom       || '',
    telephone: client?.telephone || '',
    email:     client?.email     || '',
    adresse:   client?.adresse   || '',
    note:      client?.note      || '',
  })
  const [errors, setErrors]         = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) { setErrors({ nom: 'Nom requis.' }); return }
    setSubmitting(true)
    try {
      if (isEdit) await clientService.modifier(client.id, form)
      else        await clientService.creer(form)
      onSave()
    } catch (err) {
      const d = err.response?.data || {}
      const errs = {}
      Object.keys(d).forEach(k => { errs[k] = Array.isArray(d[k]) ? d[k][0] : d[k] })
      setErrors(errs)
    } finally { setSubmitting(false) }
  }

  return (
    <div style={fo.overlay} onClick={onClose}>
      <div style={fo.modal} onClick={e => e.stopPropagation()}>
        <div style={fo.header}>
          <h2 style={fo.title}>{isEdit ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button onClick={onClose} style={fo.closeBtn}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={fo.body}>
          <CField label="Nom *"       name="nom"       value={form.nom}       onChange={handleChange} error={errors.nom} />
          <CField label="Téléphone"   name="telephone" value={form.telephone} onChange={handleChange} error={errors.telephone} />
          <CField label="Email"       name="email"     value={form.email}     onChange={handleChange} type="email" />
          <CField label="Adresse"     name="adresse"   value={form.adresse}   onChange={handleChange} />
          <CField label="Note"        name="note"      value={form.note}      onChange={handleChange} type="textarea" />
          {errors.non_field_errors && (
            <p style={{ color: RED, fontSize: 13 }}>{errors.non_field_errors}</p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={fo.btnSecondary}>Annuler</button>
            <button type="submit" disabled={submitting} style={fo.btnPrimary}>
              {submitting ? '...' : isEdit ? 'Enregistrer' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CField({ label, name, type = 'text', value, onChange, error }) {
  return (
    <div style={fo.fieldGroup}>
      <label style={fo.label}>{label}</label>
      {type === 'textarea'
        ? <textarea name={name} value={value} onChange={onChange}
            rows={2} style={fo.input} />
        : <input name={name} type={type} value={value} onChange={onChange}
            style={{ ...fo.input, borderColor: error ? RED : BORDER }} />
      }
      {error && <span style={{ color: RED, fontSize: 12 }}>{error}</span>}
    </div>
  )
}

const fo = {
  overlay:    { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 50, padding: 16 },
  modal:      { backgroundColor: WHITE, borderRadius: 14, width: '100%',
                maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 24px', borderBottom: `1px solid ${BORDER}` },
  title:      { fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 },
  closeBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: MUTED },
  body:       { padding: 24 },
  fieldGroup: { marginBottom: 14 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
                letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:      { width: '100%', padding: '10px 12px', borderRadius: 9,
                border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
                boxSizing: 'border-box', outline: 'none', background: WHITE,
                resize: 'vertical' },
  btnPrimary:  { display: 'flex', alignItems: 'center', gap: 6, background: NAVY,
                 color: WHITE, border: 'none', padding: '10px 18px',
                 borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ display: 'flex', alignItems: 'center', gap: 6, background: BG,
                 color: NAVY, border: 'none', padding: '10px 16px',
                 borderRadius: 9, fontSize: 13, cursor: 'pointer' },
}

// ── Fiche client ──────────────────────────────
function FicheClient({ clientId, onRetour, onEdit }) {
  const [data, setData]       = useState(null)
  const [creances, setCreances] = useState([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet]   = useState('historique')

  useEffect(() => {
    Promise.all([
      clientService.historique(clientId),
      clientService.creances(clientId),
    ]).then(([hRes, cRes]) => {
      setData(hRes.data)
      setCreances(cRes.data.creances || [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <p style={{ color: MUTED, padding: 40, textAlign: 'center' }}>Chargement...</p>
  if (!data)   return null

  const client = data.client

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onRetour} style={cs.btnRetour}>
          <ArrowLeft size={13} strokeWidth={2} />
          Clients
        </button>
        <span style={{ color: MUTED }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{client.nom}</span>
      </div>

      {/* Header fiche */}
      <div style={cs.ficheHeader}>
        <div style={cs.ficheAvatar}>
          {client.nom.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: 0 }}>
              {client.nom}
            </h2>
            <BadgeFidele fidele={client.est_client_fidele} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            {client.telephone && (
              <span style={cs.contactItem}>
                <Phone size={11} strokeWidth={2} />
                {client.telephone}
              </span>
            )}
            {client.email && (
              <span style={cs.contactItem}>
                <Mail size={11} strokeWidth={2} />
                {client.email}
              </span>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div style={cs.ficheKpis}>
          <div style={cs.kpi}>
            <div style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>
              {client.nb_achats}
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>Achats</div>
          </div>
          <div style={cs.kpi}>
            <div style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>
              {Number(client.total_depense).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>FCFA dépensés</div>
          </div>
          <div style={cs.kpi}>
            <div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>
              {client.panier_moyen?.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>Panier moyen</div>
          </div>
        </div>

        <button onClick={onEdit} style={cs.btnEdit}>Modifier</button>
      </div>

      {/* Onglets */}
      <div style={cs.tabs}>
        {[
          ['historique', `Achats (${data.nb_ventes})`],
          ['creances',   `Créances (${creances.length})`],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setOnglet(k)}
            style={{
              ...cs.tab,
              color:       onglet === k ? NAVY  : MUTED,
              borderBottom: onglet === k
                ? `2.5px solid ${GOLD}`
                : '2.5px solid transparent',
              fontWeight: onglet === k ? 700 : 400,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Historique */}
      {onglet === 'historique' && (
        <div style={cs.liste}>
          {data.ventes.length === 0 ? (
            <div style={cs.empty}>
              <ShoppingBag size={28} color={MUTED} strokeWidth={1.3} />
              <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
                Aucun achat enregistré.
              </p>
            </div>
          ) : data.ventes.map(v => (
            <div key={v.id} style={cs.venteRow}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: NAVY }}>
                  Vente #{v.id}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                  {new Date(v.date).toLocaleString('fr-FR')}
                  · {v.nb_articles} article(s) · {v.mode_paiement}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: NAVY }}>
                {Number(v.total).toLocaleString()} FCFA
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Créances */}
      {onglet === 'creances' && (
        <div style={cs.liste}>
          {creances.length === 0 ? (
            <div style={cs.empty}>
              <CreditCard size={28} color={MUTED} strokeWidth={1.3} />
              <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
                Aucune créance ouverte.
              </p>
            </div>
          ) : creances.map(c => {
            const restant = Number(c.montant_restant)
            const pct     = Math.min(100, (Number(c.montant_paye) / Number(c.montant_total)) * 100)
            return (
              <div key={c.id} style={cs.creanceRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: NAVY }}>
                      {Number(c.montant_total).toLocaleString()} FCFA
                    </span>
                    <span style={{ fontWeight: 700, color: RED }}>
                      {restant.toLocaleString()} FCFA restant
                    </span>
                  </div>
                  <div style={cs.progressTrack}>
                    <div style={{ ...cs.progressFill, width: `${pct}%` }} />
                  </div>
                  {c.date_echeance && (
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
                      Échéance : {new Date(c.date_echeance).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────
function ClientsPage() {
  const { role }                    = useAuthContext()
  const [clients, setClients]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [ficheId, setFicheId]       = useState(null)
  const [msg, setMsg]               = useState({ type: '', text: '' })

  const canEdit = ['proprietaire', 'manager'].includes(role)

  const charger = useCallback(async () => {
    try {
      const params = search ? { search } : {}
      const res    = await clientService.liste(params)
      setClients(res.data.results || res.data)
    } catch { }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { charger() }, [charger])

  const apres = () => {
    setShowForm(false)
    setEditClient(null)
    charger()
  }

  // Vue fiche
  if (ficheId) return (
    <div style={cs.page}>
      <FicheClient
        clientId={ficheId}
        onRetour={() => setFicheId(null)}
        onEdit={() => {
          const c = clients.find(cl => cl.id === ficheId)
          setEditClient(c)
          setShowForm(true)
        }}
      />
      {showForm && editClient && (
        <ClientForm client={editClient} onClose={() => setShowForm(false)} onSave={apres} />
      )}
    </div>
  )

  return (
    <div style={cs.page}>

      {/* Header */}
      <div style={cs.header}>
        <div>
          <p style={cs.eyebrow}>Gestion</p>
          <h1 style={cs.title}>Clients</h1>
          <div style={cs.underline} />
        </div>
        {canEdit && (
          <button onClick={() => { setEditClient(null); setShowForm(true) }}
            style={cs.btnPrimary}>
            <Plus size={15} strokeWidth={2.5} />
            <span>Nouveau client</span>
          </button>
        )}
      </div>

      {/* Recherche */}
      <div style={cs.searchRow}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} color={MUTED} strokeWidth={1.8}
            style={{ position: 'absolute', left: 12, top: '50%',
                     transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou téléphone..."
            style={{ ...cs.searchInput, paddingLeft: 36 }}
          />
        </div>
        <span style={{ fontSize: 12, color: MUTED }}>
          {clients.length} client(s)
        </span>
      </div>

      {/* Liste */}
      {loading ? (
        <p style={cs.loading}>Chargement...</p>
      ) : clients.length === 0 ? (
        <div style={cs.emptyPage}>
          <ShoppingBag size={32} color={MUTED} strokeWidth={1.3} />
          <p style={{ margin: '12px 0 0', color: MUTED }}>Aucun client.</p>
        </div>
      ) : (
        <div style={cs.tableCard}>
          <table style={cs.table}>
            <thead>
              <tr style={cs.thead}>
                {['Client', 'Téléphone', 'Nb achats', 'Total dépensé', 'Fidélité', ''].map(h => (
                  <th key={h} style={cs.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} style={cs.tr}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF1F8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}>
                  <td style={cs.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={cs.avatar}>
                        {c.nom.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: NAVY }}>{c.nom}</div>
                        {c.email && <div style={{ fontSize: 11, color: MUTED }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={cs.td}>{c.telephone || '—'}</td>
                  <td style={cs.td}>
                    <span style={{ fontWeight: 700, color: NAVY }}>{c.nb_achats}</span>
                  </td>
                  <td style={cs.td}>
                    <span style={{ fontWeight: 700, color: GREEN }}>
                      {Number(c.total_depense).toLocaleString()} FCFA
                    </span>
                  </td>
                  <td style={cs.td}>
                    <BadgeFidele fidele={c.est_client_fidele} />
                  </td>
                  <td style={cs.td}>
                    <button onClick={() => setFicheId(c.id)} style={cs.btnVoir}>
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
        <ClientForm
          client={editClient}
          onClose={() => { setShowForm(false); setEditClient(null) }}
          onSave={apres}
        />
      )}
    </div>
  )
}

const cs = {
  page:    { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between',
             alignItems: 'flex-start', marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px',
             textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:   { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0 },
  underline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  searchRow:{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 },
  searchInput: { width: '100%', padding: '9px 12px', borderRadius: 9,
                 border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
                 boxSizing: 'border-box', outline: 'none', background: WHITE },
  btnPrimary:{ display: 'flex', alignItems: 'center', gap: 6, background: NAVY,
               color: WHITE, border: 'none', padding: '10px 18px',
               borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  tableCard: { background: WHITE, border: `1px solid ${BORDER}`,
               borderRadius: 14, overflow: 'hidden' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  thead:   { backgroundColor: BG },
  th:      { padding: '11px 16px', textAlign: 'left', fontSize: 10,
             fontWeight: 700, color: MUTED, textTransform: 'uppercase',
             letterSpacing: '1.5px' },
  tr:      { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:      { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },
  avatar:  { width: 34, height: 34, borderRadius: '50%', background: '#EEF1F8',
             color: NAVY, display: 'flex', alignItems: 'center',
             justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  btnVoir: { background: BG, border: 'none', padding: '6px 10px',
             borderRadius: 8, cursor: 'pointer', display: 'flex', color: NAVY },
  loading: { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  emptyPage:{ textAlign: 'center', padding: 80, display: 'flex',
              flexDirection: 'column', alignItems: 'center' },
  // Fiche
  ficheHeader: { display: 'flex', gap: 20, alignItems: 'flex-start',
                 backgroundColor: WHITE, border: `1px solid ${BORDER}`,
                 borderRadius: 14, padding: '20px 24px', marginBottom: 20,
                 flexWrap: 'wrap' },
  ficheAvatar: { width: 56, height: 56, borderRadius: '50%', background: '#EEF1F8',
                 color: NAVY, display: 'flex', alignItems: 'center',
                 justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 },
  contactItem: { display: 'flex', alignItems: 'center', gap: 5,
                 fontSize: 12, color: MUTED },
  ficheKpis:   { display: 'flex', gap: 24, flexWrap: 'wrap' },
  kpi:         { textAlign: 'center' },
  btnEdit:     { background: BG, color: NAVY, border: `1px solid ${BORDER}`,
                 padding: '8px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12 },
  btnRetour:   { display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                 border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13,
                 padding: '4px 8px', borderRadius: 6 },
  tabs:        { display: 'flex', borderBottom: `1.5px solid ${BORDER}`, marginBottom: 20 },
  tab:         { background: 'none', border: 'none', padding: '10px 18px',
                 cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
                 borderBottom: '2.5px solid transparent' },
  liste:       { display: 'flex', flexDirection: 'column', gap: 8 },
  venteRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                 padding: '12px 0', borderBottom: `1px solid ${BG}` },
  creanceRow:  { padding: '12px 0', borderBottom: `1px solid ${BG}` },
  progressTrack:{ height: 5, background: BG, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', background: GREEN, borderRadius: 3 },
  empty:       { textAlign: 'center', padding: 48, display: 'flex',
                 flexDirection: 'column', alignItems: 'center' },
}

export default ClientsPage