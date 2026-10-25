import { useCart, calculateItemTotal } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShoppingCart, 
  CreditCard, QrCode, MessageSquare, Coins,
  CheckCircle, Copy, Check, MessageCircle, ExternalLink,
  Building2, ShieldCheck, MapPin, Calendar, Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getShippingZones, API_URL } from '../services/api';
import type { ShippingZone } from '../services/api';

const VIBRANFRUT_ALIAS = 'vibranfrut.mp';
const VIBRANFRUT_CBU = '0000003100012345678901';
const VIBRANFRUT_HOLDER = 'VIBRANFRUT S.R.L.';
const VIBRANFRUT_CUIT = '30-71829384-9';
const WHATSAPP_PHONE = '5491112345678';

export const Cart = () => {
  const { cartItems, removeFromCart, increaseItem, decreaseItem, cartTotal, clearCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Datos de Entrega
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeRange, setDeliveryTimeRange] = useState('09:00 - 13:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('');

  // Medios de pago: 'mercadopago' | 'qr' | 'transfer' | 'cash'
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'qr' | 'transfer' | 'cash'>('mercadopago');
  const [orderNotes, setOrderNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [cashChangeNote, setCashChangeNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modal de confirmación
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: number;
    paymentMethod: 'mercadopago' | 'qr' | 'transfer' | 'cash';
    total: number;
    deliveryDate: string;
    deliveryTimeRange: string;
    deliveryAddress: string | null;
    orderNotes?: string;
  } | null>(null);

  useEffect(() => {
    getShippingZones().then(data => setZones(data.filter(z => z.isActive)));
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const shippingCost = selectedZone ? Number(selectedZone.price) : 0;
  const finalTotal = cartTotal + shippingCost;

  const formatPriceAR = (val: number) => {
    return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!deliveryDate) {
      setError('Por favor selecciona una fecha de entrega.');
      return;
    }

    if (selectedZoneId !== '' && !deliveryAddress.trim()) {
      setError('Por favor ingresa tu dirección exacta de entrega.');
      return;
    }

    setIsCheckingOut(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/orders/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.cartQuantity
          })),
          deliveryDate,
          deliveryTimeRange,
          shippingZoneId: selectedZoneId === '' ? null : Number(selectedZoneId),
          deliveryAddress: selectedZoneId === '' ? null : deliveryAddress,
          paymentMethod,
          cashChangeNote: paymentMethod === 'cash' ? cashChangeNote.trim() : undefined,
          orderNotes: orderNotes.trim() || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error procesando el pedido');
      }

      const data = await response.json();
      clearCart();

      // Si seleccionó Mercado Pago, redirigir inmediatamente a la pasarela oficial
      if (paymentMethod === 'mercadopago') {
        if (data.initPoint) {
          window.location.href = data.initPoint;
        } else {
          throw new Error('No se pudo generar el enlace de pago de Mercado Pago');
        }
      } else {
        // Para QR, Transferencia o Efectivo, mostrar pantalla de confirmación con datos
        setConfirmedOrder({
          orderId: data.orderId,
          paymentMethod,
          total: finalTotal,
          deliveryDate,
          deliveryTimeRange,
          deliveryAddress: selectedZoneId === '' ? 'Retiro en Local' : deliveryAddress,
          orderNotes: orderNotes.trim() || undefined
        });
        setIsCheckingOut(false);
      }

    } catch (err: any) {
      setError(err.message);
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0 && !confirmedOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-slate-100 p-8 rounded-full mb-6">
          <ShoppingBag className="w-16 h-16 text-slate-400" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">Tu carrito está vacío</h2>
        <p className="text-slate-500 mb-8 max-w-md">Parece que aún no has añadido ninguna de nuestras deliciosas frutas frescas a tu pedido.</p>
        <Link to="/productos" className="btn-gradient text-white px-8 py-3 rounded-full font-bold shadow-lg">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  // Generador de QR dinámico interoperable
  const qrDataText = `https://link.mercadopago.com.ar/vibranfrut?amount=${finalTotal.toFixed(2)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrDataText)}`;

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      
      {/* TÍTULO PRINCIPAL */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-sm">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Finalizar Pedido
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Revisa tus productos, selecciona tu forma de entrega y medio de pago preferido
            </p>
          </div>
        </div>

        <Link
          to="/productos"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all"
        >
          + Agregar más productos
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl mb-8 font-bold text-xs border border-rose-200 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* GRID PRINCIPAL: 2 Columnas Izquierda (Productos, Entrega, Medios de Pago) + 1 Columna Derecha (Resumen Sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA (2/3) - Llena todo el espacio principal */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECCIÓN 1: PRODUCTOS EN EL CARRITO */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>🧺 Tus Productos</span>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {cartItems.length} {cartItems.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <img 
                    src={item.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=10b981&color=fff`} 
                    alt={item.name} 
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=10b981&color=fff`;
                    }}
                    className="w-20 h-20 rounded-2xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                  />
                  <div className="flex-grow text-center sm:text-left">
                    {item.formatLabel && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1 border border-emerald-100">
                        {item.formatLabel}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-800">{item.name}</h3>
                    <p className="text-slate-400 text-xs font-medium">
                      {item.purchaseMode === 'unit' && item.unit === 'kg' 
                        ? `$${(Number(item.price) * (item.unitFactor || 0.25)).toFixed(2)} / unid.`
                        : `$${Number(item.price).toFixed(2)} / ${item.unit || 'kg'}`
                      }
                    </p>
                    <p className="text-emerald-600 font-black text-sm mt-0.5">
                      Subtotal: ${calculateItemTotal(item).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200">
                      <button 
                        onClick={() => decreaseItem(item.id)} 
                        className="p-1.5 text-slate-500 hover:text-emerald-600 transition-colors"
                        title="Disminuir"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="min-w-[60px] text-center font-bold text-xs text-slate-800 px-1">
                        {(() => {
                          const isUnit = item.purchaseMode === 'unit' || item.formatLabel?.toLowerCase().includes('unid') || item.unit === 'und';
                          if (isUnit) {
                            const factor = item.unitFactor || (item.unit === 'kg' ? 0.25 : 1.0);
                            const count = item.unitCount || Math.max(1, Math.round(item.cartQuantity / factor));
                            return `${count} unid.`;
                          }
                          return item.cartQuantity === 0.5 ? '1/2 kg' : `${item.cartQuantity} kg`;
                        })()}
                      </span>
                      <button 
                        onClick={() => increaseItem(item.id)} 
                        className="p-1.5 text-slate-500 hover:text-emerald-600 transition-colors"
                        title="Aumentar"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DE ENTREGA Y ENVÍO */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Datos de Entrega y Envío</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Zona de Entrega
                </label>
                <select 
                  value={selectedZoneId}
                  onChange={e => setSelectedZoneId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-xs text-slate-800 outline-none bg-white cursor-pointer"
                >
                  <option value="">Retiro en Local (Gratis)</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name} (+${Number(z.price).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fecha de Entrega / Retiro</span>
                </label>
                <input 
                  type="date" 
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-xs text-slate-800 outline-none bg-white cursor-pointer"
                />
              </div>

              {selectedZoneId !== '' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Dirección Exacta de Entrega
                  </label>
                  <input 
                    type="text" 
                    placeholder="Calle, Altura, Piso, Departamento, Timbre..."
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-xs text-slate-800 outline-none"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Franja Horaria Preferida</span>
                </label>
                <select 
                  value={deliveryTimeRange}
                  onChange={e => setDeliveryTimeRange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 font-bold text-xs text-slate-800 outline-none bg-white cursor-pointer"
                >
                  <option value="09:00 - 13:00">Mañana (09:00 a 13:00 hs)</option>
                  <option value="13:00 - 17:00">Tarde (13:00 a 17:00 hs)</option>
                  <option value="17:00 - 20:00">Noche (17:00 a 20:00 hs)</option>
                </select>
              </div>
            </div>

            {/* NOTAS DE PEDIDO */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Instrucciones o notas adicionales (Opcional)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditingNotes) setTempNotes(orderNotes);
                    setIsEditingNotes(!isEditingNotes);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  {orderNotes ? 'Editar nota' : '+ Agregar nota'}
                </button>
              </div>

              {orderNotes && !isEditingNotes && (
                <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <span className="italic">"{orderNotes}"</span>
                  <button
                    type="button"
                    onClick={() => { setOrderNotes(''); setTempNotes(''); }}
                    className="text-rose-600 hover:text-rose-800 font-bold text-xs ml-2"
                  >
                    Quitar
                  </button>
                </div>
              )}

              {isEditingNotes && (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Ej: Timbre blanco de arriba, dejar al encargado, fruta madura para consumir en el día..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderNotes(tempNotes.trim());
                        setIsEditingNotes(false);
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* SECCIÓN 3: SELECCIÓN DEL MEDIO DE PAGO */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Selecciona tu Medio de Pago</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Elige cómo deseas abonar tu compra</p>
              </div>
            </div>

            {/* OPCIONES DE PAGO */}
            <div className="space-y-3.5">
              
              {/* 1. MERCADO PAGO (REDIRECCIÓN A WEB O APP) */}
              <div 
                onClick={() => setPaymentMethod('mercadopago')}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'mercadopago'
                    ? 'border-[#009ee3] bg-sky-50/40 shadow-xs ring-2 ring-sky-200/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'mercadopago' ? 'border-2 border-[#009ee3]' : 'border border-slate-400 bg-white'
                    }`}>
                      {paymentMethod === 'mercadopago' && <div className="w-2.5 h-2.5 rounded-full bg-[#009ee3]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">Mercado Pago</span>
                        <span className="text-[10px] font-bold text-[#007eb5] bg-[#009ee3]/10 px-2 py-0.5 rounded-md uppercase">
                          Redirección Web o App
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Abona con dinero en cuenta, tarjeta de débito o crédito en cuotas. Al presionar el botón serás redirigido a la web o app oficial de Mercado Pago para abonar de forma segura.
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#009ee3]/10 text-[#009ee3] flex items-center justify-center shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* 2. PAGO CON CÓDIGO QR (INTEROPERABLE) */}
              <div 
                onClick={() => setPaymentMethod('qr')}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'qr'
                    ? 'border-purple-600 bg-purple-50/40 shadow-xs ring-2 ring-purple-200/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'qr' ? 'border-2 border-purple-600' : 'border border-slate-400 bg-white'
                    }`}>
                      {paymentMethod === 'qr' && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">Pagar con Código QR</span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md uppercase">
                          Interoperable • Todas las billeteras
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Escaneá el código QR desde Mercado Pago, MODO, Cuenta DNI, BNA+, Galicia, Santander, BBVA o cualquier billetera virtual.
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>

                {/* Previsualización del QR cuando está seleccionado */}
                {paymentMethod === 'qr' && (
                  <div className="mt-4 pt-4 border-t border-purple-100 flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-2xl border border-purple-200/70" onClick={e => e.stopPropagation()}>
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                      <img 
                        src={qrImageUrl} 
                        alt="Código QR de Pago Vibranfrut"
                        className="w-36 h-36 rounded-xl object-contain mx-auto" 
                      />
                    </div>
                    <div className="space-y-2 text-center sm:text-left flex-grow">
                      <p className="text-xs font-black text-purple-900">
                        📱 Escaneá con la cámara o app bancaria
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Total exacto a pagar: <strong className="text-slate-900 font-black text-sm">${formatPriceAR(finalTotal)}</strong>. 
                        Al escanear el QR, tu app cargará el importe y destinatario en el acto.
                      </p>
                      <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                        <span className="text-[11px] text-slate-500 font-bold">Alias alternativo:</span>
                        <span className="font-mono font-black text-xs text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {VIBRANFRUT_ALIAS}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(VIBRANFRUT_ALIAS, 'qr-alias')}
                          className="p-1 text-purple-700 hover:text-purple-900 rounded hover:bg-purple-100 cursor-pointer"
                          title="Copiar alias"
                        >
                          {copiedField === 'qr-alias' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. TRANSFERENCIA BANCARIA */}
              <div 
                onClick={() => setPaymentMethod('transfer')}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'transfer'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-200/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'transfer' ? 'border-2 border-emerald-600' : 'border border-slate-400 bg-white'
                    }`}>
                      {paymentMethod === 'transfer' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">Transferencia Bancaria</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-[#bef264] px-2 py-0.5 rounded-md uppercase">
                          CBU / Alias directo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Transfiere desde tu home banking o billetera virtual. Al confirmar tu pedido podrás enviarnos el comprobante por WhatsApp.
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Datos de transferencia cuando está seleccionada */}
                {paymentMethod === 'transfer' && (
                  <div className="mt-4 pt-4 border-t border-emerald-100 space-y-2.5 bg-white p-4 rounded-2xl border border-emerald-200/70" onClick={e => e.stopPropagation()}>
                    <p className="text-xs font-black text-slate-800">
                      Datos de la cuenta de Vibranfrut:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Alias</span>
                          <span className="font-mono font-black text-slate-900 text-xs">{VIBRANFRUT_ALIAS}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(VIBRANFRUT_ALIAS, 'trans-alias')}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="Copiar alias"
                        >
                          {copiedField === 'trans-alias' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">CBU / CVU</span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">{VIBRANFRUT_CBU}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(VIBRANFRUT_CBU, 'trans-cbu')}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="Copiar CBU"
                        >
                          {copiedField === 'trans-cbu' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span><strong>Titular:</strong> {VIBRANFRUT_HOLDER}</span>
                      <span><strong>CUIT:</strong> {VIBRANFRUT_CUIT}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. EFECTIVO CONTRA ENTREGA */}
              <div 
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-2 ring-amber-200/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'cash' ? 'border-2 border-amber-500' : 'border border-slate-400 bg-white'
                    }`}>
                      {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">Efectivo contra entrega</span>
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md uppercase">
                          Al recibir o retirar
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Abonas en efectivo en mano al repartidor cuando llega a tu domicilio, o en el mostrador si retiras en nuestro local.
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="mt-4 pt-4 border-t border-amber-100 bg-white p-4 rounded-2xl border border-amber-200/70" onClick={e => e.stopPropagation()}>
                    <label className="block text-slate-700 font-black text-xs mb-1.5">
                      ¿Con cuánto dinero vas a pagar? (Opcional para preparar tu cambio)
                    </label>
                    <input 
                      type="text"
                      placeholder="Ej: Pago con $20.000 para preparar cambio exacto"
                      value={cashChangeNote}
                      onChange={(e) => setCashChangeNote(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-xs font-bold"
                    />
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* COLUMNA DERECHA (1/3) - RESUMEN DEL PEDIDO STICKY */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm sticky top-28 space-y-6">
            
            <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Resumen de Compra</span>
              <span className="text-xs font-bold text-slate-400 font-mono">#{cartItems.length} items</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal de productos</span>
                <span className="font-bold text-slate-800">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Costo de Envío</span>
                <span className={shippingCost === 0 ? "text-emerald-600 font-black" : "text-slate-800 font-bold"}>
                  {shippingCost === 0 ? '¡Gratis! (Retiro en Local)' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
              <div>
                <span className="text-[11px] text-slate-400 font-black uppercase tracking-wider block">Total a Pagar</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                  ${finalTotal.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg">
                ARS
              </span>
            </div>

            {/* BOTÓN PRINCIPAL DE PAGO / CONFIRMACIÓN */}
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                paymentMethod === 'mercadopago'
                  ? 'bg-[#009ee3] hover:bg-[#008ec9] text-white shadow-sky-600/30'
                  : paymentMethod === 'qr'
                  ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-900/30'
                  : paymentMethod === 'transfer'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
              }`}
            >
              {isCheckingOut ? (
                <span>Procesando pedido...</span>
              ) : (
                <>
                  {paymentMethod === 'mercadopago' && (
                    <>
                      <span>Pagar en Mercado Pago</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                  {paymentMethod === 'qr' && (
                    <>
                      <span>Confirmar y Ver QR</span>
                      <QrCode className="w-4 h-4" />
                    </>
                  )}
                  {paymentMethod === 'transfer' && (
                    <>
                      <span>Confirmar por Transferencia</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {paymentMethod === 'cash' && (
                    <>
                      <span>Confirmar en Efectivo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Transacción 100% Segura • Vibranfrut</span>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN DE PEDIDO */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
            
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                confirmedOrder.paymentMethod === 'qr'
                  ? 'bg-purple-100 text-purple-700'
                  : confirmedOrder.paymentMethod === 'transfer'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {confirmedOrder.paymentMethod === 'qr' ? (
                  <QrCode className="w-9 h-9" />
                ) : (
                  <CheckCircle className="w-9 h-9" />
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-900">
                {confirmedOrder.paymentMethod === 'qr' 
                  ? '¡Pedido Registrado! Escaneá tu QR' 
                  : confirmedOrder.paymentMethod === 'transfer'
                  ? '¡Pedido Registrado por Transferencia!'
                  : '¡Pedido Confirmado en Efectivo!'}
              </h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">
                {confirmedOrder.paymentMethod === 'qr' 
                  ? 'Abona escaneando el código QR desde cualquier app bancaria o billetera virtual.' 
                  : confirmedOrder.paymentMethod === 'transfer'
                  ? 'Realizá la transferencia a la cuenta de Vibranfrut y envíanos el comprobante.'
                  : 'Tu pedido ya fue agendado para abonar en efectivo al momento de la entrega.'}
              </p>
            </div>

            {/* DETALLES DEL PEDIDO */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span className="font-bold">Número de Pedido:</span>
                <span className="font-black text-slate-900 text-sm">#{confirmedOrder.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-bold">Total a Abonar:</span>
                <span className="font-black text-emerald-600 text-base">${confirmedOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Fecha y Horario:</span>
                <span className="font-bold text-slate-800">{confirmedOrder.deliveryDate} ({confirmedOrder.deliveryTimeRange})</span>
              </div>
              {confirmedOrder.deliveryAddress && (
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Destino:</span>
                  <span className="font-bold text-slate-800 text-right">{confirmedOrder.deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* QR EN EL MODAL SI SELECCIONÓ QR */}
            {confirmedOrder.paymentMethod === 'qr' && (
              <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-5 mb-5 text-center space-y-3">
                <div className="bg-white p-2.5 rounded-2xl border border-purple-200 shadow-sm inline-block">
                  <img 
                    src={qrImageUrl} 
                    alt="Código QR de Pago" 
                    className="w-48 h-48 rounded-xl object-contain mx-auto"
                  />
                </div>
                <p className="text-xs font-bold text-purple-900">
                  Monto: <strong>${formatPriceAR(confirmedOrder.total)}</strong> • Pedido #{confirmedOrder.orderId}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <span>Alias: <strong>{VIBRANFRUT_ALIAS}</strong></span>
                  <button
                    onClick={() => handleCopy(VIBRANFRUT_ALIAS, 'modal-qr-alias')}
                    className="p-1 text-purple-700 hover:text-purple-900 rounded cursor-pointer"
                    title="Copiar alias"
                  >
                    {copiedField === 'modal-qr-alias' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* DATOS BANCARIOS EN EL MODAL SI ES TRANSFERENCIA */}
            {confirmedOrder.paymentMethod === 'transfer' && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-5 space-y-2 text-xs">
                <p className="font-black text-emerald-900">Datos bancarios para transferir:</p>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Alias:</span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-emerald-800">
                    <span>{VIBRANFRUT_ALIAS}</span>
                    <button 
                      onClick={() => handleCopy(VIBRANFRUT_ALIAS, 'modal-trans-alias')} 
                      className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer"
                      title="Copiar Alias"
                    >
                      {copiedField === 'modal-trans-alias' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>CBU:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-[11px]">
                    <span>{VIBRANFRUT_CBU}</span>
                    <button 
                      onClick={() => handleCopy(VIBRANFRUT_CBU, 'modal-trans-cbu')} 
                      className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer"
                      title="Copiar CBU"
                    >
                      {copiedField === 'modal-trans-cbu' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Titular:</span>
                  <span className="font-bold">{VIBRANFRUT_HOLDER}</span>
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN: WHATSAPP Y MIS PEDIDOS */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
                  confirmedOrder.paymentMethod === 'qr'
                    ? `Hola VibranFrut! Acabo de registrar el pedido #${confirmedOrder.orderId} por $${confirmedOrder.total.toFixed(2)} mediante Código QR. Les adjunto el comprobante de pago.`
                    : confirmedOrder.paymentMethod === 'transfer'
                    ? `Hola VibranFrut! Acabo de registrar el pedido #${confirmedOrder.orderId} por $${confirmedOrder.total.toFixed(2)} mediante Transferencia bancaria. Les adjunto el comprobante de pago.`
                    : `Hola VibranFrut! Acabo de confirmar el pedido #${confirmedOrder.orderId} por $${confirmedOrder.total.toFixed(2)} para abonar en efectivo al momento de la entrega.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {confirmedOrder.paymentMethod === 'cash' ? 'Avisar por WhatsApp' : 'Enviar Comprobante por WhatsApp'}
                </span>
              </a>

              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  navigate('/profile');
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                Ver Estado en Mis Pedidos
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};