// views/admin/AdminDashboardView.jsx
// Panel de administración mobile-first: productos, fotos, stock y pedidos.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import MainLayout from '../layouts/MainLayout';
import { optimizarImagen } from '../../lib/image';
import {
  ESTADOS_PEDIDO,
  estadoPedido,
  formatCOP,
  formatFecha,
  normalizarWhatsApp,
  telefonoBonito
} from '../../lib/format';

function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Metrica({ etiqueta, valor, detalle }) {
  return (
    <div className="bg-pastelPink/70 border border-dustyRose rounded-2xl p-3.5 sm:p-4">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-elegantBlack/55">
        {etiqueta}
      </p>
      <p className="font-serif text-2xl sm:text-3xl font-bold mt-1">{valor}</p>
      {detalle && <p className="text-[10px] sm:text-xs text-elegantBlack/55 mt-0.5">{detalle}</p>}
    </div>
  );
}

function ProductoFormModal({
  abierto,
  producto,
  categorias,
  dbConfigurado,
  onCerrar,
  onGuardar
}) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Bolsos',
    precio: '',
    stock: '10',
    sku: '',
    imagen_url: '',
    destacado: false,
    activo: true
  });
  const [procesando, setProcesando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    if (!abierto) return;
    if (producto) {
      setForm({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || 'Colección Exclusiva',
        precio: String(producto.precio ?? ''),
        stock: String(producto.stock ?? 0),
        sku: producto.sku || '',
        imagen_url: producto.imagen_url || '',
        destacado: Boolean(producto.destacado),
        activo: producto.activo !== false
      });
    } else {
      setForm({
        nombre: '',
        descripcion: '',
        categoria: categorias.find((c) => c && c !== 'Todas') || 'Bolsos',
        precio: '',
        stock: '10',
        sku: '',
        imagen_url: '',
        destacado: false,
        activo: true
      });
    }
    setError('');
    setExito('');
  }, [abierto, producto, categorias]);

  useEffect(() => {
    if (!abierto) return undefined;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [abierto]);

  if (!abierto) return null;

  const cambiar = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }));

  const seleccionarFoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError('');
    setExito('');
    try {
      const resultado = await optimizarImagen(file);
      cambiar('imagen_url', resultado.dataUrl);
      setExito(`Foto optimizada (${resultado.kb} KB · ${resultado.width}×${resultado.height})`);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la imagen.');
    } finally {
      setSubiendo(false);
      event.target.value = '';
    }
  };

  const enviar = async (event) => {
    event.preventDefault();
    setError('');
    setExito('');

    if (!dbConfigurado) {
      setError('Conecta DATABASE_URL y ejecuta /setup antes de guardar productos.');
      return;
    }
    if (!form.imagen_url) {
      setError('Sube una foto o pega la URL de la imagen.');
      return;
    }

    setProcesando(true);
    try {
      const resultado = await onGuardar(
        {
          ...form,
          precio: Number(form.precio),
          stock: Number(form.stock || 0)
        },
        producto?.id
      );

      if (!resultado.ok) {
        setError(resultado.error || 'No se pudo guardar el producto.');
        return;
      }

      setExito(producto ? 'Producto actualizado.' : 'Producto publicado.');
      setTimeout(() => onCerrar(), 450);
    } catch (err) {
      setError(err.message || 'Error de conexión al guardar el producto.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-elegantBlack/55 backdrop-blur-sm animate-fade-in"
        onClick={procesando ? undefined : onCerrar}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto ? 'Editar producto' : 'Nuevo producto'}
        className="relative w-full sm:max-w-2xl bg-ivory rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] overflow-y-auto animate-slide-up"
      >
        <div className="sticky top-0 z-10 bg-ivory/95 backdrop-blur border-b border-dustyRose/50 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-champagneGold">
              Catálogo Lummar
            </p>
            <h2 className="font-serif text-xl font-bold">
              {producto ? 'Editar producto' : 'Nuevo producto'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            aria-label="Cerrar formulario"
            className="w-10 h-10 rounded-full bg-pastelPink border border-dustyRose flex items-center justify-center shrink-0"
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

        <form onSubmit={enviar} className="p-4 sm:p-6 space-y-4">
          {!dbConfigurado && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
              Estás en modo demostración. Para guardar productos necesitas DATABASE_URL y ejecutar
              la configuración en <a href="/setup" className="underline font-bold">/setup</a>.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                Nombre del producto *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={form.nombre}
                onChange={(event) => cambiar('nombre', event.target.value)}
                placeholder="Ej: Bolso Tote Rose Gold"
                className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                Precio (COP) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="100"
                inputMode="numeric"
                value={form.precio}
                onChange={(event) => cambiar('precio', event.target.value)}
                placeholder="145000"
                className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                Stock disponible *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                inputMode="numeric"
                value={form.stock}
                onChange={(event) => cambiar('stock', event.target.value)}
                placeholder="10"
                className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                Categoría *
              </label>
              <input
                type="text"
                required
                list="lummar-categorias"
                value={form.categoria}
                onChange={(event) => cambiar('categoria', event.target.value)}
                placeholder="Bolsos, Joyería, Beauty..."
                className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
              />
              <datalist id="lummar-categorias">
                {Array.from(new Set([...categorias.filter((c) => c !== 'Todas'), 'Bolsos', 'Joyería', 'Fragancias', 'Beauty', 'Accesorios'])).map(
                  (categoria) => (
                    <option key={categoria} value={categoria} />
                  )
                )}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                SKU / Referencia (opcional)
              </label>
              <input
                type="text"
                maxLength={60}
                value={form.sku}
                onChange={(event) => cambiar('sku', event.target.value)}
                placeholder="LMM-001"
                className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                Descripción
              </label>
              <textarea
                rows="3"
                maxLength={2000}
                value={form.descripcion}
                onChange={(event) => cambiar('descripcion', event.target.value)}
                placeholder="Materiales, medidas, detalles del producto..."
                className="w-full px-4 py-3 rounded-xl bg-pastelPink/50 border border-dustyRose resize-none"
              />
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-pastelPink/60 border border-dustyRose space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">Foto del producto *</p>
                <p className="text-[11px] text-elegantBlack/55">
                  Súbela desde la cámara o galería del celular.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={subiendo}
                className="shrink-0 px-3.5 py-2.5 rounded-xl bg-elegantBlack text-ivory text-xs font-bold disabled:opacity-60"
              >
                {subiendo ? 'Optimizando...' : 'Subir foto'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={seleccionarFoto}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-elegantBlack/40">
              <span className="h-px bg-dustyRose flex-1" />
              o usa una URL
              <span className="h-px bg-dustyRose flex-1" />
            </div>

            <input
              type="text"
              value={form.imagen_url.startsWith('data:image/') ? '' : form.imagen_url}
              onChange={(event) => cambiar('imagen_url', event.target.value)}
              placeholder={form.imagen_url.startsWith('data:image/') ? 'Foto cargada desde el dispositivo ✓' : 'https://...'}
              className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose text-xs"
            />

            {form.imagen_url && (
              <div className="flex items-center gap-3">
                <img
                  src={form.imagen_url}
                  alt="Vista previa"
                  className="w-20 h-20 rounded-xl object-cover border border-dustyRose"
                />
                <button
                  type="button"
                  onClick={() => cambiar('imagen_url', '')}
                  className="text-xs font-semibold text-rose-700 hover:underline"
                >
                  Quitar imagen
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-pastelPink/50 border border-dustyRose cursor-pointer">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => cambiar('activo', event.target.checked)}
                className="w-5 h-5 accent-champagneGold"
              />
              <span>
                <span className="block text-sm font-bold">Visible en la tienda</span>
                <span className="block text-[11px] text-elegantBlack/55">
                  Desactívalo para ocultarlo sin borrarlo.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-pastelPink/50 border border-dustyRose cursor-pointer">
              <input
                type="checkbox"
                checked={form.destacado}
                onChange={(event) => cambiar('destacado', event.target.checked)}
                className="w-5 h-5 accent-champagneGold"
              />
              <span>
                <span className="block text-sm font-bold">Producto destacado</span>
                <span className="block text-[11px] text-elegantBlack/55">
                  Aparece primero en el catálogo.
                </span>
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
              {error}
            </div>
          )}
          {exito && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
              {exito}
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 bg-ivory/95 backdrop-blur border-t border-dustyRose/50 pb-safe">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCerrar}
                disabled={procesando}
                className="flex-1 bg-ivory border border-dustyRose font-semibold py-3.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando || subiendo || !dbConfigurado}
                className="flex-1 bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl text-sm shadow disabled:opacity-60"
              >
                {procesando ? 'Guardando...' : producto ? 'Guardar cambios' : 'Publicar producto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function PedidoCard({ pedido, actualizando, onCambiarEstado }) {
  const estado = estadoPedido(pedido.estado);
  const telefono = normalizarWhatsApp(pedido.cliente_telefono);
  const waUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(
    `Hola ${pedido.cliente_nombre}, te escribimos de Lummar Shop por tu pedido ${pedido.codigo}.`
  )}`;

  return (
    <div className="bg-pastelPink/60 border border-dustyRose rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-lg font-bold">{pedido.codigo}</p>
          <p className="text-[11px] text-elegantBlack/55">{formatFecha(pedido.creado_en)}</p>
        </div>
        <Badge className={estado.clase}>{estado.etiqueta}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <p className="font-bold text-sm">{pedido.cliente_nombre}</p>
          <p className="text-elegantBlack/70">{telefonoBonito(pedido.cliente_telefono)}</p>
          {pedido.cliente_email && (
            <p className="text-elegantBlack/60 truncate">{pedido.cliente_email}</p>
          )}
        </div>
        <div className="sm:text-right space-y-1">
          <a
            href={`tel:${telefono}`}
            className="inline-block text-champagneGold font-bold hover:underline"
          >
            Llamar
          </a>
          <span className="text-elegantBlack/30 mx-1">·</span>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-emerald-700 font-bold hover:underline"
          >
            WhatsApp
          </a>
        </div>
      </div>

      {pedido.direccion && (
        <p className="text-xs text-elegantBlack/70">
          <span className="font-bold">Entrega:</span> {pedido.direccion}
        </p>
      )}

      <div className="bg-ivory/70 border border-dustyRose/60 rounded-xl p-3 space-y-1.5">
        {(pedido.items || []).map((item, indice) => (
          <div key={`${pedido.id}-${item.id}-${indice}`} className="flex justify-between gap-2 text-xs">
            <span className="min-w-0">
              {item.nombre} <span className="font-bold">×{item.cantidad}</span>
            </span>
            <span className="font-semibold shrink-0">{formatCOP(item.total)}</span>
          </div>
        ))}
        <div className="flex justify-between gap-2 pt-2 border-t border-dustyRose/60">
          <span className="text-sm font-bold">Total</span>
          <span className="text-sm font-bold text-champagneGold">{formatCOP(pedido.subtotal)}</span>
        </div>
      </div>

      {pedido.notas && (
        <p className="text-xs text-elegantBlack/70">
          <span className="font-bold">Notas:</span> {pedido.notas}
        </p>
      )}

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-elegantBlack/55 mb-1">
          Cambiar estado
        </label>
        <select
          value={pedido.estado}
          disabled={actualizando}
          onChange={(event) => onCambiarEstado(pedido, event.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-ivory border border-dustyRose text-xs font-semibold disabled:opacity-60"
        >
          {ESTADOS_PEDIDO.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AdminDashboardView({
  adminUser,
  initialProducts = [],
  dbConfigurado = false,
  dbError = null
}) {
  const router = useRouter();
  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState(initialProducts);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [pedidosCargados, setPedidosCargados] = useState(false);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [actualizandoPedido, setActualizandoPedido] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargarPedidos = useCallback(async () => {
    if (!dbConfigurado) {
      setPedidosCargados(true);
      return;
    }

    setCargandoPedidos(true);
    setErrorPedidos('');
    try {
      const res = await fetch('/api/pedidos', { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        setErrorPedidos(data.error || 'No se pudieron cargar los pedidos.');
        return;
      }
      setPedidos(Array.isArray(data.pedidos) ? data.pedidos : []);
      setPedidosCargados(true);
    } catch (err) {
      setErrorPedidos('Error de conexión al cargar los pedidos.');
    } finally {
      setCargandoPedidos(false);
    }
  }, [dbConfigurado, router]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const timer = setTimeout(() => setMensaje(''), 4500);
    return () => clearTimeout(timer);
  }, [mensaje]);

  const categorias = useMemo(
    () => ['Todas', ...Array.from(new Set(productos.map((producto) => producto.categoria).filter(Boolean)))],
    [productos]
  );

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return productos;
    return productos.filter((producto) =>
      `${producto.nombre} ${producto.categoria} ${producto.sku || ''}`
        .toLowerCase()
        .includes(termino)
    );
  }, [productos, busqueda]);

  const pedidosPendientes = pedidos.filter((pedido) => pedido.estado === 'pendiente').length;
  const bajoStock = productos.filter(
    (producto) => Number(producto.stock) <= 3 && producto.activo !== false
  ).length;
  const activos = productos.filter((producto) => producto.activo !== false).length;

  const pedidosFiltrados = pedidos.filter(
    (pedido) => filtroEstado === 'todos' || pedido.estado === filtroEstado
  );

  const guardarProducto = async (payload, id) => {
    const url = id ? `/api/productos/${id}` : '/api/productos';
    const res = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      data = {};
    }

    if (res.status === 401) {
      router.push('/login');
      return { ok: false, error: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
    }
    if (!res.ok || !data.producto) {
      return { ok: false, error: data.error || 'No se pudo guardar el producto.' };
    }

    const producto = data.producto;
    setProductos((actuales) => {
      if (id) {
        return actuales.map((item) =>
          Number(item.id) === Number(producto.id) ? producto : item
        );
      }
      return [producto, ...actuales];
    });
    setMensaje(id ? 'Producto actualizado correctamente.' : 'Producto publicado en la tienda.');
    setError('');
    return { ok: true, producto };
  };

  const eliminarProducto = async (producto) => {
    const confirmado = window.confirm(
      `¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setEliminando(producto.id);
    setError('');
    try {
      const res = await fetch(`/api/productos/${producto.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        setError(data.error || 'No se pudo eliminar el producto.');
        return;
      }
      setProductos((actuales) =>
        actuales.filter((item) => Number(item.id) !== Number(producto.id))
      );
      setMensaje('Producto eliminado.');
    } catch (err) {
      setError('Error de conexión al eliminar el producto.');
    } finally {
      setEliminando(null);
    }
  };

  const cambiarEstadoPedido = async (pedido, estado) => {
    setActualizandoPedido(pedido.id);
    setErrorPedidos('');
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        setErrorPedidos(data.error || 'No se pudo actualizar el estado.');
        return;
      }

      setPedidos((actuales) =>
        actuales.map((item) =>
          Number(item.id) === Number(pedido.id) ? data.pedido : item
        )
      );
      setMensaje(`Pedido ${pedido.codigo} marcado como ${estado}.`);
    } catch (err) {
      setErrorPedidos('Error de conexión al actualizar el pedido.');
    } finally {
      setActualizandoPedido(null);
    }
  };

  const refrescarTodo = async () => {
    setRefrescando(true);
    try {
      if (dbConfigurado) {
        const res = await fetch('/api/productos?all=1', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.productos)) {
          setProductos(data.productos);
        }
      }
      await cargarPedidos();
      setMensaje('Datos actualizados.');
    } finally {
      setRefrescando(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // La cookie se limpia en el siguiente paso igualmente.
    }
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-dustyRose">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-champagneGold">
              Panel de administración
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">
              Hola, {adminUser?.nombre || 'Administrador'}
            </h1>
            <p className="text-[11px] sm:text-xs text-elegantBlack/60 truncate">
              {adminUser?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refrescarTodo}
              disabled={refrescando}
              className="px-3.5 py-2.5 rounded-xl bg-pastelPink border border-dustyRose text-xs font-bold disabled:opacity-60"
            >
              {refrescando ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button
              type="button"
              onClick={cerrarSesion}
              className="px-3.5 py-2.5 rounded-xl bg-elegantBlack text-ivory text-xs font-bold hover:opacity-90"
            >
              Salir
            </button>
          </div>
        </div>

        {!dbConfigurado && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm">
            <p className="font-bold">Modo demostración: todavía no hay base de datos conectada.</p>
            <p className="mt-1">
              Configura <code className="font-mono">DATABASE_URL</code> en Vercel y entra a{' '}
              <a href="/setup" className="underline font-bold">
                /setup
              </a>{' '}
              para crear las tablas y tu administrador. Los cambios que hagas ahora no se
              guardarán.
            </p>
          </div>
        )}

        {dbError && (
          <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs sm:text-sm">
            <p className="font-bold">No se pudo conectar a PostgreSQL.</p>
            <p className="mt-1 break-words">{dbError}</p>
          </div>
        )}

        {mensaje && (
          <div className="mt-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold">
            ✓ {mensaje}
          </div>
        )}
        {error && (
          <div className="mt-5 p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs sm:text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Metrica etiqueta="Productos" valor={productos.length} detalle={`${activos} visibles`} />
          <Metrica etiqueta="Bajo stock" valor={bajoStock} detalle="3 unidades o menos" />
          <Metrica
            etiqueta="Pedidos"
            valor={pedidos.length}
            detalle={pedidosCargados ? 'Registrados en total' : 'Cargando...'}
          />
          <Metrica etiqueta="Pendientes" valor={pedidosPendientes} detalle="Por atender" />
        </div>

        <div className="sticky top-16 sm:top-20 z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-3 bg-ivory/95 backdrop-blur mt-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-pastelPink rounded-2xl border border-dustyRose max-w-md">
            <button
              type="button"
              onClick={() => setTab('productos')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === 'productos' ? 'bg-ivory shadow text-elegantBlack' : 'text-elegantBlack/55'
              }`}
            >
              Productos
            </button>
            <button
              type="button"
              onClick={() => setTab('pedidos')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                tab === 'pedidos' ? 'bg-ivory shadow text-elegantBlack' : 'text-elegantBlack/55'
              }`}
            >
              Pedidos
              {pedidosPendientes > 0 && (
                <span className="bg-champagneGold text-ivory text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                  {pedidosPendientes}
                </span>
              )}
            </button>
          </div>
        </div>

        {tab === 'productos' && (
          <section className="mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-80">
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
                  placeholder="Buscar en el catálogo..."
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-pastelPink/60 border border-dustyRose text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setProductoEditando(null);
                  setModalAbierto(true);
                }}
                className="hidden sm:flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold text-sm shadow"
              >
                + Nuevo producto
              </button>
            </div>

            {productosFiltrados.length === 0 ? (
              <div className="text-center py-14 bg-pastelPink/40 border border-dashed border-dustyRose rounded-2xl">
                <p className="font-serif text-xl font-bold">No hay productos aquí</p>
                <p className="text-sm text-elegantBlack/60 mt-1">
                  Publica tu primer producto para que aparezca en la tienda.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProductoEditando(null);
                    setModalAbierto(true);
                  }}
                  className="mt-4 px-5 py-2.5 rounded-full bg-champagneGold text-ivory text-sm font-semibold"
                >
                  Crear producto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {productosFiltrados.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex gap-3 p-3 rounded-2xl bg-pastelPink/60 border border-dustyRose"
                  >
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl object-cover border border-dustyRose shrink-0"
                    />
                    <div className="min-w-0 flex-grow flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm leading-snug line-clamp-2">
                            {producto.nombre}
                          </h3>
                          <Badge
                            className={
                              producto.activo === false
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }
                          >
                            {producto.activo === false ? 'Oculto' : 'Visible'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-elegantBlack/60 mt-0.5">
                          {producto.categoria}
                          {producto.sku ? ` · ${producto.sku}` : ''}
                        </p>
                        <p className="text-base font-bold text-elegantBlack mt-1">
                          {formatCOP(producto.precio)}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              Number(producto.stock) <= 3
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-ivory text-elegantBlack/70 border-dustyRose'
                            }`}
                          >
                            Stock: {producto.stock}
                          </span>
                          {producto.destacado && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-champagneGold/20 text-champagneGold border border-champagneGold/40">
                              Destacado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setProductoEditando(producto);
                            setModalAbierto(true);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg bg-ivory border border-dustyRose text-xs font-bold"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarProducto(producto)}
                          disabled={eliminando === producto.id}
                          className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold disabled:opacity-50"
                        >
                          {eliminando === producto.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'pedidos' && (
          <section className="mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[{ valor: 'todos', etiqueta: 'Todos' }, ...ESTADOS_PEDIDO].map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setFiltroEstado(opcion.valor)}
                    className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border ${
                      filtroEstado === opcion.valor
                        ? 'bg-champagneGold text-ivory border-champagneGold'
                        : 'bg-ivory border-dustyRose text-elegantBlack/65'
                    }`}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={cargarPedidos}
                disabled={cargandoPedidos}
                className="px-4 py-2.5 rounded-xl bg-pastelPink border border-dustyRose text-xs font-bold disabled:opacity-60"
              >
                {cargandoPedidos ? 'Cargando...' : 'Recargar pedidos'}
              </button>
            </div>

            {errorPedidos && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
                {errorPedidos}
              </div>
            )}

            {cargandoPedidos && pedidos.length === 0 ? (
              <div className="text-center py-14 text-sm text-elegantBlack/60">
                Cargando pedidos...
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-14 bg-pastelPink/40 border border-dashed border-dustyRose rounded-2xl">
                <p className="font-serif text-xl font-bold">
                  {pedidos.length === 0 ? 'Todavía no hay pedidos' : 'No hay pedidos con ese estado'}
                </p>
                <p className="text-sm text-elegantBlack/60 mt-1">
                  Cuando un cliente finalice su compra, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {pedidosFiltrados.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    actualizando={Number(actualizandoPedido) === Number(pedido.id)}
                    onCambiarEstado={cambiarEstadoPedido}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <div className="h-16 sm:hidden" />
      </div>

      {tab === 'productos' && (
        <button
          type="button"
          onClick={() => {
            setProductoEditando(null);
            setModalAbierto(true);
          }}
          aria-label="Nuevo producto"
          className="sm:hidden fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-champagneGold text-ivory text-3xl font-light shadow-2xl border-2 border-ivory flex items-center justify-center"
        >
          +
        </button>
      )}

      <ProductoFormModal
        abierto={modalAbierto}
        producto={productoEditando}
        categorias={categorias}
        dbConfigurado={dbConfigurado}
        onCerrar={() => {
          setModalAbierto(false);
          setProductoEditando(null);
        }}
        onGuardar={guardarProducto}
      />
    </MainLayout>
  );
}
