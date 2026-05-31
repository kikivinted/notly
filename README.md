# Notly — Community ratings for YouTube

Notly is a Letterboxd-style platform where the community rates YouTube videos. Content creators subscribe to list their channel; videos with high ratings rise in a quality-first algorithm.

## Tech stack

- **Frontend / Backend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (Syne + DM Sans fonts, dark theme)
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (email + Google OAuth)
- **Payments**: Stripe (recurring subscriptions)
- **YouTube**: YouTube Data API v3
- **Deployment**: Vercel

---

## 1. Local setup

### Prerequisites
- Node.js 18+
- A Supabase project
- A Stripe account
- A Google Cloud project with YouTube Data API v3 enabled

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.local` and fill in all values (see §2 below):

```bash
cp .env.local .env.local.bak  # keep a backup
# then edit .env.local with your real values
```

### Run Supabase migrations (see §3)

### Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 2. Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL — found in Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **never expose client-side** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (Dashboard → Developers → API keys) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (see §4) |
| `STRIPE_CREATOR_PRICE_ID` | Price ID of the Creator Pro product in Stripe |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key (see §5) |
| `YOUTUBE_CLIENT_ID` | Google OAuth client ID (for future YouTube OAuth flow) |
| `YOUTUBE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_SECRET` | Random 32+ char secret — run `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Full URL of your app, e.g. `http://localhost:3000` |
| `CRON_SECRET` | Secret token for cron job endpoints — run `openssl rand -base64 32` |

---

## 3. Supabase migrations

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```bash
   npm install -g supabase
   ```

2. Log in and link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Your project ref is in the Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`.

3. Push the migration:
   ```bash
   supabase db push
   ```
   This applies `supabase/migrations/001_initial_schema.sql` which creates all tables, indexes, RLS policies, triggers, and stored functions.

4. **Alternative — run directly in the SQL editor:**
   Open Supabase Dashboard → SQL Editor, paste the content of `supabase/migrations/001_initial_schema.sql`, and run it.

5. Enable Google OAuth in Supabase:
   - Dashboard → Authentication → Providers → Google
   - Add your Google OAuth Client ID and Secret
   - Set the redirect URL in Google Cloud Console to: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

---

## 4. Stripe webhooks

### Create the Creator Pro product

1. Stripe Dashboard → Products → Add product
2. Name: "Creator Pro", Price: 9.00 EUR/month recurring
3. Copy the **Price ID** (starts with `price_`) → set as `STRIPE_CREATOR_PRICE_ID`

### Configure the webhook

**Local development** (using Stripe CLI):
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook signing secret printed → set as STRIPE_WEBHOOK_SECRET
```

**Production (Vercel)**:
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/stripe/webhook`
3. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

---

## 5. YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **YouTube Data API v3**:
   - APIs & Services → Library → search "YouTube Data API v3" → Enable
4. Create an API key:
   - APIs & Services → Credentials → Create credentials → API key
   - (Recommended) Restrict the key to YouTube Data API v3
   - Copy it → set as `YOUTUBE_API_KEY`
5. For OAuth (future YouTube channel connection via OAuth instead of Channel ID):
   - Create credentials → OAuth 2.0 Client ID → Web application
   - Add `http://localhost:3000` as authorized origin
   - Copy Client ID and Secret → set `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`

---

## 6. Cron jobs (top charts)

Top charts are computed by calling `/api/cron/tops`. Set up a cron job via:

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/tops",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/youtube/sync",
      "schedule": "0 4 * * *"
    }
  ]
}
```

The endpoints are protected by `Authorization: Bearer CRON_SECRET`.

---

## 6b. Seeding the video database

To pre-populate Notly with hundreds of thousands of popular YouTube videos, run the seed script once after setup:

```bash
# Make sure your .env.local has YOUTUBE_API_KEY and SUPABASE_* set
npm run seed
```

The script imports the **most popular videos** from 55+ countries and 16 categories. With the free YouTube API quota (10,000 units/day), one run imports ~**50,000–100,000 videos**.

Run it once to get started. After that, the nightly cron at `/api/cron/seed` keeps the database fresh by importing new trending videos every day.

> **Note**: The seed script takes 5–15 minutes to run. You can interrupt it at any time — already-imported videos are saved.

---

## 7. Project structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── discover/                   # Browse & search
│   ├── video/[id]/                 # Video detail + rating
│   ├── creator/
│   │   ├── [id]/                   # Public creator profile
│   │   └── dashboard/              # Creator dashboard (protected)
│   │       ├── page.tsx            # Stats overview
│   │       ├── videos/             # Video list
│   │       ├── channel/            # YouTube connection
│   │       └── billing/            # Stripe billing
│   ├── dashboard/                  # Viewer dashboard (ratings history)
│   ├── top/
│   │   ├── monthly/                # Monthly top 50
│   │   └── semester/               # Semester top 50
│   ├── admin/                      # Admin panel (role-protected)
│   ├── login/ register/            # Auth pages
│   ├── auth/callback/              # OAuth redirect
│   ├── pricing/ about/             # Marketing pages
│   └── api/
│       ├── ratings/                # POST/DELETE/GET ratings
│       ├── stripe/
│       │   ├── checkout/           # Create Stripe session
│       │   ├── portal/             # Stripe billing portal
│       │   └── webhook/            # Stripe webhook handler
│       ├── youtube/
│       │   ├── connect/            # Connect a channel
│       │   └── sync/               # Sync videos
│       └── cron/tops/              # Compute top charts
├── components/
│   ├── layout/                     # Navbar, Footer
│   ├── ui/                         # VideoCard, StarRating, Button, etc.
│   ├── discover/                   # DiscoverFilters
│   └── video/                      # VideoPlayer, RatingWidget
├── lib/
│   ├── supabase/                   # client / server / admin clients
│   ├── stripe.ts                   # Stripe helpers
│   ├── youtube.ts                  # YouTube Data API helpers
│   ├── utils.ts                    # Formatting, scoring
│   └── algorithm.ts                # Ranking score formula
├── types/index.ts                  # TypeScript types
supabase/
└── migrations/001_initial_schema.sql
```

---

## 8. Scoring algorithm

```
score = (avg_rating × 0.6) + (log(total_votes + 1) × 0.3) + (recency_factor × 0.1)
```

- `recency_factor = 1` for videos < 7 days old, then decays over time
- New creators (< 3 months) get extra visibility in the feed

---

## 9. Creating an admin user

After registering, run this in the Supabase SQL editor:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 10. Deployment (Vercel)

```bash
npm install -g vercel
vercel --prod
```

Set all environment variables in the Vercel dashboard under Project → Settings → Environment Variables. Make sure `NEXT_PUBLIC_APP_URL` points to your production domain.
