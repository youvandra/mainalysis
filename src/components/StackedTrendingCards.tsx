import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

interface TrendingCategory {
  extension: string;
  title: string;
  description: string;
  gradient: string;
  textColor: string;
  filterValue: string;
}

const categories: TrendingCategory[] = [
  {
    extension: '.ape',
    title: 'Ape In: Own the Legacy',
    description: 'Top ape names rarely hit the market. Act fast when they do.',
    gradient: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-50',
    filterValue: 'ape'
  },
  {
    extension: '.shib',
    title: 'Shib Army: Claim Your Name',
    description: 'Shib names don\'t stay listed long. The army moves fast.',
    gradient: 'from-red-500 to-pink-600',
    textColor: 'text-red-50',
    filterValue: 'shib'
  },
  {
    extension: '.ai',
    title: '.ai Startup Cred',
    description: 'Top .ai names are snapped up by startups.',
    gradient: 'from-blue-500 to-cyan-600',
    textColor: 'text-blue-50',
    filterValue: 'ai'
  },
  {
    extension: '.xyz',
    title: 'The Rebel Extension',
    description: 'If .com becomes legacy, .xyz is the future. Own it now.',
    gradient: 'from-green-500 to-emerald-600',
    textColor: 'text-green-50',
    filterValue: 'xyz'
  }
];

interface StackedTrendingCardsProps {
  onExploreClick?: (filterValue: string) => void;
}

export default function StackedTrendingCards({ onExploreClick }: StackedTrendingCardsProps) {
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setClickedIndex(clickedIndex === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setClickedIndex(null);
      }
    };

    if (clickedIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedIndex]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">The Hottest Extensions.</h3>
        <p className="text-gray-300 text-sm">The most active and high-value extensions moving fast right now.</p>
      </div>

      <div className="relative h-[320px] w-full flex items-center justify-center overflow-visible">
        {categories.map((category, index) => {
          const isActive = clickedIndex === index;
          const isAnyActive = clickedIndex !== null;

          // Fan out horizontally like game cards
          const totalCards = categories.length;
          const centerIndex = (totalCards - 1) / 2;
          const angleStep = 12; // degrees between cards - increased for more dramatic fan
          const baseAngle = (index - centerIndex) * angleStep;
          const angle = isAnyActive ? (isActive ? 0 : baseAngle * 1.3) : baseAngle;

          // Horizontal spread when idle, more spread when clicked - significantly increased
          const baseSpread = 140;
          const clickSpread = isActive ? 0 : 200;
          const horizontalOffset = isAnyActive ? (index - centerIndex) * clickSpread : (index - centerIndex) * baseSpread;

          // Vertical offset for card fan effect
          const verticalOffset = isAnyActive && !isActive ? Math.abs(index - centerIndex) * 30 : Math.abs(index - centerIndex) * 15;

          const scale = isActive ? 1.15 : isAnyActive ? 0.85 : 1;
          const opacity = isAnyActive && !isActive ? 0 : 1;
          // Active card always gets highest z-index, others get base z-index
          const baseZIndex = 10 + (totalCards - Math.abs(index - centerIndex));
          const zIndex = isActive ? 999 : (isAnyActive ? baseZIndex - 50 : baseZIndex);

          return (
            <div
              key={index}
              onClick={(e) => handleCardClick(e, index)}
              className="absolute cursor-pointer transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${horizontalOffset}px) translateY(${verticalOffset}px) rotate(${angle}deg) scale(${scale})`,
                opacity,
                zIndex
              }}
            >
              <div
                className={`bg-gradient-to-br ${category.gradient} rounded-2xl p-6 shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-500 w-[300px] ${
                  isActive ? 'shadow-3xl' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className={`text-2xl font-black ${category.textColor} tracking-tight`}>
                      {category.extension}
                    </div>
                    <div className={`text-base font-bold ${category.textColor} mt-1`}>
                      {category.title}
                    </div>
                  </div>
                  <div
                    className={`transition-all duration-500 ${
                      isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                    }`}
                  >
                    <div className={`p-2 bg-white/20 backdrop-blur-sm rounded-lg ${category.textColor}`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <p className={`${category.textColor} text-sm leading-relaxed opacity-90`}>
                  {category.description}
                </p>

                <div
                  className={`mt-3 pt-3 border-t border-white/20 transition-all duration-500 ${
                    isActive ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExploreClick?.(category.filterValue);
                    }}
                    className={`flex items-center gap-2 ${category.textColor} font-semibold text-sm hover:gap-3 transition-all duration-300`}
                  >
                    <span>Explore Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
