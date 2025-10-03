import { useState, useEffect, useMemo } from 'react';
import { Clock, TrendingUp, Search, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { domainStorage, DomainHistoryItem } from '../lib/storage';
import { walletManager } from '../lib/wallet';

interface HistoryProps {
  onSelectDomain: (domainName: string, price: string) => void;
}

export default function History({ onSelectDomain }: HistoryProps) {
  const [history, setHistory] = useState<DomainHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(walletManager.isConnected());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const unsubscribe = walletManager.subscribe((state) => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        loadHistory();
      } else {
        setHistory([]);
      }
    });

    if (isConnected) {
      loadHistory();
    } else {
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await domainStorage.getHistory();
      setHistory(data);
    } catch (err) {
      setError('Unable to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price: string) => {
    try {
      const eth = Number(price) / 1e18;
      return eth.toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;

    const query = searchQuery.toLowerCase();
    return history.filter(item =>
      item.domain_name.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (!isConnected) {
    return (
      <div className="w-full max-w-7xl mx-auto flex-1">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Analysis History</h1>
          <p className="text-lg text-gray-600">
            Never lose track of your research. Instantly revisit your entire domain analysis history.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-8">
              Please connect your MetaMask wallet from the sidebar to view and save your domain analysis history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadHistory}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex-1">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Analysis History</h1>
        <p className="text-lg text-gray-600">
          Never lose track of your research. Instantly revisit your entire domain analysis history.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No history yet</h2>
            <p className="text-gray-600 mb-6">
              Start analyzing domains to see them appear here. Your analysis history will be saved for quick access.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No domains found matching "{searchQuery}"</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {paginatedHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectDomain(item.domain_name, item.price)}
                    className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all text-left border border-gray-200 hover:border-blue-300 hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {item.domain_name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.price)} ETH
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-500">
                          {formatDate(item.analyzed_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} domains
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-200 shadow-md'
                              : 'text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:shadow-md'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
