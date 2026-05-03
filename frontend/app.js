// ============================================
// JARVIS FINANCE DIARY - MAIN APP
// ============================================

const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = null;
let expenseChart = null;
let trendChart = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    attachEventListeners();
    checkAuth();
    setDefaultDate();
}

function attachEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Auth
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.querySelector('.close-modal').addEventListener('click', closeAuthModal);

    // Expenses
    document.getElementById('expensesList').addEventListener('submit', (e) => {
        if (e.target.closest('form')) handleAddExpense(e);
    });
    document.getElementById('categoryFilter').addEventListener('change', loadExpenses);

    // Investments
    document.querySelector('#investments form')?.addEventListener('submit', handleAddInvestment);

    // Goals
    document.querySelector('#goals form')?.addEventListener('submit', handleAddGoal);

    // EMI
    document.getElementById('emiPrincipal')?.addEventListener('input', calculateEMI);
    document.getElementById('emiRate')?.addEventListener('input', calculateEMI);
    document.getElementById('emiTenure')?.addEventListener('input', calculateEMI);
    document.querySelector('#emi form')?.addEventListener('submit', handleAddEMI);

    // Voice
    document.getElementById('floatingVoiceBtn').addEventListener('click', startVoiceInput);
    document.getElementById('voiceBtn')?.addEventListener('click', startVoiceInput);
}

// ============================================
// AUTHENTICATION
// ============================================

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        showMainContent();
        loadDashboard();
    } else {
        showAuthModal();
    }
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('loginForm').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function toggleAuth() {
    document.getElementById('loginForm').classList.toggle('active');
    document.getElementById('registerForm').classList.toggle('active');
}

async function handleLogin(e) {
    e.preventDefault();
    showSpinner();

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            closeAuthModal();
            showMainContent();
            loadDashboard();
            showToast('Login successful!', 'success');
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    } finally {
        hideSpinner();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    showSpinner();

    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        hideSpinner();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: password,
                confirmPassword: confirmPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Registration successful! Please login.', 'success');
            toggleAuth();
            document.getElementById('registerForm').reset();
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    } finally {
        hideSpinner();
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    document.getElementById('authModal').classList.add('active');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.querySelector('.main-content').style.display = 'none';
    showToast('Logged out successfully', 'success');
}

function showMainContent() {
    document.querySelector('.main-content').style.display = 'block';
    if (currentUser) {
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
    }
}

// ============================================
// NAVIGATION
// ============================================

function handleNavigation(e) {
    e.preventDefault();
    const section = e.target.closest('.nav-link')?.getAttribute('data-section');
    if (section) {
        switchSection(section);
    }
}

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    }

    // Load data for section
    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'expenses') {
        loadExpenses();
    } else if (sectionId === 'investments') {
        loadInvestments();
    } else if (sectionId === 'goals') {
        loadGoals();
    } else if (sectionId === 'emi') {
        loadEMI();
    }
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
    showSpinner();
    try {
        const [summary, health, predictions] = await Promise.all([
            fetchAPI('/dashboard/summary'),
            fetchAPI('/dashboard/health-score'),
            fetchAPI('/dashboard/predictions')
        ]);

        // Update stats
        document.getElementById('totalExpenses').textContent = summary.currentMonth.totalExpenses;
        document.getElementById('totalInvestments').textContent = summary.investments.totalInvested;
        document.getElementById('totalSavings').textContent = summary.savingsGoals.savedAmount;
        document.getElementById('monthlyEMI').textContent = summary.emiPlans.monthlyEMI;

        // Update health score
        updateHealthScore(health);

        // Update predictions
        updatePredictions(predictions);

        // Update charts
        updateCharts(summary);
    } catch (error) {
        showToast('Failed to load dashboard', 'error');
    } finally {
        hideSpinner();
    }
}

function updateHealthScore(data) {
    const score = data.score;
    const level = data.level;

    document.getElementById('healthScore').textContent = score;
    document.getElementById('healthLabel').textContent = level;

    const circle = document.querySelector('.score-fill');
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = strokeDashoffset;

    const recommendationsHtml = data.recommendations
        .map(rec => `<div class="recommendation-item">💡 ${rec}</div>`)
        .join('');
    document.getElementById('healthRecommendations').innerHTML = recommendationsHtml;
}

function updatePredictions(data) {
    document.getElementById('avgExpense').textContent = data.averageMonthlyExpense;
    document.getElementById('predictedExpense').textContent = data.predictedNextMonth;
    
    const trend = data.trend === 'increasing' ? '📈 Increasing' : 
                  data.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable';
    document.getElementById('spendingTrend').textContent = trend;
    document.getElementById('predictionInsight').textContent = data.insights;
}

function updateCharts(data) {
    // Expense Chart
    const categoryLabels = data.currentMonth.expensesByCategory.map(e => e.category);
    const categoryValues = data.currentMonth.expensesByCategory.map(e => e.total);

    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(document.getElementById('expenseChart'), {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryValues,
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'
                ],
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ============================================
// EXPENSES
// ============================================

function toggleAddExpense() {
    document.getElementById('addExpenseForm').classList.toggle('hidden');
}

async function handleAddExpense(e) {
    e.preventDefault();
    showSpinner();

    try {
        const response = await fetchAPI('/expenses', 'POST', {
            amount: parseFloat(document.getElementById('expAmount').value),
            category: document.getElementById('expCategory').value,
            description: document.getElementById('expDesc').value,
            date: document.getElementById('expDate').value
        });

        showToast('Expense added successfully!', 'success');
        document.getElementById('addExpenseForm').querySelector('form').reset();
        toggleAddExpense();
        loadExpenses();
    } catch (error) {
        showToast('Failed to add expense', 'error');
    } finally {
        hideSpinner();
    }
}

async function loadExpenses() {
    try {
        const category = document.getElementById('categoryFilter')?.value || '';
        const expenses = await fetchAPI(`/expenses?category=${category}`);
        
        const html = expenses.map(exp => `
            <div class="expense-item">
                <div class="item-content">
                    <div class="item-title">${exp.category}</div>
                    <div class="item-meta">
                        <span>${exp.description || 'No description'}</span>
                        <span>${new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="item-amount">₹${parseFloat(exp.amount).toFixed(2)}</div>
            </div>
        `).join('');

        document.getElementById('expensesList').innerHTML = html || '<p class="no-data">No expenses found</p>';
    } catch (error) {
        showToast('Failed to load expenses', 'error');
    }
}

// ============================================
// INVESTMENTS
// ============================================

function toggleAddInvestment() {
    document.getElementById('addInvestmentForm').classList.toggle('hidden');
}

async function handleAddInvestment(e) {
    e.preventDefault();
    showSpinner();

    try {
        await fetchAPI('/investments', 'POST', {
            investment_name: document.getElementById('invName').value,
            type: document.getElementById('invType').value,
            amount: parseFloat(document.getElementById('invAmount').value),
            current_value: parseFloat(document.getElementById('invCurrentValue').value)
        });

        showToast('Investment added successfully!', 'success');
        document.getElementById('addInvestmentForm').querySelector('form').reset();
        toggleAddInvestment();
        loadInvestments();
    } catch (error) {
        showToast('Failed to add investment', 'error');
    } finally {
        hideSpinner();
    }
}

async function loadInvestments() {
    try {
        const investments = await fetchAPI('/investments');
        
        const html = investments.map(inv => {
            const gain = (inv.current_value - inv.amount).toFixed(2);
            const gainClass = gain >= 0 ? 'gain' : 'loss';
            const gainSign = gain >= 0 ? '+' : '';

            return `
                <div class="investment-card">
                    <h3>${inv.investment_name}</h3>
                    <span class="investment-badge">${inv.type}</span>
                    <div class="investment-stats">
                        <div class="stat-row">
                            <span class="stat-label">Invested:</span>
                            <span class="stat-val">₹${parseFloat(inv.amount).toFixed(2)}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Current Value:</span>
                            <span class="stat-val">₹${parseFloat(inv.current_value).toFixed(2)}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Gain/Loss:</span>
                            <span class="stat-val ${gainClass}">${gainSign}₹${gain}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('investmentsList').innerHTML = html || '<p class="no-data">No investments yet</p>';
    } catch (error) {
        showToast('Failed to load investments', 'error');
    }
}

// ============================================
// SAVINGS GOALS
// ============================================

function toggleAddGoal() {
    document.getElementById('addGoalForm').classList.toggle('hidden');
}

async function handleAddGoal(e) {
    e.preventDefault();
    showSpinner();

    try {
        await fetchAPI('/goals', 'POST', {
            goal_name: document.getElementById('goalName').value,
            target_amount: parseFloat(document.getElementById('goalTarget').value),
            current_amount: parseFloat(document.getElementById('goalCurrent').value),
            deadline: document.getElementById('goalDeadline').value || null
        });

        showToast('Goal created successfully!', 'success');
        document.getElementById('addGoalForm').querySelector('form').reset();
        toggleAddGoal();
        loadGoals();
    } catch (error) {
        showToast('Failed to create goal', 'error');
    } finally {
        hideSpinner();
    }
}

async function loadGoals() {
    try {
        const goals = await fetchAPI('/goals');
        
        const html = goals.map(goal => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            return `
                <div class="goal-item">
                    <div class="item-content">
                        <div class="item-title">${goal.goal_name}</div>
                        <div class="item-meta">
                            <span>₹${parseFloat(goal.current_amount).toFixed(2)} / ₹${parseFloat(goal.target_amount).toFixed(2)}</span>
                            <span>${Math.round(progress)}% complete</span>
                        </div>
                        <div class="goal-progress">
                            <div class="goal-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('goalsList').innerHTML = html || '<p class="no-data">No goals yet</p>';
    } catch (error) {
        showToast('Failed to load goals', 'error');
    }
}

// ============================================
// EMI
// ============================================

function calculateEMI() {
    const principal = parseFloat(document.getElementById('emiPrincipal')?.value || 0);
    const rate = parseFloat(document.getElementById('emiRate')?.value || 0);
    const tenure = parseFloat(document.getElementById('emiTenure')?.value || 0);

    if (principal && rate && tenure) {
        const monthlyRate = rate / 12 / 100;
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                    (Math.pow(1 + monthlyRate, tenure) - 1);
        
        document.getElementById('emiResult').style.display = 'block';
        document.getElementById('calcEMI').textContent = emi.toFixed(2);
    }
}

function toggleAddEMI() {
    document.getElementById('addEMIForm').classList.toggle('hidden');
}

async function handleAddEMI(e) {
    e.preventDefault();
    showSpinner();

    try {
        await fetchAPI('/emi', 'POST', {
            emi_name: document.getElementById('emiName').value,
            principal_amount: parseFloat(document.getElementById('emiPrincipal').value),
            annual_rate: parseFloat(document.getElementById('emiRate').value),
            tenure_months: parseInt(document.getElementById('emiTenure').value)
        });

        showToast('EMI plan created successfully!', 'success');
        document.getElementById('addEMIForm').querySelector('form').reset();
        document.getElementById('emiResult').style.display = 'none';
        toggleAddEMI();
        loadEMI();
    } catch (error) {
        showToast('Failed to create EMI plan', 'error');
    } finally {
        hideSpinner();
    }
}

async function loadEMI() {
    try {
        const emis = await fetchAPI('/emi');
        
        const html = emis.map(emi => {
            const remaining = emi.principal_amount - emi.paid_amount;
            return `
                <div class="emi-item">
                    <div class="item-content">
                        <div class="item-title">${emi.emi_name}</div>
                        <div class="item-meta">
                            <span>₹${parseFloat(emi.emi_amount).toFixed(2)}/month</span>
                            <span>Paid: ₹${parseFloat(emi.paid_amount).toFixed(2)}</span>
                            <span>Remaining: ₹${parseFloat(remaining).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('emiList').innerHTML = html || '<p class="no-data">No EMI plans yet</p>';
    } catch (error) {
        showToast('Failed to load EMI plans', 'error');
    }
}

// ============================================
// VOICE INPUT
// ============================================

function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice input not supported in your browser', 'error');
        return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.language = 'en-IN';
    recognition.start();

    document.getElementById('floatingVoiceBtn').style.animation = 'pulse 0.5s';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
    };

    recognition.onerror = () => {
        showToast('Voice input failed', 'error');
    };

    recognition.onend = () => {
        document.getElementById('floatingVoiceBtn').style.animation = '';
    };
}

function processVoiceCommand(command) {
    showToast(`Command: "${command}"`, 'info');

    if (command.includes('add expense')) {
        switchSection('expenses');
        toggleAddExpense();
    } else if (command.includes('show dashboard')) {
        switchSection('dashboard');
    } else if (command.includes('total expense')) {
        showToast(`Monthly Expenses: ₹${document.getElementById('totalExpenses').textContent}`, 'info');
    }
}

// ============================================
// PDF EXPORT
// ============================================

function exportPDF() {
    showToast('PDF export feature coming soon!', 'warning');
}

// ============================================
// UTILITIES
// ============================================

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_URL + endpoint, options);
    
    if (!response.ok) {
        if (response.status === 401) {
            logout();
        }
        throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) input.value = today;
    });
}
