import React, { useState, useEffect } from 'react';
import { Search, Package, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { productService } from '../lib/localStorage';
import { User, Product } from '../App';

interface ViewInventoryProps {
  user: User;
}

const ViewInventory: React.FC<ViewInventoryProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const categories = [
    'Hardware', 'Tools', 'Electrical', 'Plumbing', 'Paint & Supplies',
    'Fasteners', 'Building Materials', 'Safety Equipment', 'Garden & Outdoor', 'Other'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => 
        product.current_stock <= product.min_stock_level && product.current_stock > 0
      );
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.current_stock === 0);
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) {
      return { status: 'out', color: 'bg-red-100 text-red-800', label: 'Out of Stock' };
    } else if (product.current_stock <= product.min_stock_level) {
      return { status: 'low', color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' };
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800', label: 'In Stock' };
    }
  };

  const handleDelete = async (productId: string) => {
    if (user.role !== 'admin') {
      alert('Only administrators can delete products.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productService.delete(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Overview</h1>
        <p className="text-gray-600">View and manage all products in your inventory.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <Package size={16} className="mr-2" />
            {filteredProducts.length} products found
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Stock:</span>
                    <span className="font-medium">{product.current_stock}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min Level:</span>
                    <span className="text-sm">{product.min_stock_level}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm">{product.location}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-medium text-green-600">${product.selling_price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm transition-colors">
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  
                  {user.role === 'admin' && (
                    <>
                      <button className="flex-1 flex items-center justify-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                        <Edit size={16} />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>

                {stockStatus.status !== 'good' && (
                  <div className="mt-3 flex items-center space-x-2 text-sm text-yellow-600">
                    <AlertTriangle size={16} />
                    <span>Needs restocking</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ViewInventory;
