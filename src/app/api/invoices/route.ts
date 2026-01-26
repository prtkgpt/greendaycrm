import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let invoices;

    if (status) {
      invoices = await sql`
        SELECT i.*, c.name as customer_name, c.email as customer_email, j.title as job_title
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN jobs j ON i.job_id = j.id
        WHERE i.status = ${status}
        ORDER BY i.created_at DESC
      `;
    } else {
      invoices = await sql`
        SELECT i.*, c.name as customer_name, c.email as customer_email, j.title as job_title
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN jobs j ON i.job_id = j.id
        ORDER BY i.created_at DESC
      `;
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, job_id, amount, status, due_date, notes } = body;

    if (!customer_id || !amount) {
      return NextResponse.json({ error: 'Customer and amount are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO invoices (customer_id, job_id, amount, status, due_date, notes)
      VALUES (${customer_id}, ${job_id || null}, ${amount}, ${status || 'pending'}, ${due_date || null}, ${notes || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Invoice create error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
