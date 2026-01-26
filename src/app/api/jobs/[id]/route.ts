import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const jobs = await sql`
      SELECT j.*, c.name as customer_name, c.address as customer_address,
             c.phone as customer_phone, c.email as customer_email, s.name as service_name
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN services s ON j.service_id = s.id
      WHERE j.id = ${id}
    `;

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(jobs[0]);
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { customer_id, service_id, title, description, status, scheduled_date, scheduled_time, completed_date, price, notes } = body;

    const result = await sql`
      UPDATE jobs
      SET customer_id = ${customer_id}, service_id = ${service_id || null}, title = ${title},
          description = ${description || null}, status = ${status}, scheduled_date = ${scheduled_date || null},
          scheduled_time = ${scheduled_time || null}, completed_date = ${completed_date || null},
          price = ${price || null}, notes = ${notes || null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    const completedDate = status === 'completed' ? new Date().toISOString().split('T')[0] : null;

    const result = await sql`
      UPDATE jobs
      SET status = ${status}, completed_date = ${completedDate}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Job status update error:', error);
    return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await sql`DELETE FROM jobs WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Job delete error:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
