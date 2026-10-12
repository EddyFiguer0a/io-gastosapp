import React from 'react';

interface SplitCardProps {
  topClassName?: string;
  topContent: React.ReactNode;
  bottomContent: React.ReactNode;
  className?: string;
}

export const SplitCard: React.FC<SplitCardProps> = ({
  topClassName = '',
  topContent,
  bottomContent,
  className = '',
}) => {
  return (
    <div className={`rounded-[28px] overflow-hidden shadow-lg relative flex flex-col mb-4 ${className}`}>
      {/* Top Section */}
      <div className={`p-5 sm:p-6 text-black relative ${topClassName}`}>
        {topContent}
      </div>

      {/* Bottom Section */}
      <div className="bg-[var(--bg-card-elevated)] text-[var(--text-primary)] px-5 py-4 flex flex-col border-t border-black/10">
        {bottomContent}
      </div>
    </div>
  );
};
