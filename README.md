# 🌿 Green Day CRM

A simple, easy-to-use CRM (Customer Relationship Management) system designed specifically for landscapers and lawn maintenance services.

## Features

- **Customer Management** - Store and manage customer information, contact details, and service history
- **Service Catalog** - Define your services with pricing and duration
- **Staff Management** - Manage your crew members and their specializations
- **Job Scheduling** - Schedule jobs, assign staff, and track job status
- **Invoicing** - Generate and track invoices for completed jobs
- **Dashboard** - View today's schedule, key metrics, and business overview

## Installation

1. Clone the repository:
```bash
git clone https://github.com/prtkgpt/greendaycrm.git
cd greendaycrm
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Getting Started

1. **Add Services** - Start by defining your services (e.g., Lawn Mowing, Edging, Landscaping)
2. **Add Staff** - Add your crew members and their specializations
3. **Add Customers** - Create customer profiles with contact information
4. **Schedule Jobs** - Create jobs by selecting customer, service, date, and assigning staff
5. **Generate Invoices** - Create invoices for completed jobs and track payments

### Dashboard

The dashboard provides:
- Quick stats (total customers, scheduled jobs, revenue, pending invoices)
- Today's schedule with customer details and service information

### Managing Data

Each section (Customers, Services, Staff, Jobs, Invoices) allows you to:
- **Add** - Create new records using the "Add" button
- **Edit** - Modify existing records using the "Edit" button
- **Delete** - Remove records using the "Delete" button

### Job Status Options

- **Scheduled** - Job is planned for a future date
- **In Progress** - Job is currently being worked on
- **Completed** - Job is finished
- **Cancelled** - Job was cancelled

### Invoice Status Options

- **Pending** - Invoice has been sent but not paid
- **Paid** - Invoice has been paid
- **Overdue** - Invoice is past due date

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Project Structure

```
greendaycrm/
├── server/
│   ├── server.js      # Express server and API routes
│   └── database.js    # Database initialization and schema
├── public/
│   ├── index.html     # Main HTML file
│   ├── css/
│   │   └── style.css  # Styles
│   └── js/
│       └── app.js     # Frontend JavaScript
├── package.json
└── README.md
```

## API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Staff
- `GET /api/staff` - Get all staff members
- `POST /api/staff` - Create new staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/today` - Get today's jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## License

ISC
