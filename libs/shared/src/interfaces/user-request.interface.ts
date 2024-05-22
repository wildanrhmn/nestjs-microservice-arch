import { Request } from 'express';

export interface UserRequest extends Request {
  user?: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
}