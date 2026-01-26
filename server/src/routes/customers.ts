import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';

const router = Router();

// Get all customers
router.get('/', (req, res) => {
  const customers = db.prepare(`
    SELECT c.*,
           COUNT(DISTINCT j.id) as total_jobs,
           SUM(CASE WHEN j.status = 'completed' THEN 1 ELSE 0 END) as completed_jobs
    FROM customers c
    LEFT JOIN jobs j ON c.id = j.customer_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(customers);
});

// Get single customer with jobs
router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const jobs = db.prepare(`
    SELECT j.*, s.name as service_name
    FROM jobs j
    LEFT JOIN services s ON j.service_id = s.id
    WHERE j.customer_id = ?
    ORDER BY j.scheduled_date DESC
  `).all(req.params.id);

  const invoices = db.prepare(`
    SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ ...customer, jobs, invoices });
});

// Create customer
router.post('/', (req, res) => {
  const { name, email, phone, address, city, state, zip, property_size, notes } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO customers (id, name, email, phone, address, city, state, zip, property_size, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email, phone, address, city, state, zip, property_size, notes);

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  res.status(201).json(customer);
});

// Update customer
router.put('/:id', (req, res) => {
  const { name, email, phone, address, city, state, zip, property_size, notes } = req.body;

  const result = db.prepare(`
    UPDATE customers
    SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?,
        property_size = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name, email, phone, address, city, state, zip, property_size, notes, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

// Delete customer
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.status(204).send();
});

export default router;
