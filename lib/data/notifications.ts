const notificationMessages = [
  "Hoy sudas, mañana brillas. ¿Vamos? 🏋️",
  "El hierro no miente, las excusas sí. 🏋️",
  "Tu único límite eres tú. Supéralo 💪",
  "La disciplina es el puente. ¿Lo cruzas?",
  "Cada día es una oportunidad. Es hoy ✨",
  "El gym es tu therapy. Date el tiempo 🧘",
  "Levanta pesado. Sueña grande. Actúa ahora 🔥",
  "Tu tiempo es ahora. No esperes ⏰",
];

export function getDailyNotification(): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return notificationMessages[dayOfYear % notificationMessages.length];
}