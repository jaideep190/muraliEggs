'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Role = 'user' | 'admin';

interface RedirectOptions {
  requiredRole?: Role;
  loginPath?: string;
  homePath?: string;
}

export function useAuthRedirect({
  requiredRole,
  loginPath = '/login',
  homePath = '/',
}: RedirectOptions = {}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is finished
    }

    if (!user) {
      // If no user, redirect to login page
      router.push(loginPath);
      return;
    }

    if (requiredRole && userData?.role !== requiredRole) {
      // If user doesn't have the required role, redirect to their default home page
      router.push(userData?.role === 'admin' ? '/admin/dashboard' : homePath);
    }
    
  }, [user, userData, loading, router, requiredRole, loginPath, homePath]);

  return { user, userData, loading };
}
