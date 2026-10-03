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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-tr from-emerald-400 to-blue-500 p-2 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-slate-800">VibranFrut</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link to="/" className="text-[13px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-tight">Inicio</Link>
            <Link to="/productos" className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight">Productos</Link>
            <Link to="/nosotros" className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight">Nosotros</Link>
            <Link to="/envios" className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight">Envíos y Zonas</Link>
            <Link to="/mayorista" className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight">Mayorista</Link>
            <Link to="/recetas" className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight">Recetas</Link>
          </nav>

          {/* Search, Login & Cart */}
          <div className="flex items-center gap-6">
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-4" />
               <input 
                 type="text" 
                 placeholder="Buscar" 
                 className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-emerald-500 outline-none w-48 xl:w-64 text-sm font-medium transition-all"
               />
            </div>

            <div className="hidden md:block">
              {isAuthenticated ? (
                <Link to={isAdmin ? "/admin" : "/profile"} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors" title={`Perfil de ${user?.name}`}>
                  <UserIcon className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors" title="Iniciar Sesión">
                  <UserIcon className="w-5 h-5" />
                </Link>
              )}
            </div>
            
            {/* Cart with Total */}
            <Link to="/cart" className="flex items-center gap-3 group">
              <div className="relative">
                <ShoppingCart className="h-7 w-7 text-slate-700 group-hover:text-emerald-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center w-5 h-5 text-[11px] font-bold text-white bg-red-600 rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-black text-slate-700 group-hover:text-emerald-600 transition-colors">
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
