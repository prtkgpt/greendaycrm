'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Calendar, DollarSign, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Loading from '@/components/Loading';
import { DashboardStats, Job } from '@/types';

interface DashboardData {
  stats: DashboardStats;
  upcomingJobs: Job[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-gray-500 text-sm">
          Make sure your DATABASE_URL is configured correctly.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, upcomingJobs } = data;

  const statCards = [
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Jobs Today', value: stats.jobsToday, icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Jobs', value: stats.pendingJobs, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Revenue (30d)', value: `$${stats.revenueThisMonth.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Completed (30d)</p>
            <p className="font-semibold text-gray-900">{stats.completedThisMonth} jobs</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">This Week</p>
            <p className="font-semibold text-gray-900">{stats.jobsThisWeek} jobs</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Pending Invoices</p>
            <p className="font-semibold text-gray-900">
              {stats.pendingInvoicesCount} (${stats.pendingInvoicesTotal.toLocaleString()})
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Upcoming Jobs</h2>
          <Link href="/jobs" className="text-sm text-green-600 hover:text-green-700">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {upcomingJobs.length > 0 ? (
            upcomingJobs.map((job) => (
              <div key={job.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{job.customer_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {job.customer_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.customer_address}
                        </span>
                      )}
                      {job.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {job.customer_phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {job.scheduled_date}
                    </p>
                    {job.scheduled_time && (
                      <p className="text-xs text-gray-500">{job.scheduled_time}</p>
                    )}
                    {job.price && (
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        ${job.price}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-gray-500">
              <p>No upcoming jobs scheduled</p>
              <Link href="/jobs" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">
                Schedule a job
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/customers"
          className="card p-4 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <Users className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">Add Customer</p>
          <p className="text-sm text-gray-500">Create a new customer profile</p>
        </Link>
        <Link
          href="/jobs"
          className="card p-4 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <Calendar className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">Schedule Job</p>
          <p className="text-sm text-gray-500">Book a new service appointment</p>
        </Link>
        <Link
          href="/invoices"
          className="card p-4 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <DollarSign className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">Create Invoice</p>
          <p className="text-sm text-gray-500">Bill a customer for services</p>
        </Link>
        <Link
          href="/services"
          className="card p-4 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <CheckCircle className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-medium text-gray-900">Manage Services</p>
          <p className="text-sm text-gray-500">Edit your service catalog</p>
        </Link>
      </div>
    </div>
  );
}
