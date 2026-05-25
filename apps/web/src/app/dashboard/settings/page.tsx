'use client';

import { Settings, Shield, Bell, User } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="px-4 py-5 sm:p-6 space-y-5 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes generales del sistema JORANA IA</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          <button className="px-4 py-3 text-sm font-medium border-b-2 border-primary-500 text-primary-600 flex items-center gap-2">
            <Settings className="w-4 h-4" /> General
          </button>
          <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Perfil
          </button>
          <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notificaciones
          </button>
          <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Seguridad
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Institución</label>
            <input type="text" defaultValue="Universidad" className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escala de Calificación Máxima</label>
            <input type="number" defaultValue={20} className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo OpenAI Principal</label>
            <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
              <option>gpt-4o</option>
              <option>gpt-4-turbo</option>
              <option>gpt-3.5-turbo</option>
            </select>
          </div>
          <div className="pt-4">
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
