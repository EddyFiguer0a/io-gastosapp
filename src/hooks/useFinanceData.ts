import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../lib/supabaseService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { PresupuestoCompleto } from '../types/finance';

interface UseFinanceDataReturn {
  data: PresupuestoCompleto | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<PresupuestoCompleto | null>>;
}

export function useFinanceData(mes: number, anio: number): UseFinanceDataReturn {
  const { session } = useAuth();
  const [data, setData] = useState<PresupuestoCompleto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await supabaseService.getActivePresupuesto(mes, anio);
      setData(res);
    } catch (err: any) {
      console.error('Error al cargar datos financieros:', err);
      setError(err?.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  }, [session, mes, anio]);

  // Disparar carga cuando cambia mes, año o sesión
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Canal Realtime con auto-cleanup para prevenir memory leaks
  useEffect(() => {
    if (!session || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`realtime-gastos-${session.user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${session.user.id}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, loadData]);

  return {
    data,
    loading,
    error,
    refresh: loadData,
    setData,
  };
}
