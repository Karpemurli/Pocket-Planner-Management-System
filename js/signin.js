// ========== Utility for Alerts ==========
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

// ========== OTP Generation & Storage ==========
function sendOTP(email) {
  const demoOTP = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem(`otp_${email}`, demoOTP);
  localStorage.setItem(`otp_expiry_${email}`, Date.now() + 300000); // 5 minutes
  console.log(`Demo OTP for ${email}: ${demoOTP}`); // remove in production
  return demoOTP;
}

// ========== Display OTP Section ==========
function showOtpSection(email, demoOTP) {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.style.display = 'none';

  const otpSection = document.getElementById('otpSection');
  if (!otpSection) return;

  otpSection.innerHTML = `
    <div class="otp-card">
      <h2 class="otp-title">Verify Your Identity</h2>
      <p class="otp-sent-message">
        OTP sent to: <strong class="email-display">${email}</strong>
      </p>

      <div class="otp-single-container" aria-label="OTP input">
        <input type="text" id="singleOtpInput" maxlength="6" inputmode="numeric" pattern="\\d*"
          aria-label="Enter 6-digit OTP" placeholder="Enter OTP"
          class="otp-single-box" autocomplete="one-time-code" />
      </div>

      <div class="otp-demo-container">
        <p class="otp-demo-text" ${!isDevEnvironment ? 'style="display:none;"' : ''}>
          Demo OTP: <span class="demo-otp" id="demoOtp">${demoOTP}</span>
        </p>
        <p class="otp-timer" id="otpTimer">05:00</p>
      </div>

      <div class="otp-button-container">
        <button id="verifyOtpBtn" type="button" class="otp-verify-btn" disabled>Verify OTP Code</button>
        <button id="cancelOtpBtn" type="button" class="otp-cancel-btn">Cancel</button>
      </div>

      <p class="otp-resend-text">
        Didn't receive code? <span><a href="#" id="resendOtpLink" class="otp-resend-link">Resend OTP</a></span>
      </p>

      <p id="otpMessage" class="otp-message" aria-live="polite"></p>
    </div>
  `;

  otpSection.style.display = 'block';

  monitorSingleOtpInput();
  setupOtpSectionEvents(email);
  startOtpTimer(email);
}

// ========== Single OTP Input Monitoring ==========
function monitorSingleOtpInput() {
  const otpInput = document.getElementById('singleOtpInput');
  const verifyBtn = document.getElementById('verifyOtpBtn');
  if (!otpInput || !verifyBtn) return;

  otpInput.addEventListener('input', () => {
    // Only digits, max 6
    let val = otpInput.value.replace(/\D/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    otpInput.value = val;
    verifyBtn.disabled = val.length !== 6;
  });
}

// ========== Timer ==========
function startOtpTimer(email) {
  let timeLeft = 300;
  const timerElement = document.getElementById('otpTimer');
  if (!timerElement) return;

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

// ========== OTP Section Events ==========
function setupOtpSectionEvents(email) {
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', function () {
      const otpInput = document.getElementById('singleOtpInput');
      const otp = otpInput ? otpInput.value.trim() : '';

      if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        showError('Please enter a valid 6-digit OTP');
        if (otpInput) {
          otpInput.style.borderColor = '#dc3545';
          otpInput.focus();
        }
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
      // Rate-limit UI feedback: briefly disable
      resendOtpLink.setAttribute('aria-disabled', 'true');
      setTimeout(() => {
        resendOtpLink.removeAttribute('aria-disabled');
      }, 3000);

      const demoOTP = sendOTP(email);

      const otpInput = document.getElementById('singleOtpInput');
      if (otpInput) {
        otpInput.value = '';
        otpInput.style.borderColor = '';
        otpInput.focus();
      }

      const demoElem = document.getElementById('demoOtp') || document.querySelector('.demo-otp');
      if (demoElem) demoElem.textContent = demoOTP;

      const timerElement = document.getElementById('otpTimer');
      if (timerElement) {
        timerElement.textContent = "05:00";
        timerElement.style.color = "";
      }

      const verifyBtn = document.getElementById('verifyOtpBtn');
      if (verifyBtn) verifyBtn.disabled = true;

      showSuccess(`New OTP sent to ${email}! (Demo: ${demoOTP})`);
      startOtpTimer(email);
    });
  }
}

// ========== Hide OTP Section ==========
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

// ========== Verify OTP Logic ==========
function verifyOTP(email, otp) {
  const storedOTP = localStorage.getItem(`otp_${email}`);
  const otpExpiry = localStorage.getItem(`otp_expiry_${email}`);

  if (!storedOTP || !otpExpiry || Date.now() > parseInt(otpExpiry, 10)) {
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
    const otpInput = document.getElementById('singleOtpInput');
    if (otpInput) {
      otpInput.style.borderColor = '#dc3545';
      otpInput.focus();
    }
  }
}

// ========== User Authentication ==========
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
    if (isDevEnvironment) {
      showSuccess(`OTP sent to ${email}! (Demo: ${demoOTP})`);
    } else {
      showSuccess(`OTP sent to ${email}!`);
    }
  } else {
    showError("Invalid email or password.");
  }
}

// ========== Initial Demo User ==========
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

// ========== DOM Ready ==========
document.addEventListener('DOMContentLoaded', function () {
  setInitialDemoUser();

  // hide the old subtitle if present
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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("Please enter a valid email address");
        return;
      }

      authenticateUser(email, password);
    });
  }

  const otpSection = document.getElementById('otpSection');
  if (otpSection) otpSection.style.display = 'none';
});
