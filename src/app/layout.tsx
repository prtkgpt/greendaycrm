import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'GreenDay CRM - Landscaping Business Management',
    template: '%s | GreenDay CRM',
  },
  description: 'Simple CRM for landscapers & lawn care businesses. Schedule jobs, manage customers, optimize routes, and get paid.',
  keywords: ['landscaping', 'CRM', 'lawn care', 'scheduling', 'invoicing', 'route optimization'],
  authors: [{ name: 'GreenDay CRM' }],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
