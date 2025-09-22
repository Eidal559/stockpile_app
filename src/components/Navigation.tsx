import React from 'react';
import { 
  Home, 
  Plus, 
  Package, 
  RefreshCw, 
  BarChart3, 
  LogOut, 
  User,
  Settings
} from 'lucide-react';
import { User as UserType } from '../App';

interface NavigationProps {
  user: UserType;
  currentView: string;
  onViewChange: (view: 'dashboard' | 'add-product' | 'inventory' | 'restock' | 'reports') => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, currentView, onViewChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-product', label: 'Add Product', icon: Plus, adminOnly: false },
    { id: 'inventory', label: 'View Inventory', icon: Package },
    { id: 'restock', label: 'Restock', icon: RefreshCw },
    { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.adminOnly || user.role === 'admin'
  );

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <img 
          src="/stockpile_logo.jpg" 
          alt="Stockpile" 
          className="h-10 w-auto mb-3"
        />
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 p-2 rounded-full">
            <User size={20} />
          </div>
          <div>
            <p className="font-medium">{user.email}</p>
            <p className="text-sm text-gray-300 capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white border-r-4 border-orange-300'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;