import type { UserRole, UserStatus } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      role?: UserRole;
      schoolId?: string;
      userStatus?: UserStatus;
      workspaceSelectionRequired?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    schoolId?: string;
    userStatus?: UserStatus;
    workspaceSelectionRequired?: boolean;
  }
}
