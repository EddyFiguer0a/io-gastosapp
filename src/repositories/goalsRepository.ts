import { supabase, getAuthUser } from './baseRepository';
import type { MetaAhorro } from '../types/finance';
import type { Database } from '../types/database.types';

type MetaUpdate = Database['public']['Tables']['metas_ahorro']['Update'];

export const goalsRepository = {
  async getMetas(): Promise<MetaAhorro[]> {
    const user = await getAuthUser();
    const { data, error } = await supabase
      .from('metas_ahorro')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');

    if (error) throw error;
    return (data || []).map((m) => ({
      ...m,
      precio_objetivo: Number(m.precio_objetivo) || 0,
      meta_mensual: Number(m.meta_mensual) || 0,
      monto_acumulado: Number(m.monto_acumulado) || 0,
    }));
  },

  async addMeta(data: {
    titulo: string;
    precio_objetivo: number;
    meta_mensual?: number;
    monto_acumulado?: number;
    fecha_limite?: string | null;
    color_tag?: string;
  }): Promise<MetaAhorro> {
    const user = await getAuthUser();
    const precioObjetivo = Number(data.precio_objetivo) || 0;
    if (precioObjetivo <= 0) {
      throw new Error('El objetivo de ahorro debe ser mayor a 0');
    }

    const { data: created, error } = await supabase
      .from('metas_ahorro')
      .insert([
        {
          user_id: user.id,
          titulo: data.titulo.trim(),
          precio_objetivo: precioObjetivo,
          meta_mensual: Number(data.meta_mensual) || 0,
          monto_acumulado: Number(data.monto_acumulado) || 0,
          fecha_limite: data.fecha_limite || null,
          color_tag: data.color_tag || 'emerald',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      ...created,
      precio_objetivo: Number(created.precio_objetivo) || 0,
      meta_mensual: Number(created.meta_mensual) || 0,
      monto_acumulado: Number(created.monto_acumulado) || 0,
    };
  },

  async updateMeta(id: string, data: Partial<MetaAhorro>): Promise<void> {
    const user = await getAuthUser();
    const updateObj: MetaUpdate = {};

    if (data.titulo !== undefined) updateObj.titulo = data.titulo.trim();
    if (data.precio_objetivo !== undefined) updateObj.precio_objetivo = Number(data.precio_objetivo);
    if (data.meta_mensual !== undefined) updateObj.meta_mensual = Number(data.meta_mensual);
    if (data.monto_acumulado !== undefined) updateObj.monto_acumulado = Number(data.monto_acumulado);
    if (data.fecha_limite !== undefined) updateObj.fecha_limite = data.fecha_limite || null;
    if (data.color_tag !== undefined) updateObj.color_tag = data.color_tag;

    const { error } = await supabase
      .from('metas_ahorro')
      .update(updateObj)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async updateMetaMonto(id: string, nuevoMonto: number): Promise<void> {
    const user = await getAuthUser();
    const { error } = await supabase
      .from('metas_ahorro')
      .update({ monto_acumulado: Number(nuevoMonto) || 0 })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deleteMeta(id: string): Promise<void> {
    const user = await getAuthUser();
    const { error } = await supabase
      .from('metas_ahorro')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async addAporteMeta(data: { metaId: string; monto: number; cuenta_id?: string }): Promise<void> {
    const user = await getAuthUser();
    const monto = Number(data.monto);
    if (isNaN(monto) || monto <= 0) {
      throw new Error('El monto del aporte debe ser mayor a 0');
    }

    // 1. Obtener la meta actual
    const { data: meta, error: metaErr } = await supabase
      .from('metas_ahorro')
      .select('monto_acumulado')
      .eq('id', data.metaId)
      .eq('user_id', user.id)
      .single();

    if (metaErr || !meta) throw new Error('No se encontró la meta de ahorro');

    // 2. Sumar el aporte a la meta
    const nuevoAcumulado = Number(meta.monto_acumulado || 0) + monto;
    const { error: updateMetaErr } = await supabase
      .from('metas_ahorro')
      .update({ monto_acumulado: nuevoAcumulado })
      .eq('id', data.metaId)
      .eq('user_id', user.id);

    if (updateMetaErr) throw updateMetaErr;

    // 3. Si se seleccionó una cuenta de origen, debitarla
    if (data.cuenta_id) {
      const { data: cuenta, error: cuentaErr } = await supabase
        .from('cuentas')
        .select('saldo_actual')
        .eq('id', data.cuenta_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (cuentaErr) throw cuentaErr;

      if (cuenta) {
        const { error: updateCuentaErr } = await supabase
          .from('cuentas')
          .update({ saldo_actual: Number(cuenta.saldo_actual) - monto })
          .eq('id', data.cuenta_id)
          .eq('user_id', user.id);

        if (updateCuentaErr) throw updateCuentaErr;
      }
    }
  },
};
