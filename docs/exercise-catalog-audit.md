# Auditoría del catálogo de ejercicios

Fecha: 2026-09-16. Re-ejecutable con:

```bash
node scripts/pull-exercise-catalog.mjs     # vuelca exercises -> ours.json
curl -sSo exercises.json https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json
node scripts/audit-exercise-catalog.mjs    # cruce + report.json
```

## Estado actual (tabla `exercises`)

| Métrica | Valor |
|---|---|
| Filas totales | 813 |
| Activas (`is_active`) | 721 |
| `smart_enabled` (las únicas que usa el Smart Coach) | 121 |
| **Activas SIN imagen** | **493 (68,4 %)** |
| Activas sin `muscle_group_id` | 97 (13,5 %) |
| Grupos de duplicados por nombre normalizado | 22 grupos, 47 filas |
| Filas duplicadas por lado (izquierda/derecha) | 20 |

El problema no es que algunas imágenes estén mal: es que **dos de cada tres ejercicios
activos no tienen ninguna**. wger.de es un wiki comunitario y la mayoría de sus entradas
nunca recibieron una foto.

## Cruce contra el dataset MIT (1.324 ejercicios)

Nuestros nombres están en español y los del dataset en inglés, así que el cruce usa un
léxico es→en de vocabulario de gimnasio (ver `scripts/audit-exercise-catalog.mjs`).

| Resultado | Activos | % |
|---|---|---|
| Match fuerte (≥0,75) | 249 | 34,5 % |
| Dudoso (0,50–0,75) — revisión manual | 183 | 25,4 % |
| Sin match (<0,50) | 289 | 40,1 % |

Sobre los 121 `smart_enabled`, que son los que un usuario ve de verdad:
**69 fuerte, 30 dudoso, 22 sin match**. 74 tienen imagen hoy; de los 47 que no,
**23 quedarían cubiertos** por un match fuerte.

### Por grupo muscular

| Grupo | Activos | Con imagen | Smart | Fuerte | Dudoso | Sin match |
|---|---|---|---|---|---|---|
| espalda | 121 | 38 | 14 | 31 | 40 | 50 |
| piernas | 112 | 45 | 18 | 43 | 23 | 46 |
| (sin grupo) | 97 | 17 | 0 | 21 | 16 | 60 |
| hombros | 95 | 34 | 15 | 35 | 27 | 33 |
| abdomen | 91 | 22 | 17 | 25 | 11 | 55 |
| pecho | 71 | 28 | 17 | 26 | 30 | 15 |
| biceps | 61 | 20 | 14 | 34 | 14 | 13 |
| triceps | 34 | 13 | 10 | 22 | 8 | 4 |
| gluteos | 23 | 6 | 10 | 2 | 11 | 10 |
| pantorrillas | 10 | 4 | 6 | 7 | 2 | 1 |
| antebrazos | 5 | 1 | 0 | 3 | 1 | 1 |
| cardio | 1 | 0 | 0 | 0 | 0 | 1 |

## El hallazgo de fondo

Al revisar a mano el bucket "sin match" se ve que **no falta en el dataset: está roto en
nuestro lado**. Ejemplos reales de filas activas:

- `Isometria trazioni impugnatura inversa` — está en italiano
- `Snach` — error tipográfico de *snatch*
- `Rest (for timed workouts)` — no es un ejercicio
- `Curl con Pesa rusa Dos hands`, `Sentado Knee Tuck`, `Elevated prayer Estiramiento`,
  `Vertical Remo, en Multi Press` — traducción a medias y orden de palabras roto
- `Media Sentadilla Derecha` / `Media Sentadilla Izquierda` — un ejercicio partido en dos filas
- `Press de Pecho en Máquina` / `Press de pecho con máquina` / `Máquina Pecho Press Exercise` /
  `Máquina Pecho Press` — cuatro filas, un solo ejercicio

Por eso las depuraciones anteriores no cerraron el problema: agrupar por nombre no puede
funcionar cuando los nombres están en tres idiomas, con erratas y con el orden alterado.

## Licencias

- **Metadatos del dataset (MIT):** nombres, `body_part`, `equipment`, `target`, músculos
  secundarios e instrucciones paso a paso en 10 idiomas, **español incluido**. Uso comercial
  libre. Es lo que arregla la taxonomía.
- **Media (`images/`, `videos/`): NO es MIT.** Es © Gym Visual, cedido por escrito solo a ese
  autor. El LICENSE dice literalmente que clonar el repo *no concede ninguna licencia sobre el
  media* y que hay que obtenerla de gymvisual.com. Cada registro lleva su campo `attribution`.

Conclusión: la taxonomía sale gratis; **las imágenes son una compra, no un desarrollo**.

## Plan sugerido

1. **Higiene primero, sin cambiar de fuente** — hecho: migración `036`, ver abajo.
2. **Adoptar los metadatos MIT** como catálogo maestro, con tabla de equivalencias
   id-viejo → id-nuevo. `workout_sets` desnormaliza `exercise_name`, `muscle_group`,
   `image_url` y `description`, así que **el historial de los usuarios no se rompe**. Sí hay
   que remapear: `workout_templates.exercises` (jsonb), `trainer_routines`,
   `routine_assignments` y `custom_exercises`.
3. **Imágenes**: licenciar un pack consistente. Mientras tanto, placeholder por grupo muscular
   en lugar de imagen incorrecta.
4. **QA final a mano**: con ~121 `smart_enabled` una pantalla en `/admin` con imagen + nombre
   y dos botones cierra el 100 % restante en una tarde.

---

# Paso 1 ejecutado: migración `036_exercise_catalog_hygiene.sql`

Generada por `scripts/plan-catalog-hygiene.mjs`. **Aplicada el 2026-09-16.**

## Qué hace

| Acción | Filas |
|---|---|
| Fusiona 22 grupos de duplicados | 25 filas absorbidas |
| Repunta el historial (`workout_sets`) | 18 sets, 6 workouts |
| Repunta plantillas (`workout_templates`) | 0 (ninguna apuntaba a una absorbida) |
| Renombra supervivientes izquierda/derecha | 11 |
| Desactiva no-ejercicios | 3 (`Rest`, `Respiración profunda`, `Blackroll`) |
| Asigna `muscle_group_id` por nombre | 35 |

Activos: **721 → 692**. Sin grupo muscular: **97 → 48**. Nombres con lado: **20 → 0**.

Las filas absorbidas se desactivan (`is_active=false`), no se borran: reversible, y
cualquier referencia rezagada sigue resolviendo. El superviviente de cada grupo se
elige por uso real (sets + plantillas) y hereda la mejor imagen y `smart_enabled`
del grupo, para no perder la única foto buena por quedarnos con la fila más usada.

## Lo que NO hace, y por qué

**No usa la columna `category` para asignar grupo muscular.** Medida contra las filas
ya curadas, `category` parecía fiable (Back→espalda 121/124, Chest→pecho 67/67,
Shoulders→hombros 95/95). Pero eso mide que el curador estuvo de acuerdo con ella,
no que sea correcta. En las 97 filas *sin curar* es mala: `Burpees` viene como
`Chest`, `Suelo Glider Isquiotibiales Curls` (femoral) como `Shoulders`, y 20 de las
37 `Back` son estiramientos de cuello. Asignar por `category` habría metido decenas
de filas mal clasificadas justo en el filtro que queremos limpiar.

## Pendiente de decisión (63 filas)

- **22 de movilidad / estiramiento / cuello** (`Cat-Cow`, `Postura del Niño`,
  `Círculos de Cuello`, `Sit & Reach`, `Open Book`, `Bretzel`…). No existe un grupo
  `movilidad` en `lib/data/ejercicios.ts` y ninguno de los 11 actuales les encaja.
  Opciones: crear el grupo (requiere UI e i18n) o desactivarlas.
- **27 que requieren criterio humano**: nombres rotos o ambiguos — `Hercules Pillars`,
  `Suspensión en Romos`, `Arco femorale una gamba` (italiano), `Recruitment Pulls`,
  `Máquina Lateral wise`, `Claps over head`, `Brazos Raises (T/Y/I)`.
- **14 restantes** ya cubiertas por las fusiones.

## Validación hecha

- Expresión de actualización del `jsonb` probada en lectura sobre una plantilla real:
  longitud y orden preservados, solo cambia `exerciseId`, resto de claves intactas.
- Mapa de fusión verificado: sin encadenamientos (ningún superviviente es a su vez
  absorbido), sin ids absorbidos dos veces.
## Resultado tras aplicar

| Comprobación | Esperado | Real |
|---|---|---|
| Ejercicios activos | 692 | 692 ✓ |
| Sin grupo muscular | — | 48 |
| Series totales (ninguna perdida) | 4.455 | 4.455 ✓ |
| Filas absorbidas aún activas | 0 | 0 ✓ |
| Nombres con izquierda/derecha | 0 | 0 ✓ |
| `smart_enabled` activos | 121 | 121 ✓ |
| Duplicados de «press de pecho en máquina» | 1 | 1 ✓ |

Dos correcciones sobre la marcha, antes de aplicar:

- La regla de `agarre|grip` se adelantaba a las de pecho y espalda, así que
  `Mancuernas Cerrado grip Banco press`, `Inclinado Cerrado Grip Barra Banco Press` y
  `Jalón al pecho con agarre ancho` acababan en *antebrazos*. Un «grip» suelto dice cómo
  se sujeta la barra, no qué músculo trabaja: las reglas de movimiento van primero.
- Al reordenar la alternancia, el `\b` final quedó pegado a `flexion` y «Flexiones» dejó
  de casar. Ahora cada regla agrupa sus alternativas en `(?:…)`.

### Lo que la verificación destapó

- **27 series apuntan a ejercicios inactivos, pero son preexistentes**: `Sentadillas Hack`
  (#1414) y `Polea Jalón through` (#1751), desactivados en junio de 2026 y que la 036 no
  toca. Hay que decidir si se reactivan o se repuntan a un equivalente.
- `workout_sets.exercise_id` guarda **ids no numéricos** (ejercicios personalizados como
  `"aperturas"`), así que cualquier consulta que castee esa columna a `bigint` revienta.
  Comparar siempre como texto.

---

# Evaluación: Functional Fitness Exercise Database v2.9 (xlsx)

3.242 ejercicios, 32 columnas. Autor: Jensen Van Diepen / *Strength to Overcome*.

## Licencia: bloqueante para nosotros

La hoja «Contact Information» dice literalmente:

> *this data is intended for personal use, please contact for commercial inquiries
> regarding a potential collaboration.*
> ©️ Strength to Overcome, 2025. All rights reserved.

Descargarla gratis no la hace libre de usar. **No se puede incorporar a Total Gym tal
cual.** Pero el autor es una persona identificable que invita explícitamente a
colaboración comercial (jensen@strengthtoovercome.com) — mucho más negociable que
Gym Visual.

## No resuelve el problema de las imágenes

Cero imágenes. 2.013 de 3.242 filas llevan enlace a YouTube de su propio canal.
Embeber vídeo ajeno es otra negociación de permisos, y además empeora la UX: entre
series, en móvil, un GIF de 180×180 gana a un reproductor de YouTube.

## Lo que sí aporta: la clasificación del Smart Coach

`lib/workout/exercise-classifier.ts` son 163 líneas de heurísticas por palabra clave
que *adivinan* `role` (compound/isolation) y `pattern` desde el nombre en español.
Esta base trae ambos campos **etiquetados a mano por un entrenador certificado**:

- `Mechanics` → Compound / Isolation
- `Movement Pattern #1-3` → 38 valores (Knee Dominant, Hip Hinge, Vertical Push,
  Horizontal Pull, Anti-Extension, Loaded Carry…)
- `Force Type` → Push / Pull / Push & Pull
- `Body Region`, `Posture`, `Grip`, `Laterality`, `Difficulty Level`

De nuestros 187 match fuertes, **187 traen `Mechanics` y 181 `Movement Pattern`**.

## El problema: su centro de gravedad no es el nuestro

| Equipamiento | Filas |
|---|---|
| Kettlebell | 861 |
| Clubbell / Macebell | 302 |
| Sliders | 165 |
| Anillas / Suspensión / Parallettes | 257 |
| Sandbag / Bulgarian Bag | 136 |

Solo el **39 %** usa equipamiento de gimnasio convencional. `Quadriceps` es el
músculo objetivo del 41 % de las filas. Es una base de *fitness funcional*, no de sala.

Cobertura contra nuestras 721 activas: **25,9 % fuerte** (frente al 34,5 % del
dataset MIT), 29,5 % dudoso, 44,5 % sin match. Y su granularidad de variantes
produce cruces demasiado específicos: `Zancadas con Barra` → `Barbell Zombie
Walking Lunge`.

## Conclusión

Tres fuentes, tres papeles distintos — ninguna sirve para todo:

| | Taxonomía | Instrucciones ES | Imágenes | Biomecánica |
|---|---|---|---|---|
| wger (actual) | mala | sí | 32 % y heterogéneas | no |
| Dataset MIT | buena | **sí, 10 idiomas** | licencia Gym Visual | no |
| FFED v2.9 | buena | no | no | **sí, etiquetada** |

Su valor para nosotros no es como catálogo ni como media: es como **fuente de verdad
para el clasificador**. Dos vías:

1. Escribir a Jensen. Invita a ello y preguntar es gratis.
2. Usar su **vocabulario** de clasificación (Movement Pattern, Force Type, Mechanics,
   Posture, Laterality) para etiquetar nuestro propio catálogo. Que un press de banca
   sea *compound / horizontal push* es un hecho, y los hechos no son de nadie; lo que
   protege el copyright es la selección y organización del conjunto. Inspirarnos en el
   esquema es seguro; copiar las 3.242 filas no. Conviene confirmarlo antes de publicar.

---

# Migración `037_exercise_classification.sql` — aplicada el 2026-09-17

Añade `mechanics`, `movement_pattern`, `force_type` y `laterality` a `exercises`,
con `CHECK` sobre el vocabulario de `lib/workout/classification.ts`, e índice
`(muscle_group_id, movement_pattern)`. Etiqueta los 121 `smart_enabled`.

| Comprobación | Real |
|---|---|
| Filas etiquetadas | 121 |
| `smart_enabled` sin clasificar | 0 ✓ |
| Patrones distintos en uso | 25 |
| Series huérfanas | 0 ✓ |
| Activos | 694 |

## Dos fallos corregidos antes de aplicar

- **La coma separadora del `VALUES` quedaba dentro del comentario `--`**, así que
  Postgres habría visto `(a)(b)(c)` sin separadores. La migración tal como se
  committeó el día anterior nunca habría arrancado. 120 líneas recolocadas.
- **La 036 absorbió `#283` en `#979`**, así que la etiqueta apuntaba a una fila ya
  inactiva y `#979` se quedaba sin clasificar. El bloque de verificación de la propia
  migración lo habría cazado, pero se detectó antes comparando etiquetas contra los
  `smart_enabled` vivos. Lección: **las etiquetas se calcularon antes de la 036**;
  cualquier fusión posterior obliga a recomprobar el cruce.

## Huérfanos resueltos

`Sentadillas Hack` (#1414, 21 series) y `Polea Jalón through` (#1751, 6 series),
desactivados en junio de 2026, reactivados y asignados a `piernas` y `gluteos`.
Reactivar sin asignar grupo los habría dejado activos pero invisibles en el filtro.
