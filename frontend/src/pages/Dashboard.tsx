import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Power, 
  MapPin, 
  Bell, 
  LogOut, 
  Map as MapIcon, 
  AlertCircle,
  Navigation,
  Award,
  CheckCircle
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [newEmergency, setNewEmergency] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Conectar Socket - Usamos la URL de la API pero sin el sufijo /api
    const socketUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      console.log('Socket conectado');
      setIsConnecting(false);
    });

    socketRef.current.on('emergency:new', (emergency: any) => {
      console.log('¡Emergencia recibida!', emergency);
      // Solo mostramos si el respondedor está disponible
      // (En producción la lógica de cercanía se hace en el server, 
      // pero aquí el server envía a la sala 'responders')
      setNewEmergency(emergency);
      
      // Reproducir sonido si fuera posible
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.play();
      } catch (e) {}
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const toggleAvailability = () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);

    if (newStatus) {
      // Unirse a la sala de respondedores en el servidor
      socketRef.current?.emit('join_responders');
      
      // Empezar a vigilar ubicación
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newLoc);
          // Enviar ubicación al servidor (opcional por ahora, 
          // pero útil para el geo-matching real)
          console.log('Ubicación actualizada:', newLoc);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emergency rounded-xl flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-dark leading-none">RCP ALERT</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Respondedor</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 transition"
        >
          <LogOut size={22} />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 z-0" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-dark mb-1">
              Hola, {user?.first_name || 'Respondedor'}!
            </h2>
            <p className="text-gray-500 text-sm font-medium flex items-center gap-1">
              <Award size={14} className="text-info" />
              Certificación verificada
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className={`rounded-3xl p-8 shadow-xl transition-all duration-500 border-2 ${
          isAvailable 
            ? 'bg-success/10 border-success shadow-success/20' 
            : 'bg-white border-gray-100 shadow-gray-200/50'
        }`}>
          <div className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${
              isAvailable ? 'bg-success text-white shadow-lg shadow-success/40' : 'bg-gray-100 text-gray-400'
            }`}>
              <Power size={32} />
            </div>
            
            <h3 className="text-xl font-bold mb-2">
              {isAvailable ? 'ESTÁS EN LÍNEA' : 'ESTÁS DESCONECTADO'}
            </h3>
            <p className="text-gray-500 text-sm mb-8 px-4">
              {isAvailable 
                ? 'Recibirás alertas de emergencias de RCP en un radio de 1km.' 
                : 'Activa tu disponibilidad para empezar a recibir alertas de auxilio.'}
            </p>

            <button
              onClick={toggleAvailability}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transform active:scale-95 transition-all ${
                isAvailable 
                  ? 'bg-white text-success border-2 border-success hover:bg-success hover:text-white' 
                  : 'bg-dark text-white hover:bg-black shadow-dark/30'
              }`}
            >
              {isAvailable ? 'PONERSE OFFLINE' : 'PONERSE DISPONIBLE'}
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-info mb-2"><MapPin size={20} /></div>
            <div className="text-[10px] font-black text-gray-400 uppercase">Ubicación</div>
            <div className="text-xs font-bold text-dark truncate">
              {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Obteniendo...'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-warning mb-2"><Bell size={20} /></div>
            <div className="text-[10px] font-black text-gray-400 uppercase">Estado</div>
            <div className="text-xs font-bold text-dark">
              {isConnecting ? 'Conectando...' : 'Servidor OK'}
            </div>
          </div>
        </div>
      </main>

      {/* EMERGENCY ALERT MODAL */}
      <AnimatePresence>
        {newEmergency && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-dark/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="bg-emergency p-8 text-center text-white relative">
                <div className="absolute top-4 right-6 animate-ping">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <AlertCircle size={64} className="mx-auto mb-4" />
                <h2 className="text-3xl font-black leading-tight">¡ALERTA DE RCP RECIBIDA!</h2>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                    <MapIcon size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Ubicación</h4>
                    <p className="text-sm font-bold text-dark">A menos de 1km de tu posición actual</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${newEmergency.location_lat},${newEmergency.location_lng}&travelmode=walking`;
                      window.open(url, '_blank');
                    }}
                    className="w-full bg-info text-white font-black py-4 rounded-2xl shadow-lg shadow-info/30 flex items-center justify-center gap-2"
                  >
                    <Navigation size={20} />
                    VER RUTA EN MAPA
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Finalizar ayuda (Lógica simple para MVP)
                      setNewEmergency(null);
                      alert("Has finalizado la asistencia. ¡Buen trabajo!");
                    }}
                    className="w-full bg-success text-white font-black py-4 rounded-2xl shadow-lg shadow-success/30 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    FINALIZAR ASISTENCIA
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
