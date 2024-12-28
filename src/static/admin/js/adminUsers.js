const reloadUsersList = () => {
  // Create a template for the user list element
  const userElementTemplate = document.createElement('li');
  userElementTemplate.classList.add('user-list__user');

  // Get the user list parent node
  const userList = document.getElementById('userList');

  // Clear the user list children
  while (userList.firstChild) {
    userList.removeChild(userList.lastChild);
  }

  // Send a fetch request to the server to populate the user list
  fetch('/admin/api/v1/get_user_list', {
    method: 'GET',
  })
  .then((response) => response.json())
  .then((response) => {
    for (const user of response.userData) {
      // Create a new li element
      const newLi = userElementTemplate.cloneNode();
      // Add the user's name
      newLi.innerText = user;
      // Add the elemnent to the list
      userList.appendChild(newLi);
    }

    if (response.userData.length === 0) {
      userList.innerText = 'No users yet.';
    }
  });
}

reloadUsersList();

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
      reloadUsersList();
    }
  });
}

// Add the submit listeners
addUserForm.addEventListener('submit', (e) => { e.preventDefault(); onAddUserSubmit(); });

// Form fields for the Lock User form
const lockUserFullName = document.querySelector('#lockUserFullName');
const lockUserUID = document.querySelector('#lockUserUID');
const lockUserGroup = document.querySelector('#lockUserGroup');
const lockUserSubmit = document.querySelector('#lockUserSubmit');
const lockUserForm = document.querySelector('#lockUserForm');

// When the lock user form is submitted
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
      alert('Action successful.'); reloadUsersList();
    }
  });
}

// Add the submit listeners
lockUserForm.addEventListener('submit', (e) => { e.preventDefault(); onlockUserSubmit(); });

// Form fields for the Unlock User form
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
      alert('Action successful.'); reloadUsersList();
    }
  });
}

// Add the submit listeners
unlockUserForm.addEventListener('submit', (e) => { e.preventDefault(); onUnlockUserSubmit(); });

// Form fields for the Set User Group form
const setUserGroupUID = document.querySelector('#setUserGroupUID');
const setUserGroupGroup = document.querySelector('#setUserGroupGroup');
const setUserGroupSubmit = document.querySelector('#setUserGroupSubmit');
const setUserGroupForm = document.querySelector('#setUserGroupForm');

// When the set user group form is submitted
const onSetUserGroupSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/set_user_group', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      group: setUserGroupGroup.value,
      UID: setUserGroupUID.value,
    }),
  })
  .then((response) => response.json())
  .then((response) => {
    // If the action failed
    if (response.failed) {
      alert('Action failed.');
    }
    else {
      alert('Action successful.'); reloadUsersList();
    }
  });
}

// Add the submit listeners
setUserGroupForm.addEventListener('submit', (e) => { e.preventDefault(); onSetUserGroupSubmit(); });

// Form fields for the Bulk Add Users form
const bulkAddUsersInput = document.querySelector('#bulkAddUsersInput');
const bulkAddUsersForm = document.querySelector('#bulkAddUsersForm');

// When the set user group form is submitted
const onBulkAddUsersSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/bulk_add_users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: bulkAddUsersInput.value,
    }),
  })
  .then((response) => response.json())
  .then((response) => {
    // If the action failed
    if (response.failed) {
      alert('Action failed.');
    }
    else {
      alert('Action successful.'); reloadUsersList();
    }
  });
}

// Add the submit listeners
bulkAddUsersForm.addEventListener('submit', (e) => { e.preventDefault(); onBulkAddUsersSubmit(); });