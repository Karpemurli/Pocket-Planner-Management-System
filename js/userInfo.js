// userInfo.js

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "../index.html?error=not_logged_in";
    return;
  }

  const username = currentUser.username || currentUser.email.split("@")[0];
  const email = currentUser.email;

  const domUsername = document.getElementById("logged-in-username");
  const domNavUsername = document.getElementById("nav-username");
  const domEmail = document.getElementById("logged-in-email");

  if (domUsername) domUsername.textContent = username;
  if (domNavUsername) domNavUsername.textContent = username;
  if (domEmail) domEmail.textContent = email;
});
