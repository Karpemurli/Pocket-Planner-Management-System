//profile.js
document.addEventListener('DOMContentLoaded', function () {
  // Load user data
  const rawCurrentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!rawCurrentUser.email) {
    window.location.href = 'index.html?error=not_logged_in';
    return;
  }

  let users = JSON.parse(localStorage.getItem('users') || '[]');
  const currentEmailKey = localStorage.getItem('currentUserEmail') || rawCurrentUser.email;

  let userIndex = users.findIndex(u => u.email === currentEmailKey);
  let userData = userIndex !== -1 ? users[userIndex] : { ...rawCurrentUser };

  // Sync if mismatch between stored currentUserEmail and userData
  if (userIndex !== -1 && userData.email !== currentEmailKey) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('currentUserEmail', userData.email);
  }

  // DOM refs
  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const displayUsernameEl = document.getElementById('displayUsername');
  const displayEmailEl = document.getElementById('displayEmail');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const newPasswordSection = document.getElementById('newPasswordSection');
  const saveChangesBtn = document.getElementById('saveChangesBtn');
  const verifyBtn = document.getElementById('verifyBtn');
  const resendOtpLink = document.getElementById('resendOtp');
  const otpSection = document.getElementById('otpSection');
  const otpInputEl = document.getElementById('otp');
  const otpTimerEl = document.getElementById('otpTimer');
  const newPasswordEl = document.getElementById('newPassword');
  const confirmPasswordEl = document.getElementById('confirmPassword');

  // Prefill UI
  function refreshUIFromUser(u) {
    usernameEl.value = u.username || '';
    emailEl.value = u.email || '';
    displayUsernameEl.textContent = u.username || 'User';
    displayEmailEl.textContent = u.email || 'user@example.com';
  }
  refreshUIFromUser(userData);

  let otpTimerInterval = null;
  let pendingEmailForOTP = null;

  changePasswordBtn.addEventListener('click', function () {
    newPasswordSection.classList.toggle('hidden');
  });

  saveChangesBtn.addEventListener('click', function () {
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const newPassword = newPasswordEl.value;
    const confirmPassword = confirmPasswordEl.value;

    if (newPassword) {
      if (newPassword.length < 6) {
        Swal.fire({ icon: 'error', title: 'Password Too Short', text: 'Password must be at least 6 characters!' });
        return;
      }
      if (newPassword !== confirmPassword) {
        Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'New passwords do not match!' });
        return;
      }
    }

    if (email !== userData.email) {
      // Email change requires OTP
      otpSection.classList.remove('hidden');
      pendingEmailForOTP = email;
      generateAndSendOTP(email);
      return;
    }

    saveProfileChanges(username, email, newPassword);
  });

  verifyBtn.addEventListener('click', function () {
    const otpInput = otpInputEl.value.trim();
    if (!pendingEmailForOTP) {
      Swal.fire({ icon: 'error', title: 'No Pending Email', text: 'Please initiate email change to get OTP.' });
      return;
    }

    const storedOTP = localStorage.getItem('otp_' + pendingEmailForOTP);
    const expiry = parseInt(localStorage.getItem('otp_expiry_' + pendingEmailForOTP), 10) || 0;

    if (Date.now() > expiry) {
      Swal.fire({ icon: 'error', title: 'OTP Expired', text: 'Please resend OTP and try again.' });
      return;
    }

    if (otpInput === storedOTP) {
      const username = usernameEl.value.trim();
      const newPassword = newPasswordEl.value;
      saveProfileChanges(username, pendingEmailForOTP, newPassword);
      otpSection.classList.add('hidden');

      // Cleanup
      localStorage.removeItem('otp_' + pendingEmailForOTP);
      localStorage.removeItem('otp_expiry_' + pendingEmailForOTP);
      pendingEmailForOTP = null;
      otpInputEl.value = '';
    } else {
      Swal.fire({ icon: 'error', title: 'Invalid OTP', text: 'The OTP you entered is incorrect!' });
    }
  });

  resendOtpLink.addEventListener('click', function (e) {
    e.preventDefault();
    const emailField = emailEl.value.trim();
    if (!emailField) return;
    pendingEmailForOTP = emailField;
    generateAndSendOTP(emailField);
    Swal.fire({ icon: 'success', title: 'OTP Resent', text: 'A new OTP has been sent to your email!' });
  });

 // profile.js - Update the saveProfileChanges function
function saveProfileChanges(username, email, newPassword) {
  let users = JSON.parse(localStorage.getItem("users") || "[]");
  const currentEmail = localStorage.getItem("currentUserEmail");
  
  let userIndex = users.findIndex(u => u.email === currentEmail);
  const updatedUser = { 
    ...users[userIndex], 
    username, 
    email,
    ...(newPassword && { password: newPassword })
  };

  // Update users array
  users[userIndex] = updatedUser;
  localStorage.setItem("users", JSON.stringify(users));
  
  // Update session data
  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  localStorage.setItem("currentUserEmail", updatedUser.email);
  
  // Refresh UI
  refreshUIFromUser(updatedUser);
  Swal.fire("Profile Updated", "Your changes have been saved permanently.", "success");
}

  function generateAndSendOTP(targetEmail) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('otp_' + targetEmail, otp);
    localStorage.setItem('otp_expiry_' + targetEmail, Date.now() + 300000); // 5 min
    console.log('OTP for', targetEmail, 'is:', otp);
    startOtpTimer();
  }

  function startOtpTimer() {
    let timeLeft = 120;
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    document.getElementById('resendOtp').classList.add('hidden');

    otpTimerInterval = setInterval(function () {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      otpTimerEl.textContent = `Resend in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      if (timeLeft <= 0) {
        clearInterval(otpTimerInterval);
        otpTimerEl.textContent = '';
        document.getElementById('resendOtp').classList.remove('hidden');
      }
      timeLeft--;
    }, 1000);
  }

  calculateYearlyStatistics();
});



function calculateYearlyStatistics() {
  const currentYear = new Date().getFullYear();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userEmail = currentUser.email || 'anonymous';

  // Get salary data from salaries_by_user structure
  const salariesByUser = JSON.parse(localStorage.getItem('salaries_by_user') || '{}');
  const userSalaries = salariesByUser[userEmail] || {};

  let totalSalary = 0;
  let totalExpenses = 0;
  let totalIncome = 0;
  let transactionCount = 0;

  // Calculate yearly salary
  Object.keys(userSalaries).forEach(monthKey => {
    if (monthKey.startsWith(currentYear)) {
      totalSalary += parseFloat(userSalaries[monthKey]) || 0;
    }
  });

  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

  transactions.forEach(transaction => {
    if (transaction.userEmail !== userEmail) return;

    try {
      const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
      
      if (transactionDate.getFullYear() === currentYear) {
        transactionCount++;
        const amount = parseFloat(transaction.amount) || 0;
        
        // Handle different transaction type formats
        const type = (transaction.type || '').toLowerCase();
        if (type.includes('expense') || amount < 0) {
          totalExpenses += Math.abs(amount);
        } else if (type.includes('income') || amount > 0) {
          totalIncome += Math.abs(amount);
        }
      }
    } catch (e) {
      console.error('Error processing transaction:', transaction, e);
    }
  });

  const totalBalance = totalSalary + totalIncome;
  const totalSavings = totalBalance - totalExpenses;

  // Update UI elements
  const updateElement = (id, value, isCurrency = true) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = isCurrency 
        ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : value;
    }
  };

  updateElement('yearlyBalance', totalBalance);
  updateElement('yearlySavings', totalSavings);
  updateElement('yearlyExpenses', totalExpenses);
  updateElement('yearlyTransactions', transactionCount, false);

  // Also update the account information
  const memberSinceEl = document.getElementById('memberSince');
  if (memberSinceEl) {
    memberSinceEl.textContent = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  }
}