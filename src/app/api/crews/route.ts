import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const crewSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  color: z.string().optional(),
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN cannot exceed 6 digits').optional(),
  role: z.enum(['crew', 'foreman', 'manager']).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const crews = await prisma.crew.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(crews);
  } catch (error) {
    console.error('Error fetching crews:', error);
    return NextResponse.json({ error: 'Failed to fetch crews' }, { status: 500 });
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
    const result = crewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, color, pin, role } = result.data;

    // Check for duplicate PIN within this company
    if (pin) {
      const existingCrew = await prisma.crew.findFirst({
        where: { userId: session.user.id, pin },
      });
      if (existingCrew) {
        return NextResponse.json(
          { error: 'This PIN is already in use by another crew member' },
          { status: 400 }
        );
      }
    }

    const crew = await prisma.crew.create({
      data: {
        userId: session.user.id,
        name,
        email: email || null,
        phone: phone || null,
        color: color || '#3b82f6',
        pin: pin || null,
        role: role || 'crew',
        active: true,
      },
    });

    return NextResponse.json(crew, { status: 201 });
  } catch (error) {
    console.error('Error creating crew:', error);
    return NextResponse.json({ error: 'Failed to create crew' }, { status: 500 });
  }
}
