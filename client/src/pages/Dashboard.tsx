import { useApi } from '../hooks/useApi';
import { DashboardStats, Job, Activity } from '../types';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  CheckCircle,
  DollarSign,
  Clock,
  TrendingUp,
  MapPin,
  Phone
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>('/dashboard/stats');
  const { data: upcomingJobs, loading: jobsLoading } = useApi<Job[]>('/dashboard/upcoming-jobs');
  const { data: activity } = useApi<Activity[]>('/dashboard/recent-activity');

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'bg-blue-500' },
    { name: 'Jobs Today', value: stats?.jobsToday || 0, icon: Calendar, color: 'bg-green-500' },
    { name: 'Pending Jobs', value: stats?.pendingJobs || 0, icon: Clock, color: 'bg-yellow-500' },
    { name: 'Completed This Month', value: stats?.completedThisMonth || 0, icon: CheckCircle, color: 'bg-emerald-500' },
    { name: 'Monthly Revenue', value: `$${(stats?.revenueThisMonth || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-600' },
    { name: 'Outstanding Invoices', value: `$${(stats?.pendingInvoicesTotal || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-4">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Jobs */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Jobs</h2>
              <Link to="/jobs" className="text-sm text-green-600 hover:text-green-700">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {jobsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : upcomingJobs && upcomingJobs.length > 0 ? (
              upcomingJobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.customer_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {job.scheduled_date}
                          {job.scheduled_time && ` at ${job.scheduled_time}`}
                        </span>
                        {job.customer_address && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" />
                            {job.customer_address}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {job.price && (
                        <span className="text-sm font-medium text-gray-900">
                          ${job.price}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No upcoming jobs scheduled</p>
                <Link to="/jobs" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">
                  Schedule a job
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activity && activity.length > 0 ? (
              activity.slice(0, 5).map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.description}
                      </p>
                      <p className="text-xs text-gray-500">{item.customer_name}</p>
                    </div>
                    <StatusBadge
                      status={item.status}
                      type={item.type === 'invoice' ? 'invoice' : 'job'}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/customers" className="btn btn-primary">
            <Users className="w-4 h-4 mr-2" />
            Add Customer
          </Link>
          <Link to="/jobs" className="btn btn-secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Job
          </Link>
          <Link to="/invoices" className="btn btn-secondary">
            <DollarSign className="w-4 h-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
