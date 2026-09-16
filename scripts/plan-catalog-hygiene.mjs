import fs from 'node:fs'
const ours = JSON.parse(fs.readFileSync('ours.json', 'utf8'))
const rep = JSON.parse(fs.readFileSync('report.json', 'utf8'))
const byId = new Map(ours.map(e => [e.id, e]))
const n = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Uso real, medido en la BD (sets, plantillas).
const USO = JSON.parse(fs.readFileSync('uso.json', 'utf8')) // {id: {sets, tpl}}
const uso = id => USO[id] || { sets: 0, tpl: 0 }

/* ---------- 1. Fusión de duplicados ---------- */
// Superviviente: más uso real > tiene imagen > smart_enabled > id más bajo.
// El superviviente hereda imagen y smart_enabled de cualquiera del grupo, para
// no perder la única foto buena por elegir la fila más usada.
function pickSurvivor(g) {
  return g.slice().sort((a, b) => {
    const ua = uso(a.id), ub = uso(b.id)
    return (ub.sets + ub.tpl * 10) - (ua.sets + ua.tpl * 10)
      || (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0)
      || (b.smart_enabled ? 1 : 0) - (a.smart_enabled ? 1 : 0)
      || a.id - b.id
  })[0]
}

// Nombre neutro para los pares izquierda/derecha: un solo ejercicio mal partido.
const RENOMBRA = {
  572: 'Encogimientos con Mancuernas',
  1636: 'Remo Unilateral en Polea',
  580: 'Plancha Lateral',
  702: 'Elevación de Pantorrilla a una Pierna',
  986: 'Sentadilla Lateral',
  988: 'Sentadilla Búlgara',
  991: 'Media Sentadilla',
  1008: 'Estiramiento Lateral de Cuello',
  1028: 'Rotación Torácica en Cuadrupedia',
  1231: 'Estiramiento de Tríceps',
  1233: 'Estiramiento de Bíceps de Pie',
}

const merges = []
for (const grp of rep.dupes) {
  const g = grp.map(x => byId.get(x.id)).filter(Boolean)
  if (g.length < 2) continue
  const s = pickSurvivor(g)
  merges.push({
    survivor: s,
    absorbed: g.filter(x => x.id !== s.id),
    image: s.image_url || g.find(x => x.image_url)?.image_url || null,
    smart: g.some(x => x.smart_enabled),
    group: s.muscle_group_id || g.find(x => x.muscle_group_id)?.muscle_group_id || null,
    rename: RENOMBRA[s.id] || null,
  })
}

/* ---------- 2. Filas que no son ejercicios ---------- */
const NO_EJERCICIO = [
  1114, // Rest (for timed workouts)
  1591, // Respiración profunda (de pie o sentado)
  1363, // Blackroll (es un accesorio, no un ejercicio)
]

/* ---------- 3. Grupo muscular por nombre, no por category ---------- */
// Solo reglas inequívocas. Lo que no encaja se queda para revisión manual:
// category es poco fiable justo en las filas sin curar.
// Los 11 grupos que existen de verdad (lib/data/ejercicios.ts). No hay "cuello".
const GRUPOS = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'antebrazos',
  'piernas', 'gluteos', 'abdomen', 'pantorrillas', 'cardio']
// Movilidad, estiramientos y cuello: no encajan en ningún grupo de fuerza.
// Asignarles uno ensucia el filtro; necesitan decisión de producto aparte.
const MOVILIDAD = /\bcuello|cervical|nuca|cabeza|estiramiento|movilidad|yoga|cobra|gato|cat-cow|postura|open book|bretzel|sit & reach|roll down|prayer|escapula|car\b/

// El ORDEN importa: la primera que casa gana. Las reglas de aparato de agarre
// van antes que nada porque son inequívocas, pero un "grip" o un "agarre" suelto
// solo describe CÓMO se sujeta la barra — no el músculo que trabaja. Si esa regla
// se adelanta a las de pecho y espalda, un "Cerrado grip Banco press" acaba en
// antebrazos y un "Jalón al pecho con agarre ancho" también.
const REGLAS = [
// Cada alternativa va dentro de un (?:…) para que el \b del principio valga para
// todas y no solo para la primera. Sin agrupar, un \b al final se pega a la última
// alternativa y "flexion" deja de casar con "Flexiones".
  [/\b(?:regleta|multipresa|pellizco|fortalecedor)/, 'antebrazos'],  // aparatos de agarre
  [/\b(?:muneca|antebrazo)/, 'antebrazos'],
  [/\b(?:biceps)/, 'biceps'],
  [/\b(?:triceps|fondos)/, 'triceps'],
  [/\b(?:gluteo|patadas traseras)/, 'gluteos'],
  [/\b(?:isquiotibiales|femoral)/, 'piernas'],
  [/\b(?:banca|banco press|press de pecho|pecho press|supino|flexion)/, 'pecho'],
  [/\b(?:pulldown|jalon|remo|rows|dominadas|lat\b)/, 'espalda'],     // lat\b: no "lateral"
  [/\b(?:hombro|delt|overhead|ohp|elevacion lateral|elevaciones posteriores|encogimientos)/, 'hombros'],
  [/\b(?:burpee|montanero|caminata|escalador)/, 'cardio'],
]
// Las filas absorbidas por una fusión desaparecen: no se les asigna nada.
const absorbidas = new Set(merges.flatMap(m => m.absorbed.map(a => a.id)))
const sinGrupo = ours.filter(e => e.is_active && !e.muscle_group_id
  && !NO_EJERCICIO.includes(e.id) && !absorbidas.has(e.id))

const asignables = [], movilidad = [], revisar = []
for (const e of sinGrupo) {
  const s = n(e.name)
  if (MOVILIDAD.test(s)) { movilidad.push({ id: e.id, name: e.name }); continue }
  const hit = REGLAS.find(([re]) => re.test(s))
  if (hit && GRUPOS.includes(hit[1])) asignables.push({ id: e.id, name: e.name, group: hit[1] })
  else revisar.push({ id: e.id, name: e.name, category: e.category })
}

console.log('FUSIONES:', merges.length, 'grupos ->', merges.reduce((a, m) => a + m.absorbed.length, 0), 'filas absorbidas')
merges.forEach(m => console.log(`  ${m.survivor.id} "${m.rename || m.survivor.name}"  <=  ` +
  m.absorbed.map(a => `${a.id} "${a.name}"`).join(', ') +
  (m.rename ? '   [renombrado]' : '') + (m.image && !m.survivor.image_url ? '  [hereda imagen]' : '')))
console.log('\nNO EJERCICIOS a desactivar:', NO_EJERCICIO.length)
console.log('\nGRUPO ASIGNABLE POR NOMBRE:', asignables.length)
const porGrupo = {}
asignables.forEach(a => (porGrupo[a.group] = (porGrupo[a.group] || 0) + 1))
console.log(' ', JSON.stringify(porGrupo))
console.log('\nMOVILIDAD/ESTIRAMIENTO (sin grupo de fuerza posible):', movilidad.length);
movilidad.forEach(r=>console.log('  '+r.id+' '+r.name));
console.log('\nPARA REVISIÓN MANUAL:', revisar.length);
revisar.forEach(r=>console.log('  '+r.id+' ['+r.category+'] '+r.name))

fs.writeFileSync('plan.json', JSON.stringify({ merges: merges.map(m => ({
  survivorId: m.survivor.id, survivorName: m.rename || m.survivor.name,
  absorbedIds: m.absorbed.map(a => a.id), image: m.image, smart: m.smart, group: m.group,
})), noEjercicio: NO_EJERCICIO, asignables, movilidad, revisar }, null, 1))
