import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const services = await sql`SELECT * FROM services ORDER BY name ASC`;
    return NextResponse.json(services);
  } catch (error) {
    console.error('Services fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, default_price, duration_minutes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO services (name, description, default_price, duration_minutes)
      VALUES (${name}, ${description || null}, ${default_price || null}, ${duration_minutes || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Service create error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
