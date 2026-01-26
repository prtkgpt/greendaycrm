'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Leaf, Calendar, FileText, Clock, MapPin, LogOut, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface CustomerSession {
  customerId: string;
  customerName: string;
  customerEmail: string;
  companySlug: string;
  companyName: string;
}

interface Job {
  id: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string | null;
  status: string;
  serviceType: { name: string; color: string | null } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  dueDate: string | null;
  stripePaymentUrl: string | null;
}

interface PortalData {
  customer: {
    id: string;
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  upcomingJobs: Job[];
  recentInvoices: Invoice[];
  companyName: string;
  companyPhone: string | null;
  companyEmail: string | null;
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const params = useParams();
  const company = params.company as string;
  const { toast } = useToast();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('customerSession');
    if (!stored) {
      router.push(`/${company}/customer-login`);
      return;
    }

    const customerSession = JSON.parse(stored) as CustomerSession;
    if (customerSession.companySlug !== company) {
      localStorage.removeItem('customerSession');
      router.push(`/${company}/customer-login`);
      return;
    }

    setSession(customerSession);
    fetchPortalData(customerSession.customerId);
  }, [company, router]);

  const fetchPortalData = async (customerId: string) => {
    try {
      const res = await fetch(`/api/customer-portal?customerId=${customerId}&companySlug=${company}`);
      if (!res.ok) {
        throw new Error('Failed to load portal data');
      }
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load portal data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerSession');
    router.push(`/${company}/customer-login`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session || !data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">{data.companyName}</p>
              <p className="text-sm text-gray-500">Customer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:block">
              {session.customerName}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {data.customer.name}</h1>
          <p className="text-gray-600">Manage your services and invoices</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Upcoming Services
              </CardTitle>
              <CardDescription>Your scheduled lawn care services</CardDescription>
            </CardHeader>
            <CardContent>
              {data.upcomingJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No upcoming services scheduled</p>
                  <Link href={`/${company}/book`}>
                    <Button variant="link" className="mt-2 text-emerald-600">
                      Request a service
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.upcomingJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {job.serviceType && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: job.serviceType.color || '#22c55e' }}
                            />
                          )}
                          <span className="font-medium">{job.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(job.scheduledDate)}
                          </span>
                          {job.scheduledTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.scheduledTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Recent Invoices
              </CardTitle>
              <CardDescription>View and pay your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">#{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">
                          ${invoice.total.toFixed(2)}
                          {invoice.dueDate && (
                            <> &middot; Due {formatDate(invoice.dueDate)}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        {invoice.status !== 'paid' && invoice.stripePaymentUrl && (
                          <a href={invoice.stripePaymentUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              Pay Now
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Property Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{data.customer.address}</p>
                <p className="text-gray-600">
                  {data.customer.city}, {data.customer.state} {data.customer.zip}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/${company}/book`} className="block">
                <Button variant="outline" className="w-full justify-between">
                  Request New Service
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              {data.companyPhone && (
                <a href={`tel:${data.companyPhone}`} className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Call {data.companyName}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
              {data.companyEmail && (
                <a href={`mailto:${data.companyEmail}`} className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Email Us
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
