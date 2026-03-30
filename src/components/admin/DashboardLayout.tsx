import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  User,
  Truck
} from 'lucide-react';
import { supabase, isMock } from '../../lib/supabaseClient';
import { cn } from '../../lib/utils';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface WorkerProfile {
  name: string;
  role: string;
  email: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: Truck, label: 'Shipping', path: '/admin/shipping' },
  { icon: Users, label: 'Team', path: '/admin/workers' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function getProfile() {
      if (isMock) {
        setProfile({
          name: 'Strix Admin',
          role: 'Seller',
          email: 'admin@strix.com'
        });
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('workers')
          .select('name, role, email')
          .eq('email', user.email)
          .single();
        
        if (data) {
          setProfile(data);
        } else {
          // Fallback if not in workers table yet
          setProfile({
            name: user.email?.split('@')[0] || 'User',
            role: 'Seller',
            email: user.email || ''
          });
        }
      }
    }
    getProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const currentPageTitle = navItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-[#F3F4F7] flex font-sans text-[#2D3748]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#4C35DE] text-white transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#4C35DE] font-black text-2xl italic">
              S
            </div>
            <span className="text-2xl font-black tracking-tight italic">Strix</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden ml-auto p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 group",
                    isActive 
                      ? "bg-white text-[#4C35DE] shadow-lg shadow-black/10" 
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon size={22} className={cn(isActive ? "text-[#4C35DE]" : "text-white/70 group-hover:text-white")} />
                  <span className="font-bold tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer / Logout */}
          <div className="p-4 border-t border-white/10">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={22} />
              <span className="font-bold tracking-tight">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white px-8 py-4 flex flex-col shadow-sm border-b border-gray-100">
          {isMock && (
            <div className="mb-4 -mx-8 -mt-4 bg-amber-50 border-b border-amber-100 px-8 py-2 flex items-center justify-between text-amber-800 text-xs font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>
                  <strong>Demo Mode:</strong> Supabase is not configured. Data is stored locally in your browser.
                </span>
              </div>
              <a 
                href="https://supabase.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline font-bold"
              >
                Setup Supabase <ExternalLink size={12} />
              </a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#1A202C]">
                {currentPageTitle}
              </h2>
            </div>

            <div className="flex items-center gap-8">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-4 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search something here..." 
                className="bg-[#F3F4F7] border-none rounded-full pl-12 pr-6 py-2.5 w-72 text-sm focus:ring-2 focus:ring-[#4C35DE] outline-none"
              />
            </div>

            {/* Notifications & Profile */}
            <div className="flex items-center gap-6">
              <button className="relative p-2 text-gray-400 hover:text-[#4C35DE] transition-colors">
                <Bell size={22} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-[#1A202C]">{profile?.name || 'Loading...'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4C35DE]">{profile?.role || 'Admin'}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#4C35DE]/10 flex items-center justify-center text-[#4C35DE]">
                  <User size={24} />
                </div>
              </div>
            </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
