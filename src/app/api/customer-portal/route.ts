import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const companySlug = searchParams.get('companySlug');

    if (!customerId || !companySlug) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the company exists
    const user = await prisma.user.findUnique({
      where: { slug: companySlug },
      select: {
        id: true,
        companyName: true,
        phone: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get customer with their jobs and invoices
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: user.id,
        portalEnabled: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zip: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found or portal access disabled' },
        { status: 404 }
      );
    }

    // Get upcoming jobs
    const upcomingJobs = await prisma.job.findMany({
      where: {
        customerId: customer.id,
        scheduledDate: {
          gte: new Date(),
        },
        status: {
          in: ['scheduled', 'in_progress'],
        },
      },
      select: {
        id: true,
        title: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        serviceType: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 10,
    });

    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        customerId: customer.id,
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        dueDate: true,
        stripePaymentUrl: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      customer,
      upcomingJobs,
      recentInvoices,
      companyName: user.companyName,
      companyPhone: user.phone,
      companyEmail: user.email,
    });
  } catch (error) {
    console.error('Customer portal error:', error);
    return NextResponse.json(
      { error: 'Failed to load portal data' },
      { status: 500 }
    );
  }
}
