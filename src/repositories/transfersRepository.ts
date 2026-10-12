import { supabase, getAuthUser } from './baseRepository';
import type { Transferencia } from '../types/finance';

export const transfersRepository = {
  async getTransferencias(): Promise<Transferencia[]> {
    const user = await getAuthUser();
    const { data, error } = await supabase
      .from('transferencias')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return (data || []).map((t) => ({
      ...t,
      monto: Number(t.monto) || 0,
      concepto: t.concepto || '',
    }));
  },

  async addTransferencia(data: {
    cuenta_origen_id: string;
    cuenta_destino_id: string;
    monto: number;
    fecha?: string;
    concepto?: string;
  }): Promise<void> {
    const user = await getAuthUser();
    const monto = Number(data.monto);
    if (isNaN(monto) || monto <= 0) {
      throw new Error('El monto de la transferencia debe ser mayor a 0');
    }
    if (!data.cuenta_origen_id || !data.cuenta_destino_id) {
      throw new Error('Debes seleccionar cuenta origen y destino');
    }
    if (data.cuenta_origen_id === data.cuenta_destino_id) {
      throw new Error('La cuenta de origen y destino deben ser distintas');
    }

    // 1. Registrar transferencia
    const { error: transferErr } = await supabase.from('transferencias').insert([
      {
        user_id: user.id,
        cuenta_origen_id: data.cuenta_origen_id,
        cuenta_destino_id: data.cuenta_destino_id,
        monto,
        fecha: data.fecha || new Date().toISOString().split('T')[0],
        concepto: data.concepto || 'Transferencia entre cuentas',
      },
    ]);
    if (transferErr) throw transferErr;

    // 2. Debitar cuenta origen
    const { data: origen, error: origenErr } = await supabase
      .from('cuentas')
      .select('saldo_actual')
      .eq('id', data.cuenta_origen_id)
      .eq('user_id', user.id)
      .single();
    if (origenErr) throw origenErr;

    const { error: updateOrigenErr } = await supabase
      .from('cuentas')
      .update({ saldo_actual: Number(origen.saldo_actual) - monto })
      .eq('id', data.cuenta_origen_id)
      .eq('user_id', user.id);
    if (updateOrigenErr) throw updateOrigenErr;

    // 3. Acreditar cuenta destino
    const { data: destino, error: destinoErr } = await supabase
      .from('cuentas')
      .select('saldo_actual')
      .eq('id', data.cuenta_destino_id)
      .eq('user_id', user.id)
      .single();
    if (destinoErr) throw destinoErr;

    const { error: updateDestinoErr } = await supabase
      .from('cuentas')
      .update({ saldo_actual: Number(destino.saldo_actual) + monto })
      .eq('id', data.cuenta_destino_id)
      .eq('user_id', user.id);
    if (updateDestinoErr) throw updateDestinoErr;
  },

  async deleteTransferencia(id: string): Promise<void> {
    const user = await getAuthUser();
    const { data: tr, error: fetchErr } = await supabase
      .from('transferencias')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    const { error: deleteErr } = await supabase
      .from('transferencias')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (deleteErr) throw deleteErr;

    if (tr && Number(tr.monto) > 0) {
      const monto = Number(tr.monto);

      // Revertir débito en origen
      const { data: origen } = await supabase
        .from('cuentas')
        .select('saldo_actual')
        .eq('id', tr.cuenta_origen_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (origen) {
        await supabase
          .from('cuentas')
          .update({ saldo_actual: Number(origen.saldo_actual) + monto })
          .eq('id', tr.cuenta_origen_id)
          .eq('user_id', user.id);
      }

      // Revertir crédito en destino
      const { data: destino } = await supabase
        .from('cuentas')
        .select('saldo_actual')
        .eq('id', tr.cuenta_destino_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (destino) {
        await supabase
          .from('cuentas')
          .update({ saldo_actual: Number(destino.saldo_actual) - monto })
          .eq('id', tr.cuenta_destino_id)
          .eq('user_id', user.id);
      }
    }
  },
};
