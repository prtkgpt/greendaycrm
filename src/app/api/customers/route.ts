import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const customers = await sql`
      SELECT c.*,
        COUNT(j.id) as total_jobs,
        COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs
      FROM customers c
      LEFT JOIN jobs j ON c.id = j.customer_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Customers fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, state, zip, property_size, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO customers (name, email, phone, address, city, state, zip, property_size, notes)
      VALUES (${name}, ${email || null}, ${phone || null}, ${address || null}, ${city || null}, ${state || null}, ${zip || null}, ${property_size || null}, ${notes || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Customer create error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
