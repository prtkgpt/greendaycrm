import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { geocodeAddress } from '@/lib/utils';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  propertySize: z.string().optional(),
  gateCode: z.string().optional(),
  specialInstructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = { userId: session.user.id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { jobs: true, invoices: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customers fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = customerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Geocode address
    const fullAddress = `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
    const coords = await geocodeAddress(fullAddress);

    const customer = await prisma.customer.create({
      data: {
        userId: session.user.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        lat: coords?.lat || null,
        lng: coords?.lng || null,
        propertySize: data.propertySize || null,
        gateCode: data.gateCode || null,
        specialInstructions: data.specialInstructions || null,
        tags: data.tags || [],
        status: data.status || 'active',
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Customer create error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
