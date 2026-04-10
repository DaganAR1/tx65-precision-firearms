import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  User, 
  ArrowRight,
  Loader2,
  Tag,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import { cn } from '../lib/utils';
import { OptimizedImage } from '../components/OptimizedImage';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (activeCategory) {
      query = query.eq('category', activeCategory);
    }

    const { data } = await query;
    if (data) setPosts(data);
    setLoading(false);
  };

  const categories = Array.from(new Set(posts.map(p => p.category)));

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>TX65 Insights | Firearms Blog & News</title>
        <meta name="description" content="Professional guides, equipment reviews, and industry updates from the experts at TX65 Precision. Stay informed with the latest firearms news." />
        <link rel="canonical" href={`${window.location.origin}/blog`} />
      </Helmet>
      {/* Hero Section */}
      <section className="bg-brand-primary py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <OptimizedImage 
            src="https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=1920" 
            alt="" 
            containerClassName="w-full h-full"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-brand-accent font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Knowledge Base</span>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6">TX65 Insights</h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Professional guides, equipment reviews, and industry updates from the experts at TX65 Precision.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="flex-grow space-y-16">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-brand-accent" size={48} />
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {filteredPosts.map((post, i) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group"
                  >
                    <Link to={`/blog/${post.slug}`} className="block">
                      <OptimizedImage 
                        src={post.image_url} 
                        alt={post.title} 
                        containerClassName="aspect-[16/9] mb-6"
                        className="transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-brand-accent text-black text-[10px] font-black uppercase tracking-widest px-3 py-1">
                          {post.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(post.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center"><User size={12} className="mr-1" /> {post.author?.full_name || 'Admin'}</span>
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-brand-accent transition-colors leading-tight">
                        {post.title}
                      </h2>
                      <p className="text-gray-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <span className="text-xs font-black uppercase tracking-[0.2em] flex items-center group-hover:translate-x-2 transition-transform">
                        Read Article <ArrowRight size={14} className="ml-2 text-brand-accent" />
                      </span>
                    </Link>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-brand-muted border border-gray-100">
                <p className="text-gray-500 font-bold uppercase tracking-widest">No articles found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-12">
              {/* Search */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-gray-400">Search Articles</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field !pl-14"
                  />
                  <Search className="absolute !left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-gray-400">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "block w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border",
                      !activeCategory ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-gray-600 border-gray-100 hover:bg-brand-muted"
                    )}
                  >
                    All Topics
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "block w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border",
                        activeCategory === cat ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-gray-600 border-gray-100 hover:bg-brand-muted"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Newsletter Widget */}
              <div className="bg-brand-primary p-8 text-white">
                <Mail className="text-brand-accent mb-6" size={32} />
                <h4 className="text-xl font-black uppercase tracking-tight mb-4">Get Updates</h4>
                <p className="text-gray-400 text-xs mb-6 leading-relaxed">Stay informed with the latest professional insights and equipment reviews.</p>
                <Link to="/" className="btn-primary w-full text-center py-3 text-xs">Join Now</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
