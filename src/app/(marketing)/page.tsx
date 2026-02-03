import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Leaf,
  Calendar,
  Route,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Keep all customer info, property details, and service history in one place.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Drag-and-drop calendar with recurring job support and crew assignments.',
  },
  {
    icon: Route,
    title: 'Route Optimization',
    description: 'Save time and gas with optimized daily routes for your crews.',
  },
  {
    icon: DollarSign,
    title: 'Easy Invoicing',
    description: 'Create invoices in seconds, accept online payments, track what\'s owed.',
  },
  {
    icon: Clock,
    title: 'Crew Mobile App',
    description: 'Your team can check in, upload photos, and complete jobs from their phones.',
  },
  {
    icon: CheckCircle,
    title: 'Weather Alerts',
    description: 'Automatic notifications when rain threatens scheduled jobs.',
  },
];

const testimonials = [
  {
    quote: "GreenDay cut our scheduling time in half. We're more organized than ever.",
    author: 'Mike Rodriguez',
    company: 'Rodriguez Lawn Care',
    rating: 5,
  },
  {
    quote: 'The route optimization alone saves us 2 hours a day. Game changer.',
    author: 'Sarah Chen',
    company: 'GreenThumb Pro',
    rating: 5,
  },
  {
    quote: 'Finally, software made for landscapers, not enterprise companies.',
    author: 'James Wilson',
    company: 'Wilson & Sons Landscaping',
    rating: 5,
  },
];

const pricing = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for solo operators',
    features: ['1 user', '50 customers', 'Scheduling & invoicing', 'Mobile app access', 'Email support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Growth',
    price: 49,
    description: 'For growing teams',
    features: [
      '5 users',
      'Unlimited customers',
      'Route optimization',
      'Recurring billing',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Pro',
    price: 79,
    description: 'For established businesses',
    features: [
      'Unlimited users',
      'All Growth features',
      'Custom reports',
      'API access',
      'Phone support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">GreenDay</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900">
                Testimonials
              </Link>
              <Link href="/blog" className="text-gray-600 hover:text-gray-900">
                Blog
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/team-login">
                <Button variant="ghost" size="sm">Team Login</Button>
              </Link>
              <Link href="/owner-login">
                <Button variant="outline">Owner Sign In</Button>
              </Link>
              <Link href="/owner-signup">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Rated #1 for Small Landscaping Businesses
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Run Your Landscaping
            <br />
            <span className="text-emerald-600">Business Like a Pro</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Schedule jobs, manage customers, optimize routes, and get paid faster.
            Built specifically for landscapers and lawn care professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/owner-signup">
              <Button size="lg" className="text-lg px-8">
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required</p>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
                    <div className="h-6 bg-gray-300 rounded w-16" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm h-48">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <div className="h-3 bg-gray-100 rounded flex-1" />
                        <div className="h-3 bg-gray-200 rounded w-16" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm h-48">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-5 rounded ${
                          Math.random() > 0.7 ? 'bg-emerald-200' : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From scheduling to invoicing, GreenDay has all the tools you need in one simple platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free for 14 days. No credit card required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-emerald-500 border-2 shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 mt-1">{plan.description}</p>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/owner-signup">
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Landscapers
            </h2>
            <p className="text-xl text-gray-600">
              Join hundreds of landscaping businesses already using GreenDay.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <Card key={t.author} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-gray-900">{t.author}</p>
                    <p className="text-sm text-gray-500">{t.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Link href="/owner-signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">GreenDay CRM</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/blog" className="hover:text-white">Blog</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/help" className="hover:text-white">Help Center</Link>
              <a href="mailto:support@greendaycrm.com" className="hover:text-white">Contact</a>
            </div>
            <p className="text-sm">&copy; 2025 GreenDay CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
