'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function TeamLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/team-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyCode, pin }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Invalid company code or PIN');
      }

      // Store crew session info
      localStorage.setItem('crewSession', JSON.stringify({
        crewId: result.crew.id,
        crewName: result.crew.name,
        userId: result.userId,
        companyName: result.companyName,
      }));

      toast({
        title: `Welcome, ${result.crew.name}!`,
        description: 'Redirecting to your jobs...',
        variant: 'success',
      });

      router.push('/crew');
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
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Team Login</CardTitle>
          <CardDescription>Enter your company code and PIN to access jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyCode">Company Code</Label>
              <Input
                id="companyCode"
                placeholder="greenscape-lawn"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                disabled={isLoading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                Ask your manager for the company code
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Your PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isLoading}
                maxLength={6}
                inputMode="numeric"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                4-6 digit PIN assigned by your manager
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !companyCode || !pin}>
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
              Business owner?{' '}
              <Link href="/owner-login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Owner login
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">GreenDay Crew App</p>
                <p className="text-xs text-gray-500 mt-1">
                  View your assigned jobs, check in/out with GPS, and update job status on the go.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
