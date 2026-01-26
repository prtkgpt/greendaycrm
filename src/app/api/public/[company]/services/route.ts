import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { company: string } }
) {
  try {
    const { company } = params;

    // Find the company
    const user = await prisma.user.findUnique({
      where: { slug: company },
      select: {
        id: true,
        companyName: true,
        serviceTypes: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            description: true,
            defaultPrice: true,
            duration: true,
            color: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      companyName: user.companyName,
      services: user.serviceTypes,
    });
  } catch (error) {
    console.error('Public services error:', error);
    return NextResponse.json(
      { error: 'Failed to load services' },
      { status: 500 }
    );
  }
}
