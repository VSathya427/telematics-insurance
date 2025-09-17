const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const telematicsRoutes = require('./routes/telematics');
const scoringRoutes = require('./routes/scoring');
const pricingRoutes = require('./routes/pricing');
const telematicsSimulator = require('./services/telematicsSimulator');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telematics_insurance')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/telematics', telematicsRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/pricing', pricingRoutes);

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-user', (userId) => {
        socket.join(`user-${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start telematics data simulation
telematicsSimulator.startSimulation(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
