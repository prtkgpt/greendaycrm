'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Download,
  Send,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  sentDate: string | null;
  paidDate: string | null;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  paidAmount: number | null;
  paymentMethod: string | null;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  job: {
    id: string;
    title: string;
    scheduledDate: string;
  } | null;
  user: {
    name: string | null;
    email: string;
    companyName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    website: string | null;
  };
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invoice not found');
        return res.json();
      })
      .then(setInvoice)
      .catch(() => {
        toast({ title: 'Error', description: 'Invoice not found', variant: 'destructive' });
        router.push('/dashboard/invoices');
      })
      .finally(() => setLoading(false));
  }, [params.id, router, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    if (!invoice) return;
    setSending(true);

    try {
      const res = await fetch(`/api/invoices/${params.id}/send`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to send');

      const updated = await res.json();
      setInvoice(updated);
      toast({ title: 'Success', description: 'Invoice sent to customer', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send invoice', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setMarkingPaid(true);

    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: invoice.total,
          paymentMethod: 'manual',
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setInvoice(updated);
      toast({ title: 'Success', description: 'Invoice marked as paid', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update invoice', variant: 'destructive' });
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!invoice) return null;

  const isOverdue =
    !['paid', 'cancelled'].includes(invoice.status) &&
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date();

  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header - Hidden in print */}
      <div className="print:hidden flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <Badge className={statusColors[isOverdue ? 'overdue' : invoice.status]}>
              {isOverdue ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {invoice.status === 'draft' && (
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Invoice
            </Button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button onClick={handleMarkPaid} variant="outline" disabled={markingPaid}>
              {markingPaid ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Mark Paid
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8 print:p-0" ref={printRef}>
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-emerald-600">
                {invoice.user.companyName || 'GreenDay CRM'}
              </h2>
              {invoice.user.address && (
                <p className="text-gray-600 mt-1">{invoice.user.address}</p>
              )}
              {(invoice.user.city || invoice.user.state) && (
                <p className="text-gray-600">
                  {invoice.user.city}{invoice.user.city && invoice.user.state && ', '}
                  {invoice.user.state} {invoice.user.zip}
                </p>
              )}
              {invoice.user.phone && (
                <p className="text-gray-600">{invoice.user.phone}</p>
              )}
              {invoice.user.email && (
                <p className="text-gray-600">{invoice.user.email}</p>
              )}
            </div>

            <div className="text-right">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-lg font-mono text-gray-600">{invoice.invoiceNumber}</p>
              <div className="mt-4 text-sm text-gray-600">
                <p><span className="font-medium">Date:</span> {formatDate(invoice.createdAt)}</p>
                {invoice.dueDate && (
                  <p><span className="font-medium">Due:</span> {formatDate(invoice.dueDate)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-2">BILL TO</p>
            <p className="font-semibold text-lg text-gray-900">{invoice.customer.name}</p>
            <p className="text-gray-600">{invoice.customer.address}</p>
            <p className="text-gray-600">
              {invoice.customer.city}, {invoice.customer.state} {invoice.customer.zip}
            </p>
            {invoice.customer.email && (
              <p className="text-gray-600 mt-2">{invoice.customer.email}</p>
            )}
            {invoice.customer.phone && (
              <p className="text-gray-600">{invoice.customer.phone}</p>
            )}
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Description</th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-600 w-24">Qty</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600 w-32">Price</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600 w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 text-gray-900">{item.description}</td>
                    <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-gray-200 text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.paidAmount && invoice.paidAmount > 0 && (
                <>
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  {invoice.paidAmount < invoice.total && (
                    <div className="flex justify-between py-2 font-bold text-gray-900">
                      <span>Balance Due</span>
                      <span>{formatCurrency(invoice.total - invoice.paidAmount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status Badge - For paid invoices */}
          {invoice.status === 'paid' && (
            <div className="flex justify-center mb-8">
              <div className="px-8 py-4 border-4 border-green-500 rounded-lg transform -rotate-6">
                <p className="text-4xl font-bold text-green-500 tracking-wider">PAID</p>
                {invoice.paidDate && (
                  <p className="text-center text-green-600 text-sm">
                    {formatDate(invoice.paidDate)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
              <p className="text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            {invoice.user.website && (
              <p className="mt-1">{invoice.user.website}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #invoice-content,
          #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1in;
          }
        }
      `}</style>
    </div>
  );
}
