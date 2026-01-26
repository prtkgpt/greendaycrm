import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for profile updates
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
});

// Schema for business updates
const businessSchema = z.object({
  companyName: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        slug: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        website: true,
        description: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    let updateData: Record<string, unknown> = {};

    if (type === 'profile') {
      const result = profileSchema.safeParse(data);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0].message },
          { status: 400 }
        );
      }
      updateData = result.data;
    } else if (type === 'business') {
      const result = businessSchema.safeParse(data);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0].message },
          { status: 400 }
        );
      }
      updateData = result.data;

      // Generate slug from company name if provided
      if (result.data.companyName) {
        const slug = result.data.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Check if slug is unique (excluding current user)
        const existingUser = await prisma.user.findFirst({
          where: {
            slug,
            NOT: { id: session.user.id },
          },
        });

        if (!existingUser) {
          updateData.slug = slug;
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        slug: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        website: true,
        description: true,
        subscriptionStatus: true,
        subscriptionTier: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
