'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Building,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Plus,
  Trash2,
  CheckCircle,
  Crown,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: number | null;
  estimatedDuration: number | null;
  color: string;
}

interface Crew {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  color: string;
  pin: string | null;
  role: string;
  active: boolean;
}

const SUBSCRIPTION_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: ['1 user', '50 customers', 'Basic scheduling', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    features: [
      '5 users',
      'Unlimited customers',
      'Route optimization',
      'Recurring billing',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    features: [
      'Unlimited users',
      'All features',
      'Custom reports',
      'API access',
      'Phone support',
    ],
  },
];

interface UserData {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  slug: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  description: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  trialEndsAt: string | null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
  });

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    description: '',
  });

  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    defaultPrice: '',
    estimatedDuration: '',
    color: '#10b981',
  });
  const [crewForm, setCrewForm] = useState({
    name: '',
    email: '',
    phone: '',
    pin: '',
    role: 'crew',
    color: '#3b82f6',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, crewsRes, userRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/crews'),
        fetch('/api/user'),
      ]);
      const [servicesData, crewsData, userDataRes] = await Promise.all([
        servicesRes.json(),
        crewsRes.json(),
        userRes.json(),
      ]);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setCrews(Array.isArray(crewsData) ? crewsData : []);

      if (userRes.ok && userDataRes) {
        setUserData(userDataRes);
        setProfileForm({
          name: userDataRes.name || '',
        });
        setBusinessForm({
          companyName: userDataRes.companyName || '',
          phone: userDataRes.phone || '',
          website: userDataRes.website || '',
          address: userDataRes.address || '',
          city: userDataRes.city || '',
          state: userDataRes.state || '',
          zip: userDataRes.zip || '',
          description: userDataRes.description || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', ...profileForm }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      const updatedUser = await res.json();
      setUserData(updatedUser);
      toast({ title: 'Success', description: 'Profile saved', variant: 'success' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'business', ...businessForm }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save business info');
      }

      const updatedUser = await res.json();
      setUserData(updatedUser);
      toast({ title: 'Success', description: 'Business info saved', variant: 'success' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });
      if (res.ok) {
        setIsServiceDialogOpen(false);
        setServiceForm({
          name: '',
          description: '',
          defaultPrice: '',
          estimatedDuration: '',
          color: '#10b981',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Delete this service type?')) return;
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleCreateCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crewForm),
      });
      if (res.ok) {
        setIsCrewDialogOpen(false);
        setCrewForm({
          name: '',
          email: '',
          phone: '',
          pin: '',
          role: 'crew',
          color: '#3b82f6',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating crew:', error);
    }
  };

  const handleDeleteCrew = async (id: string) => {
    if (!confirm('Delete this crew member?')) return;
    try {
      await fetch(`/api/crews/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting crew:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'services', label: 'Services', icon: Palette },
    { id: 'team', label: 'Team', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={userData?.email || ''} disabled />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'business' && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Your company details appear on invoices and your public booking page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={businessForm.companyName}
                    onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
                    placeholder="Your Business Name"
                  />
                  {userData?.slug && (
                    <p className="text-xs text-gray-500 mt-1">
                      Public URL: greendaycrm.com/{userData.slug}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      value={businessForm.website}
                      onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                      placeholder="www.yourbusiness.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label>City</Label>
                    <Input
                      value={businessForm.city}
                      onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={businessForm.state}
                      onChange={(e) => setBusinessForm({ ...businessForm, state: e.target.value })}
                      placeholder="TX"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input
                      value={businessForm.zip}
                      onChange={(e) => setBusinessForm({ ...businessForm, zip: e.target.value })}
                      placeholder="12345"
                    />
                  </div>
                </div>
                <div>
                  <Label>Business Description</Label>
                  <Textarea
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                    placeholder="Tell customers about your services..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveBusiness} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'services' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Service Types</CardTitle>
                    <CardDescription>
                      Define the services you offer
                    </CardDescription>
                  </div>
                  <Dialog
                    open={isServiceDialogOpen}
                    onOpenChange={setIsServiceDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Service Type</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateService} className="space-y-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={serviceForm.name}
                            onChange={(e) =>
                              setServiceForm({ ...serviceForm, name: e.target.value })
                            }
                            placeholder="e.g., Lawn Mowing"
                            required
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={serviceForm.description}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Brief description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Default Price ($)</Label>
                            <Input
                              type="number"
                              value={serviceForm.defaultPrice}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  defaultPrice: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label>Duration (min)</Label>
                            <Input
                              type="number"
                              value={serviceForm.estimatedDuration}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  estimatedDuration: e.target.value,
                                })
                              }
                              placeholder="60"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Input
                            type="color"
                            value={serviceForm.color}
                            onChange={(e) =>
                              setServiceForm({ ...serviceForm, color: e.target.value })
                            }
                            className="h-10 w-20"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsServiceDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add Service</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {services.length > 0 ? (
                    <div className="divide-y">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: service.color }}
                            />
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-gray-500">
                                {service.defaultPrice
                                  ? formatCurrency(service.defaultPrice)
                                  : 'No default price'}
                                {service.estimatedDuration &&
                                  ` • ${service.estimatedDuration} min`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No services defined yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'team' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your crew and staff</CardDescription>
                </div>
                <Dialog open={isCrewDialogOpen} onOpenChange={setIsCrewDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCrew} className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={crewForm.name}
                          onChange={(e) =>
                            setCrewForm({ ...crewForm, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={crewForm.email}
                            onChange={(e) =>
                              setCrewForm({ ...crewForm, email: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={crewForm.phone}
                            onChange={(e) =>
                              setCrewForm({ ...crewForm, phone: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>PIN (for mobile login)</Label>
                          <Input
                            type="text"
                            maxLength={6}
                            placeholder="4-6 digits"
                            value={crewForm.pin}
                            onChange={(e) =>
                              setCrewForm({ ...crewForm, pin: e.target.value.replace(/\D/g, '') })
                            }
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <select
                            value={crewForm.role}
                            onChange={(e) =>
                              setCrewForm({ ...crewForm, role: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          >
                            <option value="crew">Crew</option>
                            <option value="foreman">Foreman</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input
                          type="color"
                          value={crewForm.color}
                          onChange={(e) =>
                            setCrewForm({ ...crewForm, color: e.target.value })
                          }
                          className="h-10 w-20"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCrewDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Add Member</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {crews.length > 0 ? (
                  <div className="divide-y">
                    {crews.map((crew) => (
                      <div
                        key={crew.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: crew.color }}
                          >
                            {crew.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{crew.name}</p>
                              <Badge variant="outline" className="text-xs capitalize">
                                {crew.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {crew.email || crew.phone || 'No contact info'}
                              {crew.pin && ' • PIN set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={crew.active ? 'default' : 'secondary'}>
                            {crew.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCrew(crew.id)}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No team members yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    You&apos;re on the free trial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg">
                    <Crown className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-800">
                        14-Day Free Trial
                      </p>
                      <p className="text-sm text-emerald-600">
                        Full access to all features
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Choose a Plan</CardTitle>
                  <CardDescription>
                    Select the plan that works for your business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {SUBSCRIPTION_TIERS.map((tier) => (
                      <div
                        key={tier.id}
                        className={`p-4 rounded-lg border-2 ${
                          tier.popular
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200'
                        }`}
                      >
                        {tier.popular && (
                          <Badge className="mb-2">Most Popular</Badge>
                        )}
                        <h3 className="font-semibold text-lg">{tier.name}</h3>
                        <div className="mt-2 mb-4">
                          <span className="text-3xl font-bold">${tier.price}</span>
                          <span className="text-gray-500">/mo</span>
                        </div>
                        <ul className="space-y-2 mb-4">
                          {tier.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full"
                          variant={tier.popular ? 'default' : 'outline'}
                        >
                          Select Plan
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Receive updates about your jobs via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weather Alerts</p>
                    <p className="text-sm text-gray-500">
                      Get notified about weather that may affect jobs
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-gray-500">
                      Remind customers about unpaid invoices
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                </div>
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
