// config/security.js
// Utilidades de Seguridad: Hash con Bcrypt (12 rondas) y Tokens JWT (HS256)

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { serialize, parse } from 'cookie';

const SALT_ROUNDS = 12;
const COOKIE_NAME = 'lummar_admin_token';

function getSecretKey() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'lummar_fallback_secret_change_in_vercel_2026';
  return new TextEncoder().encode(secret);
}

// 1. Encriptar contraseña en texto plano con Bcrypt (12 rondas de sal)
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
}

// 2. Verificar contraseña ingresada contra el Hash almacenado en base de datos
export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

// 3. Crear Token JWT firmado para sesión segura
export async function createSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

// 4. Verificar Token JWT
export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (err) {
    return null;
  }
}

// 5. Configurar Cookie HttpOnly para proteger contra robo por XSS
export function setAuthCookie(res, token) {
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/'
  });
  res.setHeader('Set-Cookie', cookie);
}

// 6. Eliminar Cookie al cerrar sesión
export function clearAuthCookie(res) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  });
  res.setHeader('Set-Cookie', cookie);
}

// 7. Leer Cookie desde el request
export function getTokenFromRequest(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[COOKIE_NAME] || null;
}
