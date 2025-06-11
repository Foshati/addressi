import type { User, Profile } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        profile?: Profile;
      };
    }
  }
}
