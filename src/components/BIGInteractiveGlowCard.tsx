import { useRef, useState } from 'react';

interface BIGInteractiveGlowCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function BIGInteractiveGlowCard({ title, description, children }: BIGInteractiveGlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl mb-8"
    >
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15) 40%, transparent 70%)`
        }}
      />


      <div className="relative z-10 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end items-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
