// Form fields for the Add User form
const addUserFullName = document.querySelector('#addUserFullName');
const addUserGroup = document.querySelector('#addUserGroup');
const addUserSubmit = document.querySelector('#addUserSubmit');
const addUserForm = document.querySelector('#addUserForm');

// When the add user form is submitted
const onAddUserSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/add_user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: addUserFullName.value,
      group: addUserGroup.value,
    }),
  })
  .then((response) => response.json())
  .then((response) => {
    // If the action failed
    if (response.failed) {
      alert('Action failed.');
    }
    else {
      alert('Action successful. Message: ' + response.message);
    }
  });
}

// Add the submit listeners
addUserForm.addEventListener('submit', (e) => { e.preventDefault(); onAddUserSubmit(); });

// Form fields for the Add User form
const lockUserFullName = document.querySelector('#lockUserFullName');
const lockUserUID = document.querySelector('#lockUserUID');
const lockUserGroup = document.querySelector('#lockUserGroup');
const lockUserSubmit = document.querySelector('#lockUserSubmit');
const lockUserForm = document.querySelector('#lockUserForm');

// When the add user form is submitted
const onlockUserSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/lock_user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: lockUserFullName.value,
      UID: lockUserUID.value,
    }),
  })
  .then((response) => response.json())
  .then((response) => {
    // If the action failed
    if (response.failed) {
      alert('Action failed.');
    }
    else {
      alert('Action successful.');
    }
  });
}

// Add the submit listeners
lockUserForm.addEventListener('submit', (e) => { e.preventDefault(); onlockUserSubmit(); });

// Form fields for the Add User form
const unlockUserFullName = document.querySelector('#unlockUserFullName');
const unlockUserUID = document.querySelector('#unlockUserUID');
const unlockUserGroup = document.querySelector('#unlockUserGroup');
const unlockUserSubmit = document.querySelector('#unlockUserSubmit');
const unlockUserForm = document.querySelector('#unlockUserForm');

// When the add user form is submitted
const onUnlockUserSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/unlock_user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: unlockUserFullName.value,
      UID: unlockUserUID.value,
    }),
  })
  .then((response) => response.json())
  .then((response) => {
    // If the action failed
    if (response.failed) {
      alert('Action failed.');
    }
    else {
      alert('Action successful.');
    }
  });
}

// Add the submit listeners
unlockUserForm.addEventListener('submit', (e) => { e.preventDefault(); onUnlockUserSubmit(); });