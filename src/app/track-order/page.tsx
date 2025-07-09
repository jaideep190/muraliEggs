
'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, PackageCheck, Bike, Home, MapPin, PackageX, ShoppingCart, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

const trackingSteps = [
  { icon: Package, label: 'Requested', status: 'Requested' },
  { icon: PackageCheck, label: 'Confirmed', status: 'Confirmed' },
  { icon: Bike, label: 'Out for Delivery', status: 'Out for Delivery' },
  { icon: Home, label: 'Delivered', status: 'Delivered' },
];

type Order = {
  id: string;
  status: string;
  createdAt: { toDate: () => Date };
  quantity: number;
  totalPrice: number;
  paymentMethod: 'COD' | 'UPI';
  userId: string;
};

// This object is now just for alt text and AI hints. The src is handled directly in the component.
const statusInfo: { [key: string]: { alt: string; hint: string; } } = {
  Requested: {
    alt: 'Illustration of an order being requested, showing a shopping cart.',
    hint: 'order requested'
  },
  Confirmed: {
    alt: 'Illustration of an egg carton being prepared for shipment.',
    hint: 'order confirmed'
  },
  'Out for Delivery': {
    alt: 'Illustration of a delivery truck on the road.',
    hint: 'delivery truck'
  },
  Delivered: {
    alt: 'Illustration of a package delivered to a home.',
    hint: 'package delivered'
  },
  Cancelled: {
    alt: 'Illustration representing a cancelled order.',
    hint: 'order cancelled'
  },
  default: {
    alt: 'Map showing a generic delivery route.',
    hint: 'delivery route'
  },
};

function OrderTrackerCard({ order }: { order: Order }) {
  const currentStepIndex = trackingSteps.findIndex(step => step.status === order.status);
  const progressPercentage = order.status === 'Cancelled' ? 0 : (currentStepIndex >= 0 ? (currentStepIndex / (trackingSteps.length - 1)) * 100 : 0);
  const info = statusInfo[order.status] || statusInfo.default;

  const renderImageForStatus = () => {
    const imageProps = {
      alt: info.alt,
      fill: true,
      sizes: "(max-width: 768px) 100vw, 50vw",
      className: "object-cover",
      "data-ai-hint": info.hint,
    };

    switch (order.status) {
      case 'Requested':
        return <Image src="/images/requested.png" {...imageProps} priority />;
      case 'Confirmed':
        return <Image src="/images/confirmed.png" {...imageProps} />;
      case 'Out for Delivery':
        return <Image src="/images/delivering.png" {...imageProps} />;
      case 'Delivered':
        return <Image src="/images/delivered.png" {...imageProps} />;
      case 'Cancelled':
        return <Image src="/images/cancelled.png" {...imageProps} />;
      default:
        return <Image src="/images/requested.png" {...imageProps} priority />;
    }
  };

  if (order.status === 'Cancelled') {
    return (
      <Card className="mb-6 opacity-0 animate-fade-in-up">
        <CardHeader>
          <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
          <CardDescription>Status: <span className="font-bold text-destructive">{order.status}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
            <div className="relative h-48 w-full overflow-hidden rounded-lg">
                {renderImageForStatus()}
            </div>
            <p className="text-muted-foreground">This order has been cancelled.</p>
             <Button asChild variant="secondary">
              <Link href="/">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Place a New Order
              </Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 opacity-0 animate-fade-in-up">
      <CardHeader>
        <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
        <CardDescription>Status: <span className="font-bold text-primary">{order.status}</span></CardDescription>
        <div className="!mt-4 border-t pt-4 text-sm text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span>{order.quantity} Eggs</span>
            <span className="font-medium text-foreground">Rs. {order.totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
             <span>Payment Method</span>
             <span className={`px-2 py-1 text-xs rounded-full ${order.paymentMethod === 'UPI' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'}`}>
              {order.paymentMethod}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {trackingSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition-all duration-500',
                      isActive
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border bg-muted'
                    )}
                  >
                    <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p
                    className={cn(
                      'mt-2 text-xs font-semibold transition-colors duration-500',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative h-48 w-full overflow-hidden rounded-lg">
           {renderImageForStatus()}
        </div>
      </CardContent>
    </Card>
  );
}

function TrackOrderContent() {
  const { user, loading: authLoading } = useAuthRedirect({ requiredRole: 'user' });
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user) {
        if (!authLoading) setLoading(false);
        return;
    }

    setLoading(true);
    const orderId = searchParams.get('orderId');

    let unsubscribe: () => void;

    if (orderId) {
      // A specific order is being tracked. Listen to it regardless of status.
      const orderDocRef = doc(db, 'orders', orderId);
      unsubscribe = onSnapshot(orderDocRef, (docSnap) => {
        if (docSnap.exists()) {
           const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
           if (orderData.userId === user.uid) {
                setOrders([orderData]);
                setError(null);
           } else {
                setError("You don't have permission to view this order.");
                setOrders([]);
           }
        } else {
          setError("This order could not be found.");
          setOrders([]);
        }
        setLoading(false);
      }, (err) => {
        console.error(err);
        setError('Failed to load order data.');
        setLoading(false);
      });

    } else {
      // No specific order, show all active orders for the user.
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        // Filter for orders that are NOT delivered or cancelled
        const activeOrders = userOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
        
        activeOrders.sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });

        setOrders(activeOrders);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error(err);
        setError('Failed to load real-time order data.');
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [user, authLoading, searchParams]);
  
  if (authLoading || loading) {
     return (
        <div className="container mx-auto max-w-lg p-4">
            <header className="my-6 text-center">
              <Skeleton className="mx-auto h-10 w-64" />
              <Skeleton className="mx-auto mt-2 h-5 w-72" />
            </header>
            <Card>
              <CardHeader>
                 <Skeleton className="h-7 w-48" />
                 <div className="pt-2">
                    <Skeleton className="h-5 w-60" />
                 </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <Skeleton className="h-2 w-full" />
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="mt-2 h-4 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
                 <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
        </div>
     );
  }

  if (error || !orders || orders.length === 0) {
    return (
      <div className="container mx-auto flex h-full min-h-[60vh] flex-col items-center justify-center p-4 text-center opacity-0 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
          <PackageX className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">
            {error ? 'An Error Occurred' : 'No Active Orders'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {error || 'You have no orders being prepared or out for delivery. Check your history for past orders.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button asChild>
              <Link href="/">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Order Some Eggs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/order-history">
                <History className="mr-2 h-4 w-4" />
                View History
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg p-4">
      <header className="my-6 sm:my-10 text-center opacity-0 animate-fade-in-up">
        <h1 className="flex items-center justify-center gap-2 text-4xl font-bold">
          <MapPin className="h-8 w-8 text-primary" />
          Track Your Orders
        </h1>
        <p className="text-muted-foreground mt-2">Your fresh eggs are on the way!</p>
      </header>
      <div>
        {orders.map(order => (
          <OrderTrackerCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackOrderContent />
    </Suspense>
  )
}
