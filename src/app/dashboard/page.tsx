import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  DollarSign,
  Clock,
  Plus,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '@/lib/utils';

async function getDashboardData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalCustomers,
    activeCustomers,
    jobsToday,
    jobsThisWeek,
    pendingJobs,
    completedThisMonth,
    revenueThisMonth,
    pendingInvoices,
    upcomingJobs,
    recentJobs,
  ] = await Promise.all([
    prisma.customer.count({ where: { userId } }),
    prisma.customer.count({ where: { userId, status: 'active' } }),
    prisma.job.count({
      where: {
        userId,
        scheduledDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
    }),
    prisma.job.count({
      where: { userId, scheduledDate: { gte: today, lt: endOfWeek } },
    }),
    prisma.job.count({ where: { userId, status: 'scheduled' } }),
    prisma.job.count({
      where: {
        userId,
        status: 'completed',
        completedAt: { gte: startOfMonth },
      },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: 'paid', paidDate: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: 'pending' },
      _sum: { total: true },
      _count: true,
    }),
    prisma.job.findMany({
      where: { userId, scheduledDate: { gte: today }, status: 'scheduled' },
      include: { customer: true, serviceType: true },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
      take: 5,
    }),
    prisma.job.findMany({
      where: { userId, status: 'completed' },
      include: { customer: true },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    stats: {
      totalCustomers,
      activeCustomers,
      jobsToday,
      jobsThisWeek,
      pendingJobs,
      completedThisMonth,
      revenueThisMonth: revenueThisMonth._sum.total || 0,
      pendingInvoicesTotal: pendingInvoices._sum.total || 0,
      pendingInvoicesCount: pendingInvoices._count,
    },
    upcomingJobs,
    recentJobs,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const data = await getDashboardData(session.user.id);
  const { stats, upcomingJobs, recentJobs } = data;

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      subtext: `${stats.activeCustomers} active`,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      href: '/dashboard/customers',
    },
    {
      label: 'Jobs Today',
      value: stats.jobsToday,
      subtext: `${stats.jobsThisWeek} this week`,
      icon: Calendar,
      color: 'text-emerald-600 bg-emerald-50',
      href: '/dashboard/schedule',
    },
    {
      label: 'Revenue (MTD)',
      value: formatCurrency(stats.revenueThisMonth),
      subtext: `${stats.completedThisMonth} jobs completed`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
      href: '/dashboard/invoices',
    },
    {
      label: 'Pending',
      value: stats.pendingJobs,
      subtext: `${formatCurrency(stats.pendingInvoicesTotal)} unpaid`,
      icon: Clock,
      color: 'text-orange-600 bg-orange-50',
      href: '/dashboard/jobs',
    },
  ];

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Customer
            </Button>
          </Link>
          <Link href="/dashboard/jobs">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.subtext}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Upcoming Jobs</CardTitle>
            <Link href="/dashboard/schedule">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingJobs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingJobs.map((job) => (
                  <div key={job.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {job.title}
                          </p>
                          <Badge
                            variant="info"
                            className={getStatusColor(job.status)}
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {job.customer.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.customer.address}, {job.customer.city}
                          </span>
                          {job.customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {job.customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(job.scheduledDate)}
                        </p>
                        {job.scheduledTime && (
                          <p className="text-xs text-gray-500">
                            {formatTime(job.scheduledTime)}
                          </p>
                        )}
                        {job.price && (
                          <p className="text-sm font-semibold text-emerald-600 mt-1">
                            {formatCurrency(job.price)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No upcoming jobs scheduled</p>
                <Link href="/dashboard/jobs">
                  <Button variant="link" className="mt-2">
                    Schedule a job
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Link href="/dashboard/jobs">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentJobs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentJobs.map((job) => (
                  <div key={job.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          job.status === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {job.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {job.customer.name} &middot;{' '}
                          {job.completedAt
                            ? formatDate(job.completedAt)
                            : formatDate(job.scheduledDate)}
                        </p>
                      </div>
                      {job.price && (
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(job.price)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No completed jobs yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/customers">
          <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4">
              <Users className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">Add Customer</p>
              <p className="text-sm text-gray-500">Create a new customer profile</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/jobs">
          <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4">
              <Calendar className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">Schedule Job</p>
              <p className="text-sm text-gray-500">Book a new service</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/routes">
          <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4">
              <MapPin className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">Plan Routes</p>
              <p className="text-sm text-gray-500">Optimize your daily route</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/invoices">
          <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4">
              <DollarSign className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">Create Invoice</p>
              <p className="text-sm text-gray-500">Bill for services</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
