import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        customer: true,
        job: true,
        user: {
          select: {
            name: true,
            email: true,
            companyName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            website: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Verify ownership
    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate totals
    const lineItems = data.lineItems || existing.lineItems || [];

    // Safely calculate subtotal from line items
    let subtotal = 0;
    if (Array.isArray(lineItems)) {
      for (const item of lineItems) {
        if (item && typeof item === 'object' && 'quantity' in item && 'unitPrice' in item) {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unitPrice) || 0;
          subtotal += quantity * unitPrice;
        }
      }
    }
    const taxRate = data.taxRate ?? existing.taxRate ?? 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        customerId: data.customerId,
        jobId: data.jobId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        lineItems,
        subtotal,
        taxRate,
        tax,
        total,
        notes: data.notes,
      },
      include: {
        customer: true,
        job: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Verify ownership
    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Handle status changes
    if (data.status) {
      updateData.status = data.status;

      if (data.status === 'sent' && !existing.sentDate) {
        updateData.sentDate = new Date();
      }

      if (data.status === 'paid' && !existing.paidDate) {
        updateData.paidDate = new Date();
        updateData.paidAmount = existing.total;
      }
    }

    // Handle payment recording
    if (data.paidAmount !== undefined) {
      updateData.paidAmount = data.paidAmount;
      updateData.paymentMethod = data.paymentMethod;
      if (data.paidAmount >= existing.total) {
        updateData.status = 'paid';
        updateData.paidDate = new Date();
      } else if (data.paidAmount > 0) {
        updateData.status = 'partial';
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        job: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only allow deletion of draft invoices
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft invoices' },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
