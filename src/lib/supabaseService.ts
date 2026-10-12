import { accountsRepository } from '../repositories/accountsRepository';
import { categoriesRepository } from '../repositories/categoriesRepository';
import { incomeRepository } from '../repositories/incomeRepository';
import { transactionsRepository } from '../repositories/transactionsRepository';
import { transfersRepository } from '../repositories/transfersRepository';
import { goalsRepository } from '../repositories/goalsRepository';
import { budgetRepository } from '../repositories/budgetRepository';
import type {
  PresupuestoCompleto,
  TransaccionGasto,
  Ingreso,
  MetaAhorro,
  CategoriaGasto,
  Transferencia,
  Cuenta,
} from '../types/finance';

/**
 * Facade unificado del servicio de finanzas de Supabase.
 * Delega cada dominio a su respectivo repositorio tipado.
 */
export const supabaseService = {
  isCloudConnected(): boolean {
    return true;
  },

  // --- Presupuesto y Balance ---
  async getActivePresupuesto(mes = 9, anio = 2026): Promise<PresupuestoCompleto> {
    return budgetRepository.getActivePresupuesto(mes, anio);
  },

  // --- Transacciones ---
  async getTransactionsByMonth(mes: number, anio: number): Promise<TransaccionGasto[]> {
    return transactionsRepository.getTransactionsByMonth(mes, anio);
  },

  async addTransaccion(data: Partial<TransaccionGasto>): Promise<void> {
    return transactionsRepository.addTransaccion(data);
  },

  async updateTransaccion(id: string, data: Partial<TransaccionGasto>): Promise<void> {
    return transactionsRepository.updateTransaccion(id, data);
  },

  async deleteTransaccion(id: string): Promise<void> {
    return transactionsRepository.deleteTransaccion(id);
  },

  async payOffCreditCard(selectedTxIds: string[], cuentaOrigenId: string): Promise<void> {
    return transactionsRepository.payOffCreditCard(selectedTxIds, cuentaOrigenId);
  },

  // --- Ingresos ---
  async addIngreso(data: {
    presupuesto_id: string;
    cuenta_id?: string;
    fuente: string;
    monto_esperado: number;
    monto_recibido?: number;
    descripcion?: string | null;
  }): Promise<void> {
    return incomeRepository.addIngreso(data);
  },

  async updateIngreso(id: string, data: Partial<Ingreso>): Promise<void> {
    return incomeRepository.updateIngreso(id, data);
  },

  async deleteIngreso(id: string): Promise<void> {
    return incomeRepository.deleteIngreso(id);
  },

  // --- Categorías ---
  async addCategoria(data: {
    presupuesto_id: string;
    nombre: string;
    icono: string;
    presupuestado: number;
    descripcion?: string | null;
    es_fijo?: boolean;
  }): Promise<CategoriaGasto> {
    return categoriesRepository.addCategoria(data);
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
    return categoriesRepository.updateCategoria(id, data);
  },

  async deleteCategoria(id: string): Promise<void> {
    return categoriesRepository.deleteCategoria(id);
  },

  // --- Cuentas ---
  async addCuenta(data: {
    nombre: string;
    tipo: any;
    saldo_actual?: number;
    color_tag?: string;
    icono?: string;
  }): Promise<Cuenta> {
    return accountsRepository.addCuenta(data);
  },

  async updateCuenta(id: string, data: Partial<Cuenta>): Promise<void> {
    return accountsRepository.updateCuenta(id, data);
  },

  async deleteCuenta(id: string): Promise<void> {
    return accountsRepository.deleteCuenta(id);
  },

  // --- Metas de Ahorro ---
  async addMeta(data: {
    titulo: string;
    precio_objetivo: number;
    meta_mensual?: number;
    monto_acumulado?: number;
    fecha_limite?: string | null;
    color_tag?: string;
  }): Promise<MetaAhorro> {
    return goalsRepository.addMeta(data);
  },

  async updateMeta(id: string, data: Partial<MetaAhorro>): Promise<void> {
    return goalsRepository.updateMeta(id, data);
  },

  async updateMetaMonto(metaId: string, nuevoMonto: number): Promise<void> {
    return goalsRepository.updateMetaMonto(metaId, nuevoMonto);
  },

  async deleteMeta(metaId: string): Promise<void> {
    return goalsRepository.deleteMeta(metaId);
  },

  async addAporteMeta(data: { metaId: string; monto: number; cuenta_id?: string }): Promise<void> {
    return goalsRepository.addAporteMeta(data);
  },

  // --- Transferencias ---
  async addTransferencia(data: {
    cuenta_origen_id: string;
    cuenta_destino_id: string;
    monto: number;
    fecha?: string;
    concepto?: string;
  }): Promise<void> {
    return transfersRepository.addTransferencia(data);
  },

  async deleteTransferencia(id: string): Promise<void> {
    return transfersRepository.deleteTransferencia(id);
  },

  // --- Utilidades y Respaldo ---
  async seedFromLocal(): Promise<void> {
    console.info('seedFromLocal se gestiona ahora mediante supabase/seed_test_data.sql');
  },

  async resetToDemo(): Promise<void> {
    await this.seedFromLocal();
  },

  exportToJson(): string {
    const data = budgetRepository.getLastLoadedBudget();
    if (!data) return JSON.stringify({}, null, 2);
    return JSON.stringify(data, null, 2);
  },

  async importFromJson(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;
      return Boolean(parsed.presupuesto || parsed.cuentas || parsed.categorias);
    } catch {
      return false;
    }
  },
};

// Re-exportar repositorios individuales para componentes que deseen consumirlos directamente
export {
  accountsRepository,
  categoriesRepository,
  incomeRepository,
  transactionsRepository,
  transfersRepository,
  goalsRepository,
  budgetRepository,
};
