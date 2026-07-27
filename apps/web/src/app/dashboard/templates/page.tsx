'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BookTemplate, Upload, FileText, Download, Trash, X } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', version: '1.0', programId: '' });
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/templates'), api.get('/programs')])
      .then(([t, p]) => {
        setTemplates(t.data);
        setPrograms(p.data);
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este patrón?')) return;
    try {
      await api.delete(`/templates/${id}`);
      fetchData();
    } catch (err) {
      alert('Error al eliminar el patrón.');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedFile && !rawText) {
      alert('Debes subir un archivo PDF/DOCX o pegar la estructura del esquema.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('version', formData.version);
      formDataToSend.append('programId', formData.programId);
      
      if (rawText) {
        formDataToSend.append('rawText', rawText);
      }
      
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      await api.post('/templates/upload', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowModal(false);
      setFormData({ name: '', version: '1.0', programId: '' });
      setSelectedFile(null);
      setRawText('');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al registrar el patrón. Verifica la conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-5 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Documentos Patrón</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona los formatos y rúbricas institucionales</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition flex items-center gap-2">
          <Upload className="w-4 h-4" /> Subir Patrón
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">Nuevo Documento Patrón</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Formato</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none" placeholder="Ej: Formato APA 7mo" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Programa / Facultad</label>
                <select required value={formData.programId} onChange={e=>setFormData({...formData, programId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Seleccionar programa...</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Estructura Manual (Opcional - si no subes archivo)</label><textarea rows={4} value={rawText} onChange={e=>setRawText(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none" placeholder="Pega aquí el índice o estructura completa..." /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Archivo de Referencia (.pdf/.docx)</label><input type="file" accept=".pdf,.docx" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" /></div>
              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-semibold text-sm hover:bg-primary-600 transition mt-2 disabled:opacity-50 flex justify-center items-center gap-2">
                {isSubmitting ? 'Procesando...' : 'Registrar Patrón'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />)
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-200">
            <BookTemplate className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay documentos patrón registrados</p>
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">
                  v{t.version}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 truncate" title={t.name}>{t.name}</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">{t.program?.name || 'General'}</p>
              
              <div className="flex gap-2">
                <button onClick={() => {
                  if (!t.extractedSchema) {
                     alert(`No hay estructura extraída para ${t.name}. Por favor, borra este patrón y vuélvelo a subir.`);
                     return;
                  }
                  setPreviewTemplate(t);
                }} className="flex-1 py-1.5 border border-primary-200 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 text-xs font-medium rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/40 transition">
                  Ver Estructura
                </button>
                <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition" title="Eliminar Patrón">
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Side Panel for Preview */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-[var(--surface)] border-l border-[var(--border-color)] shadow-2xl transform transition-transform duration-300 ease-in-out ${previewTemplate ? 'translate-x-0' : 'translate-x-full'}`}>
        {previewTemplate && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--surface-2)]">
              <div>
                <h2 className="font-semibold text-[var(--text-primary)] truncate max-w-[300px]" title={previewTemplate.name}>Estructura Extraída</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 truncate max-w-[300px]">{previewTemplate.name}</p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {(() => {
                try {
                  const schema = typeof previewTemplate.extractedSchema === 'string' ? JSON.parse(previewTemplate.extractedSchema) : previewTemplate.extractedSchema;
                  const sections = schema.sections || schema;
                  if (Array.isArray(sections)) {
                    return sections.map((s: any, i: number) => (
                      <div key={i} className="flex gap-3 items-start p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg)] hover:border-primary-500/30 transition-colors group">
                        <div className="text-primary-500 mt-0.5 group-hover:scale-110 transition-transform">📌</div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{s.label || s.title}</div>
                      </div>
                    ));
                  } else {
                    return <div className="text-sm text-[var(--text-muted)]">Formato desconocido.</div>;
                  }
                } catch (e) {
                  return <div className="text-sm text-red-500">Error al leer la estructura.</div>;
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for side panel */}
      {previewTemplate && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
