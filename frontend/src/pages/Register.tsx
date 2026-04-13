import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, Phone, User, Award, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    credential_type: 'RCP_BASIC',
    credential_name: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      await api.post('auth/register', formData);
      setStatus('success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse. Prueba con otro email.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <CheckCircle size={80} className="text-success mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">¡Registro Exitoso!</h1>
          <p className="text-gray-500">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-emergency mb-2">UNIRSE AL EQUIPO</h1>
          <p className="text-gray-500 font-medium">Registro de Respondedor Certificado</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Nombre</label>
              <input
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-info"
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Apellido</label>
              <input
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-info"
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-info"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Teléfono de Emergencia</label>
            <input
              type="tel"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-info"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Certificación</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-info"
              value={formData.credential_type}
              onChange={e => setFormData({...formData, credential_type: e.target.value})}
            >
              <option value="RCP_BASIC">RCP Básico</option>
              <option value="PARAMEDIC">Paramédico</option>
              <option value="DOCTOR">Médico</option>
              <option value="FIRST_RESPONDER">Primer Respondiente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Nombre del Título / Carnet</label>
            <input
              required
              placeholder="Ej: Matrícula Profesional o Curso Cruz Roja"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-info"
              value={formData.credential_name}
              onChange={e => setFormData({...formData, credential_name: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-info"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-emergency text-white font-black py-4 rounded-xl shadow-lg hover:bg-black transition mt-6 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? 'REGISTRANDO...' : 'CREAR CUENTA PROFESIONAL'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          ¿Ya eres parte del equipo?{' '}
          <Link to="/login" className="text-info font-bold hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
