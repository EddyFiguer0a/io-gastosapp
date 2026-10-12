# 💳 IO Gastos — Sistema de Gestión Financiera Personal

Aplicación web moderna y responsiva para el control de finanzas personales, presupuestos mensuales, cuentas bancarias, tarjetas de crédito y metas de ahorro, respaldada por **Supabase** y construida con **React + TypeScript + Tailwind CSS**.

---

## 📚 Documentación

- 📖 [Manual de Usuario](./MANUAL_DE_USUARIO.md) — Guía rápida y práctica para utilizar la aplicación día a día.
- 🛠️ [Resumen de Tecnologías](./RESUMEN_TECNOLOGIAS.md) — Explicación sencilla y amigable de las herramientas utilizadas.

---

## 🚀 Puesta en Marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En el **SQL Editor** de Supabase, ejecuta el script de migración:
   - [supabase/schema.sql](./supabase/schema.sql)
3. *(Opcional)* Si deseas cargar datos de prueba iniciales para tu usuario:
   - [supabase/seed_test_data.sql](./supabase/seed_test_data.sql)
4. Copia las credenciales de tu proyecto desde **Project Settings → API** y crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 3. Iniciar en Desarrollo

```bash
npm run dev
```

### 4. Compilar para Producción

```bash
npm run build
```
