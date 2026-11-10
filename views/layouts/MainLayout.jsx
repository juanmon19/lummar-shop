// views/layouts/MainLayout.jsx
import React, { useState } from 'react';
import Link from 'next/link';

export default function MainLayout({
  children,
  cartCount = 0,
  onOpenCart,
  toastMessage,
  mobileCartBar
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const abrirCarrito = () => {
    setMenuOpen(false);
    if (onOpenCart) onOpenCart();
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-elegantBlack font-sans selection:bg-dustyRose selection:text-elegantBlack">
      {toastMessage && (
        <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm bg-elegantBlack text-ivory px-5 py-3.5 rounded-2xl shadow-2xl border border-champagneGold flex items-center gap-3 animate-slide-up">
          <span className="w-2.5 h-2.5 rounded-full bg-champagneGold shrink-0" />
          <span className="text-sm font-medium leading-snug">{toastMessage}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-dustyRose/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3.5 group min-w-0"
              onClick={() => setMenuOpen(false)}
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-champagneGold via-softGold to-champagneGold shadow-md overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/img/logo.jpg"
                  alt="Lummar Shop"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/120x120/FCE9E9/C99A3B?text=L';
                  }}
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="min-w-0">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-elegantBlack block leading-none whitespace-nowrap">
                  Lummar <span className="text-champagneGold">Shop</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-elegantBlack/60 font-semibold mt-1">
                  Boutique &amp; Luxury
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              <Link href="/" className="hover:text-champagneGold transition-colors">
                Inicio
              </Link>
              <a href="/#catalogo" className="hover:text-champagneGold transition-colors">
                Catálogo
              </a>
              <Link href="/login" className="hover:text-champagneGold transition-colors">
                Admin
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              {onOpenCart && (
                <button
                  type="button"
                  onClick={abrirCarrito}
                  aria-label={`Abrir carrito, ${cartCount} productos`}
                  className="relative flex items-center gap-2 bg-pastelPink hover:bg-nudePink/40 border border-dustyRose h-11 px-3 sm:px-4 rounded-full transition-all duration-300 shadow-sm"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 7h12l1.2 12.2a1.5 1.5 0 0 1-1.5 1.6H6.3a1.5 1.5 0 0 1-1.5-1.6L6 7Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 9V6a3 3 0 0 1 6 0v3"
                    />
                  </svg>
                  <span className="hidden sm:inline text-sm font-semibold">Carrito</span>
                  <span className="bg-champagneGold text-ivory text-[11px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMenuOpen((abierto) => !abierto)}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen}
                className="md:hidden w-11 h-11 rounded-full border border-dustyRose bg-ivory flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  {menuOpen ? (
                    <path d="M6 6l12 12M18 6 6 18" />
                  ) : (
                    <>
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden border-t border-dustyRose/50 py-3 animate-fade-in">
              <nav className="grid gap-1 text-sm font-semibold">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-xl hover:bg-pastelPink"
                >
                  Inicio
                </Link>
                <a
                  href="/#catalogo"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-xl hover:bg-pastelPink"
                >
                  Catálogo
                </a>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-xl hover:bg-pastelPink"
                >
                  Panel administrador
                </Link>
                <Link
                  href="/setup"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-xl hover:bg-pastelPink text-elegantBlack/70"
                >
                  Configuración inicial
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      {mobileCartBar}

      <footer
        className={`bg-pastelPink border-t border-dustyRose/60 pt-10 ${
          mobileCartBar ? 'pb-32 sm:pb-10' : 'pb-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div>
            <span className="font-serif font-bold text-lg text-elegantBlack">
              Lummar <span className="text-champagneGold">Shop</span>
            </span>
            <p className="text-xs text-elegantBlack/70 mt-1">
              Compra fácil por WhatsApp · Hecho para tu celular
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold">
            <a href="/#catalogo" className="hover:text-champagneGold">
              Catálogo
            </a>
            <Link href="/login" className="hover:text-champagneGold">
              Admin
            </Link>
            <Link href="/setup" className="hover:text-champagneGold">
              Configuración
            </Link>
          </div>
          <p className="text-[11px] text-elegantBlack/60">
            © {new Date().getFullYear()} Lummar Shop
          </p>
        </div>
      </footer>
    </div>
  );
}
