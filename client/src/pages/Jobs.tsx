import { useState, useEffect } from 'react';
import { useApi, apiRequest } from '../hooks/useApi';
import { Job, Customer, Service } from '../types';
import { Plus, Search, Calendar, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export default function Jobs() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const { data: jobs, loading, refetch } = useApi<Job[]>(
    `/jobs${statusFilter ? `?status=${statusFilter}` : ''}${dateFilter ? `${statusFilter ? '&' : '?'}date=${dateFilter}` : ''}`
  );
  const { data: customers } = useApi<Customer[]>('/customers');
  const { data: services } = useApi<Service[]>('/services');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    price: '',
    notes: '',
  });

  useEffect(() => {
    refetch();
  }, [statusFilter, dateFilter]);

  const filteredJobs = jobs?.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        customer_id: job.customer_id,
        service_id: job.service_id || '',
        title: job.title,
        description: job.description || '',
        scheduled_date: job.scheduled_date || '',
        scheduled_time: job.scheduled_time || '',
        price: job.price?.toString() || '',
        notes: job.notes || '',
      });
    } else {
      setEditingJob(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        customer_id: '',
        service_id: '',
        title: '',
        description: '',
        scheduled_date: today,
        scheduled_time: '09:00',
        price: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
    };
    try {
      if (editingJob) {
        await apiRequest(`/jobs/${editingJob.id}`, {
          method: 'PUT',
          body: { ...payload, status: editingJob.status },
        });
      } else {
        await apiRequest('/jobs', { method: 'POST', body: payload });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Failed to save job:', err);
    }
  };

  const updateStatus = async (jobId: string, status: string) => {
    try {
      await apiRequest(`/jobs/${jobId}/status`, { method: 'PATCH', body: { status } });
      refetch();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services?.find((s) => s.id === serviceId);
    setFormData({
      ...formData,
      service_id: serviceId,
      title: service?.name || formData.title,
      price: service?.default_price?.toString() || formData.price,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">Manage scheduled and completed work</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input w-40"
        />
      </div>

      {/* Jobs List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Price</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobs && filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        {job.service_name && (
                          <p className="text-sm text-gray-500">{job.service_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${job.customer_id}`}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        {job.customer_name}
                      </Link>
                      {job.customer_address && (
                        <p className="text-xs text-gray-400">{job.customer_address}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {job.scheduled_date || 'Not scheduled'}
                      {job.scheduled_time && <span className="ml-1">at {job.scheduled_time}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {job.price ? `$${job.price}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {job.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => updateStatus(job.id, 'in_progress')}
                              className="p-1.5 rounded hover:bg-yellow-50"
                              title="Start Job"
                            >
                              <Clock className="w-4 h-4 text-yellow-600" />
                            </button>
                            <button
                              onClick={() => updateStatus(job.id, 'completed')}
                              className="p-1.5 rounded hover:bg-green-50"
                              title="Mark Complete"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          </>
                        )}
                        {job.status === 'in_progress' && (
                          <button
                            onClick={() => updateStatus(job.id, 'completed')}
                            className="p-1.5 rounded hover:bg-green-50"
                            title="Mark Complete"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => openModal(job)}
                          className="p-1.5 rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? 'Edit Job' : 'Schedule New Job'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Customer *</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="input"
            >
              <option value="">Select customer...</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Service</label>
            <select
              value={formData.service_id}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="input"
            >
              <option value="">Select service...</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.default_price && `- $${s.default_price}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Job Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="e.g., Weekly Lawn Mowing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="input"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
              placeholder="Internal notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingJob ? 'Save Changes' : 'Schedule Job'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
