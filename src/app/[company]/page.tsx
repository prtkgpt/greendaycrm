import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Leaf, MapPin, Phone, Mail, Globe, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CompanyPageProps {
  params: { company: string };
}

export default async function CompanyPublicPage({ params }: CompanyPageProps) {
  const user = await prisma.user.findUnique({
    where: { slug: params.company },
    select: {
      id: true,
      companyName: true,
      description: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      website: true,
      logo: true,
      serviceTypes: {
        where: { isPublic: true },
        select: {
          id: true,
          name: true,
          description: true,
          defaultPrice: true,
          duration: true,
          color: true,
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const fullAddress = [user.address, user.city, user.state, user.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.logo ? (
              <img src={user.logo} alt={user.companyName || ''} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="font-semibold text-lg">{user.companyName}</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/${params.company}/customer-login`}>
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href={`/${params.company}/book`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Book Service</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Professional Landscaping Services
          </h1>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            {user.description || `Quality lawn care and landscaping by ${user.companyName}. Request a quote today!`}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={`/${params.company}/book`}>
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
                <Calendar className="w-5 h-5 mr-2" />
                Request a Quote
              </Button>
            </Link>
            {user.phone && (
              <a href={`tel:${user.phone}`}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Us
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      {user.serviceTypes.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              We offer a wide range of professional landscaping services to keep your property looking its best.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.serviceTypes.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: service.color || '#22c55e' }}
                    >
                      <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.description && (
                      <CardDescription>{service.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {service.defaultPrice && (
                        <span className="text-2xl font-bold text-emerald-600">
                          ${service.defaultPrice}
                        </span>
                      )}
                      {service.duration && (
                        <span className="text-sm text-gray-500">
                          ~{service.duration} min
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href={`/${params.company}/book`}>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Get a Free Quote
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {user.phone && (
              <a href={`tel:${user.phone}`} className="flex flex-col items-center text-center group">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-1">Phone</h3>
                <p className="text-gray-600">{user.phone}</p>
              </a>
            )}
            {user.email && (
              <a href={`mailto:${user.email}`} className="flex flex-col items-center text-center group">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-gray-600">{user.email}</p>
              </a>
            )}
            {fullAddress && (
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-1">Location</h3>
                <p className="text-gray-600">{fullAddress}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Customer Portal CTA */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold mb-2">Existing Customer?</h3>
          <p className="text-gray-600 mb-4">Sign in to your portal to view invoices, schedule services, and more.</p>
          <Link href={`/${params.company}/customer-login`}>
            <Button variant="outline">
              Customer Portal
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold">{user.companyName}</span>
            </div>
            <p className="text-gray-400 text-sm">
              Powered by <a href="/" className="text-emerald-400 hover:text-emerald-300">GreenDay</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
