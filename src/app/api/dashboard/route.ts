import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      customersResult,
      jobsTodayResult,
      jobsWeekResult,
      pendingJobsResult,
      completedMonthResult,
      revenueResult,
      pendingInvoicesResult,
      upcomingJobs,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM customers`,
      sql`SELECT COUNT(*) as count FROM jobs WHERE scheduled_date = ${today}`,
      sql`SELECT COUNT(*) as count FROM jobs WHERE scheduled_date >= ${weekAgo}`,
      sql`SELECT COUNT(*) as count FROM jobs WHERE status = 'scheduled'`,
      sql`SELECT COUNT(*) as count FROM jobs WHERE status = 'completed' AND completed_date >= ${monthAgo}`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid' AND paid_date >= ${monthAgo}`,
      sql`SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM invoices WHERE status = 'pending'`,
      sql`
        SELECT j.*, c.name as customer_name, c.address as customer_address, c.phone as customer_phone, s.name as service_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN services s ON j.service_id = s.id
        WHERE j.scheduled_date >= ${today} AND j.status = 'scheduled'
        ORDER BY j.scheduled_date ASC, j.scheduled_time ASC
        LIMIT 5
      `,
    ]);

    return NextResponse.json({
      stats: {
        totalCustomers: Number(customersResult[0].count),
        jobsToday: Number(jobsTodayResult[0].count),
        jobsThisWeek: Number(jobsWeekResult[0].count),
        pendingJobs: Number(pendingJobsResult[0].count),
        completedThisMonth: Number(completedMonthResult[0].count),
        revenueThisMonth: Number(revenueResult[0].total),
        pendingInvoicesTotal: Number(pendingInvoicesResult[0].total),
        pendingInvoicesCount: Number(pendingInvoicesResult[0].count),
      },
      upcomingJobs,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
