
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, updateEmail, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Save, LogOut, Bell, BellOff } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Skeleton } from '@/components/ui/skeleton';
import { auth, db } from '@/lib/firebase';
import { useFcmToken } from '@/hooks/useFcmToken';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  address: z.string().min(10, { message: 'Please enter a valid address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine(data => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, userData, loading } = useAuthRedirect({ requiredRole: 'user' });
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordUser, setIsPasswordUser] = useState(false);
  const { notificationPermissionStatus, requestPermission } = useFcmToken();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', email: '', address: '', phone: '', password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (user && userData) {
      form.reset({
        name: userData.name || '',
        email: user.email || '',
        address: userData.address || '',
        phone: userData.phone || '',
        password: '',
        confirmPassword: ''
      });
       // Check if user has a password provider
      const passwordProvider = user.providerData.some(p => p.providerId === 'password');
      setIsPasswordUser(passwordProvider);
    }
  }, [user, userData, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsSaving(true);
    
    try {
        const isUserPasswordBased = user.providerData.some(p => p.providerId === 'password');

        // --- Handle Auth Updates First (only for password users) ---
        if (isUserPasswordBased) {
            // Update email if it has changed
            if (data.email && data.email !== user.email) {
                await updateEmail(user, data.email);
            }
            // Update password if a new one is provided
            if (data.password) {
                await updatePassword(user, data.password);
            }
        }

        // --- Then, Handle Firestore Update ---
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            name: data.name,
            address: data.address,
            phone: data.phone,
            email: data.email, // Keep firestore email in sync with auth
        });
        
        toast({
            title: 'Profile Updated!',
            description: 'Your information has been saved successfully.',
        });

        // Clear password fields on success
        form.setValue('password', '');
        form.setValue('confirmPassword', '');
        
    } catch (error: any) {
        let description = 'Could not update your profile. Please try again.';
        if (error.code === 'auth/requires-recent-login') {
            description = 'This is a sensitive operation. Please log out and log back in to update email or password.';
        } else if (error.code === 'auth/email-already-in-use') {
            description = 'This email is already in use by another account.';
        }
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description,
        });
    } finally {
        setIsSaving(false);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };
  
  if (loading || !userData) {
    return (
       <div className="container mx-auto max-w-lg p-4">
          <header className="my-6 sm:my-10 text-center">
            <Skeleton className="mx-auto h-10 w-48" />
            <Skeleton className="mx-auto mt-2 h-5 w-64" />
          </header>
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-40" />
              <Skeleton className="mt-2 h-4 w-52" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-10 w-full" /> </div>
               <div className="space-y-2"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-10 w-full" /> </div>
               <div className="space-y-2"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-10 w-full" /> </div>
              <div className="space-y-2"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-10 w-full" /> </div>
              <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-10 w-full" /> </div>
                  <div className="space-y-2"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-10 w-full" /> </div>
              </div>
              <div className="space-y-2 pt-4">
                 <Skeleton className="h-11 w-full" />
                 <Skeleton className="h-11 w-full" />
              </div>
            </CardContent>
          </Card>
       </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg p-4 opacity-0 animate-fade-in-up">
      <header className="my-6 sm:my-10 text-center">
        <h1 className="flex items-center justify-center gap-2 text-4xl font-bold">
          <User className="h-8 w-8 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-2">Manage your account details.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your account details and password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} readOnly={!isPasswordUser} />
                    </FormControl>
                     {!isPasswordUser && <FormDescription>Email cannot be changed for accounts created with Google.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Your delivery address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2 pt-4 border-t">
                  <FormLabel>Notification Settings</FormLabel>
                  {notificationPermissionStatus === 'granted' && (
                      <div className="flex items-center text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                          <Bell className="mr-2 h-4 w-4" /> Notifications are enabled.
                      </div>
                  )}
                  {notificationPermissionStatus === 'default' && (
                      <Button type="button" variant="outline" className="w-full" onClick={requestPermission}>
                          <Bell className="mr-2 h-4 w-4" /> Enable Order Notifications
                      </Button>
                  )}
                  {notificationPermissionStatus === 'denied' && (
                      <div className="flex items-center text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
                          <BellOff className="mr-2 h-4 w-4" /> Notifications are blocked in your browser settings.
                      </div>
                  )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="Leave blank to keep current password" {...field} readOnly={!isPasswordUser} />
                        </FormControl>
                        {!isPasswordUser && <FormDescription>Password cannot be set for accounts created with Google.</FormDescription>}
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="Confirm your new password" {...field} readOnly={!isPasswordUser} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="space-y-2 pt-4">
                 <Button type="submit" className="w-full" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
