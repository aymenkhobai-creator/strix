import React, { useState, useEffect } from 'react';
import { Truck, Save, Loader2, Key, DollarSign, Info } from 'lucide-react';
import { supabase, isMock } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface CarrierConfig {
  id: string;
  token: string;
  enabled: boolean;
}

interface ShippingConfig {
  activeCarrier: 'yalidine' | 'zr' | 'nord_ouest' | 'procolis';
  carriers: {
    yalidine: CarrierConfig;
    zr: CarrierConfig;
    nord_ouest: CarrierConfig;
    procolis: CarrierConfig;
  };
  markupAmount: number;
  markupType: 'fixed' | 'percentage';
  enabled: boolean;
}

export default function ShippingSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<ShippingConfig>({
    activeCarrier: 'yalidine',
    carriers: {
      yalidine: { id: '', token: '', enabled: true },
      zr: { id: '', token: '', enabled: false },
      nord_ouest: { id: '', token: '', enabled: false },
      procolis: { id: '', token: '', enabled: false },
    },
    markupAmount: 0,
    markupType: 'fixed',
    enabled: true
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        if (isMock) {
          const saved = localStorage.getItem('strix_shipping_config');
          if (saved) setConfig(JSON.parse(saved));
          return;
        }

        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'shipping_config')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data && data.value) {
          const fetchedConfig = data.value;
          if (!fetchedConfig.carriers || !fetchedConfig.activeCarrier) {
            setConfig({
              activeCarrier: fetchedConfig.activeCarrier || 'yalidine',
              carriers: fetchedConfig.carriers || {
                yalidine: { id: fetchedConfig.yalidineId || '', token: fetchedConfig.yalidineToken || '', enabled: true },
                zr: { id: '', token: '', enabled: false },
                nord_ouest: { id: '', token: '', enabled: false },
                procolis: { id: '', token: '', enabled: false },
              },
              markupAmount: fetchedConfig.markupAmount || 0,
              markupType: fetchedConfig.markupType || 'fixed',
              enabled: fetchedConfig.enabled !== undefined ? fetchedConfig.enabled : true
            });
          } else {
            setConfig(fetchedConfig);
          }
        }
      } catch (err) {
        console.error('Error fetching shipping config:', err);
        toast.error('Failed to load shipping settings');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isMock) {
        localStorage.setItem('strix_shipping_config', JSON.stringify(config));
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key: 'shipping_config', 
            value: config,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });

        if (error) throw error;
      }
      toast.success('Shipping settings updated successfully');
    } catch (err) {
      console.error('Error saving shipping config:', err);
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
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-[#1A202C]">Shipping Logistics</h1>
        <p className="text-gray-500 font-medium tracking-tight">Connect your shipping carrier and manage delivery pricing.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Carrier Selection */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4C35DE]/10 flex items-center justify-center text-[#4C35DE]">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#1A202C]">Active Carrier</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Select your primary shipping provider</p>
            </div>
          </div>
          
          <div className="p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'yalidine', name: 'Yalidine' },
                { id: 'zr', name: 'ZR Express' },
                { id: 'nord_ouest', name: 'Nord et Ouest' },
                { id: 'procolis', name: 'ProColis' }
              ].map(carrier => (
                <button
                  key={carrier.id}
                  type="button"
                  onClick={() => setConfig({ ...config, activeCarrier: carrier.id as any })}
                  className={`p-6 rounded-3xl border-2 transition-all text-center space-y-2 ${
                    config.activeCarrier === carrier.id 
                      ? 'border-[#4C35DE] bg-[#4C35DE]/5 text-[#4C35DE]' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-400'
                  }`}
                >
                  <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${
                    config.activeCarrier === carrier.id ? 'bg-[#4C35DE] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Truck size={20} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest">{carrier.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4C35DE]/10 flex items-center justify-center text-[#4C35DE]">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#1A202C]">
                {config.activeCarrier === 'yalidine' ? 'Yalidine' : 
                 config.activeCarrier === 'zr' ? 'ZR Express' : 
                 config.activeCarrier === 'nord_ouest' ? 'Nord et Ouest' : 'ProColis'} API
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carrier integration credentials</p>
            </div>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">API ID / KEY</label>
                <input 
                  type="text" 
                  value={config.carriers?.[config.activeCarrier]?.id || ''}
                  onChange={e => setConfig({
                    ...config, 
                    carriers: {
                      ...config.carriers,
                      [config.activeCarrier]: { 
                        ...(config.carriers?.[config.activeCarrier] || { id: '', token: '', enabled: false }), 
                        id: e.target.value 
                      }
                    }
                  })}
                  placeholder={`Enter ${config.activeCarrier} API ID`}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">API TOKEN / SECRET</label>
                <input 
                  type="password" 
                  value={config.carriers?.[config.activeCarrier]?.token || ''}
                  onChange={e => setConfig({
                    ...config, 
                    carriers: {
                      ...config.carriers,
                      [config.activeCarrier]: { 
                        ...(config.carriers?.[config.activeCarrier] || { id: '', token: '', enabled: false }), 
                        token: e.target.value 
                      }
                    }
                  })}
                  placeholder={`Enter ${config.activeCarrier} API Token`}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                />
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4">
              <Info className="text-blue-500 shrink-0" size={20} />
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                These credentials allow the system to fetch real-time Wilayas, Communes, and shipping fees from the selected carrier.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Adjustments */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4C35DE]/10 flex items-center justify-center text-[#4C35DE]">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#1A202C]">Pricing Markup</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Adjust carrier rates for customers</p>
            </div>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Markup Type</label>
                <select 
                  value={config.markupType}
                  onChange={e => setConfig({...config, markupType: e.target.value as 'fixed' | 'percentage'})}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold appearance-none"
                >
                  <option value="fixed">Fixed Amount (DA)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Markup Value</label>
                <input 
                  type="number" 
                  value={config.markupAmount}
                  onChange={e => setConfig({...config, markupAmount: Number(e.target.value)})}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#1A202C]">Enable Shipping Integration</h3>
                <p className="text-xs text-gray-400 font-medium">Toggle real-time shipping calculation on the storefront.</p>
              </div>
              <button 
                type="button"
                onClick={() => setConfig({...config, enabled: !config.enabled})}
                className={`w-14 h-8 rounded-full transition-all relative ${config.enabled ? 'bg-[#4C35DE]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${config.enabled ? 'left-7' : 'left-1'}`} />
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
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save size={22} />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
