import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import auth from './middleware/auth';
import { validateBusinessParams } from './middleware/validateBusinessParams';
import User from './models/User';
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import financialRoutes from './routes/financials';
import messageRoutes from './routes/message';

// Load environment variables
dotenv.config();

// Type definitions
interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      _id: string;
      email: string;
      role: string;
    };
  };
}

// Validate essential environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`${varName} environment variable not set!`);
  }
});

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: corsOptions,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

// Database connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection failed:', err));

// Middleware
app.use(cors(corsOptions));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Socket.io authentication
io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('No token provided');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { _id: string };
    const user = await User.findById(decoded._id).select('_id email role') as { _id: mongoose.Types.ObjectId; email: string; role: string } | null;
    
    if (!user) throw new Error('User not found');
    
    socket.data.user = {
      _id: user?._id.toString(),
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// Socket.io connection handler
io.on('connection', (socket: AuthenticatedSocket) => {
  if (!socket.data.user) return socket.disconnect();

  console.log(`Client connected: ${socket.id} (User: ${socket.data.user.email})`);
  socket.join(socket.data.user._id.toString());

  // Handle conversation joining
  socket.on('joinConversation', (conversationId: string) => {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return socket.emit('error', 'Invalid conversation ID');
    }
    socket.join(conversationId);
    console.log(`User ${socket.data.user?.email || 'unknown'} joined conversation: ${conversationId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected (${socket.id}): ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

// Enhanced User Search Endpoint
app.get('/api/users/search', auth, async (req, res) => {
  try {
    const { query, limit } = req.query;
    
    // Validate input
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Search query must be a string' 
      });
    }
    
    const trimmedQuery = query.trim();
    const resultLimit = Math.min(parseInt(limit as string) || 10, 25);

    if (trimmedQuery.length < 2) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: []
      });
    }

    // Get current user's role
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated'
      });
    }
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated'
      });
    }

    // Build search query
    const searchQuery: any = {
      $or: [
        { email: { $regex: trimmedQuery, $options: 'i' } },
        { businessName: { $regex: trimmedQuery, $options: 'i' } },
        { firstName: { $regex: trimmedQuery, $options: 'i' } },
        { lastName: { $regex: trimmedQuery, $options: 'i' } }
      ],
      _id: { $ne: req.user?._id }
    };

    // Role-based filtering
    if (currentUser.role === 'business') {
      searchQuery.role = 'user';
    } else if (currentUser.role === 'user') {
      searchQuery.$or.push({ 'productsServices.name': { $regex: trimmedQuery, $options: 'i' } });
    }

    const users = await User.find(searchQuery)
      .limit(resultLimit)
      .select('_id email role businessName profileImage firstName lastName productsServices')
      .lean();

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: (error instanceof Error ? error.message : 'Unknown error') })
    });
  }
});

// Routes
app.use('/api/business', businessRoutes);
app.use('/api/business/:id', validateBusinessParams, businessRoutes);
app.use('/api/business/:id/financials', financialRoutes);
app.use('/api/messages', messageRoutes(io));
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const statusCode = err.name === 'UnauthorizedError' ? 401 : 500;
  res.status(statusCode).json({
    error: statusCode === 401 ? 'Unauthorized' : 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
  Server running on port ${PORT}
  WebSocket: ws://localhost:${PORT}
  HTTP: http://localhost:${PORT}
  `);
});

export { app, io };
