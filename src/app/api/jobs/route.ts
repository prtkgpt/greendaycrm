import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { addDays, addWeeks, addMonths } from 'date-fns';

const jobSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  serviceTypeId: z.string().optional(),
  crewId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduledDate: z.string(),
  scheduledTime: z.string().optional(),
  duration: z.number().optional(),
  price: z.number().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer');
    const crewId = searchParams.get('crew');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { userId: session.user.id };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (crewId) where.crewId = crewId;
    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: true,
        serviceType: true,
        crew: true,
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = jobSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, userId: session.user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        customerId: data.customerId,
        serviceTypeId: data.serviceTypeId || null,
        crewId: data.crewId || null,
        title: data.title,
        description: data.description || null,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime || null,
        duration: data.duration || null,
        price: data.price || null,
        isRecurring: data.isRecurring || false,
        recurrencePattern: data.recurrencePattern || null,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        status: 'scheduled',
      },
      include: {
        customer: true,
        serviceType: true,
        crew: true,
      },
    });

    // If recurring, create future jobs
    if (data.isRecurring && data.recurrencePattern && data.recurrenceEndDate) {
      const endDate = new Date(data.recurrenceEndDate);
      let nextDate = new Date(data.scheduledDate);
      const recurringJobs = [];

      while (nextDate < endDate) {
        // Advance to next occurrence
        switch (data.recurrencePattern) {
          case 'weekly':
            nextDate = addWeeks(nextDate, 1);
            break;
          case 'biweekly':
            nextDate = addWeeks(nextDate, 2);
            break;
          case 'monthly':
            nextDate = addMonths(nextDate, 1);
            break;
          default:
            nextDate = addWeeks(nextDate, 1);
        }

        if (nextDate <= endDate) {
          recurringJobs.push({
            userId: session.user.id,
            customerId: data.customerId,
            serviceTypeId: data.serviceTypeId || null,
            crewId: data.crewId || null,
            title: data.title,
            description: data.description || null,
            scheduledDate: nextDate,
            scheduledTime: data.scheduledTime || null,
            duration: data.duration || null,
            price: data.price || null,
            isRecurring: true,
            recurrencePattern: data.recurrencePattern,
            parentJobId: job.id,
            status: 'scheduled',
          });
        }
      }

      if (recurringJobs.length > 0) {
        await prisma.job.createMany({ data: recurringJobs });
      }
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Job create error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
