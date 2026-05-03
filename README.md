# 🎤 Jarvis Finance Diary - Voice-Commanded Financial Management App

**An AI-powered, voice-ready financial diary app with voice commands, EMI tracking, investment management, and advanced security.**

---

## ✨ Features

### 📊 Dashboard & Analytics
- **Financial Summary** - Real-time overview of expenses, investments, savings, and EMIs
- **Charts & Visualizations** - Visual representation of spending by category
- **Health Score** (0-100) - AI-calculated financial wellness rating with personalized recommendations
- **Spending Predictions** - ML-based predictions of next month's expenses based on 6-month history
- **Trend Analysis** - Detects if spending is increasing/decreasing

### 🎤 Voice Commands
- Add expenses via voice ("Add 500 rupees for groceries")
- Query financial data by voice ("What's my total expense this month?")
- Update goals and EMIs using voice input
- Integration-ready for Google Assistant
- Web Speech API support for browser-based voice input

### 💰 Expense Management
- Voice-enabled expense entry
- Category-based expense tracking (Food, Transport, Entertainment, etc.)
- Monthly and annual expense summaries
- Filter expenses by date range and category

### 📈 Investment Tracking
- Track stocks, bonds, mutual funds, crypto, and real estate
- Real-time portfolio valuation
- ROI (Return on Investment) calculations
- Investment breakdown by type
- Gain/Loss tracking

### 🎯 Savings Goals
- Create and track multiple savings goals
- Monitor progress toward targets (with percentage)
- Voice-enabled goal updates
- Deadline tracking
- Goal status management (active, completed, abandoned)

### 💳 EMI Management
- **Automatic EMI Calculation** - Based on principal, rate, tenure
- **EMI Payment Tracking** - Track paid vs. remaining amounts
- **Payment Reminders** - 3-day advance notifications for upcoming EMI payments
- **Monthly Payment Summary** - See all upcoming EMI payments

### 🔐 Security Features
- ✅ **JWT Authentication** with access & refresh tokens
- ✅ **Password Encryption** using Bcryptjs
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **CORS Protection** - Cross-origin request validation
- ✅ **Helmet Security Headers** - Enhanced HTTP security
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **Input Validation** - Joi schema validation on all endpoints
- ✅ **User Isolation** - All data is user-specific

### 📄 PDF Export
- Export monthly financial reports as PDF
- Include charts, summaries, and detailed breakdowns
- Automated report generation

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL for data storage
- JWT for authentication
- Bcryptjs for password hashing
- Joi for input validation
- Helmet for security headers

**Frontend (Ready to integrate):**
- React.js
- Chart.js / D3.js for visualizations
- Web Speech API for voice input
- Axios for API calls

**Deployment:**
- Docker support
- Cloud-ready (Heroku, AWS, GCP, DigitalOcean)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- PostgreSQL v12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyanshchopra85-sketch/jarvis-finance-diary.git
   cd jarvis-finance-diary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

4. **Create database and tables**
   ```bash
   psql -U postgres -f database/schema.sql
   ```

5. **Start the server**
   ```bash
   npm run dev  # Development with auto-reload
   npm start    # Production
   ```

6. **Server running on** `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/refresh           - Refresh JWT token
```

### Expenses
```
GET    /api/expenses               - Get all expenses
POST   /api/expenses               - Add new expense
GET    /api/expenses/summary/monthly - Monthly expense summary
```

### Investments
```
GET    /api/investments            - Get all investments
POST   /api/investments            - Add new investment
GET    /api/investments/summary/types - Investment breakdown by type
```

### Savings Goals
```
GET    /api/goals                  - Get all goals
POST   /api/goals                  - Create new goal
PUT    /api/goals/:id/progress     - Update goal progress
```

### EMI Plans
```
GET    /api/emi                    - Get all EMI plans
POST   /api/emi                    - Create new EMI plan
PUT    /api/emi/:id/pay            - Record EMI payment
```

### Dashboard
```
GET    /api/dashboard/summary      - Financial summary
GET    /api/dashboard/health-score - Financial health score with recommendations
GET    /api/dashboard/predictions  - Spending predictions
```

---

## 📝 Example Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Priyansh","email":"priyansh@example.com","password":"SecurePass123","confirmPassword":"SecurePass123"}'
```

### Add Expense
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"category":"Groceries","description":"Weekly groceries"}'
```

### Create EMI Plan
```bash
curl -X POST http://localhost:5000/api/emi \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emi_name":"Car Loan","principal_amount":500000,"annual_rate":8.5,"tenure_months":60}'
```

### Get Dashboard Summary
```bash
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎤 Voice Integration

### Google Assistant Setup (Coming Soon)
- Configure webhook to your API
- Set up custom intents for financial queries
- Link to your Jarvis Finance Diary account

### Web Speech API (Browser-based)
```javascript
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Send to API endpoint
};
recognition.start();
```

---

## 📊 Health Score Calculation

The **Financial Health Score** (0-100) is calculated based on:
- **Savings Ratio** (30 points) - How much you save vs. spend
- **Investment Ratio** (30 points) - How much you invest vs. spend
- **EMI Management** (20 points) - EMI commitments relative to income
- **Expense Control** (20 points) - Overall spending habits

Included with recommendations to improve your financial health.

---

## 🔮 Predictions

Based on your last 6 months of spending:
- **Average Monthly Expense** - Calculates your typical spending
- **Spending Trend** - Increasing, decreasing, or stable
- **Next Month Prediction** - Predicts next month's expense with 5% buffer
- **Smart Insights** - Personalized recommendations

---

## 🔐 Security Best Practices

✅ **Do:**
- Use strong passwords (min 8 characters)
- Store JWT tokens securely (httpOnly cookies)
- Use HTTPS in production
- Set secure environment variables
- Regularly update dependencies

❌ **Don't:**
- Expose JWT secret in frontend
- Store passwords in plain text
- Share API credentials
- Use weak passwords

---

## 📦 Deployment

### Docker Deployment
```bash
docker build -t jarvis-finance .
docker run -p 5000:5000 jarvis-finance
```

### Heroku Deployment
```bash
heroku create jarvis-finance-diary
git push heroku main
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions:
- Open a GitHub Issue
- Email: priyansh@example.com
- Check documentation in `/docs`

---

## 🎯 Roadmap

- [ ] Google Assistant Integration
- [ ] Mobile App (React Native)
- [ ] Advanced ML predictions
- [ ] Tax calculation & filing
- [ ] Multi-currency support
- [ ] Budget alerts & notifications
- [ ] Community features & leaderboards
- [ ] AI financial advisor

---

**Made with ❤️ by Priyansh Chopra**

⭐ If you like this project, please give it a star!
