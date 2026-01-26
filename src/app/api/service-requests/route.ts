import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const serviceRequestSchema = z.object({
  companySlug: z.string().min(1, 'Company slug is required'),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = serviceRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      companySlug,
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      serviceTypeId,
      preferredDate,
      preferredTime,
      message,
    } = result.data;

    // Find the company
    const user = await prisma.user.findUnique({
      where: { slug: companySlug },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        userId: user.id,
        email: email.toLowerCase(),
      },
      select: { id: true },
    });

    // Get service type name if provided
    let serviceTypeName: string | undefined;
    if (serviceTypeId) {
      const serviceType = await prisma.serviceType.findUnique({
        where: { id: serviceTypeId },
        select: { name: true },
      });
      serviceTypeName = serviceType?.name;
    }

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId: user.id,
        customerId: existingCustomer?.id,
        name,
        email: email.toLowerCase(),
        phone,
        address,
        city,
        state,
        zip,
        serviceTypeId,
        serviceType: serviceTypeName,
        preferredDate: preferredDate ? new Date(preferredDate) : undefined,
        preferredTime,
        message,
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        message: 'Service request submitted successfully',
        requestId: serviceRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Service request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    );
  }
}
