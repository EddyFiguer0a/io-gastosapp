import React from 'react';
import type { TransaccionGasto } from '../../types/finance';
import { formatQ, formatFechaCorta } from '../../lib/validation';
import { CategoryIcon } from '../CategoryIcon';

interface TransactionRowProps {
  tx: TransaccionGasto & {
    categoria_nombre?: string;
    categoria_icono?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  tx,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-2xl bg-black/20 hover:bg-black/30 border border-white/5 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[var(--accent)]">
          <CategoryIcon name={tx.categoria_icono || 'Tag'} size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
            {tx.concepto}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium">
            {formatFechaCorta(tx.fecha)}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 font-black text-xs text-rose-400 tabular-nums">
        -{formatQ(tx.monto)}
      </div>
    </div>
  );
};
