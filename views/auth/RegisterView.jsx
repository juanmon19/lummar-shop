// views/auth/RegisterView.jsx
// Vista de Registro de Administrador: exige vincular cuenta con Google OAuth + Contraseña que se encripta con Bcrypt

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '../layouts/MainLayout';

export default function RegisterView() {
  const { data: session } = useSession();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!session?.user?.email) {
      setError('Primero debes autenticarte con tu cuenta de Google usando el botón superior.');
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
          nombre: session.user.name,
          email: session.user.email,
          googleId: session.user.id || session.user.email,
          avatarUrl: session.user.image,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar administrador.');
      } else {
        setExito('Cuenta registrada con Google y contraseña encriptada con Bcrypt. Redirigiendo a /admin...');
        setTimeout(() => router.push('/admin'), 1500);
      }
    } catch (err) {
      setError('Error de red al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto my-14 bg-pastelPink border border-dustyRose rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-champagneGold">
            Seguridad de Doble Capa
          </span>
          <h1 className="font-serif text-3xl font-bold mt-1">Registro de Administrador</h1>
          <p className="text-xs text-elegantBlack/70 mt-2">
            Paso 1: Verifica tu identidad con Google OAuth.<br />
            Paso 2: Define tu clave maestra (se almacenará con Hash Bcrypt de 12 rondas).
          </p>
        </div>

        {/* Paso 1: Botón Oficial de Google OAuth */}
        <div className="mb-6">
          {!session ? (
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/register' })}
              className="w-full bg-ivory hover:bg-nudePink/30 text-elegantBlack border border-dustyRose font-semibold py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                <path fill="#FBBC05" d="M5.3 14.2c-.2-.7-.3-1.4-.3-2.2s.1-1.5.3-2.2L1.6 7C.6 9 0 11.2 0 12s.6 3 1.6 5l3.7-2.8z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z" />
              </svg>
              1. Continuar y Verificar con Google
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-ivory border border-champagneGold flex items-center gap-3">
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-10 h-10 rounded-full border border-champagneGold" />
              )}
              <div className="text-left">
                <p className="text-xs font-bold text-champagneGold">✓ Cuenta de Google Verificada</p>
                <p className="text-sm font-bold">{session.user.name}</p>
                <p className="text-xs text-elegantBlack/70">{session.user.email}</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {exito && (
          <div className="mb-4 p-3.5 rounded-xl bg-green-100 border border-green-300 text-green-800 text-xs font-semibold">
            {exito}
          </div>
        )}

        {/* Paso 2: Contraseña con Hash Bcrypt */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              2. Crear Contraseña Maestra (Hash Bcrypt)
            </label>
            <input
              type="password"
              required
              disabled={!session}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
              className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              disabled={!session}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              className="w-full px-4 py-3 rounded-xl bg-ivory border border-dustyRose disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!session || cargando}
            className="w-full bg-champagneGold hover:bg-softGold hover:text-elegantBlack text-ivory font-bold py-3.5 rounded-xl shadow transition-all disabled:opacity-50"
          >
            {cargando ? 'Aplicando Hash Bcrypt y Guardando...' : 'Completar Registro Seguro'}
          </button>
        </form>

        <p className="text-center text-xs mt-6 text-elegantBlack/70">
          ¿Ya tienes tu cuenta registrada?{' '}
          <Link href="/login" className="text-champagneGold font-bold underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </MainLayout>
  );
}
