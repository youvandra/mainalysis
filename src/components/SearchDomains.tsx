import { useState, useEffect, useRef } from 'react';
import { Search, Filter, TrendingUp, DollarSign, Clock, ArrowUpRight, Loader2, AlertCircle, ChevronDown, RefreshCw, X } from 'lucide-react';
import { fetchDomainListingsPaginated, DomainListing } from '../services/domainApi';
import { supabase, getAccountId } from '../lib/supabase';
import { creditService } from '../services/creditService';
import HighlightCard from './HighlightCard';
import InsufficientCreditsModal from './InsufficientCreditsModal';

interface DomainResult {
  name: string;
  extension: string;
  price: number;
  marketScore: number;
  trending: boolean;
  available: boolean;
  registrar: string;
  chain: string;
  createdAt?: string;
  source?: 'search_listed' | 'fractionalize' | 'new_analysis';
}

interface SearchDomainsProps {
  onSelectDomain: (domain: DomainResult) => void;
  onNavigateToHistory?: () => void;
  onNavigateToPricing?: () => void;
  initialFilter?: string;
}

export default function SearchDomains({ onSelectDomain, onNavigateToHistory, onNavigateToPricing, initialFilter }: SearchDomainsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTld, setSelectedTld] = useState<string>(initialFilter || 'all');
  const [isTldDropdownOpen, setIsTldDropdownOpen] = useState(false);
  const [apiListings, setApiListings] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [isAlreadyAnalyzed, setIsAlreadyAnalyzed] = useState(false);
  const [isCheckingAnalysis, setIsCheckingAnalysis] = useState(false);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const LISTED_DOMAIN_COST = 1;

  useEffect(() => {
    if (initialFilter) {
      setSelectedTld(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    loadListings();
  }, [currentPage, searchKeyword, selectedTld]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTldDropdownOpen(false);
      }
    };

    if (isTldDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTldDropdownOpen]);

  const loadListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const tlds = selectedTld !== 'all' ? [selectedTld] : undefined;

      const data = await fetchDomainListingsPaginated({
        take: itemsPerPage,
        skip,
        tlds,
        sld: searchKeyword || undefined
      });

      setApiListings(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load domain listings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchKeyword(searchQuery);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const checkIfDomainAnalyzed = async (domainName: string, domainExtension: string): Promise<boolean> => {
    try {
      const accountId = await getAccountId();
      if (!accountId) return false;

      const fullDomain = domainName + domainExtension;
      const { data, error } = await supabase
        .from('analyzed_domains')
        .select('id')
        .eq('account_id', accountId)
        .eq('domain_name', fullDomain)
        .maybeSingle();

      if (error) {
        return false;
      }

      return !!data;
    } catch (err) {
      return false;
    }
  };

  const handleAnalyzeClick = async (domain: DomainResult) => {
    setIsCheckingAnalysis(true);

    // Check if already analyzed
    const alreadyAnalyzed = await checkIfDomainAnalyzed(domain.name, domain.extension);
    setIsAlreadyAnalyzed(alreadyAnalyzed);

    // If not analyzed, check credit balance
    if (!alreadyAnalyzed) {
      const balance = await creditService.getCreditBalance();
      setCreditBalance(balance?.balance || 0);

      if ((balance?.balance || 0) < LISTED_DOMAIN_COST) {
        setIsCheckingAnalysis(false);
        setShowInsufficientCreditsModal(true);
        return;
      }
    }

    setIsCheckingAnalysis(false);
    setSelectedDomain(domain);
    setShowModal(true);
  };

  const transformedResults: DomainResult[] = apiListings.map((listing) => {
      const nameParts = listing.name.split('.');
      const domainName = nameParts[0];
      const extension = nameParts.length > 1 ? '.' + nameParts.slice(1).join('.') : '.dom';
      const priceInDollars = listing.price;
      const marketScore = priceInDollars > 10000 ? 9.5 : priceInDollars > 5000 ? 8.5 : 7.5;

      return {
        name: domainName,
        extension: extension,
        price: priceInDollars,
        marketScore: marketScore,
        trending: priceInDollars > 8000,
        available: true,
        registrar: listing.registrar.name,
        chain: listing.chain.name,
        createdAt: listing.createdAt,
        source: 'search_listed'
      };
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedTld]);

  const tldOptions = [
    { id: 'all', label: 'All' },
    { id: 'com', label: '.com' },
    { id: 'io', label: '.io' },
    { id: 'ai', label: '.ai' },
    { id: 'xyz', label: '.xyz' },
    { id: 'ape', label: '*ape' },
    { id: 'shib', label: '*shib' }
  ];

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
        requiredCredits={LISTED_DOMAIN_COST}
      />

      <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-3">
          Search Listed Domains
        </h1>
        <p className="text-slate-600 text-lg">
          Seamlessly discover and evaluate every available domain name in one place.
        </p>
      </div>

      <HighlightCard className="p-6 md:p-8 mb-6">
        <div className="relative bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for domain names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-gray-700 placeholder-gray-400 focus:outline-none text-base"
            />
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold px-6 py-2.5 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <span className="text-sm font-medium text-gray-600">Filter by extension:</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsTldDropdownOpen(!isTldDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-sm transition-all font-medium min-w-40"
            >
              <span className="text-sm">{tldOptions.find(opt => opt.id === selectedTld)?.label || 'All'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTldDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTldDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50 max-h-80 overflow-y-auto">
                {tldOptions.map((tld) => (
                  <button
                    key={tld.id}
                    onClick={() => {
                      setSelectedTld(tld.id);
                      setIsTldDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                      selectedTld === tld.id ? 'text-blue-600 font-semibold bg-blue-50 hover:bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    {tld.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </HighlightCard>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading domain listings...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Domains</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadListings}
              className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold px-6 py-2 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Search {transformedResults.length === 1 ? 'Result' : 'Results'}
          </h2>
          <button
            onClick={loadListings}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {transformedResults.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Domain</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Chain</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Registrar</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Value</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {transformedResults.map((domain, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {domain.available && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                        <span className="font-semibold text-gray-900">
                          {domain.name}
                          <span className="text-blue-600">{domain.extension}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{domain.chain}</td>
                    <td className="py-4 px-4 text-gray-700">{domain.registrar}</td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      {(domain.price / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleAnalyzeClick(domain)}
                        disabled={isCheckingAnalysis}
                        className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckingAnalysis ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Analyze
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl font-semibold transition-all hover:shadow-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border-2 border-gray-200'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-10 h-10 px-3 rounded-xl font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-200 shadow-md'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border-2 border-gray-200 hover:shadow-md'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-400 px-2">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl font-semibold transition-all hover:shadow-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border-2 border-gray-200'
              }`}
            >
              Next
            </button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedDomain(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isAlreadyAnalyzed ? 'Domain Already Analyzed' : 'Analyze Domain'}
              </h3>
              <p className="text-gray-600">
                {isAlreadyAnalyzed
                  ? 'This domain has already been analyzed. Analyzing it again will use 1 credit and update the analysis.'
                  : 'Do you want to proceed with analyzing this listed domain?'}
              </p>
              <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-2xl font-bold text-blue-600">1</span>
                <span className="text-sm text-blue-700 font-medium">credit will be used</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 text-xl mb-1">
                  {selectedDomain.name}{selectedDomain.extension}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{selectedDomain.chain}</span>
                  <span>•</span>
                  <span className={selectedDomain.available ? 'text-green-600' : 'text-orange-600'}>
                    {selectedDomain.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-gray-900">
                    {(selectedDomain.price / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedDomain(null);
                  setIsAlreadyAnalyzed(false);
                }}
                className="flex-1 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-xl border-2 border-gray-200 transition-all hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isAlreadyAnalyzed && onNavigateToHistory) {
                    onNavigateToHistory();
                    setShowModal(false);
                    setSelectedDomain(null);
                    setIsAlreadyAnalyzed(false);
                  } else {
                    onSelectDomain(selectedDomain);
                    setShowModal(false);
                    setSelectedDomain(null);
                    setIsAlreadyAnalyzed(false);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold py-3 px-4 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md flex items-center justify-center gap-2"
              >
                <span>{isAlreadyAnalyzed ? 'Go to History' : 'Confirm'}</span>
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
