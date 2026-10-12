-- =========================================================
-- IO GASTOS: SCRIPT DE DATOS DE PRUEBA (SEED)
-- Para inicializar datos limpios y realistas para pruebas
-- =========================================================

-- NOTA: Este script inserta datos de prueba asociados a un usuario.
-- Si lo ejecutas en el SQL Editor de Supabase, puedes reemplazar el email
-- por el correo con el que te registraste en la aplicación.

do $$
declare
  target_user_id uuid;
  v_presupuesto_id uuid;
  v_cta_monetaria uuid;
  v_cta_efectivo uuid;
  v_cta_tarjeta uuid;
  v_cta_ahorro uuid;
  v_cat_super uuid;
  v_cat_vivienda uuid;
  v_cat_servicios uuid;
  v_cat_transporte uuid;
  v_cat_ocio uuid;
begin
  -- 1. Obtener el ID del usuario (el primer usuario registrado o uno específico)
  select id into target_user_id from auth.users order by created_at desc limit 1;

  if target_user_id is null then
    raise notice 'No hay usuarios registrados en auth.users. Crea una cuenta primero.';
    return;
  end if;

  -- 2. Asegurar que el perfil tenga el nombre Pruebaio
  update public.profiles
  set full_name = 'Pruebaio'
  where id = target_user_id;

  -- 3. Crear Cuentas de Prueba
  insert into public.cuentas (user_id, nombre, tipo, saldo_actual, color_tag, icono)
  values (target_user_id, 'Cuenta Bancaria Principal', 'Monetario', 3500.00, 'blue', 'Landmark')
  returning id into v_cta_monetaria;

  insert into public.cuentas (user_id, nombre, tipo, saldo_actual, color_tag, icono)
  values (target_user_id, 'Efectivo en Billetera', 'Efectivo', 280.00, 'amber', 'Wallet')
  returning id into v_cta_efectivo;

  insert into public.cuentas (user_id, nombre, tipo, saldo_actual, color_tag, icono)
  values (target_user_id, 'Tarjeta de Crédito Oro', 'Tarjeta_Credito', 0.00, 'rose', 'CreditCard')
  returning id into v_cta_tarjeta;

  insert into public.cuentas (user_id, nombre, tipo, saldo_actual, color_tag, icono)
  values (target_user_id, 'Fondo de Emergencia', 'Ahorro', 1500.00, 'emerald', 'PiggyBank')
  returning id into v_cta_ahorro;

  -- 3. Crear Presupuesto de Prueba (Septiembre 2026)
  insert into public.presupuestos (user_id, mes, anio, nombre, cerrado)
  values (target_user_id, 9, 2026, 'Septiembre 2026', false)
  returning id into v_presupuesto_id;

  -- 4. Ingreso de Prueba
  insert into public.ingresos (presupuesto_id, user_id, cuenta_id, fuente, descripcion, monto_esperado, monto_recibido)
  values (v_presupuesto_id, target_user_id, v_cta_monetaria, 'Salario Mensual', 'Depósito quincenal consolidado', 5000.00, 5000.00);

  -- 5. Categorías de Gasto
  insert into public.categorias (presupuesto_id, user_id, nombre, icono, descripcion, presupuestado, es_fijo)
  values (v_presupuesto_id, target_user_id, 'Alimentación & Supermercado', 'ShoppingCart', 'Víveres y despensa del hogar', 1400.00, false)
  returning id into v_cat_super;

  insert into public.categorias (presupuesto_id, user_id, nombre, icono, descripcion, presupuestado, es_fijo)
  values (v_presupuesto_id, target_user_id, 'Alquiler / Vivienda', 'Home', 'Gasto de renta mensual', 1600.00, true)
  returning id into v_cat_vivienda;

  insert into public.categorias (presupuesto_id, user_id, nombre, icono, descripcion, presupuestado, es_fijo)
  values (v_presupuesto_id, target_user_id, 'Servicios (Luz, Agua, Internet)', 'Zap', 'Pago de facturas del hogar', 450.00, true)
  returning id into v_cat_servicios;

  insert into public.categorias (presupuesto_id, user_id, nombre, icono, descripcion, presupuestado, es_fijo)
  values (v_presupuesto_id, target_user_id, 'Combustible & Transporte', 'Car', 'Gasolina y traslados', 600.00, false)
  returning id into v_cat_transporte;

  insert into public.categorias (presupuesto_id, user_id, nombre, icono, descripcion, presupuestado, es_fijo)
  values (v_presupuesto_id, target_user_id, 'Restaurantes & Ocio', 'Coffee', 'Salidas y cafés', 400.00, false)
  returning id into v_cat_ocio;

  -- 6. Transacciones Reales de Prueba
  insert into public.transacciones (categoria_id, user_id, cuenta_id, concepto, monto, fecha, metodo_pago)
  values (v_cat_super, target_user_id, v_cta_monetaria, 'Compra Supermercado Quincena', 430.25, '2026-09-05', 'Transferencia');

  insert into public.transacciones (categoria_id, user_id, cuenta_id, concepto, monto, fecha, metodo_pago)
  values (v_cat_servicios, target_user_id, v_cta_monetaria, 'Factura de Internet y Fibra', 249.00, '2026-09-08', 'Transferencia');

  insert into public.transacciones (categoria_id, user_id, cuenta_id, concepto, monto, fecha, metodo_pago)
  values (v_cat_transporte, target_user_id, v_cta_efectivo, 'Gasolina Tanque Completo', 220.00, '2026-09-10', 'Efectivo');

  insert into public.transacciones (categoria_id, user_id, cuenta_id, concepto, monto, fecha, metodo_pago)
  values (v_cat_ocio, target_user_id, v_cta_tarjeta, 'Cena en Restaurante', 145.50, '2026-09-12', 'Tarjeta');

  -- 7. Meta de Ahorro de Prueba
  insert into public.metas_ahorro (user_id, titulo, precio_objetivo, meta_mensual, monto_acumulado, fecha_limite, color_tag)
  values (target_user_id, 'Viaje de Fin de Año', 4000.00, 500.00, 1500.00, '2026-12-31', 'emerald');

  -- 8. Transferencia de Prueba
  insert into public.transferencias (user_id, cuenta_origen_id, cuenta_destino_id, monto, fecha, concepto)
  values (target_user_id, v_cta_monetaria, v_cta_ahorro, 300.00, '2026-09-02', 'Aporte inicial al fondo de ahorro');

  raise notice '¡Datos de prueba insertados exitosamente para el usuario %!', target_user_id;
end $$;
