Pocket Planner Management System
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]()
[![Build Status](https://img.shields.io/badge/status-in%20progress-yellowgreen.svg)]()
[![Live Demo](https://img.shields.io/badge/demo-upcoming-orange.svg)]()
1. Project Overview
**Pocket Planner Management System** is a client-side personal finance dashboard built with vanilla
HTML, CSS, and JavaScript. It allows users to authenticate via OTP, set monthly salary, log expenses
with rich metadata, filter and visualize spending, and track remaining balance — all scoped per user
using `localStorage`. Designed as a lightweight prototype that can be extended later with a backend
and persistence.
2. Key Features
• OTP-based user authentication (email/phone)
• Monthly salary input and tracking
• Add/edit/delete expenses with:
• - Title
• - Amount
• - Category
• - Date
• - Description
• - Payment method (Cash / UPI / Card etc.)
• Filters: month, year, category
• Remaining balance calculation
• Category-wise expense breakdown
• Interactive reports and graphs via Chart.js
• User-specific scoping using `user.email`
• Profile page and summary dashboard
3. Tech Stack
• **Frontend:** HTML, CSS, JavaScript
• **Visualization:** Chart.js
• **Storage:** `localStorage` (per-user scoping)
• **Authentication:** OTP-based flow
• **Styling Inspiration:** Tailwind / Bootstrap-like dashboard UI
4. Project Structure (Suggested)
PocketPlanner_mng/
nnn index.html # Landing / login page
nnn dashboard.html # Salary & summary overview
nnn transactions.html # List / manage expenses
nnn profile.html # User profile
nnn js/
n nnn auth.js # OTP login logic
n nnn transactions.js # CRUD for expenses
n nnn filters.js # Filtering logic
n nnn reports.js # Chart.js report generation
n nnn utils.js # Shared helpers (e.g., date formatting)
nnn css/
n nnn styles.css # Central stylesheet (avoid inline styles)
nnn assets/ # Icons, images, screenshots
nnn docs/ # Optional: documentation, API mockups
nnn README.md # This file
5. Data Model (localStorage)
All user data is scoped by `user.email`. Example transaction object stored in `localStorage`:
{
"title": "Groceries",
"amount": 1500,
"category": "Food",
"date": "2025-08-01",
"description": "Weekly grocery shopping",
"paymentMethod": "UPI",
"userEmail": "user@example.com"
}
You can maintain arrays like `transactions_` and a salary entry like `salary_`.
6. Installation & Local Setup
1. Clone the repository:
```bash
git clone https://github.com//PocketPlanner_mng.git
cd PocketPlanner_mng
```
2. (Optional) Serve via a simple HTTP server for features like Chart.js if any CORS issues arise:
```bash
# Python 3
python -m http.server 8000
# Then open: http://localhost:8000/index.html
```
3. Open `index.html` in your browser.
7. Usage Flow
1. Sign up / Log in (OTP verification).
2. Set monthly salary.
3. Add expenses with required fields.
4. Apply filters (month/year/category) to view custom reports.
5. View remaining salary and breakdown charts.
6. Edit or delete past transactions as needed.
8. Reporting & Visualization
• Dynamic charts built with Chart.js show:
• - Expense breakdown by category.
• - Monthly usage trends.
• - Remaining balance compared to total salary.
• Filters drive which data set is visualized.
9. Contribution Guidelines
1. Fork the repository.
2. Create a feature branch:
```bash
git checkout -b feature/your-feature
```
3. Make changes with clear commit messages:
```bash
git commit -m "Add filter by payment method"
```
4. Push to your branch:
```bash
git push origin feature/your-feature
```
5. Open a pull request describing your changes.
10. Future Improvements
• Backend integration (Django / Express + database)
• Persistent multi-device sync
• Export reports (CSV / PDF)
• Enhanced authentication (JWT, OAuth)
• Dark mode support
• Unit/integration testing
• Real-time notifications or alerts
• Role-based user access (if multi-user admin)
11. Testing & Debugging
• Check browser console for errors (authentication, storage failures).
• Validate localStorage schema using devtools.
• Ensure date formats are consistent (ISO `YYYY-MM-DD` recommended).
• Edge cases: zero salary, negative expenses, overlapping filters.
12. Troubleshooting
• **Charts not rendering:** Ensure Chart.js script is loaded and data arrays aren’t empty.
• **OTP not working:** Validate the flow logic, session storage, and timeout handling.
• **Data missing after refresh:** Verify that `user.email` is correctly persisted and used as key prefix.
• **Filter results empty:** Check that filter logic compares dates and categories correctly (watch string
vs. date object mismatches).
13. Deployment Suggestions
• Host static pages on GitHub Pages by placing HTML in `docs/` or root, enable `gh-pages` branch.
• Later, migrate storage to a backend API and host on platforms like Vercel / Netlify (frontend) + Render
/ Railway (API).
14. Badges / Visual Enhancements (optional)
You can add:
• Build/status badge
• License badge
• Live demo badge
• Screenshot or GIF of the dashboard under “## Preview”
Example:
Preview
![Dashboard Screenshot](./assets/dashboard-screenshot.png)
15. License
Choose a license, for example MIT:
MIT License
16. Contact
• **Author:** Swapnil Karpe
• **GitHub:** https://github.com/Karpemurli
• **Email:** karpemurli3870@gmail.com
