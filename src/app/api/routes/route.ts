import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    const where: Record<string, unknown> = { userId: session.user.id };

    if (date) {
      const routeDate = new Date(date);
      routeDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(routeDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: routeDate, lt: nextDay };
    }

    const routes = await prisma.route.findMany({
      where,
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
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Create route
    const route = await prisma.route.create({
      data: {
        userId: session.user.id,
        name: data.name || `Route - ${new Date(data.date).toLocaleDateString()}`,
        date: new Date(data.date),
        crewId: data.crewId || null,
        status: 'planned',
        startAddress: data.startAddress,
        startLat: data.startLat,
        startLng: data.startLng,
      },
    });

    // If job IDs provided, link them to the route
    if (data.jobIds && data.jobIds.length > 0) {
      await Promise.all(
        data.jobIds.map((jobId: string, index: number) =>
          prisma.job.update({
            where: { id: jobId },
            data: {
              routeId: route.id,
              routeOrder: index,
            },
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

    return NextResponse.json(routeWithJobs, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}
