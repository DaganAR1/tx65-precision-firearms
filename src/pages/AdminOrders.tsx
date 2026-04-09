import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });
    
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;
    if (data) setOrders(data as any);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-brand-muted p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <Link to="/admin" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-colors">
              <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Order Management</h1>
            <p className="text-gray-500 text-sm">Track and process customer orders.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field text-xs font-bold uppercase tracking-widest"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </header>

        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-accent" size={32} />
                  </td>
                </tr>
              ) : orders.length > 0 ? orders.map((order) => (
              <tr key={order.id} className="hover:bg-brand-muted transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
                    {order.transaction_id && (
                      <div className="mt-1">
                        <span className="text-[8px] text-gray-400 font-mono uppercase tracking-widest">TX: {order.transaction_id}</span>
                      </div>
                    )}
                    {order.ffl_info && (
                      <div className="mt-1">
                        <span className="text-[8px] bg-brand-accent text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">FFL Transfer</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">{order.customer_name || 'Anonymous'}</p>
                      <p className="text-[10px] text-gray-400">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">{formatPrice(order.total_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                      statusColors[order.status]
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <div className="flex justify-end space-x-1">
                      {['pending', 'paid'].includes(order.status) && (
                        <button 
                          onClick={() => updateStatus(order.id, 'processing')}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Process Order"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'shipped')}
                          className="p-2 text-gray-400 hover:text-purple-500 transition-colors"
                          title="Ship Order"
                        >
                          <Truck size={18} />
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button 
                          onClick={() => updateStatus(order.id, 'delivered')}
                          className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                          title="Mark Delivered"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {['pending', 'processing'].includes(order.status) && (
                        <button 
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Cancel Order"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-brand-accent transition-colors">
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
