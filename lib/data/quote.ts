const motivationalQuotes = [
  "El dolor que sientes hoy es la fuerza que sentirás mañana.",
  "No pares cuando estés cansado. Para cuando hayas terminado.",
  "La grandeza se construye en el gimnasio, pero se forja en la mente.",
  "Cada repetición te acerca más a tu mejor versión.",
  "No hay secretos. Solo entrena con consistencia.",
  "Tu único límite eres tú mismo.",
  "El cuerpo logra lo que la mente cree.",
  "Levanta pesado. Sueña grande.",
  "La disciplina es el puente entre tus sueños y tus logros.",
  "Hoy sudas, mañana brillas.",
  "El gimnasio no perdona ignorancia, pero premia dedicación.",
  "Transforma el dolor en poder.",
  "Cada día es una oportunidad de ser más fuerte.",
  "No busques atajos, busca resultados.",
  "La motivación te abre la puerta, la disciplina te hace entrar.",
  "El hierro no miente, las excusas sí.",
  "Entrena como si fuera tu último día.",
  "El campeón se hace cuando nadie mira.",
  "Tu única competencia eres tú.",
  "La fuerza no viene del cuerpo, viene del corazón.",
  "Sudor hoy, gloria mañana.",
  "No te rindas cuando parezca difícil.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Levántate, entrena, repítelo.",
  "Las metas se cumplen con acción.",
  "Haz que cada repetición cuente.",
  "El gym es tu therapy.",
  "La única manera de fallar es no intentarlo.",
  "Perseverancia vence talento.",
  "Tu tiempo es ahora.",
  "El dolor es temporal, el orgullo es eterno.",
  "Puedes tener excusas o resultados, pero no ambos.",
];

export function getDailyQuote(): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}