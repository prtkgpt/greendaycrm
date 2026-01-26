import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().min(2, 'Company name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, companyName } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        companyName,
        subscriptionStatus: 'trial',
        subscriptionTier: 'starter',
        trialEndsAt,
      },
    });

    // Create default service types for the user
    await prisma.serviceType.createMany({
      data: [
        { userId: user.id, name: 'Mowing', defaultPrice: 45, duration: 60, color: '#22c55e' },
        { userId: user.id, name: 'Edging', defaultPrice: 25, duration: 30, color: '#16a34a' },
        { userId: user.id, name: 'Fertilizing', defaultPrice: 55, duration: 45, color: '#84cc16' },
        { userId: user.id, name: 'Aeration', defaultPrice: 95, duration: 90, color: '#14b8a6' },
        { userId: user.id, name: 'Leaf Cleanup', defaultPrice: 85, duration: 120, color: '#f97316' },
        { userId: user.id, name: 'Pruning', defaultPrice: 65, duration: 60, color: '#06b6d4' },
        { userId: user.id, name: 'Mulching', defaultPrice: 120, duration: 120, color: '#8b5cf6' },
        { userId: user.id, name: 'Spring Cleanup', defaultPrice: 150, duration: 180, color: '#ec4899' },
        { userId: user.id, name: 'Fall Cleanup', defaultPrice: 175, duration: 240, color: '#eab308' },
      ],
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
