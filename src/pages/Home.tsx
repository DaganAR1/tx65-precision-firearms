import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  Truck, 
  RotateCcw, 
  Award, 
  Star,
  Calendar,
  User,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { Product, BlogPost } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';
import { OptimizedImage } from '../components/OptimizedImage';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
  const [activeView, setActiveView] = useState<'form' | 'map'>('form');
  const [siteMedia, setSiteMedia] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    inquiryType: '',
    message: ''
  });

  useEffect(() => {
    fetchFeaturedProducts();
    fetchLatestPosts();
    fetchSiteMedia();
  }, []);

  const fetchSiteMedia = async () => {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('key, value');
      
      if (data) {
        const media: Record<string, string> = {};
        data.forEach(item => {
          media[item.key] = item.value || '';
        });
        setSiteMedia(media);
      }
    } catch (error) {
      console.error('Error fetching site media:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_best_seller', true)
      .limit(8);
    if (data) setFeaturedProducts(data);
  };

  const fetchLatestPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) setLatestPosts(data);
  };

  const categories = [
    { name: 'Precision Rifles', image: siteMedia['home_cat_rifles_image'] || 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80&w=800', href: '/shop?category=Rifles' },
    { name: 'Tactical Pistols', image: siteMedia['home_cat_pistols_image'] || 'https://images.unsplash.com/photo-1584285418504-0052ec244a7b?auto=format&fit=crop&q=80&w=800', href: '/shop?category=Pistols' },
    { name: 'Premium Optics', image: siteMedia['home_cat_optics_image'] || 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800', href: '/shop?category=Optics' },
  ];

  const getBrands = () => {
    const dynamicBrands = [];
    for (let i = 1; i <= 8; i++) {
      const name = siteMedia[`brand_name_${i}`];
      const image = siteMedia[`brand_logo_${i}`];
      
      if (name && image && name.trim() !== '' && image.trim() !== '') {
        dynamicBrands.push({ name: name.trim(), image: image.trim() });
      }
    }

    if (dynamicBrands.length > 0) return dynamicBrands;

    // Default brands if none are configured
    return [
      { name: 'GLOCK', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Glock_Logo.svg/1200px-Glock_Logo.svg.png' },
      { name: 'HERITAGE', image: 'https://heritagemfg.com/wp-content/themes/heritage/assets/images/logo.png' },
      { name: 'TAURUS', image: 'https://www.taurususa.com/assets/images/logo-taurus.png' },
      { name: 'ROSSI', image: 'https://www.rossiusa.com/assets/images/logo-rossi.png' },
      { name: 'RUGER', image: 'https://ruger.com/images/logos/ruger-logo-red.png' },
      { name: 'WALTHER', image: 'https://waltherarms.com/wp-content/uploads/Walther-Logo-Black.png' },
      { name: 'SIG SAUER', image: 'https://www.sigsauer.com/media/logo/default/sig-sauer-logo.png' },
      { name: 'SMITH & WESSON', image: 'https://www.smith-wesson.com/sites/default/files/sw_logo_black.png' },
      { name: 'BERETTA', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Beretta_logo.svg/1200px-Beretta_logo.svg.png' },
      { name: 'COLT', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Colt_Logo.svg/1200px-Colt_Logo.svg.png' },
    ];
  };

  const brands = getBrands();
  // Triple the list to ensure it fills the screen and loops smoothly
  const displayBrands = [...brands, ...brands, ...brands];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      toast.error('Contact form is not configured. Please add VITE_WEB3FORMS_ACCESS_KEY to your environment.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: formValues.name,
          email: formValues.email,
          subject: `TX65 Inquiry: ${formValues.inquiryType || 'General'}`,
          message: formValues.message,
          from_name: 'TX65 Precision Website'
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsSubmitted(true);
        toast.success('Inquiry sent successfully!');
        setFormValues({ name: '', email: '', inquiryType: '', message: '' });
      } else {
        throw new Error(result.message || 'Failed to send inquiry');
      }
    } catch (error: any) {
      console.error('Web3Forms Error:', error);
      toast.error(error.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Helmet>
        <title>65GUNS | Elite Firearms & Tactical Equipment</title>
        <meta name="description" content="Premium firearms, precision rifles, and tactical accessories for the discerning marksman. Experience uncompromising quality and performance with 65GUNS." />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-60">
          <OptimizedImage 
            src={siteMedia['home_hero_image']} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallbackColor="bg-black"
          />
        </div>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl"
          >
            <span className="text-brand-accent font-bold tracking-[0.3em] uppercase text-sm mb-4 block">
              Precision Engineered
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-8 uppercase tracking-tighter">
              UNCOMPROMISING <br className="hidden sm:block" /> PERFORMANCE.
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-xl">
              Experience the pinnacle of firearms engineering. Built for those who demand absolute accuracy and reliability in every shot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="btn-primary bg-brand-accent hover:bg-white hover:text-black flex items-center justify-center group py-4 px-8">
                Shop Collection
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link to="/about" className="btn-outline border-white text-white hover:bg-white hover:text-black flex items-center justify-center py-4 px-8">
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-brand-primary py-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-x-16">
            {[
              { icon: Shield, text: 'Secure Checkout' },
              { icon: Truck, text: 'Fast Shipping' },
              { icon: RotateCcw, text: '30-Day Returns' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-center space-x-4 text-white/80 group">
                <div className="p-2 bg-white/5 rounded-full group-hover:bg-brand-accent/20 transition-colors">
                  <feature.icon size={22} className="text-brand-accent" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Slider */}
      <section className="bg-white py-12 border-b border-gray-100 overflow-hidden">
        <div className="relative flex overflow-x-hidden">
          <motion.div 
            animate={{ x: ["0%", "-33.3333%"] }}
            transition={{ 
              duration: Math.max(brands.length * 4, 20), 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="flex whitespace-nowrap items-center"
          >
            {displayBrands.map((brand, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[250px] h-24 flex items-center justify-center px-8 group cursor-default"
              >
                <OptimizedImage 
                  src={brand.image} 
                  alt={brand.name} 
                  className="max-w-full max-h-full object-contain opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                  containerClassName="flex items-center justify-center"
                  fallbackColor="bg-transparent"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter">Browse Categories</h2>
              <div className="h-1 w-20 bg-brand-accent mt-2"></div>
            </div>
            <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-brand-accent hover:text-black transition-colors">
              View All Products
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="group relative h-[500px] overflow-hidden bg-gray-100"
              >
                <OptimizedImage 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">{cat.name}</h3>
                  <Link 
                    to={cat.href} 
                    className="inline-flex items-center text-white font-bold text-xs uppercase tracking-[0.2em] group-hover:text-brand-accent transition-colors"
                  >
                    Shop Now <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Selling Products */}
      {featuredProducts.length > 0 && (
        <section className="py-24 bg-brand-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-brand-accent font-bold uppercase tracking-widest text-xs mb-4 block">Best Sellers</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Top Performance Gear</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">The most trusted and requested firearms in our inventory, chosen by professionals.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/product/${product.id}`}
                  className="group bg-white border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden mb-6 bg-gray-50">
                    <OptimizedImage 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      containerClassName="w-full h-full"
                      fallbackColor="bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">{product.category}</span>
                    <div className="flex items-center text-yellow-400">
                      <Star size={10} fill="currentColor" />
                      <Star size={10} fill="currentColor" />
                      <Star size={10} fill="currentColor" />
                      <Star size={10} fill="currentColor" />
                      <Star size={10} fill="currentColor" />
                    </div>
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-lg mb-2 group-hover:text-brand-accent transition-colors">{product.name}</h3>
                  <p className="text-brand-primary font-black text-xl">{formatPrice(product.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Preview Section */}
      {latestPosts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-brand-accent font-bold uppercase tracking-widest text-xs mb-4 block">Knowledge Base</span>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Latest Insights</h2>
              </div>
              <Link to="/blog" className="text-sm font-bold uppercase tracking-widest text-brand-accent hover:text-black transition-colors">
                Read All Articles
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {latestPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <div className="aspect-[16/9] overflow-hidden mb-6 bg-gray-100">
                    <OptimizedImage 
                      src={post.image_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex items-center space-x-4 mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center"><User size={12} className="mr-1" /> {post.author?.full_name || 'Admin'}</span>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4 group-hover:text-brand-accent transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6">{post.excerpt}</p>
                  <span className="text-xs font-black uppercase tracking-[0.2em] flex items-center group-hover:translate-x-2 transition-transform">
                    Read More <ArrowRight size={14} className="ml-2 text-brand-accent" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      <section className="py-24 bg-brand-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Built for Professionals</h2>
            <p className="text-lg text-gray-600 mb-12">
              TX65 Precision is more than a retailer. We are enthusiasts, competitors, and professionals who understand that when it comes to firearms, there is no room for error.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
              <div>
                <h4 className="font-bold uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-8 h-[1px] bg-brand-accent mr-3"></span>
                  Expert Curation
                </h4>
                <p className="text-sm text-gray-500">Every product in our inventory is hand-selected and tested by our team of experts.</p>
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-8 h-[1px] bg-brand-accent mr-3"></span>
                  Secure Handling
                </h4>
                <p className="text-sm text-gray-500">We adhere to all federal and state regulations to ensure a safe and legal purchasing process.</p>
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-8 h-[1px] bg-brand-accent mr-3"></span>
                  Elite Support
                </h4>
                <p className="text-sm text-gray-500">Our support team consists of experienced shooters ready to help you find the perfect setup.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combined Contact & Map Section */}
      <section className="py-24 bg-brand-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-brand-accent font-bold uppercase tracking-widest text-xs mb-4 block">Get in Touch</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Connect with TX65</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Whether you have technical questions or need a custom build, our experts are ready to assist.</p>
          </div>

          {/* Toggle Switch */}
          <div className="flex justify-center mb-12">
            <div className="bg-white p-1 rounded-full shadow-lg border border-gray-100 flex items-center">
              <button 
                onClick={() => setActiveView('form')}
                className={cn(
                  "px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300",
                  activeView === 'form' ? "bg-brand-primary text-white shadow-md" : "text-gray-400 hover:text-brand-primary"
                )}
              >
                Contact Form
              </button>
              <button 
                onClick={() => setActiveView('map')}
                className={cn(
                  "px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300",
                  activeView === 'map' ? "bg-brand-primary text-white shadow-md" : "text-gray-400 hover:text-brand-primary"
                )}
              >
                Map
              </button>
            </div>
          </div>

          {/* Content Container */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: activeView === 'form' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-grow flex flex-col"
            >
              {activeView === 'form' ? (
                <div className="p-12 md:p-16 flex-grow">
                  {isSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-6"
                    >
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Message Received</h3>
                      <p className="text-gray-500 max-w-xs mx-auto">
                        Thank you for reaching out. One of our precision experts will contact you shortly.
                      </p>
                      <button 
                        onClick={() => setIsSubmitted(false)}
                        className="text-xs font-black uppercase tracking-widest text-brand-accent hover:text-black transition-colors"
                      >
                        Send Another Message
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={formValues.name}
                            onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="John Doe" 
                            className="input-field bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={formValues.email}
                            onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john@example.com" 
                            className="input-field bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inquiry Type</label>
                        <select 
                          value={formValues.inquiryType}
                          onChange={(e) => setFormValues(prev => ({ ...prev, inquiryType: e.target.value }))}
                          className="input-field bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                        >
                          <option value="">Select an inquiry type (optional)</option>
                          <option value="custom-build">Custom Build Request</option>
                          <option value="technical-support">Technical Support</option>
                          <option value="order-status">Order Status</option>
                          <option value="ffl-transfer">FFL Transfer Inquiry</option>
                          <option value="general">General Question</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Message</label>
                        <textarea 
                          rows={6} 
                          required
                          value={formValues.message}
                          onChange={(e) => setFormValues(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Tell us about your requirements..." 
                          className="input-field bg-gray-50/50 border-gray-100 focus:bg-white transition-all resize-none"
                        ></textarea>
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn-primary w-full py-5 text-sm font-black uppercase tracking-[0.3em] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-3"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Send Inquiry</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="flex-grow relative">
                  <div className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-700">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13324.47167576566!2d-97.859666!3d33.558333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864d994367f0f0f3%3A0x864d994367f0f0f3!2sBowie%2C%20TX%2076230!5e0!3m2!1sen!2sus!4v1711310000000!5m2!1sen!2sus" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen={true} 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      title="TX65 Precision Location"
                    ></iframe>
                  </div>
                  <div className="absolute bottom-8 left-8 bg-brand-primary p-6 text-white shadow-2xl max-w-xs border-l-4 border-brand-accent">
                    <h4 className="font-black uppercase tracking-tight mb-2">Bowie Headquarters</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Visit our precision facility in Bowie, TX. Appointments recommended for custom build consultations.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
