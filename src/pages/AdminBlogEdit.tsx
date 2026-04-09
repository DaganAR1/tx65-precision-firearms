import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Loader2, 
  Image as ImageIcon,
  Eye,
  Layout,
  Type,
  Tag,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import { toast } from 'sonner';

import ImageUpload from '../components/ImageUpload';

export default function AdminBlogEdit() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: 'Guides',
    published: false
  });

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      toast.error('Failed to fetch post');
      navigate('/admin/blog');
    } else {
      setPost(data);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const postData = {
        ...post,
        author_id: session.user.id,
        slug: post.slug || post.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      };

      const { error } = isEditing 
        ? await supabase.from('posts').update(postData).eq('id', id)
        : await supabase.from('posts').insert([postData]);

      if (error) throw error;
      toast.success(`Post ${isEditing ? 'updated' : 'created'} successfully`);
      navigate('/admin/blog');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-accent" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-muted p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <Link to="/admin/blog" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back to Knowledge Base
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              {isEditing ? 'Edit Article' : 'New Article'}
            </h1>
            <p className="text-gray-500 text-sm">Create high-quality content for your audience.</p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/blog')} 
              className="btn-outline flex items-center space-x-2"
            >
              <Eye size={20} />
              <span>Preview</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{isEditing ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </header>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Main Content */}
            <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 text-brand-accent">
                <Type size={20} />
                <h3 className="text-lg font-black uppercase tracking-tight">Article Content</h3>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title</label>
                <input
                  type="text"
                  required
                  value={post.title}
                  onChange={(e) => setPost({ ...post, title: e.target.value })}
                  className="input-field text-xl font-black uppercase tracking-tight"
                  placeholder="Enter article title..."
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Excerpt</label>
                <textarea
                  required
                  rows={3}
                  value={post.excerpt}
                  onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                  className="input-field resize-none"
                  placeholder="A brief summary of the article..."
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content (Markdown Supported)</label>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supports Markdown</span>
                </div>
                <textarea
                  required
                  rows={20}
                  value={post.content}
                  onChange={(e) => setPost({ ...post, content: e.target.value })}
                  className="input-field font-mono text-sm resize-none"
                  placeholder="# Start writing your article..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Settings */}
            <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 text-brand-accent">
                <Layout size={20} />
                <h3 className="text-lg font-black uppercase tracking-tight">Settings</h3>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                <select
                  value={post.category}
                  onChange={(e) => setPost({ ...post, category: e.target.value })}
                  className="input-field"
                >
                  <option value="Guides">Guides</option>
                  <option value="Reviews">Reviews</option>
                  <option value="Industry">Industry</option>
                  <option value="Training">Training</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slug (URL Path)</label>
                <input
                  type="text"
                  value={post.slug}
                  onChange={(e) => setPost({ ...post, slug: e.target.value })}
                  className="input-field"
                  placeholder="article-url-path"
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <input
                  type="checkbox"
                  id="published"
                  checked={post.published}
                  onChange={(e) => setPost({ ...post, published: e.target.checked })}
                  className="w-5 h-5 border-2 border-gray-200 text-brand-accent focus:ring-brand-accent"
                />
                <label htmlFor="published" className="text-sm font-black uppercase tracking-widest text-gray-600 cursor-pointer">
                  Publish Article
                </label>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 text-brand-accent">
                <ImageIcon size={20} />
                <h3 className="text-lg font-black uppercase tracking-tight">Featured Image</h3>
              </div>
              <ImageUpload 
                value={post.image_url || ''}
                onChange={(url) => setPost({ ...post, image_url: url })}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
