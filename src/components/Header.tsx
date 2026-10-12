import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  HardDrive,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  Palette,
  Wallet,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { getNombreMes } from '../lib/validation';
import type { VisualTheme } from '../types/finance';

interface Props {
  mes: number;
  anio: number;
  onPeriodChange: (mes: number, anio: number) => void;
  isCloud: boolean;
  onResetDemo: () => void;
  visualStyle: VisualTheme;
  onToggleVisualStyle: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
  onLogout: () => void;
  onOpenOnboarding?: () => void;
}

export const Header: React.FC<Props> = ({
  mes,
  anio,
  onPeriodChange,
  isCloud,
  onResetDemo,
  visualStyle,
  onToggleVisualStyle,
  isDarkMode,
  onToggleDarkMode,
  onExportJson,
  onImportJson,
  onLogout,
  onOpenOnboarding,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const handlePrevMonth = () => {
    if (mes === 1) {
      onPeriodChange(12, anio - 1);
    } else {
      onPeriodChange(mes - 1, anio);
    }
  };

  const handleNextMonth = () => {
    if (mes === 12) {
      onPeriodChange(1, anio + 1);
    } else {
      onPeriodChange(mes + 1, anio);
    }
  };

  const handleDoImport = () => {
    if (!importText.trim()) return;
    onImportJson(importText);
    setImportText('');
    setShowImportModal(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[var(--bg-card)]/95 backdrop-blur-xl border-b border-[var(--border-subtle)] px-4 pt-safe pb-3 transition-colors">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* IDENTIDAD: MIS GASTOS (WHITELABEL SAAS) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[17px] font-extrabold tracking-tight text-[var(--text-primary)] leading-none">
              Mis Gastos
            </h1>

          </div>
        </div>

        {/* SELECTOR DE PERÍODO ERGONÓMICO */}
        <div className="flex items-center bg-[var(--bg-card-elevated)] rounded-full border border-[var(--border-subtle)] p-0.5 shadow-inner">
          <button
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active-press transition-colors"
          >
            <ChevronLeft size={15} />
          </button>

          <span className="px-2 text-xs font-semibold text-[var(--text-primary)] tracking-tight select-none">
            {getNombreMes(mes).substring(0, 3)} {anio}
          </span>

          <button
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active-press transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* CONTROLES: TOGGLE TEMA & MENÚ */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={onToggleVisualStyle}
            aria-label="Alternar tema visual"
            className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-brand)] flex items-center gap-1.5 active-press transition-all text-xs font-bold shadow-sm"
            title={visualStyle === 'cyber' ? 'Estilo activo: Cyber Lime' : 'Estilo activo: Sheltheme'}
          >
            <Palette size={13} className={visualStyle === 'cyber' ? 'text-[#dcfd52]' : 'text-[#fb7185]'} />
            <span className="hidden sm:inline text-[11px] font-black">
              {visualStyle === 'cyber' ? 'Cyber Lime' : 'Sheltheme'}
            </span>
          </button>

          {/* Botón Dark Mode */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Alternar modo oscuro"
            className="w-7 h-7 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-brand)] flex items-center justify-center active-press transition-all shadow-sm"
            title={isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
          >
            {isDarkMode ? <Moon size={14} className="text-[var(--accent-brand)]" /> : <Sun size={14} className="text-amber-500" />}
          </button>

          {/* Menú de Opciones */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Opciones de estado y datos"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors active-press"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isCloud ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
            />
            <span className="hidden sm:inline">
              {isCloud ? 'Nube' : 'Local'}
            </span>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 mt-1 w-64 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-xs text-[var(--text-primary)]">
              <div className="px-2.5 py-2 border-b border-[var(--border-subtle)] mb-1">
                <div className="flex items-center gap-2 font-medium">
                  {isCloud ? (
                    <ShieldCheck size={14} className="text-emerald-500" />
                  ) : (
                    <HardDrive size={14} className="text-amber-500" />
                  )}
                  <span>{isCloud ? 'Conectado a Supabase' : 'Modo Local Offline'}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  {isCloud
                    ? 'Sincronizado en tiempo real con Supabase.'
                    : 'Tus datos persisten en este dispositivo.'}
                </p>
              </div>

              {/* Opción Asistente de Inicio */}
              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors text-left font-medium"
                >
                  <Sparkles size={13} className="text-[var(--accent)]" />
                  <span>Asistente de Inicio</span>
                </button>
              )}

              {/* Opción Exportar JSON */}
              <button
                onClick={() => {
                  onExportJson();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors text-left font-medium"
              >
                <Download size={13} className="text-blue-500" />
                <span>Exportar Datos JSON</span>
              </button>

              {/* Opción Importar JSON */}
              <button
                onClick={() => {
                  setShowImportModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors text-left font-medium"
              >
                <Upload size={13} className="text-emerald-500" />
                <span>Importar Datos JSON</span>
              </button>

              {/* Opción Restablecer */}
              {!isCloud && (
                <button
                  onClick={() => {
                    onResetDemo();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-left font-medium mt-1"
                >
                  <RotateCcw size={13} />
                  <span>Reiniciar Demo</span>
                </button>
              )}

              {/* Opción Cerrar Sesión */}
              <button
                onClick={() => {
                  onLogout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors text-left font-medium mt-1 border-t border-[var(--border-subtle)] pt-3"
              >
                <LogOut size={13} className="text-rose-500" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA IMPORTAR JSON */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl px-5 pt-5 pb-safe shadow-2xl max-h-[90dvh] overflow-y-auto hide-scrollbar">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              Importar Datos JSON
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Pega aquí el contenido JSON para cargar o migrar tu presupuesto:
            </p>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{ "presupuestos": [...], "ingresos": [...] }'
              className="w-full p-3 rounded-xl bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--accent-brand)]"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDoImport}
                className="px-4 py-2 rounded-xl bg-[var(--accent-brand)] text-white text-xs font-bold shadow-sm"
              >
                Cargar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
