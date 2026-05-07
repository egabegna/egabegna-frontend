import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import rapportService from '../services/rapportService'
import { default as financeApi } from '../services/financeService'

// src/services/financeService.js à créer :
// import api from './api'
// export default {
//   depenses: { liste: (p)=>api.get('/api/depenses/',{params:p}), creer:(d)=>api.post('/api/depenses/',d), supprimer:(id)=>api.delete(`/api/depenses/${id}/`) },
//   creances: { liste: (p)=>api.get('/api/creances/',{params:p}), creer:(d)=>api.post('/api/creances/',d), paiement:(id,d)=>api.post(`/api/creances/${id}/paiement/`,d) },
// }

function PeriodePicker({ value, onChange }) {
  const presets = [
    { label: "Aujourd'hui",  days: 0 },
    { label: '7 jours',      days: 7 },
    { label: '30 jours',     days: 30 },
    { label: '3 mois',       days: 90 },
  ]

  const appliquer = (days) => {
    const fin   = new Date()
    const debut = new Date()
    debut.setDate(fin.getDate() - days)
    const fmt = d => d.toISOString().split('T')[0]
    onChange({ date_debut: fmt(debut), date_fin: fmt(fin) })
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {presets.map(p => (
        <button key={p.label} onClick={() => appliquer(p.days)}
          style={fs.btnPreset}>
          {p.label}
        </button>
      ))}
      <input type="date" value={value.date_debut}
        onChange={e => onChange({ ...value, date_debut: e.target.value })}
        style={fs.dateInput} />
      <input type="date" value={value.date_fin}
        onChange={e => onChange({ ...value, date_fin: e.target.value })}
        style={fs.dateInput} />
    </div>
  )
}

function FinancesPage() {
  const today   = new Date().toISOString().split('T')[0]
  const il30j   = new Date(); il30j.setDate(il30j.getDate() - 30)
  const debut30 = il30j.toISOString().split('T')[0]

  const [periode, setPeriode]       = useState({ date_debut: debut30, date_fin: today })
  const [dashboard, setDashboard]   = useState(null)
  const [depenses, setDepenses]     = useState([])
  const [creances, setCreances]     = useState([])
  const [onglet, setOnglet]         = useState('kpis') // kpis | depenses | creances
  const [loading, setLoading]       = useState(true)
  const [msg, setMsg]               = useState({ type: '', text: '' })

  // Formulaire dépense
  const DEPENSE_INIT = { type: 'autre', montant: '', description: '', date: today }
  const [showDepForm, setShowDepForm] = useState(false)
  const [depForm, setDepForm]         = useState(DEPENSE_INIT)
  const [depSubmitting, setDepSubmitting] = useState(false)

  // Formulaire créance
  const CREANCE_INIT = { nom_client: '', telephone_client: '', montant_total: '', montant_paye: '0', date_echeance: '', note: '' }
  const [showCreForm, setShowCreForm] = useState(false)
  const [creForm, setCreForm]         = useState(CREANCE_INIT)
  const [creSubmitting, setCreSubmitting] = useState(false)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, depRes, creRes] = await Promise.all([
        rapportService.dashboard(periode),
        fetch(`/api/depenses/?date_debut=${periode.date_debut}&date_fin=${periode.date_fin}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
        ).then(r => r.json()),
        fetch(`/api/creances/`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
        ).then(r => r.json()),
      ])
      setDashboard(dRes.data)
      setDepenses(depRes.results || depRes)
      setCreances(creRes.results || creRes)
    } catch { }
    finally { setLoading(false) }
  }, [periode])

  useEffect(() => { charger() }, [charger])

  const handleDepSubmit = async e => {
    e.preventDefault()
    setDepSubmitting(true)
    try {
      await fetch('/api/depenses/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json',
                   Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ ...depForm, montant: Number(depForm.montant) }),
      })
      setMsg({ type: 'success', text: 'Dépense ajoutée.' })
      setShowDepForm(false)
      setDepForm(DEPENSE_INIT)
      await charger()
    } catch { setMsg({ type: 'error', text: 'Erreur.' }) }
    finally { setDepSubmitting(false) }
  }

  const handlePaiement = async (creance, montant) => {
    try {
      await fetch(`/api/creances/${creance.id}/paiement/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json',
                   Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ montant: Number(montant) }),
      })
      setMsg({ type: 'success', text: 'Paiement enregistré.' })
      await charger()
    } catch (err) {
      setMsg({ type: 'error', text: 'Erreur paiement.' })
    }
  }

  const ca       = Number(dashboard?.chiffre_affaires?.total || 0)
  const benefice = Number(dashboard?.benefice_brut || 0)
  const depTotal = Number(dashboard?.depenses?.total || 0)
  const creTotal = Number(dashboard?.creances?.total_restant || 0)
  const resultat = Number(dashboard?.resultat_net || 0)

  return (
    <div style={fs.page}>
      <div style={fs.header}>
        <h1 style={fs.title}>Finances</h1>
        <PeriodePicker value={periode} onChange={setPeriode} />
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? fs.alertSuccess : fs.alertError}>
          {msg.text}
        </div>
      )}

      {/* Onglets */}
      <div style={fs.tabs}>
        {[['kpis', '📊 Aperçu'], ['depenses', '💸 Dépenses'], ['creances', '📋 Créances']].map(([k, label]) => (
          <button key={k} onClick={() => setOnglet(k)}
            style={{ ...fs.tab, borderBottom: onglet === k ? '3px solid #111827' : '3px solid transparent',
                     fontWeight: onglet === k ? 700 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {onglet === 'kpis' && (
        <div>
          <div style={fs.kpiGrid}>
            {[
              { label: "Chiffre d'affaires", val: ca,       color: '#2563eb', icon: '💰' },
              { label: 'Bénéfice brut',      val: benefice, color: '#16a34a', icon: '📈' },
              { label: 'Dépenses',           val: depTotal, color: '#d97706', icon: '💸' },
              { label: 'Créances restantes', val: creTotal, color: '#7c3aed', icon: '📋' },
              { label: 'Résultat net',       val: resultat, color: resultat >= 0 ? '#16a34a' : '#dc2626', icon: '🏦' },
            ].map(k => (
              <div key={k.label} style={fs.kpiCard}>
                <div style={fs.kpiIcon}>{k.icon}</div>
                <div style={{ ...fs.kpiVal, color: k.color }}>
                  {k.val.toLocaleString()} FCFA
                </div>
                <div style={fs.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Dépenses par type */}
          {dashboard?.depenses?.par_type?.length > 0 && (
            <div style={fs.card}>
              <div style={fs.cardTitle}>Répartition des dépenses</div>
              {dashboard.depenses.par_type.map(d => {
                const pct = depTotal > 0 ? (Number(d.total) / depTotal * 100).toFixed(1) : 0
                return (
                  <div key={d.type} style={fs.depRow}>
                    <span style={{ fontSize: 14, width: 120 }}>{d.type}</span>
                    <div style={fs.depBar}>
                      <div style={{ ...fs.depBarFill, width: `${pct}%` }} />
                    </div>
                    <span style={fs.depPct}>{pct}%</span>
                    <span style={fs.depVal}>{Number(d.total).toLocaleString()} FCFA</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Dépenses */}
      {onglet === 'depenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => setShowDepForm(v => !v)} style={fs.btnPrimary}>
              {showDepForm ? 'Annuler' : '+ Ajouter dépense'}
            </button>
          </div>

          {showDepForm && (
            <div style={fs.formCard}>
              <form onSubmit={handleDepSubmit}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={fs.label}>Type</label>
                    <select value={depForm.type}
                      onChange={e => setDepForm(p => ({ ...p, type: e.target.value }))}
                      style={fs.select}>
                      {['loyer','salaire','transport','electricite','eau','telephone','maintenance','autre']
                        .map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fs.label}>Montant (FCFA)</label>
                    <input type="number" value={depForm.montant}
                      onChange={e => setDepForm(p => ({ ...p, montant: e.target.value }))}
                      style={fs.input} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fs.label}>Date</label>
                    <input type="date" value={depForm.date}
                      onChange={e => setDepForm(p => ({ ...p, date: e.target.value }))}
                      style={fs.input} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={fs.label}>Description</label>
                    <input value={depForm.description}
                      onChange={e => setDepForm(p => ({ ...p, description: e.target.value }))}
                      style={fs.input} placeholder="Optionnel" />
                  </div>
                </div>
                <button type="submit" disabled={depSubmitting}
                  style={{ ...fs.btnPrimary, marginTop: 12 }}>
                  {depSubmitting ? '...' : 'Enregistrer'}
                </button>
              </form>
            </div>
          )}

          <div style={fs.tableWrapper}>
            <table style={fs.table}>
              <thead><tr style={fs.thead}>
                {['Date','Type','Description','Montant'].map(h => (
                  <th key={h} style={fs.th}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {depenses.map(d => (
                  <tr key={d.id} style={fs.tr}>
                    <td style={fs.td}>{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                    <td style={fs.td}><span style={fs.typeBadge}>{d.type}</span></td>
                    <td style={fs.td}>{d.description || '—'}</td>
                    <td style={fs.td}>
                      <span style={{ fontWeight: 700, color: '#d97706' }}>
                        {Number(d.montant).toLocaleString()} FCFA
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {depenses.length === 0 && <p style={fs.empty}>Aucune dépense.</p>}
          </div>
        </div>
      )}

      {/* Créances */}
      {onglet === 'creances' && (
        <div style={fs.liste}>
          {creances.map(c => (
            <CreanceCard key={c.id} creance={c} onPaiement={handlePaiement} />
          ))}
          {creances.length === 0 && <p style={fs.empty}>Aucune créance.</p>}
        </div>
      )}
    </div>
  )
}

function CreanceCard({ creance, onPaiement }) {
  const [montantPaiement, setMontantPaiement] = useState('')
  const [showPaiement, setShowPaiement]       = useState(false)
  const restant = Number(creance.montant_restant)
  const pct     = Math.min(100, (Number(creance.montant_paye) / Number(creance.montant_total)) * 100)

  const STATUT_COLORS = {
    en_cours:                   { bg: '#dbeafe', color: '#1e40af' },
    partiellement_remboursee:   { bg: '#fef3c7', color: '#92400e' },
    remboursee:                 { bg: '#dcfce7', color: '#166534' },
    perdue:                     { bg: '#fee2e2', color: '#991b1b' },
  }
  const sc = STATUT_COLORS[creance.statut] || {}

  return (
    <div style={fs.creanceCard}>
      <div style={fs.creanceHeader}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{creance.nom_client}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {creance.telephone_client || ''}
            {creance.date_echeance && ` · Échéance: ${new Date(creance.date_echeance).toLocaleDateString('fr-FR')}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ ...fs.statutBadge, backgroundColor: sc.bg, color: sc.color }}>
            {creance.statut.replace(/_/g, ' ')}
          </span>
          <div style={{ fontWeight: 700, marginTop: 4 }}>
            Restant : {restant.toLocaleString()} FCFA
          </div>
        </div>
      </div>

      {/* Barre progression */}
      <div style={fs.progressBar}>
        <div style={{ ...fs.progressFill, width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
        <span>Payé : {Number(creance.montant_paye).toLocaleString()} FCFA</span>
        <span>Total : {Number(creance.montant_total).toLocaleString()} FCFA</span>
      </div>

      {creance.statut !== 'remboursee' && creance.statut !== 'perdue' && (
        <div style={{ marginTop: 10 }}>
          {!showPaiement ? (
            <button onClick={() => setShowPaiement(true)} style={fs.btnPaiement}>
              + Enregistrer paiement
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="number" value={montantPaiement}
                onChange={e => setMontantPaiement(e.target.value)}
                placeholder={`Max: ${restant.toLocaleString()} FCFA`}
                style={{ ...fs.input, flex: 1, fontSize: 13 }} />
              <button onClick={() => {
                onPaiement(creance, montantPaiement)
                setShowPaiement(false)
                setMontantPaiement('')
              }} style={fs.btnPrimary}>OK</button>
              <button onClick={() => setShowPaiement(false)}
                style={fs.btnSecondary}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const fs = {
  page:    { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  tabs:    { display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 24 },
  tab:     { background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer', fontSize: 14, transition: 'border 0.15s' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 },
  kpiCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 12px', textAlign: 'center' },
  kpiIcon: { fontSize: 24, marginBottom: 6 },
  kpiVal:  { fontSize: 18, fontWeight: 800, marginBottom: 4 },
  kpiLabel:{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' },
  card:    { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle:{ fontSize: 14, fontWeight: 700, marginBottom: 12 },
  depRow:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  depBar:  { flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  depBarFill: { height: '100%', backgroundColor: '#d97706', borderRadius: 4, transition: 'width 0.3s' },
  depPct:  { fontSize: 13, color: '#6b7280', width: 40, textAlign: 'right' },
  depVal:  { fontSize: 13, fontWeight: 600, width: 140, textAlign: 'right' },
  formCard:{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 16 },
  label:   { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input:   { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  select:  { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, backgroundColor: '#fff', boxSizing: 'border-box' },
  btnPrimary:  { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary:{ backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnPreset:   { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  dateInput:   { padding: '7px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 },
  tableWrapper:{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  thead:   { backgroundColor: '#f9fafb' },
  th:      { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' },
  tr:      { borderBottom: '1px solid #f3f4f6' },
  td:      { padding: '12px 14px', fontSize: 14 },
  typeBadge: { backgroundColor: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 8, fontSize: 12 },
  liste:   { display: 'flex', flexDirection: 'column', gap: 12 },
  creanceCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px' },
  creanceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statutBadge: { padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 },
  progressBar: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill:{ height: '100%', backgroundColor: '#16a34a', borderRadius: 4, transition: 'width 0.3s' },
  btnPaiement: { backgroundColor: '#dbeafe', color: '#1e40af', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  empty:   { textAlign: 'center', color: '#9ca3af', padding: 30 },
}

export default FinancesPage