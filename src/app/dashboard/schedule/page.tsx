'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { formatTime, getStatusColor } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  price: number | null;
  customer: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  serviceType: {
    name: string;
    color: string;
  } | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function SchedulePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get first and last day of current view
  const viewRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      // Extend to full weeks
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      return { start: startDate, end: endDate };
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return { start: startOfWeek, end: endOfWeek };
    }
  }, [currentDate, view]);

  useEffect(() => {
    fetchJobs();
  }, [viewRange]);

  const fetchJobs = async () => {
    try {
      const startStr = viewRange.start.toISOString().split('T')[0];
      const endStr = viewRange.end.toISOString().split('T')[0];

      const res = await fetch(`/api/jobs?startDate=${startStr}&endDate=${endStr}&limit=500`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped: Record<string, Job[]> = {};
    jobs.forEach((job) => {
      const dateKey = job.scheduledDate.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(job);
    });
    // Sort jobs within each day by time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
    });
    return grouped;
  }, [jobs]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(viewRange.start);
    while (current <= viewRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [viewRange]);

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const selectedJobs = selectedDate ? jobsByDate[selectedDate] || [] : [];

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
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 mt-1">View and manage your job schedule</p>
        </div>
        <Link href="/dashboard/jobs">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <h2 className="text-lg font-semibold ml-4">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            <div className="flex gap-1">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const dateKey = date.toISOString().split('T')[0];
                const dayJobs = jobsByDate[dateKey] || [];
                const isSelected = selectedDate === dateKey;

                return (
                  <div
                    key={dateKey}
                    className={`min-h-24 p-1 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 hover:border-gray-300'
                    } ${!isCurrentMonth(date) ? 'opacity-40' : ''}`}
                    onClick={() => setSelectedDate(dateKey)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                          isToday(date)
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayJobs.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {dayJobs.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayJobs.slice(0, 3).map((job) => (
                        <div
                          key={job.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${
                            job.serviceType?.color
                              ? `bg-opacity-20`
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                          style={{
                            backgroundColor: job.serviceType?.color
                              ? `${job.serviceType.color}20`
                              : undefined,
                            color: job.serviceType?.color || undefined,
                          }}
                        >
                          {job.scheduledTime && (
                            <span className="font-medium">
                              {job.scheduledTime.slice(0, 5)}{' '}
                            </span>
                          )}
                          {job.customer.name}
                        </div>
                      ))}
                      {dayJobs.length > 3 && (
                        <div className="text-xs text-gray-400 px-1">
                          +{dayJobs.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedJobs.length > 0 ? (
                <div className="space-y-3">
                  {selectedJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs?id=${job.id}`}
                      className="block"
                    >
                      <div className="p-3 rounded-lg border hover:border-emerald-300 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">
                                {job.title}
                              </p>
                              <Badge
                                className={getStatusColor(job.status)}
                                variant="secondary"
                              >
                                {job.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {job.customer.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          {job.scheduledTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(job.scheduledTime)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" />
                            {job.customer.address}
                          </span>
                        </div>
                        {job.serviceType && (
                          <Badge
                            variant="outline"
                            className="mt-2"
                            style={{
                              borderColor: job.serviceType.color,
                              color: job.serviceType.color,
                            }}
                          >
                            {job.serviceType.name}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No jobs scheduled</p>
                  <Link href="/dashboard/jobs">
                    <Button variant="link" size="sm">
                      Schedule a job
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="py-8 text-center">
                <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Click a day to see jobs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-2xl font-bold">
              {
                jobs.filter((j) => {
                  const jobDate = new Date(j.scheduledDate);
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  return jobDate >= startOfWeek && jobDate <= endOfWeek;
                }).length
              }{' '}
              jobs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600">
              {jobs.filter((j) => j.status === 'scheduled').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">
              {jobs.filter((j) => j.status === 'in_progress').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
