import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  ArrowLeft,
  Image as ImageIcon,
  Home,
  Info,
  Layers,
  ShieldCheck,
  Users,
  Layout
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import ImageUpload from '../components/ImageUpload';

interface SiteContent {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'image';
}

export default function AdminMedia() {
  const [content, setContent] = useState<Record<string, string>>({
    'site_logo': '',
    'home_hero_image': '',
    'home_cat_rifles_image': '',
    'home_cat_pistols_image': '',
    'home_cat_optics_image': '',
    'about_hero_image': '',
    'about_who_we_are_image': '',
    'about_mission_image': '',
    'brand_logo_1': '',
    'brand_name_1': '',
    'brand_logo_2': '',
    'brand_name_2': '',
    'brand_logo_3': '',
    'brand_name_3': '',
    'brand_logo_4': '',
    'brand_name_4': '',
    'brand_logo_5': '',
    'brand_name_5': '',
    'brand_logo_6': '',
    'brand_name_6': '',
    'brand_logo_7': '',
    'brand_name_7': '',
    'brand_logo_8': '',
    'brand_name_8': '',
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
    try {
      const { data } = await supabase
        .from('site_content')
        .select('*');
      
      if (data) {
        const newContent = { ...content };
        data.forEach((item: SiteContent) => {
          if (newContent.hasOwnProperty(item.key)) {
            newContent[item.key] = item.value;
          }
        });
        setContent(newContent);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates = Object.entries(content).map(([key, value]) => ({
        key,
        value,
        type: key.includes('logo') || key.includes('image') ? 'image' : 'text'
      }));

      const { error } = await supabase
        .from('site_content')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Media and brand assets updated successfully');
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
            <Link to="/admin" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Media Management</h1>
            <p className="text-gray-500 text-sm">Update all site-wide images and visual assets from one central location.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>Save All Changes</span>
          </button>
        </header>

        <form onSubmit={handleSave} className="space-y-12">
          {/* Global Branding */}
          <section className="bg-white p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 text-brand-accent">
              <ImageIcon size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Global Branding</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ImageUpload 
                label="Site Logo"
                value={content['site_logo']}
                onChange={(url) => setContent({ ...content, 'site_logo': url })}
              />
              <div className="p-6 bg-brand-muted border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Current Branding Preview</p>
                <div className="flex items-center space-x-4">
                  {content['site_logo'] ? (
                    <img src={content['site_logo']} alt="Logo Preview" className="h-12 w-auto object-contain" />
                  ) : (
                    <span className="text-2xl font-black tracking-tighter text-brand-primary">
                      65<span className="text-brand-accent">GUNS</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Home Page Assets */}
          <section className="bg-white p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 text-brand-accent">
              <Home size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Home Page Assets</h3>
            </div>
            
            <div className="space-y-8">
              <ImageUpload 
                label="Hero Background Image"
                value={content['home_hero_image']}
                onChange={(url) => setContent({ ...content, 'home_hero_image': url })}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ImageUpload 
                  label="Category: Precision Rifles"
                  value={content['home_cat_rifles_image']}
                  onChange={(url) => setContent({ ...content, 'home_cat_rifles_image': url })}
                />
                <ImageUpload 
                  label="Category: Tactical Pistols"
                  value={content['home_cat_pistols_image']}
                  onChange={(url) => setContent({ ...content, 'home_cat_pistols_image': url })}
                />
                <ImageUpload 
                  label="Category: Premium Optics"
                  value={content['home_cat_optics_image']}
                  onChange={(url) => setContent({ ...content, 'home_cat_optics_image': url })}
                />
              </div>
            </div>
          </section>

          {/* About Page Assets */}
          <section className="bg-white p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 text-brand-accent">
              <Info size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">About Page Assets</h3>
            </div>
            
            <div className="space-y-8">
              <ImageUpload 
                label="About Hero Background"
                value={content['about_hero_image']}
                onChange={(url) => setContent({ ...content, 'about_hero_image': url })}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUpload 
                  label="Who We Are Section Image"
                  value={content['about_who_we_are_image']}
                  onChange={(url) => setContent({ ...content, 'about_who_we_are_image': url })}
                />
                <ImageUpload 
                  label="Our Mission Section Image"
                  value={content['about_mission_image']}
                  onChange={(url) => setContent({ ...content, 'about_mission_image': url })}
                />
              </div>
            </div>
          </section>

          {/* Brand Slider Logos */}
          <section className="bg-white p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 text-brand-accent">
              <Layers size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Brand Slider Logos</h3>
            </div>
            <p className="text-xs text-gray-400">
              These logos appear in the scrolling brand slider on the home page. 
              Enter the brand name and upload high-quality logos with transparent backgrounds.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <div key={num} className="space-y-4 p-4 bg-brand-muted border border-gray-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Brand {num} Name</label>
                    <input 
                      type="text"
                      value={content[`brand_name_${num}`]}
                      onChange={(e) => setContent({ ...content, [`brand_name_${num}`]: e.target.value })}
                      placeholder="e.g. GLOCK"
                      className="input-field text-xs"
                    />
                  </div>
                  <ImageUpload 
                    label={`Brand ${num} Logo`}
                    value={content[`brand_logo_${num}`]}
                    onChange={(url) => setContent({ ...content, [`brand_logo_${num}`]: url })}
                  />
                </div>
              ))}
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
