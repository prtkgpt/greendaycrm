'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle,
  Play,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { formatTime, formatCurrency } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  price: number | null;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string | null;
  };
  serviceType: {
    name: string;
    color: string;
  } | null;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

export default function CrewApp() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTodaysJobs();
  }, []);

  const fetchTodaysJobs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/jobs?date=${today}&limit=50`);
      const data = await res.json();
      // Sort by scheduled time
      const sortedJobs = (data.jobs || []).sort((a: Job, b: Job) => {
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
      setJobs(sortedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodaysJobs();
  };

  const handleStartJob = async (jobId: string) => {
    try {
      // Get current location
      let latitude, longitude;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          checkInLat: latitude,
          checkInLng: longitude,
        }),
      });

      if (res.ok) {
        fetchTodaysJobs();
      }
    } catch (error) {
      console.error('Error starting job:', error);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      // Get current location
      let latitude, longitude;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          checkOutLat: latitude,
          checkOutLng: longitude,
        }),
      });

      if (res.ok) {
        fetchTodaysJobs();
      }
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  const openNavigation = (address: string, city: string, state: string) => {
    const fullAddress = encodeURIComponent(`${address}, ${city}, ${state}`);
    // Try to use native navigation apps
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(`maps://maps.apple.com/?daddr=${fullAddress}`);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${fullAddress}`);
    }
  };

  const activeJob = jobs.find((j) => j.status === 'in_progress');
  const upcomingJobs = jobs.filter((j) => j.status === 'scheduled');
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold">GreenDay Crew</h1>
              <p className="text-emerald-100 text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-4">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{upcomingJobs.length}</p>
            <p className="text-xs text-gray-500">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{activeJob ? 1 : 0}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{completedJobs.length}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Job */}
      {activeJob && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Current Job
          </h2>
          <Card className="border-yellow-300 border-2">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{activeJob.title}</h3>
                  <p className="text-gray-600">{activeJob.customer.name}</p>
                </div>
                <Badge className={statusColors[activeJob.status]}>In Progress</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {activeJob.customer.address}, {activeJob.customer.city}
                  </span>
                </div>
                {activeJob.scheduledTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(activeJob.scheduledTime)}</span>
                  </div>
                )}
                {activeJob.price && (
                  <div className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(activeJob.price)}
                  </div>
                )}
              </div>

              {activeJob.notes && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">{activeJob.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    openNavigation(
                      activeJob.customer.address,
                      activeJob.customer.city,
                      activeJob.customer.state
                    )
                  }
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Navigate
                </Button>
                {activeJob.customer.phone && (
                  <Button variant="outline" asChild>
                    <a href={`tel:${activeJob.customer.phone}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline">
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleCompleteJob(activeJob.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Upcoming Jobs ({upcomingJobs.length})
          </h2>
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.customer.name}</p>
                    </div>
                    {job.scheduledTime && (
                      <Badge variant="outline">{formatTime(job.scheduledTime)}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">
                      {job.customer.address}, {job.customer.city}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        openNavigation(
                          job.customer.address,
                          job.customer.city,
                          job.customer.state
                        )
                      }
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Navigate
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStartJob(job.id)}
                      disabled={!!activeJob}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Completed Today ({completedJobs.length})
          </h2>
          <div className="space-y-2">
            {completedJobs.map((job) => (
              <Card key={job.id} className="opacity-60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.customer.name}</p>
                      </div>
                    </div>
                    {job.price && (
                      <span className="text-sm font-medium text-gray-600">
                        {formatCurrency(job.price)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className="p-8 text-center">
          <Leaf className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No jobs scheduled for today</p>
          <Button variant="link" onClick={handleRefresh} className="mt-2">
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
