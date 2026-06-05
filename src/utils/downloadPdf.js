import authStore from '../store/authStore'

export async function downloadRecuPDF(venteId, venteDate) {
  const token   = authStore.getAccessToken()
  const baseUrl = import.meta.env.VITE_API_URL || ''

  const response = await fetch(
    `${baseUrl}/api/ventes/${venteId}/recu-pdf/`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) throw new Error('Erreur génération PDF')

  const blob     = await response.blob()
  const url      = URL.createObjectURL(blob)
  const dateStr  = venteDate
    ? new Date(venteDate).toISOString().split('T')[0].replace(/-/g, '')
    : new Date().toISOString().split('T')[0].replace(/-/g, '')

    // Ouvrir directement dans un nouvel onglet
    window.open(url, '_blank')
    URL.revokeObjectURL(url)
}