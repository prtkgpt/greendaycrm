import { useState } from 'react';
import { useApi, apiRequest } from '../hooks/useApi';
import { Invoice, Customer, Job } from '../types';
import { Plus, Search, DollarSign, CheckCircle } from 'lucide-react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: invoices, loading, refetch } = useApi<Invoice[]>(
    `/invoices${statusFilter ? `?status=${statusFilter}` : ''}`
  );
  const { data: customers } = useApi<Customer[]>('/customers');
  const { data: jobs } = useApi<Job[]>('/jobs?status=completed');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    job_id: '',
    amount: '',
    due_date: '',
    notes: '',
  });

  const filteredInvoices = invoices?.filter(
    (i) =>
      i.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = invoices
    ?.filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0) || 0;

  const openModal = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setFormData({
      customer_id: '',
      job_id: '',
      amount: '',
      due_date: nextWeek.toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/invoices', {
        method: 'POST',
        body: {
          ...formData,
          amount: parseFloat(formData.amount),
        },
      });
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      await apiRequest(`/invoices/${id}/pay`, { method: 'PATCH' });
      refetch();
    } catch (err) {
      console.error('Failed to mark as paid:', err);
    }
  };

  const handleJobChange = (jobId: string) => {
    const job = jobs?.find((j) => j.id === jobId);
    if (job) {
      setFormData({
        ...formData,
        job_id: jobId,
        customer_id: job.customer_id,
        amount: job.price?.toString() || formData.amount,
      });
    } else {
      setFormData({ ...formData, job_id: jobId });
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
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">
            {invoices?.length || 0} invoices | ${totalPending.toLocaleString()} pending
          </p>
        </div>
        <button onClick={openModal} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
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
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Invoice</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Due Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices && filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm text-gray-900">
                        #{invoice.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${invoice.customer_id}`}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        {invoice.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {invoice.job_title || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {invoice.due_date || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} type="invoice" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-semibold text-gray-900">
                        ${invoice.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {invoice.status === 'pending' && (
                          <button
                            onClick={() => markAsPaid(invoice.id)}
                            className="btn btn-primary text-xs py-1 px-2"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mark Paid
                          </button>
                        )}
                        {invoice.status === 'paid' && (
                          <span className="text-xs text-gray-400">
                            Paid {invoice.paid_date}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Invoice"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">From Job (Optional)</label>
            <select
              value={formData.job_id}
              onChange={(e) => handleJobChange(e.target.value)}
              className="input"
            >
              <option value="">Select a completed job...</option>
              {jobs?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} - {j.customer_name} {j.price && `($${j.price})`}
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
