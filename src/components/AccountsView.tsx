import React, { useState } from 'react';
import {
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  Plus,
  ArrowRightLeft,
  X,
  Trash2,
  AlertTriangle,
  Coins,
  Check,
  Pencil,
} from 'lucide-react';
import type { Cuenta, CuentaTipo, AhorroMesadaInfo } from '../types/finance';
import { formatQ } from '../lib/validation';

interface Props {
  cuentas: Cuenta[];
  onOpenQuickEntry?: (type: 'gasto' | 'ingreso' | 'ahorro' | 'transferencia') => void;
  onCreateCuenta?: (data: {
    nombre: string;
    tipo: CuentaTipo;
    saldo_actual: number;
    color_tag: string;
    icono: string;
  }) => Promise<void>;
  onUpdateCuenta?: (id: string, data: Partial<Cuenta>) => Promise<void>;
  onDeleteCuenta?: (id: string) => Promise<void>;
}

const getAccountIcon = (icono: string, tipo: string) => {
  switch (tipo) {
    case 'Efectivo':
      return <Wallet size={24} className="opacity-90" />;
    case 'Tarjeta_Credito':
      return <CreditCard size={24} className="opacity-90" />;
    case 'Mesada':
      return <PiggyBank size={24} className="opacity-90" />;
    case 'Ahorro':
      return <PiggyBank size={24} className="opacity-90" />;
    case 'Monetario':
    default:
      return <Landmark size={24} className="opacity-90" />;
  }
};

const getAccountTheme = (colorTag: string) => {
  switch (colorTag) {
    case 'emerald':
      return 'from-emerald-500/20 to-emerald-950/30 border-emerald-500/30 text-emerald-400';
    case 'amber':
      return 'from-amber-500/20 to-amber-950/30 border-amber-500/30 text-amber-400';
    case 'rose':
      return 'from-rose-500/20 to-rose-950/30 border-rose-500/30 text-rose-400';
    case 'violet':
      return 'from-violet-500/20 to-violet-950/30 border-violet-500/30 text-violet-400';
    case 'cyan':
      return 'from-cyan-500/20 to-cyan-950/30 border-cyan-500/30 text-cyan-400';
    case 'blue':
      return 'from-blue-500/20 to-blue-950/30 border-blue-500/30 text-blue-400';
    default:
      return 'from-zinc-500/20 to-zinc-950/30 border-zinc-500/30 text-zinc-400';
  }
};

const COLOR_OPTIONS = [
  { key: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500' },
  { key: 'blue', label: 'Azul', bg: 'bg-blue-500' },
  { key: 'violet', label: 'Violeta', bg: 'bg-violet-500' },
  { key: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
  { key: 'rose', label: 'Rosa / Deuda', bg: 'bg-rose-500' },
  { key: 'cyan', label: 'Cian', bg: 'bg-cyan-500' },
];

export const AccountsView: React.FC<Props> = ({
  cuentas = [],
  onOpenQuickEntry,
  onCreateCuenta,
  onUpdateCuenta,
  onDeleteCuenta,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [cuentaToDelete, setCuentaToDelete] = useState<Cuenta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit account state
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editSaldo, setEditSaldo] = useState('');
  const [editColorTag, setEditColorTag] = useState('blue');
  const [isUpdatingCuenta, setIsUpdatingCuenta] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<CuentaTipo>('Monetario');
  const [saldo, setSaldo] = useState('');
  const [colorTag, setColorTag] = useState('blue');
  const [formError, setFormError] = useState<string | null>(null);

  const totalCuentas = cuentas?.reduce
    ? cuentas.reduce((acc, c) => acc + (Number(c.saldo_actual) || 0), 0)
    : 0;

  const handleEditStart = (c: Cuenta) => {
    setEditingCuenta(c);
    setEditNombre(c.nombre);
    setEditSaldo(String(c.saldo_actual));
    setEditColorTag(c.color_tag);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCuenta || !onUpdateCuenta) return;
    try {
      setIsUpdatingCuenta(true);
      await onUpdateCuenta(editingCuenta.id, {
        nombre: editNombre.trim() || editingCuenta.nombre,
        saldo_actual: Number(editSaldo) || 0,
        color_tag: editColorTag,
      });
      setEditingCuenta(null);
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar cuenta');
    } finally {
      setIsUpdatingCuenta(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim()) {
      setFormError('El nombre de la cuenta es requerido');
      return;
    }

    const numSaldo = Number(saldo) || 0;

    let defaultIcon = 'Landmark';
    if (tipo === 'Efectivo') defaultIcon = 'Wallet';
    if (tipo === 'Tarjeta_Credito') defaultIcon = 'CreditCard';
    if (tipo === 'Ahorro') defaultIcon = 'PiggyBank';

    try {
      setIsSubmitting(true);
      if (onCreateCuenta) {
        await onCreateCuenta({
          nombre: nombre.trim(),
          tipo,
          saldo_actual: numSaldo,
          color_tag: colorTag,
          icono: defaultIcon,
        });
      }
      setNombre('');
      setSaldo('');
      setTipo('Monetario');
      setColorTag('blue');
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!cuentaToDelete || !onDeleteCuenta) return;
    try {
      setIsDeleting(true);
      await onDeleteCuenta(cuentaToDelete.id);
      setCuentaToDelete(null);
    } catch (err: any) {
      alert(
        err?.message?.includes('violates foreign key constraint')
          ? 'No se puede eliminar esta cuenta porque tiene transacciones asociadas. Primero reasigna o elimina los movimientos.'
          : err?.message || 'Error al eliminar cuenta'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-5 pb-24 animate-fade-in relative">
      {/* GLOBAL BALANCE HERO */}
      <div className="p-6 rounded-[32px] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-card-elevated)] border border-[var(--border-subtle)] shadow-[var(--card-shadow)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet size={120} />
        </div>

        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-2">
          Balance Total Disponible en Cuentas
        </span>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tabular-nums tracking-tight mb-4">
          {formatQ(totalCuentas)}
        </h1>

        <div className="flex gap-2 relative z-10">
          <button
            onClick={() => onOpenQuickEntry && onOpenQuickEntry('ingreso')}
            className="flex-1 py-2.5 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex justify-center items-center gap-1.5 active-press"
          >
            <Plus size={14} /> Ingresar Dinero
          </button>
          <button
            onClick={() => onOpenQuickEntry && onOpenQuickEntry('transferencia')}
            className="flex-1 py-2.5 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex justify-center items-center gap-1.5 active-press"
          >
            <ArrowRightLeft size={14} /> Transferir
          </button>
        </div>
      </div>

      {/* LISTA DE CUENTAS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1 mt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Mis Cuentas & Fondos
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              {cuentas.length}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-wider hover:brightness-105 active-press transition-all shadow-md shadow-[var(--accent)]/20"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Nueva Cuenta</span>
          </button>
        </div>

        {cuentas.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 text-[var(--text-muted)] text-xs">
            <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">
              No tienes cuentas registradas
            </p>
            <p className="mb-4">
              Agrega tu cuenta monetaria, ahorros o efectivo para comenzar a organizar tu dinero.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-wider active-press inline-flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={3} /> Crear Primera Cuenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {cuentas.map((cuenta) => {
              const themeClass = getAccountTheme(cuenta.color_tag);

              return (
                <div
                  key={cuenta.id}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${themeClass} backdrop-blur-md relative overflow-hidden active-press transition-all group border`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-black/30 flex items-center justify-center shadow-inner">
                        {getAccountIcon(cuenta.icono, cuenta.tipo)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-white/95 transition-colors">
                          {cuenta.nombre}
                        </h3>
                        <p className="text-[10px] font-medium opacity-75 uppercase tracking-widest mt-0.5">
                          {cuenta.tipo.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-black text-white tabular-nums tracking-tight">
                          {formatQ(cuenta.saldo_actual)}
                        </div>
                      </div>

                      {/* Botón Editar Cuenta */}
                      {onUpdateCuenta && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart(cuenta);
                          }}
                          className="opacity-70 hover:opacity-100 p-2 rounded-xl hover:bg-black/30 text-white transition-opacity active-press"
                          title="Editar cuenta"
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {/* Botón Borrar Cuenta */}
                      {onDeleteCuenta && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCuentaToDelete(cuenta);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-black/30 text-rose-300 transition-opacity active-press"
                          title="Eliminar cuenta"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>

      {/* MODAL: NUEVA CUENTA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-[32px] sm:rounded-[32px] px-6 pt-6 pb-safe shadow-2xl animate-sheet max-h-[90dvh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                  Crear Nueva Cuenta
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                  Registra una cuenta bancaria, tarjeta o efectivo
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active-press"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* TIPO DE CUENTA */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Tipo de Cuenta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Monetario', label: 'Monetaria / Cheques', icon: Landmark },
                    { id: 'Ahorro', label: 'Cuenta Ahorro', icon: PiggyBank },
                    { id: 'Efectivo', label: 'Efectivo / Billetera', icon: Wallet },
                    { id: 'Tarjeta_Credito', label: 'Tarjeta de Crédito', icon: CreditCard },
                  ].map((t) => {
                    const isSelected = tipo === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          setTipo(t.id as CuentaTipo);
                          if (t.id === 'Efectivo') setColorTag('amber');
                          else if (t.id === 'Tarjeta_Credito') setColorTag('rose');
                          else if (t.id === 'Ahorro') setColorTag('emerald');
                          else setColorTag('blue');
                        }}
                        className={`p-3 rounded-2xl flex items-center gap-2.5 border text-left transition-all active-press ${
                          isSelected
                            ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold shadow-md shadow-[var(--accent)]/20'
                            : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NOMBRE */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Nombre de la Cuenta
                </label>
                <input
                  type="text"
                  placeholder="ej. Monetaria BAC, Efectivo Billetera, Ahorro BI"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all font-semibold"
                  required
                />
              </div>

              {/* SALDO ACTUAL */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  {tipo === 'Tarjeta_Credito' ? 'Saldo Deuda Actual (Q)' : 'Saldo Actual / Inicial (Q)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base font-black tabular-nums placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                  {tipo === 'Tarjeta_Credito'
                    ? 'Si debes dinero a la tarjeta hoy, ingrésalo aquí'
                    : 'Dinero real disponible en esta cuenta al día de hoy'}
                </span>
              </div>

              {/* COLOR TAG */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Color de la Tarjeta
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => setColorTag(c.key)}
                      className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-transform active-press ${
                        colorTag === c.key ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {colorTag === c.key && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[var(--accent)] text-black font-black text-xs uppercase tracking-wider active-press hover:brightness-105 transition-all disabled:opacity-50 shadow-md shadow-[var(--accent)]/30"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA BORRAR CUENTA */}
      {cuentaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] px-6 pt-6 pb-safe shadow-2xl animate-sheet text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-base font-black text-[var(--text-primary)]">
              ¿Eliminar cuenta?
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Vas a eliminar <strong>&quot;{cuentaToDelete.nombre}&quot;</strong> con saldo actual de{' '}
              <strong>{formatQ(cuentaToDelete.saldo_actual)}</strong>.
            </p>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setCuentaToDelete(null)}
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
      {/* MODAL DE EDICIÓN DE CUENTA */}
      {editingCuenta && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-[32px] sm:rounded-[32px] px-6 pt-6 pb-safe shadow-2xl animate-sheet max-h-[90dvh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                  <Pencil size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Editar Cuenta
                </h3>
              </div>
              <button
                onClick={() => setEditingCuenta(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4 pt-4">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Nombre de la Cuenta
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Saldo Actual (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editSaldo}
                  onChange={(e) => setEditSaldo(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base font-black tabular-nums focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                  Color de la Tarjeta
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => setEditColorTag(c.key)}
                      className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-transform active-press ${
                        editColorTag === c.key ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {editColorTag === c.key && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingCuenta}
                  className="w-full py-3.5 rounded-2xl bg-[var(--accent)] text-black font-black text-xs uppercase tracking-wider active-press hover:brightness-105 transition-all disabled:opacity-50 shadow-md shadow-[var(--accent)]/30"
                >
                  {isUpdatingCuenta ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
