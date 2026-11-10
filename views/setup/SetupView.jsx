// views/setup/SetupView.jsx
// Página de configuración inicial: crea las tablas y el primer administrador.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '../layouts/MainLayout';

export default function SetupView() {
  const [health, setHealth] = useState(null);
  const [cargandoHealth, setCargandoHealth] = useState(true);
  const [secreto, setSecreto] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let activo = true;
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (activo) setHealth(data);
      })
      .catch(() => {
        if (activo) setHealth(null);
      })
      .finally(() => {
        if (activo) setCargandoHealth(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const enviar = async (event) => {
    event.preventDefault();
    setError('');
    setResultado(null);

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secreto, nombre, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo completar la configuración.');
      } else {
        setResultado(data);
        setSecreto('');
        setPassword('');
        setConfirmar('');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const dbConectada = health?.database?.connected;
  const dbConfigurada = health?.database?.configured;
  const setupHabilitado = health?.setupHabilitado;

  return (
    <MainLayout>
      <div className="px-3 sm:px-4 py-8 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-champagneGold">
              Configuración inicial
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold mt-1">
              Conecta tu base de datos
            </h1>
            <p className="text-xs sm:text-sm text-elegantBlack/65 mt-2 max-w-lg mx-auto">
              Esta página crea las tablas de productos y pedidos, y registra al primer
              administrador con contraseña Bcrypt.
            </p>
          </div>

          <div className="bg-pastelPink border border-dustyRose rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            <div className="p-3.5 rounded-2xl bg-ivory border border-dustyRose text-xs sm:text-sm">
              <p className="font-bold">Estado del sistema</p>
              {cargandoHealth ? (
                <p className="text-elegantBlack/60 mt-1">Comprobando conexión...</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  <p>
                    <span className="font-semibold">Base de datos:</span>{' '}
                    <span
                      className={
                        dbConectada ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                      }
                    >
                      {dbConectada
                        ? ' conectada ✓'
                        : dbConfigurada
                          ? ' configurada, pero sin conexión'
                          : ' no configurada'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Clave SETUP_SECRET:</span>{' '}
                    <span
                      className={
                        setupHabilitado ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                      }
                    >
                      {setupHabilitado ? ' configurada ✓' : ' falta configurarla'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Google OAuth:</span>{' '}
                    <span className="text-elegantBlack/70">
                      {health?.googleConfigurado ? ' configurado' : ' opcional / no configurado'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {!cargandoHealth && (!dbConfigurada || !setupHabilitado) && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm space-y-2">
                <p className="font-bold">Faltan variables de entorno en Vercel</p>
                {!dbConfigurada && (
                  <p>
                    Agrega <code className="font-mono">DATABASE_URL</code> con la cadena de
                    conexión de Neon, Supabase o Vercel Marketplace. Luego vuelve a desplegar.
                  </p>
                )}
                {!setupHabilitado && (
                  <p>
                    Agrega <code className="font-mono">SETUP_SECRET</code> con una clave larga y
                    privada. Es la que usarás en este formulario.
                  </p>
                )}
              </div>
            )}

            {resultado ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm">
                  <p className="font-bold text-base">✓ {resultado.mensaje}</p>
                  {resultado.adminEmail && (
                    <p className="mt-1">
                      Administrador: <span className="font-semibold">{resultado.adminEmail}</span>
                    </p>
                  )}
                  {resultado.productos > 0 && (
                    <p className="mt-1 text-xs">
                      Catálogo inicial con {resultado.productos} productos listos para editar.
                    </p>
                  )}
                </div>

                <Link
                  href="/login"
                  className="block w-full text-center bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl shadow"
                >
                  Ir a iniciar sesión
                </Link>
                <Link
                  href="/"
                  className="block w-full text-center bg-ivory border border-dustyRose font-semibold py-3.5 rounded-xl text-sm"
                >
                  Ver la tienda
                </Link>
              </div>
            ) : (
              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                    Clave de configuración (SETUP_SECRET) *
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={secreto}
                    onChange={(event) => setSecreto(event.target.value)}
                    placeholder="La misma clave que pusiste en Vercel"
                    className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Nombre del administrador *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tu_correo@gmail.com"
                      className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mín. 8, 1 mayúscula y 1 número"
                      className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1">
                      Confirmar contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmar}
                      onChange={(event) => setConfirmar(event.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={cargando || !dbConfigurada || !setupHabilitado}
                  className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {cargando ? 'Creando tablas y administrador...' : 'Inicializar base de datos'}
                </button>

                <p className="text-[11px] text-elegantBlack/55 text-center">
                  Este formulario se puede usar una sola vez para crear el administrador. Después
                  puedes eliminar <code className="font-mono">SETUP_SECRET</code> de Vercel.
                </p>
              </form>
            )}
          </div>

          <p className="text-center text-xs mt-6 text-elegantBlack/60">
            ¿Ya configuraste todo?{' '}
            <Link href="/login" className="text-champagneGold font-bold underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
