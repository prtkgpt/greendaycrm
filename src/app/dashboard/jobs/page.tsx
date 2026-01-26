'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  MapPin,
  Phone,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
}

interface ServiceType {
  id: string;
  name: string;
  defaultPrice: number | null;
  duration: number | null;
}

interface Crew {
  id: string;
  name: string;
  color: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  price: number | null;
  customer: Customer;
  serviceType: ServiceType | null;
  crew: Crew | null;
}

interface FormData {
  customerId: string;
  serviceTypeId: string;
  crewId: string;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  price: string;
  isRecurring: boolean;
  recurrencePattern: string;
  recurrenceEndDate: string;
}

export default function JobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    serviceTypeId: '',
    crewId: '',
    title: '',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    price: '',
    isRecurring: false,
    recurrencePattern: 'weekly',
    recurrenceEndDate: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const [jobsRes, customersRes, servicesRes, crewsRes] = await Promise.all([
        fetch(`/api/jobs?${params}`),
        fetch('/api/customers?limit=1000'),
        fetch('/api/services'),
        fetch('/api/crews'),
      ]);

      const [jobsData, customersData, servicesData, crewsData] = await Promise.all([
        jobsRes.json(),
        customersRes.json(),
        servicesRes.json(),
        crewsRes.json(),
      ]);

      setJobs(jobsData);
      setCustomers(customersData.customers || []);
      setServiceTypes(servicesData || []);
      setCrews(crewsData || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleServiceChange = (serviceId: string) => {
    const service = serviceTypes.find((s) => s.id === serviceId);
    setFormData({
      ...formData,
      serviceTypeId: serviceId,
      title: service?.name || formData.title,
      price: service?.defaultPrice?.toString() || formData.price,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create job');
      }

      toast({ title: 'Success', description: 'Job scheduled', variant: 'success' });
      setIsDialogOpen(false);
      setFormData({
        customerId: '',
        serviceTypeId: '',
        crewId: '',
        title: '',
        description: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        price: '',
        isRecurring: false,
        recurrencePattern: 'weekly',
        recurrenceEndDate: '',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create job',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (jobId: string, status: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast({ title: 'Success', description: `Job ${status.replace('_', ' ')}`, variant: 'success' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update job', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Job deleted', variant: 'success' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete job', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">{jobs.length} total jobs</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      <div className="grid gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                      {job.crew && (
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: job.crew.color || '#e5e7eb' }}
                        >
                          {job.crew.name}
                        </Badge>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/customers/${job.customer.id}`}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      {job.customer.name}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.customer.address}, {job.customer.city}
                      </span>
                      {job.customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {job.customer.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <Calendar className="w-4 h-4" />
                      {formatDate(job.scheduledDate)}
                    </div>
                    {job.scheduledTime && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(job.scheduledTime)}
                      </div>
                    )}
                    {job.price && (
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        {formatCurrency(job.price)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    {job.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(job.id, 'in_progress')}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {job.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(job.id, 'completed')}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    )}
                    {(job.status === 'scheduled' || job.status === 'in_progress') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(job.id, 'canceled')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/jobs/${job.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(job.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No jobs found</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule your first job
            </Button>
          </Card>
        )}
      </div>

      {/* Add Job Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Job</DialogTitle>
            <DialogDescription>Create a new job for a customer</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Customer *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(v) => setFormData({ ...formData, customerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - {c.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Service Type</Label>
              <Select
                value={formData.serviceTypeId}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.defaultPrice && `- ${formatCurrency(s.defaultPrice)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Job Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Weekly Lawn Mowing"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Assign Crew</Label>
                <Select
                  value={formData.crewId}
                  onValueChange={(v) => setFormData({ ...formData, crewId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {crews.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                placeholder="Any special notes..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="recurring" className="cursor-pointer">Make this a recurring job</Label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-emerald-200">
                <div>
                  <Label>Repeat</Label>
                  <Select
                    value={formData.recurrencePattern}
                    onValueChange={(v) => setFormData({ ...formData, recurrencePattern: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Until</Label>
                  <Input
                    type="date"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Scheduling...' : 'Schedule Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
