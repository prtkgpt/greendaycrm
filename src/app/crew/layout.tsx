import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'GreenDay Crew',
  description: 'Crew mobile app for GreenDay CRM',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
