'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Brain, Sparkles, Trash2 } from 'lucide-react';

interface BatchFile {
  file: File;
  title: string;
  advanceType: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error';
  result?: string;
}

export default function UploadPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [tab, setTab] = useState<'single' | 'batch'>('single');

  // Single upload
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [advanceType, setAdvanceType] = useState('chapter_1');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  // Batch upload
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchDone, setBatchDone] = useState(false);

  useEffect(() => {
    api.get('/templates').then(r => setTemplates(r.data)).catch(console.error);
  }, []);

  // === Single Upload ===
  const handleSingleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !templateId) return;
    setUploading(true);
    setMsg('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('advanceType', advanceType);
    fd.append('templateId', templateId);
    try {
      const res = await api.post('/advances/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('✓ Avance subido. Iniciando análisis con Gemini IA...');
      // Auto-trigger AI analysis
      try {
        await api.post(`/ai-analysis/analyze/${res.data.id}`);
        setMsg('✓ ¡Avance subido y analizado por Gemini IA exitosamente!');
      } catch {
        setMsg('✓ Avance subido. El análisis IA se procesará en segundo plano.');
      }
      setFile(null);
      setTitle('');
    } catch (err: any) {
      setMsg('Error: ' + (err.response?.data?.message || 'No se pudo subir'));
    } finally {
      setUploading(false);
    }
  };

  // === Batch Upload ===
  const handleBatchFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: BatchFile[] = Array.from(files).map((f) => ({
      file: f,
      title: f.name.replace(/\.(docx|pdf)$/i, '').replace(/[_-]/g, ' '),
      advanceType: 'chapter_1',
      status: 'pending' as const,
    }));
    setBatchFiles((prev) => [...prev, ...newFiles]);
    setBatchDone(false);
  };

  const removeBatchFile = (index: number) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBatchFile = (index: number, field: keyof BatchFile, value: string) => {
    setBatchFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
  };

  const runBatchUpload = async () => {
    if (!templateId || batchFiles.length === 0) return;
    setBatchRunning(true);
    setBatchDone(false);

    for (let i = 0; i < batchFiles.length; i++) {
      const bf = batchFiles[i];
      if (bf.status === 'done') continue;

      // Step 1: Upload
      setBatchFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)),
      );

      try {
        const fd = new FormData();
        fd.append('file', bf.file);
        fd.append('title', bf.title);
        fd.append('advanceType', bf.advanceType);
        fd.append('templateId', templateId);
        const res = await api.post('/advances/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Step 2: AI Analysis
        setBatchFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'analyzing' } : f)),
        );

        try {
          await api.post(`/ai-analysis/analyze/${res.data.id}`);
          setBatchFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: 'done', result: '✓ Subido y analizado por Gemini' } : f,
            ),
          );
        } catch {
          setBatchFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: 'done', result: '✓ Subido (análisis pendiente)' } : f,
            ),
          );
        }
      } catch (err: any) {
        setBatchFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error', result: err.response?.data?.message || 'Error de subida' }
              : f,
          ),
        );
      }
    }

    setBatchRunning(false);
    setBatchDone(true);
  };

  const ADVANCE_TYPES = [
    { value: 'chapter_1', label: 'Cap. 1' },
    { value: 'chapter_2', label: 'Cap. 2' },
    { value: 'chapter_3', label: 'Cap. 3' },
    { value: 'chapter_4', label: 'Cap. 4' },
    { value: 'chapter_5', label: 'Cap. 5' },
    { value: 'full', label: 'Tesis completa' },
  ];

  return (
    <div className="px-4 py-5 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Subir Avances de Tesis</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Sube documentos Word o PDF para análisis automático con Gemini IA
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 shadow-xs">
        <button
          onClick={() => setTab('single')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            tab === 'single'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" /> Subida Individual
        </button>
        <button
          onClick={() => setTab('batch')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            tab === 'batch'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Subida por Lotes + IA
        </button>
      </div>

      {/* Shared: Template selector */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Documento Patrón (aplica a todos)
        </label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
          required
        >
          <option value="">Seleccionar documento patrón...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} v{t.version}
            </option>
          ))}
        </select>
      </div>

      {/* === SINGLE UPLOAD TAB === */}
      {tab === 'single' && (
        <div>
          {msg && (
            <div
              className={`p-3 rounded-lg mb-4 text-sm ${
                msg.startsWith('Error')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {msg}
            </div>
          )}

          <form onSubmit={handleSingleUpload} className="bg-white rounded-xl border p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Título del avance
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                placeholder="Ej: Capítulo 1 - Marco Teórico"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo de avance
              </label>
              <select
                value={advanceType}
                onChange={(e) => setAdvanceType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm"
              >
                {ADVANCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Archivo</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer">
                {file ? (
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-500">Arrastra o haz clic</p>
                    <p className="text-xs text-gray-400">.docx o .pdf — Máx. 50MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={uploading || !file || !templateId}
              className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Subiendo y analizando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" /> Subir y analizar con Gemini IA
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* === BATCH UPLOAD TAB === */}
      {tab === 'batch' && (
        <div className="space-y-4">
          {/* Dropzone */}
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary-300 rounded-2xl bg-primary-50/30 hover:bg-primary-50/60 transition-colors cursor-pointer">
            <Sparkles className="w-8 h-8 text-primary-400 mb-2" />
            <p className="text-sm font-medium text-primary-700">
              Selecciona varios archivos a la vez
            </p>
            <p className="text-xs text-primary-400 mt-0.5">
              .docx o .pdf — Se analizarán automáticamente con Gemini IA
            </p>
            <input
              type="file"
              accept=".pdf,.docx"
              multiple
              onChange={(e) => handleBatchFiles(e.target.files)}
              className="hidden"
            />
          </label>

          {/* File List */}
          {batchFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {batchFiles.length} archivo(s) en cola
                </span>
                {!batchRunning && (
                  <button
                    onClick={() => { setBatchFiles([]); setBatchDone(false); }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              {batchFiles.map((bf, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${
                    bf.status === 'done'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : bf.status === 'error'
                        ? 'border-red-200 bg-red-50/30'
                        : bf.status === 'uploading' || bf.status === 'analyzing'
                          ? 'border-primary-200 bg-primary-50/20'
                          : 'border-slate-100'
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {bf.status === 'pending' && <FileText className="w-5 h-5 text-slate-400" />}
                    {bf.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                    {bf.status === 'analyzing' && <Brain className="w-5 h-5 text-primary-500 animate-pulse" />}
                    {bf.status === 'done' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    {bf.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>

                  {/* Editable fields */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      value={bf.title}
                      onChange={(e) => updateBatchFile(i, 'title', e.target.value)}
                      disabled={bf.status !== 'pending'}
                      className="w-full text-sm font-medium text-slate-800 bg-transparent border-b border-slate-200 focus:border-primary-500 outline-none pb-0.5 disabled:border-transparent"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{bf.file.name}</span>
                      <span>({(bf.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      {bf.status === 'pending' && (
                        <select
                          value={bf.advanceType}
                          onChange={(e) => updateBatchFile(i, 'advanceType', e.target.value)}
                          className="text-xs border border-slate-200 rounded px-1.5 py-0.5"
                        >
                          {ADVANCE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {bf.result && (
                      <p className={`text-xs font-medium ${bf.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {bf.result}
                      </p>
                    )}
                    {bf.status === 'analyzing' && (
                      <p className="text-xs text-primary-600 font-medium animate-pulse">
                        🤖 Gemini IA analizando estructura, contenido y originalidad...
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  {bf.status === 'pending' && (
                    <button
                      onClick={() => removeBatchFile(i)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Run Button */}
              {!batchDone && (
                <button
                  onClick={runBatchUpload}
                  disabled={batchRunning || !templateId || batchFiles.filter(f => f.status === 'pending').length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {batchRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Procesando lote con Gemini IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Subir {batchFiles.filter(f => f.status === 'pending').length} archivo(s) y analizar con IA
                    </>
                  )}
                </button>
              )}

              {batchDone && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-800">
                    ¡Lote completado! Todos los avances fueron procesados por Gemini IA.
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Puedes verlos en la sección de Avances de Tesis.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
