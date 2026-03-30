import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, isMock } from '../lib/supabaseClient';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Tag, 
  Truck, 
  ShieldCheck, 
  RefreshCw,
  Minus,
  Plus,
  ShoppingCart,
  Phone,
  MapPin,
  User,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_urls: string[];
  stock_quantity: number;
}

interface Wilaya {
  id: string;
  name: string;
}

interface Commune {
  id: string;
  name: string;
  wilaya_id: string;
}

interface CarrierConfig {
  id: string;
  token: string;
  enabled: boolean;
}

interface ManualRate {
  id: string;
  name: string;
  homeFee: number;
  hasStopdesk: boolean;
  stopdeskFee: number;
}

interface ShippingConfig {
  activeCarrier: 'yalidine' | 'zr' | 'nord_ouest' | 'procolis' | 'manual';
  carriers: {
    yalidine: CarrierConfig;
    zr: CarrierConfig;
    nord_ouest: CarrierConfig;
    procolis: CarrierConfig;
  };
  markupAmount: number;
  markupType: 'fixed' | 'percentage';
  enabled: boolean;
  manualRates: ManualRate[];
}

const DEFAULT_YALIDINE_ID = '723bc48271384896a20bd9652c97e081';
const DEFAULT_YALIDINE_TOKEN = '9cf201929eb6c87a50166b28f872a5cc21f7f1c537ab595d6d8ed5455c5ec7e7';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // COD Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'desk'>('home');
  const [availableFees, setAvailableFees] = useState<{home: number | null, desk: number | null}>({home: null, desk: null});
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [fetchingWilayas, setFetchingWilayas] = useState(false);
  const [fetchingCommunes, setFetchingCommunes] = useState(false);
  const [fetchingFees, setFetchingFees] = useState(false);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({
    activeCarrier: 'yalidine',
    carriers: {
      yalidine: { id: DEFAULT_YALIDINE_ID, token: DEFAULT_YALIDINE_TOKEN, enabled: true },
      zr: { id: '', token: '', enabled: false },
      nord_ouest: { id: '', token: '', enabled: false },
      procolis: { id: '', token: '', enabled: false },
    },
    markupAmount: 0,
    markupType: 'fixed',
    enabled: true,
    manualRates: []
  });

  // Helper to get API base URL based on carrier
  const getApiBaseUrl = (carrier: string) => {
    switch (carrier) {
      case 'yalidine': return 'https://api.yalidine.app/v1';
      case 'zr': return 'https://api.zrexpress.dz/api/v1';
      case 'nord_ouest': return 'https://api.nordouest.com/v1';
      case 'procolis': return 'https://procolis.com/api_v1';
      default: return 'https://api.yalidine.app/v1';
    }
  };

  useEffect(() => {
    async function fetchShippingConfig() {
      try {
        if (isMock) {
          const saved = localStorage.getItem('strix_shipping_config');
          if (saved) {
            const parsed = JSON.parse(saved);
            setShippingConfig({ ...parsed, manualRates: parsed.manualRates || [] });
          }
          return;
        }

        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'shipping_config')
          .single();
        
        if (data && data.value) {
          const fetchedConfig = data.value;
          // Migration: If old structure or missing critical fields, convert to new one
          if (!fetchedConfig.carriers || !fetchedConfig.activeCarrier) {
            setShippingConfig({
              activeCarrier: fetchedConfig.activeCarrier || 'yalidine',
              carriers: fetchedConfig.carriers || {
                yalidine: { id: fetchedConfig.yalidineId || DEFAULT_YALIDINE_ID, token: fetchedConfig.yalidineToken || DEFAULT_YALIDINE_TOKEN, enabled: true },
                zr: { id: '', token: '', enabled: false },
                nord_ouest: { id: '', token: '', enabled: false },
                procolis: { id: '', token: '', enabled: false },
              },
              markupAmount: fetchedConfig.markupAmount || 0,
              markupType: fetchedConfig.markupType || 'fixed',
              enabled: fetchedConfig.enabled !== undefined ? fetchedConfig.enabled : true,
              manualRates: fetchedConfig.manualRates || []
            });
          } else {
            setShippingConfig({
              ...fetchedConfig,
              manualRates: fetchedConfig.manualRates || []
            });
          }
        }
      } catch (err) {
        console.warn('Using default shipping config');
      }
    }
    fetchShippingConfig();
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      try {
        if (!id) return;
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (data) setProduct(data);
      } catch (err: any) {
        console.error('Error fetching product:', err);
        toast.error('Product not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, navigate]);

  // Fetch Wilayas on mount and when config changes
  useEffect(() => {
    async function fetchWilayas() {
      if (!shippingConfig.enabled) return;
      
      if (shippingConfig.activeCarrier === 'manual') {
        setWilayas((shippingConfig.manualRates || []).map(r => ({ id: r.id, name: r.name })));
        setFetchingWilayas(false);
        return;
      }

      const activeCarrier = shippingConfig.carriers?.[shippingConfig.activeCarrier];
      if (!activeCarrier || !activeCarrier.id || !activeCarrier.token) return;

      setFetchingWilayas(true);
      try {
        const baseUrl = getApiBaseUrl(shippingConfig.activeCarrier);
        const response = await fetch('/api/shipping-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${baseUrl}/wilayas`,
            headers: {
              'X-API-ID': activeCarrier.id,
              'X-API-TOKEN': activeCarrier.token
            }
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Shipping Proxy Error Details:', errorData);
          throw new Error(errorData.error?.message || errorData.message || 'Failed to fetch wilayas');
        }
        const data = await response.json();
        if (data.data) {
          setWilayas(data.data.map((w: any) => ({ id: w.id, name: w.name })));
        }
      } catch (err: any) {
        console.error('Error fetching wilayas:', err);
        toast.error(`Shipping Error: ${err.message}`);
      } finally {
        setFetchingWilayas(false);
      }
    }
    fetchWilayas();
  }, [shippingConfig.enabled, shippingConfig.activeCarrier, shippingConfig.carriers]);

  // Fetch Communes when Wilaya changes
  useEffect(() => {
    if (!selectedWilaya) {
      setCommunes([]);
      setSelectedCommune('');
      return;
    }

    async function fetchCommunes() {
      if (shippingConfig.activeCarrier === 'manual') {
        setCommunes([]);
        setSelectedCommune('');
        setFetchingCommunes(false);
        return;
      }

      const activeCarrier = shippingConfig.carriers?.[shippingConfig.activeCarrier];
      if (!activeCarrier) return;
      setFetchingCommunes(true);
      try {
        const baseUrl = getApiBaseUrl(shippingConfig.activeCarrier);
        const response = await fetch('/api/shipping-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${baseUrl}/communes?wilaya_id=${selectedWilaya}`,
            headers: {
              'X-API-ID': activeCarrier.id,
              'X-API-TOKEN': activeCarrier.token
            }
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Shipping Proxy Error Details:', errorData);
          throw new Error(errorData.error?.message || errorData.message || 'Failed to fetch communes');
        }
        const data = await response.json();
        if (data.data) {
          setCommunes(data.data.map((c: any) => ({ id: c.id, name: c.name, wilaya_id: c.wilaya_id })));
        }
      } catch (err: any) {
        console.error('Error fetching communes:', err);
        toast.error(`Shipping Error: ${err.message}`);
      } finally {
        setFetchingCommunes(false);
      }
    }

    fetchCommunes();
  }, [selectedWilaya, shippingConfig.activeCarrier, shippingConfig.carriers]);

  // Fetch Fees when Wilaya or Commune changes
  useEffect(() => {
    if (!selectedWilaya) {
      setAvailableFees({ home: null, desk: null });
      return;
    }

    async function fetchFees() {
      setFetchingFees(true);
      
      if (shippingConfig.activeCarrier === 'manual') {
        const rate = shippingConfig.manualRates?.find(r => r.id === selectedWilaya);
        if (rate) {
          setAvailableFees({
            home: rate.homeFee,
            desk: rate.hasStopdesk ? rate.stopdeskFee : null
          });
          if (deliveryMethod === 'desk' && !rate.hasStopdesk) {
            setDeliveryMethod('home');
          }
        } else {
          setAvailableFees({ home: null, desk: null });
        }
        setFetchingFees(false);
        return;
      }

      const activeCarrier = shippingConfig.carriers?.[shippingConfig.activeCarrier];
      if (!activeCarrier) return;
      try {
        const baseUrl = getApiBaseUrl(shippingConfig.activeCarrier);
        const url = selectedCommune 
          ? `${baseUrl}/shippingfees?wilaya_id=${selectedWilaya}&commune_id=${selectedCommune}`
          : `${baseUrl}/shippingfees?wilaya_id=${selectedWilaya}`;
          
        const response = await fetch('/api/shipping-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            headers: {
              'X-API-ID': activeCarrier.id,
              'X-API-TOKEN': activeCarrier.token
            }
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Shipping Proxy Error Details:', errorData);
          throw new Error(errorData.error?.message || errorData.message || 'Failed to fetch shipping fees');
        }
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const homeFee = data.data[0].home_fee ? Number(data.data[0].home_fee) : null;
          const deskFee = data.data[0].desk_fee ? Number(data.data[0].desk_fee) : null;
          
          setAvailableFees({ home: homeFee, desk: deskFee });
          
          if (deliveryMethod === 'desk' && deskFee === null) {
            setDeliveryMethod('home');
          }
        }
      } catch (err: any) {
        console.error('Error fetching fees:', err);
        toast.error(`Shipping Error: ${err.message}`);
      } finally {
        setFetchingFees(false);
      }
    }

    fetchFees();
  }, [selectedWilaya, selectedCommune, shippingConfig.activeCarrier, shippingConfig.carriers, shippingConfig.manualRates]);

  // Calculate final shipping fee based on delivery method and markup
  useEffect(() => {
    const baseFee = deliveryMethod === 'desk' ? availableFees.desk : availableFees.home;
    if (baseFee === null || baseFee === undefined) {
      setShippingFee(null);
      return;
    }
    
    let finalFee = baseFee;
    if (shippingConfig.markupType === 'fixed') {
      finalFee += shippingConfig.markupAmount;
    } else {
      finalFee += (baseFee * (shippingConfig.markupAmount / 100));
    }
    
    setShippingFee(finalFee);
  }, [availableFees, deliveryMethod, shippingConfig.markupAmount, shippingConfig.markupType]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    return (product.price * quantity) + (shippingFee || 0);
  }, [product, quantity, shippingFee]);

  const handleAddToCart = async () => {
    if (!customerName || !customerPhone || !selectedWilaya || (shippingConfig.activeCarrier !== 'manual' && !selectedCommune)) {
      toast.error('Please fill in all delivery details');
      return;
    }

    setAddingToCart(true);
    try {
      const wilayaName = wilayas.find(w => w.id === selectedWilaya)?.name;
      const communeName = shippingConfig.activeCarrier === 'manual' ? '' : communes.find(c => c.id === selectedCommune)?.name;
      const address = shippingConfig.activeCarrier === 'manual' ? wilayaName : `${wilayaName}, ${communeName}`;
      
      const { error } = await supabase
        .from('orders')
        .insert([{
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: address,
          total_price: totalPrice,
          status: 'pending',
          items: [{
            product_id: product?.id,
            name: product?.name,
            quantity: quantity,
            price: product?.price
          }]
        }]);

      if (error) throw error;

      toast.success('Order placed successfully! We will contact you soon.');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedWilaya('');
      setSelectedCommune('');
      setShippingFee(null);
    } catch (err: any) {
      console.error('Error placing order:', err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-purple-600 transition-colors">
          <ArrowLeft size={18} /> Back to Shop
        </Link>
        <Link to="/" className="text-2xl font-black tracking-tighter uppercase italic absolute left-1/2 -translate-x-1/2">
          Strix
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="rounded-full">
            <ShoppingBag size={18} className="mr-2" /> Cart (0)
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Product Images */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="aspect-[4/5] rounded-[40px] overflow-hidden bg-white border border-gray-100 shadow-sm">
              <img 
                src={product.image_urls?.[0] || `https://picsum.photos/seed/${product.id}/1200/1500`} 
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Thumbnail Grid (if multiple images existed) */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white border border-gray-100 overflow-hidden cursor-pointer hover:border-purple-600 transition-colors">
                  <img 
                    src={`https://picsum.photos/seed/${product.id}-${i}/300/300`} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Tag size={10} /> {product.category}
                </span>
                {product.stock_quantity > 0 ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    In Stock
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Out of Stock
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                {product.name}
              </h1>
              <p className="text-3xl font-black text-purple-600">{product.price.toLocaleString()} DA</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || "No description available for this premium streetwear piece. Designed for style and comfort."}
              </p>
            </div>

            {/* Selection Controls */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              {shippingConfig.enabled ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <User size={12} /> Full Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 outline-none font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Phone size={12} /> Phone Number
                    </label>
                    <input 
                      type="tel" 
                      placeholder="05 / 06 / 07 ..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 outline-none font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <MapPin size={12} /> Wilaya
                    </label>
                    <select 
                      value={selectedWilaya}
                      onChange={(e) => setSelectedWilaya(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 outline-none font-medium text-sm bg-white"
                      disabled={fetchingWilayas}
                    >
                      <option value="">Select Wilaya</option>
                      {wilayas.map(w => (
                        <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <MapPin size={12} /> Commune
                    </label>
                    <select 
                      value={selectedCommune}
                      onChange={(e) => setSelectedCommune(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 outline-none font-medium text-sm bg-white"
                      disabled={!selectedWilaya || fetchingCommunes || shippingConfig.activeCarrier === 'manual'}
                    >
                      <option value="">{shippingConfig.activeCarrier === 'manual' ? 'N/A' : 'Select Commune'}</option>
                      {communes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Method Toggle */}
                {selectedWilaya && (availableFees.home !== null || availableFees.desk !== null) && (
                  <div className="flex gap-4 p-1 bg-gray-100 rounded-xl w-fit">
                    {availableFees.home !== null && (
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('home')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                          deliveryMethod === 'home' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Home Delivery
                      </button>
                    )}
                    {availableFees.desk !== null && (
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('desk')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                          deliveryMethod === 'desk' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Stopdesk
                      </button>
                    )}
                  </div>
                )}

                {shippingFee !== null && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex justify-between items-center"
                  >
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">Delivery Fee</span>
                    <span className="font-black text-purple-900">{shippingFee.toLocaleString()} DA</span>
                  </motion.div>
                )}
              </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 items-center">
                  <Truck size={20} className="text-amber-600" />
                  <p className="text-xs text-amber-800 font-medium">Shipping calculation is currently unavailable. Please contact us for delivery details.</p>
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="flex items-center border border-gray-200 rounded-full p-1 bg-white">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <Button 
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock_quantity === 0 || fetchingFees || !shippingConfig.enabled}
                  className="flex-1 rounded-full h-14 text-lg gap-3 bg-black hover:bg-purple-600 transition-all"
                >
                  {addingToCart ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      {!shippingConfig.enabled ? 'Ordering Unavailable' : `Confirm Order (${totalPrice.toLocaleString()} DA)`}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <div className="p-4 rounded-2xl bg-white border border-gray-100 space-y-2">
                <Truck size={20} className="text-purple-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Fast Shipping</p>
                <p className="text-[10px] text-gray-400">2-4 Business Days</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100 space-y-2">
                <ShieldCheck size={20} className="text-purple-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Secure Payment</p>
                <p className="text-[10px] text-gray-400">SSL Encrypted</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100 space-y-2">
                <RefreshCw size={20} className="text-purple-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Easy Returns</p>
                <p className="text-[10px] text-gray-400">30 Day Window</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
