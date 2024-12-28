const reloadChatList = () => {
  // Create a template for the chat list element
  const chatElementTemplate = document.createElement('li');
  chatElementTemplate.classList.add('chat-list__chat');

  // Get the chat list parent node
  const chatList = document.getElementById('chatList');

  // Clear the chat list children
  while (chatList.firstChild) {
    chatList.removeChild(chatList.lastChild);
  }

  // Send a fetch request to the server to populate the chat list
  fetch('/admin/api/v1/get_chat_list', {
    method: 'GET',
  })
  .then((response) => response.json())
  .then((response) => {
    for (const chat of response.chatData) {
      // Create a new li element
      const newLi = chatElementTemplate.cloneNode();
      // Add the chat's name
      newLi.innerText = chat;
      // Add the elemnent to the list
      chatList.appendChild(newLi);
    }

    // If there are no chats, add text to indicate that
    if (response.chatData.length === 0) {
      chatList.innerText = 'No chats yet.';
    }
  });
}

reloadChatList();

// Form fields for the Add Chat form
const addChatTitle = document.getElementById('addChatTitle');
const addChatForm = document.getElementById('addChatForm');

// When the add chat form is submitted
const onAddChatSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/add_chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: addChatTitle.value,
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
      reloadChatList();
    }
  });
}

// Add the submit listeners
addChatForm.addEventListener('submit', (e) => { e.preventDefault(); onAddChatSubmit(); });

// Form fields for the Add Chat Access form
const addChatAccessTitle = document.getElementById('addChatAccessTitle');
const addChatAccessGroup = document.getElementById('addChatAccessGroup');
const addChatAccessForm = document.getElementById('addChatAccessForm');

// When the add chat form is submitted
const onAddChatAccessSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/add_chat_access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: addChatAccessTitle.value,
      group: addChatAccessGroup.value,
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
      reloadChatList();
    }
  });
}

// Add the submit listeners
addChatAccessForm.addEventListener('submit', (e) => { e.preventDefault(); onAddChatAccessSubmit(); });

// Form fields for the Remove Chat Access form
const removeChatAccessTitle = document.getElementById('removeChatAccessTitle');
const removeChatAccessGroup = document.getElementById('removeChatAccessGroup');
const removeChatAccessForm = document.getElementById('removeChatAccessForm');

// When the remove chat form is submitted
const onRemoveChatAccessSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/remove_chat_access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: removeChatAccessTitle.value,
      group: removeChatAccessGroup.value,
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
      reloadChatList();
    }
  });
}

// Remove the submit listeners
removeChatAccessForm.addEventListener('submit', (e) => { e.preventDefault(); onRemoveChatAccessSubmit(); });

// Form fields for the Remove Chat Access form
const clearChatMessagesTitle = document.getElementById('clearChatMessagesTitle');
const clearChatMessagesForm = document.getElementById('clearChatMessagesForm');

// When the remove chat form is submitted
const onClearChatMessagesSubmit = () => {
  // Send the request to the server
  fetch('/admin/api/v1/clear_chat_messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: clearChatMessagesTitle.value,
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
      reloadChatList();
    }
  });
}

// Remove the submit listeners
clearChatMessagesForm.addEventListener('submit', (e) => { e.preventDefault(); onClearChatMessagesSubmit(); });