'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users as UsersIcon, Plus, UserCheck, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });

  const fetchUsers = () => api.get('/users').then((res) => setUsers(res.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('Usuario creado correctamente');
      setShowModal(false);
      fetchUsers();
    } catch (e) {
      alert('Error al crear usuario');
    }
  };

  return (
    <div className="px-4 py-5 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administra estudiantes, asesores y coordinadores</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">Registrar Nuevo Usuario</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Nombre Completo</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500/20" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Email Institucional</label><input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500/20" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Contraseña Temporal</label><input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500/20" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Rol en el Sistema</label>
                <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500/20">
                  <option value="STUDENT">Estudiante</option>
                  <option value="ADVISOR">Asesor</option>
                  <option value="COORDINATOR">Coordinador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-semibold text-sm hover:bg-primary-600 transition mt-2">Crear Usuario</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Programa</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Cargando usuarios...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No hay usuarios</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                        {u.name?.charAt(0)}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.program?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-primary-600 transition"><UserCheck className="w-4 h-4" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
