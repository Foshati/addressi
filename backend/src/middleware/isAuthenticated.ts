import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../libs/prisma';

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

    // Check if token exists
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Token missing',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as {
      id: string;
      role?: 'user' | 'seller';
    };

    // Validate decoded token structure
    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
      return;
    }

    // Validate that user exists in database
    const account = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      res.status(401).json({
        success: false,
        message: 'Account not found',
      });
      return;
    }

    req.user = account;
    next();
    return;
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
    return;
  }
};
