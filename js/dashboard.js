// dashboard.js

// Unified user resolver (keeps existing semantics)
function getCurrentUser() {
  let currentUser;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser"));
  } catch (e) {
    currentUser = null;
  }

  const currentEmail = localStorage.getItem("currentUserEmail") || (currentUser && currentUser.email);

  if (currentUser && currentUser.email && currentUser.email === currentEmail) {
    return currentUser;
  }

  if (currentEmail) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const matchedUser = users.find(u => u.email === currentEmail);
    if (matchedUser) {
      localStorage.setItem("currentUser", JSON.stringify(matchedUser));
      return matchedUser;
    }
  }

  if (currentEmail) {
    const minimalUser = {
      email: currentEmail,
      username: currentEmail.split('@')[0]
    };
    localStorage.setItem("currentUser", JSON.stringify(minimalUser));
    return minimalUser;
  }

  return null;
}

const user = getCurrentUser();
if (!user || localStorage.getItem("otpVerified") !== "true") {
  window.location.href = "index.html?error=not_logged_in";
}

// DOM Elements
const dom = {
  month: document.getElementById("monthSelect"),
  year: document.getElementById("yearSelect"),
  reset: document.getElementById("resetView"),
  salary: document.getElementById("salary-amount"),
  expense: document.getElementById("total-expense"),
  balance: document.getElementById("remaining-balance"),
  txCount: document.getElementById("tx-count"),
  topCatName: document.getElementById("top-category-name"),
  topCatAmt: document.getElementById("top-category-amount"),
  userName: document.getElementById("logged-in-username"),
  userEmail: document.getElementById("logged-in-email"),
  search: document.querySelector('input[placeholder="Search transactions..."]'),
  period: document.getElementById("period-display"),
  chartCanvas: document.getElementById("categoryChart")
};

let chart = null;

// Utility: currency formatting
function formatCurrency(amt) {
  return '₹' + (parseFloat(amt) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const monthName = m => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];

/* ---------- Centralized Salary Store Helpers ---------- */
function loadAllSalariesByUser() {
  try {
    return JSON.parse(localStorage.getItem('salaries_by_user') || '{}');
  } catch {
    localStorage.removeItem('salaries_by_user');
    return {};
  }
}

function saveAllSalariesByUser(obj) {
  localStorage.setItem('salaries_by_user', JSON.stringify(obj));
}

/**
 * Get salary for given month/year from centralized store.
 * Falls back to legacy per-key and migrates it.
 */
function getUserSalary(month, year) {
  const email = user?.email || '';
  if (!email) return 0;

  const all = loadAllSalariesByUser();
  const userSalaries = all[email.toLowerCase().trim()] || {};

  const monthKey = String(month).padStart(2, '0');
  const composite = `${year}-${monthKey}`;

  // If centralized has it
  if (userSalaries[composite]) {
    return parseFloat(userSalaries[composite]) || 0;
  }

  // Fallback to old format: legacy key with email
  const emailKey = `salary_${email}_${composite}`;
  const emailSalary = parseFloat(localStorage.getItem(emailKey));
  if (!isNaN(emailSalary) && emailSalary > 0) {
    // Migrate into centralized store
    if (!all[email.toLowerCase().trim()]) all[email.toLowerCase().trim()] = {};
    all[email.toLowerCase().trim()][composite] = emailSalary.toFixed(2);
    saveAllSalariesByUser(all);
    return emailSalary;
  }

  // Fallback to legacy key without email
  const oldKey = `salary_${composite}`;
  const oldSalary = parseFloat(localStorage.getItem(oldKey)) || 0;
  if (oldSalary > 0) {
    if (!all[email.toLowerCase().trim()]) all[email.toLowerCase().trim()] = {};
    all[email.toLowerCase().trim()][composite] = oldSalary.toFixed(2);
    saveAllSalariesByUser(all);
    // Optional: remove old-style
    localStorage.removeItem(oldKey);
    return oldSalary;
  }

  return 0;
}

/* ---------- Transactions ---------- */
function getUserTransactions(month, year) {
  const all = JSON.parse(localStorage.getItem("transactions") || "[]");
  return all.filter(tx => {
    const isCurrentUser = (tx.user === user.email) || (tx.userEmail === user.email);
    if (!isCurrentUser) return false;

    const date = new Date(tx.date);
    if (isNaN(date)) return false;
    return date.getFullYear() === year && (month === 'all' || date.getMonth() + 1 === month);
  });
}

function getExpenseSummary(transactions) {
  let total = 0, count = 0, byCat = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    total += amt;
    count++;
    byCat[t.category] = (byCat[t.category] || 0) + amt;
  });
  return { total, count, byCat };
}

function topCategory(byCat) {
  let max = 0, name = 'No expenses';
  for (const [cat, amt] of Object.entries(byCat)) {
    if (amt > max) [name, max] = [cat, amt];
  }
  return { name, amount: max };
}

function updateSummary(salary, summary, month, year) {
  if (dom.salary) dom.salary.textContent = formatCurrency(salary);
  if (dom.expense) dom.expense.textContent = formatCurrency(summary.total);
  if (dom.balance) dom.balance.textContent = formatCurrency(salary - summary.total);
  if (dom.topCatName) dom.topCatName.textContent = topCategory(summary.byCat).name;
  if (dom.topCatAmt) dom.topCatAmt.textContent = formatCurrency(topCategory(summary.byCat).amount);
  if (dom.txCount) dom.txCount.textContent = summary.count;

  if (dom.period) {
    dom.period.textContent = month === 'all'
      ? `Year ${year}`
      : `${monthName(month)} ${year}`;
  }
}

function renderChart(summary) {
  if (!dom.chartCanvas) return;
  if (chart) chart.destroy();

  const labels = Object.keys(summary.byCat);
  const data = Object.values(summary.byCat);
  if (labels.length === 0) {
    dom.chartCanvas.getContext('2d').clearRect(0, 0, dom.chartCanvas.width, dom.chartCanvas.height);
    return;
  }

  chart = new Chart(dom.chartCanvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        }
      },
      cutout: '65%'
    }
  });
}

/* ---------- Selector / UI Init ---------- */
function initSelectors() {
  const currentYear = new Date().getFullYear();

  if (dom.month && dom.year) {
    if (!Array.from(dom.month.options).some(o => o.value === 'all')) {
      const opt = document.createElement("option");
      opt.value = "all";
      opt.textContent = "All Months";
      dom.month.prepend(opt);
    }

    const now = new Date();
    dom.month.value = (now.getMonth() + 1).toString();
    dom.year.value = currentYear.toString();

    const reloadDashboard = () => {
      const selectedMonth = dom.month.value === 'all' ? 'all' : parseInt(dom.month.value);
      const selectedYear = parseInt(dom.year.value, 10);

      const transactions = getUserTransactions(selectedMonth, selectedYear);
      const salary = selectedMonth === 'all'
        ? Array.from({ length: 12 }, (_, i) => getUserSalary(i + 1, selectedYear)).reduce((a, b) => a + b, 0)
        : getUserSalary(selectedMonth, selectedYear);

      const summary = getExpenseSummary(transactions);
      updateSummary(salary, summary, selectedMonth, selectedYear);
      renderChart(summary);
    };

    dom.month.addEventListener("change", reloadDashboard);
    dom.year.addEventListener("change", reloadDashboard);
    if (dom.reset) {
      dom.reset.addEventListener("click", () => {
        dom.month.value = 'all';
        dom.year.value = currentYear;
        reloadDashboard();
      });
    }

    reloadDashboard();
  }
}

function initUserInfo() {
  if (user) {
    const name = user.username || user.email.split('@')[0];
    if (dom.userName) dom.userName.textContent = name;
    if (dom.userEmail) dom.userEmail.textContent = user.email;
    const navUsername = document.getElementById("nav-username");
    if (navUsername) navUsername.textContent = name;
  } else {
    console.warn("User information not available for display.");
    window.location.href = "index.html?error=user_not_found";
  }
}

/* ---------- Initialization ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // NOTE: removed cleanupLocalStorage that was deleting other users' salaries

  initUserInfo();
  initSelectors();

  if (dom.search) {
    dom.search.addEventListener("input", function () {
      console.log("Search functionality to be implemented");
      // Filtering logic can go here using getUserTransactions(...)
    });
  }
});
