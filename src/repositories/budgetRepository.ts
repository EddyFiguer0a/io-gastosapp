import { supabase, getAuthUser } from './baseRepository';
import { accountsRepository } from './accountsRepository';
import { incomeRepository } from './incomeRepository';
import { categoriesRepository } from './categoriesRepository';
import { goalsRepository } from './goalsRepository';
import { transfersRepository } from './transfersRepository';
import type {
  Presupuesto,
  PresupuestoCompleto,
  TransaccionGasto,
  CategoriaConStats,
  MetaConStats,
} from '../types/finance';
import { getNombreMes } from '../lib/validation';

let _lastLoadedBudget: PresupuestoCompleto | null = null;

export const budgetRepository = {
  getLastLoadedBudget(): PresupuestoCompleto | null {
    return _lastLoadedBudget;
  },

  setLastLoadedBudget(data: PresupuestoCompleto | null): void {
    _lastLoadedBudget = data;
  },

  async getOrCreatePresupuesto(mes = 9, anio = 2026): Promise<Presupuesto> {
    const user = await getAuthUser();

    const { data: existingArr, error: checkError } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('user_id', user.id)
      .eq('mes', mes)
      .eq('anio', anio)
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) throw checkError;

    if (existingArr && existingArr.length > 0) {
      return existingArr[0];
    }

    const nombrePresupuesto = `${getNombreMes(mes) || 'Mes'} ${anio}`;
    const { data: created, error: createError } = await supabase
      .from('presupuestos')
      .insert([{ user_id: user.id, mes, anio, nombre: nombrePresupuesto }])
      .select()
      .single();

    if (createError) throw createError;
    return created;
  },

  async getActivePresupuesto(mes = 9, anio = 2026): Promise<PresupuestoCompleto> {
    const user = await getAuthUser();
    const presupuesto = await this.getOrCreatePresupuesto(mes, anio);
    const pId = presupuesto.id;

    // Ejecutar consultas en paralelo para máxima velocidad
    const [
      safeCuentas,
      safeIngresos,
      safeCategorias,
      allUserTxsRes,
      safeMetas,
      safeTransferencias,
    ] = await Promise.all([
      accountsRepository.getCuentas(),
      incomeRepository.getIngresosByPresupuesto(pId),
      categoriesRepository.getCategoriasByPresupuesto(pId),
      supabase
        .from('transacciones')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false }),
      goalsRepository.getMetas(),
      transfersRepository.getTransferencias(),
    ]);

    if (allUserTxsRes.error) throw allUserTxsRes.error;

    const allUserTxs = allUserTxsRes.data || [];
    const catMap = new Map(safeCategorias.map((c) => [c.id, c]));
    const catIdsSet = new Set(safeCategorias.map((c) => c.id));

    // Filtrar transacciones pertenecientes a este presupuesto
    const budgetTxs = allUserTxs.filter((t) => catIdsSet.has(t.categoria_id));
    const enrichedBudgetTxs: TransaccionGasto[] = budgetTxs.map((t) => {
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

    // Totales de ingresos y presupuestos
    const total_ingresos_esperados = safeIngresos.reduce(
      (acc, i) => acc + Number(i.monto_esperado || 0),
      0
    );
    const total_ingresos_recibidos = safeIngresos.reduce(
      (acc, i) => acc + Number(i.monto_recibido || 0),
      0
    );
    const total_presupuestado = safeCategorias.reduce(
      (acc, c) => acc + Number(c.presupuestado || 0),
      0
    );

    // Cuentas y Tarjeta de Crédito del periodo
    const cardAccounts = new Set(
      safeCuentas.filter((c) => c.tipo === 'Tarjeta_Credito').map((c) => c.id)
    );
    const tarjetaMovimientos = enrichedBudgetTxs.filter(
      (t) =>
        (cardAccounts.has(t.cuenta_id) || t.metodo_pago === 'Tarjeta') &&
        !t.concepto.includes('[PAGADO]')
    );
    const total_cargado_tarjeta = tarjetaMovimientos.reduce(
      (acc, t) => acc + Number(t.monto || 0),
      0
    );

    let total_gastos_reales = 0;
    const categoriasConStats: CategoriaConStats[] = safeCategorias.map((cat) => {
      // Excluir gastos cargados a tarjeta no pagados del gasto corriente
      const txsCat = enrichedBudgetTxs.filter((t) => {
        const isCardTx = cardAccounts.has(t.cuenta_id) || t.metodo_pago === 'Tarjeta';
        return t.categoria_id === cat.id && !isCardTx;
      });
      const gasto_real = txsCat.reduce((sum, t) => sum + Number(t.monto || 0), 0);
      total_gastos_reales += gasto_real;
      const desviacion = Number(cat.presupuestado) - gasto_real;
      const porcentaje_consumido =
        cat.presupuestado > 0 ? (gasto_real / cat.presupuestado) * 100 : 0;
      let estado: 'safe' | 'warning' | 'danger' = 'safe';
      if (cat.presupuestado > 0 && gasto_real > cat.presupuestado) estado = 'danger';
      else if (cat.presupuestado > 0 && porcentaje_consumido >= 75) estado = 'warning';

      return {
        ...cat,
        gasto_real,
        desviacion,
        porcentaje_consumido,
        estado,
        transacciones: txsCat,
      };
    });

    // Saldo disponible (dinero libre)
    const balance_disponible = total_ingresos_recibidos - total_gastos_reales;

    // Metas de Ahorro y Fondos
    const metasReales = safeMetas.filter((m) => Number(m.precio_objetivo) > 0);
    const ahorroMesadaFuentes = safeMetas.filter((m) => Number(m.precio_objetivo) === 0);

    const metasConStats: MetaConStats[] = metasReales.map((meta) => {
      const obj = Number(meta.precio_objetivo);
      const acu = Number(meta.monto_acumulado);
      const cuota = Number(meta.meta_mensual);
      const restante = Math.max(0, obj - acu);
      return {
        ...meta,
        porcentaje_progreso: obj > 0 ? Math.min(100, (acu / obj) * 100) : 0,
        monto_restante: restante,
        meses_estimados: cuota > 0 && restante > 0 ? Math.ceil(restante / cuota) : 0,
        completada: obj > 0 && acu >= obj,
      };
    });

    const total_ahorro_mesada = ahorroMesadaFuentes.reduce(
      (acc, m) => acc + Number(m.monto_acumulado || 0),
      0
    );
    const ahorroMesada = {
      total_disponible: total_ahorro_mesada,
      fuentes: ahorroMesadaFuentes.map((m) => ({
        id: m.id,
        nombre: m.titulo,
        meta_mensual: Number(m.meta_mensual) || 0,
        acumulado: Number(m.monto_acumulado) || 0,
      })),
    };

    const hoy = new Date();
    const diaHoy = hoy.getDate();
    const mesHoy = hoy.getMonth() + 1;
    const anioHoy = hoy.getFullYear();

    let proximoLimiteDate = new Date(anioHoy, mesHoy - 1, 12);
    if (diaHoy > 12) {
      proximoLimiteDate = new Date(anioHoy, mesHoy, 12);
    }
    const diffTime = proximoLimiteDate.getTime() - hoy.getTime();
    const dias_para_limite = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const tcAccount = safeCuentas.find((c) => c.tipo === 'Tarjeta_Credito');
    const saldoPendienteTc =
      tcAccount !== undefined
        ? Math.abs(Math.min(0, Number(tcAccount.saldo_actual)))
        : total_cargado_tarjeta;

    const tarjetaCredito = {
      dia_limite_pago: 12,
      dias_para_limite,
      total_cargado: total_cargado_tarjeta,
      total_abonado: Math.max(0, total_cargado_tarjeta - saldoPendienteTc),
      saldo_pendiente: saldoPendienteTc,
      proxima_fecha_limite: proximoLimiteDate.toISOString(),
      transacciones: tarjetaMovimientos,
    };

    const resultado: PresupuestoCompleto = {
      presupuesto,
      cuentas: safeCuentas,
      ingresos: safeIngresos,
      categorias: categoriasConStats,
      transacciones: enrichedBudgetTxs,
      metas: metasConStats,
      metricas: {
        total_ingresos_esperados,
        total_ingresos_recibidos,
        total_presupuestado,
        total_gastos_reales,
        balance_disponible,
        is_deficit: balance_disponible < 0,
        porcentaje_gasto_vs_ingreso:
          total_ingresos_recibidos > 0
            ? (total_gastos_reales / total_ingresos_recibidos) * 100
            : 0,
      },
      ahorroMesada,
      tarjetaCredito,
      transferencias: safeTransferencias,
    };

    this.setLastLoadedBudget(resultado);
    return resultado;
  },
};
