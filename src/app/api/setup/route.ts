import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const steps: string[] = [];

  try {
    // Test database connection
    steps.push('Testing database connection...');
    await prisma.$connect();
    steps.push('Database connected successfully!');

    // Check if tables exist by trying to count users
    steps.push('Checking database schema...');
    const userCount = await prisma.user.count();
    steps.push(`Found ${userCount} users in database`);

    // If no users, the database is empty but schema exists
    if (userCount === 0) {
      steps.push('Database is ready! No users yet - sign up to create your first account.');
    } else {
      steps.push('Database is set up and has data.');
    }

    return NextResponse.json({
      success: true,
      message: 'Database is ready!',
      steps,
    });
  } catch (error) {
    console.error('Setup error:', error);

    // Check if it's a schema error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
      steps.push('Database schema not found. Please run: npx prisma db push');
      return NextResponse.json(
        {
          success: false,
          message: 'Database schema needs to be created',
          error: 'Run "npx prisma db push" to create the database schema',
          steps,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Database setup failed',
        error: errorMessage,
        steps,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
