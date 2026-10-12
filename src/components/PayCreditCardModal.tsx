import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Wallet, AlertCircle } from 'lucide-react';
import type { Cuenta, TransaccionGasto } from '../types/finance';
import { formatQ, formatFechaCorta } from '../lib/validation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cuentas: Cuenta[];
  transaccionesTarjeta: TransaccionGasto[];
  onPay: (selectedTxIds: string[], cuentaOrigenId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const PayCreditCardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cuentas,
  transaccionesTarjeta,
  onPay,
  isSubmitting = false,
}) => {
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [cuentaOrigenId, setCuentaOrigenId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Inicializar consumos seleccionados y cuenta de pago cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll de la página de fondo
      document.body.style.overflow = 'hidden';

      // Preseleccionar todas las transacciones de tarjeta pendientes por defecto
      if (transaccionesTarjeta && transaccionesTarjeta.length > 0) {
        setSelectedTxIds(new Set(transaccionesTarjeta.map((t) => t.id)));
      } else {
        setSelectedTxIds(new Set());
      }

      // Preseleccionar cuenta de origen válida (no tarjeta de crédito, no mesada)
      const validOriginAccounts = cuentas.filter(
        (c) => c.tipo !== 'Tarjeta_Credito' && c.tipo !== 'Mesada'
      );
      const defaultAccount =
        validOriginAccounts.find((c) => c.tipo === 'Monetario') || validOriginAccounts[0];

      if (defaultAccount) {
        setCuentaOrigenId(defaultAccount.id);
      } else {
        setCuentaOrigenId('');
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const validOriginAccounts = cuentas.filter(
    (c) => c.tipo !== 'Tarjeta_Credito' && c.tipo !== 'Mesada'
  );

  const handleToggleTx = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTxIds.size === transaccionesTarjeta.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(transaccionesTarjeta.map((t) => t.id)));
    }
  };

  const totalSelected = transaccionesTarjeta
    .filter((t) => selectedTxIds.has(t.id))
    .reduce((acc, t) => acc + Number(t.monto || 0), 0);

  const selectedAccount = validOriginAccounts.find((c) => c.id === cuentaOrigenId);
  const insufficientFunds = selectedAccount
    ? Number(selectedAccount.saldo_actual) < totalSelected
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTxIds.size === 0 || !cuentaOrigenId || isSubmitting) return;
    await onPay(Array.from(selectedTxIds), cuentaOrigenId);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-subtle)] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85dvh] overflow-hidden animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de arrastre en móvil */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
              Pagar Tarjeta de Crédito
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              Selecciona qué consumos vas a liquidar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="w-8 h-8 rounded-full bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario con cuerpo scrolleable y pie fijo */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Contenido con scroll interno */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 overscroll-contain">
            {/* SECCIÓN 1: Cuenta de origen */}
            <div>
              <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-2 uppercase tracking-wider">
                ¿De qué cuenta se debitará el pago?
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {validOriginAccounts.length === 0 ? (
                  <p className="text-xs text-rose-400">No hay cuentas de débito o efectivo disponibles.</p>
                ) : (
                  validOriginAccounts.map((cuenta) => {
                    const isSelected = cuentaOrigenId === cuenta.id;
                    return (
                      <button
                        key={cuenta.id}
                        type="button"
                        onClick={() => setCuentaOrigenId(cuenta.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.99] touch-manipulation text-left ${
                          isSelected
                            ? 'bg-[var(--accent-brand)] border-[var(--accent-brand)] text-black font-bold shadow-md shadow-[var(--accent-brand)]/20'
                            : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Wallet size={16} className={isSelected ? 'text-black' : 'text-[var(--text-muted)]'} />
                          <span className={`text-xs truncate ${isSelected ? 'font-bold text-black' : 'font-medium text-[var(--text-primary)]'}`}>
                            {cuenta.nombre}
                          </span>
                        </div>
                        <span className={`text-xs tabular-nums font-bold shrink-0 ${isSelected ? 'text-black' : 'text-[var(--text-primary)]'}`}>
                          {formatQ(cuenta.saldo_actual)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Lista de consumos pendientes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Consumos Pendientes ({selectedTxIds.size} de {transaccionesTarjeta.length})
                </label>
                {transaccionesTarjeta.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] font-black text-[var(--accent-brand)] hover:brightness-110 uppercase active-press"
                  >
                    {selectedTxIds.size === transaccionesTarjeta.length
                      ? 'Deseleccionar Todos'
                      : 'Seleccionar Todos'}
                  </button>
                )}
              </div>

              {transaccionesTarjeta.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                  No hay consumos pendientes por pagar en la tarjeta.
                </div>
              ) : (
                <div className="space-y-2">
                  {transaccionesTarjeta.map((t) => {
                    const isSelected = selectedTxIds.has(t.id);
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleToggleTx(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleToggleTx(t.id);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] touch-manipulation ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/60 shadow-sm shadow-emerald-500/10'
                            : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 text-black shadow-sm'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-transparent'
                            }`}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate uppercase tracking-tight text-[var(--text-primary)]">
                              {t.concepto}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium">
                              {formatFechaCorta(t.fecha)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-black tabular-nums shrink-0 ${
                            isSelected ? 'text-emerald-400' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {formatQ(t.monto)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* PIE DE PÁGINA FIJO (NUNCA TAPADO POR NAVEGADORES NI BOTTOM-BAR) */}
          <div className="p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] shrink-0 pb-safe">
            <div className="flex items-end justify-between mb-3.5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold block mb-0.5">
                  Total a Pagar
                </span>
                <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums leading-none block">
                  {formatQ(totalSelected)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  {selectedTxIds.size} consumos
                </span>
              </div>
            </div>

            {insufficientFunds && selectedAccount && (
              <div className="flex items-start gap-2 p-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-semibold leading-tight">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p>
                  La cuenta {selectedAccount.nombre} tiene saldo de {formatQ(selectedAccount.saldo_actual)}, inferior al total seleccionado.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || selectedTxIds.size === 0 || !cuentaOrigenId}
              className="w-full py-4 rounded-2xl bg-[var(--accent-brand)] text-black font-black text-xs uppercase tracking-wider active:scale-[0.98] hover:brightness-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent-brand)]/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Procesando Pago...</span>
                </>
              ) : selectedTxIds.size === 0 ? (
                'Selecciona al menos 1 consumo'
              ) : !cuentaOrigenId ? (
                'Selecciona una cuenta de pago'
              ) : (
                `Confirmar Pago (${formatQ(totalSelected)})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
