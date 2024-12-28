// Get the admin form
const loginForm = document.getElementById('loginForm');

// Get the password input box
const adminPassword = document.getElementById('admin-password');

// Add a submit handler to the login form
loginForm.addEventListener('submit', (e) => {
  // Prevent the form redirect
  e.preventDefault();

  // Send a fetch request to the server logging in using the password provided
  fetch('/admin/api/v1/admin_login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      adminPassword: adminPassword.value,
    }),
  })
  .then((response) => response.json())
  .then((response) => {
    // If the action failed
    if (response.failed) {
      alert(`Action failed. Message: ${response.message}`);
    }
    else {
      window.location.href = '/admin/home';
    }
  });
});