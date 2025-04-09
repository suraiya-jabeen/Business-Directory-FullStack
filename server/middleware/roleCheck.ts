import { NextFunction, Request, Response } from 'express';

export default (role: string) => (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
