import { useState } from 'react';
import { useApi, apiRequest } from '../hooks/useApi';
import { Service } from '../types';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';

export default function Services() {
  const { data: services, loading, refetch } = useApi<Service[]>('/services');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_price: '',
    duration_minutes: '',
  });

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
    const payload = {
      name: formData.name,
      description: formData.description || null,
      default_price: formData.default_price ? parseFloat(formData.default_price) : null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
    };
    try {
      if (editingService) {
        await apiRequest(`/services/${editingService.id}`, { method: 'PUT', body: payload });
      } else {
        await apiRequest('/services', { method: 'POST', body: payload });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Failed to save service:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await apiRequest(`/services/${id}`, { method: 'DELETE' });
      refetch();
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 mt-1">Manage your service catalog</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services && services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {service.default_price && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="w-4 h-4" />
                        {service.default_price}
                      </span>
                    )}
                    {service.duration_minutes && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        {service.duration_minutes} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => openModal(service)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full card p-8 text-center text-gray-500">
            <p>No services defined</p>
            <button
              onClick={() => openModal()}
              className="text-green-600 hover:text-green-700 mt-2"
            >
              Add your first service
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add Service'}
      >
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
              placeholder="What's included in this service..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Default Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
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
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="input"
                placeholder="60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingService ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
