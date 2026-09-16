import fs from 'node:fs'

const ours = JSON.parse(fs.readFileSync('ours.json', 'utf8'))
const theirs = JSON.parse(fs.readFileSync('exercises.json', 'utf8'))

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const toks = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean)

// Léxico es->en del vocabulario de gimnasio. Cerrado y pequeño a propósito:
// lo que no traduce se deja tal cual (muchos términos ya vienen en inglés).
const LEX = {
  // equipamiento
  mancuerna: 'dumbbell', mancuernas: 'dumbbell', db: 'dumbbell',
  barra: 'barbell', bar: 'barbell', halterofilia: 'barbell',
  polea: 'cable', poleas: 'cable', cuerda: 'rope', cable: 'cable',
  maquina: 'machine', smith: 'smith', banda: 'band', bandas: 'band',
  resistencia: 'resistance', disco: 'weighted', pesa: 'kettlebell',
  rusa: 'kettlebell', kettlebell: 'kettlebell', trx: 'suspension',
  banco: 'bench', banca: 'bench', cajon: 'box', pared: 'wall',
  suelo: 'floor', landmine: 'landmine', corporal: 'body',
  // movimientos
  press: 'press', prensa: 'press', empuje: 'press',
  curl: 'curl', curls: 'curl', sentadilla: 'squat', sentadillas: 'squat',
  remo: 'row', rows: 'row', row: 'row',
  jalon: 'pulldown', pulldown: 'pulldown',
  elevacion: 'raise', elevaciones: 'raise', raises: 'raise', raise: 'raise',
  extension: 'extension', extensiones: 'extension',
  flexion: 'curl', flexiones: 'push-up', dominadas: 'pull-up',
  fondos: 'dip', dip: 'dip', dips: 'dip',
  aperturas: 'fly', apertura: 'fly', cruce: 'crossover',
  encogimientos: 'shrug', encogimiento: 'shrug',
  zancada: 'lunge', zancadas: 'lunge', desplante: 'lunge',
  peso: 'weight', muerto: 'deadlift', deadlift: 'deadlift',
  puente: 'bridge', plancha: 'plank', planche: 'plank',
  abdominales: 'crunch', abdominal: 'crunch', crunch: 'crunch',
  rotacion: 'rotation', rotaciones: 'rotation',
  abduccion: 'abduction', aduccion: 'adduction',
  patada: 'kickback', patadas: 'kickback',
  estiramiento: 'stretch', pullover: 'pullover', rollout: 'rollout',
  cargada: 'clean', arrancada: 'snatch', circulos: 'circle',
  caminata: 'walk', paralelas: 'parallel', balon: 'ball', bola: 'ball', gemelos: 'calf', escapula: 'scapula', colgado: 'hanging', colgante: 'hanging', deficit: 'deficit', convencional: 'conventional', angosto: 'close', diagonal: 'diagonal', frances: 'skull', regleta: 'hangboard', oso: 'bear', muerto: 'dead', escalador: 'climber', superman: 'superman',
  // músculos / zonas
  pecho: 'chest', pectoral: 'chest', pec: 'pec',
  espalda: 'back', dorsal: 'lat', lat: 'lat', dorsales: 'lat',
  hombro: 'shoulder', hombros: 'shoulder', delt: 'deltoid', deltoides: 'deltoid',
  biceps: 'biceps', triceps: 'triceps', antebrazo: 'forearm', antebrazos: 'forearm',
  pierna: 'leg', piernas: 'leg', cuadriceps: 'quadriceps', femoral: 'hamstring',
  gluteo: 'glute', gluteos: 'glute', pantorrilla: 'calf', pantorrillas: 'calf',
  cadera: 'hip', caderas: 'hip', muneca: 'wrist', cuello: 'neck',
  trapecio: 'trap', abdomen: 'abs', core: 'core', oblicuos: 'oblique',
  // modificadores
  inclinado: 'incline', declinado: 'decline', acostado: 'lying', tumbado: 'lying',
  sentado: 'seated', pie: 'standing', parado: 'standing', supino: 'supine',
  prono: 'prone', frontal: 'front', lateral: 'lateral', posterior: 'rear',
  trasero: 'rear', atras: 'back', reverso: 'reverse', inverso: 'reverse',
  alterno: 'alternate', alternado: 'alternate', unilateral: 'single',
  bilateral: 'two', una: 'one', uno: 'one', dos: 'two',
  cerrado: 'close', ancho: 'wide', agarre: 'grip', grip: 'grip',
  neutro: 'neutral', martillo: 'hammer', concentrado: 'concentration',
  predicador: 'preacher', rumano: 'romanian', sumo: 'sumo', hack: 'hack',
  isometrico: 'isometric', alto: 'high', bajo: 'low', superior: 'upper',
  inferior: 'lower', arriba: 'up', abajo: 'down', overhead: 'overhead',
  externa: 'external', external: 'external', interna: 'internal',
  derecha: '', derecho: '', izquierda: '', izquierdo: '',
}
// Palabras vacías en ambos idiomas.
const STOP = new Set(['de', 'con', 'en', 'el', 'la', 'los', 'las', 'a', 'al', 'del', 'y',
  'para', 'sobre', 'hacia', 'un', 'una', 'the', 'with', 'on', 'in', 'and', 'to', 'of',
  'exercise', 'ejercicio', 'v', 't', 'l'])

// Bigramas que significan otra cosa que sus dos palabras sueltas. Sin esto
// "peso muerto" entra como {weight, deadlift} y arrastra ruido a cada comparación.
const BIGRAMS = {
  'peso muerto': 'deadlift', 'press banca': 'bench press', 'press de banca': 'bench press',
  'pres banca': 'bench press', 'barra z': 'ez barbell', 'barra sz': 'ez barbell',
  'banco scott': 'preacher bench', 'pec deck': 'pec deck', 'balon de estabilidad': 'stability ball',
  'pelota suiza': 'stability ball', 'bicho muerto': 'dead bug', 'press frances': 'lying triceps extension',
  'patada de triceps': 'triceps kickback', 'elevacion de gemelos': 'calf raise',
  'prensa de piernas': 'leg press', 'jalon al pecho': 'lat pulldown',
  'sentadilla bulgara': 'bulgarian split squat', 'fondos en paralelas': 'parallel bar dip',
  'buenos dias': 'good morning', 'gato camello': 'cat cow',
}
// Plurales españoles e ingleses -> singular, para que "burpees" case con "burpee".
function stem(t) {
  if (t.length > 4 && t.endsWith('es')) return t.slice(0, -2)
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1)
  return t
}

function bag(name) {
  let n = ' ' + norm(name).replace(/[^a-z0-9]+/g, ' ').trim() + ' '
  for (const [k, v] of Object.entries(BIGRAMS)) {
    if (n.includes(' ' + k + ' ')) n = n.replace(' ' + k + ' ', ' ' + v + ' ')
  }
  const out = new Set()
  for (const t of n.split(/\s+/).filter(Boolean)) {
    if (STOP.has(t)) continue
    const tr = LEX[t] !== undefined ? LEX[t] : t
    if (tr) tr.split(/[^a-z0-9]+/).forEach(x => x && out.add(stem(x)))
  }
  return out
}

// Similitud por contención simétrica: tolera que un lado tenga más detalle
// que el otro ("press de banca" vs "barbell bench press") sin premiar el ruido.
function sim(a, b) {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / Math.min(a.size, b.size) * 0.7 + inter / (a.size + b.size - inter) * 0.3
}

const theirBags = theirs.map(e => ({ e, b: bag(e.name) }))

const active = ours.filter(e => e.is_active)
const rows = []
for (const o of active) {
  const ob = bag(o.name)
  let best = null, second = 0
  for (const { e, b } of theirBags) {
    const s = sim(ob, b)
    if (!best || s > best.s) { second = best ? best.s : 0; best = { e, s } }
    else if (s > second) second = s
  }
  rows.push({ o, best, margin: best ? best.s - second : 0 })
}

const FUERTE = 0.75, DUDOSO = 0.5
const fuerte = rows.filter(r => r.best.s >= FUERTE)
const dudoso = rows.filter(r => r.best.s >= DUDOSO && r.best.s < FUERTE)
const nulo = rows.filter(r => r.best.s < DUDOSO)

// Duplicados internos: mismo bag de tokens = mismo ejercicio escrito distinto.
const byBag = new Map()
for (const o of active) {
  const k = [...bag(o.name)].sort().join(' ')
  if (!k) continue
  byBag.set(k, [...(byBag.get(k) || []), o])
}
const dupes = [...byBag.values()].filter(g => g.length > 1)

console.log('=== NUESTRO CATALOGO (activos) ===')
console.log('activos:', active.length,
  '| con imagen:', active.filter(e => e.image_url).length,
  '| smart_enabled:', active.filter(e => e.smart_enabled).length)
console.log('\n=== COBERTURA CONTRA EL DATASET MIT (1.324) ===')
const pct = n => (n / active.length * 100).toFixed(1) + '%'
console.log(`match fuerte (>=${FUERTE}):`, fuerte.length, pct(fuerte.length))
console.log(`dudoso (${DUDOSO}-${FUERTE}):`, dudoso.length, pct(dudoso.length))
console.log(`sin match (<${DUDOSO}):`, nulo.length, pct(nulo.length))
console.log('\ncobertura de los smart_enabled (los que usa el Smart Coach):')
const smart = rows.filter(r => r.o.smart_enabled)
console.log('  total:', smart.length,
  '| fuerte:', smart.filter(r => r.best.s >= FUERTE).length,
  '| dudoso:', smart.filter(r => r.best.s >= DUDOSO && r.best.s < FUERTE).length,
  '| sin match:', smart.filter(r => r.best.s < DUDOSO).length)
console.log('\nactivos SIN imagen que el dataset sí cubre (fuerte):',
  fuerte.filter(r => !r.o.image_url).length)

console.log('\n=== DUPLICADOS INTERNOS (mismo nombre normalizado) ===')
console.log('grupos:', dupes.length, '| filas implicadas:', dupes.reduce((a, g) => a + g.length, 0))
dupes.slice(0, 15).forEach(g => console.log('  · ' + g.map(x => `${x.id} "${x.name}"`).join('  ==  ')))

console.log('\n=== MUESTRA MATCH FUERTE ===')
fuerte.slice(0, 15).forEach(r =>
  console.log(`  ${r.best.s.toFixed(2)}  "${r.o.name}"  ->  "${r.best.e.name}" [${r.best.e.equipment}]`))
console.log('\n=== MUESTRA DUDOSO (revisión manual) ===')
dudoso.slice(0, 15).forEach(r =>
  console.log(`  ${r.best.s.toFixed(2)}  "${r.o.name}"  ->  "${r.best.e.name}"`))
console.log('\n=== MUESTRA SIN MATCH ===')
nulo.slice(0, 20).forEach(r => console.log(`  ${r.best.s.toFixed(2)}  "${r.o.name}"`))

fs.writeFileSync('report.json', JSON.stringify({
  fuerte: fuerte.map(r => ({ id: r.o.id, ours: r.o.name, theirs: r.best.e.name, newId: r.best.e.id, score: +r.best.s.toFixed(3) })),
  dudoso: dudoso.map(r => ({ id: r.o.id, ours: r.o.name, theirs: r.best.e.name, newId: r.best.e.id, score: +r.best.s.toFixed(3) })),
  nulo: nulo.map(r => ({ id: r.o.id, ours: r.o.name, score: +r.best.s.toFixed(3) })),
  dupes: dupes.map(g => g.map(x => ({ id: x.id, name: x.name }))),
}, null, 1))
console.log('\n-> report.json escrito')
