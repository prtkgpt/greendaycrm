import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const customers = await sql`SELECT * FROM customers WHERE id = ${id}`;

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const jobs = await sql`
      SELECT j.*, s.name as service_name
      FROM jobs j
      LEFT JOIN services s ON j.service_id = s.id
      WHERE j.customer_id = ${id}
      ORDER BY j.scheduled_date DESC
    `;

    const invoices = await sql`
      SELECT * FROM invoices WHERE customer_id = ${id} ORDER BY created_at DESC
    `;

    return NextResponse.json({
      ...customers[0],
      jobs,
      invoices,
    });
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, phone, address, city, state, zip, property_size, notes } = body;

    const result = await sql`
      UPDATE customers
      SET name = ${name}, email = ${email || null}, phone = ${phone || null},
          address = ${address || null}, city = ${city || null}, state = ${state || null},
          zip = ${zip || null}, property_size = ${property_size || null}, notes = ${notes || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await sql`DELETE FROM customers WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
