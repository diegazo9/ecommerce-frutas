import { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from '../services/api';
import type { Order } from '../services/api';
import { Loader2, PackageOpen, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const data = await getOrders(token);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!token) return;
    try {
      await updateOrderStatus(orderId, newStatus, token);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order', error);
      alert('Error al actualizar el estado');
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-black text-slate-800 mb-6">Gestión de Pedidos</h2>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-sm">
              <th className="p-4">ID Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Zona</th>
              <th className="p-4">Total</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">#{order.id}</td>
                <td className="p-4 text-sm text-slate-600">
                  {order.user?.name || 'Invitado'}<br />
                  <span className="text-xs text-slate-400">{order.user?.email || ''}</span>
                </td>
                <td className="p-4 text-sm text-slate-600">
                  {order.shippingZone?.name || 'Retiro en Local'}
                </td>
                <td className="p-4 font-bold text-emerald-600">${Number(order.total).toFixed(2)}</td>
                <td className="p-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                    order.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'PAGADO' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'PAGO_EN_EFECTIVO' ? 'bg-cyan-100 text-cyan-800' :
                    order.status === 'EN_PREPARACION' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'EN_CAMINO' ? 'bg-indigo-100 text-indigo-700' :
                    order.status === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status === 'PENDIENTE' && <Clock className="w-3 h-3" />}
                    {order.status === 'EN_PREPARACION' && <PackageOpen className="w-3 h-3" />}
                    {order.status === 'ENTREGADO' && <CheckCircle className="w-3 h-3" />}
                    {order.status === 'PAGO_EN_EFECTIVO' ? 'Efectivo al recibir' : order.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="p-2 border rounded-lg text-sm bg-white text-slate-700 outline-none font-medium"
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PAGO_EN_EFECTIVO">Pago en Efectivo</option>
                    <option value="PAGADO">Pagado (Mercado Pago)</option>
                    <option value="EN_PREPARACION">En Preparación</option>
                    <option value="EN_CAMINO">En Camino</option>
                    <option value="ENTREGADO">Entregado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay pedidos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
