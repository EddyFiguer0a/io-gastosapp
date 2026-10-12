import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { AccountsView } from './components/AccountsView';
import { BudgetView } from './components/BudgetView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { TransactionsView } from './components/TransactionsView';
import { QuickEntryModal } from './components/QuickEntryModal';
import { BottomNav } from './components/BottomNav';
import { ToastContainer, ToastMessage } from './components/Toast';
import { supabaseService as financeService } from './lib/supabaseService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { LoginView } from './components/LoginView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { useAuth } from './context/AuthContext';
import type {
  PresupuestoCompleto,
  ActiveTab,
  QuickEntryType,
  MetodoPago,
  VisualTheme,
  TransaccionGasto,
  CuentaTipo,
  Cuenta,
} from './types/finance';
import { formatQ } from './lib/validation';

export default function App() {
  const { session, user, profile, loading: authChecking, signOut } = useAuth();
  const [mes, setMes] = useState(9); // Septiembre 2026
  const [anio, setAnio] = useState(2026);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [data, setData] = useState<PresupuestoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboardingManual, setShowOnboardingManual] = useState(false);

  // Visual Theme Selector (Option 1: Cyber Lime, Option 2: Sage Mint)
  const [visualStyle, setVisualStyle] = useState<VisualTheme>(() => {
    return (localStorage.getItem('mis_gastos_visual_style') as VisualTheme) || 'cyber';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-style', visualStyle);
    localStorage.setItem('mis_gastos_visual_style', visualStyle);
  }, [visualStyle]);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (localStorage.getItem('mis_gastos_dark_mode') !== null) {
      return localStorage.getItem('mis_gastos_dark_mode') === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('mis_gastos_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Quick entry modal
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<QuickEntryType>('gasto');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Carga estable de datos con parámetros explícitos para prevenir re-renders innecesarios
  const loadData = useCallback(async (targetMes: number, targetAnio: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getActivePresupuesto(targetMes, targetAnio);
      setData(res);
    } catch (err: any) {
      console.error('Error al cargar datos financieros:', err);
      const msg = err?.message || 'Error desconocido al cargar la base de datos';
      setError(msg);
      addToast('Error al cargar datos financieros', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Disparar carga cuando cambia periodo o sesión
  useEffect(() => {
    if (session) {
      loadData(mes, anio);
    }
  }, [mes, anio, session, loadData]);

  // Canal Realtime con función de limpieza estricta (Previene memory leaks)
  useEffect(() => {
    if (!session || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`realtime-gastos-${session.user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${session.user.id}` },
        () => {
          loadData(mes, anio);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, mes, anio, loadData]);

  const handlePeriodChange = (newMes: number, newAnio: number) => {
    setMes(newMes);
    setAnio(newAnio);
  };

  const handleOpenQuickEntry = (tipo: QuickEntryType = 'gasto') => {
    setQuickEntryType(tipo);
    setIsQuickEntryOpen(true);
  };

  const handleAddTransaccion = async (txData: {
    categoria_id: string;
    cuenta_id: string;
    concepto: string;
    monto: number;
    fecha: string;
    metodo_pago: MetodoPago;
  }) => {
    try {
      await financeService.addTransaccion(txData);
      addToast(`Gasto de ${formatQ(txData.monto)} registrado`);
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al registrar el gasto', 'error');
    }
  };

  const handleDeleteTransaccion = async (id: string) => {
    try {
      await financeService.deleteTransaccion(id);
      addToast('Transacción eliminada', 'info');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al eliminar transacción', 'error');
    }
  };

  const handleEditTransaccion = async (id: string, updateData: Partial<TransaccionGasto>) => {
    try {
      await financeService.updateTransaccion(id, updateData);
      addToast('Transacción actualizada', 'success');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al actualizar transacción', 'error');
    }
  };

  const handleDeleteIngreso = async (id: string) => {
    try {
      await financeService.deleteIngreso(id);
      addToast('Ingreso eliminado', 'info');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al eliminar ingreso', 'error');
    }
  };

  const handleDeleteTransferencia = async (id: string) => {
    try {
      await financeService.deleteTransferencia(id);
      addToast('Transferencia eliminada', 'info');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al eliminar transferencia', 'error');
    }
  };

  const handlePayOffCreditCard = async (selectedTxIds: string[], cuentaOrigenId: string) => {
    if (!data) return;
    try {
      await financeService.payOffCreditCard(selectedTxIds, cuentaOrigenId);
      addToast('Tarjeta de crédito pagada con éxito', 'success');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al procesar el pago de la tarjeta', 'error');
    }
  };

  const handleAddIngreso = async (ingData: {
    presupuesto_id: string;
    cuenta_id: string;
    fuente: string;
    descripcion?: string | null;
    monto_esperado: number;
    monto_recibido: number;
  }) => {
    try {
      await financeService.addIngreso(ingData);
      addToast(`Ingreso de ${formatQ(ingData.monto_recibido)} registrado`);
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al registrar el ingreso', 'error');
    }
  };

  const handleAddAporteMeta = async (metaId: string, monto: number, cuenta_id: string) => {
    try {
      await financeService.addAporteMeta({ metaId, monto, cuenta_id });
      addToast(`Aporte de ${formatQ(monto)} acreditado a la meta.`);
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al acreditar aporte', 'error');
    }
  };

  const handleUpdateMesada = async (id: string, updateData: { nombre?: string; acumulado?: number }) => {
    try {
      await financeService.updateMeta(id, {
        ...(updateData.nombre !== undefined && { titulo: updateData.nombre }),
        ...(updateData.acumulado !== undefined && { monto_acumulado: updateData.acumulado })
      });
      addToast('Fuente de mesada actualizada', 'success');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al actualizar mesada', 'error');
    }
  };

  const handleDeleteMesada = async (id: string) => {
    try {
      await financeService.deleteMeta(id);
      addToast('Fuente de mesada eliminada', 'info');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al eliminar fuente de mesada', 'error');
    }
  };

  const handleCreateMesada = async (newData: { nombre: string; acumulado: number }) => {
    try {
      await financeService.addMeta({
        titulo: newData.nombre,
        precio_objetivo: 0,
        meta_mensual: 0,
        monto_acumulado: newData.acumulado,
        color_tag: 'emerald'
      });
      addToast('Fuente de mesada creada', 'success');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al crear fuente de mesada', 'error');
    }
  };

  const handleAddTransferencia = async (transData: {
    cuenta_origen_id: string;
    cuenta_destino_id: string;
    monto: number;
    fecha: string;
    concepto?: string;
  }) => {
    try {
      await financeService.addTransferencia(transData);
      addToast(`Transferencia de ${formatQ(transData.monto)} realizada con éxito`);
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al realizar la transferencia', 'error');
    }
  };

  const handleAddMeta = async (metaData: {
    titulo: string;
    precio_objetivo: number;
    meta_mensual: number;
    monto_acumulado?: number;
    color_tag?: string;
    fecha_limite?: string | null;
  }) => {
    try {
      await financeService.addMeta(metaData);
      addToast(`Meta "${metaData.titulo}" creada con éxito`);
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al crear meta', 'error');
    }
  };

  const handleAddCategoria = async (catData: {
    nombre: string;
    icono: string;
    presupuestado: number;
    descripcion?: string;
    es_fijo?: boolean;
  }) => {
    if (!data) return;
    try {
      await financeService.addCategoria({
        presupuesto_id: data.presupuesto.id,
        ...catData,
      });
      addToast(`Categoría "${catData.nombre}" creada`);
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al crear categoría', 'error');
    }
  };

  const handleDeleteCategoria = async (catId: string) => {
    try {
      await financeService.deleteCategoria(catId);
      addToast('Categoría eliminada con éxito', 'info');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al eliminar categoría', 'error');
    }
  };

  const handleEditCategoria = async (
    catId: string,
    catData: {
      nombre?: string;
      icono?: string;
      presupuestado?: number;
      descripcion?: string;
      es_fijo?: boolean;
    }
  ) => {
    try {
      await financeService.updateCategoria(catId, catData);
      addToast('Categoría actualizada con éxito');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al actualizar categoría', 'error');
    }
  };

  const handleCreateCuenta = async (cuentaData: {
    nombre: string;
    tipo: CuentaTipo;
    saldo_actual: number;
    color_tag: string;
    icono: string;
  }) => {
    try {
      await financeService.addCuenta(cuentaData);
      addToast(`Cuenta "${cuentaData.nombre}" creada`);
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al crear cuenta', 'error');
    }
  };

  const handleUpdateCuenta = async (cuentaId: string, updateData: Partial<Cuenta>) => {
    try {
      await financeService.updateCuenta(cuentaId, updateData);
      addToast('Cuenta actualizada con éxito');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al actualizar cuenta', 'error');
    }
  };

  const handleDeleteCuenta = async (cuentaId: string) => {
    try {
      await financeService.deleteCuenta(cuentaId);
      addToast('Cuenta eliminada con éxito', 'info');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al eliminar cuenta', 'error');
    }
  };

  const handleFinishOnboarding = async (setupData: {
    cuentas: { nombre: string; tipo: CuentaTipo; saldo_actual: number; color_tag: string; icono: string }[];
    categorias: { nombre: string; icono: string; presupuestado: number; es_fijo: boolean }[];
    ingreso?: { fuente: string; monto_esperado: number; cuenta_nombre: string };
  }) => {
    try {
      setLoading(true);
      if (!data) return;
      const pId = data.presupuesto.id;

      // 1. Guardar Cuentas
      for (const c of setupData.cuentas) {
        await financeService.addCuenta(c);
      }

      // Recargar para obtener cuentas registradas
      await loadData(mes, anio);
      const freshPresupuesto = await financeService.getActivePresupuesto(mes, anio);

      // 2. Guardar Categorías
      for (const cat of setupData.categorias) {
        await financeService.addCategoria({
          presupuesto_id: pId,
          nombre: cat.nombre,
          icono: cat.icono,
          presupuestado: cat.presupuestado,
          es_fijo: cat.es_fijo,
        });
      }

      // 3. Guardar Ingreso inicial si fue definido
      if (setupData.ingreso) {
        const matchingCta =
          freshPresupuesto.cuentas.find((c) => c.nombre === setupData.ingreso?.cuenta_nombre) ||
          freshPresupuesto.cuentas[0];

        if (matchingCta) {
          await financeService.addIngreso({
            presupuesto_id: pId,
            cuenta_id: matchingCta.id,
            fuente: setupData.ingreso.fuente,
            monto_esperado: setupData.ingreso.monto_esperado,
            monto_recibido: setupData.ingreso.monto_esperado,
          });
        }
      }

      setShowOnboardingManual(false);
      await loadData(mes, anio);
      addToast('¡Perfil configurado con éxito! Bienvenido a Mis Gastos.', 'success');
    } catch (err: any) {
      console.error('Error en onboarding:', err);
      addToast(err?.message || 'Error al completar la configuración inicial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await financeService.resetToDemo();
      addToast('Datos restablecidos con el Excel', 'info');
      await loadData(mes, anio);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Error al reiniciar datos', 'error');
    }
  };

  // Exportar JSON
  const handleExportJson = () => {
    try {
      const jsonStr = financeService.exportToJson();
      navigator.clipboard.writeText(jsonStr);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis_gastos_${anio}_${mes}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('JSON copiado al portapapeles y descargado', 'success');
    } catch (err: any) {
      console.error(err);
      addToast('Error al exportar datos JSON', 'error');
    }
  };

  // Importar JSON
  const handleImportJson = async (jsonString: string) => {
    try {
      const success = await financeService.importFromJson(jsonString);
      if (success) {
        addToast('Datos JSON importados con éxito', 'success');
        await loadData(mes, anio);
      } else {
        addToast('El formato JSON no es válido', 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast('Error al importar archivo JSON', 'error');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-main)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-brand)]"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  if (error && !data) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <span className="text-red-400 text-3xl">!</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg mb-1">Error al conectar</h2>
            <p className="text-red-400 text-sm max-w-sm">{error}</p>
            <p className="text-zinc-500 text-xs mt-2">Revisa que la base de datos Supabase tenga las tablas correctamente configuradas.</p>
          </div>
          <button
            onClick={() => loadData(mes, anio)}
            className="mt-4 bg-[var(--text-primary)] text-[var(--bg-main)] px-6 py-2 rounded-xl font-bold active-press"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-brand)]"></div>
          <p className="text-xs text-[var(--text-muted)] font-medium">Cargando datos de la nube...</p>
        </div>
      </div>
    );
  }

  const isCloudConnected = isSupabaseConfigured() && Boolean(session);

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-emerald-500/30">
      {/* HEADER SUPERIOR */}
      <Header
        mes={mes}
        anio={anio}
        onPeriodChange={(m, a) => { setMes(m); setAnio(a); }}
        isCloud={isCloudConnected}
        onResetDemo={handleResetDemo}
        visualStyle={visualStyle}
        onToggleVisualStyle={() => setVisualStyle((prev) => (prev === 'cyber' ? 'sheltheme' : 'cyber'))}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenOnboarding={() => setShowOnboardingManual(true)}
        onLogout={async () => {
          setData(null);
          await signOut();
          addToast('Sesión cerrada con éxito', 'info');
        }}
      />

      {/* CONTENEDOR PRINCIPAL (MOBILE-FIRST SYMMETRIC) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3">
        {data && (
          <>
            {activeTab === 'overview' && (
              <OverviewView
                data={data}
                visualStyle={visualStyle}
                onOpenQuickEntry={handleOpenQuickEntry}
                onNavigateTab={setActiveTab}
                onPayOffCard={handlePayOffCreditCard}
                userName={profile?.full_name || user?.user_metadata?.full_name}
                onUpdateMesada={handleUpdateMesada}
                onDeleteMesada={handleDeleteMesada}
                onCreateMesada={handleCreateMesada}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsView
                cuentas={data.cuentas}
                onOpenQuickEntry={handleOpenQuickEntry}
                onCreateCuenta={handleCreateCuenta}
                onUpdateCuenta={handleUpdateCuenta}
                onDeleteCuenta={handleDeleteCuenta}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetView
                categorias={data.categorias}
                totalPresupuestado={data.metricas.total_presupuestado}
                totalGastosReales={data.metricas.total_gastos_reales}
                onAddCategoria={handleAddCategoria}
                onDeleteCategoria={handleDeleteCategoria}
              />
            )}

            {activeTab === 'goals' && (
              <SavingsGoalsView
                metas={data.metas}
                ahorroMesada={data.ahorroMesada}
                visualStyle={visualStyle}
                onAddMeta={handleAddMeta}
                onAporteMeta={handleAddAporteMeta}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transacciones={data.transacciones}
                ingresos={data.ingresos}
                transferencias={data.transferencias}
                cuentas={data.cuentas}
                categorias={data.categorias}
                onDeleteTransaccion={handleDeleteTransaccion}
                onEditTransaccion={handleEditTransaccion}
                onDeleteIngreso={handleDeleteIngreso}
                onDeleteTransferencia={handleDeleteTransferencia}
              />
            )}
          </>
        )}
      </main>

      {/* MODAL BOTTOM SHEET DE REGISTRO RÁPIDO */}
      {data && (
        <QuickEntryModal
          isOpen={isQuickEntryOpen}
          onClose={() => setIsQuickEntryOpen(false)}
          initialType={quickEntryType}
          cuentas={data.cuentas}
          categorias={data.categorias}
          metas={data.metas}
          presupuestoId={data.presupuesto.id}
          onAddTransaccion={handleAddTransaccion}
          onAddIngreso={handleAddIngreso}
          onAporteMeta={handleAddAporteMeta}
          onAddTransferencia={handleAddTransferencia}
          onAddCategoria={handleAddCategoria}
          onDeleteCategoria={handleDeleteCategoria}
          onEditCategoria={handleEditCategoria}
        />
      )}

      {/* DOCK DE NAVEGACIÓN INFERIOR ERGONÓMICO */}
      <BottomNav
        activeTab={activeTab}
        visualStyle={visualStyle}
        onTabChange={setActiveTab}
        onOpenQuickEntry={() => handleOpenQuickEntry('gasto')}
      />

      {/* ASISTENTE ONBOARDING PARA USUARIO NUEVO O CONFIGURACIÓN MANUAL */}
      {session && data && (data.cuentas.length === 0 || showOnboardingManual) && (
        <OnboardingWizard
          userName={profile?.full_name || user?.user_metadata?.full_name}
          onFinishOnboarding={handleFinishOnboarding}
        />
      )}

      {/* NOTIFICACIONES TOAST */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
