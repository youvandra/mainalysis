import { useState } from 'react';

interface InteractiveGlowCardProps {
  title: React.ReactNode;
  subtitle: string;
  description: string;
  children?: React.ReactNode;
}

export default function InteractiveGlowCard({ title, subtitle, description, children }: InteractiveGlowCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="relative p-[2px] rounded-xl overflow-hidden group bg-white">
      <div className="absolute inset-0 rounded-xl opacity-75 blur-sm animate-border-glow"
           style={{
             background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
             backgroundSize: '400% 400%'
           }}
      />

      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative p-6 rounded-xl border border-transparent transition-all duration-200 cursor-pointer overflow-hidden bg-white"
      >
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: isHovered ? 1 : 0,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.1))'
          }}
        />

        <div className="relative z-10">
          {subtitle && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{subtitle}</div>
          )}
          <div className="text-2xl font-black text-gray-900 mb-1">{title}</div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
