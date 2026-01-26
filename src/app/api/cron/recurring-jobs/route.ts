import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addWeeks, addMonths, addDays, isBefore, isAfter, startOfDay } from 'date-fns';

// This endpoint can be called by Vercel Cron or an external scheduler
// to generate upcoming recurring jobs

// Vercel Cron config (add to vercel.json):
// { "crons": [{ "path": "/api/cron/recurring-jobs", "schedule": "0 0 * * *" }] }

// Generate jobs for the next N weeks ahead
const WEEKS_AHEAD = 4;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (set CRON_SECRET in env)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const futureLimit = addWeeks(today, WEEKS_AHEAD);

    // Find all recurring parent jobs that are active
    const recurringJobs = await prisma.job.findMany({
      where: {
        isRecurring: true,
        parentJobId: null, // Only parent jobs
        status: { not: 'canceled' },
        OR: [
          { recurrenceEndDate: null }, // No end date - ongoing
          { recurrenceEndDate: { gte: today } }, // End date in future
        ],
      },
      include: {
        customer: true,
      },
    });

    let createdCount = 0;
    const results: { jobId: string; created: number }[] = [];

    for (const parentJob of recurringJobs) {
      // Find the latest scheduled job in this series
      const latestJob = await prisma.job.findFirst({
        where: {
          OR: [
            { id: parentJob.id },
            { parentJobId: parentJob.id },
          ],
        },
        orderBy: { scheduledDate: 'desc' },
      });

      if (!latestJob) continue;

      // Calculate the end date for generation
      const endDate = parentJob.recurrenceEndDate
        ? (isBefore(parentJob.recurrenceEndDate, futureLimit) ? parentJob.recurrenceEndDate : futureLimit)
        : futureLimit;

      // Generate new jobs from the latest date
      let nextDate = new Date(latestJob.scheduledDate);
      const jobsToCreate = [];

      // Keep generating until we reach the limit
      while (true) {
        // Advance to next occurrence
        switch (parentJob.recurrencePattern) {
          case 'daily':
            nextDate = addDays(nextDate, 1);
            break;
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

        // Stop if we've passed the end date
        if (isAfter(nextDate, endDate)) break;

        // Stop if we've passed the recurrence end date
        if (parentJob.recurrenceEndDate && isAfter(nextDate, parentJob.recurrenceEndDate)) break;

        // Check if a job already exists for this date
        const existingJob = await prisma.job.findFirst({
          where: {
            OR: [
              { id: parentJob.id },
              { parentJobId: parentJob.id },
            ],
            scheduledDate: {
              gte: startOfDay(nextDate),
              lt: addDays(startOfDay(nextDate), 1),
            },
          },
        });

        if (!existingJob) {
          jobsToCreate.push({
            userId: parentJob.userId,
            customerId: parentJob.customerId,
            serviceTypeId: parentJob.serviceTypeId,
            crewId: parentJob.crewId,
            title: parentJob.title,
            description: parentJob.description,
            scheduledDate: nextDate,
            scheduledTime: parentJob.scheduledTime,
            duration: parentJob.duration,
            price: parentJob.price,
            isRecurring: true,
            recurrencePattern: parentJob.recurrencePattern,
            parentJobId: parentJob.id,
            status: 'scheduled',
          });
        }

        // Safety limit - don't create more than 52 jobs at once per parent
        if (jobsToCreate.length >= 52) break;
      }

      if (jobsToCreate.length > 0) {
        await prisma.job.createMany({ data: jobsToCreate });
        createdCount += jobsToCreate.length;
        results.push({ jobId: parentJob.id, created: jobsToCreate.length });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdCount} recurring jobs`,
      details: results,
    });
  } catch (error) {
    console.error('Recurring jobs cron error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recurring jobs' },
      { status: 500 }
    );
  }
}

// POST method for manual triggering from dashboard
export async function POST(request: NextRequest) {
  return GET(request);
}
