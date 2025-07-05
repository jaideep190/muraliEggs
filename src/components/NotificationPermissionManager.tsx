'use client';
import { Bell } from 'lucide-react';
import { useFcmToken } from '@/hooks/useFcmToken';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function NotificationPermissionManager() {
  const { user } = useAuth();
  const { notificationPermissionStatus, requestPermission } = useFcmToken();

  if (!user || notificationPermissionStatus === null || notificationPermissionStatus === 'granted') {
    return null;
  }
  
  if (notificationPermissionStatus === 'denied') {
      return (
         <div className="fixed bottom-24 sm:bottom-4 right-4 z-50 animate-fade-in-up">
            <div className="p-4 max-w-md rounded-lg bg-secondary text-secondary-foreground shadow-lg flex items-center gap-4">
                <Bell className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">You have blocked notifications. Please enable them in your browser settings to receive order updates.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed bottom-24 sm:bottom-4 right-4 z-50 animate-fade-in-up">
        <div className="p-4 max-w-md rounded-lg bg-secondary text-secondary-foreground shadow-lg flex items-center gap-4">
            <Bell className="h-5 w-5 shrink-0" />
            <div>
                <p className="text-sm font-medium">Get notified about your orders!</p>
                <p className="text-xs">Enable push notifications for real-time updates.</p>
            </div>
            <Button size="sm" onClick={requestPermission}>Enable</Button>
        </div>
    </div>
  );
}
