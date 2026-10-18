import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail, 
  ArrowRight, 
  ShoppingBag,
  Send
} from 'lucide-react';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { loginState } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extraer token de URL (soporte tanto para querystrings directos como en hash #/verify-email?token=...)
  useEffect(() => {
    let token = searchParams.get('token');
    
    // Si no está en searchParams (por HashRouter), buscarlo en window.location.hash
    if (!token && window.location.hash.includes('token=')) {
      const match = window.location.hash.match(/[?&]token=([^&]+)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      setStatus('error');
      setMessage('No se encontró el token de validación en el enlace. Por favor verifica el link recibido en tu correo.');
      return;
    }

    handleVerify(token);
  }, []);

  const handleVerify = async (token: string) => {
    try {
      setStatus('loading');
      const response = await verifyEmail(token);
      
      setStatus('success');
      setMessage(response.message || '¡Tu correo electrónico ha sido verificado con éxito!');

      // Si el backend nos devolvió un token de sesión, iniciar sesión automáticamente
      if (response.token && response.user) {
        loginState(response.token, response.user);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'El enlace de validación es inválido o ha expirado.');
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes('@')) {
      setResendStatus({ type: 'error', text: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }

    try {
      setResending(true);
      setResendStatus(null);
      const res = await resendVerificationEmail(resendEmail);
      setResendStatus({
        type: 'success',
        text: res.message || '¡Enlace enviado! Revisa tu bandeja de entrada o spam.'
      });
    } catch (err: any) {
      setResendStatus({
        type: 'error',
        text: err.message || 'Error al reenviar el correo de validación.'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10 text-center">
        
        {/* LOGO */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🍏</span>
          <span className="text-2xl font-black tracking-tight text-slate-800">
            Vibran<span className="text-emerald-600">frut</span>
          </span>
        </div>

        {/* ESTADO 1: CARGANDO / VALIDANDO */}
        {status === 'loading' && (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-slate-800">
              Validando tu cuenta...
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
              Estamos confirmando tu dirección de correo electrónico en nuestros servidores. Aguarda unos segundos.
            </p>
          </div>
        )}

        {/* ESTADO 2: ÉXITO */}
        {status === 'success' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100/80 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                ¡Cuenta Verificada!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {message}
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-800 font-bold">
              🎉 Ya puedes realizar tus pedidos y disfrutar de nuestras frutas y verduras frescas con total seguridad.
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/productos"
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Productos</span>
              </Link>
              <Link
                to="/profile"
                className="w-full py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>Mi Perfil</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ESTADO 3: ERROR / EXPIRADO */}
        {status === 'error' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                No pudimos validar tu cuenta
              </h2>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                {message}
              </p>
            </div>

            {/* Formulario de Reenvío de Validación */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>¿Deseas que te enviemos un nuevo enlace?</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Ingresa tu correo y te enviaremos un link de validación nuevo válido por 24 horas.
              </p>

              <form onSubmit={handleResend} className="space-y-2.5">
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-xs outline-none bg-white"
                />

                <button
                  type="submit"
                  disabled={resending}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{resending ? 'Enviando...' : 'Reenviar Enlace de Validación'}</span>
                </button>
              </form>

              {resendStatus && (
                <div className={`p-2.5 rounded-xl text-[11px] font-bold ${
                  resendStatus.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {resendStatus.text}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
              >
                <span>Volver al Inicio de Sesión</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
