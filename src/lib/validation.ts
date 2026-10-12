import { z } from 'zod';

// -------------------------------------------------------------
// ESQUEMAS ZOD PARA VALIDACIÓN ESTRICTA (COMPATIBLE CON ZOD 3 Y 4)
// -------------------------------------------------------------

export const transaccionSchema = z.object({
  monto: z.coerce
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(999999999, 'El monto es demasiado elevado'),
  concepto: z
    .string()
    .trim()
    .min(2, 'El concepto debe tener al menos 2 caracteres')
    .max(120, 'El concepto no puede superar 120 caracteres'),
  categoria_id: z.string().min(1, 'Selecciona una categoría válida'),
  metodo_pago: z.string().refine(
    (val) => ['Efectivo', 'Tarjeta', 'Transferencia'].includes(val),
    { message: 'Método de pago inválido' }
  ),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)'),
});

export const ingresoSchema = z.object({
  fuente: z
    .string()
    .trim()
    .min(2, 'La fuente debe tener al menos 2 caracteres')
    .max(100, 'La fuente no puede superar 100 caracteres'),
  descripcion: z.string().trim().max(250, 'La descripción es muy larga').optional().nullable(),
  monto_esperado: z.coerce.number().min(0, 'No puede ser negativo'),
  monto_recibido: z.coerce.number().min(0, 'No puede ser negativo'),
});

export const aporteMetaSchema = z.object({
  meta_id: z.string().min(1, 'Selecciona una meta de ahorro'),
  monto: z.coerce.number().positive('El monto a aportar debe ser mayor a 0'),
});

export const metaAhorroSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(2, 'El nombre de la meta debe tener al menos 2 caracteres')
    .max(80, 'El título es muy largo'),
  precio_objetivo: z.coerce.number().positive('El precio objetivo debe ser mayor a 0'),
  meta_mensual: z.coerce.number().min(0, 'La meta mensual no puede ser negativa').default(0),
  monto_acumulado: z.coerce.number().min(0, 'El monto acumulado no puede ser negativo').default(0),
  color_tag: z.string().default('emerald'),
  fecha_limite: z.string().optional().nullable(),
});

export const categoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre de la categoría es muy corto')
    .max(60, 'El nombre es muy largo'),
  icono: z.string().default('Tag'),
  presupuestado: z.coerce.number().min(0, 'El presupuesto no puede ser negativo'),
  descripcion: z.string().trim().max(150, 'La descripción es muy larga').optional().nullable(),
});

/**
 * Helper para obtener el primer mensaje de error de un ZodError
 * compatible tanto con Zod 3 (error.errors) como Zod 4 (error.issues)
 */
export function getZodErrorMessage(error: any): string {
  if (!error) return 'Datos inválidos';
  if (Array.isArray(error.issues) && error.issues.length > 0) {
    return error.issues[0].message || 'Error de validación';
  }
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0].message || 'Error de validación';
  }
  return error.message || 'Datos inválidos';
}

// -------------------------------------------------------------
// FORMATEO FINANCIERO Y FECHAS (QUETZALES Q & TABULAR NUMS)
// -------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('es-GT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un número en formato Quetzales (Q).
 * Ejemplo: formatQ(1250) => "Q 1,250.00"
 * Ejemplo: formatQ(-300) => "-Q 300.00"
 */
export function formatQ(monto: number | null | undefined): string {
  const val = Number(monto) || 0;
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = currencyFormatter.format(absVal);
  return isNegative ? `-Q ${formatted}` : `Q ${formatted}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getNombreMes(mesNumero: number): string {
  if (mesNumero < 1 || mesNumero > 12) return '';
  return MESES_ES[mesNumero - 1];
}

export function formatFechaCorta(fechaIso: string): string {
  try {
    if (!fechaIso) return '';
    const [y, m, d] = fechaIso.split('-').map(Number);
    const hoy = new Date();
    const hoyY = hoy.getFullYear();
    const hoyM = hoy.getMonth() + 1;
    const hoyD = hoy.getDate();

    if (y === hoyY && m === hoyM && d === hoyD) {
      return 'Hoy';
    }

    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (y === ayer.getFullYear() && m === (ayer.getMonth() + 1) && d === ayer.getDate()) {
      return 'Ayer';
    }

    const mesAbbr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][m - 1] || '';
    return `${d} ${mesAbbr}`;
  } catch {
    return fechaIso;
  }
}

export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatAuthError(message: string): string {
  if (!message) return 'Ocurrió un error inesperado al autenticar.';
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Correo electrónico o contraseña incorrectos.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'Ya existe una cuenta registrada con este correo electrónico.';
  }
  if (lower.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Por favor confirma tu correo electrónico antes de ingresar.';
  }
  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return 'Error de conexión. Verifica tu acceso a internet.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Demasiados intentos. Por favor espera unos minutos antes de volver a intentar.';
  }
  return message;
}
