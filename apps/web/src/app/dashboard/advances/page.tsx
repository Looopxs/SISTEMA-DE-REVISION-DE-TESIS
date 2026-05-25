'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { FileText, Eye, Brain, Clock, CheckCircle, XCircle, AlertTriangle, Play, Loader2, ClipboardCheck, CheckSquare, Square, Send } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: 'Pendiente', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  AI_PROCESSING: { label: 'IA Procesando', color: 'text-blue-600', bg: 'bg-blue-50', icon: Brain },
  AI_COMPLETE: { label: 'IA Completo', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Brain },
  HUMAN_REVIEW: { label: 'En Revisión', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Eye },
  OBSERVED: { label: 'Observado', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
  APPROVED: { label: 'Aprobado', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  REJECTED: { label: 'Rechazado', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);

  // Batch review
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState('APPROVED');
  const [batchComment, setBatchComment] = useState('');
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const fetchAdvances = () => {
    api.get('/advances')
      .then((res) => setAdvances(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdvances(); }, []);

  const runAnalysis = async (advanceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzing(advanceId);
    try {
      await api.post(`/ai-analysis/analyze/${advanceId}`);
      fetchAdvances(); // Recargar inmediatamente con el resultado
    } catch (err: any) {
      console.error('Error al analizar:', err);
      alert('Error: ' + (err?.response?.data?.message || 'No se pudo analizar'));
    } finally {
      setAnalyzing(null);
    }
  };

  const runAllPending = async () => {
    const pending = advances.filter(a => a.status === 'PENDING');
    if (pending.length === 0) { alert('No hay avances pendientes'); return; }
    setAnalyzingAll(true);
    for (const adv of pending) {
      setAnalyzing(adv.id);
      try {
        await api.post(`/ai-analysis/analyze/${adv.id}`);
      } catch (err) {
        console.error(`Error en ${adv.title}:`, err);
      }
    }
    setAnalyzing(null);
    setAnalyzingAll(false);
    fetchAdvances();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const submitBatchReview = async () => {
    if (selected.size === 0) return;
    setSubmittingBatch(true);
    for (const advId of selected) {
      try {
        await api.post(`/reviews/${advId}`, {
          humanComment: batchComment || `Revisión por lotes: ${batchStatus}`,
          status: batchStatus,
        });
      } catch (err) {
        console.error(`Error revisando ${advId}:`, err);
      }
    }
    setSubmittingBatch(false);
    setSelected(new Set());
    setBatchMode(false);
    setBatchComment('');
    fetchAdvances();
  };

  const filtered = statusFilter === 'ALL'
    ? advances
    : advances.filter((a) => a.status === statusFilter);

  const pendingCount = advances.filter(a => a.status === 'PENDING').length;

  return (
    <div className="px-4 py-5 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Avances de Tesis</h1>
          <p className="text-sm text-gray-500 mt-0.5">{advances.length} avances registrados</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              onClick={runAllPending}
              disabled={analyzingAll}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {analyzingAll ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analizando {pendingCount}...</>
              ) : (
                <><Play className="w-4 h-4" /> Analizar todos ({pendingCount})</>
              )}
            </button>
          )}
          <button
            onClick={() => { setBatchMode(!batchMode); setSelected(new Set()); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              batchMode
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            {batchMode ? 'Cancelar lotes' : 'Revisión por lotes'}
          </button>
          <Link
            href="/dashboard/upload"
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
          >
            Subir avance
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', ...Object.keys(STATUS_CONFIG)].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'ALL' ? 'Todos' : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Batch Review Bar */}
      {batchMode && selected.size > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700">{selected.size} avance(s) seleccionado(s)</span>
            <div className="flex gap-1.5">
              {[
                { id: 'APPROVED', l: '✓ Aprobar', c: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { id: 'OBSERVED', l: '⚠ Observar', c: 'bg-amber-50 text-amber-700 border-amber-200' },
                { id: 'REJECTED', l: '✗ Rechazar', c: 'bg-red-50 text-red-700 border-red-200' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBatchStatus(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    batchStatus === opt.id
                      ? `${opt.c} ring-2 ring-offset-1 ring-slate-300`
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={batchComment}
              onChange={(e) => setBatchComment(e.target.value)}
              placeholder="Comentario opcional para todos..."
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={submitBatchReview}
              disabled={submittingBatch}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap"
            >
              {submittingBatch ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
              ) : (
                <><Send className="w-3.5 h-3.5" /> Aplicar a {selected.size} avance(s)</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay avances registrados</p>
          </div>
        ) : (
          filtered.map((advance) => {
            const config = STATUS_CONFIG[advance.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = config.icon;
            const isPending = advance.status === 'PENDING';
            const isThisAnalyzing = analyzing === advance.id;

            return (
              <div
                key={advance.id}
                className={`flex items-center gap-3 sm:gap-4 p-4 bg-white rounded-xl border transition-all animate-fade-in ${
                  batchMode && selected.has(advance.id)
                    ? 'border-primary-300 bg-primary-50/30 shadow-sm'
                    : 'border-gray-100 hover:shadow-sm hover:border-gray-200'
                }`}
              >
                {batchMode && (
                  <button onClick={() => toggleSelect(advance.id)} className="flex-shrink-0">
                    {selected.has(advance.id)
                      ? <CheckSquare className="w-5 h-5 text-primary-500" />
                      : <Square className="w-5 h-5 text-slate-300" />
                    }
                  </button>
                )}
                <Link href={`/dashboard/advances/${advance.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors">
                        {advance.title}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {advance.student?.name || '—'} · {advance.advanceType} · v{advance.version}
                      {advance.program?.name ? ` · ${advance.program.name}` : ''}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {advance.aiAnalysis?.overallScore != null && (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary-500">
                        {advance.aiAnalysis.overallScore.toFixed(0)}%
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {new Date(advance.createdAt).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  )}

                  {isPending && (
                    <button
                      onClick={(e) => runAnalysis(advance.id, e)}
                      disabled={isThisAnalyzing}
                      className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isThisAnalyzing ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Analizando...</>
                      ) : (
                        <><Play className="w-3 h-3" /> Analizar</>
                      )}
                    </button>
                  )}

                  {!isPending && advance.aiAnalysis?.overallScore == null && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(advance.createdAt).toLocaleDateString('es-PE')}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
