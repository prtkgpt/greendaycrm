import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: { company: string };
}

export async function generateMetadata({ params }: { params: { company: string } }): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { slug: params.company },
    select: { companyName: true, description: true },
  });

  if (!user) {
    return { title: 'Company Not Found' };
  }

  return {
    title: user.companyName || params.company,
    description: user.description || `Professional landscaping services by ${user.companyName}`,
  };
}

export default async function CompanyLayout({ children, params }: CompanyLayoutProps) {
  const user = await prisma.user.findUnique({
    where: { slug: params.company },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
