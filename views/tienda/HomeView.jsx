// views/tienda/HomeView.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { formatCOP, normalizarWhatsApp } from '../../lib/format';

const CARRITO_KEY = 'lummar_cart_v3';
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '57 310 5801620';

function ProductoCard({ producto, onAgregar }) {
  const agotado = Number(producto.stock) <= 0;

  return (
    <article className="bg-pastelPink rounded-2xl sm:rounded-3xl overflow-hidden border border-dustyRose/60 shadow-sm hover:shadow-xl transition-all flex flex-col group">
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
        <img
          src={producto.imagen_url}
          alt={producto.nombre}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              'https://placehold.co/600x750/FCE9E9/C99A3B?text=Lummar+Shop';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-ivory/95 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold border border-dustyRose max-w-[80%] truncate">
          {producto.categoria || 'Exclusivo'}
        </span>
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 items-end">
          {producto.destacado && (
            <span className="bg-champagneGold text-ivory px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
              Destacado
            </span>
          )}
          {agotado && (
            <span className="bg-elegantBlack text-ivory px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
              Agotado
            </span>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-5 flex-grow flex flex-col justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="font-serif text-sm sm:text-lg font-bold leading-snug line-clamp-2">
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className="hidden sm:block text-xs text-elegantBlack/65 mt-1.5 line-clamp-2">
              {producto.descripcion}
            </p>
          )}
          <p className="text-base sm:text-2xl font-bold mt-1.5 sm:mt-2 text-elegantBlack">
            {formatCOP(producto.precio)}
          </p>
          {!agotado && Number(producto.stock) <= 3 && (
            <p className="text-[10px] sm:text-xs font-semibold text-rose-700 mt-1">
              ¡Solo quedan {producto.stock}!
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAgregar(producto)}
          disabled={agotado}
          className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack disabled:bg-elegantBlack/20 disabled:text-elegantBlack/50 text-ivory font-semibold py-2.5 sm:py-3.5 px-2 sm:px-5 rounded-xl sm:rounded-2xl shadow transition-all text-[11px] sm:text-sm"
        >
          {agotado ? 'Sin stock' : '+ Agregar'}
        </button>
      </div>
    </article>
  );
}

export default function HomeView({ initialProducts = [], dbConfigurado = false }) {
  const [productos, setProductos] = useState(initialProducts);
  const [carrito, setCarrito] = useState([]);
  const [carritoListo, setCarritoListo] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [modo, setModo] = useState('carrito'); // carrito | checkout | exito
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [cliente, setCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const toastTimer = useRef(null);

  // Cargar carrito guardado en el dispositivo.
  useEffect(() => {
    try {
      const guardado =
        localStorage.getItem(CARRITO_KEY) || localStorage.getItem('lummar_cart_v2');
      if (guardado) {
        const parseado = JSON.parse(guardado);
        if (Array.isArray(parseado)) {
          setCarrito(
            parseado
              .filter((item) => item && item.id && Number(item.cantidad) > 0)
              .map((item) => ({
                ...item,
                cantidad: Math.min(99, Number(item.cantidad) || 1)
              }))
          );
        }
        if (guardado) localStorage.removeItem('lummar_cart_v2');
      }
    } catch (error) {
      // Carrito corrupto: se ignora.
    }
    setCarritoListo(true);
  }, []);

  useEffect(() => {
    if (!carritoListo) return;
    try {
      localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    } catch (error) {
      // Almacenamiento lleno o bloqueado: no bloquear la compra.
    }
  }, [carrito, carritoListo]);

  useEffect(() => {
    if (!cartOpen) return undefined;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [cartOpen]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const mostrarToast = (mensaje) => {
    setToast(mensaje);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const categorias = useMemo(() => {
    const unicas = Array.from(
      new Set(productos.map((producto) => producto.categoria).filter(Boolean))
    );
    return ['Todas', ...unicas];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      if (producto.activo === false) return false;
      if (categoria !== 'Todas' && producto.categoria !== categoria) return false;
      if (!termino) return true;
      const texto = `${producto.nombre} ${producto.descripcion || ''} ${producto.categoria || ''}`;
      return texto.toLowerCase().includes(termino);
    });
  }, [productos, busqueda, categoria]);

  const totalItems = carrito.reduce((total, item) => total + Number(item.cantidad), 0);
  const totalPrecio = carrito.reduce(
    (total, item) => total + Number(item.precio) * Number(item.cantidad),
    0
  );

  const guardarCarrito = (nuevo) => setCarrito(nuevo);

  const agregarAlCarrito = (producto) => {
    const stock = Number(producto.stock || 0);
    if (stock <= 0) {
      mostrarToast('Este producto está agotado.');
      return;
    }

    const existente = carrito.find((item) => Number(item.id) === Number(producto.id));
    if (existente && Number(existente.cantidad) >= stock) {
      mostrarToast(`Solo hay ${stock} unidades disponibles.`);
      return;
    }

    const nuevo = existente
      ? carrito.map((item) =>
          Number(item.id) === Number(producto.id)
            ? { ...item, cantidad: Number(item.cantidad) + 1 }
            : item
        )
      : [...carrito, { ...producto, cantidad: 1 }];

    guardarCarrito(nuevo);
    mostrarToast(`"${producto.nombre}" agregado al carrito`);
  };

  const cambiarCantidad = (id, delta) => {
    const producto = productos.find((item) => Number(item.id) === Number(id));
    const stock = Number(producto?.stock || 99);

    const nuevo = carrito
      .map((item) => {
        if (Number(item.id) !== Number(id)) return item;
        const cantidad = Math.max(0, Math.min(stock, Number(item.cantidad) + delta));
        return { ...item, cantidad };
      })
      .filter((item) => Number(item.cantidad) > 0);

    guardarCarrito(nuevo);
  };

  const quitarDelCarrito = (id) => {
    guardarCarrito(carrito.filter((item) => Number(item.id) !== Number(id)));
  };

  const vaciarCarrito = () => {
    guardarCarrito([]);
    setPedidoConfirmado(null);
    setErrorPedido('');
  };

  const refrescarProductos = async () => {
    try {
      const res = await fetch('/api/productos', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.productos)) {
        setProductos(data.productos);
      }
    } catch (error) {
      // Si falla, se conserva el catálogo actual.
    }
  };

  const abrirCarrito = () => {
    setModo('carrito');
    setPedidoConfirmado(null);
    setErrorPedido('');
    setCartOpen(true);
  };

  const cerrarCarrito = () => {
    setCartOpen(false);
    if (modo === 'exito') {
      setModo('carrito');
      setPedidoConfirmado(null);
      setErrorPedido('');
    }
  };

  const construirMensajeWhatsApp = (pedido) => {
    const lineas = pedido?.items?.length
      ? pedido.items.map(
          (item) =>
            `• ${item.nombre} x${item.cantidad} — ${formatCOP(item.total ?? item.precio * item.cantidad)}`
        )
      : carrito.map(
          (item) => `• ${item.nombre} x${item.cantidad} — ${formatCOP(item.precio * item.cantidad)}`
        );

    const total = pedido?.subtotal ?? totalPrecio;
    const codigo = pedido?.codigo ? `Código: ${pedido.codigo}` : 'Pedido desde la tienda';

    const partes = [
      '¡Hola Lummar Shop! Quiero confirmar mi pedido.',
      codigo,
      cliente.nombre ? `Cliente: ${cliente.nombre}` : null,
      cliente.telefono ? `Teléfono: ${cliente.telefono}` : null,
      cliente.email ? `Correo: ${cliente.email}` : null,
      cliente.direccion ? `Dirección: ${cliente.direccion}` : null,
      '',
      'Productos:',
      ...lineas,
      '',
      `Total: ${formatCOP(total)}`,
      cliente.notas ? `Notas: ${cliente.notas}` : null
    ].filter(Boolean);

    const telefono = normalizarWhatsApp(WHATSAPP);
    return `https://wa.me/${telefono}?text=${encodeURIComponent(partes.join('\n'))}`;
  };

  const confirmarPedido = async (event) => {
    event.preventDefault();
    setErrorPedido('');

    if (!cliente.nombre.trim() || cliente.nombre.trim().length < 2) {
      setErrorPedido('Ingresa tu nombre completo.');
      return;
    }
    if (cliente.telefono.replace(/\D/g, '').length < 7) {
      setErrorPedido('Ingresa un teléfono válido.');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente,
          items: carrito.map((item) => ({ id: item.id, cantidad: item.cantidad }))
        })
      });

      const data = await res.json();

      if (res.ok && data.pedido) {
        setPedidoConfirmado({
          codigo: data.pedido.codigo,
          waUrl: construirMensajeWhatsApp(data.pedido),
          guardado: true,
          total: data.pedido.subtotal
        });
        setModo('exito');
        guardarCarrito([]);
        refrescarProductos();
      } else if (data.codigo === 'DB_NO_CONFIGURADA') {
        setPedidoConfirmado({
          codigo: null,
          waUrl: construirMensajeWhatsApp(null),
          guardado: false,
          total: totalPrecio
        });
        setModo('exito');
        guardarCarrito([]);
      } else {
        setErrorPedido(data.error || 'No se pudo registrar el pedido. Intenta de nuevo.');
        if (String(data.error || '').toLowerCase().includes('stock')) {
          refrescarProductos();
        }
      }
    } catch (error) {
      setErrorPedido(
        'No se pudo conectar con el servidor. Puedes enviar tu pedido directamente por WhatsApp.'
      );
    } finally {
      setEnviando(false);
    }
  };

  const enviarSinRegistrar = () => {
    setPedidoConfirmado({
      codigo: null,
      waUrl: construirMensajeWhatsApp(null),
      guardado: false,
      total: totalPrecio
    });
    setModo('exito');
  };

  const mobileCartBar =
    totalItems > 0 && !cartOpen ? (
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-safe bg-gradient-to-t from-ivory via-ivory to-transparent pt-6">
        <button
          type="button"
          onClick={abrirCarrito}
          className="w-full flex items-center justify-between gap-3 bg-elegantBlack text-ivory rounded-2xl px-4 py-3 shadow-2xl border border-champagneGold/40"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="bg-champagneGold text-ivory text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
            Ver mi carrito
          </span>
          <span className="font-bold text-champagneGold">{formatCOP(totalPrecio)}</span>
        </button>
      </div>
    ) : null;

  return (
    <MainLayout
      cartCount={totalItems}
      onOpenCart={abrirCarrito}
      toastMessage={toast}
      mobileCartBar={mobileCartBar}
    >
      {/* Hero */}
      <section className="py-10 sm:py-24 border-b border-dustyRose/30 bg-gradient-to-b from-pastelPink/70 via-ivory to-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-pastelPink border border-dustyRose text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
              Colección Exclusiva Lummar Shop
            </span>
            <h1 className="font-serif text-3xl sm:text-6xl font-bold leading-tight">
              Elegancia que resalta tu{' '}
              <span className="italic text-champagneGold">esencia única</span>
            </h1>
            <p className="text-sm sm:text-lg text-elegantBlack/75 max-w-2xl mx-auto lg:mx-0">
              Descubre bolsos, joyería, fragancias y accesorios seleccionados con amor. Agrega tus
              favoritos y finaliza tu pedido por WhatsApp, sin registrarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <a
                href="#catalogo"
                className="bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-semibold px-7 py-3.5 sm:py-4 rounded-full shadow-lg transition-all"
              >
                Ver productos
              </a>
              <button
                type="button"
                onClick={abrirCarrito}
                className="bg-nudePink/40 hover:bg-nudePink text-elegantBlack border border-dustyRose font-semibold px-6 py-3.5 sm:py-4 rounded-full transition-all"
              >
                Mi carrito ({totalItems})
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] sm:text-xs font-semibold text-elegantBlack/70">
              <div className="bg-ivory/70 border border-dustyRose/50 rounded-xl px-2 py-2.5">
                Envío local
              </div>
              <div className="bg-ivory/70 border border-dustyRose/50 rounded-xl px-2 py-2.5">
                Pago coordinado
              </div>
              <div className="bg-ivory/70 border border-dustyRose/50 rounded-xl px-2 py-2.5">
                Atención directa
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="w-52 h-52 sm:w-80 sm:h-80 rounded-full p-2.5 sm:p-3 bg-gradient-to-tr from-champagneGold via-softGold to-dustyRose shadow-2xl">
              <img
                src="/img/logo.jpg"
                alt="Lummar Shop"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover rounded-full border-4 border-ivory"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-10">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-champagneGold">
              Catálogo Oficial
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold mt-1">Piezas disponibles</h2>
            <p className="text-xs sm:text-sm text-elegantBlack/60 mt-1">
              {productosFiltrados.length} producto{productosFiltrados.length === 1 ? '' : 's'} para
              ti
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-elegantBlack/40"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar producto..."
              aria-label="Buscar producto"
              className="w-full pl-10 pr-4 py-3 rounded-full bg-pastelPink/60 border border-dustyRose text-sm placeholder:text-elegantBlack/40"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categorias.map((nombreCategoria) => {
            const activa = categoria === nombreCategoria;
            return (
              <button
                key={nombreCategoria}
                type="button"
                onClick={() => setCategoria(nombreCategoria)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                  activa
                    ? 'bg-champagneGold text-ivory border-champagneGold shadow'
                    : 'bg-ivory text-elegantBlack border-dustyRose hover:bg-pastelPink'
                }`}
              >
                {nombreCategoria}
              </button>
            );
          })}
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="font-serif text-xl font-bold">No encontramos productos</p>
            <p className="text-sm text-elegantBlack/60 mt-1">
              Prueba con otra búsqueda o categoría.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setCategoria('Todas');
              }}
              className="mt-5 px-5 py-2.5 rounded-full bg-champagneGold text-ivory text-sm font-semibold"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {productosFiltrados.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                onAgregar={agregarAlCarrito}
              />
            ))}
          </div>
        )}
      </section>

      {/* Espacio para la barra móvil del carrito */}
      {totalItems > 0 && <div className="h-20 sm:hidden" />}

      {/* Carrito / Checkout */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-elegantBlack/55 backdrop-blur-sm animate-fade-in"
            onClick={cerrarCarrito}
            aria-hidden="true"
          />

          <aside className="relative w-full sm:max-w-md bg-ivory h-[100dvh] sm:h-full shadow-2xl border-l border-dustyRose flex flex-col z-10 animate-slide-right">
            <div className="px-4 sm:px-6 py-4 bg-pastelPink border-b border-dustyRose flex items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold">
                  {modo === 'checkout'
                    ? 'Finalizar pedido'
                    : modo === 'exito'
                      ? 'Pedido listo'
                      : 'Tu carrito'}
                </h3>
                <p className="text-[11px] text-elegantBlack/60">
                  {modo === 'carrito'
                    ? `${totalItems} producto${totalItems === 1 ? '' : 's'}`
                    : modo === 'checkout'
                      ? 'Completa tus datos de contacto'
                      : 'Último paso: enviar por WhatsApp'}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarCarrito}
                aria-label="Cerrar carrito"
                className="w-10 h-10 rounded-full bg-ivory border border-dustyRose flex items-center justify-center shrink-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {modo === 'exito' && pedidoConfirmado && (
                <div className="p-6 space-y-5 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-3xl">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold">
                      {pedidoConfirmado.guardado ? 'Pedido registrado' : 'Pedido listo'}
                    </h4>
                    <p className="text-sm text-elegantBlack/70 mt-1">
                      {pedidoConfirmado.guardado
                        ? `Código ${pedidoConfirmado.codigo}`
                        : 'Guarda este pedido enviándolo por WhatsApp'}
                    </p>
                    <p className="text-2xl font-bold text-champagneGold mt-3">
                      {formatCOP(pedidoConfirmado.total)}
                    </p>
                  </div>

                  {!pedidoConfirmado.guardado && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold text-left">
                      La base de datos aún no está conectada, así que el pedido no quedó guardado.
                      Envíalo por WhatsApp para no perder la venta.
                    </div>
                  )}

                  <a
                    href={pedidoConfirmado.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setCartOpen(false);
                      setModo('carrito');
                      setPedidoConfirmado(null);
                    }}
                    className="block w-full bg-[#25D366] hover:brightness-95 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                  >
                    Abrir WhatsApp y confirmar
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      setModo('carrito');
                      setPedidoConfirmado(null);
                    }}
                    className="w-full bg-ivory border border-dustyRose text-elegantBlack font-semibold py-3.5 rounded-2xl"
                  >
                    Seguir comprando
                  </button>
                </div>
              )}

              {modo === 'carrito' && (
                <div className="p-4 sm:p-6 space-y-4">
                  {carrito.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="font-serif text-xl font-bold">Tu carrito está vacío</p>
                      <p className="text-sm text-elegantBlack/60 mt-1">
                        Agrega tus productos favoritos.
                      </p>
                      <button
                        type="button"
                        onClick={cerrarCarrito}
                        className="mt-5 px-5 py-2.5 rounded-full bg-champagneGold text-ivory text-sm font-semibold"
                      >
                        Ver productos
                      </button>
                    </div>
                  ) : (
                    carrito.map((item) => {
                      const stock = Number(
                        productos.find((p) => Number(p.id) === Number(item.id))?.stock ??
                          item.stock ??
                          99
                      );
                      return (
                        <div
                          key={item.id}
                          className="flex gap-3 p-3 rounded-2xl bg-pastelPink/70 border border-dustyRose"
                        >
                          <img
                            src={item.imagen_url}
                            alt={item.nombre}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-dustyRose shrink-0"
                          />
                          <div className="min-w-0 flex-grow">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold leading-snug line-clamp-2">
                                {item.nombre}
                              </h4>
                              <button
                                type="button"
                                onClick={() => quitarDelCarrito(item.id)}
                                aria-label={`Quitar ${item.nombre}`}
                                className="text-elegantBlack/40 hover:text-rose-600 shrink-0 p-1"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  className="w-4 h-4"
                                  aria-hidden="true"
                                >
                                  <path d="M6 6l12 12M18 6 6 18" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-[11px] text-elegantBlack/60 mt-0.5">
                              {formatCOP(item.precio)} c/u
                            </p>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="flex items-center bg-ivory border border-dustyRose rounded-full">
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.id, -1)}
                                  className="w-8 h-8 font-bold"
                                  aria-label="Quitar una unidad"
                                >
                                  −
                                </button>
                                <span className="w-7 text-center text-xs font-bold">
                                  {item.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.id, 1)}
                                  disabled={Number(item.cantidad) >= stock}
                                  className="w-8 h-8 font-bold disabled:opacity-30"
                                  aria-label="Agregar una unidad"
                                >
                                  +
                                </button>
                              </div>
                              <p className="text-sm font-bold text-champagneGold">
                                {formatCOP(item.precio * item.cantidad)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {modo === 'checkout' && (
                <form id="checkout-form" onSubmit={confirmarPedido} className="p-4 sm:p-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setModo('carrito');
                      setErrorPedido('');
                    }}
                    className="text-xs font-bold text-elegantBlack/60 hover:text-champagneGold flex items-center gap-1"
                  >
                    ← Volver al carrito
                  </button>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={cliente.nombre}
                      onChange={(event) =>
                        setCliente({ ...cliente, nombre: event.target.value })
                      }
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      value={cliente.telefono}
                      onChange={(event) =>
                        setCliente({ ...cliente, telefono: event.target.value })
                      }
                      placeholder="300 123 4567"
                      className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Correo (opcional)
                    </label>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={cliente.email}
                      onChange={(event) => setCliente({ ...cliente, email: event.target.value })}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Dirección de entrega (opcional)
                    </label>
                    <input
                      type="text"
                      autoComplete="street-address"
                      value={cliente.direccion}
                      onChange={(event) =>
                        setCliente({ ...cliente, direccion: event.target.value })
                      }
                      placeholder="Barrio, calle, ciudad"
                      className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      rows="2"
                      value={cliente.notas}
                      onChange={(event) => setCliente({ ...cliente, notas: event.target.value })}
                      placeholder="Color, talla, indicaciones..."
                      className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose resize-none"
                    />
                  </div>

                  {errorPedido && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
                      {errorPedido}
                    </div>
                  )}

                  {!dbConfigurado && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                      Modo demostración: configura DATABASE_URL para guardar pedidos. Mientras
                      tanto puedes enviarlos por WhatsApp.
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-pastelPink border border-dustyRose flex items-center justify-between">
                    <span className="text-sm font-semibold">Total del pedido</span>
                    <span className="text-xl font-bold text-champagneGold">
                      {formatCOP(totalPrecio)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-4 rounded-2xl shadow-lg transition-all disabled:opacity-60"
                  >
                    {enviando ? 'Registrando pedido...' : 'Registrar pedido'}
                  </button>

                  <button
                    type="button"
                    onClick={enviarSinRegistrar}
                    className="w-full text-xs font-semibold text-elegantBlack/60 hover:text-champagneGold py-2"
                  >
                    Prefiero enviarlo directo por WhatsApp
                  </button>
                </form>
              )}
            </div>

            {modo === 'carrito' && carrito.length > 0 && (
              <div className="p-4 sm:p-6 bg-pastelPink border-t border-dustyRose space-y-3 pb-safe">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-2xl font-serif font-bold text-champagneGold">
                    {formatCOP(totalPrecio)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorPedido('');
                    setModo('checkout');
                  }}
                  className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-4 rounded-2xl shadow-lg transition-all"
                >
                  Finalizar pedido
                </button>
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={vaciarCarrito}
                    className="font-semibold text-elegantBlack/50 hover:text-rose-600"
                  >
                    Vaciar carrito
                  </button>
                  <span className="text-elegantBlack/50">Pago coordinado por WhatsApp</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
