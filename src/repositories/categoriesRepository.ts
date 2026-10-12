import { supabase, getAuthUser } from './baseRepository';
import type { CategoriaGasto } from '../types/finance';
import type { Database } from '../types/database.types';

type CategoriaUpdate = Database['public']['Tables']['categorias']['Update'];

export const categoriesRepository = {
  async getCategoriasByPresupuesto(presupuestoId: string): Promise<CategoriaGasto[]> {
    const user = await getAuthUser();
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .eq('user_id', user.id)
      .order('nombre');

    if (error) throw error;
    return (data || []).map((cat) => ({
      ...cat,
      presupuestado: Number(cat.presupuestado) || 0,
      es_fijo: Boolean(cat.es_fijo ?? cat.descripcion?.includes('[FIJO]')),
    }));
  },

  async addCategoria(data: {
    presupuesto_id: string;
    nombre: string;
    icono: string;
    presupuestado: number;
    descripcion?: string | null;
    es_fijo?: boolean;
  }): Promise<CategoriaGasto> {
    const user = await getAuthUser();
    let desc = data.descripcion || '';
    if (data.es_fijo && !desc.includes('[FIJO]')) {
      desc = `[FIJO] ${desc}`.trim();
    }

    const { data: created, error } = await supabase
      .from('categorias')
      .insert([
        {
          presupuesto_id: data.presupuesto_id,
          nombre: data.nombre.trim(),
          icono: data.icono || 'Tag',
          presupuestado: Number(data.presupuestado) || 0,
          descripcion: desc || null,
          es_fijo: Boolean(data.es_fijo),
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      ...created,
      presupuestado: Number(created.presupuestado) || 0,
      es_fijo: Boolean(created.es_fijo),
    };
  },

  async updateCategoria(
    id: string,
    data: {
      nombre?: string;
      icono?: string;
      presupuestado?: number;
      descripcion?: string;
      es_fijo?: boolean;
    }
  ): Promise<void> {
    const user = await getAuthUser();
    const updateObj: CategoriaUpdate = {};

    if (data.nombre !== undefined) updateObj.nombre = data.nombre.trim();
    if (data.icono !== undefined) updateObj.icono = data.icono;
    if (data.presupuestado !== undefined) updateObj.presupuestado = Number(data.presupuestado);
    if (data.es_fijo !== undefined) updateObj.es_fijo = data.es_fijo;

    if (data.descripcion !== undefined || data.es_fijo !== undefined) {
      let desc = data.descripcion || '';
      if (data.es_fijo && !desc.includes('[FIJO]')) {
        desc = `[FIJO] ${desc}`.trim();
      } else if (data.es_fijo === false) {
        desc = desc.replace(/\[FIJO\]\s*/g, '').trim();
      }
      updateObj.descripcion = desc || null;
    }

    const { error } = await supabase
      .from('categorias')
      .update(updateObj)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deleteCategoria(id: string): Promise<void> {
    const user = await getAuthUser();
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },
};
