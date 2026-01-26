import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const teamLoginSchema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN cannot exceed 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = teamLoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { companyCode, pin } = result.data;

    // Find the company by slug
    const user = await prisma.user.findUnique({
      where: { slug: companyCode.toLowerCase() },
      select: {
        id: true,
        companyName: true,
        slug: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid company code' },
        { status: 401 }
      );
    }

    // Find crew member by user ID and PIN
    const crew = await prisma.crew.findFirst({
      where: {
        userId: user.id,
        pin: pin,
        active: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        email: true,
      },
    });

    if (!crew) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      crew: {
        id: crew.id,
        name: crew.name,
        role: crew.role,
        phone: crew.phone,
        email: crew.email,
      },
      userId: user.id,
      companyName: user.companyName,
      companySlug: user.slug,
    });
  } catch (error) {
    console.error('Team login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
