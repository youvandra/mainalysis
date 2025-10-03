import { CheckCircle, XCircle, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useEffect, useState } from 'react';
import { domainStorage } from '../lib/storage';
import { analyzeDomain } from '../services/analysisService';
import { getAccountId } from '../lib/supabase';
import { checkDomainListed } from '../services/domainApi';
import { creditService } from '../services/creditService';
import HighlightCard from './HighlightCard';
import InsufficientCreditsModal from './InsufficientCreditsModal';

interface DomainDetailsProps {
  domain: {
    name: string;
    extension: string;
    price: number;
    marketScore: number;
    trending: boolean;
    available: boolean;
    fromFractionalize?: boolean;
    createdAt?: string;
    source?: 'search_listed' | 'fractionalize' | 'new_analysis';
  };
  onBack: () => void;
  cachedAnalysis?: any;
  fromHistory?: boolean;
  onNavigateToPricing?: () => void;
}

export default function DomainDetails({ domain, onBack, cachedAnalysis, fromHistory, onNavigateToPricing }: DomainDetailsProps) {
  const fullDomain = domain.name + domain.extension;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(!!cachedAnalysis);
  const [analysisData, setAnalysisData] = useState<any>(cachedAnalysis || null);
  const [isListed, setIsListed] = useState<boolean | null>(null);
  const [isCheckingListing, setIsCheckingListing] = useState(false);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [requiredCredits, setRequiredCredits] = useState<number>(3);

  useEffect(() => {
    // Don't track if coming from history - it's already in domain_history
    if (fromHistory) {
      return;
    }

    const trackDomainView = async () => {
      try {
        await domainStorage.addDomain(fullDomain, domain.price.toString());
      } catch (err) {
      }
    };

    trackDomainView();
  }, [fromHistory, fullDomain, domain.price]);

  useEffect(() => {
    // Check if domain is listed
    const checkListing = async () => {
      setIsCheckingListing(true);
      const listed = await checkDomainListed(domain.name, domain.extension);
      setIsListed(listed);
      setIsCheckingListing(false);
    };

    checkListing();
  }, [domain.name, domain.extension]);

 useEffect(() => {
    if (cachedAnalysis) {
      return;
    }
    let cancelled = false;
    const performAnalysis = async () => {
      setIsAnalyzing(true);
      setAnalysisError(null);
      try {
        const accountId = await getAccountId();
        if (!accountId) {
          throw new Error('Please connect your wallet to analyze domains');
        }
        const result = await analyzeDomain(fullDomain, domain.price, accountId, domain.source || 'new_analysis');
        if (!cancelled) {
          setAnalysisData(result.data);
          setIsCached(result.cached);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to analyze domain';
          if (errorMessage.includes('Insufficient credits') || errorMessage.includes('insufficient credits')) {
            const balance = await creditService.getCreditBalance();
            setCreditBalance(balance?.balance || 0);
            const creditCost = domain.source === 'search_listed' ? 1 : 3;
            setRequiredCredits(creditCost);
            setShowInsufficientCreditsModal(true);
          } else {
            setAnalysisError(errorMessage);
          }
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    };
    performAnalysis();
    return () => {
      cancelled = true;
    };
  }, [fullDomain, domain.price, cachedAnalysis]); 

  // Generate estimated valuation data from AI analysis, not from listed price
  const estimatedValuation = analysisData?.estimatedValuation || analysisData?.valueHistory || [
    { month: 'Mar', value: 3200 },
    { month: 'Apr', value: 3500 },
    { month: 'May', value: 3800 },
    { month: 'Jun', value: 4200 },
    { month: 'Jul', value: 4600 },
    { month: 'Aug', value: 5100 },
  ];

  const trafficData = analysisData?.trafficData || [
    { month: 'Mar', visits: 1200 },
    { month: 'Apr', visits: 1850 },
    { month: 'May', visits: 2100 },
    { month: 'Jun', visits: 2600 },
    { month: 'Jul', visits: 3200 },
    { month: 'Aug', visits: 3800 },
  ];

  const seoMetrics = analysisData?.seoMetrics || [
    { label: 'Domain Authority', score: 45, max: 100 },
    { label: 'Page Authority', score: 38, max: 100 },
    { label: 'Trust Score', score: 72, max: 100 },
    { label: 'Spam Score', score: 8, max: 100, inverse: true },
  ];

  const keywordData = analysisData?.keywordData || [
    { keyword: 'tech startup', volume: 12000, difficulty: 65 },
    { keyword: 'technology business', volume: 8500, difficulty: 58 },
    { keyword: 'startup company', volume: 15000, difficulty: 72 },
    { keyword: 'tech company', volume: 22000, difficulty: 78 },
  ];

  const features = analysisData?.features || [
    { label: 'Short & Memorable', available: true },
    { label: 'Easy to Spell', available: true },
    { label: 'Brandable', available: true },
    { label: 'SEO Friendly', available: true },
    { label: 'No Hyphens', available: true },
    { label: 'No Numbers', available: true },
    { label: 'Premium TLD', available: domain.extension === '.com' || domain.extension === '.io' || domain.extension === '.ai' },
    { label: 'Social Media Available', available: true },
  ];

  const marketScore = analysisData?.marketScore || domain.marketScore;
  const estimatedGrowth = analysisData?.estimatedGrowth || '+28%';
  const searchVolume = analysisData?.searchVolume || '57.5K';

  // Calculate domain age from createdAt with granular units
  const calculateDomainAge = (createdAt?: string) => {
    if (!createdAt) return { display: '8 Years', detail: 'Registered since 2016' };

    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);

    if (years > 0) {
      return { display: `${years} ${years === 1 ? 'Year' : 'Years'}`, detail: `Registered since ${created.getFullYear()}` };
    } else if (months > 0) {
      return { display: `${months} ${months === 1 ? 'Month' : 'Months'}`, detail: `Registered ${created.toLocaleDateString()}` };
    } else if (days > 0) {
      return { display: `${days} ${days === 1 ? 'Day' : 'Days'}`, detail: `Registered ${created.toLocaleDateString()}` };
    } else if (hours > 0) {
      return { display: `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`, detail: `Registered ${created.toLocaleString()}` };
    } else {
      return { display: `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`, detail: `Registered ${created.toLocaleString()}` };
    }
  };

  const domainAgeData = domain.createdAt
    ? calculateDomainAge(domain.createdAt)
    : { display: `N/A`, detail: `Not Available` };

  const summary = analysisData?.summary || 'Premium domain with excellent market potential. Perfect for technology startups, SaaS businesses, or digital ventures. Strong brandability and SEO value make this an outstanding investment opportunity.';

  // Get estimated price from analysis data (latest value from valueHistory)
  const estimatedPrice = analysisData?.estimatedPrice ||
    (analysisData?.valueHistory && analysisData.valueHistory.length > 0
      ? analysisData.valueHistory[analysisData.valueHistory.length - 1].value
      : 0);

  // Listed price from domain prop (in wei, convert to ETH)
  const listedPriceETH = domain.price > 0 ? domain.price / 1e18 : 0;

  // Button logic
  const getButtonConfig = () => {
    if (isListed === null) {
      return { text: 'Buy Now', url: null };
    }

    if (!isListed) {
      // Unlisted domain
      return {
        text: 'Check Availability',
        url: `https://testnet.interstellar.xyz/search?query=${fullDomain}`
      };
    }

    // Listed domain - compare prices
    if (estimatedPrice > listedPriceETH) {
      return {
        text: 'Buy Now',
        url: `https://dashboard-testnet.doma.xyz/domain/${fullDomain}`
      };
    } else {
      return {
        text: 'Make Offer',
        url: `https://dashboard-testnet.doma.xyz/domain/${fullDomain}`
      };
    }
  };

  const buttonConfig = getButtonConfig();

  if (isAnalyzing) {
    return (
      <>
        <InsufficientCreditsModal
          isOpen={showInsufficientCreditsModal}
          onClose={() => {
            setShowInsufficientCreditsModal(false);
            onBack();
          }}
          onAddCredits={() => {
            setShowInsufficientCreditsModal(false);
            onNavigateToPricing?.();
          }}
          currentBalance={creditBalance}
          requiredCredits={requiredCredits}
        />

        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Domain</h2>
            <p className="text-gray-600 text-center max-w-md">
              Our AI is analyzing {fullDomain} to provide you with comprehensive insights...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (analysisError) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 text-center max-w-md mb-6">{analysisError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold px-6 py-3 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => {
          setShowInsufficientCreditsModal(false);
          onBack();
        }}
        onAddCredits={() => {
          setShowInsufficientCreditsModal(false);
          onNavigateToPricing?.();
        }}
        currentBalance={creditBalance}
        requiredCredits={requiredCredits}
      />

      <div className="w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-3 tracking-[-0.02em] leading-tight">Domain Analytics</h1>
            <p className="text-slate-500 text-sm md:text-lg font-light tracking-wide">In-depth analysis and market insights for your domain</p>
          </div>
          {isCached && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Cached Analysis</span>
            </div>
          )}
        </div>
      </div>

      <HighlightCard className="p-6 md:p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-transparent">
                {fullDomain}
              </h1>
              {isCheckingListing ? (
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-bold text-gray-500 whitespace-nowrap flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking...
                </span>
              ) : isListed !== null ? (
                isListed ? (
                  <span className="px-3 py-1 bg-green-100 rounded-full text-sm font-bold text-green-700 whitespace-nowrap">
                    Listed
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 rounded-full text-sm font-bold text-amber-700 whitespace-nowrap">
                    Unlisted
                  </span>
                )
              ) : null}
            </div>
          </div>

          {!domain.fromFractionalize && buttonConfig.url && (
            <a
              href={buttonConfig.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold px-4 md:px-6 py-2.5 md:py-3 rounded-xl border-2 border-blue-200 transition-all hover:shadow-md flex items-center justify-center gap-2 self-start whitespace-nowrap"
            >
              <span className="text-sm md:text-base">{buttonConfig.text}</span>
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-gray-700 mb-4">
        </div>

        <p className="text-gray-600 leading-relaxed">
          {summary}
        </p>
      </HighlightCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Search Volume</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">{searchVolume}</p>
          <p className="text-sm text-slate-500">Monthly searches</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Domain Age</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">{domainAgeData.display}</p>
          <p className="text-sm text-slate-500">{domainAgeData.detail}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Estimate Valuation</h3>
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">ETH</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={estimatedValuation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Estimated Value (ETH)']}
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

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Estimated Traffic</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} visits`, 'Traffic']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="visits" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">SEO Metrics</h3>
          <div className="space-y-4">
            {seoMetrics.map((metric, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className={`text-sm font-bold ${metric.inverse ? (metric.score < 20 ? 'text-green-600' : 'text-orange-600') : (metric.score > 60 ? 'text-green-600' : 'text-orange-600')}`}>
                    {metric.score}/{metric.max}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${metric.inverse ? (metric.score < 20 ? 'bg-green-500' : 'bg-orange-500') : (metric.score > 60 ? 'bg-green-500' : 'bg-orange-500')}`}
                    style={{ width: `${(metric.score / metric.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Domain Features</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                {feature.available ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${feature.available ? 'text-gray-900' : 'text-gray-400'}`}>
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Related Keywords</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Keyword</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Search Volume</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {keywordData.map((keyword, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{keyword.keyword || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{keyword.volume ? keyword.volume.toLocaleString() : '0'}/mo</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${(keyword.difficulty || 0) > 70 ? 'bg-red-500' : (keyword.difficulty || 0) > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${keyword.difficulty || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{keyword.difficulty || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}
