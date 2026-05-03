const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./backend/routes/auth');
const expenseRoutes = require('./backend/routes/expenses');
const investmentRoutes = require('./backend/routes/investments');
const goalsRoutes = require('./backend/routes/goals');
const emiRoutes = require('./backend/routes/emi');
const dashboardRoutes = require('./backend/routes/dashboard');

const app = express();

// ====== MIDDLEWARE ======
app.use(helmet()); // Security headers
app.use(cors()); // CORS protection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ====== DATABASE CONNECTION ======
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_SIZE) || 20,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

app.locals.db = pool;

// ====== HEALTH CHECK ======
app.get('/health', (req, res) => {
  res.json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ====== API ROUTES ======
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ====== 404 HANDLER ======
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ====== START SERVER ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Jarvis Finance Diary API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Security: Helmet + CORS + Rate Limiting enabled`);
});
