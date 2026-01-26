'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Clock, DollarSign } from 'lucide-react';
import Modal from '@/components/Modal';
import Loading from '@/components/Loading';
import { Service } from '@/types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_price: '',
    duration_minutes: '',
  });

  const fetchServices = () => {
    fetch('/api/services')
      .then((res) => res.json())
      .then(setServices)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        default_price: service.default_price?.toString() || '',
        duration_minutes: service.duration_minutes?.toString() || '',
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        default_price: '',
        duration_minutes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
    const method = editingService ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        default_price: formData.default_price ? parseFloat(formData.default_price) : null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      }),
    });

    setIsModalOpen(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    fetchServices();
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 mt-1">Manage your service catalog</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(service)} className="p-2 rounded-lg hover:bg-gray-100">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="p-2 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-gray-900">
                    ${service.default_price || '0'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatDuration(service.duration_minutes)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full card p-8 text-center text-gray-500">
            <p>No services yet</p>
            <button onClick={() => openModal()} className="text-green-600 hover:text-green-700 mt-2">
              Add your first service
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Service Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Lawn Mowing"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
              placeholder="Brief description of the service"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Default Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.default_price}
                onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="input"
                placeholder="60"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editingService ? 'Save Changes' : 'Add Service'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
