/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { Role } from '../types/roles';

interface UserContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Let this be a pass-through component. The AuthProvider is now the main outer provider.
  return <>{children}</>;
}

export function useUser(): UserContextType {
  const { user, userRole, loading } = useAuth();
  
  // Backward compatibility: is admin if user is MASTER or ADMIN_CASA, or matches master email
  const isAdmin = 
    userRole?.role === Role.MASTER || 
    userRole?.role === Role.ADMIN_CASA ||
    user?.email?.toLowerCase() === 'gustavomacedo.consultor@gmail.com';

  return {
    user,
    isAdmin,
    loading
  };
}
