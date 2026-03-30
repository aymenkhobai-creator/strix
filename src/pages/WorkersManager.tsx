import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Edit3, Search, User, Mail, Shield, X, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface Worker {
  id: string;
  name: string;
  email: string;
  role: 'Seller' | 'Manager' | 'Closer';
  created_at: string;
}

const ROLES = ['Seller', 'Manager', 'Closer'];

export default function WorkersManager() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Worker>>({
    name: '',
    email: '',
    role: 'Closer'
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    try {
      const { data, error: supabaseError } = await supabase
        .from('workers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supabaseError) throw supabaseError;
      if (data) setWorkers(data);
    } catch (err: any) {
      console.error('Error fetching workers:', err);
      setError(err.message || 'Failed to connect to the database');
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setEditingWorker(null);
    setFormData({ name: '', email: '', role: 'Closer' });
    setIsModalOpen(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData(worker);
    setIsModalOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingWorker) {
        const { error: supabaseError } = await supabase
          .from('workers')
          .update({
            name: formData.name,
            email: formData.email,
            role: formData.role
          })
          .eq('id', editingWorker.id);
        
        if (supabaseError) throw supabaseError;
        toast.success('Worker updated successfully');
      } else {
        const { error: supabaseError } = await supabase
          .from('workers')
          .insert([{
            name: formData.name,
            email: formData.email,
            role: formData.role
          }]);
        
        if (supabaseError) throw supabaseError;
        toast.success('Worker added successfully');
      }
      
      setIsModalOpen(false);
      fetchWorkers();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to remove this worker?')) {
      try {
        const { error: supabaseError } = await supabase
          .from('workers')
          .delete()
          .eq('id', id);
        
        if (supabaseError) throw supabaseError;
        toast.success('Worker removed');
        fetchWorkers();
      } catch (err: any) {
        toast.error(err.message || 'Failed to remove worker');
      }
    }
  }

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="text-2xl font-black uppercase italic text-red-900 mb-4 tracking-tight">Access Denied</h2>
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
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-[#1A202C]">Team</h1>
          <p className="text-gray-500 font-medium">Manage store sellers and closers roles.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#4C35DE] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#3B28B8] transition-all shadow-lg shadow-[#4C35DE]/20 active:scale-95"
        >
          <Plus size={22} /> 
          <span>Add Member</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-white shadow-sm font-medium"
        />
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.length > 0 ? filteredWorkers.map((worker) => (
          <div key={worker.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-black/5 hover:shadow-black/10 transition-all group relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#4C35DE]/10 flex items-center justify-center text-[#4C35DE]">
                <User size={32} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(worker)}
                  className="p-3 bg-[#F3F4F7] hover:bg-[#4C35DE] text-gray-500 hover:text-white rounded-xl transition-all active:scale-90"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(worker.id)}
                  className="p-3 bg-[#F3F4F7] hover:bg-red-500 text-gray-500 hover:text-white rounded-xl transition-all active:scale-90"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-[#1A202C]">{worker.name}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Mail size={14} />
                <span>{worker.email}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#4C35DE]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4C35DE]">{worker.role}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                Joined {new Date(worker.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="flex flex-col items-center gap-4 text-gray-300">
              <Users size={64} strokeWidth={1} />
              <p className="text-xl font-bold italic">No team members found.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-[#0A0B1E]/80 backdrop-blur-md" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#1A202C]">
                  {editingWorker ? 'Edit Member' : 'Add Member'}
                </h2>
                <p className="text-gray-400 font-medium">Configure staff access and roles.</p>
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
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Full Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Email Address</label>
                <input 
                  required
                  type="email" 
                  placeholder="alex@store.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#4C35DE] outline-none bg-gray-50/50 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({...formData, role: role as any})}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        formData.role === role 
                          ? "bg-[#4C35DE] text-white border-[#4C35DE] shadow-lg shadow-[#4C35DE]/20" 
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {role}
                    </button>
                  ))}
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
                    <span>{editingWorker ? 'Update Member' : 'Add Member'}</span>
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
