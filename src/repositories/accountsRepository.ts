import { supabase, getAuthUser } from './baseRepository';
import type { Cuenta, CuentaTipo } from '../types/finance';
import type { Database } from '../types/database.types';

type CuentaUpdate = Database['public']['Tables']['cuentas']['Update'];

export const accountsRepository = {
  async getCuentas(): Promise<Cuenta[]> {
    const user = await getAuthUser();
    const { data, error } = await supabase
      .from('cuentas')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre');

    if (error) throw error;
    return (data || []).map((c) => ({
      ...c,
      saldo_actual: Number(c.saldo_actual) || 0,
    }));
  },

  async addCuenta(data: {
    nombre: string;
    tipo: CuentaTipo;
    saldo_actual?: number;
    color_tag?: string;
    icono?: string;
  }): Promise<Cuenta> {
    const user = await getAuthUser();
    const { data: created, error } = await supabase
      .from('cuentas')
      .insert([
        {
          user_id: user.id,
          nombre: data.nombre.trim(),
          tipo: data.tipo,
          saldo_actual: Number(data.saldo_actual) || 0,
          color_tag: data.color_tag || 'emerald',
          icono: data.icono || 'Wallet',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      ...created,
      saldo_actual: Number(created.saldo_actual) || 0,
    };
  },

  async updateCuenta(id: string, data: Partial<Cuenta>): Promise<void> {
    const user = await getAuthUser();
    const updateObj: CuentaUpdate = {};

    if (data.nombre !== undefined) updateObj.nombre = data.nombre.trim();
    if (data.tipo !== undefined) updateObj.tipo = data.tipo;
    if (data.saldo_actual !== undefined) updateObj.saldo_actual = Number(data.saldo_actual);
    if (data.color_tag !== undefined) updateObj.color_tag = data.color_tag;
    if (data.icono !== undefined) updateObj.icono = data.icono;

    const { error } = await supabase
      .from('cuentas')
      .update(updateObj)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deleteCuenta(id: string): Promise<void> {
    const user = await getAuthUser();
    const { error } = await supabase
      .from('cuentas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },
};
