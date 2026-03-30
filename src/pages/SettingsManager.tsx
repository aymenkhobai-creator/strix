import React, { useState, useEffect, useRef } from 'react';
import { Save, Store, Mail, Globe, Bell, Shield, Palette, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { supabase, isMock } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function SettingsManager() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    storeName: 'Jobie Store',
    storeEmail: 'contact@jobie.com',
    currency: 'DA',
    notifications: true,
    maintenanceMode: false,
    theme: 'light',
    heroImage: 'https://picsum.photos/seed/streetwear/1920/1080',
    storeLogo: ''
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        if (isMock) {
          const saved = localStorage.getItem('strix_store_settings');
          if (saved) {
            setSettings({ ...settings, ...JSON.parse(saved) });
          }
          return;
        }

        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'store_settings')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data && data.value) {
          setSettings({ ...settings, ...data.value });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'hero') setIsUploadingHero(true);
    else setIsUploadingLogo(true);

    try {
      if (isMock) {
        // In mock mode, just use a local object URL
        const url = URL.createObjectURL(file);
        setSettings({ ...settings, [type === 'hero' ? 'heroImage' : 'storeLogo']: url });
        toast.success(`${type === 'hero' ? 'Hero image' : 'Logo'} updated locally`);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setSettings({ ...settings, [type === 'hero' ? 'heroImage' : 'storeLogo']: publicUrl });
      toast.success(`${type === 'hero' ? 'Hero image' : 'Logo'} uploaded successfully`);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      toast.error(`Failed to upload ${type}`);
    } finally {
      if (type === 'hero') setIsUploadingHero(false);
      else setIsUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (isMock) {
        localStorage.setItem('strix_store_settings', JSON.stringify(settings));
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key: 'store_settings', 
            value: settings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });

        if (error) throw error;
      }
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#4C35DE]" size={32} />
      </div>
    );
  }

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
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Store Logo</label>
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="relative h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-[#4C35DE]/50 transition-all overflow-hidden group"
                >
                  {settings.storeLogo ? (
                    <>
                      <img src={settings.storeLogo} alt="Store Logo" className="h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <>
                      {isUploadingLogo ? <Loader2 className="animate-spin text-gray-400 mb-2" size={24} /> : <ImageIcon className="text-gray-400 mb-2" size={24} />}
                      <span className="text-xs font-bold text-gray-500">Upload Logo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={logoInputRef}
                    onChange={e => handleImageUpload(e, 'logo')}
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Hero Banner Image</label>
                <div 
                  onClick={() => heroInputRef.current?.click()}
                  className="relative h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-[#4C35DE]/50 transition-all overflow-hidden group"
                >
                  {settings.heroImage ? (
                    <>
                      <img src={settings.heroImage} alt="Hero Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <>
                      {isUploadingHero ? <Loader2 className="animate-spin text-gray-400 mb-2" size={24} /> : <ImageIcon className="text-gray-400 mb-2" size={24} />}
                      <span className="text-xs font-bold text-gray-500">Upload Hero Image</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={heroInputRef}
                    onChange={e => handleImageUpload(e, 'hero')}
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>

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
