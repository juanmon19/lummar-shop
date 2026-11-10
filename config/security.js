// config/security.js
// Utilidades de seguridad: Hash con Bcrypt (12 rondas), JWT (HS256) y cookies HttpOnly.

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { serialize, parse } from 'cookie';

const SALT_ROUNDS = 12;
const COOKIE_NAME = 'lummar_admin_token';

function getSecretKey() {
  const secret =
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'lummar_fallback_secret_change_in_vercel_2026';
  return new TextEncoder().encode(secret);
}

// 1. Encriptar contraseña con Bcrypt (12 rondas de sal)
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
}

// 2. Verificar contraseña contra el hash almacenado
export async function verifyPassword(plainPassword, passwordHash) {
  if (!passwordHash) return false;
  return bcrypt.compare(plainPassword, passwordHash);
}

// 3. Crear token JWT firmado para la sesión del administrador
export async function createSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

// 4. Verificar token JWT
export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (err) {
    return null;
  }
}

// 5. Configurar cookie HttpOnly (protege contra robo por XSS)
export function setAuthCookie(res, token) {
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/'
  });
  res.setHeader('Set-Cookie', cookie);
}

// 6. Eliminar cookie al cerrar sesión
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

// 7. Leer cookie desde el request
export function getTokenFromRequest(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[COOKIE_NAME] || null;
}

// 8. Obtener la sesión completa desde el request
export async function getSessionFromRequest(req) {
  const token = getTokenFromRequest(req);
  return token ? verifySessionToken(token) : null;
}

// 9. Exigir rol admin. Devuelve null si no está autorizado.
export async function requireAdmin(req) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return null;
  }
  return session;
}

// 10. IP del cliente (Vercel envía x-forwarded-for)
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '0.0.0.0';
}
