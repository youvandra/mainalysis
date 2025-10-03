import { useState, useRef } from 'react';
import { Search, TrendingUp, Sparkles, BarChart3, Shield, ArrowRight, Users, LineChart, Globe, Zap } from 'lucide-react';
import StackedTrendingCards from './StackedTrendingCards';

interface DashboardProps {
  onNavigateToNewAnalysis: () => void;
  onNavigateToSearch: (filter?: string) => void;
  onNavigateToFractionalize: () => void;
}

export default function Dashboard({ onNavigateToNewAnalysis, onNavigateToSearch, onNavigateToFractionalize }: DashboardProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    heroRef.current.style.setProperty('--mouse-x', `${x}px`);
    heroRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCtaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ctaRef.current) return;
    const rect = ctaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctaRef.current.style.setProperty('--mouse-x', `${x}px`);
    ctaRef.current.style.setProperty('--mouse-y', `${y}px`);
  };


  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 shadow-2xl"
      >
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: isHeroHovered ? 1 : 0,
            background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15) 40%, transparent 70%)`
          }}
        />

        <div className="relative z-10 px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Uncover
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">undervalued assets</span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Advanced AI and on-chain metrics precisely identify Web3 domains ready for premium sales, 
                providing users with an accurate, real-time market score.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={onNavigateToNewAnalysis}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
                >
                  Start Analysis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onNavigateToSearch}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                >
                  Explore Domains
                </button>
              </div>
            </div>

            <div className="relative -mx-8 lg:mx-0">
              <StackedTrendingCards onExploreClick={(filter) => onNavigateToSearch(filter)} />
            </div>
          </div>
        </div>
      </section>


      <section>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Market Edge. Built-in.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            All the advanced tools and data you need to dominate Web3 domain investment and valuation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div
            className="group relative overflow-visible bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                 style={{
                   background: 'radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(251, 146, 60, 0.1), transparent 40%)'
                 }}
            ></div>

            <div className="relative p-8 md:p-10">
              <div className="mb-6">
                <h3 className="text-2xl md:text-3xl font-black text-white">
                  Instant Domain Valuation
                </h3>
                <p className="text-blue-300 text-sm font-medium">AI-Driven Market Intelligence.</p>
              </div>

              <p className="text-gray-300 leading-relaxed mb-8 text-lg">
                Get comprehensive, lightning-fast valuations. Discover hidden potential, spot market trends, and pinpoint the best investment opportunities in seconds.
              </p>

              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 group-hover:border-blue-400/50 transition-all duration-700">
                <img
                  src="/src/assets/Screenshot 2025-10-03 at 11.53.06.png"
                  alt="Domain Analysis Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
              <div className="bg-slate-900 border-2 border-orange-500 rounded-lg px-6 py-3 shadow-lg">
                <p className="text-xl font-black text-white">&gt;90%</p>
                <p className="text-xs text-gray-400 font-medium text-center">Accuracy</p>
              </div>
              <div className="bg-slate-900 border-2 border-orange-500 rounded-lg px-6 py-3 shadow-lg">
                <p className="text-xl font-black text-white">10M+</p>
                <p className="text-xs text-gray-400 font-medium text-center">Domains</p>
              </div>
            </div>
          </div>

          <div
            className="group relative overflow-visible bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl border border-gray-200"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                 style={{
                   background: 'radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.1), transparent 40%)'
                 }}
            ></div>

            <div className="relative p-8 md:p-10">
              <div className="mb-6">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900">
                  Live Market Dominance
                </h3>
                <p className="text-orange-600 text-sm font-medium">Real-Time Data Advantage</p>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Track domain performance with live, detailed SEO metrics, traffic estimates, and precise valuation trends. Make informed decisions based on current, verifiable market data.
              </p>

              <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200 group-hover:border-orange-300 transition-all duration-700">
                <img
                  src="/src/assets/Screenshot 2025-10-03 at 11.52.56.png"
                  alt="Domain Market Intelligence"
                  className="w-full h-auto"
                />
              </div>

            </div>

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
              <div className="bg-white border-2 border-blue-500 rounded-lg px-6 py-3 shadow-lg">
                <p className="text-xl font-black text-gray-900">Live</p>
                <p className="text-xs text-gray-500 font-medium text-center">Updates</p>
              </div>
              <div className="bg-white border-2 border-blue-500 rounded-lg px-6 py-3 shadow-lg">
                <p className="text-xl font-black text-gray-900">24/7</p>
                <p className="text-xs text-gray-500 font-medium text-center">Monitoring</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      <section
        ref={ctaRef}
        onMouseMove={handleCtaMouseMove}
        onMouseEnter={() => setIsCtaHovered(true)}
        onMouseLeave={() => setIsCtaHovered(false)}
        className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-3xl p-12 md:p-16"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        </div>

        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: isCtaHovered ? 1 : 0,
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.25), rgba(14, 165, 233, 0.15) 40%, transparent 70%)`
          }}
        />

        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Trustworthy Analysis</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Trade Smarter?
          </h2>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Access the critical data, AI scoring, and market edge you need to stop guessing and start profiting from undervalued Web3 domains today.
          </p>

          <button
            onClick={onNavigateToNewAnalysis}
            className="group px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold text-lg shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto hover:scale-105"
          >
            Analyze Your First Domain
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

    </div>
  );
}
