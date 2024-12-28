// Reference the counts for users, groups, and chats
const userCount = document.getElementById('userCount');
const groupCount = document.getElementById('groupCount');
const chatCount = document.getElementById('chatCount');

// Populate the user count
fetch('/admin/api/v1/get_user_list', {
  method: 'GET',
})
.then((response) => response.json())
.then((response) => {
  userCount.innerText = `Users: ${response.userData.length}`;
});

// Populate the group count
fetch('/admin/api/v1/get_group_list', {
  method: 'GET',
})
.then((response) => response.json())
.then((response) => {
  groupCount.innerText = `Groups: ${response.groupData.length}`;
});

// Populate the chat count
fetch('/admin/api/v1/get_chat_list', {
  method: 'GET',
})
.then((response) => response.json())
.then((response) => {
  chatCount.innerText = `Chats: ${response.chatData.length}`;
});