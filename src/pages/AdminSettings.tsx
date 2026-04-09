import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  ArrowLeft,
  Settings,
  Globe,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import ImageUpload from '../components/ImageUpload';

export default function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    fetchSettings();
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

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'site_logo')
      .single();
    
    if (data) {
      setLogoUrl(data.value);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({
          key: 'site_logo',
          value: logoUrl,
          type: 'image'
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Settings updated successfully');
      // Refresh the page to show new logo in navbar if needed, 
      // but usually a state update in a context would be better.
      // For now, just a success message.
      window.location.reload(); 
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
            <h1 className="text-3xl font-black uppercase tracking-tighter">Site Settings</h1>
            <p className="text-gray-500 text-sm">Manage your brand identity and global configurations.</p>
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
          {/* Branding Section */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 text-brand-accent">
              <Palette size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Branding</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Site Media</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Manage all your site-wide images, including the logo, hero backgrounds, and category banners in one central location.
                  </p>
                  <Link 
                    to="/admin/media"
                    className="btn-outline w-full flex items-center justify-center space-x-2 py-3"
                  >
                    <ImageIcon size={16} />
                    <span>Manage Media Assets</span>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Brand Name</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    The current brand name is hardcoded as <span className="font-bold text-brand-primary">65GUNS</span>. 
                    To change this globally, please contact support.
                  </p>
                  <div className="p-4 bg-brand-muted border border-gray-100">
                    <span className="text-xl font-black tracking-tighter text-brand-primary">
                      65<span className="text-brand-accent">GUNS</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 text-brand-accent">
              <Globe size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">General Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Store Status</label>
                <select disabled className="input-field bg-gray-50">
                  <option>Online</option>
                  <option>Maintenance Mode</option>
                </select>
              </div>
              <div className="space-y-2 opacity-50 cursor-not-allowed">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Currency</label>
                <select disabled className="input-field bg-gray-50">
                  <option>USD ($)</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
