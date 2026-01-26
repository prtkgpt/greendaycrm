import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const services = await sql`SELECT * FROM services WHERE id = ${id}`;

    if (services.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(services[0]);
  } catch (error) {
    console.error('Service fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, default_price, duration_minutes } = body;

    const result = await sql`
      UPDATE services
      SET name = ${name}, description = ${description || null},
          default_price = ${default_price || null}, duration_minutes = ${duration_minutes || null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Service update error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await sql`DELETE FROM services WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Service delete error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
