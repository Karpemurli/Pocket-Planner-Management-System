// salary.js

const itemsPerPage = 3;
let currentPage = 1;
let allSalaries = [];

// Centralized per-user salary store helpers
function loadAllSalariesByUser() {
  try {
    return JSON.parse(localStorage.getItem("salaries_by_user") || "{}");
  } catch {
    localStorage.removeItem("salaries_by_user");
    return {};
  }
}

function saveAllSalariesByUser(obj) {
  localStorage.setItem("salaries_by_user", JSON.stringify(obj));
}

function getCurrentUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return (localStorage.getItem("currentUserEmail") || user.email || "anonymous").toLowerCase().trim();
  } catch {
    return "anonymous";
  }
}

function normalizeMonth(input) {
  const iso = input.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (iso) return iso[0];
  const parsed = new Date(input);
  if (!isNaN(parsed)) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  return null;
}

function formatSalary(amount) {
  const num = parseFloat(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function reloadSalaryList() {
  const email = getCurrentUserEmail();
  const all = loadAllSalariesByUser();
  const userSalaries = all[email] || {};

  allSalaries = Object.entries(userSalaries).map(([month, amount]) => ({ month, amount }));
  allSalaries.sort((a, b) => (a.month < b.month ? 1 : -1));
  currentPage = 1;
  renderSalaries();
}

function renderSalaries() {
  const salaryHistory = document.getElementById("salaryHistory");
  if (!salaryHistory) return;
  salaryHistory.innerHTML = "";
  const endIndex = currentPage * itemsPerPage;
  const visible = allSalaries.slice(0, endIndex);

  if (visible.length === 0) {
    salaryHistory.innerHTML = "<p>No salary records found.</p>";
    const lm = document.getElementById("loadMoreBtn");
    if (lm) lm.style.display = "none";
    return;
  }

  visible.forEach(sal => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg mb-2";
    div.innerHTML = `
      <span class="dark:text-white">${sal.month}</span>
      <div class="flex items-center gap-4">
        <span class="font-bold dark:text-white">${formatSalary(sal.amount)}</span>
        <button aria-label="Delete salary for ${sal.month}" class="text-red-500 hover:text-red-700" data-month="${sal.month}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    const deleteBtn = div.querySelector('button');
    deleteBtn.addEventListener('click', () => deleteSalary(sal.month));
    salaryHistory.appendChild(div);
  });

  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.style.display = endIndex >= allSalaries.length ? "none" : "block";
  }
}

function deleteSalary(month) {
  const email = getCurrentUserEmail();
  const all = loadAllSalariesByUser();
  if (!all[email] || !all[email][month]) {
    Swal.fire({ icon: 'error', title: 'Not Found', text: `Salary record for ${month} not found!` });
    return;
  }

  Swal.fire({
    title: `Delete salary for ${month}?`,
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel"
  }).then(result => {
    if (result.isConfirmed) {
      delete all[email][month];
      saveAllSalariesByUser(all);
      reloadSalaryList();
      Swal.fire({ icon: 'success', title: 'Deleted', text: `Salary for ${month} has been successfully deleted.` });
    }
  });
}

// Migration of legacy per-key salaries (optional, safe to run each load)
function migrateLegacySalaryKeys() {
  const all = loadAllSalariesByUser();
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("salary_")) {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const email = parts[1].toLowerCase().trim();
        const month = parts.slice(2).join('_');
        const amount = localStorage.getItem(key);
        if (!all[email]) all[email] = {};
        if (amount && !all[email][month]) {
          all[email][month] = parseFloat(amount).toFixed(2);
        }
        // optional: localStorage.removeItem(key);
      }
    }
  });
  saveAllSalariesByUser(all);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("salaryForm");
  const statusEl = document.getElementById("salaryStatus");
  const clearBtn = document.getElementById("clearBtn");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  migrateLegacySalaryKeys();
  reloadSalaryList();

  form?.addEventListener("submit", function (e) {
    e.preventDefault();
    const monthRaw = document.getElementById("month")?.value.trim() || "";
    const salaryInput = document.getElementById("salary")?.value;
    const salary = parseFloat(salaryInput);
    const month = normalizeMonth(monthRaw);
    if (!month || isNaN(salary) || salary <= 0) {
      if (statusEl) statusEl.textContent = "⚠️ Please enter a valid month (YYYY-MM) and salary amount.";
      return;
    }

    const email = getCurrentUserEmail();
    const all = loadAllSalariesByUser();
    if (!all[email]) all[email] = {};
    all[email][month] = salary.toFixed(2);
    saveAllSalariesByUser(all);

    if (statusEl) statusEl.textContent = "✅ Salary saved!";
    form.reset();
    reloadSalaryList();
  });

  clearBtn?.addEventListener("click", function () {
    document.getElementById("month").value = "";
    document.getElementById("salary").value = "";
    if (statusEl) statusEl.textContent = "";
  });

  loadMoreBtn?.addEventListener("click", () => {
    currentPage++;
    renderSalaries();
  });
});
