import { Request } from 'express';
import { RequestUser } from './request-user.interface';

export type RequestWithUser = Request & {
  user?: RequestUser;
};
