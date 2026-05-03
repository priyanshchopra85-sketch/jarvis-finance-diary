const express = require('express');
const authenticateToken = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const expenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  category: Joi.string().required(),
  description: Joi.string().optional(),
  date: Joi.date().optional()
});

router.use(authenticateToken);

// ====== GET ALL EXPENSES ======
router.get('/', async (req, res) => {
  try {
    const { month, year, category } = req.query;
    const db = req.app.locals.db;
    let query = 'SELECT * FROM expenses WHERE user_id = $1';
    let params = [req.user.user_id];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $${params.length + 1} AND EXTRACT(YEAR FROM date) = $${params.length + 2}`;
      params.push(month, year);
    }

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    query += ' ORDER BY date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// ====== ADD EXPENSE ======
router.post('/', async (req, res) => {
  try {
    const { error, value } = expenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = req.app.locals.db;
    const { amount, category, description, date } = value;

    const result = await db.query(
      'INSERT INTO expenses (user_id, amount, category, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.user_id, amount, category, description, date || new Date()]
    );

    res.status(201).json({
      message: 'Expense added successfully',
      expense: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// ====== MONTHLY SUMMARY ======
router.get('/summary/monthly', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      `SELECT 
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        SUM(amount) as total,
        COUNT(*) as count
       FROM expenses 
       WHERE user_id = $1
       GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
       ORDER BY year DESC, month DESC`,
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
