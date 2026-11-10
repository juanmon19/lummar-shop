// controllers/ProductoController.js
// Capa Controlador: catálogo público y CRUD protegido por JWT de administrador.

import { ProductoModel } from '../models/ProductoModel';
import { requireAdmin } from '../config/security';

const MAX_IMAGEN = 3_800_000; // ~3.8 MB de string (data URL comprimida)

function texto(valor, max = 2000) {
  return String(valor || '').trim().slice(0, max);
}

function booleano(valor, defecto = false) {
  if (valor === undefined || valor === null || valor === '') return defecto;
  return valor === true || valor === 'true' || valor === 1 || valor === '1';
}

function imagenValida(valor) {
  if (typeof valor !== 'string') return false;
  const limpio = valor.trim();
  if (!limpio) return false;
  if (limpio.startsWith('data:image/')) return limpio.length <= MAX_IMAGEN;
  if (limpio.startsWith('/')) return limpio.length <= 500;
  try {
    const url = new URL(limpio);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function validarProducto(body = {}) {
  const nombre = texto(body.nombre, 150);
  const descripcion = texto(body.descripcion, 2000);
  const categoria = texto(body.categoria, 80) || 'Colección Exclusiva';
  const sku = texto(body.sku, 60) || null;
  const precio = Number(body.precio);
  const stock = Number(body.stock ?? 0);
  const imagen_url = typeof body.imagen_url === 'string' ? body.imagen_url.trim() : '';

  if (nombre.length < 2) {
    return { error: 'El nombre del producto debe tener al menos 2 caracteres.' };
  }
  if (!Number.isFinite(precio) || precio <= 0 || precio > 9999999999) {
    return { error: 'Ingresa un precio válido mayor que cero.' };
  }
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock) || stock > 100000) {
    return { error: 'El stock debe ser un número entero igual o mayor que cero.' };
  }
  if (!imagenValida(imagen_url)) {
    return {
      error:
        'La imagen no es válida. Sube una foto del dispositivo o usa una URL http(s) que termine en .jpg, .png, .webp, etc.'
    };
  }

  return {
    data: {
      nombre,
      descripcion,
      categoria,
      sku,
      precio,
      stock,
      imagen_url,
      destacado: booleano(body.destacado, false),
      activo: booleano(body.activo, true)
    }
  };
}

function responderError(res, error, mensaje) {
  console.error('[ProductoController]', error);
  if (error?.codigo === 'DB_NO_CONFIGURADA') {
    return res.status(503).json({
      error:
        'La base de datos no está configurada. Agrega DATABASE_URL en Vercel y ejecuta /setup.'
    });
  }
  if (error?.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos (SKU duplicado).' });
  }
  return res.status(error?.status || 500).json({ error: mensaje || error.message });
}

export class ProductoController {
  static async listar(req, res) {
    try {
      const incluirInactivos = Boolean(req.query.all);

      if (incluirInactivos) {
        const sesion = await requireAdmin(req);
        if (!sesion) {
          return res.status(401).json({ error: 'No autorizado para ver productos inactivos.' });
        }
      }

      const resultado = await ProductoModel.listar({
        incluirInactivos,
        categoria: req.query.categoria || null,
        busqueda: req.query.q || null
      });

      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(resultado);
    } catch (error) {
      return responderError(res, error, 'No se pudo cargar el catálogo.');
    }
  }

  static async obtener(req, res) {
    try {
      const producto = await ProductoModel.obtenerPorId(req.query.id);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      if (!producto.activo) {
        const sesion = await requireAdmin(req);
        if (!sesion) {
          return res.status(404).json({ error: 'Producto no encontrado.' });
        }
      }
      return res.status(200).json({ producto });
    } catch (error) {
      return responderError(res, error, 'No se pudo cargar el producto.');
    }
  }

  static async crear(req, res) {
    const sesion = await requireAdmin(req);
    if (!sesion) {
      return res.status(401).json({ error: 'No autorizado. Inicia sesión como administrador.' });
    }

    const { data, error } = validarProducto(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const producto = await ProductoModel.crear({ ...data, usuarioId: sesion.id });
      return res.status(201).json({ mensaje: 'Producto guardado en la base de datos.', producto });
    } catch (err) {
      return responderError(res, err, 'No se pudo crear el producto.');
    }
  }

  static async actualizar(req, res) {
    const sesion = await requireAdmin(req);
    if (!sesion) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const id = Number(req.query.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Identificador de producto no válido.' });
    }

    const { data, error } = validarProducto(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const producto = await ProductoModel.actualizar(id, data);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      return res.status(200).json({ mensaje: 'Producto actualizado.', producto });
    } catch (err) {
      return responderError(res, err, 'No se pudo actualizar el producto.');
    }
  }

  static async eliminar(req, res) {
    const sesion = await requireAdmin(req);
    if (!sesion) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const id = Number(req.query.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Identificador de producto no válido.' });
    }

    try {
      const eliminado = await ProductoModel.eliminar(id);
      if (!eliminado) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      return res.status(200).json({ mensaje: 'Producto eliminado correctamente.' });
    } catch (err) {
      return responderError(res, err, 'No se pudo eliminar el producto.');
    }
  }
}
