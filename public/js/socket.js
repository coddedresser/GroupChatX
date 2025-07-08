const socket = io();

// Elements
const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
const activeUsers = document.getElementById('active-users');
const username = document.getElementById('username').value;
const groupId = document.getElementById('groupId').value;

// Emit joinGroup when page loads
socket.emit('joinGroup', { username, groupId });

// Show old messages
socket.on('chatHistory', (messages) => {
  const chatBox = document.getElementById('chat-box');
  messages.forEach(msg => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${msg.sender.username}:</strong> ${msg.text}`;
    chatBox.appendChild(messageElement);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});


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

// Private chat
let currentPrivateUser = null;

document.addEventListener('click', e => {
  if (e.target.classList.contains('user-item')) {
    currentPrivateUser = e.target.getAttribute('data-user');
    document.getElementById('privateChatUser').innerText = currentPrivateUser;
    document.getElementById('private-chat-box').innerHTML = '';
    socket.emit('loadPrivateChat', { to: currentPrivateUser });
    new bootstrap.Modal(document.getElementById('privateChatModal')).show();
  }
});

document.getElementById('private-chat-form').addEventListener('submit', e => {
  e.preventDefault();
  const msg = document.getElementById('private-message').value;
  if (msg && currentPrivateUser) {
    socket.emit('privateMessage', { to: currentPrivateUser, message: msg });
    document.getElementById('private-chat-box').innerHTML += `<div><strong>You:</strong> ${msg}</div>`;
    document.getElementById('private-message').value = '';
  }
});

socket.on('privateMessage', ({ from, message }) => {
  document.getElementById('private-chat-box').innerHTML += `<div><strong>${from}:</strong> ${message}</div>`;
});

socket.on('loadPrivateChatHistory', history => {
  history.forEach(({ from, message }) => {
    const label = from === socket.username ? 'You' : from;
    document.getElementById('private-chat-box').innerHTML += `<div><strong>${label}:</strong> ${message}</div>`;
  });
});

// When clicking "Chat" button next to a user
document.querySelectorAll('.start-private-chat').forEach(button => {
  button.addEventListener('click', function () {
    const targetUser = this.closest('li').dataset.user;
    document.getElementById('privateChatUser').textContent = targetUser;
    const modal = new bootstrap.Modal(document.getElementById('privateChatModal'));
    modal.show();
  });
});
