# GreenDay CRM

Simple CRM for landscapers & lawn maintenance services.

## Features

- **Customer Management** - Track customer contact info, property details, and service history
- **Job Scheduling** - Schedule and manage lawn care jobs with status tracking
- **Service Catalog** - Define your services with default pricing and duration
- **Invoicing** - Create and track invoices, mark payments as received
- **Dashboard** - Quick overview of today's jobs, revenue, and pending work

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (via better-sqlite3)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install all dependencies
npm run install:all

# Start development servers (frontend + backend)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Build for Production

```bash
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/dashboard/upcoming-jobs | Next 7 days of scheduled jobs |
| GET/POST | /api/customers | List/create customers |
| GET/PUT/DELETE | /api/customers/:id | Get/update/delete customer |
| GET/POST | /api/jobs | List/create jobs |
| GET/PUT/DELETE | /api/jobs/:id | Get/update/delete job |
| PATCH | /api/jobs/:id/status | Quick status update |
| GET/POST | /api/services | List/create services |
| GET/PUT/DELETE | /api/services/:id | Get/update/delete service |
| GET/POST | /api/invoices | List/create invoices |
| PATCH | /api/invoices/:id/pay | Mark invoice as paid |

## Project Structure

```
greendaycrm/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   └── db/             # Database schema
│   └── ...
└── package.json            # Root package with dev scripts
```

## License

MIT
