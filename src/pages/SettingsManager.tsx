import React, { useState } from 'react';
import { Save, Store, Mail, Globe, Bell, Shield, Palette, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function SettingsManager() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'Jobie Store',
    storeEmail: 'contact@jobie.com',
    currency: 'DA',
    notifications: true,
    maintenanceMode: false,
    theme: 'light'
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-[#1A202C]">Settings</h1>
        <p className="text-gray-500 font-medium">Configure your store preferences and global variables.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4C35DE]/10 flex items-center justify-center text-[#4C35DE]">
              <Store size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#1A202C]">General Info</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Basic store identity</p>
            </div>
          </div>
          
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Store Name</label>
              <div className="relative">
                <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" 
                  value={settings.storeName}
                  onChange={e => setSettings({...settings, storeName: e.target.value})}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Support Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="email" 
                  value={settings.storeEmail}
                  onChange={e => setSettings({...settings, storeEmail: e.target.value})}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Currency</label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  value={settings.currency}
                  onChange={e => setSettings({...settings, currency: e.target.value})}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold appearance-none"
                >
                  <option value="DZD">DZD (Algerian Dinar)</option>
                  <option value="DA">DA (Dinar Algérien)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Default Theme</label>
              <div className="relative">
                <Palette className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  value={settings.theme}
                  onChange={e => setSettings({...settings, theme: e.target.value})}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold appearance-none"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4C35DE]/10 flex items-center justify-center text-[#4C35DE]">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#1A202C]">Preferences</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">System behavior</p>
            </div>
          </div>
          
          <div className="p-10 space-y-6">
            <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A202C]">Email Notifications</h3>
                  <p className="text-xs text-gray-400 font-medium">Receive alerts for new orders and system updates.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSettings({...settings, notifications: !settings.notifications})}
                className={cn(
                  "w-14 h-8 rounded-full transition-all relative",
                  settings.notifications ? "bg-[#4C35DE]" : "bg-gray-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm",
                  settings.notifications ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/50 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A202C]">Maintenance Mode</h3>
                  <p className="text-xs text-gray-400 font-medium">Disable the storefront for public visitors.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={cn(
                  "w-14 h-8 rounded-full transition-all relative",
                  settings.maintenanceMode ? "bg-red-500" : "bg-gray-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm",
                  settings.maintenanceMode ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-[#4C35DE] text-white px-12 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#3B28B8] transition-all shadow-xl shadow-[#4C35DE]/20 active:scale-95 disabled:opacity-50 min-w-[200px]"
          >
            {isSaving ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={22} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
