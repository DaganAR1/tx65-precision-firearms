import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { OptimizedImage } from './OptimizedImage';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkAdmin(session?.user?.id);
    });

    fetchLogo();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdmin(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchLogo = async () => {
    const { data } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'site_logo')
      .single();
    
    if (data) setLogoUrl(data.value);
  };

  const checkAdmin = async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setIsAdmin(data?.role === 'admin');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Shop All', href: '/shop' },
    { name: 'Knowledge Base', href: '/blog' },
    { name: 'About', href: '/about' },
  ];

  const categories = ['Rifles', 'Pistols', 'Optics', 'Accessories', 'Ammunition'];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group min-w-[150px]">
            {logoUrl && (
              <OptimizedImage 
                src={logoUrl} 
                alt="65GUNS" 
                containerClassName="h-12 w-auto"
                className="object-contain"
              />
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <Link
                to="/shop"
                className={cn(
                  "flex items-center text-sm font-medium uppercase tracking-widest hover:text-brand-accent transition-colors py-8",
                  location.pathname === '/shop' ? "text-brand-accent" : "text-brand-primary"
                )}
              >
                Shop <ChevronDown size={14} className="ml-1 group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-0 w-48 bg-white border border-gray-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    to={`/shop?category=${cat}`}
                    className="block px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-brand-muted hover:text-brand-accent transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "text-sm font-medium uppercase tracking-widest hover:text-brand-accent transition-colors",
                  location.pathname === link.href ? "text-brand-accent" : "text-brand-primary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <button className="p-2 hover:text-brand-accent transition-colors">
              <Search size={20} />
            </button>
            <Link to="/cart" className="p-2 hover:text-brand-accent transition-colors relative">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link to="/admin" className="p-2 text-brand-accent hover:bg-brand-muted transition-colors rounded-full">
                    <ShieldCheck size={20} />
                  </Link>
                )}
                <button onClick={handleLogout} className="p-2 hover:text-brand-accent transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="p-2 hover:text-brand-accent transition-colors">
                <User size={20} />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-brand-primary"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Shop</p>
            <Link
              to="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="block text-lg font-medium uppercase tracking-widest"
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/shop?category=${cat}`}
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-medium uppercase tracking-widest text-gray-500 pl-4"
              >
                {cat}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-4">
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium uppercase tracking-widest"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-around">
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center relative">
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
              <span className="text-xs mt-1">Cart</span>
            </Link>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center">
              <User size={24} />
              <span className="text-xs mt-1">Account</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
