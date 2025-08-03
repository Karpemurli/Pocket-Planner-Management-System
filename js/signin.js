
//siginn.js
// Authentication Utility Functions
function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonColor: '#3085d6'
  });
}

function showSuccess(message) {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    confirmButtonColor: '#3085d6'
  });
}

// Environment flag: false in production to hide demo OTP
const isDevEnvironment = true;

function sendOTP(email) {
  // Generate random 6-digit OTP
  const demoOTP = Math.floor(100000 + Math.random() * 900000).toString();

  localStorage.setItem(`otp_${email}`, demoOTP);
  localStorage.setItem(`otp_expiry_${email}`, Date.now() + 300000); // 5 minutes expiry

  console.log(`Demo OTP for ${email}: ${demoOTP}`);
  return demoOTP;
}

function showOtpSection(email, demoOTP) {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.style.display = 'none';

  const otpSection = document.getElementById('otpSection');
  if (otpSection) {
    otpSection.innerHTML = `
      <div class="otp-card">
        <h2 class="otp-title">Verify Your Identity</h2>
        <p class="otp-sent-message">OTP sent to: <strong class="email-display">${email}</strong></p>

        <div class="otp-input-container" aria-label="OTP input fields">
          <input type="text" maxlength="1" class="otp-digit" data-index="0" inputmode="numeric" pattern="[0-9]*" aria-label="OTP Digit 1" autofocus>
          <input type="text" maxlength="1" class="otp-digit" data-index="1" inputmode="numeric" pattern="[0-9]*" aria-label="OTP Digit 2">
          <input type="text" maxlength="1" class="otp-digit" data-index="2" inputmode="numeric" pattern="[0-9]*" aria-label="OTP Digit 3">
          <input type="text" maxlength="1" class="otp-digit" data-index="3" inputmode="numeric" pattern="[0-9]*" aria-label="OTP Digit 4">
          <input type="text" maxlength="1" class="otp-digit" data-index="4" inputmode="numeric" pattern="[0-9]*" aria-label="OTP Digit 5">
          <input type="text" maxlength="1" class="otp-digit" data-index="5" inputmode="numeric" pattern="[0-9]*" aria-label="OTP Digit 6">
        </div>

        <div class="otp-demo-container">
          <p class="otp-demo-text" ${!isDevEnvironment ? 'style="display:none;"' : ''}>Demo OTP: <span class="demo-otp-code">${demoOTP}</span></p>
          <p class="otp-timer" id="otpTimer">05:00</p>
        </div>

        <div class="otp-button-container">
          <button id="verifyOtpBtn" class="otp-verify-btn" disabled>Verify OTP</button>
          <button id="cancelOtpBtn" class="otp-cancel-btn">Cancel</button>
        </div>

        <p class="otp-resend-text">
          Didn't receive code? <a href="#" id="resendOtpLink" class="otp-resend-link">Resend OTP</a>
        </p>

        <p id="otpMessage" class="otp-message" aria-live="polite"></p>
      </div>
    `;
    otpSection.style.display = 'block';

    setupOtpSectionEvents(email);
    setupOtpInputLogic();
    monitorOtpInputs();
    startOtpTimer(email);
  }
}

function setupOtpInputLogic() {
  const otpDigits = document.querySelectorAll('.otp-digit');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');

  otpDigits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');

      if (e.target.value.length === 1 && index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
      }

      // Auto-submit on last digit
      const otp = Array.from(otpDigits).map(i => i.value).join('');
      if (otp.length === 6) {
        // small delay so user sees last digit
        setTimeout(() => {
          if (!verifyOtpBtn.disabled) {
            verifyOtpBtn.click();
          }
        }, 100);
      }
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
        otpDigits[index - 1].focus();
      }
    });
  });
}

function monitorOtpInputs() {
  const otpDigits = document.querySelectorAll('.otp-digit');
  const verifyBtn = document.getElementById('verifyOtpBtn');
  otpDigits.forEach(input => {
    input.addEventListener('input', () => {
      const otp = Array.from(otpDigits).map(i => i.value).join('');
      verifyBtn.disabled = otp.length !== 6;
    });
  });
}

function startOtpTimer(email) {
  let timeLeft = 300;
  const timerElement = document.getElementById('otpTimer');

  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
  }

  window.otpTimerInterval = setInterval(() => {
    timeLeft--;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (timeLeft <= 0) {
      clearInterval(window.otpTimerInterval);
      timerElement.textContent = "Expired";
      timerElement.style.color = "#dc3545";
      localStorage.removeItem(`otp_${email}`);
      localStorage.removeItem(`otp_expiry_${email}`);
      showError("OTP has expired. Please resend.");
    }
  }, 1000);
}

function setupOtpSectionEvents(email) {
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', function () {
      const otpDigits = document.querySelectorAll('.otp-digit');
      const otp = Array.from(otpDigits).map(input => input.value).join('');

      if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        showError('Please enter a valid 6-digit OTP');
        otpDigits.forEach(input => {
          input.style.borderColor = '#dc3545';
        });
        otpDigits[0].focus();
        return;
      }
      verifyOTP(email, otp);
    });
  }

  const cancelOtpBtn = document.getElementById('cancelOtpBtn');
  if (cancelOtpBtn) {
    cancelOtpBtn.addEventListener('click', function () {
      hideOtpSection();
    });
  }

  const resendOtpLink = document.getElementById('resendOtpLink');
  if (resendOtpLink) {
    resendOtpLink.addEventListener('click', function (e) {
      e.preventDefault();
      const demoOTP = sendOTP(email);
      const otpDigits = document.querySelectorAll('.otp-digit');
      otpDigits.forEach(input => {
        input.value = '';
        input.style.borderColor = '';
      });
      otpDigits[0].focus();

      const demoElem = document.querySelector('.demo-otp-code');
      if (demoElem) demoElem.textContent = demoOTP;

      const timerElement = document.getElementById('otpTimer');
      timerElement.textContent = "05:00";
      timerElement.style.color = "";
      startOtpTimer(email);

      showSuccess(`New OTP sent to ${email}! (Demo: ${demoOTP})`);
    });
  }
}

function hideOtpSection() {
  const otpSection = document.getElementById('otpSection');
  const loginForm = document.getElementById('loginForm');

  if (otpSection) otpSection.style.display = 'none';
  if (loginForm) loginForm.style.display = 'block';

  const email = localStorage.getItem('pendingLoginEmail');
  if (email) {
    localStorage.removeItem(`otp_${email}`);
    localStorage.removeItem(`otp_expiry_${email}`);
    localStorage.removeItem('pendingLoginEmail');
  }
}

function verifyOTP(email, otp) {
  const storedOTP = localStorage.getItem(`otp_${email}`);
  const otpExpiry = localStorage.getItem(`otp_expiry_${email}`);

  if (!storedOTP || !otpExpiry || Date.now() > parseInt(otpExpiry)) {
    showError("OTP expired or invalid. Please resend.");
    localStorage.removeItem(`otp_${email}`);
    localStorage.removeItem(`otp_expiry_${email}`);
    return;
  }

  if (otp === storedOTP) {
    localStorage.setItem("otpVerified", "true");
    localStorage.removeItem(`otp_${email}`);
    localStorage.removeItem(`otp_expiry_${email}`);
    showSuccess("Login successful! Redirecting to dashboard...");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } else {
    showError("Incorrect OTP. Please try again.");
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
    const otpDigits = document.querySelectorAll('.otp-digit');
    otpDigits.forEach(input => {
      input.style.borderColor = '#dc3545';
    });
    otpDigits[0].focus();
  }
}

// User Authentication Logic
function authenticateUser(email, password) {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("currentUserEmail", email);
    localStorage.setItem('pendingLoginEmail', email);
    localStorage.removeItem("otpVerified");

    const demoOTP = sendOTP(email);
    showOtpSection(email, demoOTP);
    showSuccess(`OTP sent to ${email}! (Demo: ${demoOTP})`);
  } else {
    showError("Invalid email or password.");
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
  // hide the old subtitle if present (defensive)
  const subtitle = document.querySelector('h4 + p');
  if (subtitle && subtitle.textContent.trim().includes('Enter your email and password to sign in')) {
    subtitle.style.display = 'none';
  }

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        showError("Please enter both email and password");
        return;
      }

      authenticateUser(email, password);
    });
  }

  const otpSection = document.getElementById('otpSection');
  if (otpSection) otpSection.style.display = 'none';
});

// Helper function to set initial demo user
function setInitialDemoUser() {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.length === 0) {
    const demoUser = {
      id: Date.now().toString(),
      username: "Piya",
      email: "p@gmail.com",
      password: "123"
    };
    localStorage.setItem("users", JSON.stringify([demoUser]));
  }
}

document.addEventListener('DOMContentLoaded', setInitialDemoUser);
