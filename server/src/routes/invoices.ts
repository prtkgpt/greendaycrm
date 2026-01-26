import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';

const router = Router();

// Get all invoices
router.get('/', (req, res) => {
  const { status, customer_id } = req.query;

  let query = `
    SELECT i.*, c.name as customer_name, c.email as customer_email,
           j.title as job_title
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }
  if (customer_id) {
    query += ' AND i.customer_id = ?';
    params.push(customer_id);
  }

  query += ' ORDER BY i.created_at DESC';

  const invoices = db.prepare(query).all(...params);
  res.json(invoices);
});

// Get single invoice
router.get('/:id', (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, c.name as customer_name, c.email as customer_email,
           c.address as customer_address, c.city as customer_city,
           c.state as customer_state, c.zip as customer_zip,
           j.title as job_title, j.description as job_description
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.json(invoice);
});

// Create invoice
router.post('/', (req, res) => {
  const { customer_id, job_id, amount, due_date, notes } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO invoices (id, customer_id, job_id, amount, due_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, customer_id, job_id, amount, due_date, notes);

  const invoice = db.prepare(`
    SELECT i.*, c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).get(id);

  res.status(201).json(invoice);
});

// Update invoice
router.put('/:id', (req, res) => {
  const { customer_id, job_id, amount, status, due_date, paid_date, notes } = req.body;

  const result = db.prepare(`
    UPDATE invoices
    SET customer_id = ?, job_id = ?, amount = ?, status = ?, due_date = ?, paid_date = ?, notes = ?
    WHERE id = ?
  `).run(customer_id, job_id, amount, status, due_date, paid_date, notes, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const invoice = db.prepare(`
    SELECT i.*, c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).get(req.params.id);

  res.json(invoice);
});

// Mark invoice as paid
router.patch('/:id/pay', (req, res) => {
  const paid_date = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    UPDATE invoices SET status = 'paid', paid_date = ? WHERE id = ?
  `).run(paid_date, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const invoice = db.prepare(`
    SELECT i.*, c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).get(req.params.id);

  res.json(invoice);
});

// Delete invoice
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.status(204).send();
});

export default router;
