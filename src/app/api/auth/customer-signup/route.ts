import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const signupSchema = z.object({
  companySlug: z.string().min(1, 'Company slug is required'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

    const { companySlug, name, email, phone, address, city, state, zip, password } = result.data;

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

    // Check if customer already exists with this email for this company
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        userId: user.id,
        email: email.toLowerCase(),
      },
    });

    if (existingCustomer) {
      // If customer exists but doesn't have portal access, enable it
      if (!existingCustomer.portalEnabled) {
        const hashedPassword = await hash(password, 12);
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            portalPassword: hashedPassword,
            portalEnabled: true,
          },
        });

        return NextResponse.json({
          message: 'Portal access enabled for existing customer',
          customer: { id: existingCustomer.id, name: existingCustomer.name },
        });
      }

      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create new customer with portal access
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name,
        email: email.toLowerCase(),
        phone,
        address,
        city,
        state,
        zip,
        portalPassword: hashedPassword,
        portalEnabled: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Customer signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
