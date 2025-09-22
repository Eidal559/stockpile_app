import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, TrendingDown } from 'lucide-react';
import { productService } from '../lib/localStorage';
import { User, Product } from '../App';

interface ReportsProps {
  user: User;
}

interface ReportData {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: { category: string; count: number; value: number }[];
  stockLevels: { level: string; count: number; percentage: number }[];
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'overview' | 'stock' | 'value'>('overview');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const products = await productService.getAll();

      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);
      const lowStockCount = products.filter(p => 
        p.current_stock <= p.min_stock_level && p.current_stock > 0
      ).length;
      const outOfStockCount = products.filter(p => p.current_stock === 0).length;

      // Category breakdown
      const categoryMap = new Map();
      products.forEach(product => {
        const existing = categoryMap.get(product.category) || { count: 0, value: 0 };
        categoryMap.set(product.category, {
          count: existing.count + 1,
          value: existing.value + (product.current_stock * product.cost_price)
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value
      }));

      // Stock levels analysis
      const goodStock = products.filter(p => p.current_stock > p.min_stock_level).length;
      const stockLevels = totalProducts > 0 ? [
        { level: 'Good Stock', count: goodStock, percentage: (goodStock / totalProducts) * 100 },
        { level: 'Low Stock', count: lowStockCount, percentage: (lowStockCount / totalProducts) * 100 },
        { level: 'Out of Stock', count: outOfStockCount, percentage: (outOfStockCount / totalProducts) * 100 }
      ] : [];

      setReportData({
        totalProducts,
        totalValue,
        lowStockCount,
        outOfStockCount,
        categoryBreakdown: categoryBreakdown.sort((a, b) => b.count - a.count),
        stockLevels
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = 'Category,Product Count,Inventory Value\n';
    reportData.categoryBreakdown.forEach(cat => {
      csv += `"${cat.category}",${cat.count},"$${cat.value.toFixed(2)}"\n`;
    });
    
    csv += '\nStock Level,Count,Percentage\n';
    reportData.stockLevels.forEach(level => {
      csv += `"${level.level}",${level.count},"${level.percentage.toFixed(1)}%"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const StatCard = ({ title, value, icon: Icon, color, prefix = '', suffix = '' }: {
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {prefix}{value.toLocaleString()}{suffix}
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

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load report data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Reports</h1>
        <p className="text-gray-600">
          Comprehensive analytics and insights for your inventory management.
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setReportType('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'overview'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setReportType('stock')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'stock'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stock Analysis
          </button>
          <button
            onClick={() => setReportType('value')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'value'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Value Analysis
          </button>
        </div>
      </div>

      {reportType === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Products"
              value={reportData.totalProducts}
              icon={Package}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Inventory Value"
              value={reportData.totalValue}
              icon={DollarSign}
              color="bg-green-500"
              prefix="$"
            />
            <StatCard
              title="Low Stock Items"
              value={reportData.lowStockCount}
              icon={TrendingDown}
              color="bg-yellow-500"
            />
            <StatCard
              title="Out of Stock"
              value={reportData.outOfStockCount}
              icon={BarChart3}
              color="bg-red-500"
            />
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
            {reportData.categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                {reportData.categoryBreakdown.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{category.category}</p>
                      <p className="text-sm text-gray-600">{category.count} products</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${category.value.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {reportData.totalProducts > 0 
                          ? ((category.count / reportData.totalProducts) * 100).toFixed(1) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No products in inventory</p>
            )}
          </div>
        </>
      )}

      {reportType === 'stock' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Level Distribution</h3>
          {reportData.stockLevels.length > 0 ? (
            <div className="space-y-6">
              {reportData.stockLevels.map((level) => {
                const getColor = () => {
                  switch (level.level) {
                    case 'Good Stock': return 'bg-green-500';
                    case 'Low Stock': return 'bg-yellow-500';
                    case 'Out of Stock': return 'bg-red-500';
                    default: return 'bg-gray-500';
                  }
                };

                return (
                  <div key={level.level}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">{level.level}</span>
                      <span className="text-gray-600">{level.count} items ({level.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getColor()}`}
                        style={{ width: `${level.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No products to analyze</p>
          )}
        </div>
      )}

      {reportType === 'value' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Inventory Value by Category</h3>
          {reportData.categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {reportData.categoryBreakdown.map((category) => {
                const percentage = reportData.totalValue > 0 
                  ? (category.value / reportData.totalValue) * 100 
                  : 0;
                
                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">{category.category}</span>
                      <span className="text-gray-600">${category.value.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-orange-500 h-3 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No products to analyze</p>
          )}
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex space-x-4">
          <button 
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            <Calendar size={16} />
            <span>Export to CSV</span>
          </button>
          <button 
            disabled
            className="flex items-center space-x-2 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
          >
            <BarChart3 size={16} />
            <span>Schedule Weekly Report (Coming Soon)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
