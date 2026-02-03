import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { blogPosts } from '@/data/blog-posts';

// POST /api/blog/seed - Seed blog posts from static data
export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    for (const post of blogPosts) {
      const existing = await prisma.blogPost.findUnique({
        where: { slug: post.slug },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const words = post.content.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(words / 200));

      await prisma.blogPost.create({
        data: {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author,
          category: post.category,
          tags: post.tags,
          readTime: post.readTime || readTime,
          published: true,
          publishedAt: new Date(post.publishedAt),
        },
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: blogPosts.length,
    });
  } catch (error) {
    console.error('Blog seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed blog posts' },
      { status: 500 }
    );
  }
}
