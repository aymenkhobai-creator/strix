import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined);

let supabaseInstance: SupabaseClient | null = null;

const isValidSupabaseUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !url.includes('your-project-id');
  } catch {
    return false;
  }
};

// Mock implementation for when Supabase is not configured
const createMockClient = (): any => {
  console.warn('Supabase credentials are missing. Using mock client with localStorage.');
  
  const mockStorage: Record<string, any[]> = JSON.parse(localStorage.getItem('supabase_mock_db') || '{}');
  
  const save = () => {
    localStorage.setItem('supabase_mock_db', JSON.stringify(mockStorage));
  };

  const queryBuilder = (table: string) => {
    if (!mockStorage[table]) mockStorage[table] = [];
    
    const createChain = (data: any[]) => {
      const chain: any = {
        _data: data,
        select: function() { return this; },
        eq: function(field: string, value: any) {
          this._data = this._data.filter((item: any) => item[field] === value);
          return this;
        },
        order: function(column: string, { ascending = true } = {}) {
          this._data = [...this._data].sort((a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
          });
          return this;
        },
        limit: function(n: number) {
          this._data = this._data.slice(0, n);
          return this;
        },
        single: function() {
          const item = this._data[0];
          if (!item) {
            return Promise.resolve({ data: null, error: { message: 'JSON object requested, but no rows were returned', code: 'PGRST116' } });
          }
          return Promise.resolve({ data: item, error: null });
        },
        then: function(resolve: any, reject: any) {
          return Promise.resolve({ data: this._data, error: null }).then(resolve, reject);
        },
        catch: function(reject: any) {
          return Promise.resolve({ data: this._data, error: null }).catch(reject);
        }
      };
      return chain;
    };

    return {
      select: () => createChain([...mockStorage[table]]),
      insert: (data: any[]) => {
        const newItems = data.map(item => ({ 
          id: Math.random().toString(36).substr(2, 9), 
          created_at: new Date().toISOString(),
          ...item 
        }));
        mockStorage[table].push(...newItems);
        save();
        return Promise.resolve({ data: newItems, error: null });
      },
      update: (data: any) => ({
        eq: (field: string, value: any) => {
          mockStorage[table] = mockStorage[table].map(item => 
            item[field] === value ? { ...item, ...data } : item
          );
          save();
          return Promise.resolve({ data: null, error: null });
        }
      }),
      delete: () => ({
        eq: (field: string, value: any) => {
          mockStorage[table] = mockStorage[table].filter(item => item[field] !== value);
          save();
          return Promise.resolve({ data: null, error: null });
        }
      }),
    };
  };

  const storageBuilder = () => ({
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        console.log(`Mock upload to ${bucket}/${path}`, file);
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://picsum.photos/seed/${path}/800/800` }
      })
    })
  });

  return {
    from: queryBuilder,
    storage: storageBuilder(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: any) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Mock auth not supported') }),
      signOut: () => Promise.resolve({ error: null }),
    }
  };
};

export const isMock = !supabaseUrl || !supabaseAnonKey || !isValidSupabaseUrl(supabaseUrl);

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    if (isMock) {
      // Return mock client if credentials are missing
      supabaseInstance = createMockClient() as any;
    } else {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return supabaseInstance!;
};

// For backward compatibility
export const supabase = getSupabase();
