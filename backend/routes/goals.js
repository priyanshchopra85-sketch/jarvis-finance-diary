const express = require('express');
const authenticateToken = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const goalSchema = Joi.object({
  goal_name: Joi.string().required(),
  target_amount: Joi.number().positive().required(),
  current_amount: Joi.number().min(0).optional(),
  deadline: Joi.date().optional(),
  status: Joi.string().valid('active', 'completed', 'abandoned').optional()
});

router.use(authenticateToken);

// ====== GET ALL GOALS ======
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY deadline ASC',
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// ====== CREATE GOAL ======
router.post('/', async (req, res) => {
  try {
    const { error, value } = goalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = req.app.locals.db;
    const { goal_name, target_amount, current_amount, deadline, status } = value;

    const result = await db.query(
      'INSERT INTO savings_goals (user_id, goal_name, target_amount, current_amount, deadline, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.user_id, goal_name, target_amount, current_amount || 0, deadline, status || 'active']
    );

    res.status(201).json({
      message: 'Savings goal created successfully',
      goal: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// ====== UPDATE GOAL PROGRESS ======
router.put('/:id/progress', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query(
      'UPDATE savings_goals SET current_amount = current_amount + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [amount, id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({
      message: 'Goal progress updated',
      goal: result.rows[0],
      progress_percent: Math.round((result.rows[0].current_amount / result.rows[0].target_amount) * 100)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
