const express = require('express');
const authenticateToken = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const investmentSchema = Joi.object({
  investment_name: Joi.string().required(),
  type: Joi.string().valid('stocks', 'bonds', 'mutual_funds', 'crypto', 'real_estate').required(),
  amount: Joi.number().positive().required(),
  current_value: Joi.number().positive().required(),
  purchase_date: Joi.date().optional()
});

router.use(authenticateToken);

// ====== GET ALL INVESTMENTS ======
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM investments WHERE user_id = $1 ORDER BY purchase_date DESC',
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// ====== ADD INVESTMENT ======
router.post('/', async (req, res) => {
  try {
    const { error, value } = investmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = req.app.locals.db;
    const { investment_name, type, amount, current_value, purchase_date } = value;

    const result = await db.query(
      'INSERT INTO investments (user_id, investment_name, type, amount, current_value, purchase_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.user_id, investment_name, type, amount, current_value, purchase_date || new Date()]
    );

    res.status(201).json({
      message: 'Investment added successfully',
      investment: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add investment' });
  }
});

// ====== GET INVESTMENT SUMMARY ======
router.get('/summary/types', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      `SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as invested,
        SUM(current_value) as current_value,
        SUM(current_value - amount) as gain
       FROM investments 
       WHERE user_id = $1
       GROUP BY type`,
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch investment summary' });
  }
});

module.exports = router;
