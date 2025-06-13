import { Request } from 'express';

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