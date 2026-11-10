// controllers/AuthController.js
// Capa Controlador: registro y login de administradores.

import { UsuarioModel } from '../models/UsuarioModel';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setAuthCookie,
  clearAuthCookie,
  getClientIp
} from '../config/security';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthController {
  // POST /api/auth/register
  static async registrar(req, res) {
    try {
      const { nombre, email, password, googleId, avatarUrl } = req.body || {};

      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
      }

      if (!EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
      }

      const googleConfigurado = Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      );

      if (!googleId && (!googleConfigurado && process.env.ALLOW_PASSWORD_SIGNUP !== 'true')) {
        return res.status(403).json({
          error:
            'Debes verificar tu cuenta con Google. Si Google OAuth no está configurado, crea el administrador desde /setup.'
        });
      }

      if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({
          error:
            'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.'
        });
      }

      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((correo) => correo.trim().toLowerCase())
        .filter(Boolean);

      const totalUsuarios = await UsuarioModel.contarUsuarios();
      const correoNormalizado = String(email).trim().toLowerCase();

      if (adminEmails.length > 0 && !adminEmails.includes(correoNormalizado)) {
        return res.status(403).json({
          error:
            'Este correo no está autorizado en ADMIN_EMAILS para registrarse como administrador.'
        });
      }

      if (adminEmails.length === 0 && totalUsuarios > 0) {
        return res.status(403).json({
          error:
            'El registro de administradores está cerrado. Usa la cuenta existente o configura ADMIN_EMAILS.'
        });
      }

      const existente = await UsuarioModel.buscarPorEmail(correoNormalizado);
      if (existente) {
        return res.status(409).json({
          error: 'Este correo ya está registrado. Por favor inicia sesión.'
        });
      }

      const passwordHash = await hashPassword(password);

      const nuevoUsuario = await UsuarioModel.registrarUsuario({
        nombre: String(nombre).trim(),
        email: correoNormalizado,
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
        googleVerificado: Boolean(googleId)
      });

      setAuthCookie(res, token);
      await UsuarioModel.registrarAuditoria(
        correoNormalizado,
        'REGISTRO_EXITOSO',
        googleId ? 'GOOGLE_OAUTH_Y_BCRYPT' : 'BCRYPT',
        getClientIp(req)
      );

      return res.status(201).json({
        mensaje: 'Administrador registrado correctamente.',
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol
        }
      });
    } catch (error) {
      console.error('[AuthController.registrar]', error);
      return res.status(500).json({
        error: error.message || 'Error interno al registrar el usuario.'
      });
    }
  }

  // POST /api/auth/login
  static async login(req, res) {
    try {
      const { email, password, googleVerificado } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
      }

      const correo = String(email).trim().toLowerCase();
      const usuario = await UsuarioModel.buscarPorEmail(correo);

      if (!usuario || !usuario.activo) {
        await UsuarioModel.registrarAuditoria(
          correo,
          'LOGIN_FALLIDO_USUARIO',
          'BCRYPT',
          getClientIp(req)
        );
        return res.status(401).json({ error: 'Credenciales inválidas o cuenta no registrada.' });
      }

      const passwordValido = await verifyPassword(password, usuario.password_hash);
      if (!passwordValido) {
        await UsuarioModel.registrarAuditoria(
          correo,
          'LOGIN_FALLIDO_HASH',
          'BCRYPT',
          getClientIp(req)
        );
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
      await UsuarioModel.registrarAuditoria(
        correo,
        'LOGIN_EXITOSO',
        'BCRYPT',
        getClientIp(req)
      );

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
      console.error('[AuthController.login]', error);
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
