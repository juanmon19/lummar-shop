// views/auth/LoginView.jsx
// Login de administrador: correo + contraseña Bcrypt y Google OAuth opcional.

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '../layouts/MainLayout';

export default function LoginView({ googleEnabled = true }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const destino =
    typeof router.query.redirect === 'string' && router.query.redirect.startsWith('/')
      ? router.query.redirect
      : '/admin';

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setCargando(true);

    try {
      const correoAUsar = session?.user?.email || email;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: correoAUsar,
          password,
          googleVerificado: Boolean(session?.user?.email)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenciales incorrectas.');
      } else {
        router.push(destino);
      }
    } catch (err) {
      setError('Error al conectar con el servidor de autenticación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <MainLayout>
      <div className="px-3 sm:px-4 py-8 sm:py-14">
        <div className="max-w-md mx-auto bg-pastelPink border border-dustyRose rounded-3xl p-5 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-champagneGold">
              Portal de acceso seguro
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">Iniciar sesión</h1>
            <p className="text-xs text-elegantBlack/70 mt-1">
              Administra tus productos y pedidos desde el celular.
            </p>
          </div>

          {googleEnabled && (
            <div className="mb-5">
              {!session ? (
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/login' })}
                  className="w-full bg-ivory hover:bg-nudePink/30 text-elegantBlack border border-dustyRose font-semibold py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                    <path fill="#FBBC05" d="M5.3 14.2c-.2-.7-.3-1.4-.3-2.2s.1-1.5.3-2.2L1.6 7C.6 9 0 11.2 0 12s.6 3 1.6 5l3.7-2.8z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z" />
                  </svg>
                  Continuar con Google
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-ivory border border-champagneGold flex items-center gap-3">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-10 h-10 rounded-full border border-champagneGold"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-champagneGold">
                      Google conectado
                    </p>
                    <p className="text-xs font-semibold truncate">{session.user.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!googleEnabled && (
            <div className="mb-5 p-3.5 rounded-xl bg-ivory border border-dustyRose text-xs text-elegantBlack/75">
              Google OAuth no está configurado. Ingresa con tu correo y contraseña. Si es la
              primera vez, ve a{' '}
              <Link href="/setup" className="font-bold text-champagneGold underline">
                /setup
              </Link>{' '}
              para crear la base de datos y tu administrador.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {!session && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Correo electrónico
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
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-ivory border border-dustyRose"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((visible) => !visible)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-elegantBlack/50"
                >
                  {mostrarPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl shadow transition-all disabled:opacity-60"
            >
              {cargando ? 'Verificando...' : 'Entrar al panel'}
            </button>
          </form>

          <p className="text-center text-xs mt-6 text-elegantBlack/70">
            {googleEnabled ? (
              <>
                ¿Aún no tienes cuenta?{' '}
                <Link href="/register" className="text-champagneGold font-bold underline">
                  Regístrate con Google
                </Link>
              </>
            ) : (
              <>
                ¿Primera vez?{' '}
                <Link href="/setup" className="text-champagneGold font-bold underline">
                  Configurar la tienda
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
