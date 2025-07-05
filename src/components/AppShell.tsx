'use client';

import { usePathname } from 'next/navigation';
import BottomNavBar from '@/components/BottomNavBar';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import NotificationPermissionManager from '@/components/NotificationPermissionManager';

const noNavRoutes = ['/login', '/signup', '/finish-profile'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const showNav = !noNavRoutes.includes(pathname) && !pathname.startsWith('/admin') && !!user && !loading;

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <main className={`flex-1 ${showNav ? 'pb-24' : ''}`}>{children}</main>
      {showNav && <BottomNavBar />}
      {showNav && <NotificationPermissionManager />}
    </div>
  );
}
