// Get the logout button
const logoutButton = document.getElementById('logOut');

// When the logout button is clicked
logoutButton.addEventListener('click', (e) => {
  e.preventDefault();

  // Send a request to the admin logout route
  fetch('/admin/api/v1/admin_logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  })
  .then((response) => {
    window.location.href = '/admin/login';
  });
});