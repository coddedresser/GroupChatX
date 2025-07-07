const socket = io();

// Elements
const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
const activeUsers = document.getElementById('active-users');
const username = document.getElementById('username').value;
const groupId = document.getElementById('groupId').value;

// Emit joinGroup when page loads
socket.emit('joinGroup', { username, groupId });

// Receive messages from others
socket.on('receiveMessage', ({ message, sender }) => {
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Receive user joined notification
socket.on('userJoined', (msg) => {
  const note = document.createElement('div');
  note.innerHTML = `<em style="color: green;">🟢 ${msg}</em>`;
  chatBox.appendChild(note);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Receive user left notification
socket.on('userLeft', (msg) => {
  const note = document.createElement('div');
  note.innerHTML = `<em style="color: red;">🔴 ${msg}</em>`;
  chatBox.appendChild(note);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Update active user list
socket.on('userList', (userList) => {
  activeUsers.innerHTML = '';
  userList.forEach(user => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = user;
    activeUsers.appendChild(li);
  });
});

// Send message
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const messageInput = document.getElementById('message');
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('sendMessage', {
      groupId,
      message,
      sender: username
    });

    // Show your own message immediately
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>You:</strong> ${message}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;

    messageInput.value = '';
  }
});

// Leave group on page unload
window.addEventListener('beforeunload', () => {
  socket.emit('leaveGroup', { username, groupId });
});
