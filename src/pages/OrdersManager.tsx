import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Filter, ExternalLink, Clock, CheckCircle2, Truck, XCircle, MoreVertical, Eye, ShoppingBag, Phone } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: any[];
  created_at: string;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  shipped: { label: 'In Delivery', icon: Truck, color: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-200' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-100' },
  cancelled: { label: 'Rejected', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error: supabaseError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supabaseError) throw supabaseError;
      if (data) setOrders(data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to connect to the database');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: Order['status']) {
    try {
      const { error: supabaseError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (supabaseError) throw supabaseError;
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4C35DE]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-6">
        <div className="bg-red-50 border border-red-100 p-8 rounded-3xl">
          <h2 className="text-2xl font-black uppercase italic text-red-900 mb-4 tracking-tight">Database Error</h2>
          <p className="text-red-800 mb-6 leading-relaxed">
            {error.includes('Supabase credentials') 
              ? "This app requires a Supabase connection to manage orders. Please configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
              : error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-[#1A202C]">Orders</h1>
          <p className="text-gray-500 font-medium">Track and fulfill customer requests.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                statusFilter === status 
                  ? "bg-[#4C35DE] text-white border-[#4C35DE] shadow-lg shadow-[#4C35DE]/20" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by customer name or Order ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-white shadow-sm font-medium"
          />
        </div>
        <button className="px-8 py-4 rounded-2xl border border-gray-100 font-bold flex items-center justify-center gap-3 hover:bg-white transition-all bg-white/50 shadow-sm">
          <Filter size={20} className="text-[#4C35DE]" /> 
          <span>Advanced Filter</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length > 0 ? filteredOrders.map((order) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;
          return (
            <div key={order.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-black/5 hover:shadow-black/10 transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#4C35DE] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-wrap items-start justify-between gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <h3 className="font-black text-2xl uppercase italic tracking-tighter text-[#1A202C]">
                      {order.customer_name}
                    </h3>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest",
                      status.bg, status.color, status.border
                    )}>
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span className="font-mono text-[#4C35DE]">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone size={12} /> {order.customer_phone}</span>
                    <span>•</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium max-w-md">{order.customer_address}</p>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Amount</p>
                    <p className="text-3xl font-black italic text-[#1A202C] tracking-tighter">{order.total_price.toLocaleString()} DA</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative group/menu">
                      <button className="p-4 bg-[#F3F4F7] hover:bg-[#4C35DE] text-gray-500 hover:text-white rounded-2xl transition-all active:scale-90">
                        <MoreVertical size={20} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[24px] shadow-2xl border border-gray-100 py-3 z-20 hidden group-hover/menu:block">
                        <p className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 mb-2">Update Status</p>
                        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            className={cn(
                              "w-full text-left px-6 py-3 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-3",
                              order.status === s ? "text-[#4C35DE] bg-[#4C35DE]/5" : "text-gray-600"
                            )}
                          >
                            <div className={cn("w-2 h-2 rounded-full", statusConfig[s].color.replace('text', 'bg'))}></div>
                            {statusConfig[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="p-4 bg-[#F3F4F7] hover:bg-[#4C35DE] text-gray-500 hover:text-white rounded-2xl transition-all active:scale-90">
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Preview */}
              <div className="mt-8 pt-8 border-t border-gray-50 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 bg-[#F3F4F7]/50 px-5 py-3 rounded-2xl shrink-0 border border-transparent hover:border-[#4C35DE]/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs font-black text-[#4C35DE] shadow-sm">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase italic tracking-tight text-[#1A202C]">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest">{item.price.toLocaleString()} DA</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }) : (
          <div className="py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="flex flex-col items-center gap-4 text-gray-300">
              <ShoppingBag size={64} strokeWidth={1} />
              <p className="text-xl font-bold italic">No orders found matching your criteria.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
