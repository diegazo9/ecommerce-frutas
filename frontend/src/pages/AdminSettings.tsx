import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getEmailSettings, 
  updateEmailSettings, 
  testEmailConnection,
  type EmailSettings 
} from '../services/api';
import { 
  Mail, 
  Server, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Store, 
  ShieldCheck, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export const AdminSettings = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'email' | 'store'>('email');

  // Configuración de Correo (Mailcow)
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState(user?.email || 'info@vibranfrut.com.ar');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    host: 'mail.vibranfrut.com.ar',
    port: 587,
    secure: false,
    user: 'info@vibranfrut.com.ar',
    password: '',
    fromName: 'Vibranfrut',
    fromEmail: 'info@vibranfrut.com.ar',
    replyTo: 'info@vibranfrut.com.ar',
    bccAdmin: true,
    sendOnOrder: true,
    sendOnDelivery: true
  });

  // Configuración General
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Vibranfrut',
    contactEmail: 'info@vibranfrut.com.ar',
    whatsapp: '+54 9 11 0000-0000',
    freeShippingThreshold: 20000
  });

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      setEmailLoading(true);
      const data = await getEmailSettings(token || undefined);
      if (data) {
        setEmailSettings(data);
      }
    } catch (err: any) {
      console.warn('Error al cargar ajustes de correo:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEmailSaving(true);
      setStatusMessage(null);
      await updateEmailSettings(emailSettings, token || undefined);
      setStatusMessage({
        type: 'success',
        text: '¡Configuración de correo de Mailcow guardada exitosamente!'
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al guardar la configuración de correo'
      });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      alert('Por favor ingresa un correo electrónico de destino para la prueba');
      return;
    }

    try {
      setEmailTesting(true);
      setStatusMessage(null);
      const res = await testEmailConnection(testEmailAddress, token || undefined);
      setStatusMessage({
        type: 'success',
        text: res.message || `¡Correo de prueba enviado con éxito a ${testEmailAddress}!`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al conectar con Mailcow. Verifica que el host, puerto y credenciales sean correctos.'
      });
    } finally {
      setEmailTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>Configuración del Sistema</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Administra los servidores de correo corporativo, notificaciones automáticas y datos de la tienda
          </p>
        </div>

        {/* Selector de pestañas */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Correo Mailcow & Avisos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'store'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Datos de la Tienda</span>
          </button>
        </div>
      </div>

      {/* Banner de Mensaje de Estado */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-bold text-xs">{statusMessage.text}</span>
        </div>
      )}

      {/* PESTAÑA 1: CONFIGURACIÓN DE CORREO CORPORATIVO MAILCOW */}
      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal de Configuración SMTP (2 columnas) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveEmail} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">
                      Servidor de Correo SMTP (Mailcow Proxmox)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Conexión con tu servidor de correo para envíos automáticos de comprobantes y rutas
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchSettings}
                  className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-slate-50 transition-colors"
                  title="Recargar configuración"
                >
                  <RefreshCw className={`w-4 h-4 ${emailLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Grid de parámetros del Servidor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                    Servidor Host (Mailcow)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: mail.vibranfrut.com.ar o IP interna"
                    value={emailSettings.host}
                    onChange={e => setEmailSettings({ ...emailSettings, host: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Host de tu contenedor Mailcow o FQDN configurado en Proxmox</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                    Puerto
                  </label>
                  <select
                    value={emailSettings.port}
                    onChange={e => {
                      const port = Number(e.target.value);
                      setEmailSettings({ 
                        ...emailSettings, 
                        port,
                        secure: port === 465 
                      });
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm outline-none bg-white cursor-pointer"
                  >
                    <option value={587}>587 (STARTTLS - Recomendado)</option>
                    <option value={465}>465 (SSL / TLS Directo)</option>
                    <option value={25}>25 (SMTP Estándar)</option>
                  </select>
                </div>
              </div>

              {/* Credenciales de la cuenta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Usuario / Cuenta Corporativa</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="info@vibranfrut.com.ar"
                    value={emailSettings.user}
                    onChange={e => setEmailSettings({ ...emailSettings, user: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Contraseña del Buzón</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={emailSettings.password || ''}
                    onChange={e => setEmailSettings({ ...emailSettings, password: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Contraseña de la casilla configurada en Mailcow</p>
                </div>
              </div>

              {/* Identidad del Remitente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                    Nombre del Remitente
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vibranfrut"
                    value={emailSettings.fromName}
                    onChange={e => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nombre que ve el cliente en la bandeja de entrada</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                    Email de Envío y Responder a
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="info@vibranfrut.com.ar"
                    value={emailSettings.fromEmail}
                    onChange={e => setEmailSettings({ 
                      ...emailSettings, 
                      fromEmail: e.target.value,
                      replyTo: emailSettings.replyTo || e.target.value 
                    })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-slate-800 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Opciones y Automatizaciones de Envío */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Automatizaciones de Envío
                </h4>

                <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailSettings.sendOnOrder}
                    onChange={e => setEmailSettings({ ...emailSettings, sendOnOrder: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 accent-emerald-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">
                      Enviar comprobante de compra en PDF con cada pedido
                    </span>
                    <span className="text-xs text-slate-500">
                      Genera automáticamente el comprobante oficial en PDF y se lo envía al correo del cliente cuando realiza su compra.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailSettings.sendOnDelivery}
                    onChange={e => setEmailSettings({ ...emailSettings, sendOnDelivery: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 accent-emerald-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">
                      Avisar al cliente cuando el pedido está en camino 🚚
                    </span>
                    <span className="text-xs text-slate-500">
                      Permite enviar un email con un clic desde el mapa de rutas avisando que el repartidor ya salió hacia su domicilio.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailSettings.bccAdmin}
                    onChange={e => setEmailSettings({ ...emailSettings, bccAdmin: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 accent-emerald-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">
                      Enviar copia oculta (BCC) a info@vibranfrut.com.ar
                    </span>
                    <span className="text-xs text-slate-500">
                      Recibe en tu casilla corporativa una copia de cada pedido para control y seguimiento interno.
                    </span>
                  </div>
                </label>
              </div>

              {/* Botón de Guardar */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {emailSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                  <span>Guardar Configuración de Correo</span>
                </button>
              </div>

            </form>
          </div>

          {/* Columna Derecha: Probador en Vivo de Conexión Mailcow (1 columna) */}
          <div className="space-y-6">
            
            {/* Tarjeta de Prueba de Conexión */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Send className="w-4 h-4" />
                <span>Probar Conexión con Mailcow</span>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Envía un correo de prueba instantáneo a tu casilla para verificar que el puerto, usuario y contraseña de Mailcow respondan correctamente.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Enviar prueba a:
                  </label>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={e => setTestEmailAddress(e.target.value)}
                    placeholder="tu-correo@gmail.com o info@vibranfrut.com.ar"
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={emailTesting}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  {emailTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{emailTesting ? 'Probando conexión...' : 'Enviar Correo de Prueba'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400 space-y-1">
                <p>🔹 <strong>Servidor:</strong> {emailSettings.host || 'No configurado'}</p>
                <p>🔹 <strong>Puerto:</strong> {emailSettings.port} ({emailSettings.port === 465 ? 'SSL' : 'STARTTLS'})</p>
                <p>🔹 <strong>Remitente:</strong> {emailSettings.fromEmail}</p>
              </div>
            </div>

            {/* Ayuda y Consejos Mailcow */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Tips para Mailcow en Proxmox</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span><strong>Puerto 587:</strong> Recomendado para envíos autenticados desde aplicaciones web con STARTTLS.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span><strong>Usuario completo:</strong> Asegúrate de ingresar la dirección completa (<code className="text-emerald-700 font-bold">info@vibranfrut.com.ar</code>) como usuario.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span><strong>Comprobantes PDF:</strong> Se adjuntan automáticamente con el diseño de Vibranfrut para que el cliente lo reciba en el acto.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONFIGURACIÓN GENERAL DE LA TIENDA */}
      {activeTab === 'store' && (
        <form onSubmit={(e) => { e.preventDefault(); alert('Ajustes de tienda guardados.'); }} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-black text-slate-800 text-base">Datos Comerciales</h3>
            <p className="text-xs text-slate-400">Información visible para los clientes en el encabezado y pie de página</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre de la Tienda</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-emerald-500"
              value={storeSettings.storeName}
              onChange={e => setStoreSettings({...storeSettings, storeName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email de Atención al Cliente</label>
            <input 
              type="email" 
              className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-emerald-500"
              value={storeSettings.contactEmail}
              onChange={e => setStoreSettings({...storeSettings, contactEmail: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">WhatsApp de Contacto y Pedidos</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-emerald-500"
              value={storeSettings.whatsapp}
              onChange={e => setStoreSettings({...storeSettings, whatsapp: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Monto Mínimo para Envío Gratis ($)</label>
            <input 
              type="number" 
              className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-emerald-500"
              value={storeSettings.freeShippingThreshold}
              onChange={e => setStoreSettings({...storeSettings, freeShippingThreshold: Number(e.target.value)})}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-8 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
