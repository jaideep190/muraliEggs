'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  address: z.string().min(10, { message: 'Please enter a valid address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function FinishProfilePage() {
  const { user, userData, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', address: '', phone: '' },
    mode: 'onChange',
  });
  
  useEffect(() => {
    if (!loading) {
      if (userData) {
        // User already has a profile, redirect them.
        router.push('/');
      } else if (!user) {
        // User is not logged in, redirect them.
        router.push('/login');
      } else {
        // Pre-fill form with info from Google/Firebase Auth if available
        if (user.displayName) {
          form.setValue('name', user.displayName);
        }
        if (user.phoneNumber) {
          form.setValue('phone', user.phoneNumber);
        }
      }
    }
  }, [user, userData, loading, router, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsSaving(true);
    
    try {
      // Create user document in Firestore with the collected details
      const dataToSave: { [key: string]: any } = {
        name: data.name,
        address: data.address,
        phone: data.phone, // Phone number is collected from the form
        role: 'user', // Default role
        createdAt: new Date(),
      };
      
      // Also save the email from the user object
      if (user.email) {
          dataToSave.email = user.email;
      }

      await setDoc(doc(db, 'users', user.uid), dataToSave);

      toast({
        title: 'Profile Complete!',
        description: 'Welcome! You can now start ordering.',
      });
      router.push('/');

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your profile. Please try again.',
      });
    } finally {
        setIsSaving(false);
    }
  }

  if (loading || !user || userData) {
     return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-foreground">
          One Last Step
        </h1>
        <p className="mt-2 text-muted-foreground">Please complete your profile to continue.</p>
      </header>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Finish Your Profile</CardTitle>
          <CardDescription>We need a few more details to get you started.</CardDescription>
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
              <Button type="submit" className="w-full" disabled={isSaving}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save and Continue'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
