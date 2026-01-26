import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');

    let jobs;

    if (status && customerId) {
      jobs = await sql`
        SELECT j.*, c.name as customer_name, c.address as customer_address, c.phone as customer_phone, s.name as service_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN services s ON j.service_id = s.id
        WHERE j.status = ${status} AND j.customer_id = ${customerId}
        ORDER BY j.scheduled_date DESC, j.scheduled_time DESC
      `;
    } else if (status) {
      jobs = await sql`
        SELECT j.*, c.name as customer_name, c.address as customer_address, c.phone as customer_phone, s.name as service_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN services s ON j.service_id = s.id
        WHERE j.status = ${status}
        ORDER BY j.scheduled_date DESC, j.scheduled_time DESC
      `;
    } else if (customerId) {
      jobs = await sql`
        SELECT j.*, c.name as customer_name, c.address as customer_address, c.phone as customer_phone, s.name as service_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN services s ON j.service_id = s.id
        WHERE j.customer_id = ${customerId}
        ORDER BY j.scheduled_date DESC, j.scheduled_time DESC
      `;
    } else {
      jobs = await sql`
        SELECT j.*, c.name as customer_name, c.address as customer_address, c.phone as customer_phone, s.name as service_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN services s ON j.service_id = s.id
        ORDER BY j.scheduled_date DESC, j.scheduled_time DESC
      `;
    }

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, service_id, title, description, status, scheduled_date, scheduled_time, price, notes } = body;

    if (!customer_id || !title) {
      return NextResponse.json({ error: 'Customer and title are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO jobs (customer_id, service_id, title, description, status, scheduled_date, scheduled_time, price, notes)
      VALUES (${customer_id}, ${service_id || null}, ${title}, ${description || null}, ${status || 'scheduled'}, ${scheduled_date || null}, ${scheduled_time || null}, ${price || null}, ${notes || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Job create error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
