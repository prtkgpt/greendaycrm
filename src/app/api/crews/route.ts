import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const data = await req.json();

    const crew = await prisma.crew.create({
      data: {
        userId: session.user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role || 'crew',
        color: data.color || '#3b82f6',
        isActive: true,
      },
    });

    return NextResponse.json(crew, { status: 201 });
  } catch (error) {
    console.error('Error creating crew:', error);
    return NextResponse.json({ error: 'Failed to create crew' }, { status: 500 });
  }
}
