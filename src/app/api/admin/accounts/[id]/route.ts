import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return null;
  }
  return session;
}

const updateAccountSchema = z.object({
  name: z.string().min(2).optional(),
  companyName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['user', 'admin']).optional(),
  subscriptionStatus: z.enum(['trial', 'active', 'canceled', 'past_due']).optional(),
  subscriptionTier: z.enum(['starter', 'growth', 'pro']).optional(),
});

// GET /api/admin/accounts/[id] - Get account details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const account = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        slug: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        website: true,
        description: true,
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            jobs: true,
            invoices: true,
            crews: true,
            serviceTypes: true,
            routes: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Admin account fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
}

// PUT /api/admin/accounts/[id] - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = updateAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const data = result.data;
    const updateData: Record<string, unknown> = {};

    if (data.name) updateData.name = data.name;
    if (data.companyName) updateData.companyName = data.companyName;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.role) updateData.role = data.role;
    if (data.subscriptionStatus) updateData.subscriptionStatus = data.subscriptionStatus;
    if (data.subscriptionTier) updateData.subscriptionTier = data.subscriptionTier;

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: 'This email is already in use' },
          { status: 400 }
        );
      }
      updateData.email = data.email.toLowerCase();
    }

    if (data.password) {
      updateData.password = await hash(data.password, 12);
    }

    const account = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Admin account update error:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

// DELETE /api/admin/accounts/[id] - Delete account and all data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Prevent self-deletion
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Cascading delete handles all related data
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin account delete error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
