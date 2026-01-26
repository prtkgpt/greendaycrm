import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const loginSchema = z.object({
  companySlug: z.string().min(1, 'Company slug is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { companySlug, email, password } = result.data;

    // Find the company
    const user = await prisma.user.findUnique({
      where: { slug: companySlug },
      select: { id: true, companyName: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Find customer by email within this company
    const customer = await prisma.customer.findFirst({
      where: {
        userId: user.id,
        email: email.toLowerCase(),
        portalEnabled: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        portalPassword: true,
      },
    });

    if (!customer || !customer.portalPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await compare(password, customer.portalPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastPortalLogin: new Date() },
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      companyName: user.companyName,
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
