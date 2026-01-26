import { Router } from 'express';
import db from '../db/schema.js';

const router = Router();

// Get dashboard stats
router.get('/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Total customers
  const totalCustomers = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as any).count;

  // Jobs today
  const jobsToday = (db.prepare('SELECT COUNT(*) as count FROM jobs WHERE scheduled_date = ?').get(today) as any).count;

  // Jobs this week
  const jobsThisWeek = (db.prepare('SELECT COUNT(*) as count FROM jobs WHERE scheduled_date >= ?').get(weekAgo) as any).count;

  // Pending jobs
  const pendingJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'scheduled'").get() as any).count;

  // Completed jobs this month
  const completedThisMonth = (db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE status = 'completed' AND completed_date >= ?
  `).get(monthAgo) as any).count;

  // Revenue this month (from paid invoices)
  const revenueThisMonth = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM invoices
    WHERE status = 'paid' AND paid_date >= ?
  `).get(monthAgo) as any).total;

  // Pending invoices total
  const pendingInvoices = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM invoices
    WHERE status = 'pending'
  `).get() as any);

  res.json({
    totalCustomers,
    jobsToday,
    jobsThisWeek,
    pendingJobs,
    completedThisMonth,
    revenueThisMonth,
    pendingInvoicesTotal: pendingInvoices.total,
    pendingInvoicesCount: pendingInvoices.count
  });
});

// Get upcoming jobs (next 7 days)
router.get('/upcoming-jobs', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const jobs = db.prepare(`
    SELECT j.*, c.name as customer_name, c.address as customer_address,
           c.phone as customer_phone, s.name as service_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN services s ON j.service_id = s.id
    WHERE j.scheduled_date >= ? AND j.scheduled_date <= ? AND j.status = 'scheduled'
    ORDER BY j.scheduled_date ASC, j.scheduled_time ASC
    LIMIT 10
  `).all(today, weekLater);

  res.json(jobs);
});

// Get recent activity
router.get('/recent-activity', (req, res) => {
  const recentJobs = db.prepare(`
    SELECT 'job' as type, j.id, j.title as description, j.status, j.updated_at as timestamp,
           c.name as customer_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    ORDER BY j.updated_at DESC
    LIMIT 5
  `).all();

  const recentInvoices = db.prepare(`
    SELECT 'invoice' as type, i.id,
           'Invoice #' || substr(i.id, 1, 8) || ' - $' || i.amount as description,
           i.status, i.created_at as timestamp, c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    ORDER BY i.created_at DESC
    LIMIT 5
  `).all();

  // Combine and sort by timestamp
  const activity = [...recentJobs, ...recentInvoices]
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  res.json(activity);
});

export default router;
