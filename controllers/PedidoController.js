// controllers/PedidoController.js
// Capa Controlador: creación pública de pedidos y gestión protegida para el administrador.

import { ESTADOS_PEDIDO, PedidoError, PedidoModel } from '../models/PedidoModel';
import { requireAdmin } from '../config/security';

function texto(valor, max = 1000) {
  return String(valor || '').trim().slice(0, max);
}

function telefonoValido(valor) {
  const limpio = String(valor || '').replace(/[^\d+]/g, '');
  const digitos = limpio.replace(/\D/g, '');
  return digitos.length >= 7 && digitos.length <= 15;
}

function emailValido(valor) {
  if (!valor) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

export class PedidoController {
  static async crear(req, res) {
    const cliente = req.body?.cliente || {};
    const nombre = texto(cliente.nombre, 150);
    const telefono = texto(cliente.telefono, 40);
    const email = texto(cliente.email, 150);
    const direccion = texto(cliente.direccion, 500);
    const notas = texto(cliente.notas, 1000);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (nombre.length < 2) {
      return res.status(400).json({ error: 'Ingresa tu nombre completo.' });
    }
    if (!telefonoValido(telefono)) {
      return res.status(400).json({ error: 'Ingresa un número de teléfono válido (mínimo 7 dígitos).' });
    }
    if (!emailValido(email)) {
      return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }
    if (items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío.' });
    }
    if (items.length > 60) {
      return res.status(400).json({ error: 'El pedido contiene demasiados productos.' });
    }

    try {
      const pedido = await PedidoModel.crear({
        clienteNombre: nombre,
        clienteTelefono: telefono,
        clienteEmail: email || null,
        direccion: direccion || null,
        notas: notas || null,
        items: items.map((item) => ({ id: item.id, cantidad: item.cantidad }))
      });

      return res.status(201).json({
        mensaje: 'Pedido registrado correctamente.',
        pedido
      });
    } catch (error) {
      console.error('[PedidoController.crear]', error);
      if (error instanceof PedidoError || error?.codigo === 'DB_NO_CONFIGURADA') {
        return res.status(error.status || 400).json({
          error: error.message,
          codigo: error.codigo
        });
      }
      return res.status(500).json({ error: 'No se pudo registrar el pedido.' });
    }
  }

  static async listar(req, res) {
    const sesion = await requireAdmin(req);
    if (!sesion) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const estado = req.query.estado;
    if (estado && !ESTADOS_PEDIDO.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }

    try {
      const pedidos = await PedidoModel.listar({
        estado: estado || null,
        limite: req.query.limite
      });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ pedidos });
    } catch (error) {
      console.error('[PedidoController.listar]', error);
      if (error?.codigo === 'DB_NO_CONFIGURADA') {
        return res.status(503).json({ error: error.message, codigo: error.codigo });
      }
      return res.status(500).json({ error: 'No se pudieron cargar los pedidos.' });
    }
  }

  static async actualizarEstado(req, res) {
    const sesion = await requireAdmin(req);
    if (!sesion) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const id = Number(req.query.id);
    const estado = texto(req.body?.estado, 20);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Identificador de pedido no válido.' });
    }

    try {
      const pedido = await PedidoModel.actualizarEstado(id, estado);
      return res.status(200).json({ mensaje: 'Estado del pedido actualizado.', pedido });
    } catch (error) {
      console.error('[PedidoController.actualizarEstado]', error);
      if (error instanceof PedidoError) {
        return res.status(error.status || 400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'No se pudo actualizar el pedido.' });
    }
  }
}
