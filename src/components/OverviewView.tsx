import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Zap,
  Sparkles,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import type { PresupuestoCompleto, QuickEntryType, VisualTheme, ActiveTab } from '../types/finance';
import { formatQ, formatFechaCorta, formatPercent } from '../lib/validation';
import { CategoryIcon } from './CategoryIcon';
import { CreditCardCard } from './CreditCardCard';
import { AhorroMesadaCard } from './AhorroMesadaCard';
import { SplitCard } from './ui/SplitCard';

interface Props {
  data: PresupuestoCompleto;
  visualStyle: string;
  onOpenQuickEntry: (tipo?: QuickEntryType) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onPayOffCard: (selectedTxIds: string[], cuentaOrigenId: string) => Promise<void>;
  userName?: string;
  onUpdateMesada?: (id: string, data: { nombre?: string; acumulado?: number }) => Promise<void>;
  onDeleteMesada?: (id: string) => Promise<void>;
  onCreateMesada?: (data: { nombre: string; acumulado: number }) => Promise<void>;
}

import { PayCreditCardModal } from './PayCreditCardModal';

export const OverviewView: React.FC<Props> = ({
  data,
  visualStyle,
  onOpenQuickEntry,
  onNavigateTab,
  onPayOffCard,
  userName,
  onUpdateMesada,
  onDeleteMesada,
  onCreateMesada,
}) => {
  const { metricas, transacciones, tarjetaCredito, ahorroMesada, cuentas } = data;
  const {
    balance_disponible,
    total_ingresos_recibidos,
    total_gastos_reales,
    porcentaje_gasto_vs_ingreso,
  } = metricas;

  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);

  const handlePayOffCardSubmit = async (selectedTxIds: string[], cuentaOrigenId: string) => {
    try {
      setIsPaying(true);
      await onPayOffCard(selectedTxIds, cuentaOrigenId);
      setIsPayModalOpen(false);
    } finally {
      setIsPaying(false);
    }
  };

  const recentTransactions = transacciones.slice(0, 5);
  const circularPercent = Math.min(100, Math.max(0, Math.round(porcentaje_gasto_vs_ingreso)));

  // SVG semicircular gauge calculations:
  // Radius r = 75, arc length = pi * 75 = 235.6
  const arcLength = 235.6;
  const strokeOffset = arcLength * (1 - circularPercent / 100);

  const displayFirstName = userName ? userName.split(' ')[0] : 'Usuario';
  const initial = displayFirstName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      {/* ========================================================
          BARRA DE PERFIL Y SALUDO (ESTILO REFERENCIA IMAGEN 1 & 2)
          ======================================================== */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[var(--accent-brand)] text-black font-black text-xs flex items-center justify-center border-2 border-black/15 shadow-sm uppercase">
            {initial}
          </div>
          <div>
            <h2 className="text-sm font-black text-[var(--text-primary)] leading-tight">
              Hey, {displayFirstName}
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">
              Tus finanzas personales bajo control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenQuickEntry('gasto')}
            aria-label="Registrar gasto rápido"
            className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent-brand)] active-press transition-colors shadow-sm"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* ========================================================
          HERO CARD ADAPTATIVA (CYBER VS SAGE/VIOLET)
          ======================================================== */}
      {visualStyle === 'cyber' ? (
        <div className="rounded-[32px] bg-[var(--accent-brand)] text-[#000000] p-5 sm:p-6 shadow-2xl shadow-lime-950/40 relative overflow-hidden transition-all duration-300 mb-4">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1.5">
              <Zap size={14} />
              Balance Total Libre
            </span>
            <span className="px-2.5 py-1 text-[9px] font-black rounded-full bg-black/10 backdrop-blur-sm border border-black/5 uppercase tracking-wider">
              Septiembre 2026
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between relative z-10">
            <div>
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter">
                {formatQ(balance_disponible)}
              </div>
              <p className="text-[10px] font-bold mt-1 opacity-70">
                Dinero disponible para gastar
              </p>
            </div>

            {/* Gráfico circular simplificado (Gauge) */}
            <div className="relative w-16 h-16 shrink-0 ml-2">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="75" className="stroke-black/10" strokeWidth="10" fill="none" />
                <circle cx="80" cy="80" r="75" className="stroke-black" strokeWidth="10" fill="none"
                  strokeDasharray={arcLength} strokeDashoffset={strokeOffset} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[14px] font-black leading-none">{circularPercent}%</span>
                <span className="text-[7px] font-bold uppercase opacity-60 mt-0.5">Uso</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2 relative z-10">
            <button
              onClick={() => onOpenQuickEntry('ingreso')}
              className="flex-1 bg-black/5 rounded-2xl p-2.5 backdrop-blur-sm border border-black/5 hover:bg-black/10 active-press transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase opacity-60 mb-0.5">
                <ArrowDownRight size={10} /> Ingresos Reales
              </div>
              <div className="text-sm font-black tabular-nums">{formatQ(total_ingresos_recibidos)}</div>
            </button>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="flex-1 bg-black/5 rounded-2xl p-2.5 backdrop-blur-sm border border-black/5 hover:bg-black/10 active-press transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase opacity-60 mb-0.5">
                <ArrowUpRight size={10} /> Gastos Reales
              </div>
              <div className="text-sm font-black tabular-nums">{formatQ(total_gastos_reales)}</div>
            </button>
          </div>
        </div>
      ) : (
        <SplitCard
          topClassName="bg-gradient-to-br from-[#b8b5ff] via-[#c7c5ff] to-[#e6e5ff]"
          topContent={
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#4338ca]" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#4338ca]">
                    Balance Total Libre
                  </span>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-black rounded-full bg-[#4338ca] text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
                  Septiembre 2026
                </span>
              </div>
              <div className="mt-3">
                <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight flex items-baseline gap-1">
                  {formatQ(balance_disponible)}
                </div>
                <p className="text-[11px] font-bold text-[#4338ca] mt-0.5 opacity-90">
                  Dinero disponible para gastar o ahorrar hoy
                </p>
              </div>
            </>
          }
          bottomContent={
            <div className="flex items-center justify-between">
              <button
                onClick={() => onOpenQuickEntry('ingreso')}
                className="flex flex-col text-left hover:opacity-80 active-press transition-opacity"
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Ingresos Reales
                </span>
                <span className="text-sm font-black text-emerald-400 tabular-nums tracking-tight mt-0.5">
                  +{formatQ(total_ingresos_recibidos)}
                </span>
              </button>
              <div className="h-8 w-px bg-white/10 mx-2" />
              <button
                onClick={() => onNavigateTab('transactions')}
                className="flex flex-col text-right hover:opacity-80 active-press transition-opacity"
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Gastos Reales
                </span>
                <span className="text-sm font-black text-rose-400 tabular-nums tracking-tight mt-0.5">
                  -{formatQ(total_gastos_reales)}
                </span>
              </button>
            </div>
          }
        />
      )}



      {/* ========================================================
          MÓDULO: TARJETA DE CRÉDITO (CORTE DÍA 12, Q 1,646.00)
          ======================================================== */}
      {tarjetaCredito && (
        <CreditCardCard
          info={tarjetaCredito}
          onOpenQuickEntry={() => onOpenQuickEntry('gasto')}
          onPayOffCard={() => setIsPayModalOpen(true)}
        />
      )}

      {/* ========================================================
          POZO DE MESADA (MOVIDO DESDE CUENTAS)
          ======================================================== */}
      {ahorroMesada && (
        <AhorroMesadaCard
          data={ahorroMesada}
          onUpdateMesada={onUpdateMesada}
          onDeleteMesada={onDeleteMesada}
          onCreateMesada={onCreateMesada}
        />
      )}





      <PayCreditCardModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        cuentas={cuentas}
        transaccionesTarjeta={tarjetaCredito?.transacciones || []}
        onPay={handlePayOffCardSubmit}
        isSubmitting={isPaying}
      />
    </div>
  );
};