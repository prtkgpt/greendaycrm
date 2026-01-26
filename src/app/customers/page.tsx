'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Phone, Mail, MapPin, Trash2, Edit } from 'lucide-react';
import Modal from '@/components/Modal';
import Loading from '@/components/Loading';
import { Customer } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    property_size: '',
    notes: '',
  });

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip || '',
        property_size: customer.property_size || '',
        notes: customer.notes || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        property_size: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
    const method = editingCustomer ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setIsModalOpen(false);
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    fetchCustomers();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">{customers.length} total customers</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="card p-4">
              <div className="flex items-start justify-between">
                <Link href={`/customers/${customer.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 hover:text-green-600">
                    {customer.name}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {customer.address}
                        {customer.city && `, ${customer.city}`}
                        {customer.state && `, ${customer.state}`}
                        {customer.zip && ` ${customer.zip}`}
                      </div>
                    )}
                  </div>
                  {customer.property_size && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                      {customer.property_size}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">{customer.total_jobs || 0} jobs</div>
                    <div className="text-gray-500">{customer.completed_jobs || 0} completed</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(customer)} className="p-2 rounded-lg hover:bg-gray-100">
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="p-2 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center text-gray-500">
            <p>No customers found</p>
            <button onClick={() => openModal()} className="text-green-600 hover:text-green-700 mt-2">
              Add your first customer
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="John Smith" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input" placeholder="john@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" placeholder="(555) 123-4567" />
            </div>
          </div>
          <div>
            <label className="label">Street Address</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input" placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">State</label>
              <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">ZIP</label>
              <input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Property Size</label>
            <select value={formData.property_size} onChange={(e) => setFormData({ ...formData, property_size: e.target.value })} className="input">
              <option value="">Select size...</option>
              <option value="Small (under 1/4 acre)">Small (under 1/4 acre)</option>
              <option value="Medium (1/4 - 1/2 acre)">Medium (1/4 - 1/2 acre)</option>
              <option value="Large (1/2 - 1 acre)">Large (1/2 - 1 acre)</option>
              <option value="Estate (over 1 acre)">Estate (over 1 acre)</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input" rows={3} placeholder="Any special instructions..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editingCustomer ? 'Save Changes' : 'Add Customer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
