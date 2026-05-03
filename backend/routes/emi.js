const express = require('express');
const authenticateToken = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

const emiSchema = Joi.object({
  emi_name: Joi.string().required(),
  principal_amount: Joi.number().positive().required(),
  annual_rate: Joi.number().positive().required(),
  tenure_months: Joi.number().positive().required(),
  start_date: Joi.date().optional()
});

router.use(authenticateToken);

// ====== CALCULATE EMI ======
const calculateEMI = (principal, annualRate, tenureMonths) => {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return (principal / tenureMonths).toFixed(2);
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  ).toFixed(2);
};

// ====== GET ALL EMI PLANS ======
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM emi_plans WHERE user_id = $1 ORDER BY start_date DESC',
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch EMI plans' });
  }
});

// ====== CREATE EMI PLAN ======
router.post('/', async (req, res) => {
  try {
    const { error, value } = emiSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = req.app.locals.db;
    const { emi_name, principal_amount, annual_rate, tenure_months, start_date } = value;

    const emi_amount = calculateEMI(principal_amount, annual_rate, tenure_months);

    const result = await db.query(
      `INSERT INTO emi_plans (user_id, emi_name, principal_amount, annual_rate, tenure_months, emi_amount, paid_amount, start_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.user_id, emi_name, principal_amount, annual_rate, tenure_months, emi_amount, 0, start_date || new Date()]
    );

    res.status(201).json({
      message: 'EMI plan created successfully',
      emi: result.rows[0],
      monthly_emi: emi_amount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create EMI plan' });
  }
});

// ====== MARK EMI PAYMENT ======
router.put('/:id/pay', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query(
      'UPDATE emi_plans SET paid_amount = paid_amount + emi_amount, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'EMI plan not found' });
    }

    const emi = result.rows[0];
    const remaining = emi.principal_amount - emi.paid_amount;

    res.json({
      message: 'EMI payment recorded',
      emi,
      remaining_amount: remaining.toFixed(2),
      remaining_months: Math.ceil(remaining / emi.emi_amount)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

module.exports = router;
