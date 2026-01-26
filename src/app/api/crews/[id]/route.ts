import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const crew = await prisma.crew.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!crew) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    return NextResponse.json(crew);
  } catch (error) {
    console.error('Error fetching crew:', error);
    return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Verify ownership
    const existing = await prisma.crew.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    const crew = await prisma.crew.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        color: data.color,
        active: data.active,
      },
    });

    return NextResponse.json(crew);
  } catch (error) {
    console.error('Error updating crew:', error);
    return NextResponse.json({ error: 'Failed to update crew' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.crew.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    await prisma.crew.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting crew:', error);
    return NextResponse.json({ error: 'Failed to delete crew' }, { status: 500 });
  }
}
