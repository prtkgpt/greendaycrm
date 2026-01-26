'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Leaf, Calendar, Clock, MapPin, Check, Loader2, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: number | null;
  duration: number | null;
  color: string | null;
}

const bookingSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
  serviceTypeId: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function BookServicePage() {
  const params = useParams();
  const company = params.company as string;
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    fetchServices();
  }, [company]);

  const fetchServices = async () => {
    try {
      const res = await fetch(`/api/public/${company}/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
        setCompanyName(data.companyName);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setValue('serviceTypeId', serviceId);
  };

  const onSubmit = async (data: BookingForm) => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companySlug: company,
          ...data,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to submit request');
      }

      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your service request. We'll be in touch shortly to confirm your appointment.
            </p>
            <Link href={`/${company}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/${company}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">{companyName || company}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Request a Quote</h1>
          <p className="text-gray-600">Fill out the form below and we'll get back to you within 24 hours</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Services Selection */}
            {services.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Select a Service</CardTitle>
                  <CardDescription>Choose the service you're interested in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedService === service.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: service.color || '#22c55e' }}
                          />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        {service.defaultPrice && (
                          <p className="text-emerald-600 font-semibold">
                            From ${service.defaultPrice}
                          </p>
                        )}
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    {...register('name')}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Property Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St"
                    {...register('address')}
                    disabled={isLoading}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Springfield"
                      {...register('city')}
                      disabled={isLoading}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="IL"
                      {...register('state')}
                      disabled={isLoading}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    placeholder="62701"
                    {...register('zip')}
                    disabled={isLoading}
                  />
                  {errors.zip && (
                    <p className="text-sm text-red-500">{errors.zip.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scheduling Preferences */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Scheduling Preferences
                </CardTitle>
                <CardDescription>Optional: Let us know your preferred date and time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      {...register('preferredDate')}
                      disabled={isLoading}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <select
                      id="preferredTime"
                      {...register('preferredTime')}
                      disabled={isLoading}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">No preference</option>
                      <option value="morning">Morning (8am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 5pm)</option>
                      <option value="any">Any time</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="message">Additional Notes</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your property, special instructions, or questions..."
                    {...register('message')}
                    disabled={isLoading}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <Button
              type="submit"
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 px-8"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              We'll respond within 24 hours
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
