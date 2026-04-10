import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Layout,
  FileText,
  Star,
  Database,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Order } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Revenue', value: '$0', trend: '0%', icon: TrendingUp },
    { label: 'Active Orders', value: '0', trend: '0', icon: ShoppingCart },
    { label: 'Total Products', value: '0', trend: '0', icon: Package },
    { label: 'Total Customers', value: '0', trend: '0%', icon: Users },
  ]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAdmin();
    fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      // Test connection first
      const { error: connError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (connError) {
        setDbConnected(false);
        setConnectionError(connError.message);
        throw connError;
      }
      setDbConnected(true);

      const [prodRes, orderRes, allOrdersRes, bestSellersRes] = await Promise.all([
        supabase.from('products').select('*').limit(5),
        supabase.from('orders').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('total_amount, status'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_best_seller', true)
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (orderRes.data) setOrders(orderRes.data as any);

      // Calculate Real Stats
      const totalRevenue = allOrdersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const activeOrders = allOrdersRes.data?.filter(order => !['delivered', 'cancelled'].includes(order.status)).length || 0;
      
      // Get Total Product Count
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      
      setStats([
        { label: 'Total Revenue', value: formatPrice(totalRevenue), trend: '+0%', icon: TrendingUp },
        { label: 'Active Orders', value: activeOrders.toString(), trend: '+0', icon: ShoppingCart },
        { label: 'Total Products', value: (productCount || 0).toString(), trend: '+0', icon: Package },
        { label: 'Best Sellers', value: (bestSellersRes.count || 0).toString(), trend: 'Featured', icon: Star },
      ]);
    } catch (error: any) {
      toast.error('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-muted flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-primary text-white flex flex-col">
        <div className="p-8 border-b border-white/10">
          <span className="text-xl font-black tracking-tighter">ADMIN<span className="text-brand-accent">PORTAL</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: 'Dashboard', icon: LayoutDashboard, active: location.pathname === '/admin' },
            { name: 'Products', icon: Package, href: '/admin/products' },
            { name: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
            { name: 'Media Assets', icon: ImageIcon, href: '/admin/media' },
            { name: 'Knowledge Base', icon: FileText, href: '/admin/blog' },
            { name: 'Database', icon: Database, href: '/admin/backup' },
            { name: 'Settings', icon: Settings, href: '/admin/settings' },
          ].map((item) => (
            <Link
              key={item.name}
              to={item.href || '#'}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors",
                item.active ? "bg-brand-accent text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Dashboard Overview</h1>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-gray-500 text-sm">Welcome back, Administrator.</p>
              <span className="text-gray-300">|</span>
              <div className="flex items-center space-x-1.5">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  dbConnected === true ? "bg-green-500" : dbConnected === false ? "bg-red-500" : "bg-gray-300 animate-pulse"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {dbConnected === true ? "Database Connected" : dbConnected === false ? "Connection Failed" : "Connecting..."}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input type="text" placeholder="Search..." className="bg-white border-none px-4 py-2 !pl-12 text-sm focus:ring-1 focus:ring-brand-accent" />
              <Search className="absolute !left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
            <button className="bg-brand-accent text-white p-2 hover:bg-black transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        {dbConnected === false && (
          <div className="mb-12 bg-red-50 border border-red-100 p-8 flex flex-col space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-red-900">Database Connection Failed</h3>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  The website is unable to reach your Supabase database. This is usually caused by missing or incorrect environment variables.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 border border-red-100 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Debug Information</h4>
                <button 
                  onClick={() => fetchData()}
                  className="text-[10px] font-black uppercase tracking-widest text-brand-accent hover:underline"
                >
                  Retry Connection
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-400">Error Message:</span>
                  <span className="text-red-600 font-bold">{connectionError || 'Failed to fetch (Network Error)'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-400">Supabase URL:</span>
                  <span className="text-gray-900">{import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 15)}...` : 'MISSING'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-400">Anon Key:</span>
                  <span className="text-gray-900">{import.meta.env.VITE_SUPABASE_ANON_KEY ? 'PRESENT (HIDDEN)' : 'MISSING'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed">
                  <span className="font-bold text-gray-600">Action Required:</span> Go to your project settings, find the "Secrets" or "Environment Variables" panel, and ensure <span className="text-brand-primary">VITE_SUPABASE_URL</span> and <span className="text-brand-primary">VITE_SUPABASE_ANON_KEY</span> are set correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-muted text-brand-primary">
                  <stat.icon size={20} />
                </div>
                <span className="text-xs font-bold text-green-500 flex items-center">
                  {stat.trend} <ArrowUpRight size={12} className="ml-1" />
                </span>
              </div>
              <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h3>
              <p className="text-2xl font-black tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Recent Orders */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black uppercase tracking-tight">Recent Orders</h3>
              <Link to="/admin/orders" className="text-xs font-bold uppercase tracking-widest text-brand-accent">View All</Link>
            </div>
            <div className="space-y-6">
              {orders.length > 0 ? orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-brand-muted flex items-center justify-center text-brand-primary font-bold text-xs">
                      #{order.id.slice(0, 4).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">{(order as any).profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400 flex items-center">
                        <Clock size={12} className="mr-1" /> {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatPrice(order.total_amount)}</p>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      order.status === 'delivered' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 text-sm italic">No orders found.</p>
              )}
            </div>
          </div>

          {/* Inventory Alert */}
          <div className="bg-white p-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black uppercase tracking-tight">Inventory Status</h3>
              <Link to="/admin/products" className="text-xs font-bold uppercase tracking-widest text-brand-accent">Manage</Link>
            </div>
            <div className="space-y-6">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-4">
                    <img src={product.image_url} alt="" className="w-12 h-12 object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      product.stock_quantity < 5 ? "text-red-500" : "text-gray-900"
                    )}>
                      {product.stock_quantity} in stock
                    </p>
                    <div className="w-24 h-1.5 bg-gray-100 mt-2">
                      <div 
                        className={cn(
                          "h-full",
                          product.stock_quantity < 5 ? "bg-red-500" : "bg-brand-accent"
                        )} 
                        style={{ width: `${Math.min(product.stock_quantity * 5, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
