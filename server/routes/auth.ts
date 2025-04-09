import bcrypt from 'bcryptjs';
import express from 'express';
import authMiddleware from '../middleware/auth';
import Business from '../models/Business';
//import User from '../models/User';
import { default as User, default as UserDocument } from '../models/User';
import { cleanUserResponse } from '../utils/authHelpers';

declare global {
  namespace Express {
    interface Request {
      token?: string;
    }
  }
}

import { Document } from 'mongoose';

interface UserDocument extends Document {
  email: string;
  role: string;
  generateAuthToken(): Promise<string>;
  revokeToken(token: string): Promise<void>;
}

interface AuthenticatedUser extends UserDocument {
  _id: string;
  email: string;
  role: string;
  // These are already in UserDocument but can be redeclared
  generateAuthToken(): Promise<string>;
  revokeToken(token: string): Promise<void>;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

const router = express.Router();

// Improved error handler
const handleAuthError = (error: unknown, res: express.Response) => {
  console.error('Authentication Error:', error);

  if (error instanceof Error) {
    // Handle duplicate key errors
    if ('code' in error && error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Handle validation errors
    if ('name' in error && error.name === 'ValidationError') {
      const errors = Object.values((error as any).errors).map((err: any) => err.message);
      return res.status(400).json({
        status: 'error',
        message: `Validation failed: ${errors.join(', ')}`,
        errors: (error as any).errors
      });
    }
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' && error instanceof Error 
      ? error.message 
      : undefined
  });
};

// User Profile Endpoint
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    res.json({
      status: 'success',
      data: { 
        user: cleanUserResponse(req.user) 
      }
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Search Endpoint
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string' || query.length < 3) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Search query must be at least 3 characters' 
      });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { businessName: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user?._id }
    }).select('email role businessName createdAt');

    res.json({
      status: 'success',
      data: users.map(user => cleanUserResponse(user))
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Business Registration
router.post('/register/business', async (req, res) => {
  try {
    const { email, password, businessName, businessType, industry } = req.body;

    // Validate all required fields
    const missingFields = [
      !email && 'email',
      !password && 'password',
      !businessName && 'businessName',
      !businessType && 'businessType',
      !industry && 'industry'
    ].filter(Boolean);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Create and save business user
    const businessUser = new Business({
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      businessName: businessName.trim(),
      businessType,
      industry,
      role: 'business'
    });

    await businessUser.save();
    
    // Generate token and respond
    const token = await businessUser.generateAuthToken();
    res.status(201).json({
      status: 'success',
      data: {
        user: cleanUserResponse(businessUser),
        token
      }
    });

  } catch (error) {
    handleAuthError(error, res);
  }
});

// User Registration
router.post('/register/user', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    const user = new User({
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      role: 'user'
    });

    await user.save();
    
    const token = await user.generateAuthToken();
    res.status(201).json({
      status: 'success',
      data: {
        user: cleanUserResponse(user),
        token
      }
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required'
      });
    }

    const cleanEmail = email.toString().toLowerCase().trim();
    const cleanPassword = password.toString().trim();

    const user = await User.findOne({ email: cleanEmail })
      .select('+password +tokens');

    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(cleanPassword);
    
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid credentials'
      });
    }

    const token = await user.generateAuthToken();
    res.json({ 
      status: 'success', 
      data: { 
        user: cleanUserResponse(user), 
        token 
      } 
    });

  } catch (error) {
    handleAuthError(error, res);
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.token) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid logout request'
      });
    }

    await req.user.revokeToken(req.token);
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

export default router;