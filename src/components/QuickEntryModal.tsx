import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Calendar,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Check,
  Receipt,
  Percent,
  Pin,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import type {
  CategoriaConStats,
  MetaConStats,
  QuickEntryType,
  MetodoPago,
  Cuenta,
} from '../types/finance';
import {
  transaccionSchema,
  ingresoSchema,
  aporteMetaSchema,
  getTodayIso,
  getZodErrorMessage,
} from '../lib/validation';
import { CategoryIcon } from './CategoryIcon';
import { IconPickerModal } from './IconPickerModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType?: QuickEntryType;
  cuentas: Cuenta[];
  categorias: CategoriaConStats[];
  metas: MetaConStats[];
  presupuestoId: string;
  onAddTransaccion: (data: {
    categoria_id: string;
    cuenta_id: string;
    concepto: string;
    monto: number;
    fecha: string;
    metodo_pago: MetodoPago;
  }) => Promise<void>;
  onAddIngreso: (data: {
    presupuesto_id: string;
    cuenta_id: string;
    fuente: string;
    descripcion?: string | null;
    monto_esperado: number;
    monto_recibido: number;
  }) => Promise<void>;
  onAporteMeta: (metaId: string, monto: number, cuentaId: string) => Promise<void>;
  onAddTransferencia: (data: {
    cuenta_origen_id: string;
    cuenta_destino_id: string;
    monto: number;
    fecha: string;
    concepto?: string;
  }) => Promise<void>;
  onAddCategoria?: (data: {
    nombre: string;
    icono: string;
    presupuestado: number;
    descripcion?: string;
    es_fijo?: boolean;
  }) => Promise<void>;
  onDeleteCategoria?: (id: string) => Promise<void>;
  onEditCategoria?: (id: string, data: {
    nombre?: string;
    icono?: string;
    presupuestado?: number;
    descripcion?: string;
    es_fijo?: boolean;
  }) => Promise<void>;
}

export const QuickEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialType = 'gasto',
  cuentas,
  categorias,
  metas,
  presupuestoId,
  onAddTransaccion,
  onAddIngreso,
  onAporteMeta,
  onAddTransferencia,
  onAddCategoria,
  onDeleteCategoria,
  onEditCategoria,
}) => {
  const [tipo, setTipo] = useState<QuickEntryType>(initialType);
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>(categorias[0]?.id || '');
  const [cuentaGastoId, setCuentaGastoId] = useState<string>(cuentas[0]?.id || '');
  const [concepto, setConcepto] = useState('');
  const [fecha, setFecha] = useState(getTodayIso());

  // Ingreso state
  const [cuentaIngresoId, setCuentaIngresoId] = useState<string>(cuentas[0]?.id || '');
  const [fuente, setFuente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [montoEsperado, setMontoEsperado] = useState('');
  const [mismoRecibido, setMismoRecibido] = useState(true);

  // Transferencia state
  const [cuentaOrigenId, setCuentaOrigenId] = useState<string>(cuentas[0]?.id || '');
  const [cuentaDestinoId, setCuentaDestinoId] = useState<string>(cuentas[1]?.id || cuentas[0]?.id || '');

  // Desglose de boleta de pago laboral guatemalteca
  const [esModoBoleta, setEsModoBoleta] = useState(false);
  const [sueldoBase, setSueldoBase] = useState('4025');
  const [bonificacion, setBonificacion] = useState('475');
  const [descuentoIgss, setDescuentoIgss] = useState('194.41');
  const [descuentoIsr, setDescuentoIsr] = useState('0');
  const [otrosDescuentos, setOtrosDescuentos] = useState('0');
  const [frecuenciaBoleta, setFrecuenciaBoleta] = useState<'quincenal' | 'mensual'>('quincenal');

  // Aporte state
  const [metaId, setMetaId] = useState<string>(metas[0]?.id || '');
  const [cuentaAhorroId, setCuentaAhorroId] = useState<string>(cuentas[0]?.id || '');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de gestión de categorías dentro del modal
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [catEditing, setCatEditing] = useState<CategoriaConStats | null>(null);
  const [catToDelete, setCatToDelete] = useState<CategoriaConStats | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  // Estados del formulario para crear/editar categoría
  const [catFormNombre, setCatFormNombre] = useState('');
  const [catFormPresupuesto, setCatFormPresupuesto] = useState('');
  const [catFormIcono, setCatFormIcono] = useState('bill-receipt');
  const [catFormEsFijo, setCatFormEsFijo] = useState(false);
  const [showCatIconPicker, setShowCatIconPicker] = useState(false);
  const [catSaving, setCatSaving] = useState(false);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormNombre.trim()) return;

    try {
      setCatSaving(true);
      if (catEditing && onEditCategoria) {
        await onEditCategoria(catEditing.id, {
          nombre: catFormNombre.trim(),
          icono: catFormIcono,
          presupuestado: Number(catFormPresupuesto) || 0,
          es_fijo: catFormEsFijo,
        });
      } else if (onAddCategoria) {
        await onAddCategoria({
          nombre: catFormNombre.trim(),
          icono: catFormIcono,
          presupuestado: Number(catFormPresupuesto) || 0,
          es_fijo: catFormEsFijo,
        });
      }
      setShowAddCatModal(false);
      setCatEditing(null);
      setCatFormNombre('');
      setCatFormPresupuesto('');
      setCatFormIcono('bill-receipt');
      setCatFormEsFijo(false);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar categoría');
    } finally {
      setCatSaving(false);
    }
  };

  const handleConfirmDeleteCat = async () => {
    if (!catToDelete || !onDeleteCategoria) return;
    try {
      setIsDeletingCat(true);
      await onDeleteCategoria(catToDelete.id);
      if (categoriaId === catToDelete.id) {
        const remaining = categorias.filter((c) => c.id !== catToDelete.id);
        setCategoriaId(remaining[0]?.id || '');
      }
      setCatToDelete(null);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar categoría');
    } finally {
      setIsDeletingCat(false);
    }
  };

  // Sincronizar tipo al abrir el modal o cuando cambia initialType externamente
  useEffect(() => {
    if (isOpen) {
      setTipo(initialType);
      setErrorMsg(null);
    }
  }, [isOpen, initialType]);

  // Inicializar IDs por defecto si están vacíos
  useEffect(() => {
    if (isOpen) {
      if (!categoriaId && categorias.length > 0) setCategoriaId(categorias[0].id);
      if (!cuentaGastoId && cuentas.length > 0) setCuentaGastoId(cuentas[0].id);
      if (!cuentaIngresoId && cuentas.length > 0) {
        const ahorroBi = cuentas.find(c => c.nombre.toLowerCase().includes('ahorro bi') || c.nombre.toLowerCase().includes('bi ahorro'));
        setCuentaIngresoId(ahorroBi ? ahorroBi.id : cuentas[0].id);
      }
      if (!cuentaOrigenId && cuentas.length > 0) setCuentaOrigenId(cuentas[0].id);
      if (!cuentaDestinoId && cuentas.length > 1) setCuentaDestinoId(cuentas[1].id);
      if (!metaId && metas.length > 0) setMetaId(metas[0].id);
      if (!cuentaAhorroId && cuentas.length > 0) setCuentaAhorroId(cuentas[0].id);
    }
  }, [isOpen, categorias, cuentas, metas]);

  // Cálculo dinámico automático del líquido de boleta
  useEffect(() => {
    if (esModoBoleta && tipo === 'ingreso') {
      const base = Number(sueldoBase) || 0;
      const bono = Number(bonificacion) || 0;
      const igss = Number(descuentoIgss) || 0;
      const isr = Number(descuentoIsr) || 0;
      const otros = Number(otrosDescuentos) || 0;

      const totalBruto = base + bono;
      const totalDescuentos = igss + isr + otros;
      const liquidoMensual = Math.max(0, totalBruto - totalDescuentos);
      const liquidoCalculado = frecuenciaBoleta === 'quincenal'
        ? Math.round((liquidoMensual / 2) * 100) / 100
        : liquidoMensual;

      setMonto(liquidoCalculado.toFixed(2));
      if (!fuente || fuente.includes('Salario')) {
        setFuente(`Salario (${frecuenciaBoleta === 'quincenal' ? 'Quincena' : 'Mes'})`);
      }
      setDescripcion(
        `Base Q${base} + Bono Q${bono} - IGSS Q${igss}${isr > 0 ? ` - ISR Q${isr}` : ''}${otros > 0 ? ` - Otros Q${otros}` : ''}`
      );
    }
  }, [esModoBoleta, sueldoBase, bonificacion, descuentoIgss, descuentoIsr, otrosDescuentos, frecuenciaBoleta, tipo]);

  const handleAutoCalcIgss = () => {
    const base = Number(sueldoBase) || 0;
    const igssCalc = Math.round((base * 0.0483) * 100) / 100;
    setDescuentoIgss(igssCalc.toFixed(2));
  };

  if (!isOpen) return null;

  const quickAmounts = [20, 50, 100, 250, 500];

  const handleAddQuickAmount = (val: number) => {
    const current = Number(monto) || 0;
    setMonto(String(current + val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsSubmitting(true);

      if (tipo === 'gasto') {
        if (!cuentaGastoId) {
          setErrorMsg('Selecciona una cuenta de origen.');
          setIsSubmitting(false);
          return;
        }

        const selectedAccount = cuentas.find(c => c.id === cuentaGastoId);
        const resolvedMetodoPago: MetodoPago = selectedAccount?.tipo === 'Tarjeta_Credito'
          ? 'Tarjeta'
          : selectedAccount?.tipo === 'Efectivo'
            ? 'Efectivo'
            : 'Transferencia';

        const validation = transaccionSchema.safeParse({
          monto: Number(monto),
          concepto: concepto || 'Gasto registrado',
          categoria_id: categoriaId,
          metodo_pago: resolvedMetodoPago,
          fecha,
        });

        if (!validation.success) {
          setErrorMsg(getZodErrorMessage(validation.error));
          setIsSubmitting(false);
          return;
        }

        await onAddTransaccion({
          ...validation.data,
          cuenta_id: cuentaGastoId,
          metodo_pago: resolvedMetodoPago,
        });
      } else if (tipo === 'ingreso') {
        if (!cuentaIngresoId) {
          setErrorMsg('Selecciona una cuenta destino.');
          setIsSubmitting(false);
          return;
        }

        const valRecibido = Number(monto);
        const valEsperado = mismoRecibido ? valRecibido : Number(montoEsperado) || valRecibido;
        const finalFuente = (fuente || concepto || 'Ingreso').trim();

        const validation = ingresoSchema.safeParse({
          fuente: finalFuente.length >= 2 ? finalFuente : 'Ingreso',
          descripcion: descripcion || null,
          monto_recibido: valRecibido,
          monto_esperado: valEsperado,
        });

        if (!validation.success) {
          setErrorMsg(getZodErrorMessage(validation.error));
          setIsSubmitting(false);
          return;
        }

        await onAddIngreso({
          presupuesto_id: presupuestoId,
          cuenta_id: cuentaIngresoId,
          ...validation.data,
        });
      } else if (tipo === 'ahorro') {
        if (!cuentaAhorroId) {
          setErrorMsg('Selecciona una cuenta de origen.');
          setIsSubmitting(false);
          return;
        }

        const validation = aporteMetaSchema.safeParse({
          meta_id: metaId,
          monto: Number(monto),
        });

        if (!validation.success) {
          setErrorMsg(getZodErrorMessage(validation.error));
          setIsSubmitting(false);
          return;
        }

        await onAporteMeta(validation.data.meta_id, validation.data.monto, cuentaAhorroId);
      } else if (tipo === 'transferencia') {
        if (!cuentaOrigenId || !cuentaDestinoId || cuentaOrigenId === cuentaDestinoId) {
          setErrorMsg('Selecciona cuentas de origen y destino diferentes.');
          setIsSubmitting(false);
          return;
        }
        
        await onAddTransferencia({
          cuenta_origen_id: cuentaOrigenId,
          cuenta_destino_id: cuentaDestinoId,
          monto: Number(monto),
          fecha,
          concepto: concepto || 'Transferencia entre cuentas',
        });
      }

      // Limpiar y cerrar
      setMonto('');
      setConcepto('');
      setFuente('');
      setDescripcion('');
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al procesar la operación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-[32px] sm:rounded-[32px] px-6 pt-6 pb-safe shadow-2xl animate-sheet max-h-[92dvh] overflow-y-auto hide-scrollbar">
        {/* ENCABEZADO Y SELECTOR DE TIPO */}
        <div className="flex items-center justify-between pb-4 mb-2">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-[var(--bg-card-elevated)] p-1 rounded-2xl border border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setTipo('gasto');
                setErrorMsg(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all active-press flex items-center gap-1 shrink-0 ${tipo === 'gasto'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              <ArrowDownRight size={13} />
              <span>Gasto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipo('ingreso');
                setErrorMsg(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all active-press flex items-center gap-1 shrink-0 ${tipo === 'ingreso'
                ? 'bg-[var(--accent-brand)] text-[var(--fab-text)] shadow-lg'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              <ArrowUpRight size={13} />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipo('ahorro');
                setErrorMsg(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all active-press flex items-center gap-1 shrink-0 ${tipo === 'ahorro'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              <PiggyBank size={13} />
              <span>Ahorro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipo('transferencia');
                setErrorMsg(null);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all active-press flex items-center gap-1 shrink-0 ${tipo === 'transferencia'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              <ArrowRightLeft size={13} />
              <span>Transferir</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center active-press transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* MENSAJE DE ERROR ZOD */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* DISPLAY HERO DE MONTO */}
          <div>
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest block text-center mb-1.5">
              Monto en Quetzales (Q)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                autoFocus
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={`w-full py-3.5 px-4 rounded-2xl bg-[var(--bg-input)] border text-4xl font-black text-center tabular-nums focus:outline-none transition-all placeholder:text-[var(--text-muted)]/30 text-[var(--text-primary)] ${tipo === 'gasto'
                  ? 'border-rose-500/30 focus:border-rose-500 focus:bg-rose-500/5'
                  : tipo === 'ingreso'
                    ? 'border-[var(--accent-brand)]/30 focus:border-[var(--accent-brand)] focus:bg-[var(--accent-brand)]/5'
                    : 'border-violet-500/30 focus:border-violet-500 focus:bg-violet-500/5'
                  }`}
                required
              />
            </div>

            {/* CHIPS DE INCREMENTO RÁPIDO */}
            <div className="grid grid-cols-5 gap-1.5 mt-2.5">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => handleAddQuickAmount(q)}
                  className="py-1.5 rounded-xl bg-[var(--bg-card-elevated)] hover:bg-[var(--bg-card-hover)] text-[11px] font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] active-press transition-colors tabular-nums"
                >
                  +Q{q}
                </button>
              ))}
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS PARA GASTO */}
          {tipo === 'gasto' && (
            <>
              {/* Selector de Categoría */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Categoría
                  </label>
                  <div className="flex items-center gap-2">
                    {onDeleteCategoria && categorias.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManagingCats(!isManagingCats)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                          isManagingCats
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {isManagingCats ? 'Listo' : 'Editar / Borrar'}
                      </button>
                    )}
                    {onAddCategoria && (
                      <button
                        type="button"
                        onClick={() => {
                          setCatEditing(null);
                          setCatFormNombre('');
                          setCatFormPresupuesto('');
                          setCatFormIcono('bill-receipt');
                          setCatFormEsFijo(false);
                          setShowAddCatModal(true);
                        }}
                        className="text-[10px] font-black text-[var(--accent-brand)] hover:underline flex items-center gap-0.5 active-press"
                      >
                        <Plus size={12} strokeWidth={3} /> Nueva
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {categorias.map((cat) => {
                    const isSelected = categoriaId === cat.id;

                    return (
                      <div key={cat.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => {
                            if (isManagingCats) {
                              setCatEditing(cat);
                              setCatFormNombre(cat.nombre);
                              setCatFormPresupuesto(String(cat.presupuestado || ''));
                              setCatFormIcono(cat.icono || 'Tag');
                              setCatFormEsFijo(Boolean(cat.es_fijo));
                              setShowAddCatModal(true);
                            } else {
                              setCategoriaId(cat.id);
                            }
                          }}
                          className={`w-full p-2 rounded-xl border flex flex-col items-center text-center gap-1 transition-all active-press ${
                            isSelected
                              ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 font-bold shadow-sm'
                              : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                        >
                          <div className="relative">
                            <CategoryIcon
                              name={cat.icono}
                              size={16}
                              className={isSelected ? 'text-rose-400' : 'text-[var(--text-muted)]'}
                            />
                            {cat.es_fijo && (
                              <span
                                className="absolute -top-1.5 -right-2 text-[10px]"
                                title="Gasto Fijo"
                              >
                                📌
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold truncate w-full">
                            {cat.nombre}
                          </span>
                          {cat.es_fijo && (
                            <span className="text-[7px] uppercase tracking-wider font-black text-amber-400 -mt-0.5">
                              Fijo
                            </span>
                          )}
                        </button>

                        {/* Controles de edición y eliminación */}
                        {isManagingCats && (
                          <div className="absolute -top-1.5 -right-1 flex items-center gap-0.5 z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCatEditing(cat);
                                setCatFormNombre(cat.nombre);
                                setCatFormPresupuesto(String(cat.presupuestado || ''));
                                setCatFormIcono(cat.icono || 'Tag');
                                setCatFormEsFijo(Boolean(cat.es_fijo));
                                setShowAddCatModal(true);
                              }}
                              className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow text-[8px] font-black"
                              title="Editar"
                            >
                              ✎
                            </button>
                            {onDeleteCategoria && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCatToDelete(cat);
                                }}
                                className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow text-[8px] font-black"
                                title="Eliminar"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Botón "+ Crear" en el grid */}
                  {onAddCategoria && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatEditing(null);
                        setCatFormNombre('');
                        setCatFormPresupuesto('');
                        setCatFormIcono('bill-receipt');
                        setCatFormEsFijo(false);
                        setShowAddCatModal(true);
                      }}
                      className="p-2 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-rose-400 flex flex-col items-center justify-center text-center gap-0.5 transition-all active-press text-[var(--text-muted)] hover:text-rose-400 bg-black/10 min-h-[58px]"
                    >
                      <Plus size={16} />
                      <span className="text-[9px] font-bold">+ Crear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  placeholder="ej. Gasolina Shell, Almuerzo, Uñas, Supermercado"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:border-rose-500 focus:bg-rose-500/5 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Selector de Cuenta */}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Cuenta de Origen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {cuentas.map((c) => {
                    const isSelected = cuentaGastoId === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCuentaGastoId(c.id)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-0.5 transition-all active-press ${isSelected
                          ? 'bg-[var(--bg-card-hover)] border-[var(--text-secondary)] text-[var(--text-primary)] shadow-sm'
                          : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                      >
                        <span className="truncate w-full text-left">{c.nombre}</span>
                        <span className="text-[10px] font-normal text-[var(--text-muted)]">Q{c.saldo_actual.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-rose-500 focus:bg-rose-500/5 focus:outline-none transition-colors"
                  required
                />
              </div>
            </>
          )}

          {/* CAMPOS ESPECÍFICOS PARA INGRESO */}
          {tipo === 'ingreso' && (
            <>
              {/* Selector de Cuenta */}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Cuenta Destino
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {cuentas.map((c) => {
                    const isSelected = cuentaIngresoId === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCuentaIngresoId(c.id)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-0.5 transition-all active-press ${isSelected
                          ? 'bg-[var(--accent-brand)]/10 border-[var(--accent-brand)]/30 text-[var(--accent-brand)] shadow-sm'
                          : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                      >
                        <span className="truncate w-full text-left">{c.nombre}</span>
                        <span className="text-[10px] font-normal text-[var(--text-muted)]">Q{c.saldo_actual.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CALCULADORA DE BOLETA DE PAGO GUATEMALTECA */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] mb-3 transition-colors hover:border-[var(--accent-orange)]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name="bill-receipt" size={16} className="text-[var(--accent-orange)]" />
                    <div>
                      <span className="text-xs font-black text-[var(--text-primary)] block">
                        Desglosar Boleta de Pago
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        Calcula tu líquido con IGSS (4.83%) e ISR
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEsModoBoleta(!esModoBoleta)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all active-press ${esModoBoleta
                      ? 'bg-[var(--accent-orange)] text-[var(--fab-text)] border-[var(--accent-orange)] shadow-sm'
                      : 'bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    {esModoBoleta ? 'Activado' : 'Activar'}
                  </button>
                </div>

                {esModoBoleta && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3 animate-fade-in">
                    {/* Selector Quincenal vs Mensual */}
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => setFrecuenciaBoleta('quincenal')}
                        className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${frecuenciaBoleta === 'quincenal'
                          ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        Quincenal (50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrecuenciaBoleta('mensual')}
                        className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${frecuenciaBoleta === 'mensual'
                          ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        Mes Completo (100%)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-1 uppercase tracking-widest">
                          Sueldo Base (Q)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={sueldoBase}
                          onChange={(e) => setSueldoBase(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)] focus:bg-[var(--accent-orange)]/5 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-[var(--text-muted)] block mb-1 uppercase tracking-widest">
                          Bono Incentivo (Q)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={bonificacion}
                          onChange={(e) => setBonificacion(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-orange)] focus:bg-[var(--accent-orange)]/5 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Descuentos de Boleta */}
                    <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-2.5 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Aportes y Descuentos</span>
                        <button
                          type="button"
                          onClick={handleAutoCalcIgss}
                          className="text-[9px] font-bold text-[var(--accent-orange)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Auto IGSS (4.83%)
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-medium text-[var(--text-muted)] block mb-1">IGSS (4.83%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={descuentoIgss}
                            onChange={(e) => setDescuentoIgss(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--bg-card-elevated)] border border-rose-500/30 text-xs font-bold text-rose-400 focus:outline-none focus:border-rose-400 focus:bg-rose-500/10 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-medium text-[var(--text-muted)] block mb-1">ISR (Opcional)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={descuentoIsr}
                            onChange={(e) => setDescuentoIsr(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-medium text-[var(--text-muted)] block mb-1">Otros Desc.</label>
                          <input
                            type="number"
                            step="0.01"
                            value={otrosDescuentos}
                            onChange={(e) => setOtrosDescuentos(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Fuente del Ingreso
                </label>
                <input
                  type="text"
                  placeholder="ej. Salario Quincena, Bono, Dinero familiar"
                  value={fuente}
                  onChange={(e) => setFuente(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:border-[var(--accent-brand)] focus:bg-[var(--accent-brand)]/5 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Anticipo o pago correspondiente a quincena"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:border-[var(--accent-brand)] focus:bg-[var(--accent-brand)]/5 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 pb-1">
                <input
                  type="checkbox"
                  id="mismoRecibido"
                  checked={mismoRecibido}
                  onChange={(e) => setMismoRecibido(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--accent-brand)] focus:ring-[var(--accent-brand)] focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <label htmlFor="mismoRecibido" className="text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none">
                  El monto recibido coincide con el monto esperado
                </label>
              </div>

              {!mismoRecibido && (
                <div className="animate-fade-in mt-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                    Monto Esperado Planeado (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={montoEsperado}
                    onChange={(e) => setMontoEsperado(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold tabular-nums focus:border-[var(--accent-brand)] focus:bg-[var(--accent-brand)]/5 focus:outline-none transition-colors"
                  />
                </div>
              )}
            </>
          )}

          {/* CAMPOS ESPECÍFICOS PARA APORTE A METAS */}
          {tipo === 'ahorro' && (
            <>
              {/* Selector de Cuenta de Origen para Ahorro */}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Cuenta de Origen
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {cuentas.map((c) => {
                    const isSelected = cuentaAhorroId === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCuentaAhorroId(c.id)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-0.5 transition-all active-press ${isSelected
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-sm'
                          : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                      >
                        <span className="truncate w-full text-left">{c.nombre}</span>
                        <span className="text-[10px] font-normal text-[var(--text-muted)]">Q{c.saldo_actual.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Destino / Meta de Ahorro
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {metas.map((m) => {
                    const isSelected = metaId === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setMetaId(m.id)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all active-press ${isSelected
                          ? 'bg-violet-500/15 border-violet-500/50 text-[var(--text-primary)]'
                          : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                      >
                        <div className="truncate pr-2">
                          <span className={`font-bold text-xs block truncate ${isSelected ? 'text-violet-400' : 'text-[var(--text-primary)]'}`}>
                            {m.titulo}
                          </span>
                          <span className={`text-[10px] mt-0.5 block ${isSelected ? 'text-violet-400/70' : 'text-[var(--text-muted)]'}`}>
                            Acumulado: Q{m.monto_acumulado} de Q{m.precio_objetivo}
                          </span>
                        </div>
                        {isSelected && <Check size={16} className="text-violet-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* CAMPOS ESPECÍFICOS PARA TRANSFERENCIA */}
          {tipo === 'transferencia' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                    Cuenta de Origen
                  </label>
                  <div className="flex flex-col gap-2">
                    {cuentas.map((c) => {
                      const isSelected = cuentaOrigenId === c.id;
                      return (
                        <button
                          type="button"
                          key={`origen-${c.id}`}
                          onClick={() => setCuentaOrigenId(c.id)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all active-press ${isSelected
                            ? 'bg-rose-500/10 border-rose-500/30 text-[var(--text-primary)] shadow-sm'
                            : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                            }`}
                        >
                          <span className="truncate">{c.nombre}</span>
                          <span className="text-[10px] font-normal text-[var(--text-muted)]">Q{c.saldo_actual.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-widest">
                    Cuenta Destino
                  </label>
                  <div className="flex flex-col gap-2">
                    {cuentas.map((c) => {
                      const isSelected = cuentaDestinoId === c.id;
                      return (
                        <button
                          type="button"
                          key={`destino-${c.id}`}
                          onClick={() => setCuentaDestinoId(c.id)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all active-press ${isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--text-primary)] shadow-sm'
                            : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                            }`}
                        >
                          <span className="truncate">{c.nombre}</span>
                          <span className="text-[10px] font-normal text-[var(--text-muted)]">Q{c.saldo_actual.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  placeholder="ej. Pasar a ahorros, Pagar TC"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:border-[var(--accent-brand)] focus:bg-[var(--accent-brand)]/5 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 uppercase tracking-widest mt-4">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:border-[var(--accent-brand)] focus:bg-[var(--accent-brand)]/5 focus:outline-none transition-colors"
                  required
                />
              </div>
            </>
          )}



          {/* BOTÓN SUBMIT PRINCIPAL */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !monto}
              className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest active-press transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${tipo === 'gasto'
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                : tipo === 'ingreso'
                  ? 'bg-[var(--accent-brand)] hover:brightness-110 text-[var(--fab-text)] shadow-lg'
                  : tipo === 'ahorro'
                    ? 'bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-[var(--accent-brand)] hover:brightness-110 text-[var(--fab-text)] shadow-lg'
                }`}
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <span>
                  Confirmar {tipo === 'gasto' ? 'Gasto' : tipo === 'ingreso' ? 'Ingreso' : tipo === 'ahorro' ? 'Aporte' : 'Transferencia'}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* SUBMODAL: NUEVA / EDITAR CATEGORÍA */}
        {showAddCatModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] px-6 pt-6 pb-safe shadow-2xl animate-sheet">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                  {catEditing ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active-press"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-3.5 mt-4">
                {/* SELECTOR DE ÍCONO */}
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                    Ícono
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shadow-inner">
                      <CategoryIcon name={catFormIcono} size={24} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCatIconPicker(true)}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-brand)] flex items-center justify-between active-press"
                    >
                      <span className="truncate">{catFormIcono}</span>
                      <span className="text-[10px] uppercase font-black text-[var(--accent-brand)]">
                        Cambiar...
                      </span>
                    </button>
                  </div>
                </div>

                {/* NOMBRE */}
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                    Nombre de Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Mantenimiento, Gimnasio, Alquiler"
                    value={catFormNombre}
                    onChange={(e) => setCatFormNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-brand)]"
                    required
                  />
                </div>

                {/* PRESUPUESTO Q */}
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                    Presupuesto Mensual Sugerido (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={catFormPresupuesto}
                    onChange={(e) => setCatFormPresupuesto(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-black tabular-nums text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-brand)]"
                  />
                </div>

                {/* SWITCH GASTO FIJO */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Pin size={15} className={catFormEsFijo ? 'text-[var(--accent-brand)]' : 'text-[var(--text-muted)]'} />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">
                        ¿Es Gasto Fijo?
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">
                        Alquiler, internet, servicios, cuotas
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCatFormEsFijo(!catFormEsFijo)}
                    className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                      catFormEsFijo ? 'bg-[var(--accent-brand)] justify-end' : 'bg-zinc-700 justify-start'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${catFormEsFijo ? 'bg-black' : 'bg-white'}`} />
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={catSaving}
                    className="w-full py-3 rounded-2xl bg-[var(--accent-brand)] text-[var(--fab-text)] font-black text-xs uppercase tracking-wider active-press hover:brightness-105 transition-all disabled:opacity-50 shadow-md shadow-[var(--accent-brand)]/20"
                  >
                    {catSaving ? 'Guardando...' : catEditing ? 'Guardar Cambios' : 'Crear Categoría'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN PARA BORRAR CATEGORÍA */}
        {catToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xs bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[28px] px-5 pt-5 pb-safe shadow-2xl animate-sheet text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-2.5">
                <AlertTriangle size={24} />
              </div>

              <h3 className="text-sm font-black text-[var(--text-primary)]">
                ¿Eliminar categoría?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Se eliminará <strong>&quot;{catToDelete.nombre}&quot;</strong>.
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setCatToDelete(null)}
                  disabled={isDeletingCat}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCat}
                  disabled={isDeletingCat}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-wider"
                >
                  {isDeletingCat ? 'Borrando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SELECTOR DE ÍCONOS */}
        <IconPickerModal
          isOpen={showCatIconPicker}
          onClose={() => setShowCatIconPicker(false)}
          selectedIcon={catFormIcono}
          onSelectIcon={(newIc) => setCatFormIcono(newIc)}
        />
      </div>
    </div>
  );
};
