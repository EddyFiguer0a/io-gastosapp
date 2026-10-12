import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  SlidersHorizontal,
  X,
  TrendingDown,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import type {
  TransaccionGasto,
  Ingreso,
  TransferenciaItem,
  Cuenta,
  CategoriaConStats,
  MovimientoHistorial,
  TipoMovimiento,
} from '../types/finance';
import { formatQ, formatFechaCorta } from '../lib/validation';
import { CategoryIcon } from './CategoryIcon';
import { SwipeableRow } from './ui/SwipeableRow';

interface Props {
  transacciones: TransaccionGasto[];
  ingresos?: Ingreso[];
  transferencias?: TransferenciaItem[];
  cuentas?: Cuenta[];
  categorias?: CategoriaConStats[];
  onDeleteTransaccion: (id: string) => Promise<void>;
  onEditTransaccion: (id: string, data: Partial<TransaccionGasto>) => Promise<void>;
  onDeleteIngreso?: (id: string) => Promise<void>;
  onDeleteTransferencia?: (id: string) => Promise<void>;
}

export const TransactionsView: React.FC<Props> = ({
  transacciones = [],
  ingresos = [],
  transferencias = [],
  cuentas = [],
  categorias = [],
  onDeleteTransaccion,
  onEditTransaccion,
  onDeleteIngreso,
  onDeleteTransferencia,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<'todos' | TipoMovimiento>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal para editar transacción de gasto
  const [editingTx, setEditingTx] = useState<TransaccionGasto | null>(null);
  const [editConcepto, setEditConcepto] = useState('');
  const [editMonto, setEditMonto] = useState('');

  // Unificación de todos los movimientos: Gastos, Ingresos y Transferencias
  const allMovements = useMemo<MovimientoHistorial[]>(() => {
    const list: MovimientoHistorial[] = [];
    const cuentaMap = new Map((cuentas || []).map((c) => [c.id, c]));
    const catMap = new Map((categorias || []).map((c) => [c.id, c]));

    // 1. GASTOS (Monto Negativo - Rojo)
    (transacciones || []).forEach((tx) => {
      const cta = cuentaMap.get(tx.cuenta_id);
      const cat = catMap.get(tx.categoria_id);
      list.push({
        id: tx.id,
        tipo: 'gasto',
        concepto: tx.concepto,
        monto: Number(tx.monto) || 0,
        fecha: tx.fecha || tx.created_at?.split('T')[0] || '',
        created_at: tx.created_at,
        cuenta_id: tx.cuenta_id,
        cuenta_nombre: cta?.nombre || (tx.metodo_pago === 'Tarjeta' ? 'Tarjeta de crédito' : 'Cuenta'),
        categoria_id: tx.categoria_id,
        categoria_nombre: cat?.nombre || tx.categoria_nombre || 'General',
        categoria_icono: cat?.icono || tx.categoria_icono || 'bill-receipt',
        metodo_pago: tx.metodo_pago,
        originalData: tx,
      });
    });

    // 2. INGRESOS (Monto Positivo - Verde)
    (ingresos || []).forEach((ing) => {
      const cta = cuentaMap.get(ing.cuenta_id);
      list.push({
        id: ing.id,
        tipo: 'ingreso',
        concepto: ing.fuente,
        descripcion: ing.descripcion,
        monto: Number(ing.monto_recibido) || Number(ing.monto_esperado) || 0,
        fecha: ing.created_at?.split('T')[0] || '',
        created_at: ing.created_at,
        cuenta_id: ing.cuenta_id,
        cuenta_nombre: cta?.nombre || 'Cuenta',
        categoria_icono: 'bank',
        originalData: ing,
      });
    });

    // 3. TRANSFERENCIAS (Movimiento entre Cuentas - Azul)
    (transferencias || []).forEach((tr) => {
      const ctaOrigen = cuentaMap.get(tr.cuenta_origen_id);
      const ctaDestino = cuentaMap.get(tr.cuenta_destino_id);
      list.push({
        id: tr.id,
        tipo: 'transferencia',
        concepto: tr.concepto || 'Transferencia entre cuentas',
        monto: Number(tr.monto) || 0,
        fecha: tr.fecha || tr.created_at?.split('T')[0] || '',
        created_at: tr.created_at,
        cuenta_origen_nombre: ctaOrigen?.nombre || 'Cuenta Origen',
        cuenta_destino_nombre: ctaDestino?.nombre || 'Cuenta Destino',
        categoria_icono: 'transaction',
        originalData: tr,
      });
    });

    // Ordenar cronológicamente descendente
    return list.sort((a, b) => {
      const dateA = a.fecha || '';
      const dateB = b.fecha || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [transacciones, ingresos, transferencias, cuentas, categorias]);

  // Filtrado por buscador y tipo
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allMovements.filter((mov) => {
      const matchTipo = selectedTipo === 'todos' || mov.tipo === selectedTipo;
      if (!matchTipo) return false;
      if (!q) return true;

      const inConcepto = mov.concepto.toLowerCase().includes(q);
      const inCat = (mov.categoria_nombre || '').toLowerCase().includes(q);
      const inCta = (mov.cuenta_nombre || '').toLowerCase().includes(q);
      const inOrigen = (mov.cuenta_origen_nombre || '').toLowerCase().includes(q);
      const inDestino = (mov.cuenta_destino_nombre || '').toLowerCase().includes(q);
      const inDesc = (mov.descripcion || '').toLowerCase().includes(q);

      return inConcepto || inCat || inCta || inOrigen || inDestino || inDesc;
    });
  }, [allMovements, search, selectedTipo]);

  // Agrupar por fecha
  const grouped = useMemo(() => {
    const map = new Map<string, MovimientoHistorial[]>();
    filtered.forEach((mov) => {
      const dateKey = mov.fecha || 'Sin fecha';
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(mov);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Totales
  const totalFiltrado = useMemo(() => {
    return filtered.reduce((sum, mov) => {
      if (mov.tipo === 'gasto') return sum + mov.monto;
      return sum;
    }, 0);
  }, [filtered]);

  const handleDelete = async (mov: MovimientoHistorial) => {
    const msg =
      mov.tipo === 'gasto'
        ? `¿Eliminar gasto "${mov.concepto}" de ${formatQ(mov.monto)}?`
        : mov.tipo === 'ingreso'
        ? `¿Eliminar ingreso "${mov.concepto}" de ${formatQ(mov.monto)}? Esto descontará el monto de la cuenta asociada.`
        : `¿Eliminar transferencia de ${formatQ(mov.monto)}? Se revertirán los saldos de ambas cuentas.`;

    if (confirm(msg)) {
      try {
        setDeletingId(mov.id);
        if (mov.tipo === 'gasto') {
          await onDeleteTransaccion(mov.id);
        } else if (mov.tipo === 'ingreso' && onDeleteIngreso) {
          await onDeleteIngreso(mov.id);
        } else if (mov.tipo === 'transferencia' && onDeleteTransferencia) {
          await onDeleteTransferencia(mov.id);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEditStart = (mov: MovimientoHistorial) => {
    if (mov.tipo !== 'gasto') return;
    setEditingTx(mov.originalData);
    setEditConcepto(mov.concepto);
    setEditMonto(String(mov.monto));
  };

  const handleEditSave = async () => {
    if (!editingTx) return;
    const numMonto = Number(editMonto);
    if (!editConcepto.trim() || isNaN(numMonto) || numMonto <= 0) {
      alert('Ingresa un concepto válido y un monto mayor a 0');
      return;
    }

    try {
      await onEditTransaccion(editingTx.id, {
        concepto: editConcepto.trim(),
        monto: numMonto,
      });
      setEditingTx(null);
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar');
    }
  };

  return (
    <>
      <div className="space-y-4 pb-28 animate-fade-in">
      {/* ========================================================
          CABECERA HISTORIAL (ESTILO EXACTO SOLICITADO)
          ======================================================== */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4 rounded-[28px] shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/10 border border-lime-500/20 text-lime-400 flex items-center justify-center shrink-0">
              <TrendingDown size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)] leading-tight">Historial</h2>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                {allMovements.length} transacciones • -{formatQ(totalFiltrado)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-32 sm:w-44 pl-8 pr-3 py-1.5 rounded-full bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-brand)] transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors active-press ${
                showFilters || selectedTipo !== 'todos'
                  ? 'bg-[var(--accent-brand)] text-[var(--fab-text)] border-[var(--accent-brand)]'
                  : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Píldoras de filtro colapsables */}
        {showFilters && (
          <div className="flex gap-1.5 pt-3 mt-3 border-t border-[var(--border-subtle)] overflow-x-auto no-scrollbar animate-fade-in">
            <button
              type="button"
              onClick={() => setSelectedTipo('todos')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active-press ${
                selectedTipo === 'todos'
                  ? 'bg-[var(--accent-brand)] text-[var(--fab-text)]'
                  : 'bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Todos ({allMovements.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTipo('gasto')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active-press flex items-center gap-1 ${
                selectedTipo === 'gasto'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[var(--bg-card-elevated)] text-rose-400 hover:text-white'
              }`}
            >
              <ArrowDownRight size={12} /> Gastos ({transacciones.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTipo('ingreso')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active-press flex items-center gap-1 ${
                selectedTipo === 'ingreso'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--bg-card-elevated)] text-emerald-400 hover:text-white'
              }`}
            >
              <ArrowUpRight size={12} /> Ingresos ({ingresos.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTipo('transferencia')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active-press flex items-center gap-1 ${
                selectedTipo === 'transferencia'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--bg-card-elevated)] text-blue-400 hover:text-white'
              }`}
            >
              <ArrowRightLeft size={12} /> Transferencias ({transferencias.length})
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          LISTA DE MOVIMIENTOS AGRUPADOS POR FECHA (ESTILO EXACTO)
          ======================================================== */}
      {grouped.length === 0 ? (
        <div className="py-16 text-center rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 text-[var(--text-muted)] text-xs">
          <Calendar size={32} className="mx-auto mb-2 opacity-40 text-[var(--text-muted)]" />
          <p className="font-bold text-sm text-[var(--text-primary)] mb-1">
            No se encontraron movimientos
          </p>
          <p className="max-w-xs mx-auto text-[11px]">
            {search
              ? `No hay registros que coincidan con "${search}".`
              : 'Registra tus gastos, ingresos o transferencias desde el botón central (+) para verlos aquí.'}
          </p>
        </div>
      ) : (
        grouped.map(([fecha, items]) => {
          // Totales del día para la esquina superior derecha
          const subtotalGastos = items.filter((m) => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
          const subtotalIngresos = items.filter((m) => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
          const subtotalTransferencias = items.filter((m) => m.tipo === 'transferencia').reduce((sum, m) => sum + m.monto, 0);

          return (
            <div
              key={fecha}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[24px] overflow-hidden shadow-sm mb-4"
            >
              {/* Header de fecha con número en la esquina derecha */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-lime-400" />
                  <span className="text-sm font-black text-[var(--text-primary)] tracking-tight">
                    {formatFechaCorta(fecha)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">({fecha})</span>
                </div>

                {/* NÚMERO DE LA ESQUINA DERECHA DE LA TARJETA */}
                <div className="flex items-center gap-2 text-xs font-black tabular-nums">
                  {subtotalGastos > 0 && (
                    <span className="text-rose-400">-{formatQ(subtotalGastos)}</span>
                  )}
                  {subtotalIngresos > 0 && (
                    <span className="text-emerald-400">+{formatQ(subtotalIngresos)}</span>
                  )}
                  {subtotalGastos === 0 && subtotalIngresos === 0 && subtotalTransferencias > 0 && (
                    <span className="text-blue-400">{formatQ(subtotalTransferencias)}</span>
                  )}
                </div>
              </div>

              {/* Columnas header idénticas a tu diseño */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-2 border-b border-[var(--border-subtle)]">
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  NOMBRE
                </span>
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">
                  MONTO
                </span>
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right w-20">
                  MÉTODO
                </span>
              </div>

              {/* Filas */}
              <div className="divide-y divide-[var(--border-subtle)]">
                {items.map((mov, idx) => {
                  const isLast = idx === items.length - 1;

                  // Subtítulo descriptivo según tipo
                  const subtitulo =
                    mov.tipo === 'gasto'
                      ? mov.cuenta_nombre || 'Gasto'
                      : mov.tipo === 'ingreso'
                      ? `Depositado en ${mov.cuenta_nombre}`
                      : `${mov.cuenta_origen_nombre} ➔ ${mov.cuenta_destino_nombre}`;

                  // Ícono 3D Glass de Método
                  const icono3D =
                    mov.tipo === 'gasto'
                      ? mov.metodo_pago === 'Tarjeta'
                        ? 'credit-card-master'
                        : mov.metodo_pago === 'Efectivo'
                        ? 'cash'
                        : mov.categoria_icono || 'credit-card-master'
                      : mov.tipo === 'ingreso'
                      ? 'bank'
                      : 'transaction';

                  return (
                    <SwipeableRow
                      key={`${mov.tipo}-${mov.id}`}
                      onDelete={() => handleDelete(mov)}
                      isDeleting={deletingId === mov.id}
                      className={isLast ? 'rounded-b-[24px]' : ''}
                    >
                      <div
                        onClick={() => handleEditStart(mov)}
                        className={`grid grid-cols-[1fr_auto_auto] gap-3 items-center px-5 py-3.5 hover:bg-[var(--bg-card-hover)] transition-colors w-full ${
                          mov.tipo === 'gasto' ? 'cursor-pointer' : ''
                        }`}
                      >
                        {/* NOMBRE */}
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">
                              {mov.concepto}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-medium truncate mt-0.5">
                              {subtitulo}
                            </div>
                          </div>
                        </div>

                        {/* MONTO CON EL COLOR EXACTO SOLICITADO:
                            - Gasto (negativo): ROJO
                            - Ingreso: VERDE
                            - Transferencia: AZUL
                        */}
                        <div className="text-right">
                          <span
                            className={`text-sm font-black tabular-nums tracking-tight ${
                              mov.tipo === 'gasto'
                                ? 'text-rose-400' // NEGATIVO ROJO
                                : mov.tipo === 'ingreso'
                                ? 'text-emerald-400' // INGRESO VERDE
                                : 'text-blue-400' // TRANSFERENCIA AZUL
                            }`}
                          >
                            {mov.tipo === 'gasto'
                              ? `-${formatQ(Math.abs(mov.monto))}`
                              : mov.tipo === 'ingreso'
                              ? `+${formatQ(Math.abs(mov.monto))}`
                              : formatQ(Math.abs(mov.monto))}
                          </span>
                        </div>

                        {/* MÉTODO (ÍCONO 3D GLASS) */}
                        <div className="flex items-center justify-end w-20 pr-1">
                          <div className="flex items-center justify-center">
                            <CategoryIcon name={icono3D} size={24} />
                          </div>
                        </div>
                      </div>
                    </SwipeableRow>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      </div>

      {/* ========================================================
          MODAL PARA EDITAR GASTO
          ======================================================== */}
      {editingTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] px-5 pt-5 pb-safe rounded-[28px] w-full max-w-sm shadow-2xl max-h-[90dvh] overflow-y-auto hide-scrollbar">
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Editar Transacción
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={editConcepto}
                  onChange={(e) => setEditConcepto(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-semibold focus:border-[var(--accent-brand)] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">
                  Monto (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editMonto}
                  onChange={(e) => setEditMonto(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-semibold focus:border-[var(--accent-brand)] focus:outline-none transition-colors tabular-nums"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] active-press"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  className="flex-1 py-3 rounded-xl font-black text-xs bg-[var(--accent-brand)] text-[var(--fab-text)] active-press uppercase tracking-wider"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
