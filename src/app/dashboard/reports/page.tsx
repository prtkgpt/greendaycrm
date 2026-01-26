'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ReportData {
  revenue: {
    total: number;
    paid: number;
    pending: number;
    byMonth: Array<{ month: string; amount: number }>;
  };
  jobs: {
    total: number;
    completed: number;
    cancelled: number;
    avgPerDay: number;
    byStatus: Record<string, number>;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    topCustomers: Array<{ name: string; revenue: number; jobs: number }>;
  };
  services: {
    popular: Array<{ name: string; count: number; revenue: number }>;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch various stats in parallel
      const [customersRes, jobsRes, invoicesRes] = await Promise.all([
        fetch('/api/customers?limit=1000'),
        fetch('/api/jobs?limit=1000'),
        fetch('/api/invoices?limit=1000'),
      ]);

      const [customersData, jobsData, invoicesData] = await Promise.all([
        customersRes.json(),
        jobsRes.json(),
        invoicesRes.json(),
      ]);

      const customers = customersData.customers || [];
      const jobs = jobsData.jobs || [];
      const invoices = invoicesData.invoices || [];

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'quarter') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      // Filter by period
      const periodJobs = jobs.filter(
        (j: { scheduledDate: string }) => new Date(j.scheduledDate) >= startDate
      );
      const periodInvoices = invoices.filter(
        (i: { createdAt: string }) => new Date(i.createdAt) >= startDate
      );

      // Calculate revenue
      const revenue = {
        total: periodInvoices.reduce(
          (sum: number, i: { total: number }) => sum + (i.total || 0),
          0
        ),
        paid: periodInvoices
          .filter((i: { status: string }) => i.status === 'paid')
          .reduce((sum: number, i: { total: number }) => sum + (i.total || 0), 0),
        pending: periodInvoices
          .filter((i: { status: string }) => ['sent', 'pending'].includes(i.status))
          .reduce((sum: number, i: { total: number }) => sum + (i.total || 0), 0),
        byMonth: [] as Array<{ month: string; amount: number }>,
      };

      // Calculate jobs stats
      const jobStats = {
        total: periodJobs.length,
        completed: periodJobs.filter((j: { status: string }) => j.status === 'completed')
          .length,
        cancelled: periodJobs.filter((j: { status: string }) => j.status === 'cancelled')
          .length,
        avgPerDay:
          periodJobs.length > 0
            ? Math.round(
                periodJobs.length /
                  Math.ceil(
                    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                  )
              )
            : 0,
        byStatus: periodJobs.reduce(
          (acc: Record<string, number>, job: { status: string }) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
          },
          {}
        ),
      };

      // Calculate customer stats
      const customerRevenue: Record<string, { name: string; revenue: number; jobs: number }> = {};
      periodJobs.forEach((job: { customer: { id: string; name: string }; price: number }) => {
        if (!customerRevenue[job.customer.id]) {
          customerRevenue[job.customer.id] = {
            name: job.customer.name,
            revenue: 0,
            jobs: 0,
          };
        }
        customerRevenue[job.customer.id].revenue += job.price || 0;
        customerRevenue[job.customer.id].jobs += 1;
      });

      const topCustomers = Object.values(customerRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate service popularity
      const serviceStats: Record<string, { name: string; count: number; revenue: number }> = {};
      periodJobs.forEach(
        (job: {
          serviceType: { id: string; name: string } | null;
          price: number;
        }) => {
          if (job.serviceType) {
            if (!serviceStats[job.serviceType.id]) {
              serviceStats[job.serviceType.id] = {
                name: job.serviceType.name,
                count: 0,
                revenue: 0,
              };
            }
            serviceStats[job.serviceType.id].count += 1;
            serviceStats[job.serviceType.id].revenue += job.price || 0;
          }
        }
      );

      const popularServices = Object.values(serviceStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        revenue,
        jobs: jobStats,
        customers: {
          total: customers.length,
          active: customers.filter((c: { status: string }) => c.status === 'active')
            .length,
          new: customers.filter(
            (c: { createdAt: string }) => new Date(c.createdAt) >= startDate
          ).length,
          topCustomers,
        },
        services: {
          popular: popularServices,
        },
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Business insights and analytics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">Last 3 Months</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50 text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.revenue.total)}</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>{formatCurrency(data.revenue.paid)} collected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold">{data.jobs.total}</p>
                <p className="text-xs text-gray-400">
                  ~{data.jobs.avgPerDay} per day avg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {data.jobs.total > 0
                    ? Math.round((data.jobs.completed / data.jobs.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-400">
                  {data.jobs.completed} of {data.jobs.total} jobs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Customers</p>
                <p className="text-2xl font-bold">{data.customers.active}</p>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>{data.customers.new} new</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Paid</span>
                </div>
                <span className="font-semibold">{formatCurrency(data.revenue.paid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(data.revenue.pending)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-sm">Other</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(
                    data.revenue.total - data.revenue.paid - data.revenue.pending
                  )}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(data.revenue.total)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.jobs.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status === 'completed'
                            ? 'bg-green-500'
                            : status === 'in_progress'
                              ? 'bg-yellow-500'
                              : status === 'scheduled'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                        }`}
                        style={{
                          width: `${(count / data.jobs.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {data.customers.topCustomers.length > 0 ? (
              <div className="space-y-3">
                {data.customers.topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.jobs} jobs</p>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(customer.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Popular Services</CardTitle>
          </CardHeader>
          <CardContent>
            {data.services.popular.length > 0 ? (
              <div className="space-y-3">
                {data.services.popular.map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.count} jobs</p>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Report</p>
              <p className="text-sm text-gray-500">Download data as CSV or PDF</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
