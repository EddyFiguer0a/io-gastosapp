import React, { useState } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  PieChart,
  X,
  Pin,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { CategoriaConStats } from '../types/finance';
import { formatQ, formatPercent, categoriaSchema, getZodErrorMessage } from '../lib/validation';
import { CategoryIcon } from './CategoryIcon';
import { SplitCard } from './ui/SplitCard';
import { BaseCard } from './ui/BaseCard';
import { TransactionRow } from './ui/TransactionRow';
import { IconPickerModal } from './IconPickerModal';

interface Props {
  categorias: CategoriaConStats[];
  totalPresupuestado: number;
  totalGastosReales: number;
  onAddCategoria: (data: {
    nombre: string;
    icono: string;
    presupuestado: number;
    descripcion?: string;
    es_fijo?: boolean;
  }) => Promise<void>;
  onDeleteCategoria?: (id: string) => Promise<void>;
  onOpenQuickEntryForCategory?: (categoriaId: string) => void;
}

export const BudgetView: React.FC<Props> = ({
  categorias,
  totalPresupuestado,
  totalGastosReales,
  onAddCategoria,
  onDeleteCategoria,
}) => {
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'fijos' | 'variables' | 'danger'>('all');

  // Form state para nueva categoría
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [presupuestado, setPresupuestado] = useState('');
  const [icono, setIcono] = useState('Tag');
  const [esFijo, setEsFijo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para modal de confirmación de eliminación
  const [catToDelete, setCatToDelete] = useState<CategoriaConStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const porcentajeGlobal =
    totalPresupuestado > 0 ? (totalGastosReales / totalPresupuestado) * 100 : 0;
  const margenGlobal = totalPresupuestado - totalGastosReales;

  // Estadísticas de Fijos vs Variables
  const totalFijoPresupuestado = categorias
    .filter((c) => c.es_fijo)
    .reduce((sum, c) => sum + Number(c.presupuestado || 0), 0);
  const totalVariablePresupuestado = categorias
    .filter((c) => !c.es_fijo)
    .reduce((sum, c) => sum + Number(c.presupuestado || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedCatId((prev) => (prev === id ? null : id));
  };

  const filteredCategorias = categorias.filter((c) => {
    if (filterMode === 'danger') return c.estado === 'danger';
    if (filterMode === 'fijos') return c.es_fijo;
    if (filterMode === 'variables') return !c.es_fijo;
    return true;
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = categoriaSchema.safeParse({
      nombre,
      icono,
      presupuestado: Number(presupuestado) || 0,
      descripcion: descripcion.trim() || undefined,
    });

    if (!validation.success) {
      setFormError(getZodErrorMessage(validation.error));
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddCategoria({
        nombre: validation.data.nombre,
        icono: validation.data.icono,
        presupuestado: validation.data.presupuestado,
        descripcion: validation.data.descripcion || undefined,
        es_fijo: esFijo,
      });
      setNombre('');
      setDescripcion('');
      setPresupuestado('');
      setIcono('Tag');
      setEsFijo(false);
      setShowAddModal(false);
    } catch {
      setFormError('No se pudo crear la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!catToDelete || !onDeleteCategoria) return;
    try {
      setIsDeleting(true);
      await onDeleteCategoria(catToDelete.id);
      setCatToDelete(null);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar la categoría');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-4 pb-24 animate-fade-in">
      {/* HEADER DE EJECUCIÓN GLOBAL */}
      <SplitCard
        topClassName="bg-gradient-to-br from-[#b8b5ff] via-[#c7c5ff] to-[#e6e5ff]"
        topContent={
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PieChart size={14} className="text-[#4338ca]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#4338ca]">
                  Presupuesto & Categorías
                </span>
              </div>
              <span
                className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                  margenGlobal < 0
                    ? 'bg-black text-rose-400'
                    : 'bg-[#4338ca] text-white'
                }`}
              >
                {margenGlobal < 0 ? 'Sobrepresupuesto' : `${formatPercent(100 - porcentajeGlobal)} libre`}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-black flex items-baseline gap-1">
                {formatQ(totalGastosReales)}
              </div>
              <p className="text-[11px] font-bold text-[#4338ca] mt-0.5 opacity-90">
                de {formatQ(totalPresupuestado)} presupuestado general
              </p>
            </div>
          </>
        }
        bottomContent={
          <>
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  {margenGlobal < 0 ? 'Déficit' : 'Restante por Gastar'}
                </span>
                <div
                  className={`text-sm font-black tabular-nums tracking-tight mt-0.5 ${
                    margenGlobal < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {margenGlobal < 0 ? `+${formatQ(Math.abs(margenGlobal))}` : formatQ(margenGlobal)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  Ejecución
                </span>
                <div className="text-sm font-black text-white tabular-nums tracking-tight mt-0.5">
                  {formatPercent(porcentajeGlobal)}
                </div>
              </div>
            </div>

            {/* Píldoras informativas Fijos vs Variables */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1">
                <Pin size={11} className="text-[var(--accent)]" /> Fijos: <strong className="text-white tabular-nums">{formatQ(totalFijoPresupuestado)}</strong>
              </span>
              <span className="text-zinc-400">
                Variables: <strong className="text-white tabular-nums">{formatQ(totalVariablePresupuestado)}</strong>
              </span>
            </div>
          </>
        }
      />

      {/* BARRA DE FILTROS & BOTÓN NUEVA */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-[var(--accent)] text-black shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Todas ({categorias.length})
          </button>
          <button
            onClick={() => setFilterMode('fijos')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterMode === 'fijos'
                ? 'bg-[var(--accent)] text-black shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Fijos
          </button>
          <button
            onClick={() => setFilterMode('variables')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterMode === 'variables'
                ? 'bg-[var(--accent)] text-black shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Variables
          </button>
          <button
            onClick={() => setFilterMode('danger')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterMode === 'danger'
                ? 'bg-rose-500/20 text-rose-500 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Excedidas
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-wider transition-transform active-press shrink-0 shadow-md shadow-[var(--accent)]/20"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* LISTA DE CATEGORÍAS */}
      <div className="space-y-2.5">
        {filteredCategorias.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 text-[var(--text-muted)] text-xs">
            <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">
              No hay categorías que coincidan
            </p>
            <p>Puedes agregar una nueva categoría pulsando el botón &quot;Nueva Categoría&quot;.</p>
          </div>
        ) : (
          filteredCategorias.map((cat) => {
            const isExpanded = expandedCatId === cat.id;
            const isDanger = cat.estado === 'danger';
            const isWarning = cat.estado === 'warning';

            return (
              <BaseCard
                key={cat.id}
                className="transition-all duration-200 shadow-lg relative overflow-hidden"
              >
                {/* Fila principal de categoría */}
                <div
                  onClick={() => toggleExpand(cat.id)}
                  className="p-4 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors active-press"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-inner ${
                          isDanger
                            ? 'bg-rose-500/10 border border-rose-500/20'
                            : isWarning
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-black/30 border border-[var(--border-subtle)]'
                        }`}
                      >
                        <CategoryIcon name={cat.icono} size={24} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[var(--text-primary)] text-sm truncate tracking-wide">
                            {cat.nombre}
                          </span>

                          {cat.es_fijo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                              <Pin size={9} /> Fijo
                            </span>
                          )}

                          {isDanger && (
                            <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-rose-500 text-white shrink-0 shadow-sm uppercase tracking-wider">
                              Sobrepasado
                            </span>
                          )}
                        </div>

                        {cat.descripcion && (
                          <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[190px] sm:max-w-xs mt-0.5 font-medium">
                            {cat.descripcion}
                          </p>
                        )}

                        <div className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold uppercase tracking-wider tabular-nums">
                          {cat.transacciones.length} transacciones
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <div>
                        <div className="text-[15px] font-black text-[var(--text-primary)] tabular-nums tracking-tight">
                          {formatQ(cat.gasto_real)}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-medium tabular-nums">
                          de {formatQ(cat.presupuestado)}
                        </div>
                      </div>

                      <div className="text-[var(--text-muted)]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso de la categoría */}
                  <div className="mt-4">
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, cat.porcentaje_consumido)}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDanger
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-black tabular-nums tracking-wider ${
                          isDanger
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-black/40 text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {formatPercent(cat.porcentaje_consumido)}
                      </span>

                      <span
                        className={`font-black tabular-nums tracking-tight text-sm ${
                          cat.desviacion < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {cat.desviacion < 0
                          ? `+${formatQ(Math.abs(cat.desviacion))}`
                          : `Resta ${formatQ(cat.desviacion)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose de transacciones & Acciones de Categoría */}
                {isExpanded && (
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-inner)] px-4 py-3 animate-fade-in">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      <span>Movimientos del periodo</span>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums bg-white/5 px-2 py-0.5 rounded-full">
                          {cat.transacciones.length}
                        </span>

                        {/* Botón Borrar Categoría */}
                        {onDeleteCategoria && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCatToDelete(cat);
                            }}
                            className="text-rose-400 hover:text-rose-300 flex items-center gap-1 active-press transition-colors"
                            title="Eliminar categoría"
                          >
                            <Trash2 size={13} />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {cat.transacciones.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] py-3 text-center">
                        No hay gastos registrados en esta categoría aún.
                      </p>
                    ) : (
                      <div className="space-y-1 mt-3">
                        {cat.transacciones.map((tx) => (
                          <TransactionRow
                            key={tx.id}
                            tx={{
                              ...tx,
                              categoria_icono: cat.icono,
                              categoria_nombre: cat.nombre,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </BaseCard>
            );
          })
        )}
      </div>

      </div>

      {/* MODAL / SHEET: NUEVA CATEGORÍA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-[32px] sm:rounded-[32px] px-6 pt-6 pb-safe shadow-2xl animate-sheet max-h-[90dvh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                  Nueva Categoría de Gasto
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                  Crea una categoría personalizada para tu presupuesto
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active-press"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 mt-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* SELECTOR DE ÍCONO VISUAL PREVIEW */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Ícono de la Categoría
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shadow-inner">
                    <CategoryIcon name={icono} size={28} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] transition-all flex items-center justify-between active-press"
                  >
                    <span>Ícono seleccionado: <strong>{icono}</strong></span>
                    <span className="text-[10px] uppercase font-black text-[var(--accent)]">
                      Cambiar...
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  placeholder="ej. Mantenimiento Auto, Gimnasio, Alquiler"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Presupuesto Planeado (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={presupuestado}
                  onChange={(e) => setPresupuestado(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base font-black tabular-nums placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all"
                  required
                />
              </div>

              {/* TOGGLE GASTO FIJO */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${esFijo ? 'bg-[var(--accent)] text-black' : 'bg-black/20 text-[var(--text-muted)]'}`}>
                    <Pin size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      ¿Es Gasto Fijo / Recurrente?
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      Alquiler, cuotas fijas, internet, seguros
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEsFijo(!esFijo)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                    esFijo ? 'bg-[var(--accent)] justify-end' : 'bg-zinc-700 justify-start'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${esFijo ? 'bg-black' : 'bg-white'}`} />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Pago mensual recurrente"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[var(--accent)] text-black font-black text-xs uppercase tracking-wider active-press hover:brightness-105 transition-all disabled:opacity-50 shadow-md shadow-[var(--accent)]/30"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR DE ÍCONOS */}
      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={icono}
        onSelectIcon={(newIcon) => setIcono(newIcon)}
      />

      {/* MODAL DE CONFIRMACIÓN PARA BORRAR CATEGORÍA */}
      {catToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] px-6 pt-6 pb-safe shadow-2xl animate-sheet text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-base font-black text-[var(--text-primary)]">
              ¿Eliminar categoría?
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Vas a eliminar <strong>&quot;{catToDelete.nombre}&quot;</strong>.
              {catToDelete.transacciones.length > 0 && (
                <span className="text-rose-400 block mt-1 font-bold">
                  Atención: tiene {catToDelete.transacciones.length} transacción(es) en este mes que también se eliminarán.
                </span>
              )}
            </p>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active-press transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-xs font-black uppercase tracking-wider hover:bg-rose-600 active-press transition-colors shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? 'Borrando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
