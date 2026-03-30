import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Plus,
  ChevronRight,
  Calendar,
  Truck,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  ShoppingBag
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
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';

const data = [
  { name: 'Week 01', application: 4000, interviews: 2400 },
  { name: 'Week 02', application: 3000, interviews: 1398 },
  { name: 'Week 03', application: 2000, interviews: 9800 },
  { name: 'Week 04', application: 2780, interviews: 3908 },
  { name: 'Week 05', application: 1890, interviews: 4800 },
  { name: 'Week 06', application: 2390, interviews: 3800 },
  { name: 'Week 07', application: 3490, interviews: 4300 },
];

export default function DashboardHome() {
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
          dailyOrders: Math.floor(Math.random() * 20),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4C35DE]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-6">
        <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl">
          <h2 className="text-2xl font-black uppercase italic text-orange-900 mb-4 tracking-tight">Database Connection Required</h2>
          <p className="text-orange-800 mb-6 leading-relaxed">
            {error.includes('Supabase credentials') 
              ? "This app requires a Supabase connection to display dashboard metrics. Please configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel."
              : error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Orders Pending" 
          value="86" 
          icon={<Calendar size={24} />} 
          color="bg-[#4C35DE]" 
        />
        <StatCard 
          title="Orders in Delivery" 
          value="75" 
          icon={<Truck size={24} />} 
          color="bg-[#1E3A8A]" 
        />
        <StatCard 
          title="Orders Delivered" 
          value="45,673" 
          icon={<CheckCircle2 size={24} />} 
          color="bg-[#60A5FA]" 
        />
        <StatCard 
          title="Rejected Orders" 
          value="93" 
          icon={<XCircle size={24} />} 
          color="bg-[#EF4444]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase italic tracking-tight text-[#1A202C]">Sales Stats</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4C35DE]"></div>
                <span className="text-xs font-bold text-gray-400">Orders Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                <span className="text-xs font-bold text-gray-400">Delivered</span>
              </div>
              <select className="text-xs font-bold uppercase tracking-widest border-none bg-[#F3F4F7] rounded-full px-4 py-2 focus:ring-0 cursor-pointer">
                <option>This Month</option>
                <option>Last 30 Days</option>
              </select>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4C35DE" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4C35DE" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="application" stroke="#4C35DE" strokeWidth={4} fillOpacity={1} fill="url(#colorApp)" />
                <Area type="monotone" dataKey="interviews" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorInt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profile Card Section */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-[#4C35DE] p-1">
              <img 
                src="https://picsum.photos/seed/strix/200/200" 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#4C35DE] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Seller
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic uppercase tracking-tight text-[#1A202C]">Strix Admin</h3>
            <p className="text-sm text-gray-400 font-bold">Store Owner</p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full pt-4">
            <CircularProgress value={66} label="Sales" color="text-orange-500" />
            <CircularProgress value={31} label="Service" color="text-green-500" />
            <CircularProgress value={7} label="Quality" color="text-blue-500" />
          </div>

          <div className="w-full pt-8 space-y-6 text-left">
            <h4 className="text-sm font-black uppercase italic tracking-tight text-[#1A202C]">Recent Activities</h4>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-start group cursor-pointer">
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F7] flex items-center justify-center text-[#4C35DE] group-hover:bg-[#4C35DE] group-hover:text-white transition-all">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A202C]">New order received from customer</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">12h ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={cn("p-8 rounded-[40px] text-white flex items-center justify-between shadow-lg shadow-black/5", color)}>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</p>
        <p className="text-4xl font-black italic tracking-tighter">{value}</p>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function CircularProgress({ value, label, color }: { value: number, label: string, color: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-100"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black italic">
          {value}%
        </span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
}
