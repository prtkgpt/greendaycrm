import Link from 'next/link';
import { Leaf, ArrowRight, Calendar, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - Landscaping Business Tips & Guides',
  description: 'Expert tips, guides, and strategies for growing your landscaping business. Learn about pricing, marketing, operations, and more.',
  openGraph: {
    title: 'GreenDay CRM Blog - Landscaping Business Tips',
    description: 'Expert tips and strategies for growing your landscaping business.',
  },
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  });

  const categories = Array.from(new Set(posts.map((p) => p.category)));
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">GreenDay</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="/#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/blog" className="text-emerald-600 font-medium">
                Blog
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/owner-login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/owner-signup">
                <Button size="sm">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-28 pb-12 px-4 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            The GreenDay Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tips, guides, and strategies to help you grow your landscaping business.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="px-4 py-6 border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-500">Topics:</span>
            {categories.map((category) => (
              <Badge key={category} variant="secondary" className="cursor-pointer hover:bg-gray-200">
                {category}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Featured Post */}
      {featuredPost && (
        <section className="px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <Link href={`/blog/${featuredPost.slug}`}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2">
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 md:p-12 flex items-center">
                      <div>
                        <Badge className="bg-white/20 text-white border-0 mb-4">
                          {featuredPost.category}
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                          {featuredPost.title}
                        </h2>
                        <p className="text-emerald-50 mb-6">
                          {featuredPost.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-emerald-100 text-sm">
                          {featuredPost.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {featuredPost.readTime} min read
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-8 md:p-12 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Leaf className="w-24 h-24 text-emerald-200 mx-auto mb-4" />
                        <span className="text-emerald-600 font-medium inline-flex items-center gap-2">
                          Read Article
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {remainingPosts.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">All Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {remainingPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{post.category}</Badge>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime} min
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                          <span className="text-sm text-emerald-600 font-medium inline-flex items-center gap-1">
                            Read more
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : !featuredPost ? (
            <div className="text-center py-16">
              <Leaf className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-500">We&apos;re working on great content for you. Check back soon!</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Grow Your Landscaping Business?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Join hundreds of landscapers using GreenDay to schedule jobs, manage customers, and get paid faster.
          </p>
          <Link href="/owner-signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">GreenDay CRM</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/blog" className="hover:text-white">Blog</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <a href="mailto:support@greendaycrm.com" className="hover:text-white">Contact</a>
            </div>
            <p className="text-sm">&copy; 2025 GreenDay CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
