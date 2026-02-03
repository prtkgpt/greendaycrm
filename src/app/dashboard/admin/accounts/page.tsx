'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Save,
  Building2,
  Users,
  Calendar,
  FileText,
  ShieldX,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatDate, getStatusColor, getInitials } from '@/lib/utils';

interface Account {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  slug: string | null;
  phone: string | null;
  role: string;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  _count: {
    customers: number;
    jobs: number;
    invoices: number;
    crews: number;
  };
}

const defaultForm = {
  name: '',
  email: '',
  password: '',
  companyName: '',
  phone: '',
  subscriptionTier: 'starter',
  subscriptionStatus: 'trial',
  role: 'user',
};

export default function AdminAccountsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAccounts();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchAccounts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/accounts?${params}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => fetchAccounts(), 300);
      return () => clearTimeout(timer);
    }
  }, [search, statusFilter]);

  const openNew = () => {
    setEditingAccount(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      name: account.name || '',
      email: account.email,
      password: '',
      companyName: account.companyName || '',
      phone: account.phone || '',
      subscriptionTier: account.subscriptionTier || 'starter',
      subscriptionStatus: account.subscriptionStatus || 'trial',
      role: account.role || 'user',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let res;
      if (editingAccount) {
        const payload: Record<string, string> = {};
        if (form.name !== editingAccount.name) payload.name = form.name;
        if (form.email !== editingAccount.email) payload.email = form.email;
        if (form.companyName !== (editingAccount.companyName || '')) payload.companyName = form.companyName;
        if (form.phone !== (editingAccount.phone || '')) payload.phone = form.phone;
        if (form.subscriptionTier !== editingAccount.subscriptionTier) payload.subscriptionTier = form.subscriptionTier;
        if (form.subscriptionStatus !== editingAccount.subscriptionStatus) payload.subscriptionStatus = form.subscriptionStatus;
        if (form.role !== editingAccount.role) payload.role = form.role;
        if (form.password) payload.password = form.password;

        res = await fetch(`/api/admin/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast({
        title: 'Success',
        description: editingAccount ? 'Account updated' : 'Account created',
        variant: 'success',
      });
      setIsDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save account',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (account: Account) => {
    if (!confirm(`Delete "${account.companyName || account.name}"? This will permanently remove the account and ALL associated data (customers, jobs, invoices, etc). This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete');
      }
      toast({ title: 'Success', description: 'Account deleted', variant: 'success' });
      fetchAccounts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account',
        variant: 'destructive',
      });
    }
  };

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ShieldX className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-gray-500">Account management is only available to platform administrators.</p>
      </div>
    );
  }

  const tenantAccounts = accounts.filter((a) => a.role !== 'admin');
  const adminAccounts = accounts.filter((a) => a.role === 'admin');

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500">Onboard and manage landscaping company accounts</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Accounts</p>
            <p className="text-2xl font-bold">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-emerald-600">
              {accounts.filter((a) => a.subscriptionStatus === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Trial</p>
            <p className="text-2xl font-bold text-purple-600">
              {accounts.filter((a) => a.subscriptionStatus === 'trial').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Platform Admins</p>
            <p className="text-2xl font-bold text-blue-600">{adminAccounts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {getInitials(account.companyName || account.name || account.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {account.companyName || 'No Company'}
                        </h3>
                        <Badge className={getStatusColor(account.subscriptionStatus || 'trial')}>
                          {account.subscriptionStatus || 'trial'}
                        </Badge>
                        {account.subscriptionTier && (
                          <Badge variant="outline" className="capitalize">
                            {account.subscriptionTier}
                          </Badge>
                        )}
                        {account.role === 'admin' && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {account.name} &middot; {account.email}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {account._count.customers} customers
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {account._count.jobs} jobs
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {account._count.invoices} invoices
                        </span>
                        <span>Joined {formatDate(account.createdAt)}</span>
                        {account.slug && (
                          <button
                            onClick={() => copySlug(account.slug!)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                          >
                            {copiedSlug === account.slug ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            /{account.slug}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {account.slug && (
                      <a href={`/${account.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(account)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => deleteAccount(account)}
                      disabled={account.id === session?.user?.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium mb-1">No accounts found</p>
              <p className="text-sm mb-4">Create your first landscaping company account.</p>
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount
                ? 'Update account details. Leave password blank to keep current.'
                : 'Create a new landscaping company account. They will receive login credentials.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g., GreenScape Lawn Care"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="owner@greenscape.com"
                required
              />
            </div>

            <div>
              <Label>{editingAccount ? 'New Password (leave blank to keep)' : 'Password'}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingAccount ? '' : 'Min. 8 characters'}
                required={!editingAccount}
                minLength={editingAccount ? 0 : 8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subscription Tier</Label>
                <Select
                  value={form.subscriptionTier}
                  onValueChange={(v) => setForm({ ...form, subscriptionTier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.subscriptionStatus}
                  onValueChange={(v) => setForm({ ...form, subscriptionStatus: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Tenant (Landscaping Company)</SelectItem>
                  <SelectItem value="admin">Platform Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                Admins can manage all accounts and the blog CMS.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingAccount ? 'Update Account' : 'Create Account'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
