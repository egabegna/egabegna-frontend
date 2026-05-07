const STATUTS = {
  en_attente: { label: 'En attente', bg: '#fef3c7', color: '#92400e' },
  validee:    { label: 'Validée',    bg: '#dcfce7', color: '#16a34a' },
  annulee:    { label: 'Annulée',    bg: '#fee2e2', color: '#dc2626' },
  en_cours:   { label: 'En cours',   bg: '#dbeafe', color: '#1e40af' },
  terminee:   { label: 'Terminée',   bg: '#f3f4f6', color: '#374151' },
}

function StatutBadge({ statut }) {
  const s = STATUTS[statut] || { label: statut, bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12, fontSize: 12,
      fontWeight: 600, backgroundColor: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}
export default StatutBadge