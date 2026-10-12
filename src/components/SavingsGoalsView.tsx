import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  Target,
  Sparkles,
  Clock,
  CheckCircle2,
  X,
  Wallet,
  Gift,
  Flag,
} from 'lucide-react';
import type { MetaConStats, AhorroMesadaInfo, OrigenAporte } from '../types/finance';
import { formatQ, formatPercent, metaAhorroSchema, aporteMetaSchema, getZodErrorMessage } from '../lib/validation';
import { CyberGoalCard } from './ui/CyberGoalCard';
import { MintGoalCard } from './ui/MintGoalCard';

interface Props {
  metas: MetaConStats[];
  ahorroMesada?: AhorroMesadaInfo;
  visualStyle: string;
  onAddMeta: (data: {
    titulo: string;
    precio_objetivo: number;
    meta_mensual: number;
    monto_acumulado?: number;
    color_tag?: string;
    fecha_limite?: string | null;
  }) => Promise<void>;
  onAporteMeta: (metaId: string, monto: number, origen: OrigenAporte) => Promise<void>;
}

const COLOR_TAGS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', bar: 'bg-orange-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', bar: 'bg-violet-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', bar: 'bg-cyan-400' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', bar: 'bg-rose-400' },
};

interface GoalCardTheme {
  gradient: string;
  pillBg: string;
  pillText: string;
}

const GOAL_THEMES: Record<string, GoalCardTheme> = {
  // Orange / Peach (Fund Beginner)
  orange: {
    gradient: 'bg-gradient-to-br from-[#ff8c42] via-[#ffa060] to-[#fec89a]',
    pillBg: 'bg-[#a44214]',
    pillText: 'text-white',
  },
  // Lavender / Soft Purple (Fund Intremiate)
  violet: {
    gradient: 'bg-gradient-to-br from-[#b8b5ff] via-[#c7c5ff] to-[#e6e5ff]',
    pillBg: 'bg-[#4338ca]',
    pillText: 'text-white',
  },
  // Warm Peach / Sand (Fund Hard)
  amber: {
    gradient: 'bg-gradient-to-br from-[#fdba74] via-[#fed7aa] to-[#ffedd5]',
    pillBg: 'bg-[#9a3412]',
    pillText: 'text-white',
  },
  // Fresh Mint / Emerald
  emerald: {
    gradient: 'bg-gradient-to-br from-[#6ee7b7] via-[#a7f3d0] to-[#d1fae5]',
    pillBg: 'bg-[#065f46]',
    pillText: 'text-white',
  },
  // Sky / Cyan
  cyan: {
    gradient: 'bg-gradient-to-br from-[#7dd3fc] via-[#bae6fd] to-[#e0f2fe]',
    pillBg: 'bg-[#0369a1]',
    pillText: 'text-white',
  },
  // Soft Rose / Coral
  rose: {
    gradient: 'bg-gradient-to-br from-[#fda4af] via-[#fecdd3] to-[#ffe4e6]',
    pillBg: 'bg-[#9f1239]',
    pillText: 'text-white',
  },
};

const THEME_KEYS = ['orange', 'violet', 'amber', 'emerald', 'cyan', 'rose'];

export const SavingsGoalsView: React.FC<Props> = ({
  metas,
  ahorroMesada,
  visualStyle,
  onAddMeta,
  onAporteMeta,
}) => {
  const [selectedMetaForAporte, setSelectedMetaForAporte] = useState<MetaConStats | null>(null);
  const [aporteMonto, setAporteMonto] = useState('');
  const [origenAporte, setOrigenAporte] = useState<OrigenAporte>('mesada');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // New goal form state
  const [titulo, setTitulo] = useState('');
  const [precioObjetivo, setPrecioObjetivo] = useState('');
  const [metaMensual, setMetaMensual] = useState('');
  const [colorTag, setColorTag] = useState('cyan');
  const [fechaLimite, setFechaLimite] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total shopping goals overview
  const totalObjetivos = metas.reduce((acc, m) => acc + (Number(m.precio_objetivo) || 0), 0);
  const totalAcumulado = metas.reduce((acc, m) => acc + (Number(m.monto_acumulado) || 0), 0);
  const progresoGeneral = totalObjetivos > 0 ? (totalAcumulado / totalObjetivos) * 100 : 0;

  const handleAporteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMetaForAporte) return;

    const validation = aporteMetaSchema.safeParse({
      meta_id: selectedMetaForAporte.id,
      monto: Number(aporteMonto),
    });

    if (!validation.success) {
      alert(getZodErrorMessage(validation.error));
      return;
    }

    try {
      setIsSubmitting(true);
      await onAporteMeta(selectedMetaForAporte.id, validation.data.monto, origenAporte);
      setSelectedMetaForAporte(null);
      setAporteMonto('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = metaAhorroSchema.safeParse({
      titulo,
      precio_objetivo: Number(precioObjetivo),
      meta_mensual: Number(metaMensual) || 0,
      monto_acumulado: 0, // Todas las metas inician en 0 según lo solicitado
      color_tag: colorTag,
      fecha_limite: fechaLimite || null,
    });

    if (!validation.success) {
      setFormError(getZodErrorMessage(validation.error));
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddMeta({
        titulo: validation.data.titulo,
        precio_objetivo: validation.data.precio_objetivo,
        meta_mensual: validation.data.meta_mensual,
        monto_acumulado: 0,
        color_tag: validation.data.color_tag,
        fecha_limite: validation.data.fecha_limite,
      });

      setTitulo('');
      setPrecioObjetivo('');
      setMetaMensual('');
      setColorTag('cyan');
      setFechaLimite('');
      setShowAddGoalModal(false);
    } catch {
      setFormError('No se pudo guardar la meta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-4 pb-24 animate-fade-in">
      {/* HEADER DE SECCIÓN CON BOTÓN AÑADIR META */}
      <div className="flex items-center justify-between px-1 mt-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
          Objetivos a Comprar
        </h2>

        <button
          onClick={() => setShowAddGoalModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-colors active-press shadow-sm"
        >
          <Plus size={14} className="text-[var(--accent-brand)]" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* CARDS DE METAS DE AHORRO (ESTILO EDITORIAL FIGMA) */}
      <div className="space-y-3.5 mt-2">
        {[...metas].sort((a, b) => b.monto_acumulado - a.monto_acumulado).map((meta, index) => {
          const selectedThemeKey =
            meta.color_tag && GOAL_THEMES[meta.color_tag]
              ? meta.color_tag
              : THEME_KEYS[index % THEME_KEYS.length];
          const theme = GOAL_THEMES[selectedThemeKey];
          const isCompleted = meta.completada;

          return visualStyle === 'cyber' ? (
            <CyberGoalCard
              key={meta.id}
              meta={meta}
              theme={theme}
              onAportar={() => setSelectedMetaForAporte(meta)}
            />
          ) : (
            <MintGoalCard
              key={meta.id}
              meta={meta}
              theme={theme}
              onAportar={() => setSelectedMetaForAporte(meta)}
            />
          );
        })}
      </div>

      </div>

      {/* MODAL: APORTE DIRECTO A META CON SELECTOR DE ORIGEN DE FONDOS */}
      {selectedMetaForAporte && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-3xl sm:rounded-3xl px-5 pt-5 pb-safe shadow-2xl animate-sheet max-h-[90dvh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <span className="text-[10px] font-bold text-[var(--accent-brand)] uppercase tracking-wider block">
                  Aporte a Objetivo
                </span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[240px]">
                  {selectedMetaForAporte.titulo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMetaForAporte(null)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active-press"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAporteSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">
                  Monto a Abonar (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  autoFocus
                  value={aporteMonto}
                  onChange={(e) => setAporteMonto(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-2xl font-extrabold text-[var(--text-primary)] text-center tabular-nums focus:border-[var(--accent-brand)] focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Chips de Aporte Rápido */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setAporteMonto(String(chip))}
                    className="py-1.5 rounded-xl bg-[var(--bg-card-inner)] hover:bg-[var(--accent-brand)]/20 text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border-subtle)] active-press transition-colors tabular-nums"
                  >
                    +Q{chip}
                  </button>
                ))}
              </div>

              {/* SELECTOR DE ORIGEN DE FONDOS (SUELDO VS MESADA) */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  ¿De dónde sale este dinero?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrigenAporte('mesada')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all active-press ${origenAporte === 'mesada'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 font-bold'
                        : 'bg-[var(--bg-card-inner)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Gift size={13} />
                      <span>De mi Mesada</span>
                    </div>
                    <span className="text-[10px] opacity-80">
                      {ahorroMesada ? `${formatQ(ahorroMesada.total_disponible)} disp.` : 'Disponibles'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrigenAporte('sueldo')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all active-press ${origenAporte === 'sueldo'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 font-bold'
                        : 'bg-[var(--bg-card-inner)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Wallet size={13} />
                      <span>De mi Sueldo</span>
                    </div>
                    <span className="text-[10px] opacity-80">
                      Descuenta del balance laboral
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !aporteMonto}
                  className="w-full py-3 rounded-xl bg-[var(--accent-brand)] hover:brightness-110 text-[var(--fab-text)] font-bold text-xs uppercase tracking-wider active-press transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando Aporte...' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / SHEET: NUEVA META DE AHORRO */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-3xl sm:rounded-3xl px-5 pt-5 pb-safe shadow-2xl animate-sheet max-h-[90dvh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Nueva Meta de Compra
              </h3>
              <button
                onClick={() => setShowAddGoalModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active-press"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 mt-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                  Objetivo / Artículo
                </label>
                <input
                  type="text"
                  placeholder="ej. TABLET S10 FE, NEW BALANCE 550"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:border-cyan-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                    Precio Objetivo (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="1000.00"
                    value={precioObjetivo}
                    onChange={(e) => setPrecioObjetivo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold tabular-nums focus:border-cyan-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                    Meta Mensual (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="250.00"
                    value={metaMensual}
                    onChange={(e) => setMetaMensual(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold tabular-nums focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                  Color Distintivo
                </label>
                <div className="flex gap-2">
                  {Object.keys(COLOR_TAGS).map((key) => {
                    const isSelected = colorTag === key;
                    const c = COLOR_TAGS[key];
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setColorTag(key)}
                        className={`w-8 h-8 rounded-xl ${c.bar} transition-all flex items-center justify-center ${isSelected ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-60 hover:opacity-100'
                          }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider active-press transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando Meta...' : 'Crear Meta de Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
