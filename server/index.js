const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const cron = require('node-cron');
const cleanExpiredAssignments = require('./jobs/expiryCleanupJob'); // 👈 import it


dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000', // frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
     credentials: true    
  }
});



// Store socket connections
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
   // Associate socket with userId
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`🔗 Registered socket ${socket.id} to user ${userId}`);
  });

    // On disconnect
  socket.on('disconnect', () => {
    for (let [userId, sId] of userSockets) {
      if (sId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('❌ User disconnected:', socket.id);
  });
});

// Make `io` + `userSockets` accessible to routes
app.set('io', io);
app.set('userSockets', userSockets);
// 🕐 Schedule job every 1 minute (or as needed)
cron.schedule('* * * * *', async () => {
  await cleanExpiredAssignments(io, userSockets);
});


app.get('/',(req,res)=>{
    res.send("server is running");
}); 

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const adminUploadRoute = require('./routes/adminUpload');
app.use('/api/admin', adminUploadRoute);




mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
