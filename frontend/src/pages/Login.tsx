import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, googleLogin as googleLoginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login = () => {
  const navigate = useNavigate();
  const { loginState } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      loginState(data.token, data.user);
      
      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/30">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-center text-slate-800 mb-2">Bienvenido</h1>
        <p className="text-center text-slate-500 mb-8 font-medium">Inicia sesión en tu cuenta</p>
        
        {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-4 font-bold text-center">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" 
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" 
              placeholder="••••••••"
            />
          </div>
          
          <div className="pt-4">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
              Ingresar
            </button>
          </div>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500 font-medium">O continúa con</span>
          </div>
        </div>

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
                setError(err.message);
              }
            }}
            onError={() => {
              setError('Ocurrió un error al conectar con Google.');
            }}
            useOneTap
            shape="pill"
          />
        </div>
        
        <div className="mt-6 text-center text-sm text-slate-500 font-medium">
          <p>Cuentas de prueba:</p>
          <p>admin@vibranfrut.com (pass: admin123)</p>
          <p>cliente@vibranfrut.com (pass: cliente123)</p>
        </div>
      </div>
    </div>
  );
};
