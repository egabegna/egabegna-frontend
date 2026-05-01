export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  if (password.length >= 8)                    score++
  if (password.length >= 12)                   score++
  if (/[A-Z]/.test(password))                  score++
  if (/[0-9]/.test(password))                  score++
  if (/[^A-Za-z0-9]/.test(password))           score++

  if (score <= 2) return { score, label: 'Faible',  color: '#ef4444' }
  if (score <= 3) return { score, label: 'Moyen',   color: '#f59e0b' }
  return           { score, label: 'Fort',    color: '#22c55e' }
}