import React, { useState, useEffect } from 'react';
import { authService } from './lib/localStorage';
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
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'add-product':
        return <AddProduct user={user!} />;
      case 'inventory':
        return <ViewInventory user={user!} />;
      case 'restock':
        return <Restock user={user!} />;
      case 'reports':
        return <Reports user={user!} />;
      default:
        return <Dashboard user={user!} onViewChange={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <img 
            src="/logo.png" 
            alt="Stockpile Logo" 
            className="w-16 h-16 object-contain"
            onError={(e) => {
              // Fallback to Package icon if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
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
