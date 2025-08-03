//report.js

document.getElementById("reportFilterForm").addEventListener("submit", function (e) {
    e.preventDefault();
    generateReport();
});

function generateReport() {
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;
    const category = document.getElementById("category").value;

    if (!fromDate || !toDate) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please select both from and to dates!',
        });
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userEmail = currentUser.email;

    // Get all financial data
    const allData = getAllFinancialData(userEmail, fromDate, toDate, category);

    displayFinancialReport(allData);
    renderChart(allData);
}

function getAllFinancialData(userEmail, fromDate, toDate, category) {
    // 1. Get salary data
    const salaryData = getSalaryData(userEmail, fromDate, toDate);

    // 2. Get transactions
    const allTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    const filteredTransactions = filterTransactions(allTransactions, userEmail, fromDate, toDate, category);

    // 3. Process and combine all data
    return processFinancialData(filteredTransactions, salaryData);
}

function getSalaryData(userEmail, fromDate, toDate) {
    const salaryRecords = [];
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    // Get the salaries_by_user object from localStorage
    const salariesByUser = JSON.parse(localStorage.getItem("salaries_by_user") || "{}");
    
    // Check if user exists in salaries data
    if (!salariesByUser[userEmail]) {
        return salaryRecords;
    }

    const userSalaries = salariesByUser[userEmail];
    
    // Loop through each month in date range
    const current = new Date(from);
    current.setDate(1); // Start from first day of month

    while (current <= to) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;
        
        // Check if salary exists for this month
        if (userSalaries[monthKey]) {
            const amount = parseFloat(userSalaries[monthKey]) || 0;
            
            if (amount > 0) {
                salaryRecords.push({
                    id: `salary-${year}-${month}`,
                    type: "Income",
                    category: "Salary",
                    amount: amount,
                    date: `${year}-${month}-01`,
                    title: `Monthly Salary (${year}-${month})`,
                    paymentMethod: "Bank Transfer",
                    description: `Salary for ${year}-${month}`,
                    isSalary: true
                });
            }
        }

        current.setMonth(current.getMonth() + 1); // Move to next month
    }

    return salaryRecords;
}
function filterTransactions(transactions, userEmail, fromDate, toDate, category) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // Include the whole `toDate` day

    return transactions.filter(txn => {
        if (!txn || !txn.date) return false;

        const txnDate = new Date(txn.date);
        return (
            txn.userEmail === userEmail &&
            txnDate >= from &&
            txnDate <= to &&
            (category === "" || txn.category === category)
        );
    });
}

function processFinancialData(transactions, salaryData) {
    const categorySummary = { income: {}, expense: {} };
    const paymentMethodSummary = { income: {}, expense: {} };

    // Process transactions to ensure proper format and populate summaries
    const processedTransactions = transactions.map(txn => {
        let type = txn.type || "";
        // Normalize type to canonical form ("Income" / "Expense")
        type = type.trim().toLowerCase();
        if (type === "") {
            type = (parseFloat(txn.amount) || 0) >= 0 ? "Income" : "Expense";
        } else if (type === "income" || type === "in") {
            type = "Income";
        } else if (type === "expense" || type === "exp") {
            type = "Expense";
        } else {
            // Fallback: treat positive as income, negative as expense
            type = (parseFloat(txn.amount) || 0) >= 0 ? "Income" : "Expense";
        }


        const amount = parseFloat(txn.amount) || 0;
        const category = txn.category || 'Uncategorized';
        const paymentMethod = txn.paymentMethod || 'Unknown';
        const isIncome = type === "Income";

        // Update category summary
        const categoryMap = isIncome ? categorySummary.income : categorySummary.expense;
        categoryMap[category] = (categoryMap[category] || 0) + Math.abs(amount);

        // Update payment method summary
        const paymentMap = isIncome ? paymentMethodSummary.income : paymentMethodSummary.expense;
        paymentMap[paymentMethod] = (paymentMap[paymentMethod] || 0) + Math.abs(amount);

        return {
            ...txn,
            type,
            isSalary: false,
            amount: Math.abs(amount), // Ensure amount is positive for calculations
            date: txn.date || new Date().toISOString().split('T')[0],
            description: txn.description || 'No description provided',
            paymentMethod: txn.paymentMethod || 'N/A'
        };

    });

    // Combine with salary data and sort by date (newest first)
    const combinedData = [...salaryData, ...processedTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
        transactions: combinedData,
        categorySummary,
        paymentMethodSummary
    };
}

function displayFinancialReport(allProcessedData) {
    const container = document.getElementById("filteredTransactions");
    container.innerHTML = "";

    const data = allProcessedData.transactions;
    const categorySummary = allProcessedData.categorySummary;
    const paymentMethodSummary = allProcessedData.paymentMethodSummary;

    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-file-alt text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">No financial data found for selected period</p>
            </div>
        `;
        return;
    }

    // Calculate financial summary
    const summary = calculateFinancialSummary(data);

    // Display summary cards
    container.innerHTML += createSummaryCards(summary);

    // Display Category-wise Summary
    container.innerHTML += createCategorySummarySection(categorySummary);

    // Display Payment Method Summary
    container.innerHTML += createPaymentMethodSummarySection(paymentMethodSummary);

    // Display all transactions
    const transactionsContainer = document.createElement("div");
    transactionsContainer.className = "space-y-4 mt-6";
    data.forEach(item => {
        transactionsContainer.appendChild(createTransactionCard(item));
    });
    container.appendChild(transactionsContainer);
}

function calculateFinancialSummary(data) {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSalary = 0;
    let totalOtherIncome = 0;
    
    data.forEach(item => {
        const amount = item.amount;
        if (item.type === "Income" || item.isSalary) {  // Include both income and salary items
            totalIncome += amount;
            if (item.isSalary) {
                totalSalary += amount;
            } else {
                totalOtherIncome += amount;
            }
        } else { // Expense
            totalExpenses += amount;
        }
    });
    
    return {
        totalIncome,
        totalExpenses,
        totalSalary,
        totalOtherIncome,
        netSavings: totalIncome - totalExpenses,
        transactionCount: data.length
    };
}


function createSummaryCards(summary) {
    const formatRupee = val => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 class="text-sm font-medium text-blue-800">Total Income</h3>
                <p class="text-2xl font-bold text-blue-900">${formatRupee(summary.totalIncome)}</p>
                <p class="text-xs text-blue-600 mt-1">Salary: ${formatRupee(summary.totalSalary)} | Other: ${formatRupee(summary.totalOtherIncome)}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 class="text-sm font-medium text-red-800">Total Expenses</h3>
                <p class="text-2xl font-bold text-red-900">${formatRupee(summary.totalExpenses)}</p>
            </div>
            <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <h3 class="text-sm font-medium text-emerald-800">Net Savings</h3>
                <p class="text-2xl font-bold text-emerald-900">${formatRupee(summary.netSavings)}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h3 class="text-sm font-medium text-yellow-800">Total Transactions</h3>
                <p class="text-2xl font-bold text-yellow-900">${summary.transactionCount}</p>
            </div>
        </div>
    `;
}
function createCategorySummarySection(summary) {
    const formatRupee = val => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    let incomeHtml = '';
    for (const category in summary.income) {
        incomeHtml += `<li class="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                        <span class="text-slate-600">${category}</span>
                        <span class="font-semibold text-emerald-600">${formatRupee(summary.income[category])}</span>
                      </li>`;
    }
    let expenseHtml = '';
    for (const category in summary.expense) {
        expenseHtml += `<li class="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                        <span class="text-slate-600">${category}</span>
                        <span class="font-semibold text-red-600">${formatRupee(summary.expense[category])}</span>
                      </li>`;
    }

    if (incomeHtml === '' && expenseHtml === '') {
        return ''; // Don't show section if no data
    }

    return `
        <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Category-wise Summary</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${incomeHtml ? `
                    <div>
                        <h3 class="text-lg font-semibold text-emerald-700 mb-2">Income by Category</h3>
                        <ul class="list-none p-0 m-0">${incomeHtml}</ul>
                    </div>
                ` : ''}
                ${expenseHtml ? `
                    <div>
                        <h3 class="text-lg font-semibold text-red-700 mb-2">Expenses by Category</h3>
                        <ul class="list-none p-0 m-0">${expenseHtml}</ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function createPaymentMethodSummarySection(summary) {
    const formatRupee = val => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    let incomeHtml = '';
    for (const method in summary.income) {
        incomeHtml += `<li class="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                        <span class="text-slate-600">${method}</span>
                        <span class="font-semibold text-emerald-600">${formatRupee(summary.income[method])}</span>
                      </li>`;
    }
    let expenseHtml = '';
    for (const method in summary.expense) {
        expenseHtml += `<li class="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                        <span class="text-slate-600">${method}</span>
                        <span class="font-semibold text-red-600">${formatRupee(summary.expense[method])}</span>
                      </li>`;
    }

    if (incomeHtml === '' && expenseHtml === '') {
        return ''; // Don't show section if no data
    }

    return `
        <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Payment Method Summary</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${incomeHtml ? `
                    <div>
                        <h3 class="text-lg font-semibold text-emerald-700 mb-2">Income by Method</h3>
                        <ul class="list-none p-0 m-0">${incomeHtml}</ul>
                    </div>
                ` : ''}
                ${expenseHtml ? `
                    <div>
                        <h3 class="text-lg font-semibold text-red-700 mb-2">Expenses by Method</h3>
                        <ul class="list-none p-0 m-0">${expenseHtml}</ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}



function createTransactionCard(transaction) {
    const isIncome = transaction.type === 'Income' || transaction.isSalary;
    const bgClass = isIncome ? 'bg-emerald-50' : 'bg-red-50';
    const iconClass = isIncome ? 'text-emerald-500' : 'text-red-500';
    const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
    const sign = isIncome ? '+' : '-';
    const title = transaction.title || 'N/A';
    const category = transaction.category || 'N/A';
    const dateStr = transaction.date ? formatDate(transaction.date) : 'N/A';
    const description = transaction.description || 'No description provided.';
    const paymentMethod = transaction.paymentMethod || 'N/A';

    return `
        <div class="transaction-card ${bgClass} p-4 rounded-lg shadow-sm border ${isIncome ? 'border-emerald-100' : 'border-red-100'}">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="p-3 mr-4 rounded-full bg-white shadow-sm">
                        <i class="fas ${icon} ${iconClass}"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-slate-700">${title}</h4>
                        <p class="text-xs text-slate-500">${category} • ${dateStr}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}">${sign}₹${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    ${transaction.isSalary ? '<span class="text-xs text-blue-600 block">Salary</span>' : ''}
                </div>
            </div>
            ${description ? `<p class="mt-2 text-sm text-slate-600">Description: ${description}</p>` : ''}
            <p class="mt-1 text-xs text-slate-500">Paid via: ${paymentMethod}</p>
        </div>
    `;
}

// Placeholder for renderChart function (assuming it's defined elsewhere or will be implemented)
function renderChart(data) {
    // This function would take the processed data (data.transactions) and
    // data.categorySummary, data.paymentMethodSummary
    // and render appropriate charts using a charting library (e.g., Chart.js, D3.js)
    console.log("Chart rendering would happen here with data:", data);
    // Example: You might clear a canvas and draw new charts based on the summary data.
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return "Unknown date";
    }
}

// Initialize with current month's data
document.addEventListener("DOMContentLoaded", function () {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById("fromDate").value = formatDateForInput(firstDay);
    document.getElementById("toDate").value = formatDateForInput(lastDay);

    // Generate initial report
    generateReport();
});

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

document.getElementById("clearAllBtn").addEventListener("click", function () {
    document.getElementById("reportFilterForm").reset();
    document.getElementById("filteredTransactions").innerHTML = "";

    // Reset to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById("fromDate").value = formatDateForInput(firstDay);
    document.getElementById("toDate").value = formatDateForInput(lastDay);

    generateReport(); // Regenerate report with current month's data
});
