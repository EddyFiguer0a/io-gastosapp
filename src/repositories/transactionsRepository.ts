import { supabase, getAuthUser } from './baseRepository';
import { transfersRepository } from './transfersRepository';
import type { TransaccionGasto } from '../types/finance';
import type { Database } from '../types/database.types';

type TransaccionUpdate = Database['public']['Tables']['transacciones']['Update'];

export const transactionsRepository = {
  async getTransactionsByMonth(mes: number, anio: number): Promise<TransaccionGasto[]> {
    const user = await getAuthUser();
    const { data: presArr, error: presErr } = await supabase
      .from('presupuestos')
      .select('id')
      .eq('user_id', user.id)
      .eq('mes', mes)
      .eq('anio', anio)
      .order('created_at', { ascending: false })
      .limit(1);

    if (presErr) throw presErr;
    const pres = presArr && presArr.length > 0 ? presArr[0] : null;
    if (!pres) return [];

    const { data: categorias, error: catErr } = await supabase
      .from('categorias')
      .select('id, nombre, icono')
      .eq('presupuesto_id', pres.id);
    if (catErr) throw catErr;
    if (!categorias || categorias.length === 0) return [];

    const catMap = new Map(categorias.map((c) => [c.id, c]));
    const catIds = categorias.map((c) => c.id);

    const { data: txs, error: txErr } = await supabase
      .from('transacciones')
      .select('*')
      .in('categoria_id', catIds)
      .order('fecha', { ascending: false });

    if (txErr) throw txErr;

    return (txs || []).map((t) => {
      const cat = catMap.get(t.categoria_id);
      return {
        ...t,
        cuenta_id: t.cuenta_id || '',
        monto: Number(t.monto) || 0,
        metodo_pago: (t.metodo_pago || 'Efectivo') as any,
        categoria_nombre: cat?.nombre || 'General',
        categoria_icono: cat?.icono || 'Tag',
      };
    });
  },

  async addTransaccion(data: Partial<TransaccionGasto>): Promise<void> {
    const user = await getAuthUser();
    const monto = Number(data.monto);
    if (isNaN(monto) || monto <= 0) {
      throw new Error('El monto de la transacción debe ser mayor a 0');
    }

    if (!data.categoria_id) {
      throw new Error('Debes seleccionar una categoría');
    }

    const { error: insertErr } = await supabase.from('transacciones').insert([
      {
        categoria_id: data.categoria_id,
        cuenta_id: data.cuenta_id || null,
        concepto: (data.concepto || '').trim(),
        monto,
        fecha: data.fecha || new Date().toISOString().split('T')[0],
        metodo_pago: data.metodo_pago || 'Efectivo',
        user_id: user.id,
      },
    ]);
    if (insertErr) throw insertErr;

    // Si fue vinculada a una cuenta, restar el saldo
    if (data.cuenta_id) {
      const { data: cuenta, error: fetchErr } = await supabase
        .from('cuentas')
        .select('saldo_actual')
        .eq('id', data.cuenta_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      if (cuenta) {
        const { error: updateErr } = await supabase
          .from('cuentas')
          .update({ saldo_actual: Number(cuenta.saldo_actual) - monto })
          .eq('id', data.cuenta_id)
          .eq('user_id', user.id);
        if (updateErr) throw updateErr;
      }
    }
  },

  async updateTransaccion(id: string, data: Partial<TransaccionGasto>): Promise<void> {
    const user = await getAuthUser();
    if (data.monto !== undefined) {
      const nuevoMonto = Number(data.monto);
      const { data: tx, error: fetchErr } = await supabase
        .from('transacciones')
        .select('cuenta_id, monto')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (fetchErr) throw fetchErr;

      if (tx && tx.cuenta_id && Number(tx.monto) !== nuevoMonto) {
        const diferencia = nuevoMonto - Number(tx.monto);
        const { data: cuenta, error: cuentaErr } = await supabase
          .from('cuentas')
          .select('saldo_actual')
          .eq('id', tx.cuenta_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (cuentaErr) throw cuentaErr;

        if (cuenta) {
          const { error: updateErr } = await supabase
            .from('cuentas')
            .update({ saldo_actual: Number(cuenta.saldo_actual) - diferencia })
            .eq('id', tx.cuenta_id)
            .eq('user_id', user.id);
          if (updateErr) throw updateErr;
        }
      }
    }

    const updateObj: TransaccionUpdate = {};
    if (data.concepto !== undefined) updateObj.concepto = data.concepto.trim();
    if (data.monto !== undefined) updateObj.monto = Number(data.monto);
    if (data.fecha !== undefined) updateObj.fecha = data.fecha;
    if (data.categoria_id !== undefined) updateObj.categoria_id = data.categoria_id;
    if (data.cuenta_id !== undefined) updateObj.cuenta_id = data.cuenta_id || null;
    if (data.metodo_pago !== undefined) updateObj.metodo_pago = data.metodo_pago;

    const { error: updateTxErr } = await supabase
      .from('transacciones')
      .update(updateObj)
      .eq('id', id)
      .eq('user_id', user.id);
    if (updateTxErr) throw updateTxErr;
  },

  async deleteTransaccion(id: string): Promise<void> {
    const user = await getAuthUser();
    const { data: tx, error: fetchErr } = await supabase
      .from('transacciones')
      .select('cuenta_id, monto')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (fetchErr) throw fetchErr;

    const { error: deleteErr } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (deleteErr) throw deleteErr;

    if (tx && tx.cuenta_id && tx.monto) {
      const { data: cuenta, error: cuentaFetchErr } = await supabase
        .from('cuentas')
        .select('saldo_actual')
        .eq('id', tx.cuenta_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (cuentaFetchErr) throw cuentaFetchErr;

      if (cuenta) {
        const { error: updateErr } = await supabase
          .from('cuentas')
          .update({ saldo_actual: Number(cuenta.saldo_actual) + Number(tx.monto) })
          .eq('id', tx.cuenta_id)
          .eq('user_id', user.id);
        if (updateErr) throw updateErr;
      }
    }
  },

  async payOffCreditCard(selectedTxIds: string[], cuentaOrigenId: string): Promise<void> {
    const user = await getAuthUser();

    // 1. Obtener las transacciones seleccionadas
    const { data: txs, error: fetchTxErr } = await supabase
      .from('transacciones')
      .select('id, monto, concepto, cuenta_id')
      .in('id', selectedTxIds)
      .eq('user_id', user.id);

    if (fetchTxErr) throw fetchTxErr;
    if (!txs || txs.length === 0) return;

    const totalToPay = txs.reduce((acc, t) => acc + Number(t.monto), 0);

    // 2. Identificar la cuenta de tipo Tarjeta_Credito
    let tcAccountId = txs.find((t) => t.cuenta_id)?.cuenta_id;
    const { data: ccAccs } = await supabase
      .from('cuentas')
      .select('id')
      .eq('tipo', 'Tarjeta_Credito')
      .eq('user_id', user.id)
      .limit(1);

    if (ccAccs && ccAccs.length > 0) {
      tcAccountId = ccAccs[0].id;
    }

    if (!tcAccountId) {
      throw new Error('No se encontró una cuenta de tipo Tarjeta de Crédito registrada');
    }

    // 3. Marcar transacciones como pagadas
    const txsToUpdate = txs.filter((t) => !t.concepto.includes('[PAGADO]'));
    if (txsToUpdate.length > 0) {
      await Promise.all(
        txsToUpdate.map((tx) =>
          supabase
            .from('transacciones')
            .update({ concepto: `[PAGADO] ${tx.concepto}`.trim() })
            .eq('id', tx.id)
            .eq('user_id', user.id)
        )
      );
    }

    // 4. Registrar la transferencia de la cuenta de débito/efectivo a la tarjeta
    await transfersRepository.addTransferencia({
      cuenta_origen_id: cuentaOrigenId,
      cuenta_destino_id: tcAccountId,
      monto: totalToPay,
      concepto: 'Pago de Tarjeta de Crédito',
    });
  },
};
