
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle, Wallet, QrCode, Minus, Plus } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import QRCode from 'qrcode.react';
import EggIcon from '@/components/EggIcon';
import QuantitySelector from '@/components/QuantitySelector';
import { cn } from '@/lib/utils';

type StoreSettings = {
  eggPrice: number;
  stockAvailable: boolean;
  availableTrays: number;
};

export default function Home() {
  const { user, userData, loading } = useAuthRedirect({ requiredRole: 'user' });
  const [quantity, setQuantity] = useState(30);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isUpiDialogOpen, setIsUpiDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const MAX_QUANTITY = 990; // 33 Trays

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'store-settings');
    const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
      if (doc.exists()) {
        setStoreSettings(doc.data() as StoreSettings);
      } else {
        setStoreSettings({ eggPrice: 0.5, stockAvailable: true, availableTrays: 100 }); // Default fallback
      }
    });
    return () => unsubscribe();
  }, []);

  const totalPrice = storeSettings ? quantity * storeSettings.eggPrice : 0;
  const upiId = 'loku007@ybl';
  const upiUrl = `upi://pay?pa=${upiId}&pn=Murali%20Eggs&am=${totalPrice.toFixed(2)}&cu=INR`;

  const isTraySelected = quantity > 0 && quantity % 30 === 0;
  const trayDisplayCount = Math.floor(quantity / 30);

  const handleDecrementTray = () => {
    const currentFullTrays = Math.floor(quantity / 30);
    const newTrayCount = Math.max(0, currentFullTrays - 1);
    setQuantity(newTrayCount === 0 ? 1 : newTrayCount * 30);
  };

  const handleIncrementTray = () => {
    const currentFullTrays = Math.floor(quantity / 30);
    const newTrayCount = currentFullTrays + 1;
    const newQuantity = newTrayCount * 30;

    if (newQuantity <= MAX_QUANTITY) {
      setQuantity(newQuantity);
    }
  };

  const handleOrder = async (paymentMethod: 'COD' | 'UPI') => {
    if (!user || !userData || !storeSettings) return;
    setIsOrdering(true);

    try {
      const orderData = {
        userId: user.uid,
        customerName: userData.name,
        customerAddress: userData.address,
        customerPhone: userData.phone,
        quantity,
        totalPrice: quantity * storeSettings.eggPrice,
        paymentMethod,
        status: 'Requested',
        createdAt: serverTimestamp(),
      };
      
      const newOrderRef = await addDoc(collection(db, 'orders'), orderData);
      
      toast({
        title: 'Order Placed!',
        description: 'Your eggs are on the way. You can track your order now.',
      });

      // Close all dialogs
      setIsPaymentDialogOpen(false);
      setIsUpiDialogOpen(false);
      
      router.push(`/track-order?orderId=${newOrderRef.id}`);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsOrdering(false);
    }
  };

  const handlePayWithUpi = () => {
    setIsPaymentDialogOpen(false);
    setIsUpiDialogOpen(true);
  };
  
  if (loading || !user || storeSettings === null) {
    return (
      <div className="container mx-auto flex h-full flex-col items-center justify-center p-4 text-center">
        <Skeleton className="mb-4 h-12 w-12 rounded-full" />
        <Skeleton className="mb-2 h-10 w-64" />
        <Skeleton className="mb-8 h-6 w-48" />
        <Skeleton className="mb-8 h-64 w-full max-w-sm" />
        <Skeleton className="mb-4 h-8 w-40" />
        <div className="mb-6 flex items-center justify-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-14 w-14 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full max-w-xs" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto flex h-full flex-col items-center justify-center p-4 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <header className="my-6 sm:my-10">
           <h1 className="flex items-center justify-center gap-3 text-5xl md:text-6xl font-bold tracking-tighter text-foreground">
            <EggIcon className="h-10 w-10 md:h-12 md:w-12 text-primary animate-bounce-gentle" />
            <span>Murali Eggs</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Fresh eggs delivered to your doorstep.</p>
        </header>

        <div className="relative mb-8 w-full max-w-lg">
          <div className="rounded-lg shadow-2xl shadow-black/10 dark:shadow-black/50">
            <Image
              src="https://placehold.co/600x400.png"
              alt="A basket of fresh brown eggs"
              width={600}
              height={400}
              className="rounded-lg object-cover"
              data-ai-hint="fresh eggs"
              priority
            />
          </div>
        </div>

        {storeSettings.stockAvailable ? (
          <div className="w-full max-w-sm space-y-8">
            <div>
              <h2 className="text-3xl font-semibold">Choose your quantity</h2>
              <p className="text-muted-foreground mt-1">
                Only Rs. {storeSettings.eggPrice.toFixed(2)} per egg!
              </p>
              {storeSettings.availableTrays > 0 && (
                 <p className="text-sm font-semibold text-primary mt-2 animate-pulse">
                    Hurry! Only {storeSettings.availableTrays} {storeSettings.availableTrays === 1 ? 'tray' : 'trays'} left in stock.
                 </p>
              )}
            </div>

            <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={MAX_QUANTITY}
              />
              
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={quantity === 6 ? 'default' : 'outline'}
                onClick={() => setQuantity(6)}
                className="flex h-auto flex-col rounded-lg py-3"
              >
                <span className="text-lg font-bold">6</span>
                <span className="text-xs">Half Dozen</span>
              </Button>
              <Button
                variant={quantity === 12 ? 'default' : 'outline'}
                onClick={() => setQuantity(12)}
                className="flex h-auto flex-col rounded-lg py-3"
              >
                <span className="text-lg font-bold">12</span>
                <span className="text-xs">Dozen</span>
              </Button>
              <div
                className={cn(
                  'flex h-auto flex-col items-center justify-center rounded-lg border text-center transition-all duration-300 py-2',
                  isTraySelected ? 'border-primary bg-primary/10 shadow-inner' : 'border-input bg-transparent'
                )}
              >
                <span className="text-sm font-medium -mb-1">Trays</span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleDecrementTray}
                    disabled={trayDisplayCount < 1}
                    aria-label="Decrease tray count"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="text-xl font-bold w-10 text-center tabular-nums">
                    {trayDisplayCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleIncrementTray}
                    disabled={(trayDisplayCount + 1) * 30 > MAX_QUANTITY}
                    aria-label="Increase tray count"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsPaymentDialogOpen(true)} size="lg" className="h-12 sm:h-14 w-full text-lg font-bold" disabled={quantity <= 0}>
              Order Now for Rs. {totalPrice.toFixed(2)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 p-8 text-center text-destructive backdrop-blur-sm">
            <XCircle className="h-12 w-12" />
            <h2 className="mt-4 text-2xl font-bold">Temporarily Unavailable</h2>
            <p className="mt-2">We're out of stock for today. Please check back later!</p>
          </div>
        )}
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select how you'd like to pay for your order of {quantity} eggs for a total of Rs. {totalPrice.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleOrder('COD')} disabled={isOrdering}>
              <Wallet className="h-8 w-8" />
              <span className="text-base">Cash on Delivery</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={handlePayWithUpi} disabled={isOrdering}>
              <QrCode className="h-8 w-8" />
              <span className="text-base">Pay with UPI</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* UPI Payment Dialog */}
      <Dialog open={isUpiDialogOpen} onOpenChange={setIsUpiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with UPI</DialogTitle>
             <DialogDescription>
              Scan the QR code with any UPI app or use the buttons below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
             <div className="rounded-lg bg-white p-2">
                <QRCode value={upiUrl} size={160} />
             </div>
            <p className="font-semibold text-foreground">UPI ID: {upiId}</p>
            <p className="text-2xl font-bold">Total: Rs. {totalPrice.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <a href={`gpay://upi/pay?pa=${upiId}&pn=Murali%20Eggs&am=${totalPrice.toFixed(2)}&cu=INR`}>
                    Pay with GPay
                </a>
              </Button>
               <Button asChild variant="outline">
                <a href={`phonepe://pay?pa=${upiId}&pn=Murali%20Eggs&am=${totalPrice.toFixed(2)}&cu=INR`}>
                    Pay with PhonePe
                </a>
              </Button>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => handleOrder('UPI')} disabled={isOrdering}>
              {isOrdering ? 'Placing Order...' : 'I Have Paid, Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
