# GreenDay CRM

Production-ready SaaS for landscaping and lawn care businesses. Schedule jobs, manage customers, optimize routes, and get paid faster.

## Features

- **Customer Management** - Track customer info, property details, service history, and photos
- **Smart Scheduling** - Drag-and-drop calendar with recurring job support
- **Route Optimization** - Optimize daily routes with Google Maps integration
- **Mobile Crew App** - Crews can check in, upload photos, complete jobs from their phones
- **Invoicing & Payments** - Create invoices, accept online payments via Stripe
- **Weather Alerts** - Automatic notifications when weather threatens scheduled jobs
- **Reports & Analytics** - Track revenue, job completion, and business metrics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Supabase/Neon)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Payments**: Stripe
- **Maps**: Google Maps API
- **Deployment**: Vercel

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/greendaycrm.git
cd greendaycrm
npm install
```

### 2. Set Up Database

Create a PostgreSQL database on [Supabase](https://supabase.com) or [Neon](https://neon.tech) (both have free tiers).

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `STRIPE_*` - Your Stripe API keys (optional for development)
- `GOOGLE_MAPS_API_KEY` - For route optimization (optional)

### 4. Push Database Schema

```bash
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

The database schema will be created automatically on first deploy if you've set up your `DATABASE_URL`.

## Project Structure

```
greendaycrm/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login, signup, onboarding
│   │   ├── (marketing)/   # Landing page, pricing
│   │   ├── dashboard/     # Main app
│   │   ├── crew/          # Mobile crew app
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── ui/            # shadcn components
│   │   └── dashboard/     # App components
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
└── public/
```

## Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| Starter | $29/mo | 1 user, 50 customers, basic features |
| Growth | $49/mo | 5 users, unlimited customers, route optimization |
| Pro | $79/mo | Unlimited users, all features, priority support |

All plans include a 14-day free trial, no credit card required.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/setup | Check database connection |
| POST | /api/auth/signup | Create new account |
| GET/POST | /api/customers | List/create customers |
| GET/PUT/DELETE | /api/customers/[id] | Manage customer |
| GET/POST | /api/jobs | List/create jobs |
| GET/PUT/DELETE | /api/jobs/[id] | Manage job |
| GET/POST | /api/invoices | List/create invoices |
| POST | /api/webhooks/stripe | Stripe webhooks |

## Development

```bash
# Run dev server
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Run linter
npm run lint
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXTAUTH_SECRET | Yes | Auth encryption key |
| NEXTAUTH_URL | Yes | App URL (http://localhost:3000 for dev) |
| STRIPE_SECRET_KEY | No | Stripe secret key |
| STRIPE_PUBLISHABLE_KEY | No | Stripe publishable key |
| GOOGLE_MAPS_API_KEY | No | Google Maps API key |

## License

MIT
