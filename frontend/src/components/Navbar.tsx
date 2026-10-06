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
          <span className="font-medium">Frutas frescas de huerto a tu mesa</span>
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
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 -mt-1">Huerto & Frutería</span>
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

            <div className="hidden md:block">
              {isAuthenticated ? (
                <Link to={isAdmin ? "/admin" : "/profile"} className="flex items-center gap-2 p-2 rounded-full hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors" title={`Perfil de ${user?.name}`}>
                  <UserIcon className="w-5 h-5 text-emerald-600" />
                </Link>
              ) : (
                <Link to="/login" className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors" title="Iniciar Sesión">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span>Ingresar</span>
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
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={toggleMenu}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[400px] border-t border-slate-200 bg-white' : 'max-h-0'}`}>
        <div className="px-4 py-4 space-y-2">
          <div className="mb-4 relative">
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
             <input type="text" placeholder="Buscar productos..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" />
          </div>
          
          <Link to="/" className="block px-4 py-2 text-sm font-bold text-red-600 uppercase" onClick={toggleMenu}>Inicio</Link>
          <Link to="/productos" className="block px-4 py-2 text-sm font-bold text-slate-600 uppercase" onClick={toggleMenu}>Productos</Link>
          <Link to="/combos" className="block px-4 py-2 text-sm font-bold text-emerald-600 uppercase" onClick={toggleMenu}>Combos y Bolsones 🧺</Link>
          <Link to="/nosotros" className="block px-4 py-2 text-sm font-bold text-slate-600 uppercase" onClick={toggleMenu}>Nosotros</Link>
          <Link to="/envios" className="block px-4 py-2 text-sm font-bold text-slate-600 uppercase" onClick={toggleMenu}>Envíos y Zonas</Link>
          <Link to="/mayorista" className="block px-4 py-2 text-sm font-bold text-slate-600 uppercase" onClick={toggleMenu}>Mayorista</Link>
          <Link to="/recetas" className="block px-4 py-2 text-sm font-bold text-slate-600 uppercase" onClick={toggleMenu}>Recetas</Link>
          
          {isAuthenticated ? (
            <Link to={isAdmin ? "/admin" : "/profile"} className="block px-4 py-2 text-sm font-bold text-emerald-600 uppercase border-t border-slate-100 mt-2 pt-4" onClick={toggleMenu}>
              Mi Perfil
            </Link>
          ) : (
            <Link to="/login" className="block px-4 py-2 text-sm font-bold text-emerald-600 uppercase border-t border-slate-100 mt-2 pt-4" onClick={toggleMenu}>
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
