# GreenDay CRM

Simple CRM for landscapers & lawn maintenance services. Deploy to Vercel with zero terminal required.

## Features

- **Customer Management** - Track customer contact info, property details, and service history
- **Job Scheduling** - Schedule and manage lawn care jobs with status tracking
- **Service Catalog** - Define your services with default pricing and duration
- **Invoicing** - Create and track invoices, mark payments as received
- **Dashboard** - Quick overview of today's jobs, revenue, and pending work

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Frontend:** React + TypeScript + Tailwind CSS
- **Database:** Neon Postgres (serverless)
- **Deployment:** Vercel

## Deploy to Vercel (No Terminal Required)

### Step 1: Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier available)
2. Create a new project
3. Copy your connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb`)

### Step 2: Deploy to Vercel

1. Click the button below to deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/greendaycrm&env=DATABASE_URL&envDescription=Neon%20PostgreSQL%20connection%20string&envLink=https://neon.tech)

2. When prompted, add your `DATABASE_URL` environment variable (paste your Neon connection string)
3. Click Deploy!

### Step 3: Initialize the Database

After deployment, visit your app URL + `/api/setup` to initialize the database schema and seed data.

Example: `https://your-app.vercel.app/api/setup`

## Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/greendaycrm.git
cd greendaycrm

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Neon DATABASE_URL

# Initialize database
npm run db:setup

# Start dev server
npm run dev
```

Visit http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Dashboard stats and upcoming jobs |
| GET/POST | /api/customers | List/create customers |
| GET/PUT/DELETE | /api/customers/:id | Get/update/delete customer |
| GET/POST | /api/jobs | List/create jobs |
| GET/PUT/PATCH/DELETE | /api/jobs/:id | Get/update/delete job |
| GET/POST | /api/services | List/create services |
| GET/PUT/DELETE | /api/services/:id | Get/update/delete service |
| GET/POST | /api/invoices | List/create invoices |
| PATCH | /api/invoices/:id | Mark invoice as paid |

## Project Structure

```
greendaycrm/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── customers/          # Customer pages
│   │   ├── jobs/               # Jobs pages
│   │   ├── invoices/           # Invoice pages
│   │   ├── services/           # Services pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Dashboard
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Database utilities
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── scripts/                    # Database setup scripts
└── package.json
```

## License

MIT
