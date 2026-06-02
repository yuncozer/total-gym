# TOTAL GYM

Your personal gym companion — create workouts, track every set, and watch your progress over time. Bilingual (Spanish/English), works offline, installs on your phone.

> **Live:** [total-gym.vercel.app](https://total-gym.vercel.app)

---

## For Users

### What is Total Gym?

Total Gym is a **Progressive Web App** designed for people who go to the gym and want a simple, focused tool to:

- Plan a workout in seconds (pick a muscle group, choose exercises, and go)
- Log sets, reps, and weight as you train
- See your history and progress with charts
- Stay consistent with daily reminders

No account needed to browse — but sign up to save everything.

### Key Features

| Feature | Description |
|---------|-------------|
| **Quick workout creation** | Select muscle group → equipment → exercises → start. Done. |
| **Live set tracking** | Tap to complete a set, timer tracks rest between sets |
| **Cardio support** | Log distance, duration, or HIIT-style intervals |
| **Workout history** | See every workout you've done, filter by day/week/month/year |
| **Progress charts** | Pick an exercise and view max weight, reps, or volume over time |
| **Statistics dashboard** | Total workouts, sets, weight lifted, streaks, monthly counts |
| **Custom exercises** | Create exercises not in the default library |
| **Workout templates** | Save your favorite routines and reuse them |
| **Motivational celebrations** | Fun animations after completing sets |
| **Intro video** | Quick motivational video before starting a workout |
| **Push notifications** | Daily reminder to train (weekdays at 10 AM) |
| **Offline fallback** | Basic exercise data available without internet |
| **PWA installable** | Add to your home screen — works like a native app |
| **Dark theme** | Easy on the eyes, always dark mode |

### Getting Started

```
1. Go to total-gym.vercel.app
2. Create an account (email + password, or Google)
3. Tap "ENTRENAMIENTO" in the nav
4. Select a muscle group
5. Choose equipment (or "Todos" for all)
6. Pick your exercises
7. Review and tap "INICIAR ENTRENAMIENTO"
```

### User Flows

#### Create & Start a Workout

```
/entrenamiento
  → Select muscle group (e.g., "Pecho")
  → Filter by equipment (e.g., "Barra", "Mancuernas")
  → Browse exercises with images and descriptions
  → Tap to select/deselect
  → Review summary (3 sets per exercise, 1 for cardio)
  → Adjust sets per exercise if needed
  → Tap "INICIAR ENTRENAMIENTO"
  → Watch intro video (skip anytime)
  → Redirected to your active workout
```

#### Execute a Workout

```
/workout/[id]
  → See all exercises with their sets
  → Tap a set to mark it as completed (with celebration)
  → Timer tracks rest between sets automatically
  → Add extra sets to any exercise mid-workout
  → Add new exercises on the fly
  → Complete workout → saved to history
  → Cancel workout → marked as cancelled

Tip: Swipe or use the nav to move between exercises.
```

#### Review History

```
/historial
  → See all completed workouts sorted by date
  → Filter: This week, last week, this month, last month, year, or a specific day
  → Weekly activity bar chart shows your consistency
  → Tap any workout to see exercise details
  → Delete workouts you don't want to keep
```

#### Track Progress

```
/progreso
  → Select an exercise from the dropdown
  → Choose metric: Max Weight, Max Reps, or Volume
  → View an interactive line chart over time
  → See your personal bests at a glance
```

#### View Statistics

```
/estadisticas
  → Animated counters: total workouts, total sets, total weight lifted
  → Current streak (consecutive days)
  → Monthly workout count
  → Most frequent exercise
```

#### Profile & Settings

```
/perfil
  → Update personal info: height, weight, level, goal
  → Toggle notification preferences
  → Subscribe/unsubscribe to push notifications
```

#### Admin Panel (admin users only)

```
/admin
  → Global platform stats (total users, workouts, sets)
  → User list with workout counts
  → Top 20 most-used exercises
  → Add/remove admin users
```

---

## For Developers

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS 4 (dark-only) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase SSR (email/password + Google OAuth) |
| **Charts** | Recharts |
| **Notifications** | Web Push API |
| **Icons** | Lucide React |
| **Fonts** | Oswald, Rajdhani, Barlow Condensed |
| **Payments** | Stripe (premium subscriptions) |

### Project Structure

```
total-gym/
├── app/
│   ├── (app)/                    # Authenticated pages
│   │   ├── admin/                # Admin dashboard
│   │   ├── entrenamiento/        # Workout creation wizard
│   │   ├── estadisticas/         # Statistics dashboard
│   │   ├── historial/            # Workout history
│   │   ├── perfil/               # Profile & settings
│   │   ├── progreso/             # Progress charts
│   │   ├── workout/[id]/         # Active workout session
│   │   └── layout.tsx            # Authenticated layout
│   ├── api/                      # 24 API endpoints
│   ├── auth/callback/            # OAuth callback
│   ├── components/               # 20 shared components
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── lib/
│   │   └── wgerApi.ts            # wger.de API client
│   ├── page.tsx                  # Home / dashboard
│   └── globals.css               # Tailwind styles
├── lib/
│   ├── i18n/                     # Spanish/English translations
│   ├── workout/                  # Workout domain (context, service, types, progress)
│   ├── supabase/                 # Supabase client setup
│   ├── premium/                  # Free vs premium gating
│   ├── admin/                    # Admin auth helpers
│   └── push.ts                   # Push notification hook
├── public/                       # Static assets, PWA files
├── supabase/
│   ├── schema.sql                # Full database schema
│   └── migrations/               # Incremental migrations
├── scripts/                      # Utility scripts
├── AGENTS.md                     # LLM agent instructions
└── CLAUDE.md                     # LLM context file
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (height, weight, level, goal) |
| `workouts` | Workout sessions (status: pending/completed/cancelled) |
| `workout_sets` | Individual sets within a workout |
| `subscriptions` | Premium subscription status |
| `workout_templates` | Saved workout templates |
| `custom_exercises` | User-created exercises |
| `push_subs` | Push notification subscriptions |
| `admin_users` | Admin registry |

Full schema: `supabase/schema.sql`

### Setup

```bash
npm install
npm run dev        # http://localhost:3000
```

#### Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:you@example.com

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### Deployment

1. Push to GitHub.
2. Import in **Vercel**.
3. Set environment variables.
4. Deploy.

**Supabase:** Run `supabase/schema.sql` in the SQL editor, then each migration in order. Enable Google OAuth in Auth settings.

**Cron job** (daily reminders): Hit `POST /api/cron/daily-reminder` on weekdays. Use Vercel Cron Jobs or cron-job.org with `CRON_SECRET` header.

### Architecture Notes

- **Exercise data** comes from [wger.de API v2](https://wger.de), cached for 24 hours (`s-maxage=86400`), with offline fallback in `public/data/`.
- **Workout state** is managed via a React Context (`lib/workout/context.tsx`) that tracks exercises, sets, timer, and CRUD operations.
- **Free tier:** Users without premium can only view the last 30 days of history.
- **i18n:** Custom `LanguageProvider` context; preference stored in `localStorage` with key `tg_lang_{userId}`.
- **Push notifications:** Service worker at `/sw.js`, subscriptions stored in `push_subs` table.

### Components

| Component | Description |
|-----------|-------------|
| `AddExerciseModal` | Add exercises mid-workout |
| `AuthModal` | Login/register modal |
| `ConfirmModal` | Confirmation dialogs |
| `CreateCustomExerciseModal` | Custom exercise form |
| `EjercicioCard` | Exercise card with image and equipment |
| `ErrorBanner` | Dismissible error message |
| `GuestCarousel` | Feature showcase for guests |
| `LoadingScreen` | Full-screen loading overlay |
| `MotivationalModal` | Celebrations after completing sets |
| `NotificationBanner` | PWA install prompt |
| `NotificationButton` | Push notification subscribe/unsubscribe |
| `OfflineBanner` | Offline detection alert |
| `RegisterModal` | Inline registration form |
| `SaveTemplateModal` | Save workout as template |
| `TemplateSelector` | Load/delete templates |
| `UserHeader` | Top navigation bar |
| `WorkoutIntroVideo` | Pre-workout intro video overlay |
| `WorkoutPhotoOverlay` | Shareable post-workout photo |

---

## License

[Add your license here]
