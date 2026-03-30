import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Edit3, Search, Filter, X, Image as ImageIcon, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_urls: string[];
}

const CATEGORIES = ['Hoodies', 'T-shirts', 'Pants', 'Accessories', 'Outerwear'];

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Outerwear',
    stock_quantity: 0,
    image_urls: []
  });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'Hoodies',
      stock_quantity: 0,
      image_urls: []
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalFormData = { ...formData };

      if (selectedFile) {
        const imageUrl = await uploadImage(selectedFile);
        if (imageUrl) {
          finalFormData.image_urls = [imageUrl];
        } else {
          setIsSubmitting(false);
          return;
        }
      }

      if (editingProduct) {
        const { error: supabaseError } = await supabase
          .from('products')
          .update(finalFormData)
          .eq('id', editingProduct.id);
        
        if (supabaseError) throw supabaseError;
        toast.success('Product updated successfully');
      } else {
        const { error: supabaseError } = await supabase
          .from('products')
          .insert([finalFormData]);
        
        if (supabaseError) throw supabaseError;
        toast.success('Product added successfully');
      }
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error: supabaseError } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (supabaseError) throw supabaseError;
        toast.success('Product deleted');
        fetchProducts();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete product');
      }
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              ? "This app requires a Supabase connection. Please configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
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
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-[#1A202C]">Inventory</h1>
          <p className="text-gray-500 font-medium">Manage your technical gear and stock levels.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#4C35DE] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#3B28B8] transition-all shadow-lg shadow-[#4C35DE]/20 active:scale-95"
        >
          <Plus size={22} /> 
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or category..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] focus:border-transparent outline-none transition-all bg-white shadow-sm font-medium"
          />
        </div>
        <button className="px-8 py-4 rounded-2xl border border-gray-100 font-bold flex items-center justify-center gap-3 hover:bg-white transition-all bg-white/50 shadow-sm">
          <Filter size={20} className="text-[#4C35DE]" /> 
          <span>Filter</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product Info</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Category</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Price</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inventory</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#F3F4F7]/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                        <img 
                          src={product.image_urls[0] || `https://picsum.photos/seed/${product.id}/200/200`} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-base uppercase italic tracking-tight text-[#1A202C] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-1">
                          {product.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 rounded-xl bg-[#4C35DE]/5 text-[#4C35DE] text-[10px] font-black uppercase tracking-widest border border-[#4C35DE]/10">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-lg text-[#1A202C]">{product.price.toLocaleString()} DA</td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter">
                        <span className={product.stock_quantity < 10 ? 'text-red-500' : 'text-gray-400'}>
                          {product.stock_quantity < 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                        <span>{product.stock_quantity} units</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            product.stock_quantity < 10 ? 'bg-red-500' : 'bg-[#4C35DE]'
                          )}
                          style={{ width: `${Math.min((product.stock_quantity / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-3 bg-white hover:bg-[#4C35DE] text-gray-400 hover:text-white rounded-xl border border-gray-100 hover:border-[#4C35DE] transition-all shadow-sm active:scale-90"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-3 bg-white hover:bg-red-500 text-gray-400 hover:text-white rounded-xl border border-gray-100 hover:border-red-500 transition-all shadow-sm active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-400">
                      <Package size={48} strokeWidth={1} />
                      <p className="font-bold italic">No products found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-[#0A0B1E]/80 backdrop-blur-md" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] p-10 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#1A202C]">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-gray-400 font-medium">Enter the technical specifications below.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Product Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Tech Shell Jacket"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Price (DA)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="0.00"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Stock Quantity</label>
                  <input 
                    required
                    type="number" 
                    placeholder="0"
                    value={formData.stock_quantity}
                    onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Description</label>
                <textarea 
                  placeholder="Describe the technical features..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold h-32 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Product Image</label>
                <div className="flex flex-col gap-4">
                  {formData.image_urls?.[0] && !selectedFile && (
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border border-gray-100">
                      <img 
                        src={formData.image_urls[0]} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {selectedFile && (
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 relative group">
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label 
                      htmlFor="product-image-upload"
                      className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#4C35DE] hover:bg-[#4C35DE]/5 cursor-pointer transition-all group"
                    >
                      <ImageIcon className="text-gray-400 group-hover:text-[#4C35DE]" size={20} />
                      <span className="text-sm font-bold text-gray-500 group-hover:text-[#4C35DE]">
                        {selectedFile ? selectedFile.name : 'Choose product image...'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-4 rounded-2xl border border-gray-100 font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-4 rounded-2xl bg-[#4C35DE] text-white font-bold hover:bg-[#3B28B8] transition-all shadow-lg shadow-[#4C35DE]/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
