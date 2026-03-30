import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Plus,
  ChevronRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';
import StatsCard from '../components/admin/StatsCard';
import { Button } from '../components/ui/Button';

const data = [
  { name: 'Mon', sales: 4000, revenue: 2400 },
  { name: 'Tue', sales: 3000, revenue: 1398 },
  { name: 'Wed', sales: 2000, revenue: 9800 },
  { name: 'Thu', sales: 2780, revenue: 3908 },
  { name: 'Fri', sales: 1890, revenue: 4800 },
  { name: 'Sat', sales: 2390, revenue: 3800 },
  { name: 'Sun', sales: 3490, revenue: 4300 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    dailyOrders: 0,
    revenue: 0,
    activeWorkers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: orders, error: ordersError } = await supabase.from('orders').select('total_price');
        const { data: workers, error: workersError } = await supabase.from('workers').select('id');
        
        if (ordersError) throw ordersError;
        if (workersError) throw workersError;

        const revenue = orders?.reduce((acc, curr) => acc + Number(curr.total_price), 0) || 0;
        setStats({
          totalSales: orders?.length || 0,
          dailyOrders: Math.floor(Math.random() * 20), // Mock daily
          revenue,
          activeWorkers: workers?.length || 0
        });
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        setError(err.message || 'Failed to connect to the database');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-6">
        <div className="bg-purple-50 border border-purple-100 p-8 rounded-3xl">
          <h2 className="text-2xl font-black uppercase italic text-purple-900 mb-4 tracking-tight">Database Connection Required</h2>
          <p className="text-purple-800 mb-6 leading-relaxed">
            {error.includes('Supabase credentials') 
              ? "This app requires a Supabase connection to display dashboard metrics. Please configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel."
              : error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command Center</h1>
          <p className="text-gray-500">Real-time performance metrics for Strix.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/products">
            <Button variant="outline" size="sm" className="gap-2">
              <Package size={16} /> Products
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus size={16} /> New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={`${stats.revenue.toLocaleString()} DA`} 
          icon={<DollarSign className="text-green-600" />} 
          trend="+12.5%" 
          isUp={true} 
        />
        <StatsCard 
          title="Total Sales" 
          value={stats.totalSales.toString()} 
          icon={<TrendingUp className="text-blue-600" />} 
          trend="+8.2%" 
          isUp={true} 
        />
        <StatsCard 
          title="Daily Orders" 
          value={stats.dailyOrders.toString()} 
          icon={<Package className="text-purple-600" />} 
          trend="-2.4%" 
          isUp={false} 
        />
        <StatsCard 
          title="Active Team" 
          value={stats.activeWorkers.toString()} 
          icon={<Users className="text-purple-600" />} 
          trend="0%" 
          isUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold uppercase italic tracking-tight">Revenue Overview</h3>
            <select className="text-xs font-bold uppercase tracking-widest border-none focus:ring-0 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4C35DE" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4C35DE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4C35DE" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold uppercase italic tracking-tight">Recent Orders</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">
                    JD
                  </div>
                  <div>
                    <p className="text-sm font-bold">John Doe</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">2 mins ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{i * 120}.00 DA</p>
                  <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-black transition-colors" />
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin/orders" className="block text-center text-xs font-bold uppercase tracking-widest text-purple-600 hover:text-purple-700">
            View All Activity
          </Link>
        </div>
      </div>
    </div>
  );
}
