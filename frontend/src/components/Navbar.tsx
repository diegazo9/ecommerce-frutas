import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles, Menu, X, User as UserIcon, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, cartTotal } = useCart();
  const { isAuthenticated, isAdmin, user } = useAuth();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-emerald-100/80 sticky top-0 z-50 shadow-xs">
      {/* Spring Announcement Top Bar */}
      <div className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-400 text-white py-1.5 px-4 text-center text-xs font-black tracking-wide shadow-xs">
        <span className="flex items-center justify-center gap-2">
          <span>🌸</span>
          <span className="hidden sm:inline">¡Bienvenida la Primavera!</span>
          <span className="font-medium">Frutas y verduras frescas a tu mesa</span>
          <span className="hidden md:inline">· 🚚 Envíos en el día</span>
          <span className="bg-white/25 px-2 py-0.5 rounded-full text-[10px] uppercase font-black">100% Fresco 🍓</span>
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-tr from-emerald-500 via-lime-500 to-amber-400 p-2.5 rounded-2xl text-white shadow-md shadow-emerald-200 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tight text-slate-800 flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                  VibranFrut <span className="text-sm">🌿</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 -mt-1">Frutas & Verduras Seleccionadas</span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            <Link to="/" className="text-xs font-black text-emerald-700 bg-emerald-50/80 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider hover:bg-emerald-100">Inicio</Link>
            <Link to="/productos" className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider">Productos 🍉</Link>
            <Link to="/combos" className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider">Combos 🧺</Link>
            <Link to="/nosotros" className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider">Nosotros 🌱</Link>
            <Link to="/envios" className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider">Envíos 🛵</Link>
            <Link to="/mayorista" className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider">Mayorista</Link>
            <Link to="/recetas" className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider">Recetas 🥑</Link>
          </nav>

          {/* Search, Login & Cart */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
               <Search className="w-4 h-4 text-emerald-500 absolute left-4" />
               <input 
                 type="text" 
                 placeholder="Buscar manzanas, bananas..." 
                 className="pl-11 pr-4 py-2 bg-emerald-50/40 border border-emerald-200/70 rounded-full focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none w-48 xl:w-60 text-xs font-medium transition-all"
               />
            </div>

            {/* User Login / Profile Button - Visible on Mobile and Desktop */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <Link 
                  to={isAdmin ? "/admin" : "/profile"} 
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-2xl bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 transition-colors border border-emerald-200/50 shadow-2xs" 
                  title={`Perfil de ${user?.name}`}
                >
                  <UserIcon className="w-5 h-5 text-emerald-600" />
                  <span className="hidden sm:inline text-xs font-bold truncate max-w-[100px]">
                    {user?.name?.split(' ')[0] || 'Mi Cuenta'}
                  </span>
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-2xl transition-colors border border-emerald-200/60 shadow-2xs" 
                  title="Iniciar Sesión"
                >
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black">Ingresar</span>
                </Link>
              )}
            </div>
            
            {/* Cart with Total */}
            <Link to="/cart" className="flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-emerald-50 hover:from-amber-100 hover:to-emerald-100 p-2 sm:px-3 sm:py-2 rounded-2xl border border-emerald-200/60 transition-all group shadow-2xs">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-emerald-700 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-5 h-5 px-1 text-[11px] font-black text-white bg-rose-500 rounded-full border-2 border-white shadow-xs animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-slate-800 group-hover:text-emerald-800 transition-colors">
                  ${cartTotal.toFixed(2)}
                </p>
              </div>
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={toggleMenu}
              aria-label="Menú principal"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6 text-emerald-700" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[85vh] border-t border-slate-200 bg-white shadow-2xl overflow-y-auto' : 'max-h-0'}`}>
        <div className="px-4 py-5 space-y-3">
          
          {/* Tarjeta de Cuenta en Menú Móvil */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50 rounded-2xl border border-emerald-200/60 shadow-xs">
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-slate-800 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate font-medium">{user?.email}</p>
                  </div>
                </div>
                <Link
                  to={isAdmin ? "/admin" : "/profile"}
                  onClick={toggleMenu}
                  className="text-xs font-black text-emerald-800 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs hover:bg-emerald-50 shrink-0"
                >
                  {isAdmin ? 'Panel Admin' : 'Mi Perfil'}
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">Mi Cuenta</p>
                    <p className="text-[10px] text-slate-500 font-medium">Inicia sesión o regístrate</p>
                  </div>
                </div>
                <Link
                  to="/login"
                  onClick={toggleMenu}
                  className="text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Ingresar
                </Link>
              </div>
            )}
          </div>

          {/* Buscador móvil */}
          <div className="relative">
             <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
             <input type="text" placeholder="Buscar productos..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium" />
          </div>
          
          <nav className="space-y-1 pt-1 font-bold text-xs">
            <Link to="/" className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl uppercase transition-colors" onClick={toggleMenu}>
              <span>Inicio</span>
              <span>🏡</span>
            </Link>
            <Link to="/productos" className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl uppercase transition-colors" onClick={toggleMenu}>
              <span>Productos</span>
              <span>🍉</span>
            </Link>
            <Link to="/combos" className="flex items-center justify-between px-3.5 py-2.5 text-emerald-700 bg-emerald-50/40 rounded-xl uppercase transition-colors" onClick={toggleMenu}>
              <span>Combos y Bolsones</span>
              <span>🧺</span>
            </Link>
            <Link to="/nosotros" className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl uppercase transition-colors" onClick={toggleMenu}>
              <span>Nosotros</span>
              <span>🌱</span>
            </Link>
            <Link to="/envios" className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl uppercase transition-colors" onClick={toggleMenu}>
              <span>Envíos y Zonas</span>
              <span>🛵</span>
            </Link>
            <Link to="/mayorista" className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl uppercase transition-colors" onClick={toggleMenu}>
              <span>Mayorista</span>
              <span>📦</span>
            </Link>
            <Link to="/recetas" className="flex items-center justify-between px-3.5 py-2.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl uppercase transition-colors" onClick={toggleMenu}>
              <span>Recetas</span>
              <span>🥑</span>
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
};
