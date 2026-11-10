// pages/api/setup.js
// Inicializa el esquema de PostgreSQL y crea el primer administrador.
// Requiere SETUP_SECRET en las variables de entorno para evitar ejecuciones no autorizadas.

import crypto from 'crypto';
import { isDbConfigured, withTransaction } from '../../config/database';
import { hashPassword } from '../../config/security';
import { SCHEMA_SQL } from '../../database/schema';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function secretosCoinciden(recibido, esperado) {
  if (!recibido || !esperado) return false;
  const a = Buffer.from(String(recibido));
  const b = Buffer.from(String(esperado));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const esperado = process.env.SETUP_SECRET;
  if (!esperado) {
    return res.status(503).json({
      error:
        'La configuración inicial está deshabilitada. Agrega SETUP_SECRET en las variables de entorno de Vercel.'
    });
  }

  const recibido = req.body?.secret || req.headers['x-setup-secret'];
  if (!secretosCoinciden(recibido, esperado)) {
    return res.status(401).json({ error: 'Clave de configuración incorrecta.' });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({
      error:
        'DATABASE_URL no está configurada. Crea una base PostgreSQL en Neon o Supabase y agrégala a Vercel.'
    });
  }

  const nombre = String(req.body?.nombre || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const crearAdmin = Boolean(nombre || email || password);

  if (crearAdmin) {
    if (nombre.length < 2) {
      return res.status(400).json({ error: 'Ingresa el nombre del administrador.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error:
          'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.'
      });
    }
  }

  try {
    const passwordHash = crearAdmin ? await hashPassword(password) : null;

    const resultado = await withTransaction(async (client) => {
      await client.query(SCHEMA_SQL);

      const { rows: conteoProductos } = await client.query(
        'SELECT COUNT(*)::int AS total FROM productos'
      );

      if (!crearAdmin) {
        return {
          adminCreated: false,
          adminEmail: null,
          productos: conteoProductos[0]?.total || 0
        };
      }

      const { rows: existentes } = await client.query(
        'SELECT id, email, rol FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [email]
      );

      if (existentes.length > 0) {
        return {
          adminCreated: false,
          adminExiste: true,
          adminEmail: existentes[0].email,
          productos: conteoProductos[0]?.total || 0
        };
      }

      const { rows: creados } = await client.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, ultimo_acceso)
         VALUES ($1, LOWER($2), $3, 'admin', CURRENT_TIMESTAMP)
         RETURNING id, nombre, email, rol`,
        [nombre, email, passwordHash]
      );

      return {
        adminCreated: true,
        adminExiste: false,
        adminEmail: creados[0].email,
        adminNombre: creados[0].nombre,
        productos: conteoProductos[0]?.total || 0
      };
    });

    return res.status(200).json({
      ok: true,
      mensaje: resultado.adminCreated
        ? 'Base de datos inicializada y administrador creado.'
        : resultado.adminExiste
          ? 'La base de datos ya estaba inicializada y el administrador existe.'
          : 'Base de datos inicializada correctamente.',
      ...resultado
    });
  } catch (error) {
    console.error('[api/setup]', error);
    return res.status(500).json({
      error: error.message || 'No se pudo inicializar la base de datos.'
    });
  }
}
