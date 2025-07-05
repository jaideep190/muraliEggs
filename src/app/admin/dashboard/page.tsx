'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Package, Power, Settings, LogOut, DollarSign, CalendarDays, BarChart, ShoppingBag, LayoutGrid, Search, Truck, BellRing, Loader2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, doc, onSnapshot, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { format, subDays } from 'date-fns';
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { TooltipProvider, Tooltip as ShadTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  quantity: number;
  status: string;
  createdAt: { toDate: () => Date };
  totalPrice: number;
  paymentMethod: 'COD' | 'UPI';
};

type Settings = {
  eggPrice: number;
  stockAvailable: boolean;
  availableTrays: number;
};

type AnalyticsData = {
  totalRevenue: number;
  totalDeliveredOrders: number;
  pendingOrders: number;
  salesLast7Days: { date: string; total: number }[];
};

export default function AdminDashboardPage() {
  const { user, userData, loading } = useAuthRedirect({ requiredRole: 'admin' });
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>({ eggPrice: 0.5, stockAvailable: true, availableTrays: 100 });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [notifyingStates, setNotifyingStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(ordersData);
    });

    const settingsDocRef = doc(db, 'settings', 'store-settings');
    const unsubscribeSettings = onSnapshot(settingsDocRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSettings({
            eggPrice: data.eggPrice || 0.5,
            stockAvailable: data.stockAvailable === undefined ? true : data.stockAvailable,
            availableTrays: data.availableTrays === undefined ? 100 : data.availableTrays,
        });
      } else {
        await setDoc(settingsDocRef, { eggPrice: 0.5, stockAvailable: true, availableTrays: 100 });
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSettings();
    };
  }, [user]);

  const weeklyAnalytics = useMemo<AnalyticsData>(() => {
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

    const salesLast7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), i);
      const formattedDate = format(date, 'MMM d');
      const total = deliveredOrders
        .filter(o => o.createdAt?.toDate && format(o.createdAt.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
        .reduce((sum, order) => sum + order.totalPrice, 0);
      return { date: formattedDate, total };
    }).reverse();

    return {
      totalRevenue,
      totalDeliveredOrders: deliveredOrders.length,
      pendingOrders,
      salesLast7Days
    };
  }, [orders]);
  
  const dailyAnalytics = useMemo(() => {
    if (!selectedDate) return { revenue: 0, orderCount: 0 };
    
    const deliveredOrdersOnDate = orders.filter(o => 
      o.status === 'Delivered' && 
      o.createdAt?.toDate &&
      format(o.createdAt.toDate(), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
    
    const revenue = deliveredOrdersOnDate.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    
    return {
      revenue,
      orderCount: deliveredOrdersOnDate.length
    };
  }, [orders, selectedDate]);
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const orderDocRef = doc(db, 'orders', orderId);
    try {
      await updateDoc(orderDocRef, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Order status has been successfully updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update order status.',
      });
    }
  };
  
  const handleNotify = async (orderId: string, userId: string, status: string) => {
    setNotifyingStates(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, orderId, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'An unknown server error occurred.');
      }
      
      toast({
          title: 'Notification Sent',
          description: `User has been notified. Sent: ${result.sent}, Failed: ${result.failed}.`,
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Notification Failed',
        description: error.message,
      });
    } finally {
      setNotifyingStates(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const settingsDocRef = doc(db, 'settings', 'store-settings');
    try {
      await setDoc(settingsDocRef, settings);
      toast({
        title: 'Settings Saved',
        description: 'Store settings have been updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save store settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  if (loading || !userData || userData.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-8">
        <div className="flex items-center gap-2 text-xl font-bold text-foreground">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <span>Admin Panel</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 sm:p-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
            <TabsTrigger value="dashboard"><BarChart className="mr-2 h-4 w-4"/>Dashboard</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag className="mr-2 h-4 w-4"/>Orders</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4"/>Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue for {selectedDate ? format(selectedDate, 'MMM d') : 'selected date'}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">Rs. {dailyAnalytics.revenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">from {dailyAnalytics.orderCount} delivered orders</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{weeklyAnalytics.pendingOrders}</div>
                        <p className="text-xs text-muted-foreground">Total orders awaiting delivery</p>
                      </CardContent>
                    </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Revenue from delivered orders in the last 7 days.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={weeklyAnalytics.salesLast7Days}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `Rs. ${value}`} />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--accent))', radius: 'var(--radius)' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                          />
                          <RechartsBar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                    <CardDescription>View analytics for a specific day.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border p-0"
                      disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>View, search, and manage all incoming and past orders.</CardDescription>
                <div className="relative pt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or order ID..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                 <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.substring(0, 6)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="hidden text-xs text-muted-foreground sm:block">{order.customerAddress}</div>
                          </TableCell>
                          <TableCell>{order.quantity} eggs</TableCell>
                          <TableCell>Rs. {order.totalPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${order.paymentMethod === 'UPI' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'}`}>
                              {order.paymentMethod}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={order.status}
                                onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                              >
                                <SelectTrigger className="w-full sm:w-[160px]">
                                  <SelectValue placeholder="Update status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Requested">Requested</SelectItem>
                                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                                  <SelectItem value="Delivered">Delivered</SelectItem>
                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                               <ShadTooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleNotify(order.id, order.userId, order.status)}
                                    disabled={notifyingStates[order.id] || !order.userId}
                                    aria-label="Notify user"
                                  >
                                    {notifyingStates[order.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{order.userId ? 'Send status update notification' : 'User ID not available to notify'}</p>
                                </TooltipContent>
                              </ShadTooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">No orders found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>Control daily price, availability, and stock for your store.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="egg-price" className="flex items-center gap-2">
                    <DollarSign /> Price per Egg
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-muted-foreground">Rs.</span>
                    <Input
                      id="egg-price"
                      type="number"
                      value={settings.eggPrice}
                      onChange={(e) => setSettings({ ...settings, eggPrice: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="text-lg font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available-trays" className="flex items-center gap-2">
                    <Truck /> Available Trays
                  </Label>
                  <Input
                    id="available-trays"
                    type="number"
                    value={settings.availableTrays}
                    onChange={(e) => setSettings({ ...settings, availableTrays: parseInt(e.target.value, 10) || 0 })}
                    placeholder="e.g., 50"
                    className="text-lg font-bold"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="stock-available" className="flex items-center gap-2">
                      <Power /> Stock Availability
                    </Label>
                    <p className="text-xs text-muted-foreground">Turn off to prevent new orders.</p>
                  </div>
                  <Switch
                    id="stock-available"
                    checked={settings.stockAvailable}
                    onCheckedChange={(checked) => setSettings({ ...settings, stockAvailable: checked })}
                  />
                </div>
                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
