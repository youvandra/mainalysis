import { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, getAccountId } from '../lib/supabase';
import { creditService } from '../services/creditService';
import { fetchWalletDomains, WalletDomain } from '../services/walletDomainsService';
import { walletManager } from '../lib/wallet';
import InteractiveGlowCard from './InteractiveGlowCard';
import HighlightCard from './HighlightCard';
import InsufficientCreditsModal from './InsufficientCreditsModal';

interface NewAnalysisProps {
  onSelectDomain: (domain: {
    name: string;
    extension: string;
    price: number;
    marketScore: number;
    trending: boolean;
    available: boolean;
    source?: 'search_listed' | 'fractionalize' | 'new_analysis';
  }) => void;
  onNavigateToSearch?: (filter: string) => void;
  onNavigateToPricing?: () => void;
}

export default function NewAnalysis({ onSelectDomain, onNavigateToSearch, onNavigateToPricing }: NewAnalysisProps) {
  const [domainInput, setDomainInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [alreadyAnalyzedDomain, setAlreadyAnalyzedDomain] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [walletDomains, setWalletDomains] = useState<WalletDomain[]>([]);
  const [isLoadingWalletDomains, setIsLoadingWalletDomains] = useState(false);
  const [walletDomainsError, setWalletDomainsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [domainsPerPage] = useState(10);

  const ANALYSIS_COST = 3;

  useEffect(() => {
    loadCreditBalance();
    loadWalletDomains();
  }, []);

  const loadCreditBalance = async () => {
    const balance = await creditService.getCreditBalance();
    setCreditBalance(balance?.balance || 0);
  };

  const loadWalletDomains = async () => {
    const walletAddress = walletManager.getAddress();
    if (!walletAddress) {
      return;
    }

    setIsLoadingWalletDomains(true);
    setWalletDomainsError(null);

    try {
      const domains = await fetchWalletDomains(walletAddress);
      setWalletDomains(domains);
    } catch (err) {
      setWalletDomainsError(err instanceof Error ? err.message : 'Failed to load domains');
    } finally {
      setIsLoadingWalletDomains(false);
    }
  };

  const parseDomain = (input: string): { name: string; extension: string } | null => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;

    const dotIndex = trimmed.indexOf('.');
    if (dotIndex === -1) {
      return { name: trimmed, extension: '.com' };
    }

    const name = trimmed.substring(0, dotIndex);
    const extension = trimmed.substring(dotIndex);

    if (!name) return null;

    return { name, extension };
  };

  const checkIfDomainAnalyzed = async (fullDomain: string): Promise<boolean> => {
    try {
      const accountId = await getAccountId();
      if (!accountId) return false;

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

  const handleAnalyze = async () => {
    setError(null);
    setShowWarning(false);
    setAlreadyAnalyzedDomain(null);

    const parsed = parseDomain(domainInput);
    if (!parsed) {
      setError('Please enter a valid domain name');
      return;
    }

    const fullDomain = parsed.name + parsed.extension;
    setIsChecking(true);

    const alreadyAnalyzed = await checkIfDomainAnalyzed(fullDomain);

    if (alreadyAnalyzed) {
      setIsChecking(false);
      setShowWarning(true);
      setAlreadyAnalyzedDomain(fullDomain);
      return;
    }

    // Check credit balance before proceeding
    await loadCreditBalance();
    setIsChecking(false);

    if (creditBalance < ANALYSIS_COST) {
      setShowInsufficientCreditsModal(true);
      return;
    }

    proceedWithAnalysis(parsed);
  };

  const proceedWithAnalysis = async (parsed: { name: string; extension: string }) => {
    // Final credit check right before analysis
    await loadCreditBalance();

    if (creditBalance < ANALYSIS_COST) {
      setShowInsufficientCreditsModal(true);
      return;
    }

    const domain = {
      name: parsed.name,
      extension: parsed.extension,
      price: 0,
      marketScore: 0,
      trending: false,
      available: false,
      source: 'new_analysis' as const,
    };

    onSelectDomain(domain);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const handleAnalyzeWalletDomain = async (domain: WalletDomain) => {
    const fullDomain = domain.name + domain.extension;
    setIsChecking(true);

    const alreadyAnalyzed = await checkIfDomainAnalyzed(fullDomain);

    if (alreadyAnalyzed) {
      setIsChecking(false);
      setShowWarning(true);
      setAlreadyAnalyzedDomain(fullDomain);
      return;
    }

    // Check credit balance before proceeding
    await loadCreditBalance();
    setIsChecking(false);

    if (creditBalance < ANALYSIS_COST) {
      setShowInsufficientCreditsModal(true);
      return;
    }

    proceedWithAnalysis(domain);
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
        requiredCredits={ANALYSIS_COST}
      />

      <div className="w-full max-w-7xl mx-auto flex-1">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">New Analysis</h1>
        <p className="text-lg text-gray-600">
          Enter a domain name to analyze its potential and get detailed insights
        </p>
      </div>

      <HighlightCard className="p-6 md:p-8">
        <div className="relative bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter domain name (e.g., example.com)"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-gray-700 placeholder-gray-400 focus:outline-none text-base"
            />
            <button
              onClick={handleAnalyze}
              disabled={isChecking || !domainInput.trim()}
              className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold px-6 py-2.5 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {showWarning && alreadyAnalyzedDomain && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-900 font-medium">Already Analyzed</p>
                <p className="text-amber-700 text-sm mb-3">
                  You have already analyzed <span className="font-semibold">{alreadyAnalyzedDomain}</span>.
                  Check your History to view the existing analysis, or proceed to re-analyze (this will use 1 credit).
                </p>
                <button
                  onClick={() => {
                    const parsed = parseDomain(domainInput);
                    if (parsed) proceedWithAnalysis(parsed);
                  }}
                  className="bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-700 font-semibold px-4 py-2 rounded-xl border-2 border-amber-200 transition-all hover:shadow-md text-sm"
                >
                  Re-analyze Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </HighlightCard>

      {/* Analyze Your Domain Section */}
      <div className="mt-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Analyze Your Domain</h2>
              <p className="text-sm text-gray-600">Select a domain from your wallet to analyze</p>
            </div>
          </div>
          {walletDomains.length > 0 && (
            <div className="text-sm text-gray-500 font-medium">
              {walletDomains.length} {walletDomains.length === 1 ? 'domain' : 'domains'}
            </div>
          )}
        </div>

        {isLoadingWalletDomains ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : walletDomainsError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-medium">Error loading domains</p>
              <p className="text-red-700 text-sm">{walletDomainsError}</p>
            </div>
          </div>
        ) : walletDomains.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-2">No domains found in your wallet</p>
            <p className="text-sm text-gray-500">Connect your wallet or purchase domains to see them here</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {walletDomains.slice((currentPage - 1) * domainsPerPage, currentPage * domainsPerPage).map((domain, index) => (
                <button
                  key={index}
                  onClick={() => handleAnalyzeWalletDomain(domain)}
                  disabled={isChecking}
                  className="w-full group"
                >
                  <div className="flex items-center justify-between p-4 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border border-gray-200 group-hover:from-blue-100 group-hover:to-blue-50 group-hover:border-blue-300 transition-all">
                        <span className="text-xl font-bold text-gray-600 group-hover:text-blue-600 transition-colors">
                          {domain.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {domain.name}
                          </h3>
                          <span className="text-lg font-bold text-blue-600">
                            {domain.extension}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {walletDomains.length > domainsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * domainsPerPage) + 1} to {Math.min(currentPage * domainsPerPage, walletDomains.length)} of {walletDomains.length} domains
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(walletDomains.length / domainsPerPage) }, (_, i) => i + 1).map((page) => {
                      const totalPages = Math.ceil(walletDomains.length / domainsPerPage);
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
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(walletDomains.length / domainsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(walletDomains.length / domainsPerPage)}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
