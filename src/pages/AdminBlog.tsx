import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Loader2, 
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import { toast } from 'sonner';

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    fetchPosts();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (data?.role !== 'admin') {
      toast.error('Unauthorized access');
      navigate('/');
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch posts');
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete post');
    } else {
      toast.success('Post deleted successfully');
      fetchPosts();
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-muted p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <Link to="/admin" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Knowledge Base</h1>
            <p className="text-gray-500 text-sm">Manage your professional insights and blog articles.</p>
          </div>
          <button 
            onClick={() => navigate('/admin/blog/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Article</span>
          </button>
        </header>

        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field !pl-14"
              />
              <Search className="absolute !left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Article</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="animate-spin text-brand-accent mx-auto" size={32} />
                    </td>
                  </tr>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-10 bg-gray-100 overflow-hidden flex-shrink-0">
                            <img src={post.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <div className="font-black uppercase tracking-tight text-sm line-clamp-1">{post.title}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center mt-1">
                              <User size={10} className="mr-1" /> {post.author?.full_name || 'Admin'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/10 px-2 py-1">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        {post.published ? (
                          <span className="flex items-center text-green-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={12} className="mr-1" /> Published
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <XCircle size={12} className="mr-1" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center">
                          <Calendar size={12} className="mr-1" /> {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/blog/${post.slug}`} 
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-brand-accent transition-colors"
                          >
                            <Eye size={18} />
                          </Link>
                          <button 
                            onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                            className="p-2 text-gray-400 hover:text-brand-accent transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                      No articles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
