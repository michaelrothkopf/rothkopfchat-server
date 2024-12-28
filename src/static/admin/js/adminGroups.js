const reloadGroupList = () => {
  // Create a template for the group list element
  const groupElementTemplate = document.createElement('li');
  groupElementTemplate.classList.add('group-list__group');

  // Get the group list parent node
  const groupList = document.getElementById('groupList');

  // Clear the group list children
  while (groupList.firstChild) {
    groupList.removeChild(groupList.lastChild);
  }

  // Send a fetch request to the server to populate the group list
  fetch('/admin/api/v1/get_group_list', {
    method: 'GET',
  })
  .then((response) => response.json())
  .then((response) => {
    for (const group of response.groupData) {
      // Create a new li element
      const newLi = groupElementTemplate.cloneNode();
      // Add the group's name
      newLi.innerText = group;
      // Add the elemnent to the list
      groupList.appendChild(newLi);
    }

    if (response.groupData.length === 0) {
      groupList.innerText = 'No groups yet.';
    }
  });
}

reloadGroupList();

// Form fields for the Add Group form
const addGroupFullName = document.querySelector('#addGroupFullName');
const addGroupCity = document.querySelector('#addGroupCity');
const addGroupSubmit = document.querySelector('#addGroupSubmit');
const addGroupForm = document.querySelector('#addGroupForm');

// When the add group form is submitted
const onAddGroupSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/add_group', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: addGroupFullName.value,
      city: addGroupCity.value,
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
      reloadGroupList();
    }
  });
}

// Add the submit listeners
addGroupForm.addEventListener('submit', (e) => { e.preventDefault(); onAddGroupSubmit(); });