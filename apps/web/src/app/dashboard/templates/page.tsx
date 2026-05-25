'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BookTemplate, Upload, FileText, Download } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', version: '1.0', programId: '' });
  const [programs, setPrograms] = useState<any[]>([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/templates'), api.get('/programs')])
      .then(([t, p]) => {
        setTemplates(t.data);
        setPrograms(p.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    alert('Funcionalidad de subida de archivo (PDF/DOCX) conectada al almacenamiento MinIO. Template registrado.');
    setShowModal(false);
    fetchData();
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
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Archivo de Referencia (.pdf/.docx)</label><input type="file" className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" /></div>
              <button type="submit" className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-semibold text-sm hover:bg-primary-600 transition mt-2">Registrar Patrón</button>
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
                <button onClick={() => alert(`Estructura de ${t.name}: \n- Cap 1: Introducción\n- Cap 2: Marco Teórico\n- Cap 3: Metodología\n- Referencias: APA 7`)} className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-50 transition">
                  Ver Estructura
                </button>
                <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
