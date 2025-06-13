import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        name: string;
        email: string;
        username: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
} 