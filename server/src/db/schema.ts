import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/greendaycrm.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Customers table
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    property_size TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Services catalog
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    default_price REAL,
    duration_minutes INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Jobs (scheduled work)
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    service_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'scheduled',
    scheduled_date TEXT,
    scheduled_time TEXT,
    completed_date TEXT,
    price REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
  );

  -- Invoices
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    job_id TEXT,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    paid_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
  );

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
`);

// Seed some default services if empty
const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
if (serviceCount.count === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (id, name, description, default_price, duration_minutes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const defaultServices = [
    { id: 'svc-1', name: 'Lawn Mowing', description: 'Standard lawn mowing service', price: 45, duration: 60 },
    { id: 'svc-2', name: 'Hedge Trimming', description: 'Trim and shape hedges', price: 65, duration: 90 },
    { id: 'svc-3', name: 'Leaf Removal', description: 'Seasonal leaf cleanup', price: 85, duration: 120 },
    { id: 'svc-4', name: 'Fertilization', description: 'Lawn fertilization treatment', price: 55, duration: 45 },
    { id: 'svc-5', name: 'Aeration', description: 'Core aeration for lawn health', price: 95, duration: 90 },
    { id: 'svc-6', name: 'Spring Cleanup', description: 'Full spring yard cleanup', price: 150, duration: 180 },
    { id: 'svc-7', name: 'Fall Cleanup', description: 'Full fall yard cleanup', price: 175, duration: 240 },
    { id: 'svc-8', name: 'Mulching', description: 'Mulch installation', price: 120, duration: 120 },
  ];

  for (const svc of defaultServices) {
    insertService.run(svc.id, svc.name, svc.description, svc.price, svc.duration);
  }
}

export default db;
