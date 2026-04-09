import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Share2, 
  Loader2,
  Tag,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import Markdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      navigate('/blog');
      return;
    }

    setPost(data);
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-accent" size={48} />
    </div>
  );

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{`${post.title} | TX65 Insights`}</title>
        <meta name="description" content={post.excerpt.substring(0, 160)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt.substring(0, 160)} />
        <meta property="og:image" content={post.image_url} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`${window.location.origin}/blog/${post.slug}`} />
      </Helmet>
      {/* Hero Header */}
      <header className="relative h-[60vh] flex items-center overflow-hidden bg-brand-primary">
        <div className="absolute inset-0 opacity-40">
          <img 
            src={post.image_url} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/50 to-transparent z-10"></div>
        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/blog" className="inline-flex items-center text-xs font-black uppercase tracking-[0.3em] text-brand-accent hover:text-white mb-8 transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back to Knowledge Base
            </Link>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center justify-center space-x-8 text-[10px] font-black uppercase tracking-widest text-gray-300">
              <span className="flex items-center"><Calendar size={14} className="mr-2 text-brand-accent" /> {new Date(post.created_at).toLocaleDateString()}</span>
              <span className="flex items-center"><User size={14} className="mr-2 text-brand-accent" /> {post.author?.full_name || 'Admin'}</span>
              <span className="flex items-center"><Tag size={14} className="mr-2 text-brand-accent" /> {post.category}</span>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Article Content */}
          <article className="flex-grow max-w-4xl mx-auto">
            <div className="markdown-body prose prose-lg prose-brand max-w-none">
              <Markdown>{post.content}</Markdown>
            </div>

            {/* Share Section */}
            <div className="mt-20 pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Share Article</span>
                <div className="flex space-x-2">
                  <button className="w-10 h-10 bg-brand-muted flex items-center justify-center hover:bg-brand-accent transition-colors">
                    <Facebook size={18} />
                  </button>
                  <button className="w-10 h-10 bg-brand-muted flex items-center justify-center hover:bg-brand-accent transition-colors">
                    <Twitter size={18} />
                  </button>
                  <button className="w-10 h-10 bg-brand-muted flex items-center justify-center hover:bg-brand-accent transition-colors">
                    <Linkedin size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Tags</span>
                <div className="flex space-x-2">
                  <span className="bg-brand-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest">{post.category}</span>
                  <span className="bg-brand-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest">Elite Gear</span>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-12">
              {/* Author Info */}
              <div className="bg-brand-muted p-8 border border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-gray-400">About the Author</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-brand-accent font-black">
                    {post.author?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tight">{post.author?.full_name || 'Admin'}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Professional Marksman</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Expert contributor and dedicated professional with over 15 years of experience in precision firearms and tactical training.
                </p>
              </div>

              {/* Related Products Widget */}
              <div className="bg-brand-primary p-8 text-white">
                <h4 className="text-xl font-black uppercase tracking-tight mb-6">Elite Equipment</h4>
                <p className="text-gray-400 text-xs mb-8 leading-relaxed">Discover the gear featured in this article and elevate your performance.</p>
                <Link to="/shop" className="btn-primary w-full text-center py-3 text-xs">Shop Collection</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
