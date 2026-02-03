import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Leaf, ArrowLeft, ArrowRight, Calendar, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBlogPost, getRecentPosts, blogPosts } from '@/data/blog-posts';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost(params.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

// Simple markdown-like renderer for blog content
function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inList = false;
  let inTable = false;
  let tableRows: string[][] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      const isCheckList = listItems.some((item) => item.startsWith('[ ]') || item.startsWith('[x]'));
      elements.push(
        <ul key={`list-${elements.length}`} className={`mb-6 space-y-2 ${isCheckList ? '' : 'list-disc'} pl-6`}>
          {listItems.map((item, i) => {
            const isChecked = item.startsWith('[x]');
            const isUnchecked = item.startsWith('[ ]');
            const text = isChecked || isUnchecked ? item.slice(3).trim() : item;
            return (
              <li key={i} className="text-gray-700 leading-relaxed">
                {(isChecked || isUnchecked) && (
                  <input type="checkbox" checked={isChecked} readOnly className="mr-2 rounded" />
                )}
                {renderInline(text)}
              </li>
            );
          })}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const rows = tableRows.slice(2); // Skip header divider row
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {headers.map((h, i) => (
                  <th key={i} className="text-left py-2 px-4 font-semibold text-gray-700">{h.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2 px-4 text-gray-600">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      inTable = true;
      const cells = line.split('|').filter((c) => c.trim() !== '');
      if (!cells.every((c) => /^[-\s]+$/.test(c))) {
        tableRows.push(cells);
      } else {
        tableRows.push(cells); // Keep divider for row count
      }
      continue;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={i} className="text-lg font-semibold text-gray-900 mt-8 mb-3">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-xl font-bold text-gray-900 mt-10 mb-4">
          {renderInline(line.slice(3))}
        </h3>
      );
    }
    // List items
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      listItems.push(line.trim().slice(2));
      inList = true;
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s/, '');
      listItems.push(text);
      inList = true;
    }
    // Empty line
    else if (line.trim() === '') {
      if (inList) {
        flushList();
        inList = false;
      }
    }
    // Bold paragraph (e.g., **For your business:**)
    else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
      flushList();
      elements.push(
        <p key={i} className="font-semibold text-gray-900 mt-4 mb-2">
          {line.trim().slice(2, -2)}
        </p>
      );
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p key={i} className="text-gray-700 leading-relaxed mb-4">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();
  flushTable();

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Simple bold/italic inline rendering
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const recentPosts = getRecentPosts(4).filter((p) => p.slug !== post.slug).slice(0, 3);

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

      {/* Article */}
      <article className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="text-sm text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>

          {/* Post Header */}
          <header className="mb-10">
            <Badge variant="secondary" className="mb-4">{post.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">{post.excerpt}</p>
            <div className="flex items-center gap-6 text-sm text-gray-500 pb-6 border-b border-gray-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime} min read
              </span>
              <span>{post.author}</span>
            </div>
          </header>

          {/* Post Content */}
          <div className="prose-custom">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-400" />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* CTA Banner */}
      <section className="py-12 px-4 bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Manage Your Landscaping Business Smarter
          </h2>
          <p className="text-gray-600 mb-6">
            GreenDay CRM helps you schedule jobs, manage customers, optimize routes, and get paid faster.
          </p>
          <Link href="/owner-signup">
            <Button size="lg">
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Related Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {recentPosts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`}>
                  <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Badge variant="secondary" className="w-fit mb-3">{p.category}</Badge>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {p.title}
                      </h3>
                      <p className="text-gray-600 text-sm flex-1 line-clamp-3">
                        {p.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          {new Date(p.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-sm text-emerald-600 font-medium">
                          Read more &rarr;
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
