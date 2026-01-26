import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Customer } from '../types';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, loading } = useApi<Customer>(`/customers/${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Link to="/customers" className="text-green-600 hover:text-green-700 mt-2 inline-block">
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/customers" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-500">
            Customer since {new Date(customer.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3 text-sm">
            {customer.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="hover:text-green-600">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${customer.phone}`} className="hover:text-green-600">
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p>{customer.address}</p>
                  {(customer.city || customer.state || customer.zip) && (
                    <p>
                      {customer.city}
                      {customer.city && customer.state && ', '}
                      {customer.state} {customer.zip}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {customer.property_size && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Property Size</p>
              <p className="text-sm font-medium text-gray-900">{customer.property_size}</p>
            </div>
          )}

          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Job History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {customer.jobs && customer.jobs.length > 0 ? (
                customer.jobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        {job.service_name && (
                          <p className="text-sm text-gray-500">{job.service_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {job.scheduled_date || 'Not scheduled'}
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={job.status} />
                        {job.price && (
                          <p className="mt-1 text-sm font-medium text-gray-900">${job.price}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No jobs yet</p>
                  <Link to="/jobs" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">
                    Schedule a job
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Invoices</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {customer.invoices && customer.invoices.length > 0 ? (
                customer.invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-gray-900">
                          #{invoice.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <StatusBadge status={invoice.status} type="invoice" />
                        <span className="font-semibold text-gray-900">
                          ${invoice.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No invoices yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
