// models/UsuarioModel.js
// Capa Modelo: usuarios, registro con Google OAuth y contraseñas hasheadas con Bcrypt.

import { query } from '../config/database';

export class UsuarioModel {
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

  static async contarUsuarios() {
    const { rows } = await query('SELECT COUNT(*)::int AS total FROM usuarios');
    return rows[0]?.total || 0;
  }

  static async registrarUsuario({ nombre, email, passwordHash, googleId, avatarUrl, rol = 'admin' }) {
    const sql = `
      INSERT INTO usuarios (nombre, email, password_hash, google_id, avatar_url, rol, ultimo_acceso)
      VALUES ($1, LOWER($2), $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, nombre, email, google_id, avatar_url, rol, creado_en
    `;
    const params = [
      nombre.trim(),
      email.trim(),
      passwordHash,
      googleId || null,
      avatarUrl || null,
      rol
    ];
    const { rows } = await query(sql, params);
    return rows[0];
  }

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

  static async registrarAuditoria(email, evento, metodoAuth, ip = '0.0.0.0') {
    try {
      await query(
        `INSERT INTO auditoria_seguridad (usuario_email, evento, metodo_auth, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [email, evento, metodoAuth, ip]
      );
    } catch (error) {
      // La auditoría nunca debe bloquear el flujo principal.
    }
  }
}
