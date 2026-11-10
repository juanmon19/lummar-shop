// controllers/AuthController.js
// Capa Controlador: Lógica de Registro (con Google + Bcrypt Hash) y Login Seguro

import { UsuarioModel } from '../models/UsuarioModel';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setAuthCookie,
  clearAuthCookie
} from '../config/security';

export class AuthController {
  // POST /api/auth/register
  // Requiere que el usuario haya validado su identidad con Google OAuth y defina una clave que se hashea con Bcrypt
  static async registrar(req, res) {
    try {
      const { nombre, email, password, googleId, avatarUrl } = req.body;

      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      }

      if (!googleId) {
        return res.status(403).json({
          error: 'Debes vincular y verificar tu cuenta de Google antes de completar el registro.'
        });
      }

      // Validar fortaleza de la contraseña antes de aplicar el Hash
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          error: 'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.'
        });
      }

      // Verificar si la lista blanca de correos de admin está configurada
      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

      if (adminEmails.length > 0 && !adminEmails.includes(email.toLowerCase())) {
        return res.status(403).json({
          error: 'Este correo de Google no está autorizado en ADMIN_EMAILS para registrarse como administrador.'
        });
      }

      const existente = await UsuarioModel.buscarPorEmail(email);
      if (existente) {
        return res.status(409).json({ error: 'Este correo ya se encuentra registrado. Por favor inicia sesión.' });
      }

      // Generar Hash Bcrypt de 12 rondas de sal
      const passwordHash = await hashPassword(password);

      const nuevoUsuario = await UsuarioModel.registrarUsuario({
        nombre,
        email,
        passwordHash,
        googleId,
        avatarUrl,
        rol: 'admin'
      });

      const token = await createSessionToken({
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        googleVerificado: true
      });

      setAuthCookie(res, token);
      await UsuarioModel.registrarAuditoria(email, 'REGISTRO_EXITOSO', 'GOOGLE_OAUTH_Y_BCRYPT');

      return res.status(201).json({
        mensaje: 'Administrador registrado exitosamente con Google OAuth y Hash Bcrypt.',
        usuario: nuevoUsuario
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message || 'Error interno al registrar el usuario en la base de datos.'
      });
    }
  }

  // POST /api/auth/login
  static async login(req, res) {
    try {
      const { email, password, googleVerificado } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
      }

      const usuario = await UsuarioModel.buscarPorEmail(email);
      if (!usuario || !usuario.activo) {
        return res.status(401).json({ error: 'Credenciales inválidas o cuenta no registrada.' });
      }

      // Comparación segura en tiempo constante con Bcrypt
      const passwordValido = await verifyPassword(password, usuario.password_hash);
      if (!passwordValido) {
        await UsuarioModel.registrarAuditoria(email, 'LOGIN_FALLIDO_HASH', 'BCRYPT');
        return res.status(401).json({ error: 'Contraseña incorrecta.' });
      }

      const token = await createSessionToken({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        googleVerificado: Boolean(googleVerificado || usuario.google_id)
      });

      setAuthCookie(res, token);
      await UsuarioModel.registrarAuditoria(email, 'LOGIN_EXITOSO', 'BCRYPT_Y_GOOGLE');

      return res.status(200).json({
        mensaje: 'Autenticación verificada correctamente.',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message || 'Error al verificar credenciales en la base de datos.'
      });
    }
  }

  // POST /api/auth/logout
  static async logout(req, res) {
    clearAuthCookie(res);
    return res.status(200).json({ mensaje: 'Sesión cerrada correctamente.' });
  }
}
