'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Route,
  MapPin,
  Clock,
  Navigation,
  Users,
  ChevronRight,
  Play,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

interface Job {
  id: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string | null;
  routeOrder: number | null;
  customer: Customer;
  serviceType: { name: string; color: string } | null;
}

interface Crew {
  id: string;
  name: string;
  color: string;
}

interface RouteData {
  id: string;
  name: string;
  date: string;
  status: string;
  totalDistance: number | null;
  estimatedDuration: number | null;
  crew: Crew | null;
  jobs: Job[];
}

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  optimized: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    crewId: '',
    startAddress: '',
  });

  useEffect(() => {
    fetchRoutes();
    fetchJobs();
    fetchCrews();
  }, [selectedDate]);

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`/api/routes?date=${selectedDate}`);
      const data = await res.json();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/jobs?status=scheduled&date=${selectedDate}`);
      const data = await res.json();
      // Filter jobs that don't have a route yet
      const unassignedJobs = (data.jobs || []).filter((job: Job) => !job.routeOrder);
      setJobs(unassignedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchCrews = async () => {
    try {
      const res = await fetch('/api/crews');
      const data = await res.json();
      setCrews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching crews:', error);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jobIds: selectedJobs,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setFormData({
          name: '',
          date: selectedDate,
          crewId: '',
          startAddress: '',
        });
        setSelectedJobs([]);
        fetchRoutes();
        fetchJobs();
      }
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  const handleOptimizeRoute = async (routeId: string) => {
    try {
      const res = await fetch(`/api/routes/${routeId}/optimize`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchRoutes();
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
    }
  };

  const handleStartRoute = async (routeId: string) => {
    try {
      const res = await fetch(`/api/routes/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });

      if (res.ok) {
        fetchRoutes();
      }
    } catch (error) {
      console.error('Error starting route:', error);
    }
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-500 mt-1">Plan and optimize your daily routes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Route</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoute} className="space-y-4 mt-4">
              <div>
                <Label>Route Name (optional)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Route"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Assign Crew</Label>
                  <Select
                    value={formData.crewId}
                    onValueChange={(value) => setFormData({ ...formData, crewId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crew" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No crew</SelectItem>
                      {crews.map((crew) => (
                        <SelectItem key={crew.id} value={crew.id}>
                          {crew.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Starting Address (optional)</Label>
                <Input
                  value={formData.startAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, startAddress: e.target.value })
                  }
                  placeholder="Your office or starting point"
                />
              </div>

              {jobs.length > 0 && (
                <div>
                  <Label>Select Jobs</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedJobs.includes(job.id) ? 'bg-emerald-50' : ''
                        }`}
                        onClick={() => toggleJobSelection(job.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedJobs.includes(job.id)}
                            onChange={() => toggleJobSelection(job.id)}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{job.title}</p>
                            <p className="text-xs text-gray-500">
                              {job.customer.name} - {job.customer.address}
                            </p>
                          </div>
                          {job.scheduledTime && (
                            <span className="text-xs text-gray-400">
                              {job.scheduledTime}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={selectedJobs.length === 0}>
                  Create Route ({selectedJobs.length} jobs)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Select Date:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
              >
                Tomorrow
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Existing Routes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Routes for {formatDate(selectedDate)}
          </h2>

          {routes.length > 0 ? (
            routes.map((route) => (
              <Card key={route.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Route className="w-5 h-5 text-emerald-600" />
                      <CardTitle className="text-base">{route.name}</CardTitle>
                    </div>
                    <Badge className={statusColors[route.status]}>
                      {route.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {route.jobs.length} stops
                    </span>
                    {route.totalDistance && (
                      <span className="flex items-center gap-1">
                        <Navigation className="w-4 h-4" />
                        {route.totalDistance} mi
                      </span>
                    )}
                    {route.estimatedDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(route.estimatedDuration)}
                      </span>
                    )}
                    {route.crew && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {route.crew.name}
                      </span>
                    )}
                  </div>

                  {/* Job List */}
                  <div className="space-y-2">
                    {route.jobs.map((job, index) => (
                      <div
                        key={job.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {job.customer.address}, {job.customer.city}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {route.status === 'planned' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOptimizeRoute(route.id)}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Optimize
                      </Button>
                    )}
                    {(route.status === 'planned' || route.status === 'optimized') && (
                      <Button size="sm" onClick={() => handleStartRoute(route.id)}>
                        <Play className="w-4 h-4 mr-1" />
                        Start Route
                      </Button>
                    )}
                    {route.status === 'optimized' && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={`https://www.google.com/maps/dir/${route.jobs
                            .map(
                              (j) =>
                                `${encodeURIComponent(j.customer.address + ', ' + j.customer.city)}`
                            )
                            .join('/')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          Open in Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Route className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No routes for this date</p>
                <Button
                  variant="link"
                  onClick={() => setIsDialogOpen(true)}
                  className="mt-2"
                >
                  Create a route
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Unassigned Jobs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Unassigned Jobs</h2>

          {jobs.length > 0 ? (
            <Card>
              <CardContent className="p-0 divide-y">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.customer.name}</p>
                        <p className="text-xs text-gray-400">
                          {job.customer.address}, {job.customer.city}
                        </p>
                      </div>
                      {job.scheduledTime && (
                        <Badge variant="outline">{job.scheduledTime}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">All jobs are assigned to routes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
