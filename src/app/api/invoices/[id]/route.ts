import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const invoices = await sql`
      SELECT i.*, c.name as customer_name, c.email as customer_email, j.title as job_title
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN jobs j ON i.job_id = j.id
      WHERE i.id = ${id}
    `;

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoices[0]);
  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Mark as paid
    if (body.status === 'paid') {
      const result = await sql`
        UPDATE invoices
        SET status = 'paid', paid_date = ${new Date().toISOString().split('T')[0]}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      return NextResponse.json(result[0]);
    }

    // General status update
    const { status } = body;
    const result = await sql`
      UPDATE invoices
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invoice delete error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
