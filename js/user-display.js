// user-display.js
function updateUserDisplay() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || 
                     { email: "guest@example.com", username: "Guest" };

  // Update all user display elements
  const usernameElements = document.querySelectorAll('#logged-in-username, #nav-username');
  const emailElements = document.querySelectorAll('#logged-in-email');
  
  usernameElements.forEach(el => {
    if (el) el.textContent = currentUser.username || currentUser.email.split('@')[0];
  });
  
  emailElements.forEach(el => {
    if (el) el.textContent = currentUser.email;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateUserDisplay();

// Improved DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded"); // Debug log
  
  // First try to update immediately
  updateUserDisplay();
  
  // Then set up a mutation observer in case elements load dynamically
  // Set up mutation observer for dynamically loaded elements
  const observer = new MutationObserver(function(mutations) {
    updateUserDisplay();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Add logout functionality
  const logoutBtn = document.getElementById('user-nav');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout'
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('currentUserEmail');
          window.location.href = "index.html";
        }
      });
    });
  }
});

// Also call this after successful login
// You should have this in your login.js or similar file
function onLoginSuccess(user) {
  localStorage.setItem('currentUserEmail', user.email);
  updateUserDisplay();
}