import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getShippingZones, API_URL } from '../services/api';
import type { ShippingZone } from '../services/api';

export const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeRange, setDeliveryTimeRange] = useState('09:00 - 13:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('');

  useEffect(() => {
    getShippingZones().then(data => setZones(data.filter(z => z.isActive)));
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const shippingCost = selectedZone ? Number(selectedZone.price) : 0;
  const finalTotal = cartTotal + shippingCost;

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
          deliveryAddress: selectedZoneId === '' ? null : deliveryAddress
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error procesando el pago');
      }

      const data = await response.json();
      clearCart();
      window.location.href = data.initPoint;

    } catch (err: any) {
      setError(err.message);
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
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
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6">
              <img 
                src={item.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=10b981&color=fff`} 
                alt={item.name} 
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
                  ${Number(item.price).toFixed(2)} / {item.unit}
                </p>
                <p className="text-emerald-600 font-black text-lg mt-0.5">
                  Subtotal: ${(Number(item.price) * item.cartQuantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => {
                      const step = item.unit === 'kg' ? 0.5 : 1;
                      updateQuantity(item.id, Number((item.cartQuantity - step).toFixed(2)));
                    }} 
                    className="p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                    title="Disminuir"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="min-w-[60px] text-center font-bold text-sm text-slate-800 px-1">
                    {item.cartQuantity === 0.5 ? '1/2 kg' : `${item.cartQuantity} ${item.unit || 'kg'}`}
                  </span>
                  <button 
                    onClick={() => {
                      const step = item.unit === 'kg' ? 0.5 : 1;
                      updateQuantity(item.id, Number((item.cartQuantity + step).toFixed(2)));
                    }} 
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

        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 sticky top-28">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Entrega</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Zona de Envío</label>
                <select 
                  value={selectedZoneId}
                  onChange={e => setSelectedZoneId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white"
                >
                  <option value="">Retiro en Local (Gratis)</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name} (+${Number(z.price).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {selectedZoneId !== '' && (
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Dirección Exacta</label>
                  <input 
                    type="text" 
                    placeholder="Calle, Número, Piso, Depto..."
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Fecha de Entrega / Retiro</label>
                <input 
                  type="date" 
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Horario Preferido</label>
                <select 
                  value={deliveryTimeRange}
                  onChange={e => setDeliveryTimeRange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white"
                >
                  <option value="09:00 - 13:00">Mañana (09:00 - 13:00)</option>
                  <option value="13:00 - 17:00">Tarde (13:00 - 17:00)</option>
                  <option value="17:00 - 20:00">Noche (17:00 - 20:00)</option>
                </select>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-6">Resumen</h3>
            <div className="space-y-4 mb-6 border-b border-slate-200 pb-6">
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
            <div className="flex justify-between items-end mb-8">
              <span className="text-slate-500 font-bold">Total</span>
              <span className="text-4xl font-black text-slate-900">${finalTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full btn-gradient text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
            >
              {isCheckingOut ? 'Conectando seguro...' : 'Pagar con Mercado Pago'}
              {!isCheckingOut && <ArrowRight className="w-5 h-5" />}
            </button>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Pago 100% Seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
