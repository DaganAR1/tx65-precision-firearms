import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import AgeGate from './components/AgeGate';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminAbout from './pages/AdminAbout';
import AdminBlog from './pages/AdminBlog';
import AdminBlogEdit from './pages/AdminBlogEdit';
import AdminSettings from './pages/AdminSettings';
import AdminMedia from './pages/AdminMedia';
import AdminBackup from './pages/AdminBackup';
import Cart from './pages/Cart';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ResetPassword from './pages/ResetPassword';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import { CartProvider } from './context/CartContext';
import { supabase } from './lib/supabase';

function Footer() {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase
      .from('site_content')
      .select('value')
      .eq('key', 'site_logo')
      .single()
      .then(({ data }) => {
        if (data) setLogoUrl(data.value);
      });
  }, []);

  return (
    <footer className="bg-brand-primary text-white py-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
            <Link to="/" className="flex items-center mb-6 group min-h-[40px]">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="65GUNS" 
                  className="h-10 w-auto object-contain transition-opacity duration-300" 
                  referrerPolicy="no-referrer"
                  onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                  style={{ opacity: 0 }}
                />
              )}
            </Link>
            <p className="text-gray-400 max-w-sm mb-8">
              Premium firearms and accessories for the discerning marksman. We provide elite equipment with uncompromising quality and service.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61575030536694" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold">FB</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent mb-6">Contact</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <p className="hover:text-white transition-colors cursor-pointer">(940) 224-3477</p>
              <div className="leading-relaxed">
                <p>65GUNS</p>
                <p>346 BRAZOS ST</p>
                <p>Bowie, Texas 76230</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Knowledge Base</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/ffl" className="hover:text-white transition-colors">FFL Information</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent mb-6">Policies</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <div className="flex flex-col md:flex-row items-center md:space-x-8">
            <p>© 2026 65GUNS FIREARMS. ALL RIGHTS RESERVED.</p>
            <Link to="/admin" className="mt-2 md:mt-0 opacity-30 hover:opacity-100 transition-opacity">ADMIN PORTAL</Link>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span>Secure SSL Encryption</span>
            <span>Verified Dealer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  React.useEffect(() => {
    supabase
      .from('site_content')
      .select('value')
      .eq('key', 'favicon_url')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const updateFavicon = (url: string) => {
            // Remove existing favicons
            const existingLinks = document.querySelectorAll("link[rel*='icon']");
            existingLinks.forEach(link => link.parentNode?.removeChild(link));

            // Add new favicon
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = url;
            
            // Handle different image types
            if (url.endsWith('.svg')) link.type = 'image/svg+xml';
            else if (url.endsWith('.png')) link.type = 'image/png';
            else if (url.endsWith('.ico')) link.type = 'image/x-icon';
            
            document.head.appendChild(link);

            // Also add shortcut icon for better compatibility
            const shortcutLink = document.createElement('link');
            shortcutLink.rel = 'shortcut icon';
            shortcutLink.href = url;
            document.head.appendChild(shortcutLink);
          };

          updateFavicon(data.value);
        }
      });
  }, []);

  return (
    <Router>
      <CartProvider>
        <AgeGate />
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Toaster position="top-center" richColors />
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/about" element={<AdminAbout />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
              <Route path="/admin/blog/new" element={<AdminBlogEdit />} />
              <Route path="/admin/blog/edit/:id" element={<AdminBlogEdit />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/media" element={<AdminMedia />} />
              <Route path="/admin/backup" element={<AdminBackup />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </Router>
  );
}
