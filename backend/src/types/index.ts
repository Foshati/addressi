import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface CustomRequest extends Omit<Request, 'user'> {
  user?: {
    id: string;
    name: string;
    email: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}
