const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Customer routes
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/customers/:id', (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  db.run(
    'INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone, address, notes],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Customer created successfully' });
    }
  );
});

app.put('/api/customers/:id', (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  db.run(
    'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, notes = ? WHERE id = ?',
    [name, email, phone, address, notes, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

app.delete('/api/customers/:id', (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// Service routes
app.get('/api/services', (req, res) => {
  db.all('SELECT * FROM services ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/services', (req, res) => {
  const { name, description, base_price, duration } = req.body;
  db.run(
    'INSERT INTO services (name, description, base_price, duration) VALUES (?, ?, ?, ?)',
    [name, description, base_price, duration],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Service created successfully' });
    }
  );
});

app.put('/api/services/:id', (req, res) => {
  const { name, description, base_price, duration } = req.body;
  db.run(
    'UPDATE services SET name = ?, description = ?, base_price = ?, duration = ? WHERE id = ?',
    [name, description, base_price, duration, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Service updated successfully' });
    }
  );
});

app.delete('/api/services/:id', (req, res) => {
  db.run('DELETE FROM services WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Service deleted successfully' });
  });
});

// Staff routes
app.get('/api/staff', (req, res) => {
  db.all('SELECT * FROM staff ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/staff', (req, res) => {
  const { name, email, phone, specialization } = req.body;
  db.run(
    'INSERT INTO staff (name, email, phone, specialization) VALUES (?, ?, ?, ?)',
    [name, email, phone, specialization],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Staff member created successfully' });
    }
  );
});

app.put('/api/staff/:id', (req, res) => {
  const { name, email, phone, specialization } = req.body;
  db.run(
    'UPDATE staff SET name = ?, email = ?, phone = ?, specialization = ? WHERE id = ?',
    [name, email, phone, specialization, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Staff member updated successfully' });
    }
  );
});

app.delete('/api/staff/:id', (req, res) => {
  db.run('DELETE FROM staff WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Staff member deleted successfully' });
  });
});

// Job routes
app.get('/api/jobs', (req, res) => {
  const query = `
    SELECT 
      jobs.*, 
      customers.name as customer_name,
      services.name as service_name,
      staff.name as staff_name
    FROM jobs
    LEFT JOIN customers ON jobs.customer_id = customers.id
    LEFT JOIN services ON jobs.service_id = services.id
    LEFT JOIN staff ON jobs.staff_id = staff.id
    ORDER BY jobs.scheduled_date DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/jobs/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT 
      jobs.*, 
      customers.name as customer_name,
      customers.address as customer_address,
      services.name as service_name,
      staff.name as staff_name
    FROM jobs
    LEFT JOIN customers ON jobs.customer_id = customers.id
    LEFT JOIN services ON jobs.service_id = services.id
    LEFT JOIN staff ON jobs.staff_id = staff.id
    WHERE jobs.scheduled_date = ?
    ORDER BY jobs.scheduled_date
  `;
  db.all(query, [today], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/jobs', (req, res) => {
  const { customer_id, service_id, staff_id, scheduled_date, notes } = req.body;
  db.run(
    'INSERT INTO jobs (customer_id, service_id, staff_id, scheduled_date, notes) VALUES (?, ?, ?, ?, ?)',
    [customer_id, service_id, staff_id, scheduled_date, notes],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Job created successfully' });
    }
  );
});

app.put('/api/jobs/:id', (req, res) => {
  const { customer_id, service_id, staff_id, scheduled_date, status, notes } = req.body;
  db.run(
    'UPDATE jobs SET customer_id = ?, service_id = ?, staff_id = ?, scheduled_date = ?, status = ?, notes = ? WHERE id = ?',
    [customer_id, service_id, staff_id, scheduled_date, status, notes, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Job updated successfully' });
    }
  );
});

app.delete('/api/jobs/:id', (req, res) => {
  db.run('DELETE FROM jobs WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Job deleted successfully' });
  });
});

// Invoice routes
app.get('/api/invoices', (req, res) => {
  const query = `
    SELECT 
      invoices.*, 
      jobs.scheduled_date,
      customers.name as customer_name,
      services.name as service_name
    FROM invoices
    LEFT JOIN jobs ON invoices.job_id = jobs.id
    LEFT JOIN customers ON jobs.customer_id = customers.id
    LEFT JOIN services ON jobs.service_id = services.id
    ORDER BY invoices.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/invoices', (req, res) => {
  const { job_id, amount, due_date } = req.body;
  db.run(
    'INSERT INTO invoices (job_id, amount, due_date) VALUES (?, ?, ?)',
    [job_id, amount, due_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Invoice created successfully' });
    }
  );
});

app.put('/api/invoices/:id', (req, res) => {
  const { status, paid_date } = req.body;
  db.run(
    'UPDATE invoices SET status = ?, paid_date = ? WHERE id = ?',
    [status, paid_date, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Invoice updated successfully' });
    }
  );
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM customers', [], (err, row) => {
    stats.totalCustomers = row ? row.total : 0;
    
    db.get('SELECT COUNT(*) as total FROM jobs WHERE status = "scheduled"', [], (err, row) => {
      stats.scheduledJobs = row ? row.total : 0;
      
      db.get('SELECT SUM(amount) as total FROM invoices WHERE status = "paid"', [], (err, row) => {
        stats.totalRevenue = row && row.total ? row.total : 0;
        
        db.get('SELECT COUNT(*) as total FROM invoices WHERE status = "pending"', [], (err, row) => {
          stats.pendingInvoices = row ? row.total : 0;
          res.json(stats);
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Green Day CRM server running on port ${PORT}`);
});
