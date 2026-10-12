import React from 'react';

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[24px] ${className}`}
    >
      {children}
    </div>
  );
};
