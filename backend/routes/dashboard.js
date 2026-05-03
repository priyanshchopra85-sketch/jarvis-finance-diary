const express = require('express');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// ====== GET DASHBOARD SUMMARY ======
router.get('/summary', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Total Expenses (Current Month)
    const expensesResult = await db.query(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE user_id = $1 
       AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
       AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())`,
      [req.user.user_id]
    );

    // Total Investments
    const investmentsResult = await db.query(
      'SELECT SUM(amount) as total_invested, SUM(current_value) as total_current FROM investments WHERE user_id = $1',
      [req.user.user_id]
    );

    // Savings Goals
    const goalsResult = await db.query(
      `SELECT 
        COUNT(*) as total_goals,
        SUM(target_amount) as total_target,
        SUM(current_amount) as total_saved 
       FROM savings_goals WHERE user_id = $1 AND status = 'active'`,
      [req.user.user_id]
    );

    // EMI Plans
    const emiResult = await db.query(
      `SELECT 
        COUNT(*) as total_emis,
        SUM(emi_amount) as total_monthly_emi,
        SUM(principal_amount - paid_amount) as total_remaining 
       FROM emi_plans WHERE user_id = $1`,
      [req.user.user_id]
    );

    // Expense Breakdown by Category
    const categoryResult = await db.query(
      `SELECT category, SUM(amount) as total 
       FROM expenses 
       WHERE user_id = $1 
       AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
       AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())
       GROUP BY category 
       ORDER BY total DESC LIMIT 5`,
      [req.user.user_id]
    );

    res.json({
      currentMonth: {
        totalExpenses: parseFloat(expensesResult.rows[0]?.total || 0).toFixed(2),
        expensesByCategory: categoryResult.rows
      },
      investments: {
        totalInvested: parseFloat(investmentsResult.rows[0]?.total_invested || 0).toFixed(2),
        currentValue: parseFloat(investmentsResult.rows[0]?.total_current || 0).toFixed(2),
        totalGain: (parseFloat(investmentsResult.rows[0]?.total_current || 0) - parseFloat(investmentsResult.rows[0]?.total_invested || 0)).toFixed(2)
      },
      savingsGoals: {
        totalGoals: goalsResult.rows[0]?.total_goals || 0,
        targetAmount: parseFloat(goalsResult.rows[0]?.total_target || 0).toFixed(2),
        savedAmount: parseFloat(goalsResult.rows[0]?.total_saved || 0).toFixed(2),
        savingsPercent: goalsResult.rows[0]?.total_target > 0 ? 
          ((parseFloat(goalsResult.rows[0]?.total_saved || 0) / parseFloat(goalsResult.rows[0]?.total_target)) * 100).toFixed(2) : 0
      },
      emiPlans: {
        totalEMIs: emiResult.rows[0]?.total_emis || 0,
        monthlyEMI: parseFloat(emiResult.rows[0]?.total_monthly_emi || 0).toFixed(2),
        remainingAmount: parseFloat(emiResult.rows[0]?.total_remaining || 0).toFixed(2)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// ====== GET FINANCIAL HEALTH SCORE ======
router.get('/health-score', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const summaryResult = await db.query(
      `SELECT 
        (SELECT SUM(amount) FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())) as monthly_expenses,
        (SELECT SUM(amount) FROM investments WHERE user_id = $1) as total_investments,
        (SELECT SUM(current_amount) FROM savings_goals WHERE user_id = $1 AND status = 'active') as saved_amount,
        (SELECT SUM(emi_amount) FROM emi_plans WHERE user_id = $1) as monthly_emi
      `,
      [req.user.user_id]
    );

    const data = summaryResult.rows[0];
    let score = 0;
    let recommendations = [];

    const monthlyExpenses = parseFloat(data.monthly_expenses || 0);
    const totalInvestments = parseFloat(data.total_investments || 0);
    const savedAmount = parseFloat(data.saved_amount || 0);
    const monthlyEMI = parseFloat(data.monthly_emi || 0);

    // Savings ratio (30 points max)
    if (savedAmount > 0) {
      score += Math.min(30, (savedAmount / (monthlyExpenses + 1)) * 10);
    }

    // Investment ratio (30 points max)
    if (totalInvestments > 0) {
      score += Math.min(30, (totalInvestments / (monthlyExpenses + 1)) * 10);
    }

    // EMI management (20 points max)
    if (monthlyEMI === 0) {
      score += 20;
    } else if (monthlyEMI < monthlyExpenses * 0.3) {
      score += 15;
    } else if (monthlyEMI < monthlyExpenses * 0.5) {
      score += 10;
    }

    // Expense control (20 points max)
    if (monthlyExpenses < 50000) {
      score += 20;
    } else if (monthlyExpenses < 100000) {
      score += 10;
    }

    // Generate recommendations
    if (savedAmount < monthlyExpenses * 0.1) {
      recommendations.push('Increase your monthly savings. Aim to save at least 10% of your income.');
    }

    if (totalInvestments === 0) {
      recommendations.push('Start investing to build long-term wealth. Consider stocks, mutual funds, or bonds.');
    }

    if (monthlyEMI > monthlyExpenses * 0.5) {
      recommendations.push('Your EMI commitments are high. Consider paying them off faster to reduce financial stress.');
    }

    if (monthlyExpenses > 100000) {
      recommendations.push('Review your expenses and identify areas to cut down. This will free up more money to save/invest.');
    }

    res.json({
      score: Math.min(100, Math.round(score)),
      level: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement',
      recommendations,
      breakdown: {
        monthlyExpenses: monthlyExpenses.toFixed(2),
        totalInvestments: totalInvestments.toFixed(2),
        savedAmount: savedAmount.toFixed(2),
        monthlyEMI: monthlyEMI.toFixed(2)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// ====== GET SPENDING PREDICTIONS ======
router.get('/predictions', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT 
        EXTRACT(MONTH FROM date) as month,
        SUM(amount) as total
       FROM expenses 
       WHERE user_id = $1 
       AND date >= NOW() - INTERVAL '6 months'
       GROUP BY month 
       ORDER BY month DESC
       LIMIT 6`,
      [req.user.user_id]
    );

    const expenses = result.rows;
    const average = expenses.length > 0 ? 
      expenses.reduce((sum, e) => sum + parseFloat(e.total), 0) / expenses.length : 0;

    let trend = 'stable';
    if (expenses.length >= 2) {
      const latest = parseFloat(expenses[0]?.total || 0);
      const previous = parseFloat(expenses[1]?.total || 0);
      if (latest > previous * 1.1) trend = 'increasing';
      if (latest < previous * 0.9) trend = 'decreasing';
    }

    res.json({
      averageMonthlyExpense: average.toFixed(2),
      trend,
      predictedNextMonth: (average * 1.05).toFixed(2),
      recentMonths: expenses,
      insights: `Based on your last 6 months, your average monthly expense is ₹${average.toFixed(2)}. Your spending trend is ${trend}. We predict your next month's expense to be around ₹${(average * 1.05).toFixed(2)}.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

module.exports = router;
