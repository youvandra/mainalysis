import { useState } from 'react';
import { Folder, Plus, TrendingUp, DollarSign, Calendar, ArrowUpRight, MoreVertical, CreditCard as Edit, Trash2, Eye, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Asset {
  id: string;
  name: string;
  extension: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  category: string;
  status: 'active' | 'listed' | 'sold';
}

export default function DomainAssets() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'active' | 'listed' | 'sold'>('all');

  const assets: Asset[] = [
    {
      id: '1',
      name: 'techstartup',
      extension: '.com',
      purchasePrice: 4500,
      currentValue: 6200,
      purchaseDate: '2024-01-15',
      category: 'Technology',
      status: 'active'
    },
    {
      id: '2',
      name: 'cloudventure',
      extension: '.io',
      purchasePrice: 6000,
      currentValue: 8500,
      purchaseDate: '2024-03-22',
      category: 'Cloud',
      status: 'active'
    },
    {
      id: '3',
      name: 'aiplatform',
      extension: '.ai',
      purchasePrice: 10000,
      currentValue: 15000,
      purchaseDate: '2024-05-10',
      category: 'AI',
      status: 'listed'
    },
    {
      id: '4',
      name: 'datasolutions',
      extension: '.net',
      purchasePrice: 2800,
      currentValue: 3500,
      purchaseDate: '2023-11-05',
      category: 'Data',
      status: 'active'
    },
    {
      id: '5',
      name: 'devtools',
      extension: '.dev',
      purchasePrice: 4200,
      currentValue: 6800,
      purchaseDate: '2024-02-18',
      category: 'Development',
      status: 'listed'
    },
    {
      id: '6',
      name: 'appstore',
      extension: '.app',
      purchasePrice: 7500,
      currentValue: 7200,
      purchaseDate: '2023-09-12',
      category: 'Apps',
      status: 'sold'
    }
  ];

  const portfolioData = [
    { month: 'Jan', value: 28000 },
    { month: 'Feb', value: 32000 },
    { month: 'Mar', value: 35000 },
    { month: 'Apr', value: 38000 },
    { month: 'May', value: 42000 },
    { month: 'Jun', value: 47200 },
  ];

  const filteredAssets = assets.filter(asset => {
    if (selectedCategory === 'all') return true;
    return asset.status === selectedCategory;
  });

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalInvested = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const totalGain = totalValue - totalInvested;
  const gainPercentage = ((totalGain / totalInvested) * 100).toFixed(1);

  const filterButtons = [
    { id: 'all' as const, label: 'All Assets', count: assets.length },
    { id: 'active' as const, label: 'Active', count: assets.filter(a => a.status === 'active').length },
    { id: 'listed' as const, label: 'Listed', count: assets.filter(a => a.status === 'listed').length },
    { id: 'sold' as const, label: 'Sold', count: assets.filter(a => a.status === 'sold').length }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-3">
            Domain Assets
          </h1>
          <p className="text-slate-600 text-lg">
            Manage and track your domain portfolio
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Domain
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Value</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">${totalValue.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Portfolio valuation</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Gain</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">+${totalGain.toLocaleString()}</p>
          <p className="text-sm text-gray-600">+{gainPercentage}% return</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Domains</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{assets.length}</p>
          <p className="text-sm text-gray-600">In portfolio</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Portfolio Value Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={portfolioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Domains</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Filter</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {filterButtons.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedCategory(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                selectedCategory === filter.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedCategory === filter.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredAssets.map((asset) => {
            const gain = asset.currentValue - asset.purchasePrice;
            const gainPercent = ((gain / asset.purchasePrice) * 100).toFixed(1);
            const isPositive = gain >= 0;

            return (
              <div
                key={asset.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all bg-gray-50 hover:bg-white"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {asset.name}
                      <span className="text-blue-600">{asset.extension}</span>
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      asset.status === 'active' ? 'bg-green-100 text-green-700' :
                      asset.status === 'listed' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs font-semibold text-blue-700">
                      {asset.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Purchased: ${asset.purchasePrice.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Current: ${asset.currentValue.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(asset.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{gainPercent}%
                    </p>
                    <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}${gain.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="View">
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains found</h3>
              <p className="text-gray-600">Try adjusting your filters or add a new domain</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
