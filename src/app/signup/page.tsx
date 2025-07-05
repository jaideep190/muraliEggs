
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import GoogleIcon from '@/components/GoogleIcon';

import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const signupFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  address: z.string().min(10, { message: 'Please enter a valid address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { email: '', password: '', name: '', address: '', phone: '' },
    mode: 'onChange',
  });
  
  async function onEmailSubmit(data: SignupFormValues) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        email: data.email,
        address: data.address,
        phone: data.phone,
        role: 'user',
        createdAt: new Date(),
      });
      
      toast({
        title: 'Account Created!',
        description: 'You can now log in with your new account.',
      });
      router.push('/login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // After a successful popup sign-in, the user's auth state is active.
        // And We can now push them to the finish-profile page. If they already
        // have a profile, that page will correctly redirect them to home.
        router.push('/finish-profile');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: error.message || 'Could not initiate Google Sign-In.',
        });
        setIsGoogleLoading(false);
    }
  };


  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
       <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]" />
        <div className="w-full max-w-sm opacity-0 animate-fade-in-up">
         <header className="mb-10 text-center">
            <h1 className="text-5xl font-bold tracking-tighter text-foreground">
            Create an Account
            </h1>
            <p className="mt-2 text-muted-foreground">Join Murali Eggs today.</p>
        </header>
        <Card className="w-full max-w-sm shadow-2xl shadow-black/10">
            <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>It's quick and easy.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Alex Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Delivery Address</FormLabel><FormControl><Input placeholder="123 Sunny Side Up Lane" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="555-0101" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
                </Button>
                </form>
            </Form>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                </span>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? 'Signing in...' : <><GoogleIcon className="mr-2" /> Google</>}
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
                </Link>
            </p>
            </CardContent>
        </Card>
        </div>
    </div>
  );
}
