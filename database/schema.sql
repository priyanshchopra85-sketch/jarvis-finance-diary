-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Investments Table
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  investment_name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Savings Goals Table
CREATE TABLE IF NOT EXISTS savings_goals (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  goal_name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  deadline TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create EMI Plans Table
CREATE TABLE IF NOT EXISTS emi_plans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  emi_name VARCHAR(100) NOT NULL,
  principal_amount DECIMAL(10, 2) NOT NULL,
  annual_rate DECIMAL(5, 2) NOT NULL,
  tenure_months INT NOT NULL,
  emi_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_emi_user_id ON emi_plans(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
