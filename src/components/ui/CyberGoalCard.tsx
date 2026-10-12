import React from 'react';
import { Plus, CheckCircle2, Flag } from 'lucide-react';
import type { MetaConStats } from '../../types/finance';
import { formatQ, formatPercent } from '../../lib/validation';

interface Props {
  meta: MetaConStats;
  theme: {
    gradient: string;
    pillBg: string;
    pillText: string;
  };
  onAportar: () => void;
}

export const CyberGoalCard: React.FC<Props> = ({ meta, theme, onAportar }) => {
  const isCompleted = meta.completada;

  return (
    <div
      className={`rounded-[24px] ${theme.gradient} p-4 sm:p-5 shadow-lg border border-black/5 relative overflow-hidden transition-all duration-200 hover:shadow-xl`}
    >
      <div className="flex justify-between items-start mb-1 gap-2">
        <div className="min-w-0 pr-2">
          <h3 className="text-sm sm:text-base font-black text-black tracking-tight leading-none truncate">
            {meta.titulo}
          </h3>
          <p className="text-[10px] font-semibold text-black/60 mt-1.5 truncate">
            Meta: {formatQ(meta.precio_objetivo)}{' '}
            {meta.meta_mensual > 0 && `· ${formatQ(meta.meta_mensual)}/mes`}
          </p>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="text-sm sm:text-base font-black text-black tabular-nums tracking-tight">
            {formatQ(meta.monto_acumulado)}
          </div>
          {isCompleted ? (
            <span className="mt-1.5 px-2 py-0.5 text-[9px] font-black rounded-full bg-black/10 text-black shadow-sm flex items-center gap-1">
              <CheckCircle2 size={10} />
              Logrado
            </span>
          ) : (
            <button
              onClick={onAportar}
              className="mt-1.5 px-2.5 py-1 rounded-full bg-black hover:bg-black/80 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors active-press shadow-sm"
            >
              <Plus size={10} strokeWidth={3} /> Aportar
            </button>
          )}
        </div>
      </div>

      {/* Progress Track (Camino y Bandera) */}
      <div className="relative w-full h-10 mt-2">
        {/* Track Line */}
        <div className="absolute top-1/2 left-2 right-6 h-[2px] border-t-2 border-dashed border-black/20 -translate-y-1/2" />

        {/* Goal Flag */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-black/40">
          <Flag size={20} className="fill-black/10" />
        </div>

        {/* Moving Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-700 ease-out flex flex-col items-center"
          style={{
            left: `calc(${Math.min(100, meta.porcentaje_progreso)}% - 24px * (${Math.min(
              100,
              meta.porcentaje_progreso
            )} / 100))`,
          }}
        >
          {/* Tooltip */}
          <span className="absolute -top-4 text-[9px] font-black text-black bg-white/40 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            {formatPercent(meta.porcentaje_progreso)}
          </span>
          {/* Avatar / Coin */}
          <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-md flex items-center justify-center relative mt-3">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
