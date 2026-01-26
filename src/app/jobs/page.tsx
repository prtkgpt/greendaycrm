'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Phone, Check, Play, X } from 'lucide-react';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import Loading from '@/components/Loading';
import { Job, Customer, Service } from '@/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const fetchData = () => {
    Promise.all([
      fetch('/api/jobs').then((r) => r.json()),
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/services').then((r) => r.json()),
    ])
      .then(([jobsData, customersData, servicesData]) => {
        setJobs(jobsData);
        setCustomers(customersData);
        setServices(servicesData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = () => {
    setFormData({
      customer_id: '',
      service_id: '',
      title: '',
      description: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      price: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setFormData({
      ...formData,
      service_id: serviceId,
      title: service?.name || formData.title,
      price: service?.default_price?.toString() || formData.price,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      }),
    });
    setIsModalOpen(false);
    fetchData();
  };

  const updateStatus = async (jobId: string, status: string) => {
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">{jobs.length} total jobs</p>
        </div>
        <button onClick={openModal} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Job
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
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
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{job.customer_name}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
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
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900">
                    {job.scheduled_date || 'Not scheduled'}
                  </p>
                  {job.scheduled_time && (
                    <p className="text-xs text-gray-500">{job.scheduled_time}</p>
                  )}
                  {job.price && (
                    <p className="text-sm font-semibold text-green-600 mt-1">${job.price}</p>
                  )}
                </div>
              </div>

              {job.status !== 'completed' && job.status !== 'cancelled' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  {job.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(job.id, 'in_progress')}
                      className="btn btn-secondary text-sm py-1.5"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </button>
                  )}
                  {job.status === 'in_progress' && (
                    <button
                      onClick={() => updateStatus(job.id, 'completed')}
                      className="btn btn-primary text-sm py-1.5"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(job.id, 'cancelled')}
                    className="btn btn-secondary text-sm py-1.5 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card p-8 text-center text-gray-500">
            <p>No jobs found</p>
            <button onClick={openModal} className="text-green-600 hover:text-green-700 mt-2">
              Schedule your first job
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Job" size="lg">
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
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - ${s.default_price}</option>
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
            <label className="label">Price</label>
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
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule Job</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
