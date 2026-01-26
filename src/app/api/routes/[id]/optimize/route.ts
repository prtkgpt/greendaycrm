import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Simple distance calculation using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Nearest neighbor algorithm for route optimization
function optimizeRoute(
  startLat: number,
  startLng: number,
  jobs: Array<{ id: string; lat: number; lng: number }>
): { order: string[]; totalDistance: number } {
  if (jobs.length === 0) {
    return { order: [], totalDistance: 0 };
  }

  const unvisited = [...jobs];
  const order: string[] = [];
  let currentLat = startLat;
  let currentLng = startLng;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLat,
        currentLng,
        unvisited[i].lat,
        unvisited[i].lng
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    totalDistance += nearestDistance;
    order.push(unvisited[nearestIndex].id);
    currentLat = unvisited[nearestIndex].lat;
    currentLng = unvisited[nearestIndex].lng;
    unvisited.splice(nearestIndex, 1);
  }

  return { order, totalDistance: Math.round(totalDistance * 10) / 10 };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get route with jobs
    const route = await prisma.route.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        jobs: {
          include: { customer: true },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Prepare jobs with coordinates
    const jobsWithCoords = route.jobs
      .filter((job) => job.customer.latitude && job.customer.longitude)
      .map((job) => ({
        id: job.id,
        lat: job.customer.latitude!,
        lng: job.customer.longitude!,
      }));

    if (jobsWithCoords.length === 0) {
      return NextResponse.json(
        { error: 'No jobs with geocoded addresses found' },
        { status: 400 }
      );
    }

    // Use route start or first job as starting point
    const startLat = route.startLat || jobsWithCoords[0].lat;
    const startLng = route.startLng || jobsWithCoords[0].lng;

    // Optimize route
    const { order, totalDistance } = optimizeRoute(startLat, startLng, jobsWithCoords);

    // Estimate duration (assuming 15 min per job + 2 min per mile)
    const estimatedMinutes = route.jobs.length * 15 + totalDistance * 2;

    // Update job order
    await Promise.all(
      order.map((jobId, index) =>
        prisma.job.update({
          where: { id: jobId },
          data: { routeOrder: index },
        })
      )
    );

    // Update route with optimization data
    const updatedRoute = await prisma.route.update({
      where: { id: params.id },
      data: {
        optimizedOrder: order,
        totalDistance,
        estimatedDuration: Math.round(estimatedMinutes),
        status: 'optimized',
      },
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

    return NextResponse.json({
      route: updatedRoute,
      optimization: {
        totalDistance,
        estimatedDuration: Math.round(estimatedMinutes),
        stopsOptimized: order.length,
      },
    });
  } catch (error) {
    console.error('Error optimizing route:', error);
    return NextResponse.json({ error: 'Failed to optimize route' }, { status: 500 });
  }
}
