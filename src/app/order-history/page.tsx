'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';

type Order = {
  id: string;
  createdAt: { toDate: () => Date };
  quantity: number;
  totalPrice: number;
  status: string;
  paymentMethod: 'COD' | 'UPI';
};

export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuthRedirect({ requiredRole: 'user' });
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const allUserOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        
        const deliveredOrders = allUserOrders.filter(order => order.status === 'Delivered');
        
        deliveredOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate()?.getTime() || 0;
          const dateB = b.createdAt?.toDate()?.getTime() || 0;
          return dateB - dateA;
        });

        setOrderHistory(deliveredOrders);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching order history:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-lg p-4">
        <header className="my-6 sm:my-10 text-center">
            <Skeleton className="mx-auto h-10 w-56" />
            <Skeleton className="mx-auto mt-2 h-5 w-64" />
        </header>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32"/>
                <Skeleton className="mt-2 h-4 w-40"/>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-5 w-20"/>
                    <Skeleton className="mt-2 h-4 w-24"/>
                  </div>
                   <Skeleton className="h-9 w-28"/>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg p-4 opacity-0 animate-fade-in-up">
      <header className="my-6 sm:my-10 text-center">
        <h1 className="flex items-center justify-center gap-2 text-4xl font-bold">
          <History className="h-8 w-8 text-primary" />
          Order History
        </h1>
        <p className="text-muted-foreground mt-2">Review your past delivered orders.</p>
      </header>

      {orderHistory.length > 0 ? (
        <div className="space-y-4">
          {orderHistory.map((order, index) => (
            <Card key={order.id} className="overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`}}>
               <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-lg">Order #{order.id.substring(0, 6)}</CardTitle>
                    <CardDescription>Delivered on: {order.createdAt ? format(order.createdAt.toDate(), 'MMMM dd, yyyy') : 'Date not available'}</CardDescription>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${order.paymentMethod === 'UPI' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'}`}>
                  {order.paymentMethod}
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{order.quantity} Eggs</p>
                    <p className="text-muted-foreground">Total: Rs. {order.totalPrice.toFixed(2)}</p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                     <Link href="/">
                       <ShoppingCart className="mr-2 h-4 w-4" />
                       Order Again
                     </Link>
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">You have no delivered orders.</p>
          <Button asChild className="mt-4">
            <Link href="/">Start Your First Order</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
