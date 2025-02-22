import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShoppingCart, Upload, User, LogOut, LogIn, Menu, Palette, ShieldCheck } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, signOut: logout } = useAuthStore();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const getNavItems = () => {
    const items = [
      { name: 'Marketplace', path: '/marketplace', icon: ShoppingCart },
    ];

    if (user?.role === 'artist') {
      items.push({ name: 'Artist Dashboard', path: '/artist', icon: Palette });
    }

    if (user?.role === 'admin') {
      items.push({ name: 'Admin Dashboard', path: '/admin', icon: ShieldCheck });
    }

    if (user) {
      items.push({ name: 'Upload', path: '/upload', icon: Upload });
      items.push({ name: 'My Collection', path: '/collection', icon: ShoppingCart });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/marketplace" 
            className="flex items-center gap-2 group"
          >
            <div className={`h-8 w-8 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] rounded-lg transform transition-all duration-300 group-hover:rotate-12 ${styles.logo_spin}`}></div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-transparent bg-clip-text">
              Renderbay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-xl transition-all duration-300 group ${styles.nav_item} ${
                  location.pathname === item.path
                    ? 'text-gray-900 bg-gradient-to-r from-[#6F5AFA]/10 via-[#FF6B6B]/10 to-[#4ECDC4]/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                </span>
                {location.pathname === item.path && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] transform scale-x-100 transition-transform duration-300"></span>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6F5AFA]/10 via-[#FF6B6B]/10 to-[#4ECDC4]/10">
                  <User className="h-4 w-4 text-[#6F5AFA]" />
                  <span className="text-gray-900">{user.username}</span>
                  {user.role && (
                    <span className="text-sm text-gray-500 capitalize">({user.role})</span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-xl transition-all duration-300 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="group flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#6F5AFA]/20 transform hover:-translate-y-0.5 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#4ECDC4] via-[#FF6B6B] to-[#6F5AFA] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors duration-300"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${styles.mobile_menu_item} ${
                  location.pathname === item.path
                    ? 'text-gray-900 bg-gradient-to-r from-[#6F5AFA]/10 via-[#FF6B6B]/10 to-[#4ECDC4]/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6F5AFA]/10 via-[#FF6B6B]/10 to-[#4ECDC4]/10 ${styles.mobile_menu_item}`}>
                  <User className="h-5 w-5 text-[#6F5AFA]" />
                  <span className="text-gray-900">{user.username}</span>
                  {user.role && (
                    <span className="text-sm text-gray-500 capitalize">({user.role})</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-4 py-3 text-gray-600 hover:text-gray-900 rounded-xl transition-all duration-300 hover:bg-gray-100 ${styles.mobile_menu_item}`}
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#6F5AFA] via-[#FF6B6B] to-[#4ECDC4] text-white rounded-xl ${styles.mobile_menu_item}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;