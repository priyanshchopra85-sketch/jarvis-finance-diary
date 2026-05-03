const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// ====== REGISTER ======
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = req.app.locals.db;
    const { name, email, password } = value;

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Create user
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ====== LOGIN ======
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = req.app.locals.db;
    const { email, password } = value;

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: { user_id: user.user_id, name: user.name, email: user.email },
      token,
      refreshToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ====== REFRESH TOKEN ======
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const newToken = jwt.sign(
        { user_id: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
      );

      res.json({ token: newToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

module.exports = router;
