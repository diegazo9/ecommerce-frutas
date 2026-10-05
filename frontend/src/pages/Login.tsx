import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, registerUser, googleLogin as googleLoginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, UserPlus, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login = () => {
  const navigate = useNavigate();
  const { loginState } = useAuth();
  
  // Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Estados de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados de Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [currentCaptchaCode, setCurrentCaptchaCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Función para generar un nuevo código Captcha visual
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentCaptchaCode(code);
    setUserCaptchaInput('');
    drawCaptcha(code);
  };

  // Dibujar el Captcha en el elemento Canvas con distorsión y líneas de seguridad
  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo degradado primaveral
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f0fdf4');
    gradient.addColorStop(0.5, '#fef9c3');
    gradient.addColorStop(1, '#ffe4e6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Líneas de ruido/distorsión aleatorias
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.4)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Puntos de ruido
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(16, 185, 129, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar cada letra con ángulo y color aleatorio
    ctx.font = 'bold 24px monospace';
    ctx.textBaseline = 'middle';

    const colors = ['#047857', '#b45309', '#be123c', '#1d4ed8'];
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.save();
      const x = 18 + i * 24;
      const y = canvas.height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180);
      
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    if (activeTab === 'register') {
      setTimeout(() => generateCaptcha(), 50);
    }
    setError(null);
    setSuccessMsg(null);
  }, [activeTab]);

  // Manejar Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(loginEmail, loginPassword);
      loginState(data.token, data.user);
      
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Manejar Registro con validación de Captcha
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validar coincidencia de contraseñas
    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Validar Captcha
    if (!userCaptchaInput.trim()) {
      setError('Por favor, ingresa el código Captcha de la imagen.');
      return;
    }

    if (userCaptchaInput.trim().toUpperCase() !== currentCaptchaCode.toUpperCase()) {
      setError('El código Captcha es incorrecto. Intenta con el nuevo código generado.');
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(regName, regEmail, regPassword);
      
      if (data.token && data.user) {
        loginState(data.token, data.user);
        setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo...');
        setTimeout(() => {
          navigate('/profile');
        }, 1200);
      } else {
        setSuccessMsg('¡Registro completado! Ya puedes iniciar sesión.');
        setActiveTab('login');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-10">
      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-9 rounded-[2.5rem] shadow-xl border border-emerald-100 max-w-md w-full relative overflow-hidden">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/25 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/25 rounded-full blur-2xl pointer-events-none"></div>

        {/* Ícono de cabecera */}
        <div className="flex justify-center mb-5 relative z-10">
          <div className="bg-gradient-to-tr from-emerald-500 via-lime-500 to-amber-400 p-3.5 rounded-2xl text-white shadow-md shadow-emerald-200">
            {activeTab === 'login' ? <Lock className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
        </div>

        <h1 className="text-2xl font-black text-center text-slate-900 mb-1 tracking-tight">
          {activeTab === 'login' ? 'Bienvenido a VibranFrut 🍓' : 'Crea tu Cuenta 🌸'}
        </h1>
        <p className="text-center text-slate-500 mb-6 text-xs sm:text-sm font-medium">
          {activeTab === 'login' ? 'Ingresa para disfrutar de tus frutas frescas' : 'Únete para pedir directo del huerto a tu mesa'}
        </p>

        {/* Selector de Pestañas: Login vs Registro */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-white text-emerald-700 shadow-sm scale-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-white text-emerald-700 shadow-sm scale-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Crear Cuenta
          </button>
        </div>
        
        {error && (
          <p className="text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs sm:text-sm mb-4 font-bold text-center">
            {error}
          </p>
        )}

        {successMsg && (
          <p className="text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs sm:text-sm mb-4 font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </p>
        )}
        
        {/* ================= FORMULARIO DE LOGIN ================= */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" 
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                required
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" 
                placeholder="••••••••"
              />
            </div>
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-gradient w-full py-3 rounded-xl font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Ingresando...' : 'Ingresar a mi Cuenta'}
              </button>
            </div>
          </form>
        ) : (
          /* ================= FORMULARIO DE REGISTRO CON CAPTCHA ================= */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required
                value={regName} 
                onChange={e => setRegName(e.target.value)} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium" 
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                value={regEmail} 
                onChange={e => setRegEmail(e.target.value)} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium" 
                placeholder="juan@email.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  required
                  value={regPassword} 
                  onChange={e => setRegPassword(e.target.value)} 
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium" 
                  placeholder="Mín. 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar</label>
                <input 
                  type="password" 
                  required
                  value={regConfirmPassword} 
                  onChange={e => setRegConfirmPassword(e.target.value)} 
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium" 
                  placeholder="Repite contraseña"
                />
              </div>
            </div>

            {/* SECCIÓN DEL CAPTCHA VISUAL */}
            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verificación de Seguridad (Captcha)
                </span>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                  title="Generar nuevo código"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Nuevo</span>
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <canvas 
                  ref={canvasRef} 
                  width={150} 
                  height={44} 
                  className="rounded-xl border border-emerald-200 shadow-2xs select-none"
                />
                <input 
                  type="text" 
                  required
                  maxLength={5}
                  value={userCaptchaInput}
                  onChange={e => setUserCaptchaInput(e.target.value)}
                  placeholder="Escribe el código"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-black tracking-widest uppercase bg-white"
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center font-medium">
                Escribe los 5 caracteres que ves en la imagen para comprobar que eres humano.
              </p>
            </div>
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-gradient w-full py-3 rounded-xl font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Creando cuenta...' : 'Registrarme y Crear Cuenta'}
              </button>
            </div>
          </form>
        )}

        {/* Separador Google */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-500 font-bold uppercase tracking-wider">O continúa con</span>
          </div>
        </div>

        {/* Botón oficial de Google OAuth */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                if (credentialResponse.credential) {
                  const data = await googleLoginApi(credentialResponse.credential);
                  loginState(data.token, data.user);
                  
                  if (data.user.role === 'ADMIN') {
                    navigate('/admin');
                  } else {
                    navigate('/profile');
                  }
                }
              } catch (err: any) {
                setError(err.message || 'Error con Google');
              }
            }}
            onError={() => {
              setError('Ocurrió un error al conectar con Google.');
            }}
            shape="pill"
            text={activeTab === 'login' ? 'signin_with' : 'signup_with'}
          />
        </div>
      </div>
    </div>
  );
};
