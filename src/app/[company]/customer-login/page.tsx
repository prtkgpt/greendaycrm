'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Leaf, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function CustomerLoginPage() {
  const router = useRouter();
  const params = useParams();
  const company = params.company as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companySlug: company, email, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Invalid email or password');
      }

      // Store customer session
      localStorage.setItem('customerSession', JSON.stringify({
        customerId: result.customer.id,
        customerName: result.customer.name,
        customerEmail: result.customer.email,
        companySlug: company,
        companyName: result.companyName,
      }));

      toast({
        title: `Welcome back, ${result.customer.name}!`,
        description: 'Redirecting to your portal...',
        variant: 'success',
      });

      router.push(`/${company}/portal`);
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Customer Portal</CardTitle>
          <CardDescription>Sign in to view invoices, schedule services, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-500">
              New customer?{' '}
              <Link href={`/${company}/customer-signup`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                Create account
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-sm">
            <Link href={`/${company}`} className="text-gray-500 hover:text-gray-700">
              Back to {company}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
