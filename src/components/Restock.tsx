import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Plus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, Product } from '../App';

interface RestockProps {
  user: User;
}

interface RestockItem {
  product: Product;
  suggestedQuantity: number;
  actualQuantity: number;
}

const Restock: React.FC<RestockProps> = ({ user }) => {
  const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchRestockData();
  }, []);

  const fetchRestockData = async () => {
    try {
      setLoading(true);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .or('current_stock.lte.min_stock_level,current_stock.eq.0')
        .order('current_stock');

      if (error) throw error;

      const items: RestockItem[] = (products || []).map(product => {
        const suggestedQuantity = Math.max(
          product.max_stock_level - product.current_stock,
          product.min_stock_level - product.current_stock
        );
        
        return {
          product,
          suggestedQuantity: Math.max(suggestedQuantity, 10),
          actualQuantity: suggestedQuantity > 0 ? suggestedQuantity : 10
        };
      });

      setRestockItems(items);
    } catch (error) {
      console.error('Error fetching restock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setRestockItems(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, actualQuantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const handleRestock = async (productId: string) => {
    const item = restockItems.find(i => i.product.id === productId);
    if (!item) return;

    setUpdating(productId);
    
    try {
      const newStock = item.product.current_stock + item.actualQuantity;
      
      const { error } = await supabase
        .from('products')
        .update({ 
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // Remove item from restock list
      setRestockItems(items => items.filter(i => i.product.id !== productId));
      
    } catch (error) {
      console.error('Error restocking product:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getUrgencyLevel = (product: Product) => {
    if (product.current_stock === 0) {
      return { level: 'critical', color: 'bg-red-100 text-red-800', label: 'Critical - Out of Stock' };
    } else if (product.current_stock <= product.min_stock_level * 0.5) {
      return { level: 'high', color: 'bg-orange-100 text-orange-800', label: 'High Priority' };
    } else {
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', label: 'Medium Priority' };
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restock Management</h1>
        <p className="text-gray-600">
          Manage inventory restocking for products with low or depleted stock levels.
        </p>
      </div>

      {restockItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Check size={48} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Products Well Stocked</h3>
          <p className="text-gray-600">
            Great job! All your products are currently above their minimum stock levels.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="text-orange-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Products Requiring Restock ({restockItems.length})
            </h2>
          </div>

          <div className="space-y-4">
            {restockItems.map((item) => {
              const urgency = getUrgencyLevel(item.product);
              const isUpdating = updating === item.product.id;
              
              return (
                <div key={item.product.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgency.color}`}>
                          {urgency.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Brand: {item.product.brand} | SKU: {item.product.sku}
                      </p>
                      <p className="text-sm text-gray-600">
                        Location: {item.product.location} | Supplier: {item.product.supplier}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Current Stock</p>
                      <p className="text-lg font-semibold text-gray-900">{item.product.current_stock}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Min Level</p>
                      <p className="text-lg font-semibold text-gray-900">{item.product.min_stock_level}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Max Level</p>
                      <p className="text-lg font-semibold text-gray-900">{item.product.max_stock_level}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Cost per Unit</p>
                      <p className="text-lg font-semibold text-gray-900">${item.product.cost_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Restock Quantity
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.actualQuantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            disabled={isUpdating}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.actualQuantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            min="0"
                            disabled={isUpdating}
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, item.actualQuantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            disabled={isUpdating}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Suggested: {item.suggestedQuantity}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Total Cost</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${(item.actualQuantity * item.product.cost_price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestock(item.product.id)}
                      disabled={isUpdating || item.actualQuantity === 0}
                      className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      <span>{isUpdating ? 'Updating...' : 'Restock'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Restock;