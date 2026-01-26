import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.customer.email) {
      return NextResponse.json(
        { error: 'Customer does not have an email address' },
        { status: 400 }
      );
    }

    // Update invoice status to sent
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
        sentDate: invoice.sentDate || new Date(),
      },
      include: {
        customer: true,
        job: true,
      },
    });

    // In production, you would integrate with an email service like Resend here
    // For now, we'll just mark it as sent

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${invoice.customer.email}`,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
