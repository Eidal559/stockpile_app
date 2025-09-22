import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import AddProduct from './components/AddProduct';
import ViewInventory from './components/ViewInventory';
import Restock from './components/Restock';
import Reports from './components/Reports';

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'associate';
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  barcode?: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  cost_price: number;
  selling_price: number;
  supplier: string;
  location: string;
  created_at: string;
  updated_at: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-product' | 'inventory' | 'restock' | 'reports'>('dashboard');

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          role: data.role
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'add-product':
        return <AddProduct user={user} />;
      case 'inventory':
        return <ViewInventory user={user} />;
      case 'restock':
        return <Restock user={user} />;
      case 'reports':
        return <Reports user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        user={user} 
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      <main className="pl-64">
        <div className="p-8">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
}

export default App;