# Total Gym — Documentación del Proyecto

> Última actualización: 2026-08-19 (basada en `main`, migración 034)

## 1. Qué es Total Gym

Total Gym es una PWA (Progressive Web App) de entrenamiento físico, mobile-first y en español, construida con Next.js 16 (App Router) y Supabase. Permite a un usuario planificar y ejecutar rutinas de gimnasio, hacer seguimiento de progreso, competir/socializar con amigos, y —para usuarios con rol de entrenador— gestionar una cartera de clientes con rutinas, pagos, agenda y una página pública de captación de leads.

## 2. Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.4 (App Router, React 19.2.4, Turbopack) |
| Lenguaje | TypeScript 5 (strict, alias `@/*`) |
| Estilos | Tailwind CSS v4 (`@tailwindcss/postcss`), custom properties CSS |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Iconos | Lucide React |
| Drag & drop | @dnd-kit (core + sortable) |
| Gráficas | Recharts |
| Notificaciones UI | react-hot-toast |
| Push | Web Push API (VAPID + service worker) |
| PWA | `public/manifest.json` + `public/sw.js` |
| Imágenes | wger.de API (catálogo de ejercicios), Supabase Storage (fotos de workout, avatares, galería de entrenador) |
| Tipografías | Oswald (títulos), Rajdhani, Barlow Condensed |
| Deploy | Vercel (flujo git push) |
| Otras libs | `qrcode` (invitaciones), `pg` (scripts de administración/seed), `web-push`, `sharp`, `@vercel/analytics` |

No hay `middleware.ts` ni `vercel.json` en el repo; los cron jobs se configuran desde el dashboard de Vercel apuntando a las rutas `app/api/cron/*`.

## 3. Estructura del proyecto

```
app/
  (app)/                        # Grupo de rutas autenticadas (layout compartido con UserHeader)
    admin/                      # Dashboard de administración (protegido)
    amigos/[id]/                # Amigos: lista, búsqueda, solicitudes, leaderboard, detalle
    checkin/                    # Registro de peso/cintura/pecho/brazo/muslo con deltas vs. último check-in
    entrenador/                 # Modo entrenador (ver sección 6)
    entrenamiento/              # Creación de workout: elegir músculos → ejercicios → iniciar
    estadisticas/               # Dashboard de estadísticas del usuario
    historial/                  # Historial de workouts con filtros
    perfil/                     # Perfil + logros + ajustes + subida de avatar
    progreso/                   # Gráficas de progreso por ejercicio (Recharts)
    workout/[id]/               # Sesión de workout activa (sets, timer, fotos, completar)
  api/                          # ~75 route handlers (ver sección 5)
  components/                   # ~57 componentes compartidos
  e/[slug]/                     # Página pública de entrenador (captación de leads, redes, galería)
  reporte/[token]/              # Reporte de progreso público y compartible (token de entrenador)
  shared/[token]/               # Vista pública de workout compartido
  shared-friend/[id]/           # Vista de workout compartido entre amigos
lib/
  admin/                        # Auth de admin (cliente service_role, guards de ruta)
  avatar/                       # Helper compartido de subida/reemplazo/borrado de avatar (Supabase Storage)
  cron/                         # auth.ts: verificación de CRON_SECRET para rutas de cron
  data/                         # Datos estáticos (grupos musculares, cardio, frases, notificaciones)
  gamification.ts               # Cálculo de XP/nivel
  i18n/                         # Español/Inglés (~540 strings, contexto LanguageProvider)
  media/                        # image.ts: recompresión/recorte de imágenes client-side antes de subir
  premium/                      # Sistema de suscripción (planes free/premium)
  push.ts                       # Gestión de Web Push
  supabase/                     # Cliente Supabase singleton (browser)
  trainer/                      # Dominio entrenador: guard de acceso, adherencia, invitaciones, slug, redes, mappers
  workout/                      # Núcleo: context, types, service, planner, classifier, progress
  auth.ts                       # Helpers de auth de cliente, Google OAuth
  useAuth.ts                    # Hook de autenticación
  use-install-prompt.ts         # Hook para el prompt de instalación PWA
supabase/migrations/            # 34 migraciones SQL (001-034)
scripts/                        # ~22 scripts de admin/dev (seed, migración, curación de ejercicios)
public/                         # Assets estáticos, manifest.json, sw.js
next.config.ts                  # Remote patterns de imágenes (wger.de, Supabase storage), headers de caché
```

## 4. Base de datos (Supabase / PostgreSQL)

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Perfil de usuario (id, email, xp, level, current_streak, longest_streak, avatar_url) |
| `workouts` | Sesiones de entrenamiento (user_id, date, name, status, started_at, completed_at) |
| `workout_sets` | Sets individuales (exercise_id, reps, weight_kg, is_completed, is_cardio, distance_km, duration_minutes, exercise_order, muscle_group, description, image_url) |
| `exercises` | Catálogo maestro (~122 curados, flag `smart_enabled`) importado de wger.de |
| `workout_templates` | Plantillas guardadas (name, exercises jsonb) |
| `custom_exercises` | Ejercicios creados por el usuario |
| `subscriptions` | Planes free/premium (campos de Stripe) |
| `admin_users` | Seguimiento de rol admin |
| `shared_workouts` | Enlaces compartibles con token (expiran a los 7 días) |
| `friend_requests` | Ciclo de vida de solicitud de amistad (pending → accepted/cancelled) |
| `friends` | Filas de amistad bidireccional |
| `friend_shares` | Compartición directa de workouts entre amigos (tracking de `viewed_at`) |
| `achievements` | Definición de insignias (11 sembradas) |
| `user_achievements` | Insignias obtenidas |
| `workout_photos` | Fotos subidas por el usuario (storage_path en Supabase Storage) |
| `trainers` | Perfil de entrenador (display_name, bio, specialty, avatar_url, public_slug, instagram/tiktok/x, whatsapp_phone) |
| `trainer_clients` | Cartera del entrenador (status: invited/active/paused/archived, invite_token, goal, level, notes) |
| `trainer_routines` | Plantillas de rutina del entrenador con objetivos por meta |
| `routine_assignments` | Asigna una `trainer_routines` a un cliente específico |
| `session_comments` | Comentarios del entrenador sobre un workout completado del cliente |
| `client_checkins` | Check-ins de peso/cintura/pecho/brazo/muslo enviados por el cliente |
| `trainer_progress_shares` | Enlaces públicos de reporte de progreso, con token, expiración y `view_count` |
| `training_sessions` | Sesiones agendadas del entrenador con clientes (status: scheduled/completed/no_show/cancelled, location) |
| `client_payments` | Registros de pago por cliente (amount, currency, period_start/end, method) |
| `trainer_gallery_items` | Fotos/videos de la página pública del entrenador (storage_path, media_type) |

### Funciones PL/pgSQL clave
- `calculate_user_xp(uuid)` — XP a partir de sets + workouts
- `sync_gamification(uuid)` — Sincroniza XP + nivel + rachas + chequeo de logros
- `check_achievements(uuid)` — Otorga insignias según estadísticas
- `handle_new_user()` — Trigger: crea perfil al registrarse
- `sync_user_email()` — Trigger: mantiene sincronizado el email del perfil
- `get_user_email(uuid)` / `get_users_emails(uuid[])` — RPCs para lookup de email

### Storage buckets
- `workout-photos` — fotos de workout (máx. 5 por workout, 5MB c/u)
- `profile-avatars` — avatar único por usuario/entrenador (público, 5MB, jpeg/png/webp)
- `trainer-gallery` — hasta 12 items por entrenador (público, 20MB, imágenes + video, video ≤30s)

### Migraciones recientes (027–034)
027 `client_checkins` · 028 `trainer_progress_shares` · 029 `training_sessions` · 030 `client_payments` · 031 `public_slug` en `trainers` · 032 `avatar_url` + bucket `profile-avatars` · 033 redes sociales del entrenador + `trainer_gallery_items` · 034 RLS para subida directa desde cliente a Storage.

## 5. API (`app/api/`)

Todas las rutas siguen el patrón de doble cliente:
- **authClient** (`createServerClient` con cookies) — valida la sesión
- **adminClient** / `createAdminClient()` (service_role) — lee datos de otros usuarios saltando RLS

Grupos principales:
- `achievements`, `gamification`, `dashboard-stats`, `user-stats`, `equipment`
- `exercises` (`/progress`, `/user-exercises`), `custom-exercises[/[id]]`
- `workouts/*` — cancel, comments (+ unread), complete, photos, sets, share, share-to-friend, assigned/start
- `templates[/[id]]`
- `friends[/[id], /accept, /decline, /request, /shares]`
- `checkins`
- `profile/{avatar, stats}`, `user/subscription`, `register`, `users/[id]/profile`, `users/search`
- `push/{settings, status, subscribe}` — Web Push
- `shared/[token]` (workout compartido), `reporte/[token]` (reporte de progreso público)
- `sessions/upcoming`
- `admin/{admins, exercises-top, stats, trainers, users}`
- `trainer/*` — avatar, claim-invite, clients (+ subrecursos), gallery, me, pending-invites (+ approve/reject), routines, sessions
- `public/trainers/[slug][/gallery, /leads]` — página pública, sin auth, usa service_role
- `cron/daily-reminder` — recordatorio push diario de entrenamiento, protegido por `CRON_SECRET`, salta fines de semana
- `cron/trainer-weekly-summary` — resumen semanal push a entrenadores (adherencia/rachas de clientes), protegido por `CRON_SECRET`

`lib/cron/auth.ts` expone `verifyCronSecret(request)`, que valida la variable de entorno `CRON_SECRET` contra el header `Authorization: Bearer <CRON_SECRET>`.

## 6. Lógica de negocio clave

### Flujo de workout
1. **Crear** → `POST /api/workouts` → elegir músculos → `lib/workout/exercise-planner.ts` selecciona ejercicios
2. **Sesión activa** → `WorkoutContext` gestiona estado (sets, timer, progreso, autosave)
3. **Completar set** → modal motivacional → celebración de PR si hay récord nuevo → sync de gamificación
4. **Completar workout** → modal de finalización pendiente → fotos → compartir/guardar plantilla → home
5. **Cancelar** → borra workout + sets

### Smart Coach (generador de rutinas con IA)
Algoritmo basado en reglas (NO un LLM) en `lib/workout/exercise-planner.ts`:
- Clasifica ejercicios por patrón de movimiento + rol (compuesto/aislamiento)
- Distribuye entre grupos musculares con asignación ponderada
- Rangos de sets/reps según objetivo (fuerza/hipertrofia/resistencia/general)
- Usa solo ejercicios curados con `smart_enabled=true` (~122)

### Gamificación
- **XP**: 10 por set completado + 25 por workout completado
- **Nivel**: `floor(sqrt(xp / 100)) + 1` → Principiante(1) → Leyenda(9)
- **Rachas**: cálculo PL/pgSQL en servidor
- **11 logros**: otorgados automáticamente vía `check_achievements()`

### Sistema social (amigos)
- Búsqueda por **email exacto** (no parcial)
- Solicitudes de amistad: pending → accepted (filas bidireccionales en `friends`)
- DELETE cancela ambas filas de `friends` + actualiza estado en `friend_requests`
- Los datos de perfil de amigos se recalculan desde los workouts crudos (no desde `profiles` desactualizado)
- `friend_shares`: compartición directa de workouts con tracking de `viewed_at`

### Sistema de fotos
- Subida al bucket `workout-photos` de Supabase Storage (máx. 5 por workout, 5MB c/u)
- Tabla `workout_photos` para metadata
- Se muestran en: pantalla de finalización, historial, vistas compartidas

### Avatares y galería de entrenador
- Bucket `profile-avatars` (público, 5MB, jpeg/png/webp) — un avatar por usuario o entrenador, se borra el archivo anterior al reemplazar (`lib/avatar/storage.ts`)
- Bucket `trainer-gallery` (público, 20MB, imágenes + video) — hasta 12 items por entrenador, video limitado a 30s (validado client-side antes de subir)
- `lib/media/image.ts` (`reencodeImageAsJpeg`) recorta/reescala/recomprime imágenes en el navegador antes de subir (avatares, fotos, galería)
- `<Avatar>` (`app/components/Avatar.tsx`) renderiza foto o inicial de fallback; prop `expandable` abre un lightbox
- `<MediaLightbox>` es el visor genérico de imagen/video reutilizado por la galería y por el lightbox de `Avatar`

### Sistema de entrenador
- **Roles**: un usuario se convierte en entrenador mediante una fila en `trainers` (creada desde `/admin`), protegido por `checkTrainerAccess()` en `lib/trainer/route.ts`
- **Ciclo de vida del cliente**: `invited` → `active` (el entrenador aprueba) → `paused`/`archived`. Altas iniciadas por el entrenador (usuario existente por email) se auto-activan; solicitudes iniciadas por el usuario (página pública o reclamo de invitación) quedan `invited` hasta que el entrenador aprueba desde la campanita de invitaciones pendientes
- **Reclamo de invitación**: `lib/trainer/claim.ts` vincula a un usuario recién registrado/logueado con una fila `trainer_clients` pendiente por `invite_token` (no auto-activa)
- **Adherencia**: `lib/trainer/adherence.ts` clasifica clientes verde/ámbar/rojo/desconocido según `lastWorkoutAt`, mostrado como semáforo en el roster y en el detalle del cliente
- **Página pública del entrenador** (`/e/[slug]`): formulario de captación de leads, avatar, bio, especialidad, iconos de redes (Instagram/TikTok/X/WhatsApp vía `lib/trainer/socialLinks.ts`), galería de foto/video — servida por `/api/public/trainers/[slug]/*` con cliente service_role (sin RLS)
- **Rutinas**: el entrenador construye plantillas basadas en objetivos (`trainer_routines`) con reps/peso/RPE objetivo por ejercicio, las asigna a un cliente (`routine_assignments`); el cliente la ve como banner en su home
- **Sesiones y pagos**: `training_sessions` (agenda) y `client_payments` alimentan badges del roster (pago pendiente/vencido) y el historial del detalle de cliente
- Rutas de entrenador en `app/(app)/entrenador/`: roster raíz, `agenda/`, `clientes/[id]/` (+ `sesiones/[workoutId]/`), `clientes/nuevo/`, `perfil/` (ajustes de perfil público), `rutinas/` (+ `[id]/`, `nueva/`)

### Sistema de check-ins
- `app/(app)/checkin/` — formulario cliente-side para registrar peso/cintura/pecho/brazo/muslo, muestra deltas frente al último check-in
- Alimenta `client_checkins` (versión trainer) y estadísticas propias del usuario

### i18n
- `lib/i18n/strings.ts`: ~540 claves, formato `{ es, en }`
- Hook `useLanguage()` + contexto `LanguageProvider`
- Preferencia en localStorage por usuario (`tg_lang_{userId}`)

### Notificaciones Push y Cron
- `lib/push.ts` gestiona suscripción/envío Web Push (VAPID)
- `public/sw.js` cachea el shell de la app (`totalgym-splash-v1`), estrategia network-first con fallback a caché para navegación, cache-then-network para el resto, y maneja los eventos `push`/`notificationclick`
- Dos cron jobs protegidos por `CRON_SECRET` (invocados externamente, p.ej. desde Vercel Cron):
  - `daily-reminder`: recordatorio diario de entrenamiento (salta sábados/domingos)
  - `trainer-weekly-summary`: resumen semanal de adherencia/rachas de clientes para entrenadores (`STREAK_HIGHLIGHT_THRESHOLD = 3`)

## 7. Convenciones de código

- **Mobile-first PWA** — sin estados hover para UI crítica (usar botones siempre visibles)
- **Español primero** — todas las claves i18n tienen `es` como principal, `en` como secundaria
- **Sin comentarios** en el código salvo que se pida explícitamente
- **Toasts de error** vía `react-hot-toast` para errores de cara al usuario
- **Funciones de servicio** en `lib/workout/service.ts` gestionan todas las llamadas API con retry + timeout

## 8. Sistema de diseño

### Paleta de color

```
Background:     #050505    (casi negro, fondo principal)
Foreground:     #fafafa    (blanco, texto principal)
Card:           #111113    (superficie oscura para cards/modales)
Border:         #27272a    (zinc-800, borde por defecto)
Muted:          #27272a    (zinc-800, superficies deshabilitadas)
Muted FG:       #a1a1aa    (zinc-400, texto secundario)
Icon:           #71717a    (zinc-500, texto/iconos terciarios)

Accent:              #eab308    (yellow-500, color de marca PRIMARIO)
Accent hover:         #ca9a04    (yellow-600)
Accent FG:            #050505    (texto negro sobre accent)
Accent Secondary:     #f97316    (orange-500)
Accent Secondary HO:  #ea580c    (orange-600)
Accent Tertiary:      #d97706    (amber-600)
Accent Tertiary HO:   #b45309    (amber-700)

Green (éxito):        #22c55e
Red (peligro):        #ef4444
```

### Tipografía

| Fuente | Variable CSS | Uso |
|--------|-------------|-----|
| Oswald | `--font-oswald` | Títulos, botones, labels |
| Rajdhani | `--font-rajdhani` | Citas, display secundario |
| Barlow Condensed | `--font-barlow` | Acentos decorativos/itálicos |
| System UI | — | Texto de párrafo |

### Jerarquía de botones

| Nivel | Estilo | Uso |
|-------|--------|-----|
| Primario | `bg-accent text-black font-bold` | CTA principal |
| Secundario | `border-2 border-accent/50 text-accent` | Acciones importantes |
| Terciario | `border border text-icon` | Acciones utilitarias |
| Peligro | `border border-red-500/30 text-red-400` | Destructivas |
| Ghost | `text-muted-foreground` | Navegación/enlaces |

Ver `CLAUDE.md` para el detalle completo de border-radius, espaciados, sombras, animaciones y patrones de diseño (headers fijos, cards, modales, etc.) — se mantienen ahí como fuente de verdad para el desarrollo diario.

## 9. Scripts de administración (`scripts/`)

Utilidades TypeScript ejecutadas manualmente (seed y curación del catálogo de ejercicios desde wger.de): `seed-exercises.ts`, `curate-{abdomen,brazos,espalda,hombros,pecho,piernas}.ts`, `tag-muscle-groups.ts`, `fix-exercise-names.ts`, `migrate-images.ts`, `clean-dupes.ts`, `find-dupes.ts`, `apply-corrections.ts`, `propose-corrections.ts`, entre otros de debug/inspección (`check-desc.ts`, `check-images-129.ts`, `debug_match.ts`, `dump-names.ts`, `list-category.ts`).

## 10. Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL              # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # Clave anon de Supabase
SUPABASE_SERVICE_ROLE_KEY             # Service role de Supabase (SOLO SERVIDOR)
NEXT_PUBLIC_GOOGLE_CLIENT_ID          # Google OAuth
GOOGLE_CLIENT_SECRET                  # Google OAuth secret
NEXT_PUBLIC_APP_URL                   # URL base de la app
NEXT_PUBLIC_EXERCISES_DB_API_KEY      # API key de wger.de
NEXT_PUBLIC_VAPID_PUBLIC_KEY          # Web Push público
VAPID_PRIVATE_KEY                     # Web Push privado
CRON_SECRET                           # Autentica las rutas /api/cron/*
```

## 11. Flujo de despliegue

Cuando se dice "despliega" o "ship it":
1. `git add -A`
2. commit con `yuncozer <daniel.krdns@gmail.com>`
3. `git push origin dev`
4. `git checkout main`
5. `git merge dev --no-ff`
6. `git push origin main`
7. `git checkout dev`
