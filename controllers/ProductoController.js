// controllers/ProductoController.js
// Capa Controlador: Gestión del catálogo protegida por JWT de Administrador

import { ProductoModel } from '../models/ProductoModel';
import { getTokenFromRequest, verifySessionToken } from '../config/security';

export class ProductoController {
  static async listar(req, res) {
    const productos = await ProductoModel.obtenerTodos();
    return res.status(200).json({ productos });
  }

  static async crear(req, res) {
    const token = getTokenFromRequest(req);
    const sesion = token ? await verifySessionToken(token) : null;

    if (!sesion || sesion.rol !== 'admin') {
      return res.status(401).json({ error: 'No autorizado. Inicia sesión como administrador.' });
    }

    const { nombre, categoria, precio, imagen_url } = req.body;
    if (!nombre || !precio || !imagen_url) {
      return res.status(400).json({ error: 'Nombre, precio e imagen son obligatorios.' });
    }

    try {
      const producto = await ProductoModel.crear({
        nombre,
        categoria,
        precio,
        imagen_url,
        usuarioId: sesion.id
      });
      return res.status(201).json({ mensaje: 'Producto creado en PostgreSQL.', producto });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async eliminar(req, res) {
    const token = getTokenFromRequest(req);
    const sesion = token ? await verifySessionToken(token) : null;

    if (!sesion || sesion.rol !== 'admin') {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const { id } = req.query;
    try {
      await ProductoModel.eliminar(id);
      return res.status(200).json({ mensaje: 'Producto eliminado correctamente.' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
