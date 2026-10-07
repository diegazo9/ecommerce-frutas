import { useEffect, useState } from 'react';
import { getOrders, getProducts } from '../services/api';
import type { Order, Product } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, TrendingUp, Users, ShoppingBag, Package, DollarSign, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getOrders(token),
      getProducts()
    ]).then(([ordersData, productsData]) => {
      setOrders(ordersData);
      setProducts(productsData);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;

  // Calculando Métricas
  const validOrders = orders.filter(o => o.status !== 'CANCELADO');
  const totalIngresos = validOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const pedidosPendientes = orders.filter(o => o.status === 'PENDIENTE').length;
  
  // Clientes Únicos (basado en órdenes)
  const uniqueCustomers = new Set(orders.map(o => o.user?.email).filter(Boolean)).size;

  // Últimos 5 pedidos
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: 'Ingresos Totales', value: `$${totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-emerald-500', trend: '+12.5%', to: '/admin/orders' },
    { label: 'Ventas Activas', value: validOrders.length, icon: ShoppingBag, color: 'bg-blue-500', trend: '+5.2%', to: '/admin/orders' },
    { label: 'Clientes Registrados', value: uniqueCustomers, icon: Users, color: 'bg-indigo-500', trend: 'Base de clientes', to: '/admin/users' },
    { label: 'Productos en Catálogo', value: products.length, icon: Package, color: 'bg-amber-500', trend: 'Inventario', to: '/admin/products' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Resumen General</h1>
          <p className="text-slate-500 mt-1">Métricas de rendimiento de tu tienda al día de hoy.</p>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Link 
            key={i} 
            to={stat.to}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <p className="text-slate-500 font-bold text-sm mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                <span>{stat.trend}</span>
                <span className="text-[10px] text-emerald-600 font-black opacity-0 group-hover:opacity-100 transition-opacity ml-1">Ver ➔</span>
              </p>
            </div>
            <div className={`${stat.color} text-white p-4 rounded-2xl shadow-lg group-hover:scale-105 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Izquierdo: Últimos Pedidos */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Últimos Pedidos</h2>
            <Link to="/admin/orders" className="text-emerald-500 hover:text-emerald-600 font-bold text-sm">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-slate-100">
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Zona</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Monto</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-4 font-bold text-slate-700">{order.user?.name || 'Invitado'}</td>
                    <td className="py-4 text-slate-500">{order.shippingZone?.name || 'Local'}</td>
                    <td className="py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 font-bold text-slate-700">${Number(order.total).toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'EN_PREPARACION' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Derecho: Alertas / Resumen Rápido */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-lg text-white">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Atención Rápida
          </h2>
          
          <div className="space-y-4">
            {/* Acceso Directo a Clientes */}
            <Link 
              to="/admin/users" 
              className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between transition-all group text-white hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Gestionar Clientes</p>
                  <p className="text-emerald-200/80 text-xs">Ver base de usuarios registrados</p>
                </div>
              </div>
              <span className="text-emerald-300 font-black text-lg group-hover:translate-x-1 transition-transform">➔</span>
            </Link>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Pedidos Pendientes</p>
                <p className="text-2xl font-black text-white">{pedidosPendientes}</p>
              </div>
              <div className="bg-amber-500/20 text-amber-400 p-3 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Productos sin Stock</p>
                <p className="text-2xl font-black text-white">
                  {products.filter(p => Number(p.stock) <= 0).length}
                </p>
              </div>
              <div className="bg-red-500/20 text-red-400 p-3 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-slate-400 italic">"Los grandes resultados vienen de optimizar cada detalle. ¡Sigue así!"</p>
          </div>
        </div>

      </div>
    </div>
  );
};
