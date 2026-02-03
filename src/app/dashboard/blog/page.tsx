'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Clock,
  Loader2,
  ExternalLink,
  Save,
  X,
  ShieldX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const defaultForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author: 'GreenDay Team',
  category: 'Business Tips',
  tags: '',
  published: false,
};

export default function BlogManagementPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(defaultForm);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog?admin=true');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openNew = () => {
    setEditingPost(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      category: post.category,
      tags: post.tags.join(', '),
      published: post.published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      slug: form.slug || generateSlug(form.title),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      let res;
      if (editingPost) {
        res = await fetch(`/api/blog/${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast({
        title: 'Success',
        description: editingPost ? 'Post updated' : 'Post created',
        variant: 'success',
      });
      setIsDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      });

      if (!res.ok) throw new Error('Failed to update');

      toast({
        title: 'Success',
        description: post.published ? 'Post unpublished' : 'Post published',
        variant: 'success',
      });
      fetchPosts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update post', variant: 'destructive' });
    }
  };

  const deletePost = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/blog/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Success', description: 'Post deleted', variant: 'success' });
      fetchPosts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ShieldX className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-gray-500">Blog management is only available to platform administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-500">Create and manage blog posts for your website</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Posts</p>
            <p className="text-2xl font-bold">{posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-2xl font-bold text-emerald-600">
              {posts.filter((p) => p.published).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-2xl font-bold text-gray-400">
              {posts.filter((p) => !p.published).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{post.title}</h3>
                      {post.published ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min read
                      </span>
                      <span>By {post.author}</span>
                      {post.publishedAt && (
                        <span>Published {formatDate(post.publishedAt)}</span>
                      )}
                      <span className="font-mono text-gray-400">/blog/{post.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.published && (
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => togglePublish(post)}
                    >
                      {post.published ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(post)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => deletePost(post)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium mb-1">No blog posts yet</p>
              <p className="text-sm mb-4">Create your first post to start driving traffic to your site.</p>
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'New Blog Post'}</DialogTitle>
            <DialogDescription>
              {editingPost
                ? 'Update your blog post. Use markdown-style formatting.'
                : 'Write a new blog post. Use ## for headings, - for lists, **bold** for emphasis.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  setForm({
                    ...form,
                    title: e.target.value,
                    slug: form.slug || generateSlug(e.target.value),
                  });
                }}
                placeholder="e.g., 10 Tips for Growing Your Landscaping Business"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>URL Slug</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-400">/blog/</span>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g., Business Tips"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Excerpt</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Brief description shown on the blog listing page..."
                rows={2}
                required
              />
            </div>

            <div>
              <Label>Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your post here. Use ## for headings, - for bullet points, **bold** for emphasis..."
                rows={15}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Formatting: ## Heading, ### Sub-heading, - bullet list, 1. numbered list, **bold text**
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Author</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="landscaping, tips, business"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="published" className="cursor-pointer">
                Publish immediately
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? 'Update Post' : 'Create Post'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
