// views/layouts/MainLayout.jsx
import React from 'react';
import Link from 'next/link';

export default function MainLayout({ children, cartCount = 0, onOpenCart, toastMessage }) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-elegantBlack font-sans selection:bg-dustyRose selection:text-elegantBlack">
      {/* Notificación Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-elegantBlack text-ivory px-6 py-3.5 rounded-full shadow-2xl border border-champagneGold flex items-center gap-3 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-champagneGold" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-dustyRose/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-champagneGold via-softGold to-champagneGold shadow-md overflow-hidden flex items-center justify-center">
              <img
                src="/img/logo.jpg"
                alt="Lummar Shop Logo"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/120x120/FCE9E9/C99A3B?text=Lummar';
                }}
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-elegantBlack block leading-none">
                Lummar <span className="text-champagneGold">Shop</span>
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-elegantBlack/60 font-semibold">
                Boutique & Luxury
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="hover:text-champagneGold transition-colors">Inicio</Link>
            <a href="/#catalogo" className="hover:text-champagneGold transition-colors">Catálogo</a>
            <Link href="/login" className="hover:text-champagneGold transition-colors">Login Admin</Link>
            <Link href="/register" className="hover:text-champagneGold transition-colors">Registro con Google</Link>
          </nav>

          <div className="flex items-center gap-3">
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-2.5 bg-pastelPink hover:bg-nudePink/40 border border-dustyRose px-4 py-2.5 rounded-full transition-all duration-300 shadow-sm"
              >
                <span className="text-sm font-semibold">Mi Carrito</span>
                <span className="bg-champagneGold text-ivory text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-pastelPink border-t border-dustyRose/60 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif font-bold text-lg text-elegantBlack">
            Lummar <span className="text-champagneGold">Shop</span>
          </span>
          <p className="text-xs text-elegantBlack/70">
            © {new Date().getFullYear()} Lummar Shop. Arquitectura MVC con Seguridad Bcrypt + Google OAuth.
          </p>
        </div>
      </footer>
    </div>
  );
}
