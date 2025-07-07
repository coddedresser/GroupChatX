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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

mongoose.connect(process.env.MongodbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MongodbURL })
}));

// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/group', groupRoutes);

// Socket.IO logic
const usersInRoom = {};

io.on('connection', (socket) => {
    socket.on('joinGroup', ({ username, groupId }) => {
        socket.join(groupId);
        if (!usersInRoom[groupId]) usersInRoom[groupId] = [];
        usersInRoom[groupId].push(username);
        io.to(groupId).emit('userList', usersInRoom[groupId]);
    });

    socket.on('sendMessage', ({ groupId, message, sender }) => {
        io.to(groupId).emit('receiveMessage', { message, sender });
    });

    socket.on('leaveGroup', ({ username, groupId }) => {
        socket.leave(groupId);
        usersInRoom[groupId] = usersInRoom[groupId].filter(u => u !== username);
        io.to(groupId).emit('userList', usersInRoom[groupId]);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));