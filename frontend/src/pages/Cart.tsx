import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShoppingCart, 
  Wallet, Smartphone, Banknote, CheckCircle, Copy, Check, MessageCircle, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getShippingZones, API_URL } from '../services/api';
import type { ShippingZone } from '../services/api';

const MODO_ALIAS = 'vibranfrut.mp';
const MODO_CBU = '0000003100012345678901';
const MODO_HOLDER = 'VIBRANFRUT S.R.L.';
const WHATSAPP_PHONE = '5491112345678';

export const Cart = () => {
  const { cartItems, removeFromCart, increaseItem, decreaseItem, cartTotal, clearCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeRange, setDeliveryTimeRange] = useState('09:00 - 13:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('');

  // Formas de pago
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'modo' | 'cash'>('mercadopago');
  const [cashChangeNote, setCashChangeNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: number;
    paymentMethod: 'mercadopago' | 'modo' | 'cash';
    total: number;
    deliveryDate: string;
    deliveryTimeRange: string;
    deliveryAddress: string | null;
  } | null>(null);

  useEffect(() => {
    getShippingZones().then(data => setZones(data.filter(z => z.isActive)));
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const shippingCost = selectedZone ? Number(selectedZone.price) : 0;
  const finalTotal = cartTotal + shippingCost;

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
      setError('Por favor ingresa una dirección de entrega.');
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
          cashChangeNote: paymentMethod === 'cash' ? cashChangeNote.trim() : undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error procesando el pedido');
      }

      const data = await response.json();
      clearCart();

      if (paymentMethod === 'mercadopago') {
        window.location.href = data.initPoint;
      } else {
        setConfirmedOrder({
          orderId: data.orderId,
          paymentMethod,
          total: finalTotal,
          deliveryDate,
          deliveryTimeRange,
          deliveryAddress: selectedZoneId === '' ? 'Retiro en Local' : deliveryAddress
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
        <Link to="/" className="btn-gradient text-white px-8 py-3 rounded-full font-bold shadow-lg">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-4xl font-black text-slate-900 mb-10 flex items-center gap-4">
        <ShoppingCart className="w-10 h-10 text-emerald-500" />
        Tu Carrito
      </h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-semibold border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Lista de Productos */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6">
              <img 
                src={item.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=10b981&color=fff`} 
                alt={item.name} 
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=10b981&color=fff`;
                }}
                className="w-24 h-24 rounded-2xl object-cover bg-slate-50"
              />
              <div className="flex-grow text-center sm:text-left">
                {item.formatLabel && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5 border border-emerald-100">
                    {item.formatLabel}
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                <p className="text-slate-400 text-sm font-medium">
                  {item.purchaseMode === 'unit' && item.unit === 'kg' 
                    ? `$${(Number(item.price) * (item.unitFactor || 0.25)).toFixed(2)} / unid. (aprox. 250g)`
                    : `$${Number(item.price).toFixed(2)} / ${item.unit || 'kg'}`
                  }
                </p>
                <p className="text-emerald-600 font-black text-lg mt-0.5">
                  Subtotal: ${(Number(item.price) * item.cartQuantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => decreaseItem(item.id)} 
                    className="p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                    title="Disminuir"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="min-w-[70px] text-center font-bold text-sm text-slate-800 px-2">
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
                    className="p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                    title="Aumentar"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Columna Derecha: Entrega, Método de Pago y Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 sticky top-28 space-y-6">
            
            {/* 1. SECCIÓN ENTREGA */}
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-4">Entrega</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Zona de Envío</label>
                  <select 
                    value={selectedZoneId}
                    onChange={e => setSelectedZoneId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white text-sm"
                  >
                    <option value="">Retiro en Local (Gratis)</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name} (+${Number(z.price).toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                {selectedZoneId !== '' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Dirección Exacta</label>
                    <input 
                      type="text" 
                      placeholder="Calle, Número, Piso, Depto..."
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Entrega / Retiro</label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Horario Preferido</label>
                  <select 
                    value={deliveryTimeRange}
                    onChange={e => setDeliveryTimeRange(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white text-sm"
                  >
                    <option value="09:00 - 13:00">Mañana (09:00 - 13:00)</option>
                    <option value="13:00 - 17:00">Tarde (13:00 - 17:00)</option>
                    <option value="17:00 - 20:00">Noche (17:00 - 20:00)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. SECCIÓN FORMAS DE PAGO */}
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-3">Forma de Pago</h3>
              <div className="space-y-3">
                
                {/* Opción A: Mercado Pago */}
                <div 
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'mercadopago' 
                      ? 'border-[#009ee3] bg-[#009ee3]/5 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'mercadopago' ? 'bg-[#009ee3] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          Mercado Pago
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#0081b8]">Dinero en Cuenta & QR</span>
                        </p>
                        <p className="text-[11px] text-slate-500">Saldo MP y transferencia</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'mercadopago' ? 'border-[#009ee3] bg-[#009ee3]' : 'border-slate-300'
                    }`}>
                      {paymentMethod === 'mercadopago' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  {paymentMethod === 'mercadopago' && (
                    <div className="mt-2.5 pt-2 border-t border-blue-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#009ee3] shrink-0 mt-0.5" />
                      <span>Solo acepta <strong>dinero en cuenta</strong> y transferencia bancaria/QR. Excluye tarjetas.</span>
                    </div>
                  )}
                </div>

                {/* Opción B: MODO / Transferencia Bancaria */}
                <div 
                  onClick={() => setPaymentMethod('modo')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'modo' 
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'modo' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          MODO / Transferencia
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Apps Bancarias</span>
                        </p>
                        <p className="text-[11px] text-slate-500">QR MODO y CBU / Alias</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'modo' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                    }`}>
                      {paymentMethod === 'modo' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  {paymentMethod === 'modo' && (
                    <div className="mt-2.5 pt-2.5 border-t border-purple-100 space-y-2 text-xs">
                      <p className="text-slate-600 text-[11px] font-medium">
                        Transferí con tu app bancaria (Galicia, Santander, BBVA, etc.) o MODO:
                      </p>
                      <div className="bg-white p-2.5 rounded-xl border border-purple-200 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Alias:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-purple-900">{MODO_ALIAS}</span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCopy(MODO_ALIAS, 'alias'); }}
                              className="text-purple-600 hover:text-purple-800 p-0.5 rounded hover:bg-purple-50"
                              title="Copiar Alias"
                            >
                              {copiedField === 'alias' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">CBU/CVU:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-700 text-[10px]">{MODO_CBU}</span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCopy(MODO_CBU, 'cbu'); }}
                              className="text-purple-600 hover:text-purple-800 p-0.5 rounded hover:bg-purple-50"
                              title="Copiar CBU"
                            >
                              {copiedField === 'cbu' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Titular:</span>
                          <span className="font-semibold text-slate-700">{MODO_HOLDER}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-purple-700 font-medium">
                        * Al confirmar podrás enviar tu comprobante directamente por WhatsApp.
                      </p>
                    </div>
                  )}
                </div>

                {/* Opción C: Efectivo contra entrega */}
                <div 
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          Efectivo
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Al recibir o retirar</span>
                        </p>
                        <p className="text-[11px] text-slate-500">Abonás al momento de la entrega</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {paymentMethod === 'cash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-100 text-xs">
                      <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                        ¿Con cuánto dinero vas a abonar? (Opcional)
                      </label>
                      <input 
                        type="text"
                        placeholder="Ej: $20.000 para preparar cambio exacto"
                        value={cashChangeNote}
                        onChange={(e) => setCashChangeNote(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full p-2 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 text-xs"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 3. SECCIÓN RESUMEN & BOTÓN */}
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-4">Resumen</h3>
              <div className="space-y-3 mb-4 border-b border-slate-200 pb-4 text-sm">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Envío</span>
                  <span className={shippingCost === 0 ? "text-emerald-600 font-bold" : "text-slate-800"}>
                    {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-6">
                <span className="text-slate-500 font-bold">Total</span>
                <span className="text-3xl font-black text-slate-900">${finalTotal.toFixed(2)}</span>
              </div>
              
              <button 
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg transition-all ${
                  paymentMethod === 'modo'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30'
                    : 'btn-gradient text-white shadow-emerald-500/30'
                }`}
              >
                {isCheckingOut ? (
                  paymentMethod === 'mercadopago' ? 'Conectando a Mercado Pago...' : 'Registrando pedido...'
                ) : (
                  paymentMethod === 'mercadopago' ? 'Pagar con Mercado Pago' :
                  paymentMethod === 'modo' ? 'Confirmar Pedido con MODO' :
                  'Confirmar Pedido en Efectivo'
                )}
                {!isCheckingOut && <ArrowRight className="w-5 h-5" />}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Transacción 100% Segura
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE PEDIDO (MODO / EFECTIVO) */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                confirmedOrder.paymentMethod === 'modo' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                {confirmedOrder.paymentMethod === 'modo' ? '¡Pedido Registrado con Éxito!' : '¡Pedido Confirmado con Éxito!'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {confirmedOrder.paymentMethod === 'modo' 
                  ? 'Tu pedido fue reservado. Realizá la transferencia o pago por MODO para confirmarlo.' 
                  : 'Tu pedido ya fue tomado para abonar en efectivo contra entrega.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Número de Pedido:</span>
                <span className="font-bold text-slate-800">#{confirmedOrder.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Total a Abonar:</span>
                <span className="font-black text-emerald-600 text-base">${confirmedOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Fecha de Entrega:</span>
                <span className="font-medium text-slate-800">{confirmedOrder.deliveryDate} ({confirmedOrder.deliveryTimeRange})</span>
              </div>
              {confirmedOrder.deliveryAddress && (
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Entrega:</span>
                  <span className="font-medium text-slate-800 text-right">{confirmedOrder.deliveryAddress}</span>
                </div>
              )}
            </div>

            {confirmedOrder.paymentMethod === 'modo' && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 space-y-2 text-xs">
                <p className="font-bold text-purple-900">Datos bancarios para abonar:</p>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Alias:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-purple-800">
                    <span>{MODO_ALIAS}</span>
                    <button 
                      onClick={() => handleCopy(MODO_ALIAS, 'modal-alias')} 
                      className="p-1 hover:bg-purple-100 rounded text-purple-600"
                      title="Copiar Alias"
                    >
                      {copiedField === 'modal-alias' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>CBU/CVU:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                    <span>{MODO_CBU}</span>
                    <button 
                      onClick={() => handleCopy(MODO_CBU, 'modal-cbu')} 
                      className="p-1 hover:bg-purple-100 rounded text-purple-600"
                      title="Copiar CBU"
                    >
                      {copiedField === 'modal-cbu' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Titular:</span>
                  <span className="font-semibold">{MODO_HOLDER}</span>
                </div>
              </div>
            )}

            {confirmedOrder.paymentMethod === 'cash' && cashChangeNote && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-6 text-xs text-emerald-800 font-medium">
                💵 <strong>Nota de cambio:</strong> {cashChangeNote}
              </div>
            )}

            <div className="space-y-3">
              <a
                href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
                  confirmedOrder.paymentMethod === 'modo'
                    ? `Hola VibranFrut! Acabo de registrar el pedido #${confirmedOrder.orderId} por $${confirmedOrder.total.toFixed(2)} mediante MODO / Transferencia. Les adjunto el comprobante de pago.`
                    : `Hola VibranFrut! Acabo de confirmar el pedido #${confirmedOrder.orderId} por $${confirmedOrder.total.toFixed(2)} para abonar en efectivo al recibir.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5" />
                {confirmedOrder.paymentMethod === 'modo' ? 'Enviar Comprobante por WhatsApp' : 'Avisar o Consultar por WhatsApp'}
              </a>

              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  navigate('/profile');
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold text-sm transition-colors"
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
