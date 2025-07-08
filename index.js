const express = require('express'); //done
const mongoose = require('mongoose'); //done
const session = require('express-session'); //done
const MongoStore = require('connect-mongo'); 
const http = require('http'); //done
const socketio = require('socket.io'); //done
const path = require('path');  //done
const dotenv = require('dotenv');   //done
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const groupRoutes = require('./routes/groupRoutes');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Message = require('./models/Message');
const PrivateMessage = require('./models/PrivateMessage');

// Config
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const SECRET_KEY = 'lcnsldgmlsm';

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MongodbURL, {
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));



// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/group', groupRoutes);

// =========================
// 🔐 Socket.IO JWT Auth
// =========================
const usersInRoom = {};

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return next(new Error('Authentication error'));

  const token = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
  if (!token) return next(new Error('JWT token not found'));

  try {
    const jwtToken = token.split('=')[1];
    const user = jwt.verify(jwtToken, SECRET_KEY);
    socket.user = user; // Attach user info to socket
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const username = socket.user.username;
  // console.log(`✅ User connected: ${username}`);

  socket.on('joinGroup', async({ groupId }) => {
    socket.join(groupId);

    // Add user to group
    if (!usersInRoom[groupId]) usersInRoom[groupId] = [];
    if (!usersInRoom[groupId].includes(username)) {
      usersInRoom[groupId].push(username);
    }

    // Notify others in the room
    socket.to(groupId).emit('userJoined', `${username} has joined the group`);
    
    // Fetch and send chat history (last 50 messages)
    const messages = await Message.find({ groupId })
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();
    socket.emit('chatHistory', messages);

    // Send updated user list to all clients in the group
    io.to(groupId).emit('userList', usersInRoom[groupId]);
  });

  socket.on('sendMessage', async({ groupId, message }) => {
    const sender = socket.user;
    const savedMessage = await Message.create({
      groupId,
      sender: {
        username: sender.username,
        userId: sender.id
      },
      text: message
    });
    socket.broadcast.to(groupId).emit('receiveMessage', {
      message: savedMessage.text,
      sender: sender.username,
      timestamp: savedMessage.timestamp
    });
    //socket.broadcast.to(groupId).emit('receiveMessage', { message, sender: username });
  });

  socket.on('leaveGroup', ({ groupId }) => {
  const username = socket.user.username;
  socket.leave(groupId);

  // ✅ Only filter if the group exists
  if (usersInRoom[groupId]) {
    usersInRoom[groupId] = usersInRoom[groupId].filter(u => u !== username);

    // ✅ If no one is left, optionally delete the group entry
    if (usersInRoom[groupId].length === 0) {
      delete usersInRoom[groupId];
    }

    io.to(groupId).emit('userList', usersInRoom[groupId]);
  }
});

  // Optional: handle browser close or refresh
  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    rooms.forEach(groupId => {
      if (usersInRoom[groupId]) {
        usersInRoom[groupId].delete(username);
        socket.to(groupId).emit('userLeft', `${username} has left the group`);
        io.to(groupId).emit('userList', Array.from(usersInRoom[groupId]));
      }
    });
  });
  socket.on('privateMessage', async ({ to, message }) => {
  const fromUser = socket.user.username;
  const toSocket = Array.from(io.sockets.sockets.values()).find(s => s.user?.username === to);

  // Save message to DB
  const fromUserDoc = await User.findOne({ username: fromUser });
  const toUserDoc = await User.findOne({ username: to });

  await PrivateMessage.create({
    sender: fromUserDoc._id,
    receiver: toUserDoc._id,
    text: message
  });

  // Emit to receiver
  if (toSocket) {
    toSocket.emit('privateMessage', { from: fromUser, message });
  }
});

socket.on('loadPrivateChat', async ({ to }) => {
    const fromUser = socket.user.username;
    const fromUserDoc = await User.findOne({ username: fromUser });
    const toUserDoc = await User.findOne({ username: to });

    const messages = await PrivateMessage.find({
      $or: [
        { sender: fromUserDoc._id, receiver: toUserDoc._id },
        { sender: toUserDoc._id, receiver: fromUserDoc._id }
      ]
    }).populate('sender receiver');

    const formatted = messages.map(msg => ({
      from: msg.sender.username,
      message: msg.text
    }));

    socket.emit('loadPrivateChatHistory', formatted);
  });
});


// Server startup
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
