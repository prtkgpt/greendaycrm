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

    const route = await prisma.route.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        crew: true,
        jobs: {
          include: {
            customer: true,
            serviceType: true,
          },
          orderBy: { routeOrder: 'asc' },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
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
    const existing = await prisma.route.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Update route
    const route = await prisma.route.update({
      where: { id: params.id },
      data: {
        name: data.name,
        crewId: data.crewId,
        status: data.status,
        startAddress: data.startAddress,
        startLat: data.startLat,
        startLng: data.startLng,
        optimizedOrder: data.optimizedOrder,
        totalDistance: data.totalDistance,
        estimatedDuration: data.estimatedDuration,
      },
    });

    // Update job order if provided
    if (data.jobOrder && Array.isArray(data.jobOrder)) {
      await Promise.all(
        data.jobOrder.map((jobId: string, index: number) =>
          prisma.job.update({
            where: { id: jobId },
            data: { routeOrder: index },
          })
        )
      );
    }

    const routeWithJobs = await prisma.route.findUnique({
      where: { id: route.id },
      include: {
        crew: true,
        jobs: {
          include: {
            customer: true,
            serviceType: true,
          },
          orderBy: { routeOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(routeWithJobs);
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
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
    const existing = await prisma.route.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Unlink jobs from route
    await prisma.job.updateMany({
      where: { routeId: params.id },
      data: { routeId: null, routeOrder: null },
    });

    // Delete route
    await prisma.route.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}
