import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { getUserById } from '../db/queries';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    appRole: 'professor' | 'student';
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return next(); // Continue without user
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return next(); // Invalid token, continue without user
    }

    // Get user from database
    const user = await getUserById(payload.userId);
    if (!user) {
      return next(); // User not found, continue without user
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      appRole: user.appRole as 'professor' | 'student'
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    next(); // On error, continue without user
  }
}
