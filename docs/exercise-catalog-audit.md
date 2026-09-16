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

1. **Higiene primero, sin cambiar de fuente** (barato, sin migración): fusionar los 22 grupos
   de duplicados, unificar las 20 filas izquierda/derecha, borrar las no-ejercicio y asignar
   los 97 `muscle_group_id` que faltan.
2. **Adoptar los metadatos MIT** como catálogo maestro, con tabla de equivalencias
   id-viejo → id-nuevo. `workout_sets` desnormaliza `exercise_name`, `muscle_group`,
   `image_url` y `description`, así que **el historial de los usuarios no se rompe**. Sí hay
   que remapear: `workout_templates.exercises` (jsonb), `trainer_routines`,
   `routine_assignments` y `custom_exercises`.
3. **Imágenes**: licenciar un pack consistente. Mientras tanto, placeholder por grupo muscular
   en lugar de imagen incorrecta.
4. **QA final a mano**: con ~121 `smart_enabled` una pantalla en `/admin` con imagen + nombre
   y dos botones cierra el 100 % restante en una tarde.
