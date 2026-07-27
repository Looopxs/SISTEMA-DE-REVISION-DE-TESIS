'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  FileOutput, Search, Loader2, Printer, RefreshCw,
  CheckCircle, Clock, Eye, Brain, AlertTriangle, XCircle,
  FileText, ChevronDown, X,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:       { label: 'Pendiente',    color: 'text-gray-500',   bg: 'bg-gray-100',   icon: Clock },
  AI_PROCESSING: { label: 'IA Procesando',color: 'text-blue-600',   bg: 'bg-blue-50',    icon: Brain },
  AI_COMPLETE:   { label: 'IA Completo',  color: 'text-indigo-600', bg: 'bg-indigo-50',  icon: Brain },
  HUMAN_REVIEW:  { label: 'En Revisión', color: 'text-yellow-600', bg: 'bg-yellow-50',  icon: Eye },
  OBSERVED:      { label: 'Observado',   color: 'text-orange-600', bg: 'bg-orange-50',  icon: AlertTriangle },
  APPROVED:      { label: 'Aprobado',    color: 'text-green-600',  bg: 'bg-green-50',   icon: CheckCircle },
  REJECTED:      { label: 'Rechazado',   color: 'text-red-600',    bg: 'bg-red-50',     icon: XCircle },
};

export default function ReportPage() {
  const [advances, setAdvances]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [reportHtml, setReportHtml]     = useState<string | null>(null);
  const [generating, setGenerating]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  /* ─── fetch advances ─── */
  useEffect(() => {
    api.get('/advances')
      .then(r => setAdvances(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ─── generate report ─── */
  const generate = async (id: string) => {
    setSelectedId(id);
    setGenerating(true);
    setError(null);
    setReportHtml(null);
    try {
      const res = await api.get(`/reports/advance/${id}`);
      setReportHtml(res.data.html);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al generar el informe');
    } finally {
      setGenerating(false);
    }
  };

  /* ─── print ─── */
  const printReport = () => {
    const win = window.open('', '_blank');
    if (!win || !reportHtml) return;
    win.document.write(reportHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  /* ─── filter ─── */
  const filtered = advances.filter(a => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.student?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const selected = advances.find(a => a.id === selectedId);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT PANEL: advance list ── */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
        {/* header */}
        <div className="px-4 py-4 border-b border-[var(--border-color)] space-y-3">
          <div className="flex items-center gap-2">
            <FileOutput className="w-4 h-4 text-primary-500" />
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">Generar Informe</h1>
          </div>

          {/* search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar avance o estudiante..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-primary-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* status filter */}
          <div className="relative">
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-primary-400"
            >
              <option value="ALL">Todos los estados</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <FileText className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-[var(--text-muted)]">No se encontraron avances</p>
            </div>
          ) : (
            filtered.map(adv => {
              const cfg = STATUS_CONFIG[adv.status] || STATUS_CONFIG.PENDING;
              const Icon = cfg.icon;
              const isSelected = adv.id === selectedId;
              return (
                <button
                  key={adv.id}
                  onClick={() => generate(adv.id)}
                  disabled={generating}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 group disabled:opacity-60 ${
                    isSelected
                      ? 'bg-primary-500/10 border-l-2 border-l-primary-500'
                      : 'hover:bg-[var(--surface-2)] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className={`mt-0.5 w-7 h-7 rounded-md ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isSelected ? 'text-primary-600' : 'text-[var(--text-primary)]'}`}>
                      {adv.title}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                      {adv.student?.name || '—'} · {adv.advanceType}
                    </p>
                    <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {adv.aiAnalysis?.overallScore != null && (
                    <span className="text-xs font-bold text-primary-500 flex-shrink-0 mt-0.5">
                      {adv.aiAnalysis.overallScore.toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)]">
          {filtered.length} avance(s) encontrado(s)
        </div>
      </aside>

      {/* ── RIGHT PANEL: preview ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg)]">

        {/* toolbar */}
        <div className="h-12 flex items-center justify-between px-5 border-b border-[var(--border-color)] bg-[var(--surface)] flex-shrink-0">
          <div className="text-xs text-[var(--text-muted)]">
            {selected
              ? <span>Vista previa: <span className="font-medium text-[var(--text-primary)]">{selected.title}</span></span>
              : 'Selecciona un avance para generar su informe'
            }
          </div>
          <div className="flex items-center gap-2">
            {selectedId && !generating && reportHtml && (
              <>
                <button
                  onClick={() => generate(selectedId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerar
                </button>
                <button
                  onClick={printReport}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* content area */}
        <div className="flex-1 overflow-auto">
          {!selectedId ? (
            /* empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <FileOutput className="w-10 h-10 text-primary-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Genera un informe de avance
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">
                  Selecciona cualquier avance de la lista izquierda para previsualizar
                  su informe completo con análisis IA, puntuaciones y hallazgos.
                </p>
              </div>
              <div className="flex gap-6 mt-2">
                {[
                  { label: 'Análisis IA', desc: 'Puntuaciones por dimensión' },
                  { label: 'Hallazgos', desc: 'Errores y sugerencias' },
                  { label: 'Revisión humana', desc: 'Nota y comentarios' },
                ].map(f => (
                  <div key={f.label} className="text-center">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{f.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : generating ? (
            /* loading */
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-500/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">Generando informe…</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Esto puede tomar unos segundos</p>
              </div>
            </div>
          ) : error ? (
            /* error */
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">No se pudo generar el informe</p>
                <p className="text-xs text-red-500 mt-1">{error}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  El avance debe tener al menos el análisis IA completado.
                </p>
              </div>
              <button
                onClick={() => selectedId && generate(selectedId)}
                className="px-4 py-2 text-xs rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : reportHtml ? (
            /* iframe preview */
            <iframe
              srcDoc={reportHtml}
              title="Vista previa del informe"
              className="w-full h-full border-0"
              style={{ background: '#fff' }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
