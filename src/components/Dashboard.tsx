import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { productService } from '../lib/localStorage';
import { User, Product } from '../App';
import { LucideIcon } from 'lucide-react';

interface DashboardProps {
  user: User;
  onViewChange: (view: 'dashboard' | 'add-product' | 'inventory' | 'restock' | 'reports') => void;
}

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  outOfStockItems: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onViewChange }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStockItems: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const products = await productService.getAll();

      // Calculate stats
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => p.current_stock <= p.min_stock_level && p.current_stock > 0).length;
      const outOfStockItems = products.filter(p => p.current_stock === 0).length;
      const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);

      setStats({
        totalProducts,
        lowStockItems,
        totalValue,
        outOfStockItems
      });

      // Set low stock products for display
      const lowStock = products
        .filter(p => p.current_stock <= p.min_stock_level && p.current_stock > 0)
        .slice(0, 5);
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const StatCard = ({ title, value, icon: Icon, color, prefix = '' }: {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color: string;
    prefix?: string;
  }) => (
  }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.email}. Here's your inventory overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={TrendingDown}
          color="bg-yellow-500"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockItems}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Inventory Value"
          value={stats.totalValue.toFixed(2)}
          icon={DollarSign}
          color="bg-green-500"
          prefix="$"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="text-yellow-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Low Stock Alert</h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">SKU: {product.sku} | Location: {product.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-yellow-600 font-medium">
                    {product.current_stock} / {product.min_stock_level} min
                  </p>
                  <p className="text-xs text-gray-500">Stock Level</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onViewChange('add-product')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="text-orange-500" size={20} />
            <span className="font-medium">Add New Product</span>
          </button>
          <button 
            onClick={() => onViewChange('restock')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="text-teal-500" size={20} />
            <span className="font-medium">Restock Items</span>
          </button>
          <button 
            onClick={() => onViewChange('reports')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="text-blue-500" size={20} />
            <span className="font-medium">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
