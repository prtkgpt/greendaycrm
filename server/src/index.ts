import express from 'express';
import cors from 'cors';
import customersRouter from './routes/customers.js';
import jobsRouter from './routes/jobs.js';
import servicesRouter from './routes/services.js';
import invoicesRouter from './routes/invoices.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/customers', customersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║         🌿 GreenDay CRM Server 🌿          ║
  ║─────────────────────────────────────────────║
  ║  Running on http://localhost:${PORT}          ║
  ╚═══════════════════════════════════════════╝
  `);
});
