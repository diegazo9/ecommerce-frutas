import { useEffect, useState } from 'react';
import { getAdminUsers, updateUserRole } from '../services/api';
import type { AdminUser } from '../services/api';
import { 
  Loader2, 
  Users, 
  Search, 
  ShoppingBag, 
  ShieldCheck, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  X, 
  ArrowUpDown,
  Mail,
  User as UserIcon
} from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'ADMIN'>('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user: AdminUser) => {
    const newRole = user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    const confirmMessage = user.role === 'ADMIN'
      ? `¿Seguro que deseas quitar permisos de administrador a ${user.name}?`
      : `¿Seguro que deseas nombrar ADMINISTRADOR a ${user.name}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setIsUpdatingRole(user.id);
      const updated = await updateUserRole(user.id, newRole);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: updated.role } : u));
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(prev => prev ? { ...prev, role: updated.role } : null);
      }
    } catch (err: any) {
      alert('Error al actualizar rol: ' + err.message);
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalCustomers = users.filter(u => u.role === 'CUSTOMER').length;
  const customersWithOrders = users.filter(u => u.orderCount > 0).length;
  const totalRevenue = users.reduce((sum, u) => sum + Number(u.totalSpent || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-600 font-bold">Cargando base de clientes...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Users className="w-7 h-7" />
            </span>
            Clientes y Usuarios
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Visualiza los clientes registrados, su historial de compras y actividad
          </p>
        </div>

        <button 
          onClick={fetchUsers}
          className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          Actualizar Lista 🔄
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-semibold border border-red-200">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clientes</p>
            <p className="text-2xl font-black text-slate-800">{totalCustomers}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Con Pedidos Realizados</p>
            <p className="text-2xl font-black text-slate-800">{customersWithOrders}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Facturación Total Clientes</p>
            <p className="text-2xl font-black text-slate-800">${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filtrar:</span>
          {(['ALL', 'CUSTOMER', 'ADMIN'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'ALL' ? 'Todos' : role === 'CUSTOMER' ? 'Clientes' : 'Admins'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Usuario / Cliente</th>
                <th className="py-4 px-6">Rol</th>
                <th className="py-4 px-6">Registrado</th>
                <th className="py-4 px-6 text-center">Pedidos</th>
                <th className="py-4 px-6 text-right">Total Comprado</th>
                <th className="py-4 px-6 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-2xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-300" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {user.role === 'ADMIN' ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" /> Admin
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3.5 h-3.5" /> Cliente
                            </>
                          )}
                        </span>
                        
                        <button
                          onClick={() => handleRoleToggle(user)}
                          disabled={isUpdatingRole === user.id}
                          className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors text-xs"
                          title={`Cambiar rol a ${user.role === 'ADMIN' ? 'CLIENTE' : 'ADMIN'}`}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-500 text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(user.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        user.orderCount > 0 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {user.orderCount} {user.orderCount === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-black text-slate-800">
                      ${Number(user.totalSpent).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors"
                      >
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xl flex items-center justify-center shadow-md">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">{selectedUser.name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Rol</p>
                <p className="font-black text-slate-800 mt-0.5">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Registrado</p>
                <p className="font-semibold text-slate-700 mt-0.5">
                  {new Date(selectedUser.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Total Pedidos</p>
                <p className="font-black text-slate-800 mt-0.5">{selectedUser.orderCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Gasto Acumulado</p>
                <p className="font-black text-emerald-700 mt-0.5">
                  ${Number(selectedUser.totalSpent).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <h4 className="font-black text-slate-800 text-sm mb-3 uppercase tracking-wider">
              Últimos Pedidos
            </h4>

            {(!selectedUser.recentOrders || selectedUser.recentOrders.length === 0) ? (
              <p className="text-sm text-slate-400 py-4 text-center italic bg-slate-50 rounded-2xl">
                Este cliente todavía no ha realizado compras.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedUser.recentOrders.map(order => (
                  <div key={order.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">Pedido #{order.id}</p>
                      <p className="text-slate-400">{new Date(order.createdAt).toLocaleDateString('es-AR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">${Number(order.total).toFixed(2)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'APROBADO' || order.status === 'PAGADO'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="bg-slate-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
