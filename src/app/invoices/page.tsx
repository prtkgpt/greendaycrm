'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Check } from 'lucide-react';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import Loading from '@/components/Loading';
import { Invoice, Customer, Job } from '@/types';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    job_id: '',
    amount: '',
    due_date: '',
    notes: '',
  });

  const fetchData = () => {
    Promise.all([
      fetch('/api/invoices').then((r) => r.json()),
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/jobs?status=completed').then((r) => r.json()),
    ])
      .then(([invoicesData, customersData, jobsData]) => {
        setInvoices(invoicesData);
        setCustomers(customersData);
        setJobs(jobsData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      customer_id: '',
      job_id: '',
      amount: '',
      due_date: nextWeek,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleJobChange = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    setFormData({
      ...formData,
      job_id: jobId,
      customer_id: job?.customer_id || formData.customer_id,
      amount: job?.price?.toString() || formData.amount,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        amount: parseFloat(formData.amount),
      }),
    });
    setIsModalOpen(false);
    fetchData();
  };

  const markAsPaid = async (id: string) => {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    fetchData();
  };

  if (loading) return <Loading />;

  const totalPending = invoices
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">{invoices.length} total invoices</p>
        </div>
        <button onClick={openModal} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Paid (All Time)</p>
          <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer..."
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
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">#{invoice.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{invoice.customer_name}</p>
                    {invoice.job_title && (
                      <p className="text-xs text-gray-500">{invoice.job_title}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ${Number(invoice.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} type="invoice" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {invoice.due_date || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invoice.status === 'pending' && (
                      <button
                        onClick={() => markAsPaid(invoice.id)}
                        className="btn btn-secondary text-sm py-1.5"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Invoice" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">From Completed Job</label>
            <select
              value={formData.job_id}
              onChange={(e) => handleJobChange(e.target.value)}
              className="input"
            >
              <option value="">Select a job (optional)...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.customer_name} - {j.title} (${j.price || 0})
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
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              placeholder="0.00"
            />
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
            <button type="submit" className="btn btn-primary">Create Invoice</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
