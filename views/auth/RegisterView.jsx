// views/auth/RegisterView.jsx
// Registro de administrador con Google OAuth + contraseña Bcrypt.

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '../layouts/MainLayout';

export default function RegisterView({ googleEnabled = true }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setExito('');

    if (!session?.user?.email) {
      setError('Primero verifica tu identidad con Google usando el botón superior.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: session.user.name || session.user.email,
          email: session.user.email,
          googleId: session.user.id || session.user.email,
          avatarUrl: session.user.image,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar el administrador.');
      } else {
        setExito('Cuenta creada correctamente. Entrando al panel...');
        setTimeout(() => router.push('/admin'), 1200);
      }
    } catch (err) {
      setError('Error de red al conectar con el servidor.');
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
              Seguridad de doble capa
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
              Registro de administrador
            </h1>
            <p className="text-xs text-elegantBlack/70 mt-2">
              Verifica tu identidad con Google y define una contraseña maestra.
            </p>
          </div>

          {!googleEnabled ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-ivory border border-dustyRose text-sm text-elegantBlack/75">
                Google OAuth no está configurado en este despliegue. Para crear el primer
                administrador de forma segura, usa la página de configuración inicial.
              </div>
              <Link
                href="/setup"
                className="block w-full text-center bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl shadow"
              >
                Ir a configuración inicial
              </Link>
              <Link
                href="/login"
                className="block w-full text-center bg-ivory border border-dustyRose font-semibold py-3.5 rounded-xl text-sm"
              >
                Ya tengo cuenta: iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                {!session ? (
                  <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/register' })}
                    className="w-full bg-ivory hover:bg-nudePink/30 text-elegantBlack border border-dustyRose font-semibold py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                      <path fill="#FBBC05" d="M5.3 14.2c-.2-.7-.3-1.4-.3-2.2s.1-1.5.3-2.2L1.6 7C.6 9 0 11.2 0 12s.6 3 1.6 5l3.7-2.8z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z" />
                    </svg>
                    1. Verificar con Google
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-ivory border border-champagneGold flex items-center gap-3">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-10 h-10 rounded-full border border-champagneGold"
                      />
                    )}
                    <div className="text-left min-w-0">
                      <p className="text-[11px] font-bold text-champagneGold">
                        ✓ Cuenta de Google verificada
                      </p>
                      <p className="text-sm font-bold truncate">{session.user.name}</p>
                      <p className="text-xs text-elegantBlack/70 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
                  {error}
                </div>
              )}
              {exito && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                  {exito}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    2. Contraseña maestra
                  </label>
                  <input
                    type="password"
                    required
                    disabled={!session}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                    className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    required
                    disabled={!session}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!session || cargando}
                  className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {cargando ? 'Guardando contraseña...' : 'Completar registro'}
                </button>
              </form>

              <p className="text-center text-xs mt-6 text-elegantBlack/70">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-champagneGold font-bold underline">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
