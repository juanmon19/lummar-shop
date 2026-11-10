// views/tienda/HomeView.jsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';

export default function HomeView({ initialProducts = [] }) {
  const [productos, setProductos] = useState(initialProducts);
  const [carrito, setCarrito] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const guardado = localStorage.getItem('lummar_cart_v2');
    if (guardado) {
      try {
        setCarrito(JSON.parse(guardado));
      } catch (e) {}
    }
    const localProds = localStorage.getItem('lummar_custom_products');
    if (localProds) {
      try {
        const parsed = JSON.parse(localProds);
        if (parsed.length > 0) {
          setProductos([...parsed, ...initialProducts]);
        }
      } catch (e) {}
    }
  }, [initialProducts]);

  const guardarCarrito = (nuevo) => {
    setCarrito(nuevo);
    localStorage.setItem('lummar_cart_v2', JSON.stringify(nuevo));
  };

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((item) => item.id === producto.id);
    let nuevo;
    if (existe) {
      nuevo = carrito.map((item) =>
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      );
    } else {
      nuevo = [...carrito, { ...producto, cantidad: 1 }];
    }
    guardarCarrito(nuevo);
    mostrarToast(`"${producto.nombre}" agregado al carrito`);
  };

  const cambiarCantidad = (id, delta) => {
    const nuevo = carrito
      .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
      .filter((item) => item.cantidad > 0);
    guardarCarrito(nuevo);
  };

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrecio = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const comprarPorWhatsApp = () => {
    if (carrito.length === 0) {
      mostrarToast('Agrega productos a tu carrito primero');
      return;
    }
    const telefono = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '57 310 5801620';
    const lista = carrito.map((i) => `${i.nombre} (x${i.cantidad})`).join(', ');
    const texto = `Hola, quiero realizar el siguiente pedido: ${lista} - Total: $${totalPrecio.toLocaleString('es-CO')}`;
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <MainLayout
      cartCount={totalItems}
      onOpenCart={() => setCartOpen(true)}
      toastMessage={toast}
    >
      {/* Hero Section */}
      <section className="py-16 sm:py-24 border-b border-dustyRose/30 bg-gradient-to-b from-pastelPink/60 via-ivory to-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pastelPink border border-dustyRose text-xs font-semibold uppercase tracking-widest">
              Colección Exclusiva Lummar Shop
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl font-bold leading-tight">
              Elegancia que resalta tu <span className="italic text-champagneGold">esencia única</span>
            </h1>
            <p className="text-base sm:text-lg text-elegantBlack/75 max-w-2xl">
              Descubre accesorios, bolsos y fragancias seleccionadas con amor. Agrega tus favoritos al carrito y finaliza tu pedido directamente por WhatsApp sin necesidad de registrarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#catalogo"
                className="bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-semibold px-8 py-4 rounded-full shadow-lg transition-all"
              >
                Ver productos
              </a>
              <button
                onClick={() => setCartOpen(true)}
                className="bg-nudePink/40 hover:bg-nudePink text-elegantBlack border border-dustyRose font-semibold px-7 py-4 rounded-full transition-all"
              >
                Ver mi carrito ({totalItems})
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full p-3 bg-gradient-to-tr from-champagneGold via-softGold to-dustyRose shadow-2xl">
              <img
                src="/img/logo.jpg"
                alt="Lummar Shop"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover rounded-full border-4 border-ivory"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-champagneGold">Catálogo Oficial</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">Piezas Disponibles</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {productos.map((prod) => (
            <article
              key={prod.id}
              className="bg-pastelPink rounded-3xl overflow-hidden border border-dustyRose/60 shadow-sm hover:shadow-xl transition-all flex flex-col group"
            >
              <div className="relative h-72 overflow-hidden bg-ivory">
                <img
                  src={prod.imagen_url}
                  alt={prod.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-ivory/90 px-3.5 py-1 rounded-full text-xs font-semibold border border-dustyRose">
                  {prod.categoria || 'Exclusivo'}
                </span>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-bold">{prod.nombre}</h3>
                  <p className="text-2xl font-bold mt-2">${Number(prod.precio).toLocaleString('es-CO')}</p>
                </div>
                <button
                  onClick={() => agregarAlCarrito(prod)}
                  className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-semibold py-3.5 px-5 rounded-2xl shadow transition-all"
                >
                  + Agregar al carrito
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Slide-out Cart */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-elegantBlack/50" onClick={() => setCartOpen(false)} />
          <aside className="relative w-full max-w-md bg-ivory h-full shadow-2xl border-l border-dustyRose flex flex-col z-10">
            <div className="p-6 bg-pastelPink border-b border-dustyRose flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold">Tu Carrito Lummar</h3>
              <button
                onClick={() => setCartOpen(false)}
                className="px-3 py-1 rounded-full bg-ivory border border-dustyRose text-xs font-bold"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {carrito.length === 0 ? (
                <p className="text-center text-sm text-elegantBlack/60 py-16">
                  Tu carrito está vacío.
                </p>
              ) : (
                carrito.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-pastelPink/70 border border-dustyRose"
                  >
                    <img
                      src={item.imagen_url}
                      alt={item.nombre}
                      className="w-16 h-16 rounded-xl object-cover border border-dustyRose"
                    />
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold">{item.nombre}</h4>
                      <p className="text-xs font-bold text-champagneGold">
                        ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-ivory border border-dustyRose rounded-full px-2 py-1">
                      <button onClick={() => cambiarCantidad(item.id, -1)} className="px-2 font-bold">-</button>
                      <span className="text-xs font-bold">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id, 1)} className="px-2 font-bold">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-pastelPink border-t border-dustyRose space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-2xl font-serif text-champagneGold">
                  ${totalPrecio.toLocaleString('es-CO')}
                </span>
              </div>
              <button
                onClick={comprarPorWhatsApp}
                className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-4 rounded-2xl shadow-lg transition-all"
              >
                Comprar por WhatsApp
              </button>
            </div>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
