import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await prisma.job.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        customer: true,
        serviceType: true,
        crew: true,
        invoice: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
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
    const existing = await prisma.job.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        customerId: body.customerId,
        serviceTypeId: body.serviceTypeId || null,
        crewId: body.crewId || null,
        title: body.title,
        description: body.description || null,
        scheduledDate: new Date(body.scheduledDate),
        scheduledTime: body.scheduledTime || null,
        duration: body.duration || null,
        price: body.price || null,
        notes: body.notes || null,
      },
      include: {
        customer: true,
        serviceType: true,
        crew: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function PATCH(
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
    const existing = await prisma.job.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Status update
    if (body.status) {
      updateData.status = body.status;

      // If completing, set completedAt
      if (body.status === 'completed') {
        updateData.completedAt = new Date();
      }

      // If starting, set checkInTime
      if (body.status === 'in_progress' && !existing.checkInTime) {
        updateData.checkInTime = new Date();
        if (body.lat && body.lng) {
          updateData.checkInLat = body.lat;
          updateData.checkInLng = body.lng;
        }
      }

      // If completing from in_progress, set checkOutTime
      if (body.status === 'completed' && existing.status === 'in_progress') {
        updateData.checkOutTime = new Date();
      }
    }

    // Other partial updates
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.beforePhotos) updateData.beforePhotos = body.beforePhotos;
    if (body.afterPhotos) updateData.afterPhotos = body.afterPhotos;
    if (body.scheduledDate) updateData.scheduledDate = new Date(body.scheduledDate);
    if (body.crewId !== undefined) updateData.crewId = body.crewId || null;

    const job = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        serviceType: true,
        crew: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Job patch error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
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
    const existing = await prisma.job.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await prisma.job.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Job delete error:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
