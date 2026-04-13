import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MapPin, HandHelping, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const HOLD_DURATION = 3000; // 3 segundos

const Home: React.FC = () => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const handleStartPress = () => {
    if (isEmergencyActive) return;
    
    setIsPressing(true);
    startTimeRef.current = Date.now();
    
    // Solicitar ubicación mientras presiona para ganar tiempo
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("No se pudo obtener la ubicación. Por favor habilita el GPS.")
    );

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleTriggerEmergency();
        handleEndPress();
      }
    }, 50);
  };

  const handleEndPress = () => {
    setIsPressing(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTriggerEmergency = async () => {
    if (!location) {
      // Re-intentar obtener ubicación si no estaba lista
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          await sendEmergency(loc);
        },
        () => setError("Error crítico: Se necesita GPS para activar la alerta.")
      );
    } else {
      await sendEmergency(location);
    }
  };

  const sendEmergency = async (loc: {lat: number, lng: number}) => {
    try {
      const response = await api.post('emergencies', {
        location_lat: loc.lat,
        location_lng: loc.lng,
        triggered_by_name: 'Usuario Anónimo'
      });
      setEmergencyId(response.data.id);
      setIsEmergencyActive(true);
    } catch (err: any) {
      const status = err.response?.status;
      setError(`Error (${status || 'Red'}): No se pudo conectar con el servidor.`);
      console.error("Emergency Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-between p-6">
      <header className="w-full flex justify-between items-center py-4">
        <h1 className="text-2xl font-black text-emergency tracking-tighter">RCP ALERT</h1>
        <button 
          onClick={() => navigate('/login')}
          className="p-2 text-info hover:bg-blue-50 rounded-full transition"
        >
          <LogIn size={24} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        {!isEmergencyActive ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¿Necesitas ayuda?</h2>
              <p className="text-gray-500">Mantén presionado el botón para avisar a los respondedores cercanos.</p>
            </div>

            <div className="relative flex items-center justify-center">
              {/* Círculo de progreso */}
              <svg className="absolute w-72 h-72 transform -rotate-90">
                <circle
                  cx="144"
                  cy="144"
                  r="130"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <motion.circle
                  cx="144"
                  cy="144"
                  r="130"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="816.8"
                  strokeDashoffset={816.8 - (816.8 * progress) / 100}
                  className="text-emergency"
                  strokeLinecap="round"
                />
              </svg>

              <motion.button
                onMouseDown={handleStartPress}
                onMouseUp={handleEndPress}
                onMouseLeave={handleEndPress}
                onTouchStart={handleStartPress}
                onTouchEnd={handleEndPress}
                whileTap={{ scale: 0.92 }}
                className={`w-60 h-60 rounded-full flex flex-col items-center justify-center z-10 shadow-2xl transition-colors duration-500 ${
                  isPressing ? 'bg-red-700' : 'bg-emergency'
                }`}
              >
                <AlertTriangle size={64} color="white" className="mb-2" />
                <span className="text-white font-black text-2xl">SOCORRO</span>
                <span className="text-white/80 text-xs font-bold mt-1">RCP URGENTE</span>
              </motion.button>
              
              {isPressing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-16 text-emergency font-bold animate-pulse text-lg"
                >
                  SOLTANDO EN {Math.ceil((HOLD_DURATION - (progress * HOLD_DURATION / 100)) / 1000)}s...
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white rounded-3xl shadow-xl p-8 border-2 border-emergency text-center"
          >
            <div className="w-20 h-20 bg-red-50 text-emergency rounded-full flex items-center justify-center mx-auto mb-6">
              <HandHelping size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Alerta Activada</h2>
            <p className="text-gray-600 mb-6">Estamos notificando a los respondedores en tu zona. Mantén la calma.</p>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="text-info shrink-0" size={20} />
                <span className="text-sm font-medium">Buscando rescatistas a menos de 1km...</span>
              </div>
            </div>

            <button 
              onClick={() => setIsEmergencyActive(false)}
              className="mt-8 text-gray-400 font-bold hover:text-gray-600 transition"
            >
              Cancelar Alerta
            </button>
          </motion.div>
        )}

        {error && (
          <div className="mt-8 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
      </main>

      <footer className="w-full py-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-xs font-bold text-gray-500">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          SISTEMA ACTIVO LOCAL
        </div>
      </footer>
    </div>
  );
};

export default Home;
