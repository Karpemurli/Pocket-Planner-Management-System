
//signup.js
document.getElementById('signupForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Add email format validation
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  showError('Please enter a valid email address');
  return;
}

  // Basic validation
  if (!username || !email || !password) {
    Swal.fire({
  icon: 'warning',
  title: 'Missing Fields',
  text: 'Please fill in all fields.',
  confirmButtonColor: '#f39c12'
});

    return;
  }

  // Fetch existing users from localStorage or initialize empty array
  let users = JSON.parse(localStorage.getItem('users')) || [];

  // Check if email already exists
  const userExists = users.some(user => user.email === email);
  if (userExists) {
   Swal.fire({
  icon: 'warning',
  title: 'Email Already Registered',
  text: 'Please use a different email address.',
  timer: 2500,
  showConfirmButton: false
});


    return;
  }

  // Create new user object
  const newUser = { username, email, password };

  // Save to localStorage
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

 Swal.fire({
  icon: 'success',
  title: 'Signup Successful!',
  text: 'Redirecting to login page...',
  confirmButtonColor: '#3085d6',
  timer: 2000,
  showConfirmButton: false
}).then(() => {
  window.location.href = "index.html";
});

});

