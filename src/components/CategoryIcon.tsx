import React from 'react';

// Únicamente íconos 3D Glass de Dark Mode
import cardMobileDark from '../assets/icons/Dark Mode/card-mobile-3.png';
import billReceiptDark from '../assets/icons/Dark Mode/bill-receipt-3.png';
import walletDark from '../assets/icons/Dark Mode/wallet-11.png';
import bankDark from '../assets/icons/Dark Mode/bank-3.png';
import amazonDark from '../assets/icons/Dark Mode/amazon-3.png';
import coinsDark from '../assets/icons/Dark Mode/coins-3.png';
import creditCardDark from '../assets/icons/Dark Mode/credit-card-3.png';
import creditCardMasterDark from '../assets/icons/Dark Mode/credit-card-master-3.png';
import creditCardVisaDark from '../assets/icons/Dark Mode/credit-card-visa-3.png';
import creditCardBackDark from '../assets/icons/Dark Mode/credit-card-back-3.png';
import cashDark from '../assets/icons/Dark Mode/cash-10.png';
import atmDark from '../assets/icons/Dark Mode/atm-3.png';
import posDark from '../assets/icons/Dark Mode/pos-machine-3.png';
import bankStatementDark from '../assets/icons/Dark Mode/bank-statement-3.png';
import paypalDark from '../assets/icons/Dark Mode/paypal-3.png';
import transactionDark from '../assets/icons/Dark Mode/transaction-10.png';

export const GLASS_ICONS: Record<string, string> = {
  'bill-receipt': billReceiptDark,
  'pos-machine': posDark,
  'pos': posDark,
  'cash': cashDark,
  'coins': coinsDark,
  'credit-card': creditCardDark,
  'credit-card-visa': creditCardVisaDark,
  'credit-card-master': creditCardMasterDark,
  'credit-card-back': creditCardBackDark,
  'card-mobile': cardMobileDark,
  'bank': bankDark,
  'bank-statement': bankStatementDark,
  'atm': atmDark,
  'wallet': walletDark,
  'transaction': transactionDark,
  'amazon': amazonDark,
  'paypal': paypalDark,
};

// Aliases inteligentes para retrocompatibilidad con datos existentes
const LEGACY_ALIASES: Record<string, string> = {
  receipt: 'bill-receipt',
  factura: 'bill-receipt',
  servicios: 'bill-receipt',
  luz: 'bill-receipt',
  agua: 'bill-receipt',
  wifi: 'bill-receipt',
  internet: 'bill-receipt',
  zap: 'bill-receipt',
  phone: 'bill-receipt',
  telefono: 'bill-receipt',
  droplet: 'bill-receipt',
  flame: 'bill-receipt',
  tv: 'bill-receipt',
  netflix: 'paypal',
  spotify: 'paypal',
  supermercado: 'pos-machine',
  super: 'pos-machine',
  compras: 'pos-machine',
  shoppingcart: 'pos-machine',
  shoppingbag: 'pos-machine',
  tienda: 'pos-machine',
  abarrotes: 'pos-machine',
  efectivo: 'cash',
  billetes: 'cash',
  monedas: 'coins',
  cambio: 'coins',
  visa: 'credit-card-visa',
  mastercard: 'credit-card-master',
  tarjeta: 'credit-card',
  creditcard: 'credit-card',
  movil: 'card-mobile',
  contactless: 'card-mobile',
  applepay: 'card-mobile',
  banco: 'bank',
  landmark: 'bank',
  cuenta: 'bank',
  alquiler: 'bank-statement',
  renta: 'bank-statement',
  casa: 'bank-statement',
  home: 'bank-statement',
  cajero: 'atm',
  retiro: 'atm',
  billetera: 'wallet',
  mesada: 'wallet',
  personal: 'wallet',
  tag: 'wallet',
  otros: 'wallet',
  car: 'pos-machine',
  auto: 'pos-machine',
  gasolina: 'pos-machine',
  fuel: 'pos-machine',
  taller: 'bill-receipt',
  wrench: 'bill-receipt',
  restaurante: 'pos-machine',
  comida: 'pos-machine',
  cafe: 'pos-machine',
  coffee: 'pos-machine',
  pizza: 'pos-machine',
  utensils: 'pos-machine',
  utensilscrossed: 'pos-machine',
  apple: 'pos-machine',
  wine: 'pos-machine',
  salud: 'bill-receipt',
  medico: 'bill-receipt',
  farmacia: 'pos-machine',
  pill: 'pos-machine',
  heartpulse: 'bill-receipt',
  gym: 'card-mobile',
  dumbbell: 'card-mobile',
  sparkles: 'card-mobile',
};

interface Props {
  name?: string;
  size?: number | string;
  className?: string;
}

export const CategoryIcon: React.FC<Props> = ({ name = 'wallet', size = 20, className = '' }) => {
  const raw = (name || '').trim().toLowerCase();
  const normalized = LEGACY_ALIASES[raw] || raw;

  const glassSrc = GLASS_ICONS[normalized] || walletDark;

  return (
    <img
      src={glassSrc}
      alt={name || 'Categoría'}
      style={{ width: size, height: size }}
      className={`object-contain shrink-0 drop-shadow-md select-none transition-transform duration-200 ${className}`}
      loading="lazy"
    />
  );
};
