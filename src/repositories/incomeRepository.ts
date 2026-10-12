import { supabase, getAuthUser } from './baseRepository';
import type { Ingreso } from '../types/finance';
import type { Database } from '../types/database.types';

type IngresoUpdate = Database['public']['Tables']['ingresos']['Update'];

export const incomeRepository = {
  async getIngresosByPresupuesto(presupuestoId: string): Promise<Ingreso[]> {
    const user = await getAuthUser();
    const { data, error } = await supabase
      .from('ingresos')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .eq('user_id', user.id)
      .order('created_at');

    if (error) throw error;
    return (data || []).map((i) => ({
      ...i,
      cuenta_id: i.cuenta_id || '',
      monto_esperado: Number(i.monto_esperado) || 0,
      monto_recibido: Number(i.monto_recibido) || 0,
    }));
  },

  async addIngreso(data: {
    presupuesto_id: string;
    cuenta_id?: string;
    fuente: string;
    monto_esperado: number;
    monto_recibido?: number;
    descripcion?: string | null;
  }): Promise<void> {
    const user = await getAuthUser();
    const montoEsperado = Number(data.monto_esperado) || 0;
    const montoRecibido = Number(data.monto_recibido !== undefined ? data.monto_recibido : montoEsperado);

    const { error: insertErr } = await supabase.from('ingresos').insert([
      {
        presupuesto_id: data.presupuesto_id,
        cuenta_id: data.cuenta_id || null,
        fuente: data.fuente.trim(),
        descripcion: data.descripcion || null,
        monto_esperado: montoEsperado,
        monto_recibido: montoRecibido,
        user_id: user.id,
      },
    ]);

    if (insertErr) throw insertErr;

    // Acreditar a la cuenta destino si aplica
    if (data.cuenta_id && montoRecibido > 0) {
      const { data: cuenta, error: cuentaErr } = await supabase
        .from('cuentas')
        .select('saldo_actual')
        .eq('id', data.cuenta_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (cuentaErr) throw cuentaErr;

      if (cuenta) {
        const { error: updateErr } = await supabase
          .from('cuentas')
          .update({ saldo_actual: Number(cuenta.saldo_actual) + montoRecibido })
          .eq('id', data.cuenta_id)
          .eq('user_id', user.id);

        if (updateErr) throw updateErr;
      }
    }
  },

  async updateIngreso(id: string, data: Partial<Ingreso>): Promise<void> {
    const user = await getAuthUser();
    const updateObj: IngresoUpdate = {};

    if (data.fuente !== undefined) updateObj.fuente = data.fuente.trim();
    if (data.descripcion !== undefined) updateObj.descripcion = data.descripcion;
    if (data.cuenta_id !== undefined) updateObj.cuenta_id = data.cuenta_id || null;
    if (data.monto_esperado !== undefined) updateObj.monto_esperado = Number(data.monto_esperado);
    if (data.monto_recibido !== undefined) updateObj.monto_recibido = Number(data.monto_recibido);

    const { error } = await supabase
      .from('ingresos')
      .update(updateObj)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deleteIngreso(id: string): Promise<void> {
    const user = await getAuthUser();
    const { data: ing, error: fetchErr } = await supabase
      .from('ingresos')
      .select('cuenta_id, monto_recibido, monto_esperado')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    const { error: deleteErr } = await supabase
      .from('ingresos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteErr) throw deleteErr;

    // Revertir débito de la cuenta
    if (ing && ing.cuenta_id) {
      const monto = Number(ing.monto_recibido) || Number(ing.monto_esperado) || 0;
      if (monto > 0) {
        const { data: cuenta } = await supabase
          .from('cuentas')
          .select('saldo_actual')
          .eq('id', ing.cuenta_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (cuenta) {
          await supabase
            .from('cuentas')
            .update({ saldo_actual: Math.max(0, Number(cuenta.saldo_actual) - monto) })
            .eq('id', ing.cuenta_id)
            .eq('user_id', user.id);
        }
      }
    }
  },
};
