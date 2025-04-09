// server/middleware/auth.ts
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: string;
        email: string;
        role: string;
      } | undefined;
    }
  }
}
// Using named export
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findOne({ 
      _id: decoded.id,
      'tokens.token': token 
    }) as { _id: string; email: string; role: string; tokens: { token: string }[] } | null;

    if (!user) {
      throw new Error('User not found');
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};

// If you prefer default export, use this instead:
// const auth = async (req: Request, res: Response, next: NextFunction) => { ... };
export default auth;