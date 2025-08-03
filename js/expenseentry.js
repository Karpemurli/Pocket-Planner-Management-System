//expenseentry.js
//  Helper to get current user (must match dashboard/profile logic)
function getCurrentUser() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
  } catch {
    localStorage.removeItem('currentUser');
  }
  const emailKey = localStorage.getItem('currentUserEmail') || stored.email;
  if (emailKey) {
    if (!stored.email || stored.email !== emailKey) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const matched = users.find(u => u.email === emailKey);
      if (matched) {
        localStorage.setItem('currentUser', JSON.stringify(matched));
        return matched;
      }
      const minimal = { email: emailKey, username: emailKey.split('@')[0] };
      localStorage.setItem('currentUser', JSON.stringify(minimal));
      return minimal;
    }
    return stored;
  }
  return null;
}

// Global variables
let currentIndex = 0;
const perPage = 5;

// Helper to safely get element
function $(id) {
  return document.getElementById(id);
}

// Update monthly salary for a user. If isReplacement=true, overwrite; else add/subtract based on isAddition.
function updateMonthlySalary(amount, date, isReplacement = true, isAddition = true) {
  const user = getCurrentUser();
  if (!user) return;
  const email = user.email.toLowerCase().trim();
  const dt = new Date(date);
  if (isNaN(dt)) return;
  const month = dt.getMonth() + 1;
  const year = dt.getFullYear();
  const composite = `${year}-${String(month).padStart(2, '0')}`;

  // Centralized store load
  let all = {};
  try {
    all = JSON.parse(localStorage.getItem("salaries_by_user") || "{}");
  } catch {
    localStorage.removeItem("salaries_by_user");
    all = {};
  }
  if (!all[email]) all[email] = {};

  let currentSalary = parseFloat(all[email][composite]) || 0;
  const numericAmount = parseFloat(amount) || 0;
  let newAmount;

  if (isReplacement) {
    newAmount = numericAmount;
  } else if (isAddition) {
    newAmount = currentSalary + numericAmount;
  } else {
    newAmount = currentSalary - numericAmount;
  }

  all[email][composite] = newAmount.toFixed(2);
  localStorage.setItem("salaries_by_user", JSON.stringify(all));
}

// Set transaction type (income/expense) UI
function setTransactionType(type) {
  const typeInput = $('type');
  if (typeInput) typeInput.value = type;
  const incomeBtn = $('incomeBtn');
  const expenseBtn = $('expenseBtn');

  if (incomeBtn) incomeBtn.classList.toggle('active', type === 'income');
  if (expenseBtn) expenseBtn.classList.toggle('active', type === 'expense');
}

// Initialize date field to today
function initializeDateField() {
  const dateEl = $('date');
  if (!dateEl) return;
  const today = new Date().toISOString().split('T')[0];
  dateEl.value = today;
}

// Build transaction card HTML
function createTransactionElement(transaction) {
  const isIncome = transaction.type === 'income';
  const bgClass = isIncome ? 'income-bg' : 'expense-bg';
  const iconClass = isIncome ? 'text-emerald-500' : 'text-red-500';
  const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
  const sign = isIncome ? '+' : '-';
  const title = transaction.title || '';
  const category = transaction.category || '';
  const dateStr = transaction.date ? new Date(transaction.date).toLocaleDateString() : '';
  const description = transaction.description || '';
  const paymentMethod = transaction.paymentMethod || '';

  return `
    <div class="transaction-card ${bgClass} p-4 rounded-lg mb-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="p-3 mr-4 rounded-full bg-white shadow">
            <i class="fas ${icon} ${iconClass}"></i>
          </div>
          <div>
            <h4 class="font-semibold text-slate-700">${title}</h4>
            <p class="text-xs text-slate-500">${category} • ${dateStr}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-semibold ${isIncome ? 'text-emerald-500' : 'text-red-500'}">${sign}₹${transaction.amount}</p>
          <div class="flex space-x-2 mt-2">
            <button onclick="editTransaction('${transaction.id}')" class="btn-action text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" aria-label="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteTransaction('${transaction.id}')" class="btn-action text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200" aria-label="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      ${description ? `<p class="mt-2 text-sm text-slate-600">${description}</p>` : ''}
      ${paymentMethod ? `<p class="mt-1 text-xs text-slate-500">Paid via ${paymentMethod}</p>` : ''}
    </div>
  `;
}

// Load and render transactions
function loadTransactions() {
  const currentUser = getCurrentUser();
  const email = currentUser?.email || '';
  const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const transactions = allTransactions.filter(t => t.userEmail === email);
  const container = $('transactionsContainer');
  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-gray-400">
        <i class="fas fa-exchange-alt text-4xl mb-2"></i>
        <p>No transactions yet</p>
      </div>
    `;
    const loadBtn = $('loadMoreBtn');
    if (loadBtn) loadBtn.style.display = 'none';
    return;
  }

  container.innerHTML = transactions
    .slice(0, currentIndex + perPage)
    .map(createTransactionElement)
    .join('');

  const loadBtn = $('loadMoreBtn');
  if (loadBtn) {
    loadBtn.style.display = transactions.length > currentIndex + perPage ? 'block' : 'none';
  }
}

// Handle submission
function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!form) return;

  const currentUser = getCurrentUser();
  const email = currentUser?.email || '';

  const formData = new FormData(form);
  const transaction = {
    id: Date.now().toString(),
    userEmail: email,
    title: formData.get('title') || '',
    amount: parseFloat(formData.get('amount')) ? parseFloat(formData.get('amount')).toFixed(2) : '0.00',
    type: formData.get('type') || 'expense',
    category: formData.get('category') || '',
    date: formData.get('date') || new Date().toISOString().split('T')[0],
    description: formData.get('description') || '',
    paymentMethod: formData.get('paymentMethod') || ''
  };

  if (transaction.type === 'income' && transaction.category === 'Salary') {
    updateMonthlySalary(transaction.amount, transaction.date, true);
  }

  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  transactions.unshift(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));

  form.reset();
  initializeDateField();
  setTransactionType('income');
  currentIndex = 0;
  loadTransactions();
  if (typeof Swal !== 'undefined') Swal.fire('Transaction saved successfully!');
}

// Clear form
function clearForm() {
  if (confirm('Are you sure you want to clear the form?')) {
    const form = $('transactionForm');
    if (form) form.reset();
    initializeDateField();
    setTransactionType('income');
  }
}

// Load more
function loadMoreTransactions() {
  currentIndex += perPage;
  loadTransactions();
}

// Delete transaction
function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;

  const currentUser = getCurrentUser();
  const email = currentUser?.email || '';
  const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const transaction = allTransactions.find(t => t.id === id);

  if (transaction && transaction.type === 'income' && transaction.category === 'Salary') {
    updateMonthlySalary(0, transaction.date, true);
  }

  const updated = allTransactions.filter(t => t.id !== id || t.userEmail !== email);
  localStorage.setItem('transactions', JSON.stringify(updated));
  loadTransactions();
}

// Edit transaction
function editTransaction(id) {
  const currentUser = getCurrentUser();
  const email = currentUser?.email || '';
  const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const transaction = allTransactions.find(t => t.id === id && t.userEmail === email);
  if (!transaction) return;

  if (transaction.type === 'income' && transaction.category === 'Salary') {
    updateMonthlySalary(0, transaction.date, true);
  }

  if ($('title')) $('title').value = transaction.title || '';
  if ($('amount')) $('amount').value = transaction.amount || '';
  if ($('type')) $('type').value = transaction.type || '';
  if ($('category')) $('category').value = transaction.category || '';
  if ($('date')) $('date').value = transaction.date || '';
  if ($('description')) $('description').value = transaction.description || '';
  if ($('paymentMethod')) $('paymentMethod').value = transaction.paymentMethod || '';
  setTransactionType(transaction.type || 'expense');

  const updated = allTransactions.filter(t => t.id !== id || t.userEmail !== email);
  localStorage.setItem('transactions', JSON.stringify(updated));

  const formSection = document.querySelector('.form-section');
  if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
}

// Initialization
function init() {
  const form = $('transactionForm');
  if (form) form.addEventListener('submit', handleFormSubmit);
  const clearBtn = $('clearAllBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearForm);
  const loadMoreBtn = $('loadMoreBtn');
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMoreTransactions);

  initializeDateField();
  setTransactionType('income');
  loadTransactions();
}

document.addEventListener('DOMContentLoaded', init);
