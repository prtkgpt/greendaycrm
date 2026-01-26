import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { geocodeAddress } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        jobs: {
          include: { serviceType: true },
          orderBy: { scheduledDate: 'desc' },
          take: 20,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        photos: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check ownership
    const existing = await prisma.customer.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Geocode if address changed
    let coords = { lat: existing.lat, lng: existing.lng };
    const addressChanged =
      body.address !== existing.address ||
      body.city !== existing.city ||
      body.state !== existing.state ||
      body.zip !== existing.zip;

    if (addressChanged && body.address && body.city && body.state && body.zip) {
      const fullAddress = `${body.address}, ${body.city}, ${body.state} ${body.zip}`;
      const newCoords = await geocodeAddress(fullAddress);
      if (newCoords) {
        coords = newCoords;
      }
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        lat: coords.lat,
        lng: coords.lng,
        propertySize: body.propertySize || null,
        gateCode: body.gateCode || null,
        specialInstructions: body.specialInstructions || null,
        tags: body.tags || [],
        status: body.status || 'active',
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existing = await prisma.customer.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
