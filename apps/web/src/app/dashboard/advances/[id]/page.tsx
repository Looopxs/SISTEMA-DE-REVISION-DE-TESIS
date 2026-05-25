'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Brain,
  Shield,
  BookOpen,
  ChevronDown,
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  FileText,
  AlertCircle,
  Activity,
  ChevronRight,
  Sparkles,
  Layers,
  HelpCircle,
  ArrowRight,
  ClipboardCheck,
  UserCheck,
  Send,
  Star
} from 'lucide-react';

const SEV: any = {
  CRITICAL: { l: 'Crítico', c: 'text-red-700 bg-red-50 border-red-100', border: 'border-l-red-500', icon: XCircle },
  MAJOR: { l: 'Mayor', c: 'text-amber-700 bg-amber-50 border-amber-100', border: 'border-l-amber-500', icon: AlertTriangle },
  MINOR: { l: 'Menor', c: 'text-green-700 bg-green-50 border-green-100', border: 'border-l-green-500', icon: CheckCircle2 },
  SUGGESTION: { l: 'Sugerencia', c: 'text-blue-700 bg-blue-50 border-blue-100', border: 'border-l-blue-500', icon: Lightbulb },
};

export default function AdvanceDetail() {
  const { id } = useParams();
  const [d, setD] = useState<any>(null);
  const [tab, setTab] = useState('findings');
  const [exp, setExp] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Filtros y búsquedas
  const [findingsSearch, setFindingsSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [referencesSearch, setReferencesSearch] = useState('');
  const [referencesFilter, setReferencesFilter] = useState('ALL');

  // Revisión humana
  const [reviewGrade, setReviewGrade] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchData = () => api.get(`/advances/${id}`).then(r => setD(r.data)).catch(console.error);
  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action: string, url: string) => {
    setLoading(action);
    try {
      await api.post(url);
      fetchData();
    } catch (e) {
      alert(`Error al iniciar ${action}`);
    } finally {
      setLoading(null);
    }
  };

  const submitReview = async () => {
    setSubmittingReview(true);
    setReviewSuccess(false);
    try {
      await api.post(`/reviews/${id}`, {
        finalGrade: reviewGrade ? parseFloat(reviewGrade) : undefined,
        humanComment: reviewComment,
        status: reviewStatus,
      });
      setReviewSuccess(true);
      fetchData();
    } catch (e) {
      alert('Error al guardar la revisión');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!d) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>
    );
  }

  const a = d.aiAnalysis;
  const f = a?.findings || [];

  // Filtrar hallazgos
  const filteredFindings = f.filter((fi: any) => {
    const matchesSearch =
      fi.sectionRef?.toLowerCase().includes(findingsSearch.toLowerCase()) ||
      fi.description?.toLowerCase().includes(findingsSearch.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || fi.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Filtrar referencias
  const refs = d.referenceAnalysis?.references || [];
  const filteredReferences = refs.filter((ref: any) => {
    const matchesSearch =
      ref.rawText?.toLowerCase().includes(referencesSearch.toLowerCase()) ||
      ref.authors?.toLowerCase().includes(referencesSearch.toLowerCase()) ||
      ref.title?.toLowerCase().includes(referencesSearch.toLowerCase());
    const matchesFilter =
      referencesFilter === 'ALL' ||
      ref.status === referencesFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="px-4 py-5 sm:p-8 space-y-5 sm:space-y-8 max-w-7xl mx-auto animate-fade-in overflow-x-hidden">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10 -translate-x-40 translate-y-40"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                {d.advanceType}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                Versión {d.version}
              </span>
              {/* Status Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                d.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                d.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                d.status === 'OBSERVED' ? 'bg-amber-100 text-amber-800' :
                d.status === 'AI_COMPLETE' ? 'bg-indigo-100 text-indigo-800' :
                d.status === 'PENDING' ? 'bg-gray-100 text-gray-700' :
                'bg-blue-100 text-blue-800'
              }`}>
                {d.status === 'APPROVED' ? '✓ Aprobado' :
                 d.status === 'REJECTED' ? '✗ Rechazado' :
                 d.status === 'OBSERVED' ? '⚠ Observado' :
                 d.status === 'AI_COMPLETE' ? '🤖 IA Completo' :
                 d.status === 'PENDING' ? '⏳ Pendiente' :
                 d.status === 'HUMAN_REVIEW' ? '👁 En Revisión' : d.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{d.title}</h1>
            <p className="text-sm text-slate-500">
              Estudiante: <span className="font-medium text-slate-700">{d.student?.name}</span> · Subido el {new Date(d.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Human Grade (if reviewed) */}
            {d.review?.finalGrade != null && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-100">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-emerald-200">
                  <span className="text-2xl font-extrabold text-emerald-600">{d.review.finalGrade.toFixed(1)}</span>
                </div>
                <div>
                  <div className="text-xs text-emerald-500 font-medium uppercase tracking-wider">Nota Humana</div>
                  <div className="text-sm font-semibold text-emerald-800">Revisión Final</div>
                </div>
              </div>
            )}

            {/* AI Grade */}
            {a ? (
              <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-slate-100">
                  <span className="text-2xl font-extrabold text-primary-600">{a.gradeConverted.toFixed(1)}</span>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Calificación IA</div>
                  <div className="text-sm font-semibold text-slate-700">Conversión a {d.maxGrade || 20} pts</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
                <div className="text-sm font-medium text-amber-800">Revisión en cola o pendiente</div>
              </div>
            )}
          </div>
        </div>

        {/* Scores Grid */}
        {a && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100">
            {[
              { l: 'Estructura', v: a.structureScore, c: 'bg-primary-500', bg: 'bg-primary-50', text: 'text-primary-700' },
              { l: 'Contenido', v: a.contentScore, c: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { l: 'Forma', v: a.formScore, c: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
              { l: 'Originalidad', v: a.originalityScore, c: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' }
            ].map(x => (
              <div key={x.l} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/80 transition-all duration-300 hover:shadow-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{x.l}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${x.bg} ${x.text}`}>{Math.round(x.v)}%</span>
                </div>
                <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                  <div className={`h-full ${x.c} rounded-full transition-all duration-500`} style={{ width: `${x.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Executive Summary */}
        {a?.executiveSummary && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-l-4 border-primary-500 rounded-r-xl">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <p className="text-xs font-bold text-primary-800 uppercase tracking-wider">Resumen Ejecutivo de IA</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-sans">{a.executiveSummary}</p>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-1 sm:gap-1.5 bg-white rounded-2xl border border-slate-100 p-1 sm:p-1.5 shadow-xs overflow-x-auto">
        {[
          { id: 'findings', l: `Hallazgos`, count: f.length, icon: Brain },
          { id: 'plagiarism', l: 'Plagio', count: d.plagiarismReports?.[0]?.overallScore !== undefined ? `${d.plagiarismReports[0].overallScore.toFixed(0)}%` : null, icon: Shield },
          { id: 'references', l: 'Refs', count: refs.length || null, icon: BookOpen },
          { id: 'review', l: 'Revisión', count: d.review ? '✓' : null, icon: ClipboardCheck }
        ].map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.l}</span>
              {t.count !== null && (
                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents: Findings */}
      {tab === 'findings' && (
        <div className="space-y-6">
          {/* Filters Panel */}
          {f.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar hallazgos..."
                  value={findingsSearch}
                  onChange={(e) => setFindingsSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {['ALL', 'CRITICAL', 'MAJOR', 'MINOR', 'SUGGESTION'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition flex-shrink-0 ${
                      severityFilter === sev
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sev === 'ALL' ? 'Todos' : sev === 'CRITICAL' ? 'Críticos' : sev === 'MAJOR' ? 'Mayores' : sev === 'MINOR' ? 'Menores' : 'Sugerencias'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Findings List */}
          <div className="space-y-4">
            {filteredFindings.map((fi: any) => {
              const s = SEV[fi.severity] || SEV.SUGGESTION;
              const open = exp === fi.id;
              const SeverityIcon = s.icon;

              return (
                <div
                  key={fi.id}
                  className={`group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden border-l-4 ${s.border}`}
                >
                  <button
                    onClick={() => setExp(open ? null : fi.id)}
                    className="w-full flex items-start gap-3 sm:gap-4 p-4 sm:p-5 text-left transition hover:bg-slate-50/40"
                  >
                    <div className={`p-2 rounded-xl ${s.c} flex-shrink-0`}>
                      <SeverityIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wide uppercase ${s.c}`}>
                          {s.l}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{fi.sectionRef || 'Sección Desconocida'}</span>
                        {fi.pageRef && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Pág. {fi.pageRef}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 group-hover:text-slate-950 transition-colors leading-relaxed">
                        {fi.description}
                      </p>
                    </div>

                    <div className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 group-hover:text-slate-600 transition flex-shrink-0">
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180 text-primary-500' : ''}`} />
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 sm:space-y-4 animate-slide-down border-t border-slate-50 pt-3 sm:pt-4 bg-slate-50/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs space-y-2">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Cómo corregir:</p>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{fi.correctionSteps}</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50/40 to-teal-50/20 rounded-xl p-4 border border-emerald-100 shadow-xs space-y-2">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ejemplo de redacción sugerida:</p>
                          </div>
                          <div className="bg-white/80 backdrop-blur-xs rounded-lg p-3 border border-emerald-100/50">
                            <p className="text-xs text-emerald-950 italic leading-relaxed">
                              "{fi.exampleImprovement}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {fi.recommendation && (
                        <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-xs flex gap-2.5 items-start">
                          <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consejo académico adicional:</span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{fi.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFindings.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <Brain className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-slate-800">Sin hallazgos coincidentes</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {a ? 'No se encontraron hallazgos que coincidan con los filtros de búsqueda.' : 'El análisis aún no se ha ejecutado en este avance.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Contents: Plagiarism */}
      {tab === 'plagiarism' && (
        <div className="space-y-6">
          {d.plagiarismReports?.[0] ? (
            <>
              {/* Radial Originality Panel */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${d.plagiarismReports[0].overallScore > 30 ? 'bg-red-50 text-red-500' : d.plagiarismReports[0].overallScore > 15 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Índice de Similitud de Texto</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Analizado a través de embeddings vectoriales y similitud del coseno</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 bg-slate-50 px-5 py-4 rounded-xl border border-slate-100/50 w-full md:w-auto">
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden flex-1 md:w-32 md:flex-none">
                    <div
                      className={`h-full rounded-full ${d.plagiarismReports[0].overallScore > 30 ? 'bg-red-500' : d.plagiarismReports[0].overallScore > 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(d.plagiarismReports[0].overallScore, 100)}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-extrabold block ${d.plagiarismReports[0].overallScore > 30 ? 'text-red-600' : d.plagiarismReports[0].overallScore > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {d.plagiarismReports[0].overallScore.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Similitud Total</span>
                  </div>
                </div>
              </div>

              {/* Plagiarism Alerts List */}
              <div className="space-y-4">
                {(d.plagiarismReports[0].alerts || []).map((alert: any, i: number) => {
                  const isCrit = alert.severity === 'critical';
                  return (
                    <div
                      key={i}
                      className={`bg-white rounded-2xl border hover:border-slate-200 shadow-xs p-5 transition-all duration-300 border-l-4 ${
                        isCrit ? 'border-l-red-500' : 'border-l-amber-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md tracking-wider ${
                            isCrit ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {isCrit ? 'CRÍTICO' : 'ATENCIÓN'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{alert.sectionName || 'Sección General'}</span>
                        </div>
                        <span className={`text-sm font-extrabold ${isCrit ? 'text-red-600' : 'text-amber-600'}`}>
                          {(alert.similarity * 100).toFixed(0)}% similitud
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {alert.targetSnippet && (
                          <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tu fragmento:</span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed italic">"{alert.targetSnippet}"</p>
                          </div>
                        )}

                        {alert.sourceSnippet && (
                          <div className="bg-orange-50/15 rounded-xl p-3.5 border border-orange-100/30">
                            <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider block mb-1">Fuente externa detectada:</span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed italic">"{alert.sourceSnippet}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(!d.plagiarismReports[0].alerts || d.plagiarismReports[0].alerts.length === 0) && (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
                    <CheckCircle2 className="w-14 h-14 text-emerald-200 mx-auto mb-4" />
                    <h3 className="text-sm font-semibold text-slate-800">¡Documento 100% Original!</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      No se detectaron fragmentos de similitud que superen los umbrales de alerta.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs">
              <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-slate-800">Reporte de plagio no disponible</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ejecuta el análisis automático de originalidad de texto para comparar el avance con nuestra base de datos.
              </p>
              <button
                disabled={loading === 'Plagio'}
                onClick={() => handleAction('Plagio', `/plagiarism/analyze/${id}`)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading === 'Plagio' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analizando originalidad...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Ejecutar análisis inteligente</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: References */}
      {tab === 'references' && (
        <div className="space-y-6">
          {d.referenceAnalysis ? (
            <>
              {/* References Dashboard Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { l: 'Total de referencias', v: refs.length, c: 'text-slate-800 bg-slate-50' },
                  { l: 'Verificadas (CrossRef)', v: refs.filter((r: any) => r.status === 'VERIFIED').length, c: 'text-emerald-700 bg-emerald-50/50' },
                  { l: 'Con observaciones', v: refs.filter((r: any) => r.status !== 'VERIFIED').length, c: 'text-amber-700 bg-amber-50/50' }
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between ${item.c}`}>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-85">{item.l}</span>
                    <span className="text-2xl font-black">{item.v}</span>
                  </div>
                ))}
              </div>

              {/* Filters & Search Panel */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por autor, título, año..."
                    value={referencesSearch}
                    onChange={(e) => setReferencesSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {[
                    { id: 'ALL', l: 'Todas' },
                    { id: 'VERIFIED', l: 'Verificadas' },
                    { id: 'PARTIAL', l: 'Parciales' },
                    { id: 'NOT_FOUND', l: 'Incompletas/Errores' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setReferencesFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition flex-shrink-0 ${
                        referencesFilter === filter.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* References Interactive Table/List */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs divide-y divide-slate-100">
                {filteredReferences.map((ref: any, i: number) => (
                  <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/30 transition duration-150">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-wider uppercase border ${
                          ref.status === 'VERIFIED'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : ref.status === 'PARTIAL'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : 'bg-red-50 border-red-100 text-red-700'
                        }`}>
                          {ref.status === 'VERIFIED' ? '✓ Verificada' : ref.status === 'PARTIAL' ? '~ Parcial' : '✗ No encontrada'}
                        </span>
                        {ref.year && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {ref.year}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                        {ref.rawText}
                      </p>

                      {(ref.authors || ref.title) && (
                        <div className="text-xs text-slate-400 pt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                          {ref.authors && <span><span className="font-semibold text-slate-500">Autores:</span> {ref.authors}</span>}
                          {ref.journal && <span>· <span className="font-semibold text-slate-500">Revista:</span> {ref.journal}</span>}
                        </div>
                      )}

                      {/* AI Suggestion box */}
                      {ref.suggestion && (
                        <div className="mt-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 text-[11px] text-blue-700 leading-relaxed font-sans">
                          <span className="font-bold text-blue-800 block mb-0.5 uppercase tracking-wide text-[9px]">Sugerencia de corrección IA:</span>
                          {ref.suggestion}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ref.doi && (
                        <a
                          href={`https://doi.org/${ref.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[11px] font-bold transition"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[11px] font-bold transition"
                        >
                          <span>Enlace</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {filteredReferences.length === 0 && (
                  <div className="p-16 text-center">
                    <BookOpen className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-sm font-semibold text-slate-800">No se encontraron referencias</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Ninguna referencia bibliográfica coincide con la consulta de búsqueda.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-slate-800">Validación de referencias no ejecutada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Realiza una validación inteligente cruzada con la base de datos de CrossRef para comprobar la exactitud de tus citas académicas.
              </p>
              <button
                disabled={loading === 'Referencias'}
                onClick={() => handleAction('Referencias', `/references/analyze/${id}`)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading === 'Referencias' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando citas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Verificar con CrossRef</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Human Review */}
      {tab === 'review' && (
        <div className="space-y-6">
          {/* Existing Review */}
          {d.review && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revisión Existente</h3>
                  <p className="text-xs text-slate-400">Revisado por {d.review.reviewer?.name || 'Revisor'} el {new Date(d.review.reviewedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nota Final</span>
                  <span className="block text-xl font-black text-slate-900 mt-1">{d.review.finalGrade?.toFixed(1) || '—'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nota IA</span>
                  <span className="block text-xl font-black text-primary-600 mt-1">{d.review.aiGrade?.toFixed(1) || '—'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                  <span className={`block text-sm font-bold mt-1 ${
                    d.review.status === 'APPROVED' ? 'text-emerald-600' :
                    d.review.status === 'REJECTED' ? 'text-red-600' :
                    d.review.status === 'OBSERVED' ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {d.review.status === 'APPROVED' ? '✓ Aprobado' :
                     d.review.status === 'REJECTED' ? '✗ Rechazado' :
                     d.review.status === 'OBSERVED' ? '⚠ Observado' : d.review.status}
                  </span>
                </div>
              </div>
              {d.review.humanComment && (
                <div className="mt-4 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Comentario del Revisor</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{d.review.humanComment}</p>
                </div>
              )}
            </div>
          )}

          {/* Review Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-primary-50">
                <ClipboardCheck className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{d.review ? 'Actualizar Revisión' : 'Nueva Revisión Humana'}</h3>
                <p className="text-xs text-slate-400">Califica y emite tu dictamen como revisor</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Grade */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nota Final (sobre 20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={reviewGrade}
                  onChange={(e) => setReviewGrade(e.target.value)}
                  placeholder={a ? `Sugerencia IA: ${a.gradeConverted?.toFixed(1)}` : 'Ej: 15.5'}
                  className="w-full sm:max-w-xs px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Dictamen</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'APPROVED', l: '✓ Aprobar', c: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { id: 'OBSERVED', l: '⚠ Observar', c: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { id: 'REJECTED', l: '✗ Rechazar', c: 'bg-red-50 text-red-700 border-red-200' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setReviewStatus(opt.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        reviewStatus === opt.id
                          ? `${opt.c} ring-2 ring-offset-1 ring-slate-300 shadow-sm`
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Comentario / Observaciones</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Escriba sus observaciones, correcciones o comentarios para el estudiante..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submittingReview ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> {d.review ? 'Actualizar Revisión' : 'Enviar Revisión'}</>
                  )}
                </button>
                {reviewSuccess && (
                  <span className="text-xs font-bold text-emerald-600 animate-fade-in">✓ Revisión guardada exitosamente</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
