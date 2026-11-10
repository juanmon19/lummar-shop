// models/UsuarioModel.js
// Capa Modelo: Gestión de Usuarios, Registro con Google OAuth y Contraseñas Hasheadas

import { query } from '../config/database';

export class UsuarioModel {
  // Buscar usuario por correo electrónico
  static async buscarPorEmail(email) {
    const sql = `
      SELECT id, nombre, email, password_hash, google_id, avatar_url, rol, activo
      FROM usuarios
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;
    const { rows } = await query(sql, [email.trim()]);
    return rows[0] || null;
  }

  // Crear un nuevo usuario con cuenta de Google vinculada y contraseña con Hash Bcrypt
  static async registrarUsuario({ nombre, email, passwordHash, googleId, avatarUrl, rol = 'admin' }) {
    const sql = `
      INSERT INTO usuarios (nombre, email, password_hash, google_id, avatar_url, rol, ultimo_acceso)
      VALUES ($1, LOWER($2), $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, nombre, email, google_id, avatar_url, rol, creado_en
    `;
    const params = [nombre.trim(), email.trim(), passwordHash, googleId || null, avatarUrl || null, rol];
    const { rows } = await query(sql, params);
    return rows[0];
  }

  // Actualizar Google ID y último acceso cuando el usuario inicia con Google OAuth
  static async actualizarAccesoGoogle(email, googleId, avatarUrl) {
    const sql = `
      UPDATE usuarios
      SET google_id = COALESCE(google_id, $2),
          avatar_url = COALESCE($3, avatar_url),
          ultimo_acceso = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER($1)
      RETURNING id, nombre, email, google_id, avatar_url, rol
    `;
    const { rows } = await query(sql, [email, googleId, avatarUrl]);
    return rows[0];
  }

  // Registrar evento en la tabla de auditoría
  static async registrarAuditoria(email, evento, metodoAuth, ip = '0.0.0.0') {
    try {
      await query(
        `INSERT INTO auditoria_seguridad (usuario_email, evento, metodo_auth, ip_address) VALUES ($1, $2, $3, $4)`,
        [email, evento, metodoAuth, ip]
      );
    } catch (e) {
      // No bloquear flujo si la tabla de auditoría aún no ha sido creada
    }
  }
}
