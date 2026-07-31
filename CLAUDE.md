# CLAUDE.md — Total Gym

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.2.4 (App Router, React 19, Turbopack) |
| Language | TypeScript 5 (strict, `@/*` alias) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), CSS custom properties |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Icons | Lucide React |
| DnD | @dnd-kit (core + sortable) |
| Charts | Recharts |
| Toasts | react-hot-toast |
| Push | Web Push API (VAPID + service worker) |
| PWA | manifest.json + sw.js, install prompts |
| Images | wger.de API (exercise images), Supabase Storage (workout photos, profile avatars, trainer gallery) |
| Fonts | Oswald (headings), Rajdhani, Barlow Condensed |
| Deploy | Vercel (via git push workflow) |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role (SERVER ONLY)
NEXT_PUBLIC_GOOGLE_CLIENT_ID      # Google OAuth
GOOGLE_CLIENT_SECRET              # Google OAuth secret
NEXT_PUBLIC_APP_URL               # App base URL
NEXT_PUBLIC_EXERCISES_DB_API_KEY  # wger.de API key
NEXT_PUBLIC_VAPID_PUBLIC_KEY      # Web Push public
VAPID_PRIVATE_KEY                 # Web Push private
RESEND_API_KEY                    # Resend transactional email
RESEND_FROM_EMAIL                 # Verified sender address
WHATSAPP_CLOUD_API_TOKEN          # Meta WhatsApp Cloud API access token
WHATSAPP_CLOUD_API_PHONE_NUMBER_ID # Meta WhatsApp Business phone number ID
WHATSAPP_CLOUD_API_TEMPLATE_NAME  # Approved message template name (must be pre-created/approved in Meta Business Manager)
WHATSAPP_CLOUD_API_TEMPLATE_LANG  # Template language code (e.g. es)
```

## Project Structure

```
app/
  (app)/              # Authenticated route group (shared layout w/ UserHeader)
    admin/            # Admin dashboard (protected)
    amigos/           # Friends: list, search, requests, leaderboard, [id] detail
    checkin/          # Body weight/waist check-in entry
    entrenador/       # Trainer mode: roster, client detail, routines, agenda, public profile settings
    entrenamiento/    # Workout creation: pick muscles → exercises → start
    estadisticas/     # User stats dashboard
    historial/        # Workout history with filters
    perfil/           # Profile + achievements + settings + avatar upload
    progreso/         # Exercise progress charts (recharts)
    workout/[id]/     # Active workout session (sets, timer, photos, complete)
  api/                # ~70 API route handlers (includes /api/trainer/* and /api/public/trainers/*)
  components/         # ~57 shared React components
  e/[slug]/           # Public trainer landing page (lead capture, social links, gallery)
  reporte/[token]/    # Public shareable progress report for a trainer's client
  shared/[token]/     # Public shared workout view
  shared-friend/[id]/ # Friend-shared workout view
lib/
  admin/              # Admin auth (service_role client, route guards)
  avatar/             # Shared avatar upload/replace/remove helper (Supabase Storage)
  data/               # Static data (muscle groups, cardio, quotes, notifications)
  i18n/               # Spanish/English (~540 strings, LanguageProvider context)
  premium/            # Subscription system (free/premium plans)
  supabase/           # Browser Supabase client singleton
  trainer/            # Trainer domain: access guard, adherence, invites, slug, social links, mappers
  workout/            # Core: context, types, service, planner, classifier, progress
  auth.ts             # Client auth helpers, Google OAuth
  gamification.ts     # XP/level calculation
  push.ts             # Web Push management
supabase/migrations/  # 33 SQL migrations (001-033)
scripts/              # 22 admin/dev scripts (seeding, migration, curation)
public/               # Static assets, manifest, sw.js
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (id, email, xp, level, current_streak, longest_streak) |
| `workouts` | Workout sessions (user_id, date, name, status, started_at, completed_at) |
| `workout_sets` | Individual sets (exercise_id, reps, weight_kg, is_completed, is_cardio, distance_km, duration_minutes, exercise_order, muscle_group, description, image_url) |
| `exercises` | Master catalog (~122 curated, smart_enabled flag) from wger.de |
| `workout_templates` | Saved templates (name, exercises jsonb) |
| `custom_exercises` | User-created exercises |
| `subscriptions` | Free/premium plans (Stripe fields) |
| `admin_users` | Admin role tracking |
| `shared_workouts` | Token-based shareable links (expires 7 days) |
| `friend_requests` | Friend request lifecycle (pending → accepted/cancelled) |
| `friends` | Bidirectional friendship rows |
| `friend_shares` | Direct workout shares between friends (viewed_at tracking) |
| `achievements` | Badge definitions (11 seeded) |
| `user_achievements` | Earned badges |
| `workout_photos` | User-uploaded photos (storage_path in Supabase Storage) |
| `trainers` | Trainer profile (display_name, bio, specialty, avatar_url, public_slug, instagram/tiktok/x handle, whatsapp_phone) |
| `trainer_clients` | Trainer's roster (status: invited/active/paused/archived, invite_token, goal, level, notes) |
| `trainer_routines` | Trainer-authored routine templates with goal-based targets |
| `routine_assignments` | Assigns a `trainer_routines` row to a specific client |
| `session_comments` | Trainer comments on a client's completed workout |
| `client_checkins` | Client-submitted weight/waist check-ins |
| `trainer_progress_shares` | Token-based public progress report links (expiring, view_count) |
| `training_sessions` | Trainer's scheduled sessions with clients (agenda) |
| `client_payments` | Payment records per client (amount, currency, period, method) |
| `trainer_gallery_items` | Photos/videos on a trainer's public page (storage_path, media_type) |

### Key DB Functions (PL/pgSQL)
- `calculate_user_xp(uuid)` — XP from sets + workouts
- `sync_gamification(uuid)` — Syncs XP + level + streaks + achievement checks
- `check_achievements(uuid)` — Awards badges based on stats
- `handle_new_user()` — Trigger: creates profile on signup
- `sync_user_email()` — Trigger: keeps profile email in sync
- `get_user_email(uuid)` / `get_users_emails(uuid[])` — RPCs for email lookup

## Key Business Logic

### Workout Flow
1. **Create** → POST `/api/workouts` → picks muscles → `exercise-planner.ts` selects exercises
2. **Active session** → `WorkoutContext` manages state (sets, timer, progress, auto-save)
3. **Complete set** → motivational modal → PR celebration if new record → gamification sync
4. **Complete workout** → pending completion modal → photos → share/save template → home
5. **Cancel** → deletes workout + sets

### Smart Coach (AI Routine Generator)
Rule-based algorithm (NOT LLM) in `lib/workout/exercise-planner.ts`:
- Classifies exercises by movement pattern + role (compound/isolation)
- Distributes across muscle groups with weighted allocation
- Goal-specific set/rep ranges (fuerza/hipertrofia/resistencia/general)
- Only uses `smart_enabled=true` curated exercises (~122)

### Gamification
- **XP**: 10 per completed set + 25 per completed workout
- **Level**: `floor(sqrt(xp / 100)) + 1` → Principiante(1) → Leyenda(9)
- **Streaks**: Server-side PL/pgSQL calculation
- **11 Achievements**: auto-awarded via `check_achievements()`

### Social System (Friends)
- Search by **exact email** (not partial)
- Friend requests: pending → accepted (bidirectional `friends` rows)
- DELETE cancels both `friends` rows + updates `friend_requests` status
- Profile data for friends recalculated from raw workout data (not stale `profiles`)
- `friend_shares`: direct workout sharing with `viewed_at` tracking

### Photo System
- Upload to Supabase Storage bucket `workout-photos` (max 5 per workout, 5MB each)
- DB table `workout_photos` for metadata
- Photos displayed in: completion screen, historial, shared views

### Avatars & Trainer Gallery (Supabase Storage)
- Bucket `profile-avatars` (public, 5MB, jpeg/png/webp) — one avatar per user or trainer, old file removed on replace (`lib/avatar/storage.ts`)
- Bucket `trainer-gallery` (public, 20MB, images + video) — up to 12 items per trainer, video capped at 30s (validated client-side before upload)
- `<Avatar>` component (`app/components/Avatar.tsx`) renders photo or initial fallback; `expandable` prop opens a tap-to-enlarge lightbox
- `<MediaLightbox>` is the generic image/video viewer reused by the gallery and by `Avatar`'s internal lightbox

### Trainer System
- **Roles**: a user becomes a trainer via a row in `trainers` (created from `/admin`), gated by `checkTrainerAccess()` in `lib/trainer/route.ts`
- **Client lifecycle**: `invited` → `active` (trainer approves) → `paused`/`archived`. Trainer-initiated adds (existing user by email) auto-activate; user-initiated requests (public page or invite claim) stay `invited` until the trainer approves via the header's pending-invites bell
- **Invitation claiming**: `lib/trainer/claim.ts` links a newly registered/logged-in user to a pending `trainer_clients` row by `invite_token` (does not auto-activate)
- **Adherence**: `lib/trainer/adherence.ts` classifies clients green/amber/red/unknown from `lastWorkoutAt`, shown as a roster traffic-light and in the client detail
- **Public trainer page** (`/e/[slug]`): lead capture form, avatar, bio, specialty, social icons (Instagram/TikTok/X/WhatsApp via `lib/trainer/socialLinks.ts`), photo/video gallery — served by `/api/public/trainers/[slug]/*` using the service_role client (no RLS)
- **Routines**: trainer builds goal-based templates (`trainer_routines`) with per-exercise target reps/weight/RPE, assigns one to a client (`routine_assignments`); client sees it as a banner on home
- **Sessions & payments**: `training_sessions` (agenda) and `client_payments` feed roster badges (payment due/overdue) and the client detail history

### i18n
- `lib/i18n/strings.ts`: ~540 keys, `{ es, en }` format
- `useLanguage()` hook + `LanguageProvider` context
- Preference in localStorage per user (`tg_lang_{userId}`)

### API Pattern
- All API routes use dual client pattern:
  - `authClient` (createServerClient with cookies) — for session validation
  - `adminClient` / `createAdminClient()` (service_role) — for cross-user data, bypassing RLS
- Friend/social APIs always use service_role to read other users' profiles

## Coding Conventions

- **Mobile-first PWA** — no hover states for critical UI (use always-visible buttons)
- **Spanish-first** — all i18n keys have `es` as primary, `en` as secondary
- **No comments** in code unless explicitly requested
- **Toast errors** via `react-hot-toast` for user-facing errors
- **Service functions** in `lib/workout/service.ts` handle all API calls with retry + timeout

## Design System

### Color Palette

```
Background:     #050505    (near-black, main bg)
Foreground:     #fafafa    (white, main text)
Card:           #111113    (dark surface for cards/modals)
Border:         #27272a    (zinc-800, default border)
Muted:          #27272a    (zinc-800, disabled surfaces)
Muted FG:       #a1a1aa    (zinc-400, secondary text)
Icon:           #71717a    (zinc-500, tertiary text/icons)

Accent:         #eab308    (yellow-500, PRIMARY brand color)
Accent hover:   #ca9a04    (yellow-600)
Accent FG:      #050505    (black text on accent)

Accent Secondary:    #f97316    (orange-500)
Accent Secondary HO: #ea580c    (orange-600)

Accent Tertiary:     #d97706    (amber-600)
Accent Tertiary HO:  #b45309    (amber-700)

Green (success):     #22c55e    (green-500)
Green bg:            rgba(34,197,94,0.1-0.2)
Green border:        rgba(34,197,94,0.3)

Red (danger):        #ef4444    (red-500)
Red bg:              rgba(239,68,68,0.1)
Red border:          rgba(239,68,68,0.3)
```

### Tailwind Theme Tokens

Use these instead of raw colors:
- `bg-background` / `bg-card` / `bg-muted`
- `text-foreground` / `text-muted-foreground` / `text-icon`
- `text-accent` / `bg-accent` / `border-accent`
- `text-accent-secondary` / `bg-accent-secondary`
- `text-accent-tertiary` / `bg-accent-tertiary`
- `border-border` (default) / `border-accent/30` (accent with opacity)

### Typography

| Font | CSS Variable | Usage | Weights |
|------|-------------|-------|---------|
| **Oswald** | `--font-oswald` | Headings, titles, buttons, labels | 400, 500, 600, 700 |
| **Rajdhani** | `--font-rajdhani` | Quotes, secondary display | 400-700 |
| **Barlow Condensed** | `--font-barlow` | Decorative/italic accents | 800 italic |
| System UI | — | Body text, paragraphs | — |

Apply via: `style={{ fontFamily: "var(--font-oswald)" }}`

### Button Hierarchy

| Tier | Style | Use Case |
|------|-------|----------|
| **Primary** | `bg-accent text-black font-bold` + hover | Main CTA (start workout, go home) |
| **Secondary** | `border-2 border-accent/50 text-accent` + hover | Important actions (share, save) |
| **Tertiary** | `border border text-icon hover:text-accent` | Utility actions (photo, template, history) |
| **Danger** | `border border-red-500/30 text-red-400 hover:bg-red-500/10` | Destructive (cancel, delete) |
| **Ghost** | `text-muted-foreground hover:text-white` | Navigation, text links |

### Border Radius

- Cards: `rounded-xl` (12px) or `rounded-2xl` (16px)
- Buttons: `rounded-xl` (12px)
- Inputs: `rounded-xl` (12px)
- Badges/pills: `rounded-full`
- Thumbnails: `rounded-xl` (12px)
- Modals: `rounded-2xl` (16px)

### Spacing Patterns

- Page padding: `px-4`
- Card padding: `p-4` to `p-6`
- Section gaps: `mb-6` to `mb-8`
- Between stacked buttons: `gap-3` or `mb-4`
- Header clearance: `pt-24` (for fixed header)

### Shadows & Effects

- Accent glow: `shadow-lg shadow-accent/30`
- Card hover glow: `box-shadow: 0 0 20-30px rgba(234,179,8,0.15-0.3)`
- Glass effect: `bg-background/90 backdrop-blur-md` (headers)
- Backdrop overlay: `bg-black/60 backdrop-blur-sm` (modals)

### Animations (CSS keyframes in globals.css)

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-pulse-glow` | Accent glow pulse | 2s infinite |
| `animate-fade-in-up` | Fade in + slide up | 0.6s |
| `animate-slide-up` | Slide from bottom | 0.35s |
| `animate-fade-in` | Simple fade | 0.2s |
| `animate-shimmer` | Horizontal shimmer (CTA buttons) | 1.5s infinite |
| `animate-bounce-check` | Checkmark bounce | 0.4s |
| `animate-ia-sparkle` | Sparkle rotation (Smart Coach) | 2.5s infinite |
| `animate-ia-badge` | Badge pulse (Smart Coach) | 2s infinite |
| `animate-ia-gradient` | Gradient shift | 4s infinite |
| `animate-coach-pulse` | Coach avatar pulse | 2s infinite |
| `animate-coach-think` | Coach thinking state | 0.9s |
| `animate-badge-think` | Badge border pulse | 0.9s |
| `animate-step-slide-in/out` | Wizard step transitions | 0.35s/0.25s |
| `animate-fade-in-down` | Fade in from top | — |
| `animate-scale-in` | Scale up from 0.9 | — |
| `animate-friends-pulse` | Friends button pulse | — |
| `animate-medallion-pulse` | Profile medallion glow | — |

### Scrollbar

Custom styled: thin (6px), dark track (`#18181b`), zinc thumb (`#3f3f46`).

### Key Design Patterns

1. **Fixed header**: `sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border`
2. **Card style**: `bg-card border border rounded-xl` or `rounded-2xl`
3. **Input style**: `bg-background border border rounded-xl text-white px-4 py-3`
4. **Section title**: Oswald uppercase, accent color, tracking-widest: `text-xs font-bold text-accent uppercase tracking-widest`
5. **Stats display**: Large Oswald number + small muted label
6. **Modal overlay**: `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4`
7. **Modal content**: `bg-[#111113] border border rounded-2xl p-6 w-full max-w-sm`
8. **Empty state**: Centered icon + muted text
9. **Progress bar**: `h-2 bg-muted rounded-full` with `bg-accent` fill
10. **Avatar**: Rounded with accent ring/border, fallback to initial letter

### PWA Visual Identity

- Standalone display, portrait orientation
- Dark background `#0a0a0a`
- Accent `#eab308` for theme-color
- Splash screens for multiple iOS device sizes
- App name: "TOTAL GYM" (Oswald, gold accent on "GYM")

## Deploy Workflow

When user says **"despliega"** or **"ship it"**:
1. `git add -A`
2. commit with `yuncozer <daniel.krdns@gmail.com>`
3. `git push origin dev`
4. `git checkout main`
5. `git merge dev --no-ff`
6. `git push origin main`
7. `git checkout dev`
