import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';

const router = Router();

// Get all jobs with customer and service info
router.get('/', (req, res) => {
  const { status, date, customer_id } = req.query;

  let query = `
    SELECT j.*, c.name as customer_name, c.address as customer_address,
           c.phone as customer_phone, s.name as service_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN services s ON j.service_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND j.status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND j.scheduled_date = ?';
    params.push(date);
  }
  if (customer_id) {
    query += ' AND j.customer_id = ?';
    params.push(customer_id);
  }

  query += ' ORDER BY j.scheduled_date ASC, j.scheduled_time ASC';

  const jobs = db.prepare(query).all(...params);
  res.json(jobs);
});

// Get single job
router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, c.name as customer_name, c.address as customer_address,
           c.phone as customer_phone, c.email as customer_email,
           s.name as service_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN services s ON j.service_id = s.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// Create job
router.post('/', (req, res) => {
  const { customer_id, service_id, title, description, scheduled_date, scheduled_time, price, notes } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO jobs (id, customer_id, service_id, title, description, scheduled_date, scheduled_time, price, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, customer_id, service_id, title, description, scheduled_date, scheduled_time, price, notes);

  const job = db.prepare(`
    SELECT j.*, c.name as customer_name, s.name as service_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN services s ON j.service_id = s.id
    WHERE j.id = ?
  `).get(id);

  res.status(201).json(job);
});

// Update job
router.put('/:id', (req, res) => {
  const { customer_id, service_id, title, description, status, scheduled_date, scheduled_time, completed_date, price, notes } = req.body;

  const result = db.prepare(`
    UPDATE jobs
    SET customer_id = ?, service_id = ?, title = ?, description = ?, status = ?,
        scheduled_date = ?, scheduled_time = ?, completed_date = ?, price = ?,
        notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(customer_id, service_id, title, description, status, scheduled_date, scheduled_time, completed_date, price, notes, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const job = db.prepare(`
    SELECT j.*, c.name as customer_name, s.name as service_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN services s ON j.service_id = s.id
    WHERE j.id = ?
  `).get(req.params.id);

  res.json(job);
});

// Quick status update
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const completed_date = status === 'completed' ? new Date().toISOString().split('T')[0] : null;

  const result = db.prepare(`
    UPDATE jobs SET status = ?, completed_date = ?, updated_at = datetime('now') WHERE id = ?
  `).run(status, completed_date, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const job = db.prepare(`
    SELECT j.*, c.name as customer_name, s.name as service_name
    FROM jobs j
    LEFT JOIN customers c ON j.customer_id = c.id
    LEFT JOIN services s ON j.service_id = s.id
    WHERE j.id = ?
  `).get(req.params.id);

  res.json(job);
});

// Delete job
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.status(204).send();
});

export default router;
