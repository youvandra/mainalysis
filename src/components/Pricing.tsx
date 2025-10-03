import { useState, useEffect } from 'react';
import { walletManager } from '../lib/wallet';
import CreditPurchaseCard from './CreditPurchaseCard';
import InteractiveGlowCard from './InteractiveGlowCard';
import HighlightCard from './HighlightCard';

function Pricing() {
  const [isConnected, setIsConnected] = useState(walletManager.isConnected());

  useEffect(() => {
    const unsubscribe = walletManager.subscribe((state) => {
      setIsConnected(state.isConnected);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto flex-1">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Purchase Credits</h1>
        <p className="text-lg text-gray-600">
          Unlock deeper insights and scale your domain valuation strategy.
        </p>
      </div>

      <HighlightCard className="p-6 md:p-8 shadow-lg mb-8">
        <CreditPurchaseCard />
      </HighlightCard>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Why Buy Credits?</h2>
        <p className="text-gray-700 mb-6">
          Credits give you access to our advanced domain analysis powered by AI. Each credit allows you to:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <InteractiveGlowCard
            title="Analyze domain valuations"
            subtitle=""
            description="Get comprehensive market value assessments for any domain"
          />

          <InteractiveGlowCard
            title="Get market insights"
            subtitle=""
            description="Access real-time market trends and competitive analysis"
          />

          <InteractiveGlowCard
            title="Track domain trends"
            subtitle=""
            description="Monitor domain performance and growth over time"
          />

          <InteractiveGlowCard
            title="Access SEO metrics"
            subtitle=""
            description="Discover SEO potential and search optimization opportunities"
          />
        </div>
      </div>
    </div>
  );
}

export default Pricing;
