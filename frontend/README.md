# 🤖 Jarvis Finance Diary - Frontend

Modern, responsive HTML5 + CSS3 + JavaScript frontend for the Jarvis Finance Diary app.

## 🚀 Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Gradient backgrounds, smooth animations, glass-morphism effects
- **Dark Mode Ready** - Easy to implement
- **Voice Commands** - Web Speech API integration
- **Real-time Charts** - Chart.js for visualizations
- **Smooth Animations** - Engaging transitions and effects
- **Mobile-First** - Optimized for all screen sizes

## 📁 Files

- `index.html` - Main HTML structure with all UI elements
- `styles.css` - Complete styling with responsive design (800+ lines)
- `app.js` - JavaScript logic for all functionality (600+ lines)

## 🎨 Color Scheme

- Primary: `#6366f1` (Indigo)
- Secondary: `#10b981` (Green)
- Danger: `#ef4444` (Red)
- Light: `#f3f4f6` (Light Gray)
- Dark: `#1f2937` (Dark Gray)

## 🔧 Setup

1. Open `index.html` in your browser
2. Make sure backend API is running on `http://localhost:5000`
3. Start adding expenses, investments, and tracking your finances!

## 📱 Responsive Breakpoints

- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: Below 768px

## 🎤 Voice Commands

- "Add expense" - Opens expense form
- "Show dashboard" - Navigates to dashboard
- "Total expense" - Shows monthly total

## 🎯 Future Enhancements

- [ ] Dark mode toggle
- [ ] Real-time notifications
- [ ] Advanced filtering
- [ ] Budget alerts
- [ ] Data export (CSV, PDF)
- [ ] Offline support (Service Worker)
- [ ] Progressive Web App

## 📊 API Integration

All API calls go through the `fetchAPI()` function which:
- Handles authentication
- Sets proper headers
- Manages errors
- Auto-logout on 401

## 🚨 Troubleshooting

**Voice input not working?**
- Use Chrome, Edge, or Safari
- Check microphone permissions
- Ensure HTTPS in production

**API calls failing?**
- Verify backend is running
- Check CORS headers
- Ensure correct API_URL in app.js

---

Made with ❤️ by Priyansh Chopra
