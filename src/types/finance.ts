export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia'; // Legacy, will keep to avoid breaking everything immediately if used elsewhere, but ideally replace with cuenta_id
export type CuentaTipo = 'Efectivo' | 'Monetario' | 'Ahorro' | 'Tarjeta_Credito' | 'Mesada';

export interface Cuenta {
  id: string;
  user_id: string;
  nombre: string;
  tipo: CuentaTipo;
  saldo_actual: number;
  color_tag: string;
  icono: string;
  created_at?: string | null;
}

export interface Transferencia {
  id: string;
  user_id: string;
  cuenta_origen_id: string;
  cuenta_destino_id: string;
  monto: number;
  fecha: string;
  concepto: string;
  created_at?: string | null;
}

export interface Presupuesto {
  id: string;
  user_id: string;
  mes: number; // 1 - 12
  anio: number;
  nombre: string;
  cerrado: boolean;
  created_at?: string | null;
}

export interface Ingreso {
  id: string;
  presupuesto_id: string;
  user_id: string;
  cuenta_id: string; // Referencia a dónde entró el dinero
  fuente: string;
  descripcion?: string | null;
  monto_esperado: number;
  monto_recibido: number;
  created_at?: string | null;
}

export interface CategoriaGasto {
  id: string;
  presupuesto_id: string;
  user_id: string;
  nombre: string;
  icono: string;
  presupuestado: number;
  descripcion?: string | null;
  es_fijo?: boolean;
  created_at?: string | null;
}

export interface TransaccionGasto {
  id: string;
  categoria_id: string;
  user_id: string;
  cuenta_id: string; // Referencia de dónde salió el dinero
  concepto: string;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago; // Legacy
  categoria_nombre?: string;
  categoria_icono?: string;
  created_at?: string | null;
}

export interface MetaAhorro {
  id: string;
  user_id: string;
  titulo: string;
  precio_objetivo: number;
  meta_mensual: number;
  monto_acumulado: number;
  fecha_limite?: string | null;
  color_tag: 'emerald' | 'violet' | 'amber' | 'cyan' | 'rose' | string;
  created_at?: string | null;
}

export interface CategoriaConStats extends CategoriaGasto {
  gasto_real: number;
  desviacion: number;
  porcentaje_consumido: number;
  estado: 'safe' | 'warning' | 'danger';
  transacciones: TransaccionGasto[];
}

export interface MetaConStats extends MetaAhorro {
  porcentaje_progreso: number;
  monto_restante: number;
  meses_estimados: number | null;
  completada: boolean;
}

export interface MetricasBalance {
  total_ingresos_esperados: number;
  total_ingresos_recibidos: number;
  total_presupuestado: number;
  total_gastos_reales: number;
  balance_disponible: number; // Ingresos Recibidos (2,157.89) - Gastos Reales (1,645.47) = +512.42
  is_deficit: boolean; // false
  porcentaje_gasto_vs_ingreso: number; // (1,645.47 / 2,157.89) * 100 = 76.25%
}

export interface AhorroMesadaFuente {
  id: string;
  nombre: string;
  meta_mensual: number;
  acumulado: number;
}

export interface AhorroMesadaInfo {
  total_disponible: number; // Q 1,209.62
  fuentes: AhorroMesadaFuente[];
}

export interface TarjetaCreditoInfo {
  dia_limite_pago: number; // 12
  dias_para_limite: number;
  total_cargado: number; // Q 1,646.00
  total_abonado: number;
  saldo_pendiente: number;
  proxima_fecha_limite: string;
  transacciones: TransaccionGasto[];
}

export interface PresupuestoCompleto {
  presupuesto: Presupuesto;
  cuentas: Cuenta[];
  ingresos: Ingreso[];
  categorias: CategoriaConStats[];
  transacciones: TransaccionGasto[];
  metas: MetaConStats[];
  metricas: MetricasBalance;
  ahorroMesada: AhorroMesadaInfo;
  tarjetaCredito: TarjetaCreditoInfo;
  dineroCustodia?: never;
  transferencias: Transferencia[];
}

export type TransferenciaItem = Transferencia;
export type TipoMovimiento = 'gasto' | 'ingreso' | 'transferencia';

export interface MovimientoHistorial {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  descripcion?: string | null;
  monto: number;
  fecha: string;
  created_at?: string | null;
  cuenta_id?: string;
  cuenta_nombre?: string;
  cuenta_origen_nombre?: string;
  cuenta_destino_nombre?: string;
  categoria_id?: string;
  categoria_nombre?: string;
  categoria_icono?: string;
  metodo_pago?: string;
  originalData?: any;
}

export type ActiveTab = 'overview' | 'budget' | 'accounts' | 'goals' | 'transactions';

export type QuickEntryType = 'gasto' | 'ingreso' | 'ahorro' | 'transferencia';

export type AppTheme = 'noir' | 'velvet';

export type VisualTheme = 'cyber' | 'sheltheme';

export type OrigenAporte = 'sueldo' | 'mesada';
