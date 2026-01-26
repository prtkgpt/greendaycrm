import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';

const router = Router();

// Get all services
router.get('/', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY name').all();
  res.json(services);
});

// Get single service
router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json(service);
});

// Create service
router.post('/', (req, res) => {
  const { name, description, default_price, duration_minutes } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO services (id, name, description, default_price, duration_minutes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, description, default_price, duration_minutes);

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.status(201).json(service);
});

// Update service
router.put('/:id', (req, res) => {
  const { name, description, default_price, duration_minutes } = req.body;

  const result = db.prepare(`
    UPDATE services SET name = ?, description = ?, default_price = ?, duration_minutes = ?
    WHERE id = ?
  `).run(name, description, default_price, duration_minutes, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json(service);
});

// Delete service
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.status(204).send();
});

export default router;
