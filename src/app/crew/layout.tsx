import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GreenDay Crew',
  description: 'Crew mobile app for GreenDay CRM',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
