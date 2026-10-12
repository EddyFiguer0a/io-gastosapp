import React, { useState } from 'react';
import {
  CreditCard,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
} from 'lucide-react';
import type { TarjetaCreditoInfo } from '../types/finance';
import { formatQ, formatFechaCorta } from '../lib/validation';
import tarjetaCreditoImg from '../assets/Tarjeta_credito.png';

interface Props {
  info: TarjetaCreditoInfo;
  onOpenQuickEntry: () => void;
  onPayOffCard: () => void;
}

export const CreditCardCard: React.FC<Props> = ({ info, onOpenQuickEntry, onPayOffCard }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isNearDueDate = info.dias_para_limite <= 5;

  return (
    <div className="rounded-3xl border border-white/20 shadow-xl relative overflow-hidden transition-all flex flex-col justify-end">
      {/* Imagen de fondo de la Tarjeta Bi llenando todo el recuadro */}
      <img
        src={tarjetaCreditoImg}
        alt="Tarjeta de Crédito Bi Mastercard"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Gradiente oscuro inferior para que el texto resalte y gradiente superior ligero */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />

      {/* CONTENIDO SUPERPUESTO */}
      <div className="relative z-10 flex flex-col h-full justify-between p-5 sm:p-6 min-h-[220px]">
        {/* Espacio superior con recordatorio de corte */}
        <div className="flex-1 mt-1 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 shadow-sm">
            <Calendar size={11} className={isNearDueDate ? 'text-rose-400' : 'text-blue-300'} />
            <span className="text-[9px] font-bold tracking-widest uppercase">
              Corte día {info.dia_limite_pago || 12} · {info.dias_para_limite === 0 ? '¡Hoy!' : `Faltan ${info.dias_para_limite} días`}
            </span>
          </div>
        </div>

        {/* FILA INFERIOR: Monto Gigante y Consumos */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block drop-shadow-sm">
              Total Cargado
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] mt-1 leading-none">
              {formatQ(info.total_cargado)}
            </div>
          </div>

          <div className="text-right pr-14 sm:pr-16 mb-1">
            <span className="text-xs font-bold text-white/90 drop-shadow-md tabular-nums block">
              {info.transacciones.length} consumos
            </span>
          </div>
        </div>
      </div>

      {/* TOGGLE PARA DESGLOSE DE CONSUMOS (Fondo semitransparente para legibilidad) */}
      <div className="relative z-10 bg-black/40 backdrop-blur-md border-t border-white/10 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 active-press transition-colors"
        >
          <span>{isExpanded ? 'Ocultar consumos' : `Ver ${info.transacciones.length} consumos`}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className="flex items-center gap-3">
          {info.total_cargado > 0 && (
            <button
              onClick={onPayOffCard}
              className="text-[10px] font-bold text-[var(--fab-text)] bg-[var(--accent-brand)] hover:brightness-110 px-2.5 py-1 rounded-full active-press transition-colors drop-shadow-sm flex items-center gap-1"
            >
              Pagado
            </button>
          )}
          <button
            onClick={onOpenQuickEntry}
            className="text-xs font-bold text-[var(--accent-brand)] hover:brightness-110 flex items-center gap-1 active-press transition-colors drop-shadow-sm"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Registrar</span>
          </button>
        </div>
      </div>

      {/* LISTA EXPANDIBLE DE TRANSACCIONES DE TARJETA */}
      {isExpanded && (
        <div className="relative z-10 bg-[var(--bg-card)] p-4 space-y-2 animate-fade-in max-h-60 overflow-y-auto border-t border-[var(--border-subtle)]">
          {info.transacciones.map((t, idx) => (
            <div
              key={t.id || idx}
              className="p-3 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-[var(--text-primary)] truncate uppercase tracking-tight">
                  {t.concepto}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {formatFechaCorta(t.fecha)}
                </div>
              </div>

              <div className="font-bold text-[var(--text-primary)] tabular-nums shrink-0">
                -{formatQ(t.monto)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
