const socket = io();
const username = document.getElementById('username').value;
const groupId = document.getElementById('groupId').value;

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');
const userList = document.getElementById('active-users');

// Join group room
socket.emit('joinGroup', { username, groupId });

// Update active users list
socket.on('userList', (users) => {
  userList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = user;
    userList.appendChild(li);
  });
});

// Receive and display messages
socket.on('receiveMessage', ({ message, sender }) => {
  const msgDiv = document.createElement('div');
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Send message
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = messageInput.value;
  if (!msg.trim()) return;

  socket.emit('sendMessage', { groupId, message: msg, sender: username });

  // Show own message instantly
  const selfMsg = document.createElement('div');
  selfMsg.innerHTML = `<strong>You:</strong> ${msg}`;
  chatBox.appendChild(selfMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  messageInput.value = '';
});
