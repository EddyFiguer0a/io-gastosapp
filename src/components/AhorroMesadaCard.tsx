import React, { useState } from 'react';
import {
  Sparkles,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from 'lucide-react';
import type { AhorroMesadaInfo } from '../types/finance';
import { formatQ } from '../lib/validation';

interface Props {
  data: AhorroMesadaInfo;
  onOpenQuickEntry?: () => void;
  onUpdateMesada?: (id: string, data: { nombre?: string; acumulado?: number }) => Promise<void>;
  onDeleteMesada?: (id: string) => Promise<void>;
  onCreateMesada?: (data: { nombre: string; acumulado: number }) => Promise<void>;
}

export const AhorroMesadaCard: React.FC<Props> = ({ data, onUpdateMesada, onDeleteMesada, onCreateMesada }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleEditStart = (id: string, currentName: string, currentVal: number) => {
    setEditingId(id);
    setEditName(currentName);
    setEditValue(String(currentVal));
    setIsCreating(false);
  };

  const handleEditSave = async () => {
    if (editingId && onUpdateMesada) {
      const num = parseFloat(editValue) || 0;
      await onUpdateMesada(editingId, { nombre: editName, acumulado: num });
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta fuente de mesada?')) {
      if (onDeleteMesada) await onDeleteMesada(id);
    }
  };

  const handleCreateSave = async () => {
    if (onCreateMesada && newName.trim()) {
      const num = parseFloat(newValue) || 0;
      await onCreateMesada({ nombre: newName.trim(), acumulado: num });
    }
    setIsCreating(false);
    setNewName('');
    setNewValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  // Progress para donut mini
  const maxPot = data.fuentes.reduce((acc, f) => acc + Math.max(f.meta_mensual, f.acumulado), 0) || 1;
  const usedPct = Math.min(100, (data.total_disponible / maxPot) * 100);

  return (
    <div className="rounded-[32px] bg-[var(--hero-bg)] text-[var(--hero-text)] p-5 sm:p-6 shadow-[0_0_30px_rgba(0,0,0,0.1)] relative overflow-hidden transition-all duration-300">
      {/* Halo decorativo */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Gráfica tipo pizza (Pie Chart) de las fuentes */}
            <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center shadow-inner overflow-hidden shrink-0 relative">
              {data.total_disponible > 0 ? (
                <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                  {(() => {
                    let cumulativePercent = 0;
                    return data.fuentes.map((f, i) => {
                      const percent = (f.acumulado / data.total_disponible) * 100;
                      if (percent <= 0) return null;

                      const dasharray = `${percent} 100`;
                      const dashoffset = -cumulativePercent;
                      cumulativePercent += percent;

                      // Diferentes opacidades de negro para los "pedazos" de pizza
                      const colors = ['#000000', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)'];
                      const color = colors[i % colors.length];

                      return (
                        <circle
                          key={f.id}
                          cx="16"
                          cy="16"
                          r="15.9154943"
                          fill="transparent"
                          stroke={color}
                          strokeWidth="31.8309886"
                          strokeDasharray={dasharray}
                          strokeDashoffset={dashoffset}
                        />
                      );
                    });
                  })()}
                </svg>
              ) : (
                <div className="w-full h-full bg-black/10" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[var(--hero-text)] tracking-tight">Ahorro Mesada</h2>
                {/* Removed Monetaria Bi label based on user request */}
              </div>
              <p className="text-[10px] text-[var(--hero-text)]/70 font-semibold mt-0.5">Distribución de fondos recibidos</p>
            </div>
          </div>

          {/* Badge total disponible */}
          <div className="text-right">
            <div className="text-2xl font-black tabular-nums tracking-tight text-[var(--hero-text)]">
              {formatQ(data.total_disponible)}
            </div>
            <div className="text-[9px] text-[var(--hero-text)]/70 uppercase tracking-widest font-bold mt-0.5">
              Disponible hoy
            </div>
          </div>
        </div>

        {/* Descripción corta */}
        <p className="text-[11px] text-[var(--hero-text)]/80 leading-relaxed mb-4">
          Fondos de mesada que ingresan para tus gastos personales y metas.
        </p>

        {/* Acordeón: Fuentes de Mesada (con edición) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-black/5 border border-black/5 hover:bg-black/10 transition-colors active-press text-xs font-bold text-[var(--hero-text)]"
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--hero-text)]" />
            {data.fuentes.length} fuentes de mesada
          </span>
          {isExpanded ? <ChevronUp size={14} className="text-[var(--hero-text)]/70" /> : <ChevronDown size={14} className="text-[var(--hero-text)]/70" />}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {data.fuentes.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl bg-black/5 border border-black/10 p-3.5 transition-all"
              >
                {editingId === f.id ? (
                  /* Modo edición */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-black">Editar fuente</div>
                      <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 p-1">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Nombre de la fuente"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-black/20 text-black text-xs font-bold focus:outline-none focus:border-black transition-colors"
                      />
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 font-black text-xs">Q</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Monto total"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-black/20 text-black font-black tabular-nums text-sm focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 rounded-xl bg-black/10 text-black/60 text-xs font-bold hover:text-black transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleEditSave}
                        className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-black/80 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Vista normal */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: ['#000000', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)'][
                            data.fuentes.findIndex(src => src.id === f.id) % 4
                          ]
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-black truncate">{f.nombre}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-black/10 text-black/70 tabular-nums shadow-sm">
                            {data.total_disponible > 0 ? Math.round((f.acumulado / data.total_disponible) * 100) : 0}%
                          </span>
                        </div>
                        {f.meta_mensual > 0 && (
                          <div className="text-[10px] text-black/60 mt-0.5 tabular-nums">
                            Meta mensual: <span className="font-bold">{formatQ(f.meta_mensual)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-black tabular-nums">{formatQ(f.acumulado)}</div>
                        <div className="text-[9px] text-black/60 uppercase tracking-wider">acumulado</div>
                      </div>
                      <button
                        onClick={() => handleEditStart(f.id, f.nombre, f.acumulado)}
                        className="w-7 h-7 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center text-black/50 hover:text-black hover:border-black/30 hover:bg-black/10 transition-colors active-press"
                        title="Editar monto"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isCreating ? (
              <div className="rounded-2xl bg-black/5 border border-black/10 p-3.5 mt-2 animate-fade-in">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-black">Nueva fuente de mesada</div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Nombre de la fuente"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/20 text-black text-xs font-bold focus:outline-none focus:border-black transition-colors"
                      autoFocus
                    />
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 font-black text-xs">Q</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Monto inicial"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-black/20 text-black font-black tabular-nums text-sm focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 rounded-xl bg-black/10 text-black/60 text-xs font-bold hover:text-black transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateSave}
                      className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-black/80 transition-colors"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-black/20 text-black/60 text-xs font-bold hover:text-black hover:border-black/40 hover:bg-black/5 transition-colors flex items-center justify-center gap-1.5 mt-2 active-press"
              >
                <Plus size={14} /> Añadir fuente
              </button>
            )}

            {/* Hint edición */}
            <p className="text-[10px] text-black/60 font-medium text-center px-2 pt-2">
              Toca el lápiz para actualizar el monto de cada fuente al inicio de cada mes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
