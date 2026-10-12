export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CuentaTipo = 'Efectivo' | 'Monetario' | 'Ahorro' | 'Tarjeta_Credito' | 'Mesada';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      presupuestos: {
        Row: {
          id: string;
          user_id: string;
          mes: number;
          anio: number;
          nombre: string;
          cerrado: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          mes: number;
          anio: number;
          nombre: string;
          cerrado?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          mes?: number;
          anio?: number;
          nombre?: string;
          cerrado?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      cuentas: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          tipo: CuentaTipo;
          saldo_actual: number;
          color_tag: string;
          icono: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nombre: string;
          tipo: CuentaTipo;
          saldo_actual?: number;
          color_tag?: string;
          icono?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          tipo?: CuentaTipo;
          saldo_actual?: number;
          color_tag?: string;
          icono?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      ingresos: {
        Row: {
          id: string;
          presupuesto_id: string;
          user_id: string;
          cuenta_id: string | null;
          fuente: string;
          descripcion: string | null;
          monto_esperado: number;
          monto_recibido: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          presupuesto_id: string;
          user_id?: string;
          cuenta_id?: string | null;
          fuente: string;
          descripcion?: string | null;
          monto_esperado?: number;
          monto_recibido?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          presupuesto_id?: string;
          user_id?: string;
          cuenta_id?: string | null;
          fuente?: string;
          descripcion?: string | null;
          monto_esperado?: number;
          monto_recibido?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ingresos_presupuesto_id_fkey";
            columns: ["presupuesto_id"];
            isOneToOne: false;
            referencedRelation: "presupuestos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingresos_cuenta_id_fkey";
            columns: ["cuenta_id"];
            isOneToOne: false;
            referencedRelation: "cuentas";
            referencedColumns: ["id"];
          }
        ];
      };
      categorias: {
        Row: {
          id: string;
          presupuesto_id: string;
          user_id: string;
          nombre: string;
          icono: string;
          descripcion: string | null;
          presupuestado: number;
          es_fijo: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          presupuesto_id: string;
          user_id?: string;
          nombre: string;
          icono?: string;
          descripcion?: string | null;
          presupuestado?: number;
          es_fijo?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          presupuesto_id?: string;
          user_id?: string;
          nombre?: string;
          icono?: string;
          descripcion?: string | null;
          presupuestado?: number;
          es_fijo?: boolean;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categorias_presupuesto_id_fkey";
            columns: ["presupuesto_id"];
            isOneToOne: false;
            referencedRelation: "presupuestos";
            referencedColumns: ["id"];
          }
        ];
      };
      transacciones: {
        Row: {
          id: string;
          categoria_id: string;
          user_id: string;
          cuenta_id: string | null;
          concepto: string;
          monto: number;
          fecha: string;
          metodo_pago: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          categoria_id: string;
          user_id?: string;
          cuenta_id?: string | null;
          concepto: string;
          monto: number;
          fecha?: string;
          metodo_pago?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          categoria_id?: string;
          user_id?: string;
          cuenta_id?: string | null;
          concepto?: string;
          monto?: number;
          fecha?: string;
          metodo_pago?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transacciones_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transacciones_cuenta_id_fkey";
            columns: ["cuenta_id"];
            isOneToOne: false;
            referencedRelation: "cuentas";
            referencedColumns: ["id"];
          }
        ];
      };
      transferencias: {
        Row: {
          id: string;
          user_id: string;
          cuenta_origen_id: string;
          cuenta_destino_id: string;
          monto: number;
          fecha: string;
          concepto: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cuenta_origen_id: string;
          cuenta_destino_id: string;
          monto: number;
          fecha?: string;
          concepto?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          cuenta_origen_id?: string;
          cuenta_destino_id?: string;
          monto?: number;
          fecha?: string;
          concepto?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transferencias_cuenta_origen_id_fkey";
            columns: ["cuenta_origen_id"];
            isOneToOne: false;
            referencedRelation: "cuentas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transferencias_cuenta_destino_id_fkey";
            columns: ["cuenta_destino_id"];
            isOneToOne: false;
            referencedRelation: "cuentas";
            referencedColumns: ["id"];
          }
        ];
      };
      metas_ahorro: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          precio_objetivo: number;
          meta_mensual: number;
          monto_acumulado: number;
          fecha_limite: string | null;
          color_tag: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          titulo: string;
          precio_objetivo: number;
          meta_mensual?: number;
          monto_acumulado?: number;
          fecha_limite?: string | null;
          color_tag?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string;
          precio_objetivo?: number;
          meta_mensual?: number;
          monto_acumulado?: number;
          fecha_limite?: string | null;
          color_tag?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
