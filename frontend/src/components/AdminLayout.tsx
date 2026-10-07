import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { Package, LogOut, LayoutDashboard, Settings, ShoppingBag, FolderTree, Truck, Users, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Package, label: 'Productos', path: '/admin/products' },
    { icon: FolderTree, label: 'Categorías', path: '/admin/categories' },
    { icon: ShoppingBag, label: 'Pedidos', path: '/admin/orders' },
    { icon: Wallet, label: 'Finanzas MP', path: '/admin/finance' },
    { icon: Users, label: 'Clientes', path: '/admin/users' },
    { icon: Truck, label: 'Zonas de Envío', path: '/admin/shipping' },
    { icon: Settings, label: 'Configuración', path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-emerald-500 p-2 rounded-lg text-white">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">Admin Panel</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800">Gestión de Tienda</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.name || 'Admin Principal'}</p>
              <p className="text-xs text-slate-500">{user?.email || 'admin@vibranfrut.com'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border-2 border-emerald-200 uppercase">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
