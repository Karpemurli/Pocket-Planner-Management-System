// logout.js
document.addEventListener('DOMContentLoaded', function() {
  document.body.addEventListener('click', function(e) {
    if (e.target.closest('#user-nav')) {
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
          // Only remove session-specific data
          localStorage.removeItem("currentUser");
          localStorage.removeItem("currentUserEmail");
          localStorage.removeItem("otpVerified");
          window.location.href = "index.html?logout=true";
        }
      });
    }
  });
});