'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import EggIcon from './EggIcon';

const navItems = [
  { href: '/', label: 'Order', icon: EggIcon },
  { href: '/track-order', label: 'Track', icon: MapPin },
  { href: '/order-history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/70 backdrop-blur-lg">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 group transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 mb-1 transition-transform',
                   isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
