'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, User, Link as LinkIcon, Loader2, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');
  const [orcidProfile, setOrcidProfile] = useState<any>(null);
  const [loadingOrcid, setLoadingOrcid] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (searchParams.get('orcid') === 'connected') {
      setSuccessMsg('¡Cuenta ORCID vinculada exitosamente!');
    }
    fetchOrcidProfile();
  }, [searchParams]);

  const fetchOrcidProfile = async () => {
    try {
      const res = await api.get('/orcid/profile');
      if (res.data) {
        setOrcidProfile(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrcid(false);
    }
  };

  const handleConnectOrcid = async () => {
    setConnecting(true);
    try {
      const res = await api.get('/orcid/connect');
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        alert('Error al iniciar la conexión con ORCID');
        setConnecting(false);
      }
    } catch (e) {
      console.error(e);
      alert('Error: ' + (e.response?.data?.message || e.message));
      setConnecting(false);
    }
  };

  return (
    <div className="px-4 py-5 sm:p-6 space-y-5 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes generales del sistema JORANA IA</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-800">{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          <button onClick={() => setActiveTab('general')} className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'general' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <Settings className="w-4 h-4" /> General
          </button>
          <button onClick={() => setActiveTab('perfil')} className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'perfil' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <User className="w-4 h-4" /> Perfil y Conexiones
          </button>
          <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notificaciones
          </button>
          <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Seguridad
          </button>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'general' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Institución</label>
                <input type="text" defaultValue="Universidad Nacional de San Martín" className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escala de Calificación Máxima</label>
                <input type="number" defaultValue={20} className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de IA Principal</label>
                <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option>llama-3.1-8b-instant</option>
                  <option>gemini-1.5-flash</option>
                </select>
              </div>
              <div className="pt-4">
                <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition">
                  Guardar Cambios
                </button>
              </div>
            </>
          )}

          {activeTab === 'perfil' && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#A6CE39]/20 flex items-center justify-center">
                    <span className="font-bold text-[#A6CE39] text-xl">iD</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Conexión con ORCID</h3>
                    <p className="text-sm text-gray-500">Vincula tu identificador de investigador para importar y exportar publicaciones automáticamente.</p>
                  </div>
                </div>

                {loadingOrcid ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verificando estado...
                  </div>
                ) : orcidProfile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="font-medium text-gray-900">Cuenta vinculada</span>
                    </div>
                    <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 inline-block">
                      <strong>Nombre:</strong> {orcidProfile.displayName || 'No especificado'}<br/>
                      <strong>ORCID iD:</strong> <a href={`https://orcid.org/${orcidProfile.orcidId}`} target="_blank" className="text-blue-600 hover:underline">{orcidProfile.orcidId}</a>
                    </div>
                    <p className="text-xs text-gray-500">Token válido hasta: {new Date(orcidProfile.tokenExpiry).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleConnectOrcid}
                      disabled={connecting}
                      className="px-4 py-2.5 bg-[#A6CE39] hover:bg-[#8FBC20] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                      Vincular mi cuenta ORCID
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
