import React from 'react';
import { Plus } from 'lucide-react';
import type { MetaConStats } from '../../types/finance';
import { formatQ, formatPercent } from '../../lib/validation';
import { SplitCard } from './SplitCard';

interface Props {
  meta: MetaConStats;
  theme: {
    gradient: string;
    pillBg: string;
    pillText: string;
  };
  onAportar: () => void;
}

export const MintGoalCard: React.FC<Props> = ({ meta, theme, onAportar }) => {
  const isCompleted = meta.completada;

  return (
    <SplitCard
      topClassName={`${theme.gradient} pt-4 pb-3 px-5 border-none shadow-none`}
      topContent={
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <h3 className="text-sm sm:text-base font-black text-black tracking-tight leading-none truncate uppercase">
                {meta.titulo}
              </h3>
              <p className="text-[10px] sm:text-xs font-medium text-black/70 mt-1 truncate">
                Precio meta: {formatQ(meta.precio_objetivo)}{' '}
                {meta.meta_mensual > 0 && `- ${formatQ(meta.meta_mensual)}/mes`}
              </p>
            </div>
            {!isCompleted && (
              <button
                onClick={onAportar}
                className="shrink-0 px-3 py-1.5 rounded-full bg-black hover:bg-black/80 text-white text-[10px] font-bold flex items-center gap-1 transition-colors active-press shadow-sm"
              >
                <Plus size={12} strokeWidth={3} /> Aportar
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 mt-1">
            <div className="flex">
              <span
                className={`px-2.5 py-1 text-[10px] font-black rounded-full shadow-sm flex items-center gap-1 ${theme.pillBg} ${theme.pillText}`}
              >
                Progreso: {formatPercent(meta.porcentaje_progreso)}
                {meta.meses_estimados != null && meta.meses_estimados > 0 && ` · ~${meta.meses_estimados} meses`}
              </span>
            </div>

            {/* Simple Progress Bar */}
            <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-black/40 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, meta.porcentaje_progreso)}%` }}
              />
            </div>
          </div>
        </div>
      }
      bottomContent={
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium block">Acumulado</span>
            <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatQ(meta.monto_acumulado)}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] font-medium block">
              {isCompleted ? '¡Completada!' : 'Resta'}
            </span>
            <span
              className={`font-black tabular-nums ${
                isCompleted ? 'text-emerald-500' : 'text-[var(--text-primary)]'
              }`}
            >
              {isCompleted ? '100%' : formatQ(meta.monto_restante)}
            </span>
          </div>
        </div>
      }
    />
  );
};
