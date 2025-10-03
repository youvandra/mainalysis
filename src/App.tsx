import { useState, useEffect, useRef } from 'react';
import { BarChart3, Plus, Search, Home, TrendingUp, Clock, Settings, User, RefreshCw, Paperclip, Image, ChevronRight, ChevronLeft, Globe, DollarSign, Link2, Activity, Users, ArrowUpRight, Folder, Wallet, LogOut, Sparkles, Layers, History } from 'lucide-react';
import { supabase, getAccountId } from './lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SearchDomains from './components/SearchDomains';
import DomainDetails from './components/DomainDetails';
import DomainFractionalize from './components/DomainFractionalize';
import DomainHistory from './components/History';
import Pricing from './components/Pricing';
import NewAnalysis from './components/NewAnalysis';
import InteractiveGlowCard from './components/InteractiveGlowCard';
import Dashboard from './components/Dashboard';
import { walletManager } from './lib/wallet';
import LogoBlue from './assets/DOM.svg';
import LogoWhite from './assets/DOM(1).svg';
import CreditIcon from './assets/DOM(3) copy copy.svg';

interface Domain {
  name: string;
  description: string;
  tags: string[];
  valuation: number;
  summary: string;
  marketScore: string;
  seoValue: string;
  growth: string;
  data: { month: string; value: number }[];
}

type Page = 'dashboard' | 'search' | 'details' | 'assets' | 'history' | 'pricing' | 'new-analysis';

interface SelectedDomain {
  name: string;
  extension: string;
  price: number;
  marketScore: number;
  trending: boolean;
  available: boolean;
  fromFractionalize?: boolean;
}

function App() {
  const [inputValue, setInputValue] = useState('');
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isTldDropdownOpen, setIsTldDropdownOpen] = useState(false);
  const [selectedTld, setSelectedTld] = useState('All TLDs');
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedDomain, setSelectedDomain] = useState<SelectedDomain | null>(null);
  const [searchFilter, setSearchFilter] = useState<string | undefined>(undefined);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const userName = 'John';

  const dropdownRef = useRef<HTMLDivElement>(null);

  const tldOptions = [
    'All TLDs',
    '.com',
    '.net',
    '.org',
    '.io',
    '.ai',
    '.co',
    '.xyz',
    '.app',
    '.dev',
    '.tech',
    '.dom'
  ];

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

  useEffect(() => {
    const unsubscribe = walletManager.subscribe((state) => {
      setWalletAddress(state.address);
      if (state.isConnected) {
        loadCredits();
      } else {
        setCredits(0);
      }
    });

    setWalletAddress(walletManager.getAddress());
    if (walletManager.isConnected()) {
      loadCredits();
    }

    const interval = setInterval(() => {
      if (walletManager.isConnected()) {
        loadCredits();
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadCredits = async () => {
    if (!supabase) return;

    try {
      const accountId = await getAccountId();
      if (!accountId) return;

      const { data, error } = await supabase
        .from('credit_balances')
        .select('balance')
        .eq('account_id', accountId)
        .maybeSingle();

      if (error) {
        return;
      }

      setCredits(data?.balance ?? 0);
    } catch (error) {
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', page: 'dashboard' as Page },
    { icon: Sparkles, label: 'New Analysis', page: 'new-analysis' as Page },
    { icon: Search, label: 'Search Domains', page: 'search' as Page },
    { icon: History, label: 'History', page: 'history' as Page },
    { icon: Layers, label: 'Fractionalize', page: 'assets' as Page },
  ];

  const domains: Domain[] = [
    {
      name: 'TechVenture.com',
      description: 'Premium tech domain with high market potential',
      tags: ['Technology', 'Startups', 'Innovation'],
      valuation: 78000,
      summary: 'A premium two-word domain combining "Tech" and "Venture", ideal for technology startups, investment firms, or innovation hubs. Strong keyword relevance with excellent SEO potential. The .com extension adds credibility and memorability. Market trends show consistent growth in tech-related domains with 23% year-over-year appreciation.',
      marketScore: '9.2/10',
      seoValue: 'High',
      growth: '+23%',
      data: [
        { month: 'Jan', value: 45000 },
        { month: 'Feb', value: 52000 },
        { month: 'Mar', value: 48000 },
        { month: 'Apr', value: 61000 },
        { month: 'May', value: 55000 },
        { month: 'Jun', value: 67000 },
        { month: 'Jul', value: 72000 },
        { month: 'Aug', value: 78000 },
      ]
    },
    {
      name: 'CloudScale.io',
      description: 'Modern cloud infrastructure domain',
      tags: ['Cloud', 'SaaS', 'Infrastructure'],
      valuation: 92000,
      summary: 'Perfect for cloud computing platforms, SaaS businesses, or scalable tech solutions. The .io extension is highly valued in the tech community. Strong brand potential with clear industry positioning. Increasing demand for cloud-related domains shows 31% growth trajectory.',
      marketScore: '9.5/10',
      seoValue: 'Very High',
      growth: '+31%',
      data: [
        { month: 'Jan', value: 52000 },
        { month: 'Feb', value: 58000 },
        { month: 'Mar', value: 63000 },
        { month: 'Apr', value: 71000 },
        { month: 'May', value: 76000 },
        { month: 'Jun', value: 82000 },
        { month: 'Jul', value: 87000 },
        { month: 'Aug', value: 92000 },
      ]
    },
    {
      name: 'DataFlow.ai',
      description: 'AI and data analytics powerhouse domain',
      tags: ['AI', 'Machine Learning', 'Analytics'],
      valuation: 115000,
      summary: 'Exceptional domain for AI companies, data analytics platforms, or machine learning startups. The .ai extension is premium for artificial intelligence ventures. Perfect keyword combination for the booming AI industry. Market shows exceptional 42% year-over-year appreciation in AI domains.',
      marketScore: '9.8/10',
      seoValue: 'Very High',
      growth: '+42%',
      data: [
        { month: 'Jan', value: 68000 },
        { month: 'Feb', value: 75000 },
        { month: 'Mar', value: 82000 },
        { month: 'Apr', value: 91000 },
        { month: 'May', value: 98000 },
        { month: 'Jun', value: 105000 },
        { month: 'Jul', value: 110000 },
        { month: 'Aug', value: 115000 },
      ]
    }
  ];

  const currentDomain = domains[currentDomainIndex];

  const handlePrevDomain = () => {
    setCurrentDomainIndex((prev) => (prev === 0 ? domains.length - 1 : prev - 1));
  };

  const handleNextDomain = () => {
    setCurrentDomainIndex((prev) => (prev === domains.length - 1 ? 0 : prev + 1));
  };

  const handleSelectDomain = (domain: SelectedDomain, fromFractionalize: boolean = false) => {
    setSelectedDomain({ ...domain, fromFractionalize });
    setCurrentPage('details');
  };

  const handleSelectDomainFromHistory = async (domainName: string, price: string) => {
    try {
      // Parse domain name to extract name and extension
      const lastDotIndex = domainName.lastIndexOf('.');
      if (lastDotIndex === -1) return;

      const name = domainName.substring(0, lastDotIndex);
      const extension = domainName.substring(lastDotIndex);

      // Convert price string to number (assuming it's in wei)
      const priceNumber = Number(price);

      // Fetch the analyzed domain data from database
      const accountId = await getAccountId();
      if (!accountId) return;

      const { data: analyzedDomain, error } = await supabase
        .from('analyzed_domains')
        .select('analysis_data')
        .eq('account_id', accountId)
        .eq('domain_name', domainName)
        .maybeSingle();

      if (error) {
      }

      // Create domain object with cached analysis and fromHistory flag
      const domain: SelectedDomain & { cachedAnalysis?: any; fromHistory?: boolean } = {
        name,
        extension,
        price: priceNumber,
        marketScore: 0,
        trending: false,
        available: true,
        cachedAnalysis: analyzedDomain?.analysis_data,
        fromHistory: true,
      };

      setSelectedDomain(domain);
      setCurrentPage('details');
    } catch (err) {
    }
  };

  const handleBackToSearch = () => {
    setCurrentPage('search');
    setSelectedDomain(null);
  };

  return (
    <div className="h-screen bg-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white rounded-3xl m-2 md:m-4 flex flex-col py-6 shadow-sm transition-all duration-300 relative flex-shrink-0 ${
          isNavExpanded ? 'w-64 items-start px-4' : 'w-16 md:w-20 items-center'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsNavExpanded(!isNavExpanded)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors z-10 border border-gray-200"
        >
          {isNavExpanded ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>

        <button className={`bg-black rounded-xl flex items-center mb-8 hover:bg-gray-800 transition-colors ${
          isNavExpanded ? 'w-full h-12 px-4 justify-start gap-3' : 'w-10 h-10 md:w-12 md:h-12 justify-center'
        }`}>
          <img src={LogoWhite} alt="Mainalysis Logo" className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          {isNavExpanded && <span className="text-white font-medium">Mainalysis</span>}
        </button>

        <nav className="flex-1 flex flex-col gap-2 w-full">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => item.page && setCurrentPage(item.page)}
              className={`rounded-xl flex items-center hover:bg-gray-100 transition-colors ${
                currentPage === item.page ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
              } ${
                isNavExpanded ? 'w-full h-12 px-4 justify-start gap-3' : 'w-10 h-10 md:w-12 md:h-12 justify-center mx-auto'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isNavExpanded && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={`mt-auto flex flex-col gap-2 ${isNavExpanded ? 'w-full' : ''}`}>
          {walletAddress && isNavExpanded && (
            <div className="w-full -mx-1">
              <InteractiveGlowCard
                title={
                  <div className="flex items-center gap-2">
                    <img src={CreditIcon} alt="Credits" className="w-5 h-5" />
                    <span>{credits}</span>
                  </div>
                }
                subtitle="CREDITS"
                description=""
              >
                <button
                  onClick={() => setCurrentPage('pricing')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 inline-flex items-center gap-1 group"
                >
                  <span>Add more</span>
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </InteractiveGlowCard>
            </div>
          )}
          {walletAddress && !isNavExpanded && (
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto bg-white rounded-xl border border-gray-200">
              <img src={CreditIcon} alt="Credits" className="w-5 h-5" />
            </div>
          )}

          {walletAddress ? (
            <div
              className={`rounded-xl flex items-center hover:bg-gray-100 transition-colors ${
                isNavExpanded ? 'w-full h-12 px-4 justify-between' : 'w-10 h-10 md:w-12 md:h-12 justify-center mx-auto'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                {isNavExpanded && (
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Connected</p>
                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                  </div>
                )}
              </div>
              {isNavExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    walletManager.disconnect();
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => walletManager.connect()}
              className={`rounded-xl flex items-center hover:bg-blue-50 transition-colors bg-blue-600 text-white hover:bg-blue-700 ${
                isNavExpanded ? 'w-full h-12 px-4 justify-start gap-3' : 'w-10 h-10 md:w-12 md:h-12 justify-center mx-auto'
              }`}
            >
              <Wallet className="w-5 h-5 flex-shrink-0" />
              {isNavExpanded && <span className="text-sm font-medium">Connect Wallet</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
        {currentPage === 'details' && selectedDomain ? (
          <DomainDetails
            domain={selectedDomain}
            onBack={handleBackToSearch}
            cachedAnalysis={(selectedDomain as any).cachedAnalysis}
            fromHistory={(selectedDomain as any).fromHistory}
            onNavigateToPricing={() => setCurrentPage('pricing')}
          />
        ) : currentPage === 'search' ? (
          <SearchDomains
            onSelectDomain={handleSelectDomain}
            onNavigateToHistory={() => setCurrentPage('history')}
            onNavigateToPricing={() => setCurrentPage('pricing')}
            initialFilter={searchFilter}
          />
        ) : currentPage === 'assets' ? (
          <DomainFractionalize
            onSelectDomain={(domain) => handleSelectDomain(domain, true)}
            onNavigateToPricing={() => setCurrentPage('pricing')}
          />
        ) : currentPage === 'history' ? (
          <DomainHistory onSelectDomain={handleSelectDomainFromHistory} />
        ) : currentPage === 'pricing' ? (
          <Pricing />
        ) : currentPage === 'new-analysis' ? (
          <NewAnalysis
            onSelectDomain={handleSelectDomain}
            onNavigateToSearch={(filter) => {
              setSearchFilter(filter);
              setCurrentPage('search');
            }}
            onNavigateToPricing={() => setCurrentPage('pricing')}
          />
        ) : currentPage === 'dashboard' ? (
          <Dashboard
            onNavigateToNewAnalysis={() => setCurrentPage('new-analysis')}
            onNavigateToSearch={(filter) => {
              if (filter) {
                setSearchFilter(filter);
              } else {
                setSearchFilter(undefined);
              }
              setCurrentPage('search');
            }}
            onNavigateToFractionalize={() => setCurrentPage('assets')}
          />
        ) : (
        <div className="w-full max-w-7xl mx-auto flex-1">
          {/* Domain of the Day */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8 gap-2 md:gap-6">
              <button
                onClick={handlePrevDomain}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl bg-white hover:bg-gray-50 transition-all duration-300 shadow-lg border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:scale-105 flex-shrink-0 group"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                <span className="text-sm md:text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Previous</span>
              </button>

              <div className="text-center flex-1">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-2 md:mb-3 tracking-[-0.02em] leading-tight">Domain of the Day</h1>
                <p className="text-slate-500 text-sm md:text-lg font-light tracking-wide hidden sm:block">Discover today's handpicked premium domain opportunity</p>
              </div>

              <button
                onClick={handleNextDomain}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl bg-white hover:bg-gray-50 transition-all duration-300 shadow-lg border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:scale-105 flex-shrink-0 group"
              >
                <span className="text-sm md:text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Next</span>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              </button>
            </div>

            {/* Domain Header */}
            <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 overflow-hidden border border-slate-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-transparent break-words">{currentDomain.name}</h1>
                      <div className="px-3 py-1 bg-green-100 rounded-full w-fit">
                        <span className="text-xs font-bold text-green-700">Available</span>
                      </div>
                    </div>
                    <p className="text-slate-600 font-medium text-sm md:text-base lg:text-lg mb-4 max-w-2xl">{currentDomain.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {currentDomain.tags.map((tag, index) => (
                        <span key={index} className="px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-semibold bg-white text-slate-700 rounded-lg border border-slate-200 shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 self-start">
                    <span className="text-sm md:text-base">Buy Domain</span>
                    <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-8">
              <h3 className="text-xs md:text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Summary</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {currentDomain.summary}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
              {/* Chart */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">Value Trend (Last 8 Months)</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base md:text-lg font-bold text-green-600">${currentDomain.valuation.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 md:p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={currentDomain.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase tracking-wide">Market Score</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{currentDomain.marketScore}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase tracking-wide">SEO Value</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{currentDomain.seoValue}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-gray-500 mb-1 uppercase tracking-wide">Growth</p>
                  <p className="text-lg md:text-2xl font-bold text-green-600">{currentDomain.growth}</p>
                </div>
              </div>

            </div>
          </div>


          {/* Input Area */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg border border-slate-200">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Analyze Your Domain</h2>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-slate-100 rounded-2xl md:rounded-3xl transform translate-y-2 translate-x-2 opacity-40"></div>
              <div className="relative bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Enter domain name to analyze..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 text-gray-700 placeholder-gray-400 focus:outline-none text-sm md:text-base"
                />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsTldDropdownOpen(!isTldDropdownOpen)}
                    className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-700 hover:text-gray-900 flex-shrink-0"
                  >
                    <Globe className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{selectedTld}</span>
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isTldDropdownOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-60 overflow-y-auto">
                      {tldOptions.map((tld, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedTld(tld);
                            setIsTldDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                            selectedTld === tld ? 'text-blue-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {tld}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
                    <img src={LogoBlue} alt="Mainalysis" className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Powered by Mainalysis Agent</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-xs md:text-sm text-gray-400">0/1000</span>
                  <button
                    className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                    disabled={!inputValue.trim()}
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-6 md:pt-8">
          <div className="w-full max-w-3xl mx-auto border-t border-gray-300 pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <img src={LogoBlue} alt="Mainalysis" className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-semibold text-sm md:text-base">Mainalysis</span>
              </div>

              <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-500">
                <a href="#" className="hover:text-gray-700 transition-colors">About</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Contact</a>
              </div>

              <div className="text-xs md:text-sm text-gray-400">
                © 2025 Mainalysis.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
