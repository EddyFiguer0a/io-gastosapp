import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Target,
  Receipt,
  Plus,
  Wallet,
} from 'lucide-react';
import type { ActiveTab, VisualTheme } from '../types/finance';

interface Props {
  activeTab: ActiveTab;
  visualStyle: VisualTheme;
  onTabChange: (tab: ActiveTab) => void;
  onOpenQuickEntry: () => void;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  visualStyle,
  onTabChange,
  onOpenQuickEntry,
}) => {
  const getFabStyle = () => {
    switch (visualStyle) {
      case 'cyber':
        return 'bg-[#dcfd52] text-black shadow-lg shadow-lime-950/60 border border-black hover:scale-105';
      case 'sheltheme':
        return 'bg-[#fcad52] text-white shadow-md shadow-orange-900/30';
    }
  };

  const getActiveTabColor = () => {
    switch (visualStyle) {
      case 'cyber':
        return 'text-[#dcfd52] font-black';
      case 'sheltheme':
        return 'text-[#fb7185] font-bold';
    }
  };

  const activeColor = getActiveTabColor();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-2xl border-t border-[var(--border-subtle)] px-3 pb-safe pt-2 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* TAB 1: RESUMEN / OVERVIEW */}
        <button
          onClick={() => onTabChange('overview')}
          className={`flex-1 py-1 flex flex-col items-center gap-1 transition-all active-press ${
            activeTab === 'overview' ? activeColor : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <LayoutDashboard size={20} strokeWidth={activeTab === 'overview' ? 2.5 : 1.8} />
          <span className="text-[10px] font-semibold tracking-tight">Resumen</span>
        </button>

        {/* TAB 2: CUENTAS / ACCOUNTS */}
        <button
          onClick={() => onTabChange('accounts')}
          className={`flex-1 py-1 flex flex-col items-center gap-1 transition-all active-press ${
            activeTab === 'accounts' ? activeColor : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Wallet size={20} strokeWidth={activeTab === 'accounts' ? 2.5 : 1.8} />
          <span className="text-[10px] font-semibold tracking-tight">Cuentas</span>
        </button>

        {/* FAB CENTRAL ADAPTATIVO */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenQuickEntry}
            aria-label="Registrar movimiento rápido"
            className={`w-13 h-13 rounded-2xl flex items-center justify-center active-press hover:scale-105 transition-transform ${getFabStyle()}`}
          >
            <Plus size={26} strokeWidth={2.6} />
          </button>
        </div>

        {/* TAB 3: METAS / GOALS */}
        <button
          onClick={() => onTabChange('goals')}
          className={`flex-1 py-1 flex flex-col items-center gap-1 transition-all active-press ${
            activeTab === 'goals' ? activeColor : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Target size={20} strokeWidth={activeTab === 'goals' ? 2.5 : 1.8} />
          <span className="text-[10px] font-semibold tracking-tight">Metas</span>
        </button>

        {/* TAB 4: MOVIMIENTOS / TRANSACTIONS */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex-1 py-1 flex flex-col items-center gap-1 transition-all active-press ${
            activeTab === 'transactions' ? activeColor : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Receipt size={20} strokeWidth={activeTab === 'transactions' ? 2.5 : 1.8} />
          <span className="text-[10px] font-semibold tracking-tight">Historial</span>
        </button>
      </div>
    </nav>
  );
};
