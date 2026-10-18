import { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus, getOrderPdfUrl } from '../services/api';
import type { Order } from '../services/api';
import { Link } from 'react-router-dom';
import { Loader2, PackageOpen, CheckCircle, Clock, Smartphone, MapPin, Printer, CheckSquare, Square, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrderPrintModal } from '../components/OrderPrintModal';

export const AdminOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [printModalOrder, setPrintModalOrder] = useState<Order | null>(null);
  const [printModalOrders, setPrintModalOrders] = useState<Order[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id: number) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePrintSingle = (order: Order) => {
    setPrintModalOrder(order);
    setPrintModalOrders([]);
    setIsPrintModalOpen(true);
  };

  const handlePrintBulk = () => {
    const selected = orders.filter(o => selectedOrderIds.includes(o.id));
    if (selected.length === 0) return;
    setPrintModalOrder(null);
    setPrintModalOrders(selected);
    setIsPrintModalOpen(true);
  };

  if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Gestión de Pedidos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Control de órdenes, preparación de envíos e impresión de remitos</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedOrderIds.length > 0 && (
            <button
              type="button"
              onClick={handlePrintBulk}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer animate-in fade-in"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir Seleccionados ({selectedOrderIds.length})</span>
            </button>
          )}

          <Link
            to="/admin/routes"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs transition-all w-fit hover:scale-[1.02]"
          >
            <MapPin className="w-4 h-4" />
            <span>Planificador y Rutas de Entrega</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-sm">
              <th className="p-4 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                  title={selectedOrderIds.length === orders.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                >
                  {selectedOrderIds.length > 0 && selectedOrderIds.length === orders.length ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-4">ID Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Zona / Dirección</th>
              <th className="p-4">Total</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const isSelected = selectedOrderIds.includes(order.id);
              return (
                <tr key={order.id} className={`border-b border-slate-100 transition-colors ${isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleSelectOrder(order.id)}
                      className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="p-4 font-bold text-slate-700">#{order.id}</td>
                  <td className="p-4 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">{order.user?.name || 'Invitado'}</span><br />
                    <span className="text-xs text-slate-400">{order.user?.email || ''}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <span className="font-bold text-slate-700">{order.shippingZone?.name || 'Retiro en Local'}</span>
                    {order.deliveryAddress && (
                      <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" title={order.deliveryAddress}>
                        📍 {order.deliveryAddress}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">${Number(order.total).toFixed(2)}</td>
                  <td className="p-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                      order.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'PENDIENTE_MODO' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'PAGADO' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'PAGO_EN_EFECTIVO' ? 'bg-cyan-100 text-cyan-800' :
                      order.status === 'EN_PREPARACION' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'EN_CAMINO' ? 'bg-indigo-100 text-indigo-700' :
                      order.status === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status === 'PENDIENTE' && <Clock className="w-3 h-3" />}
                      {order.status === 'PENDIENTE_MODO' && <Smartphone className="w-3 h-3" />}
                      {order.status === 'EN_PREPARACION' && <PackageOpen className="w-3 h-3" />}
                      {order.status === 'ENTREGADO' && <CheckCircle className="w-3 h-3" />}
                      {order.status === 'PAGO_EN_EFECTIVO' ? 'Efectivo al recibir' : 
                       order.status === 'PENDIENTE_MODO' ? 'Pendiente MODO / Transf.' : 
                       order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={getOrderPdfUrl(order.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-all"
                        title="Ver / Descargar comprobante oficial en PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handlePrintSingle(order)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all cursor-pointer"
                        title="Imprimir remito / comprobante de este pedido"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none font-medium cursor-pointer"
                      >
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="PENDIENTE_MODO">Pendiente MODO / Transferencia</option>
                        <option value="PAGO_EN_EFECTIVO">Pago en Efectivo</option>
                        <option value="PAGADO">Pagado (Mercado Pago / Transf.)</option>
                        <option value="EN_PREPARACION">En Preparación</option>
                        <option value="EN_CAMINO">En Camino</option>
                        <option value="ENTREGADO">Entregado</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-slate-500">No hay pedidos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Impresión de Pedidos */}
      {isPrintModalOpen && (
        <OrderPrintModal
          order={printModalOrder}
          orders={printModalOrders}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
