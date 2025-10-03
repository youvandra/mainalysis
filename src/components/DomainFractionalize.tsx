import { useState, useEffect } from 'react';
import { Coins, TrendingUp, DollarSign, Calendar, Filter, Loader2, AlertCircle, RefreshCw, ExternalLink, Layers, ArrowUpRight, Clock, Timer, X } from 'lucide-react';
import { fetchFractionalTokens, FractionalToken } from '../services/domainApi';
import { creditService } from '../services/creditService';
import BIGInteractiveGlowCard from './BIGInteractiveGlowCard';
import InsufficientCreditsModal from './InsufficientCreditsModal';

interface SelectedDomain {
  name: string;
  extension: string;
  price: number;
  marketScore: number;
  trending: boolean;
  available: boolean;
  registrar: string;
  chain: string;
  source?: 'search_listed' | 'fractionalize' | 'new_analysis';
}

interface DomainFractionalizeProps {
  onSelectDomain: (domain: SelectedDomain) => void;
  onNavigateToPricing?: () => void;
}

export default function DomainFractionalize({ onSelectDomain, onNavigateToPricing }: DomainFractionalizeProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'FRACTIONALIZED' | 'GRADUATION_SUCCESSFUL'>('all');
  const [tokens, setTokens] = useState<FractionalToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<FractionalToken | null>(null);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);

  const FRACTIONALIZE_COST = 3;

  useEffect(() => {
    loadFractionalTokens();
  }, []);

  const loadFractionalTokens = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFractionalTokens(20);
      setTokens(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load fractionalized domains';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTokens = tokens.filter(token => {
    if (selectedStatus === 'all') return true;
    return token.status === selectedStatus;
  });

  const filterButtons = [
    { id: 'all' as const, label: 'All', count: tokens.length },
    { id: 'FRACTIONALIZED' as const, label: 'Upcoming', count: tokens.filter(t => t.status === 'FRACTIONALIZED').length },
    { id: 'GRADUATION_SUCCESSFUL' as const, label: 'Graduated', count: tokens.filter(t => t.status === 'GRADUATION_SUCCESSFUL').length }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price: string) => {
    if (!price || price === '0') return '0.0000';
    const priceNum = parseFloat(price);
    // Convert wei to ETH (divide by 10^18)
    const ethValue = priceNum / 1e18;
    return ethValue.toFixed(4);
  };

  const formatPriceForDisplay = (price: string) => {
    if (!price || price === '0') return '0.0000';
    const priceNum = parseFloat(price);
    // Convert wei to ETH
    const ethValue = priceNum / 1e18;

    // Format based on magnitude
    if (ethValue >= 1e9) {
      return (ethValue / 1e9).toFixed(4) + 'B';
    } else if (ethValue >= 1e6) {
      return (ethValue / 1e6).toFixed(4) + 'M';
    } else if (ethValue >= 1e3) {
      return (ethValue / 1e3).toFixed(4) + 'K';
    }
    return ethValue.toFixed(4);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTimeRemaining = (endDate: string) => {
    const total = Date.parse(endDate) - Date.now();
    if (total <= 0) return null;

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return { days, hours, minutes, seconds };
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 100;

    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <>
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        onAddCredits={() => {
          setShowInsufficientCreditsModal(false);
          onNavigateToPricing?.();
        }}
        currentBalance={creditBalance}
        requiredCredits={FRACTIONALIZE_COST}
      />

      <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Fractionalized Domains
          </h1>
          <p className="text-slate-600 text-lg">
            Analyze, verify, and invest in fractionalized domain tokens with absolute confidence.
          </p>
        </div>
        <a
          href="https://mizu-testnet.doma.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg flex items-center gap-2"
        >
          <ExternalLink className="w-5 h-5" />
          Mizu Launchpad
        </a>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading fractionalized domains...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tokens</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadFractionalTokens}
            className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold px-6 py-2 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {(() => {
            const latestToken = tokens.sort((a, b) =>
              Date.parse(b.fractionalizedAt) - Date.parse(a.fractionalizedAt)
            )[0];

            if (!latestToken) return null;

            const timeLeft = getTimeRemaining(latestToken.params.launchEndDate);
            const progress = calculateProgress(latestToken.params.launchStartDate, latestToken.params.launchEndDate);
            const currentPrice = formatPriceForDisplay(latestToken.currentPrice);
            const currentPriceETH = formatPrice(latestToken.currentPrice);
            const initialValuation = formatPriceForDisplay(latestToken.params.initialValuation);
            const startingFDV = formatPriceForDisplay(latestToken.params.initialLaunchpadPrice);
            const bondingFDV = formatPriceForDisplay(latestToken.params.finalLaunchpadPrice);
            const buyoutMin = latestToken.buyoutPrice ? formatPriceForDisplay(latestToken.buyoutPrice) : formatPriceForDisplay(latestToken.params.initialValuation);
            const launchStartDate = new Date(latestToken.params.launchStartDate);
            const displayImage = latestToken.metadata?.image;

            return (
              <>
                <BIGInteractiveGlowCard
                  title="Analyze Before You Trade."
                  description="Before committing capital, eliminate guesswork. Get the verified Fair Price Scores, on-chain liquidity metrics, and predictive profit forecasts needed to acquire or divest fractionalized domain assets with absolute confidence and strategic advantage."
                >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{latestToken.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 border border-slate-600">
                            ${latestToken.params.symbol || latestToken.name.split('.')[0].toUpperCase()}
                          </span>
                          <span className="px-3 py-1 bg-blue-500/20 rounded-lg text-xs font-semibold text-blue-300 border border-blue-500/30">
                            {latestToken.status === 'FRACTIONALIZED' ? 'Upcoming' : latestToken.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {displayImage ? (
                          <img
                            src={displayImage}
                            alt={latestToken.name}
                            className="w-20 h-20 rounded-xl object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={displayImage ? 'hidden' : 'w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl'}>
                          {latestToken.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                </BIGInteractiveGlowCard>
              </>
            );
          })()}

          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Browse Domains</h2>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {filterButtons.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedStatus(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border-2 ${
                    selectedStatus === filter.id
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {filter.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedStatus === filter.id
                      ? 'bg-blue-200 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTokens.map((token) => {
                const currentPrice = formatPrice(token.currentPrice);
                const initialValuation = formatPrice(token.params.initialValuation);
                const totalSupplyNum = parseFloat(token.params.totalSupply);
                const totalSupply = totalSupplyNum > 1e12
                  ? (totalSupplyNum / Math.pow(10, token.params.decimals)).toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : totalSupplyNum.toLocaleString(undefined, { maximumFractionDigits: 0 });
                const displayImage = token.metadata?.image || token.params?.image;

                return (
                  <div
                    key={token.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {token.name}
                          </h3>

                          <div>
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                              {token.chain.name}
                            </span>
                          </div>
                        </div>

                        <div className="ml-4">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={token.name}
                              className="w-16 h-16 rounded-xl object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={displayImage ? 'hidden' : 'w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl'}>
                            {token.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedToken(token);
                            setShowModal(true);
                          }}
                          className="flex-[4] bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold py-2.5 px-4 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md flex items-center justify-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Analyze</span>
                        </button>
                        <a
                          href={`https://mizu-testnet.doma.xyz/domain/${token.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-[1] bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl border-2 border-gray-200 transition-all hover:shadow-md flex items-center justify-center"
                          title="Trade on Mizu"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTokens.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Coins className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No tokens found</h3>
                  <p className="text-slate-600">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showModal && selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedToken(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyze Domain</h3>
              <p className="text-slate-600">
                Do you want to proceed with analyzing this fractionalized domain?
              </p>
              <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-2xl font-bold text-blue-600">3</span>
                <span className="text-sm text-blue-700 font-medium">credits will be used</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                {selectedToken.metadata?.image ? (
                  <img
                    src={selectedToken.metadata.image}
                    alt={selectedToken.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {selectedToken.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg">{selectedToken.name}</h4>
                  <p className="text-sm text-slate-500">{selectedToken.chain.name}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedToken(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Check credit balance before proceeding
                  const balance = await creditService.getCreditBalance();
                  setCreditBalance(balance?.balance || 0);

                  if ((balance?.balance || 0) < FRACTIONALIZE_COST) {
                    setShowModal(false);
                    setShowInsufficientCreditsModal(true);
                    return;
                  }

                  const nameParts = selectedToken.name.split('.');
                  const domainName = nameParts[0];
                  const extension = nameParts.length > 1 ? '.' + nameParts.slice(1).join('.') : '.dom';
                  onSelectDomain({
                    name: domainName,
                    extension: extension,
                    price: parseFloat(selectedToken.currentPrice),
                    marketScore: 8.5,
                    trending: false,
                    available: false,
                    registrar: 'Fractionalized',
                    chain: selectedToken.chain.name,
                    source: 'fractionalize'
                  });
                  setShowModal(false);
                  setSelectedToken(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Confirm</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
