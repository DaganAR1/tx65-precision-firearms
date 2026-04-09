import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  ArrowLeft,
  Layout,
  Type,
  ShieldCheck,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface SiteContent {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'image';
}

import ImageUpload from '../components/ImageUpload';

export default function AdminAbout() {
  const [content, setContent] = useState<Record<string, string>>({
    'about_hero_image': '',
    'about_who_we_are_image': '',
    'about_mission_image': '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    fetchContent();
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

  const fetchContent = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .filter('key', 'like', 'about_%');
    
    if (data) {
      const newContent = { ...content };
      data.forEach((item: SiteContent) => {
        newContent[item.key] = item.value;
      });
      setContent(newContent);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates = Object.entries(content).map(([key, value]) => ({
        key,
        value,
        type: 'image' // In this case, they are all images
      }));

      const { error } = await supabase
        .from('site_content')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Site content updated successfully');
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
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <Link to="/admin" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Manage About Page</h1>
            <p className="text-gray-500 text-sm">Update images and visual content for the About Us section.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>Save Changes</span>
          </button>
        </header>

        <form onSubmit={handleSave} className="space-y-12">
          {/* Hero Image */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-brand-accent">
              <Layout size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Hero Section</h3>
            </div>
            <ImageUpload 
              label="Hero Background Image"
              value={content['about_hero_image']}
              onChange={(url) => setContent({ ...content, 'about_hero_image': url })}
            />
          </div>

          {/* Who We Are Image */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-brand-accent">
              <Users size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Who We Are Section</h3>
            </div>
            <ImageUpload 
              label="Section Image"
              value={content['about_who_we_are_image']}
              onChange={(url) => setContent({ ...content, 'about_who_we_are_image': url })}
            />
          </div>

          {/* Mission Image */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-brand-accent">
              <ShieldCheck size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Our Mission Section</h3>
            </div>
            <ImageUpload 
              label="Section Image"
              value={content['about_mission_image']}
              onChange={(url) => setContent({ ...content, 'about_mission_image': url })}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
