import { useState, useEffect } from 'react';
import { supabase, isMock } from '../lib/supabaseClient';
import { ArrowRight, ShoppingBag, LayoutDashboard, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import ProductCard from '../components/store/ProductCard';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_urls: string[];
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (supabaseError) throw supabaseError;
        if (data) setProducts(data);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to connect to the database');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Only show error if it's NOT a mock mode issue (since mock mode handles it now)
  if (error && !isMock) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-6">
        <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl">
          <h2 className="text-2xl font-black uppercase italic text-orange-900 mb-4 tracking-tight">Database Connection Required</h2>
          <p className="text-orange-800 mb-6 leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {isMock && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-center gap-2 text-amber-800 text-xs font-medium">
          <AlertTriangle size={14} className="text-amber-600" />
          <span><strong>Demo Mode:</strong> Supabase is not configured. Data is stored locally.</span>
          <Link to="/admin" className="underline font-bold ml-2">Setup in Admin</Link>
        </div>
      )}
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-black tracking-tighter uppercase italic">
            Strix
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link to="/" className="hover:text-black transition-colors">Shop</Link>
            <Link to="/admin" className="hover:text-black transition-colors flex items-center gap-2">
              <LayoutDashboard size={16} /> Admin
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="rounded-full">
            <ShoppingBag size={18} className="mr-2" /> Cart (0)
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <section className="relative h-[60vh] rounded-[40px] overflow-hidden bg-black flex items-center px-12">
          <img 
            src="https://picsum.photos/seed/streetwear/1920/1080" 
            alt="Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10 max-w-2xl space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-black text-white uppercase italic leading-none tracking-tighter"
            >
              Drop <span className="text-purple-500">001</span><br />Available Now
            </motion.h1>
            <p className="text-gray-300 text-lg max-w-md font-medium">
              Limited edition technical streetwear designed for the modern urban explorer.
            </p>
            <Button variant="secondary" size="lg" className="rounded-full px-8">
              Shop Collection <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </section>

        {/* Featured Products */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black uppercase italic tracking-tight">New Arrivals</h2>
              <p className="text-gray-500 font-medium">Fresh technical gear for the streets.</p>
            </div>
            <div className="flex gap-2">
              {['All', 'Outerwear', 'Tees', 'Accessories'].map(cat => (
                <Button key={cat} variant="outline" size="sm" className="rounded-full px-6">
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.length > 0 ? products.map((product) => (
              <ProductCard key={product.id} product={product} />
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-[40px]">
                <p className="text-gray-400 font-bold italic">No products found. Add some in the Admin Dashboard!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 mt-20 py-12 px-6 text-center text-gray-400 text-sm font-medium">
        <p>© 2026 Strix. High-Performance Streetwear.</p>
      </footer>
    </div>
  );
}
