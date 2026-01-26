import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  defaultPrice: z.union([z.number(), z.string()]).optional(),
  duration: z.union([z.number(), z.string()]).optional(),
  estimatedDuration: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services = await prisma.serviceType.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const result = serviceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, defaultPrice, duration, estimatedDuration, color, isPublic } = result.data;

    const service = await prisma.serviceType.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        defaultPrice: defaultPrice ? parseFloat(String(defaultPrice)) : null,
        duration: duration ? parseInt(String(duration)) : null,
        estimatedDuration: estimatedDuration ? parseInt(String(estimatedDuration)) : null,
        color: color || '#10b981',
        isPublic: isPublic ?? true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
