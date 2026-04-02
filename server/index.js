const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const teamRoutes = require('./routes/teamRoutes');
const adminRoutes = require('./routes/adminRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const reviewerRoutes = require('./routes/reviewerRoutes');

const app = express();
const server = http.createServer(app);

// Static assets for games
app.use('/assets/memory-flip', express.static(path.join(__dirname, '../card flip')));
app.use('/assets/jigsaw', express.static(path.join(__dirname, '../jigsaw')));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["*"],
      scriptSrc: ["* 'unsafe-inline' 'unsafe-eval'"],
      styleSrc: ["* 'unsafe-inline'"],
      imgSrc: ["* data: blob:"],
      connectSrc: ["*"],
    },
  },
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Attach socket.io to app for controllers
app.set('socketio', io);

// CSP and Health Middleware
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'CREATEX Arena API Live', version: '2.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/reviewer', reviewerRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_cluster', (cluster) => {
    socket.join(`cluster_${cluster}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use((req, res, next) => {
  console.log(`[404 Diagnostic] ${req.method} ${req.url} Not Found`);
  res.status(404).json({ error: 'Route not found in CreateX Arena backend' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`CREATEX Arena Server running on port ${PORT}`);
});
