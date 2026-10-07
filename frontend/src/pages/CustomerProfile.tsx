import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, Calendar, Clock, Loader2, MapPin, CreditCard, Banknote, XCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL, cancelOrder, payOrderWithCash, payOrderWithMercadoPago } from '../services/api';

interface Order {
  id: number;
  total: number;
  status: string;
  deliveryDate: string | null;
  deliveryTimeRange: string | null;
  deliveryAddress?: string | null;
  shippingZone?: { name: string } | null;
  createdAt: string;
  items: Array<{
    quantity: number;
    price: number;
    product: { name: string; imageUrl: string; unit: string };
  }>;
}

export const CustomerProfile = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'ADMIN') {
      navigate('/admin');
      return;
    }

    fetchOrders();
  }, [user, token, navigate]);

  const handleCancelOrder = async (orderId: number) => {
    if (!token) return;
    if (!window.confirm('¿Seguro que deseas cancelar este pedido?')) return;
    setProcessingOrderId(orderId);
    try {
      await cancelOrder(orderId, token);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar el pedido');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handlePayCash = async (orderId: number) => {
    if (!token) return;
    if (!window.confirm('¿Confirmas que deseas abonar este pedido en efectivo al momento de la entrega?')) return;
    setProcessingOrderId(orderId);
    try {
      await payOrderWithCash(orderId, token);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Error al confirmar pago en efectivo');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handlePayMercadoPago = async (orderId: number) => {
    if (!token) return;
    setProcessingOrderId(orderId);
    try {
      const data = await payOrderWithMercadoPago(orderId, token);
      if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch (err: any) {
      alert(err.message || 'Error al conectar con Mercado Pago');
      setProcessingOrderId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-emerald-100 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-black uppercase">
            {user?.name?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Hola, {user?.name}</h1>
            <p className="text-slate-500 font-medium">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 font-bold transition-colors bg-slate-50 px-4 py-2 rounded-full">
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-emerald-500" />
        Mis Pedidos
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aún no has realizado ningún pedido.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-emerald-600 font-bold hover:underline">Ir a la tienda</button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500 font-bold mb-1">Pedido #{order.id}</p>
                  <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 
                    order.status === 'PENDIENTE_MODO' ? 'bg-purple-100 text-purple-700' :
                    order.status === 'PAGADO' ? 'bg-emerald-100 text-emerald-700' : 
                    order.status === 'PAGO_EN_EFECTIVO' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'CANCELADO' ? 'bg-red-100 text-red-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status === 'PAGO_EN_EFECTIVO' ? 'EFECTIVO (CONTRA ENTREGA)' : 
                     order.status === 'PENDIENTE_MODO' ? 'MODO / TRANSFERENCIA PENDIENTE' : 
                     order.status}
                  </span>
                  <p className="font-black text-slate-800 mt-2">${Number(order.total).toFixed(2)}</p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-emerald-50 rounded-2xl p-4 mb-4 flex flex-col gap-4">
                <div className="flex flex-wrap gap-6 items-center">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase">Fecha de Entrega</p>
                      <p className="font-medium">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'No definida'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase">Horario</p>
                      <p className="font-medium">{order.deliveryTimeRange || 'No definido'}</p>
                    </div>
                  </div>
                </div>
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2 text-emerald-800 pt-3 border-t border-emerald-100/50">
                    <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase">Dirección de Entrega</p>
                      <p className="font-medium text-sm">{order.shippingZone?.name ? `${order.shippingZone.name} - ` : ''}{order.deliveryAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <img 
                      src={item.product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&background=10b981&color=fff`} 
                      alt={item.product.name} 
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&background=10b981&color=fff`;
                      }}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100" 
                    />
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{item.product.name}</p>
                      <p className="text-xs text-slate-500">
                        {Number(item.quantity) === 0.5 ? '1/2' : Number(item.quantity)} {item.product.unit} x ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de Acción (Cancelar / Pagar con MP / Pagar Efectivo / MODO) */}
              {(order.status === 'PENDIENTE' || order.status === 'PAGO_EN_EFECTIVO' || order.status === 'PENDIENTE_MODO') && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.status === 'PENDIENTE' && (
                      <>
                        <button
                          onClick={() => handlePayMercadoPago(order.id)}
                          disabled={processingOrderId === order.id}
                          className="flex items-center gap-2 bg-[#009ee3] hover:bg-[#0081b8] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                          <CreditCard className="w-4 h-4" />
                          {processingOrderId === order.id ? 'Conectando...' : 'Pagar con Mercado Pago'}
                        </button>
                        
                        <button
                          onClick={() => handlePayCash(order.id)}
                          disabled={processingOrderId === order.id}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                          <Banknote className="w-4 h-4" />
                          Pagar en Efectivo
                        </button>
                      </>
                    )}

                    {order.status === 'PENDIENTE_MODO' && (
                      <a
                        href={`https://wa.me/5491112345678?text=${encodeURIComponent(`Hola VibranFrut! Quería enviar el comprobante de pago del pedido #${order.id} por $${Number(order.total).toFixed(2)} realizado con MODO / Transferencia.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar Comprobante por WhatsApp
                      </a>
                    )}
                    
                    {order.status === 'PAGO_EN_EFECTIVO' && (
                      <span className="text-xs font-semibold text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-cyan-200">
                        <Banknote className="w-4 h-4 text-cyan-600" />
                        Abonas en efectivo al recibir el pedido (${Number(order.total).toFixed(2)})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={processingOrderId === order.id}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ml-auto disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar Pedido
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
