import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Require admin role for all operations
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return null;
  }
  return session;
}

function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const createAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  phone: z.string().optional(),
  subscriptionTier: z.enum(['starter', 'growth', 'pro']).optional(),
  subscriptionStatus: z.enum(['trial', 'active', 'canceled', 'past_due']).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

// GET /api/admin/accounts - List all tenant accounts
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.subscriptionStatus = status;
    }

    const accounts = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        slug: true,
        phone: true,
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
        createdAt: true,
        _count: {
          select: {
            customers: true,
            jobs: true,
            invoices: true,
            crews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Admin accounts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST /api/admin/accounts - Create a new tenant account
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for existing email
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(data.password, 12);
    const baseSlug = generateSlug(data.companyName);
    const slug = await getUniqueSlug(baseSlug);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const account = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        companyName: data.companyName,
        slug,
        phone: data.phone || null,
        role: data.role || 'user',
        subscriptionStatus: data.subscriptionStatus || 'trial',
        subscriptionTier: data.subscriptionTier || 'starter',
        trialEndsAt,
      },
    });

    // Create default service types
    await prisma.serviceType.createMany({
      data: [
        { userId: account.id, name: 'Mowing', defaultPrice: 45, duration: 60, color: '#22c55e' },
        { userId: account.id, name: 'Edging', defaultPrice: 25, duration: 30, color: '#16a34a' },
        { userId: account.id, name: 'Fertilizing', defaultPrice: 55, duration: 45, color: '#84cc16' },
        { userId: account.id, name: 'Aeration', defaultPrice: 95, duration: 90, color: '#14b8a6' },
        { userId: account.id, name: 'Leaf Cleanup', defaultPrice: 85, duration: 120, color: '#f97316' },
        { userId: account.id, name: 'Pruning', defaultPrice: 65, duration: 60, color: '#06b6d4' },
        { userId: account.id, name: 'Mulching', defaultPrice: 120, duration: 120, color: '#8b5cf6' },
        { userId: account.id, name: 'Spring Cleanup', defaultPrice: 150, duration: 180, color: '#ec4899' },
        { userId: account.id, name: 'Fall Cleanup', defaultPrice: 175, duration: 240, color: '#eab308' },
      ],
    });

    return NextResponse.json(
      {
        id: account.id,
        email: account.email,
        name: account.name,
        companyName: account.companyName,
        slug: account.slug,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin account create error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
