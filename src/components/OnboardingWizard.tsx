import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  PieChart,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Pin,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import type { CuentaTipo } from '../types/finance';
import { formatQ } from '../lib/validation';
import { CategoryIcon } from './CategoryIcon';
import { IconPickerModal } from './IconPickerModal';

interface WizardAccount {
  id: string;
  nombre: string;
  tipo: CuentaTipo;
  saldo: number;
  color_tag: string;
  icono: string;
}

interface WizardCategory {
  id: string;
  nombre: string;
  icono: string;
  presupuestado: number;
  es_fijo: boolean;
  selected: boolean;
}

interface Props {
  userName?: string;
  onFinishOnboarding: (setupData: {
    cuentas: { nombre: string; tipo: CuentaTipo; saldo_actual: number; color_tag: string; icono: string }[];
    categorias: { nombre: string; icono: string; presupuestado: number; es_fijo: boolean }[];
    ingreso?: { fuente: string; monto_esperado: number; cuenta_nombre: string };
  }) => Promise<void>;
}

export const OnboardingWizard: React.FC<Props> = ({ userName, onFinishOnboarding }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // STEP 1: CUENTAS
  const [cuentas, setCuentas] = useState<WizardAccount[]>([
    {
      id: 'cta-1',
      nombre: 'Efectivo Billetera',
      tipo: 'Efectivo',
      saldo: 150,
      color_tag: 'amber',
      icono: 'Wallet',
    },
    {
      id: 'cta-2',
      nombre: 'Cuenta Monetaria',
      tipo: 'Monetario',
      saldo: 2500,
      color_tag: 'blue',
      icono: 'Landmark',
    },
    {
      id: 'cta-3',
      nombre: 'Cuenta de Ahorro',
      tipo: 'Ahorro',
      saldo: 1000,
      color_tag: 'emerald',
      icono: 'PiggyBank',
    },
  ]);

  // STEP 2: TARJETA DE CRÉDITO
  const [hasCreditCard, setHasCreditCard] = useState(false);
  const [tcNombre, setTcNombre] = useState('Tarjeta de Crédito');
  const [tcDeuda, setTcDeuda] = useState('0');
  const [tcDiaCorte, setTcDiaCorte] = useState('15');

  // STEP 3: CATEGORÍAS SUGERIDAS (Con Gastos Fijos)
  const [categorias, setCategorias] = useState<WizardCategory[]>([
    { id: 'cat-1', nombre: 'Alimentación & Súper', icono: 'pos-machine', presupuestado: 1400, es_fijo: false, selected: true },
    { id: 'cat-2', nombre: 'Alquiler / Vivienda', icono: 'bank-statement', presupuestado: 1800, es_fijo: true, selected: true },
    { id: 'cat-3', nombre: 'Luz, Agua & Gas', icono: 'bill-receipt', presupuestado: 350, es_fijo: true, selected: true },
    { id: 'cat-4', nombre: 'Internet & Celular', icono: 'bill-receipt', presupuestado: 250, es_fijo: true, selected: true },
    { id: 'cat-5', nombre: 'Combustible & Transporte', icono: 'pos-machine', presupuestado: 500, es_fijo: false, selected: true },
    { id: 'cat-6', nombre: 'Restaurantes & Salidas', icono: 'cash', presupuestado: 400, es_fijo: false, selected: true },
    { id: 'cat-7', nombre: 'Salud & Medicinas', icono: 'pos-machine', presupuestado: 200, es_fijo: false, selected: true },
    { id: 'cat-8', nombre: 'Imprevistos & Varios', icono: 'wallet', presupuestado: 300, es_fijo: false, selected: true },
  ]);

  // STEP 4: INGRESO PRINCIPAL
  const [sueldoEstimado, setSueldoEstimado] = useState('4500');
  const [fuenteIngreso, setFuenteIngreso] = useState('Salario Mensual');
  const [cuentaIngresoId, setCuentaIngresoId] = useState(cuentas[1]?.id || cuentas[0]?.id || '');

  // Form para agregar cuenta en Paso 1
  const [newAccNombre, setNewAccNombre] = useState('');
  const [newAccTipo, setNewAccTipo] = useState<CuentaTipo>('Monetario');
  const [newAccSaldo, setNewAccSaldo] = useState('');

  // Form para agregar categoría en Paso 3
  const [newCatNombre, setNewCatNombre] = useState('');
  const [newCatPresupuesto, setNewCatPresupuesto] = useState('');
  const [newCatIcono, setNewCatIcono] = useState('bill-receipt');
  const [newCatEsFijo, setNewCatEsFijo] = useState(false);
  const [showAddCatForm, setShowAddCatForm] = useState(false);

  const handleAddAccount = () => {
    if (!newAccNombre.trim()) return;
    const newAcc: WizardAccount = {
      id: `acc-${Date.now()}`,
      nombre: newAccNombre.trim(),
      tipo: newAccTipo,
      saldo: Number(newAccSaldo) || 0,
      color_tag: newAccTipo === 'Efectivo' ? 'amber' : newAccTipo === 'Ahorro' ? 'emerald' : 'blue',
      icono: newAccTipo === 'Efectivo' ? 'Wallet' : newAccTipo === 'Ahorro' ? 'PiggyBank' : 'Landmark',
    };
    setCuentas((prev) => [...prev, newAcc]);
    setNewAccNombre('');
    setNewAccSaldo('');
  };

  const handleRemoveAccount = (id: string) => {
    setCuentas((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddCategory = () => {
    if (!newCatNombre.trim()) return;
    const newCat: WizardCategory = {
      id: `cat-${Date.now()}`,
      nombre: newCatNombre.trim(),
      icono: newCatIcono,
      presupuestado: Number(newCatPresupuesto) || 0,
      es_fijo: newCatEsFijo,
      selected: true,
    };
    setCategorias((prev) => [...prev, newCat]);
    setNewCatNombre('');
    setNewCatPresupuesto('');
    setNewCatIcono('Tag');
    setNewCatEsFijo(false);
    setShowAddCatForm(false);
  };

  const handleFinalize = async () => {
    try {
      setIsSaving(true);

      // 1. Preparar lista de cuentas finales
      const finalCuentas = cuentas.map((c) => ({
        nombre: c.nombre,
        tipo: c.tipo,
        saldo_actual: c.saldo,
        color_tag: c.color_tag,
        icono: c.icono,
      }));

      // Si agregó tarjeta de crédito, añadirla como cuenta especial
      if (hasCreditCard && tcNombre.trim()) {
        finalCuentas.push({
          nombre: `${tcNombre.trim()} (Corte ${tcDiaCorte})`,
          tipo: 'Tarjeta_Credito' as CuentaTipo,
          saldo_actual: -Math.abs(Number(tcDeuda) || 0),
          color_tag: 'rose',
          icono: 'CreditCard',
        });
      }

      // 2. Preparar categorías seleccionadas
      const finalCategorias = categorias
        .filter((c) => c.selected)
        .map((c) => ({
          nombre: c.nombre,
          icono: c.icono,
          presupuestado: c.presupuestado,
          es_fijo: c.es_fijo,
        }));

      // 3. Preparar ingreso inicial si se especificó
      const targetCuentaNombre =
        cuentas.find((c) => c.id === cuentaIngresoId)?.nombre || finalCuentas[0]?.nombre || 'Cuenta Principal';

      const finalIngreso =
        Number(sueldoEstimado) > 0
          ? {
              fuente: fuenteIngreso.trim() || 'Ingreso Principal',
              monto_esperado: Number(sueldoEstimado),
              cuenta_nombre: targetCuentaNombre,
            }
          : undefined;

      await onFinishOnboarding({
        cuentas: finalCuentas,
        categorias: finalCategorias,
        ingreso: finalIngreso,
      });
    } catch (err: any) {
      alert(err?.message || 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] px-6 pt-6 pb-safe sm:px-8 sm:pt-8 sm:pb-safe shadow-2xl relative my-auto animate-sheet">
        {/* HEADER & STEPPER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-wider mb-3">
            <Sparkles size={12} /> Asistente de Configuración Inicial
          </div>

          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {currentStep === 1 && '¿Con qué dinero cuentas hoy?'}
            {currentStep === 2 && 'Tarjetas de Crédito y Deudas'}
            {currentStep === 3 && 'Tus Categorías de Gasto'}
            {currentStep === 4 && 'Tu Ingreso Mensual Estimado'}
          </h2>

          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            {currentStep === 1 && 'Configura tus cuentas reales (efectivo, bancos o ahorros) con sus saldos actuales.'}
            {currentStep === 2 && 'Si tienes tarjeta de crédito, indica el banco, tu saldo a pagar y día de corte.'}
            {currentStep === 3 && 'Define cuánto planeas gastar en cada área y marca cuáles son Gastos Fijos.'}
            {currentStep === 4 && 'Registra tu sueldo o ingresos fijos para calcular tu balance libre en tiempo real.'}
          </p>

          {/* INDICADOR DE PASOS (1 a 4) */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? 'w-8 bg-[var(--accent)]'
                    : currentStep > step
                    ? 'w-4 bg-emerald-500'
                    : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ========================================================
            PASO 1: CUENTAS Y SALDOS INICIALES
            ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {cuentas.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-[var(--text-primary)]">
                      {c.tipo === 'Efectivo' ? <Wallet size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={c.nombre}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCuentas((prev) =>
                            prev.map((item) => (item.id === c.id ? { ...item, nombre: val } : item))
                          );
                        }}
                        className="bg-transparent text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-b border-[var(--accent)]"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                        {c.tipo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-muted)]">Q</span>
                    <input
                      type="number"
                      value={c.saldo}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setCuentas((prev) =>
                          prev.map((item) => (item.id === c.id ? { ...item, saldo: val } : item))
                        );
                      }}
                      className="w-24 px-2 py-1 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-right text-xs font-black tabular-nums text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(c.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario rápido para agregar cuenta */}
            <div className="p-3.5 rounded-2xl bg-black/20 border border-dashed border-[var(--border-subtle)] space-y-2">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                + Agregar otra cuenta
              </span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nombre de cuenta"
                  value={newAccNombre}
                  onChange={(e) => setNewAccNombre(e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Saldo (Q)"
                  value={newAccSaldo}
                  onChange={(e) => setNewAccSaldo(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs text-right font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <select
                  value={newAccTipo}
                  onChange={(e) => setNewAccTipo(e.target.value as CuentaTipo)}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="Monetario">Monetaria / Cheques</option>
                  <option value="Ahorro">Cuenta de Ahorro</option>
                  <option value="Efectivo">Efectivo</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddAccount}
                  disabled={!newAccNombre.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-bold disabled:opacity-40 active-press"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PASO 2: TARJETAS DE CRÉDITO & DEUDAS
            ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasCreditCard(false)}
                className={`p-4 rounded-2xl border text-left transition-all active-press ${
                  !hasCreditCard
                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold shadow-md shadow-[var(--accent)]/20'
                    : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ShieldCheck size={20} className="mb-2" />
                <span className="text-xs font-black block">No uso tarjetas de crédito</span>
                <span className="text-[10px] opacity-80 block mt-0.5">Solo efectivo y cuentas de débito</span>
              </button>

              <button
                type="button"
                onClick={() => setHasCreditCard(true)}
                className={`p-4 rounded-2xl border text-left transition-all active-press ${
                  hasCreditCard
                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold shadow-md shadow-[var(--accent)]/20'
                    : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <CreditCard size={20} className="mb-2" />
                <span className="text-xs font-black block">Sí tengo tarjeta de crédito</span>
                <span className="text-[10px] opacity-80 block mt-0.5">Controlar corte y deuda mensual</span>
              </button>
            </div>

            {hasCreditCard && (
              <div className="p-4 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] space-y-3 animate-fade-in">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                    Banco o Nombre de la Tarjeta
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Bi Mastercard, BAC Clásica, Promerica"
                    value={tcNombre}
                    onChange={(e) => setTcNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                      ¿Cuánto debes hoy? (Q)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={tcDeuda}
                      onChange={(e) => setTcDeuda(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--border-subtle)] text-xs font-black tabular-nums text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1 uppercase tracking-wider">
                      Día de Corte Mensual
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="15"
                      value={tcDiaCorte}
                      onChange={(e) => setTcDiaCorte(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--border-subtle)] text-xs font-bold tabular-nums text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PASO 3: CATEGORÍAS DE GASTO & GASTOS FIJOS
            ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Categorías recomendadas
              </span>
              <button
                type="button"
                onClick={() => setShowAddCatForm(!showAddCatForm)}
                className="text-xs font-bold text-[var(--accent)] flex items-center gap-1 active-press"
              >
                <Plus size={14} /> Nueva Categoría
              </button>
            </div>

            {/* Formulario para agregar categoría adicional */}
            {showAddCatForm && (
              <div className="p-3.5 rounded-2xl bg-black/30 border border-[var(--border-subtle)] space-y-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="w-10 h-10 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 active-press hover:border-[var(--accent)]"
                    title="Elegir ícono"
                  >
                    <CategoryIcon name={newCatIcono} size={20} />
                  </button>
                  <input
                    type="text"
                    placeholder="Nombre (ej. Gimnasio, Mascotas)"
                    value={newCatNombre}
                    onChange={(e) => setNewCatNombre(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Presupuesto Q"
                    value={newCatPresupuesto}
                    onChange={(e) => setNewCatPresupuesto(e.target.value)}
                    className="w-24 px-2 py-2 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs text-right font-black tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={newCatEsFijo}
                      onChange={(e) => setNewCatEsFijo(e.target.checked)}
                      className="rounded accent-[var(--accent)]"
                    />
                    <span>¿Es Gasto Fijo? (Alquiler, cuotas, etc.)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatNombre.trim()}
                    className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-black text-xs font-black disabled:opacity-40"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Lista con Checkboxes y Gasto Fijo Pin */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                    cat.selected
                      ? 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)]'
                      : 'bg-black/10 border-transparent opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={cat.selected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCategorias((prev) =>
                          prev.map((c) => (c.id === cat.id ? { ...c, selected: checked } : c))
                        );
                      }}
                      className="rounded w-4 h-4 accent-[var(--accent)] cursor-pointer"
                    />

                    <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                      <CategoryIcon name={cat.icono} size={18} />
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
                        {cat.nombre}
                      </span>
                      {cat.es_fijo && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-[var(--accent)] uppercase tracking-wider">
                          <Pin size={8} /> Gasto Fijo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCategorias((prev) =>
                          prev.map((c) => (c.id === cat.id ? { ...c, es_fijo: !c.es_fijo } : c))
                        );
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold transition-colors ${
                        cat.es_fijo
                          ? 'bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                      title={cat.es_fijo ? 'Gasto Fijo activado' : 'Marcar como Gasto Fijo'}
                    >
                      <Pin size={12} />
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">Q</span>
                      <input
                        type="number"
                        value={cat.presupuestado}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setCategorias((prev) =>
                            prev.map((c) => (c.id === cat.id ? { ...c, presupuestado: val } : c))
                          );
                        }}
                        className="w-18 px-2 py-1 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-right text-xs font-black tabular-nums text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            PASO 4: INGRESO PRINCIPAL / SALARIO
            ======================================================== */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                Ingreso o Sueldo Mensual Estimado (Q)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="4500.00"
                value={sueldoEstimado}
                onChange={(e) => setSueldoEstimado(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-2xl font-black tabular-nums text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:outline-none transition-all"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1.5 block">
                Este valor servirá para calcular tu balance disponible y medir tus gastos frente a ingresos.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                Concepto de Ingreso
              </label>
              <input
                type="text"
                placeholder="ej. Salario Mensual, Honorarios, Negocio"
                value={fuenteIngreso}
                onChange={(e) => setFuenteIngreso(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text-primary)] block mb-1.5 uppercase tracking-wider">
                ¿En qué cuenta se deposita principalmente?
              </label>
              <select
                value={cuentaIngresoId}
                onChange={(e) => setCuentaIngresoId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
              >
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo}) - Saldo: Q {c.saldo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* BOTONES DE NAVEGACIÓN INFERIOR */}
        <div className="pt-6 mt-6 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-3 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 active-press transition-colors"
            >
              <ArrowLeft size={15} /> Atrás
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-6 py-3 rounded-2xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 active-press hover:brightness-105 transition-all shadow-md shadow-[var(--accent)]/30"
            >
              Siguiente <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleFinalize}
              className="px-6 py-3.5 rounded-2xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 active-press hover:brightness-105 transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/30"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} /> Comenzar a Usar Mis Finanzas
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SELECTOR DE ÍCONOS PARA AGREGAR NUEVA CATEGORÍA */}
      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={newCatIcono}
        onSelectIcon={(ic) => setNewCatIcono(ic)}
      />
    </div>
  );
};
