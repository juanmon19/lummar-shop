// views/admin/AdminDashboardView.jsx
// Panel de Administración protegido por Middleware JWT y sesión de Google/Bcrypt

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import MainLayout from '../layouts/MainLayout';

export default function AdminDashboardView({ adminUser, initialProducts = [] }) {
  const router = useRouter();
  const [productos, setProductos] = useState(initialProducts);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Bolsos');
  const [precio, setPrecio] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setMensaje('');

    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        categoria,
        precio: Number(precio),
        imagen_url: imagenUrl
      })
    });

    const data = await res.json();
    if (res.ok && data.producto) {
      setProductos([data.producto, ...productos]);
      setMensaje('Producto guardado en la base de datos PostgreSQL.');
      setNombre('');
      setPrecio('');
      setImagenUrl('');
    } else {
      // Respaldo LocalStorage si aún no se ha conectado DATABASE_URL
      const nuevoLocal = {
        id: Date.now(),
        nombre,
        categoria,
        precio: Number(precio),
        imagen_url: imagenUrl
      };
      const guardados = JSON.parse(localStorage.getItem('lummar_custom_products') || '[]');
      localStorage.setItem('lummar_custom_products', JSON.stringify([nuevoLocal, ...guardados]));
      setProductos([nuevoLocal, ...productos]);
      setMensaje('Producto guardado temporalmente en LocalStorage (Configura DATABASE_URL en Vercel para persistencia SQL).');
    }
  };

  const handleCerrarSesion = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dustyRose">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-champagneGold">
              Sesión Verificada con JWT + Bcrypt + Google
            </span>
            <h1 className="font-serif text-3xl font-bold">
              Bienvenido, {adminUser?.nombre || 'Administrador'}
            </h1>
            <p className="text-xs text-elegantBlack/70">{adminUser?.email}</p>
          </div>
          <button
            onClick={handleCerrarSesion}
            className="px-5 py-2.5 rounded-xl bg-elegantBlack text-ivory text-xs font-bold hover:opacity-90"
          >
            Cerrar Sesión Segura
          </button>
        </div>

        {mensaje && (
          <div className="mt-6 p-4 rounded-2xl bg-pastelPink border border-champagneGold text-sm font-semibold">
            ✨ {mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <div className="lg:col-span-5 bg-pastelPink p-6 rounded-3xl border border-dustyRose h-fit">
            <h2 className="font-serif text-xl font-bold mb-4">Agregar Producto al Catálogo</h2>
            <form onSubmit={handleCrearProducto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Precio ($)</label>
                  <input
                    type="number"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Categoría</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">URL de Imagen</label>
                <input
                  type="url"
                  required
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl shadow"
              >
                Publicar Producto
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <h2 className="font-serif text-xl font-bold mb-4">
              Productos Activos ({productos.length})
            </h2>
            {productos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-pastelPink/60 border border-dustyRose"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-14 h-14 rounded-xl object-cover border border-dustyRose"
                  />
                  <div>
                    <h3 className="font-bold text-sm">{p.nombre}</h3>
                    <p className="text-xs font-bold text-champagneGold">
                      ${Number(p.precio).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
