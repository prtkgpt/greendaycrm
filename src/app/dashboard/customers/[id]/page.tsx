'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  Plus,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate, formatTime, formatPhone, getStatusColor, getInitials } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  price: number | null;
  serviceType: { name: string } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  createdAt: string;
  dueDate: string | null;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  propertySize: string | null;
  gateCode: string | null;
  specialInstructions: string | null;
  tags: string[];
  status: string;
  createdAt: string;
  jobs: Job[];
  invoices: Invoice[];
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Customer not found');
        return res.json();
      })
      .then(setCustomer)
      .catch(() => {
        toast({ title: 'Error', description: 'Customer not found', variant: 'destructive' });
        router.push('/dashboard/customers');
      })
      .finally(() => setLoading(false));
  }, [params.id, router, toast]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Customer deleted', variant: 'success' });
      router.push('/dashboard/customers');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!customer) return null;

  const completedJobs = customer.jobs.filter((j) => j.status === 'completed').length;
  const totalRevenue = customer.invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium text-lg">
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                  {customer.status}
                </Badge>
              </div>
              <p className="text-gray-500">Customer since {formatDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/jobs?customer=${customer.id}`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Job
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-xl font-bold">{customer.jobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-xl font-bold">{completedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoices</p>
                <p className="text-xl font-bold">{customer.invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="text-sm text-emerald-600 hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${customer.phone}`} className="text-sm text-emerald-600 hover:underline">
                  {formatPhone(customer.phone)}
                </a>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="text-sm">
                <p>{customer.address}</p>
                <p>{customer.city}, {customer.state} {customer.zip}</p>
                {customer.lat && customer.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${customer.lat},${customer.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    Open in Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {customer.propertySize && (
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-1">Property Size</p>
                <p className="text-sm font-medium">{customer.propertySize}</p>
              </div>
            )}

            {customer.gateCode && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Gate Code</p>
                <p className="text-sm font-medium font-mono">{customer.gateCode}</p>
              </div>
            )}

            {customer.specialInstructions && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Special Instructions</p>
                <p className="text-sm">{customer.specialInstructions}</p>
              </div>
            )}

            {customer.tags.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Job History</CardTitle>
            <Link href={`/dashboard/jobs?customer=${customer.id}`}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {customer.jobs.length > 0 ? (
              <div className="divide-y">
                {customer.jobs.slice(0, 10).map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.serviceType?.name} • {formatDate(job.scheduledDate)}
                        {job.scheduledTime && ` at ${formatTime(job.scheduledTime)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                      {job.price && (
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(job.price)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No jobs yet</p>
                <Link href={`/dashboard/jobs?customer=${customer.id}`}>
                  <Button variant="link" className="mt-2">Schedule first job</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Invoices</CardTitle>
          <Link href={`/dashboard/invoices?customer=${customer.id}`}>
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {customer.invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Invoice #</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Due Date</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.invoices.slice(0, 10).map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="font-mono text-sm text-emerald-600 hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      </td>
                      <td className="py-3">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
