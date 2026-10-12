import React, { useState, useMemo } from 'react';
import { X, Search, Check, Sparkles } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

export interface GlassIconOption {
  key: string;
  label: string;
  subtitle: string;
  category: 'Servicios' | 'Compras' | 'Efectivo' | 'Tarjetas' | 'Bancos' | 'Digital';
  keywords: string[];
}

export const GLASS_ICON_OPTIONS: GlassIconOption[] = [
  // SERVICIOS Y FACTURAS
  {
    key: 'bill-receipt',
    label: 'Factura / Servicios',
    subtitle: 'Luz, Agua, Internet, Celular, Cuotas',
    category: 'Servicios',
    keywords: ['factura', 'recibo', 'luz', 'agua', 'internet', 'celular', 'servicio', 'tigo', 'claro', 'eegsa', 'electricidad'],
  },
  {
    key: 'bank-statement',
    label: 'Estado de Cuenta / Renta',
    subtitle: 'Alquiler, Casa, Pagos formales, Débitos',
    category: 'Servicios',
    keywords: ['estado', 'cuenta', 'alquiler', 'renta', 'casa', 'apartamento', 'prestamo', 'debito'],
  },

  // SUPERMERCADO Y TIENDAS
  {
    key: 'pos-machine',
    label: 'POS / Tienda y Súper',
    subtitle: 'Supermercado, Gasolina, Farmacia, Comida',
    category: 'Compras',
    keywords: ['pos', 'super', 'supermercado', 'tienda', 'gasolina', 'farmacia', 'restaurante', 'almuerzo', 'despensa', 'comida', 'combustible'],
  },

  // EFECTIVO Y MONEDAS
  {
    key: 'cash',
    label: 'Billetes / Efectivo',
    subtitle: 'Gastos de mano, Parqueos, Propinas',
    category: 'Efectivo',
    keywords: ['efectivo', 'billetes', 'plata', 'parqueo', 'propina', 'mercado', 'caja chica'],
  },
  {
    key: 'coins',
    label: 'Monedas / Cambio',
    subtitle: 'Ahorro menudo, Vuelto, Monedas sueltas',
    category: 'Efectivo',
    keywords: ['monedas', 'cambio', 'vuelto', 'alcancia', 'suelto', 'ahorro'],
  },

  // TARJETAS Y MÓVIL
  {
    key: 'credit-card',
    label: 'Tarjeta de Crédito',
    subtitle: 'Consumos de tarjeta, Cuotas visacuotas',
    category: 'Tarjetas',
    keywords: ['tarjeta', 'credito', 'cuotas', 'visacuotas', 'pagos', 'deuda'],
  },
  {
    key: 'credit-card-visa',
    label: 'Tarjeta Visa',
    subtitle: 'Tarjeta Visa Débito o Crédito',
    category: 'Tarjetas',
    keywords: ['visa', 'tarjeta', 'debito', 'credito'],
  },
  {
    key: 'credit-card-master',
    label: 'Tarjeta MasterCard',
    subtitle: 'Tarjeta MasterCard Débito o Crédito',
    category: 'Tarjetas',
    keywords: ['mastercard', 'master', 'tarjeta'],
  },
  {
    key: 'card-mobile',
    label: 'Pago Móvil / Contactless',
    subtitle: 'Apple Pay, Celular, Billetera digital',
    category: 'Tarjetas',
    keywords: ['movil', 'celular', 'contactless', 'apple pay', 'wallet', 'nfc', 'gym'],
  },
  {
    key: 'credit-card-back',
    label: 'Seguridad / Reverso',
    subtitle: 'Membresías, Seguros, Garantías',
    category: 'Tarjetas',
    keywords: ['reverso', 'seguro', 'membresia', 'seguridad', 'cvv'],
  },

  // BANCA Y CAJEROS
  {
    key: 'bank',
    label: 'Banco / Cuentas',
    subtitle: 'Monetaria, Ahorro, Transferencias',
    category: 'Bancos',
    keywords: ['banco', 'bancario', 'monetaria', 'transferencia', 'bi', 'bam', 'gyt', 'banrural', 'cuenta'],
  },
  {
    key: 'atm',
    label: 'Cajero Automático / Retiro',
    subtitle: 'Retiros 5B, Retiros de cajero, ATM',
    category: 'Bancos',
    keywords: ['atm', 'cajero', 'retiro', '5b', 'bi en linea'],
  },

  // BILLETERA Y MOVIMIENTOS
  {
    key: 'wallet',
    label: 'Billetera / Presupuesto',
    subtitle: 'Gastos personales, Mesada, Billetera libre',
    category: 'Digital',
    keywords: ['billetera', 'cartera', 'mesada', 'presupuesto', 'personal', 'general', 'otros'],
  },
  {
    key: 'transaction',
    label: 'Movimientos / Envíos',
    subtitle: 'Remesas, Envíos familiares, Pagos',
    category: 'Digital',
    keywords: ['transaccion', 'envio', 'remesa', 'transferencia', 'familiar', 'movimiento'],
  },

  // COMPRAS ONLINE Y DIGITALES
  {
    key: 'amazon',
    label: 'Compras Online / Paquetes',
    subtitle: 'Amazon, Shein, Tiendas web, Envíos',
    category: 'Digital',
    keywords: ['amazon', 'online', 'shein', 'paquete', 'courier', 'envio', 'compras web'],
  },
  {
    key: 'paypal',
    label: 'PayPal / Suscripciones',
    subtitle: 'Streaming, Netflix, Spotify, Software',
    category: 'Digital',
    keywords: ['paypal', 'streaming', 'netflix', 'spotify', 'disney', 'suscripcion', 'software'],
  },
];

const CATEGORIES = ['Todas', 'Servicios', 'Compras', 'Efectivo', 'Tarjetas', 'Bancos', 'Digital'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon: string;
  onSelectIcon: (iconKey: string) => void;
  title?: string;
}

export const IconPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedIcon,
  onSelectIcon,
  title = 'Seleccionar Ícono 3D',
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [previewIcon, setPreviewIcon] = useState(selectedIcon || 'bill-receipt');

  // Sync preview when opening
  React.useEffect(() => {
    if (isOpen) {
      setPreviewIcon(selectedIcon || 'bill-receipt');
    }
  }, [selectedIcon, isOpen]);

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GLASS_ICON_OPTIONS.filter((item) => {
      const matchesCategory = activeCategory === 'Todas' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [search, activeCategory]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectIcon(previewIcon);
    onClose();
  };

  const currentOption = GLASS_ICON_OPTIONS.find(
    (i) => i.key.toLowerCase() === previewIcon.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-[32px] sm:rounded-[32px] px-5 sm:px-6 pt-5 sm:pt-6 pb-safe shadow-2xl animate-sheet max-h-[90dvh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shadow-inner">
              <CategoryIcon name={previewIcon} size={26} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--accent-brand)]" />
                {title}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                Colección 3D Glass exclusiva para tus categorías
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center active-press transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mt-3 shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar ícono (ej. luz, súper, efectivo, gasolina, banco)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* CATEGORY PILLS */}
        <div className="flex gap-1.5 overflow-x-auto py-2.5 no-scrollbar shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap active-press transition-all ${
                  isActive
                    ? 'bg-[var(--accent-brand)] text-[var(--fab-text)] shadow-md shadow-[var(--accent-brand)]/20'
                    : 'bg-[var(--bg-card-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ICON GRID (3D GLASS EXCLUSIVO) */}
        <div className="flex-1 overflow-y-auto pr-1 py-1 grid grid-cols-2 sm:grid-cols-2 gap-2 min-h-[220px]">
          {filteredIcons.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-[var(--text-muted)]">
              No se encontraron íconos 3D con &quot;{search}&quot;. Prueba con otro término.
            </div>
          ) : (
            filteredIcons.map((item) => {
              const isSelected = previewIcon.toLowerCase() === item.key.toLowerCase();
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPreviewIcon(item.key)}
                  className={`p-3 rounded-2xl flex items-center gap-3 text-left transition-all active-press border ${
                    isSelected
                      ? 'bg-[var(--accent-brand)]/15 border-[var(--accent-brand)] shadow-md shadow-[var(--accent-brand)]/15 scale-[1.01]'
                      : 'bg-[var(--bg-card-elevated)] border-[var(--border-subtle)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-black/25 shrink-0 flex items-center justify-center p-1.5 border border-white/5 relative shadow-inner">
                    <CategoryIcon name={item.key} size={32} />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-brand)] text-[var(--fab-text)] flex items-center justify-center text-[9px] font-black shadow">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block truncate mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold shrink-0">
              Selección:
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] truncate">
              <CategoryIcon name={previewIcon} size={18} />
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                {currentOption?.label || previewIcon}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-2xl bg-[var(--accent-brand)] text-[var(--fab-text)] font-black text-xs uppercase tracking-wider active-press hover:brightness-105 transition-all shadow-md shadow-[var(--accent-brand)]/20 flex items-center gap-1.5 shrink-0"
          >
            <Check size={14} strokeWidth={2.8} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
