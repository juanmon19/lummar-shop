// models/ProductoModel.js
// Capa Modelo: operaciones CRUD de productos en PostgreSQL.
// Incluye un catálogo de demostración cuando todavía no hay DATABASE_URL.

import { isDbConfigured, query } from '../config/database';

export const PRODUCTOS_DEMO = [
  {
    id: 1,
    nombre: 'Bolso Tote Rose Gold Edition',
    descripcion: 'Bolso amplio en acabado rose gold, ideal para el día a día con un toque de lujo.',
    categoria: 'Bolsos',
    precio: 145000,
    imagen_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    destacado: true,
    activo: true
  },
  {
    id: 2,
    nombre: 'Collar Corona Lummar Baño de Oro',
    descripcion: 'Collar delicado con baño de oro, perfecto para elevar cualquier outfit.',
    categoria: 'Joyería',
    precio: 89000,
    imagen_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    destacado: true,
    activo: true
  },
  {
    id: 3,
    nombre: 'Perfume Velvet Blossom 100ml',
    descripcion: 'Fragancia floral y envolvente de larga duración. Presentación de 100 ml.',
    categoria: 'Fragancias',
    precio: 195000,
    imagen_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80',
    stock: 8,
    destacado: false,
    activo: true
  },
  {
    id: 4,
    nombre: 'Set de Brochas Champagne Pro',
    descripcion: 'Set profesional de brochas con acabado champagne. Incluye estuche.',
    categoria: 'Beauty',
    precio: 110000,
    imagen_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    destacado: false,
    activo: true
  },
  {
    id: 5,
    nombre: 'Cartera Crossbody Nude Matte',
    descripcion: 'Cartera compacta en tono nude mate con correa ajustable.',
    categoria: 'Bolsos',
    precio: 128000,
    imagen_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    stock: 10,
    destacado: false,
    activo: true
  },
  {
    id: 6,
    nombre: 'Reloj Minimalista Rose Pearl',
    descripcion: 'Reloj de diseño minimalista con detalles rose pearl. Resistente al agua.',
    categoria: 'Accesorios',
    precio: 210000,
    imagen_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    stock: 6,
    destacado: true,
    activo: true
  }
];

const COLUMNAS = `
  id,
  nombre,
  COALESCE(descripcion, '') AS descripcion,
  categoria,
  precio,
  imagen_url,
  stock,
  COALESCE(sku, '') AS sku,
  activo,
  destacado,
  creado_en,
  actualizado_en
`;

function normalizarProducto(row) {
  return {
    ...row,
    precio: Number(row.precio),
    stock: Number(row.stock || 0),
    activo: row.activo !== false,
    destacado: Boolean(row.destacado)
  };
}

function filtrarDemo({ incluirInactivos, categoria, busqueda }) {
  const termino = (busqueda || '').trim().toLowerCase();
  return PRODUCTOS_DEMO.filter((producto) => {
    if (!incluirInactivos && producto.activo === false) return false;
    if (categoria && producto.categoria.toLowerCase() !== categoria.toLowerCase()) return false;
    if (termino) {
      const texto = `${producto.nombre} ${producto.descripcion} ${producto.categoria}`.toLowerCase();
      if (!texto.includes(termino)) return false;
    }
    return true;
  });
}

export class ProductoModel {
  /**
   * Lista productos.
   * @returns {{productos: Array, dbConfigurado: boolean, origen: 'db'|'demo', error?: string}}
   */
  static async listar({
    incluirInactivos = false,
    categoria = null,
    busqueda = null,
    usarDemoSiFalla = true
  } = {}) {
    if (!isDbConfigured()) {
      return {
        productos: filtrarDemo({ incluirInactivos, categoria, busqueda }),
        dbConfigurado: false,
        origen: 'demo'
      };
    }

    const condiciones = [];
    const params = [];

    if (!incluirInactivos) {
      condiciones.push('activo = TRUE');
    }

    if (categoria) {
      params.push(categoria);
      condiciones.push(`LOWER(categoria) = LOWER($${params.length})`);
    }

    if (busqueda && busqueda.trim()) {
      params.push(`%${busqueda.trim()}%`);
      condiciones.push(
        `(nombre ILIKE $${params.length} OR COALESCE(descripcion, '') ILIKE $${params.length} OR categoria ILIKE $${params.length})`
      );
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const sql = `
      SELECT ${COLUMNAS}
      FROM productos
      ${where}
      ORDER BY destacado DESC, creado_en DESC, id DESC
    `;

    try {
      const { rows } = await query(sql, params);
      return {
        productos: rows.map(normalizarProducto),
        dbConfigurado: true,
        origen: 'db'
      };
    } catch (error) {
      console.error('[ProductoModel.listar]', error.message);
      if (!usarDemoSiFalla) {
        throw error;
      }
      return {
        productos: filtrarDemo({ incluirInactivos, categoria, busqueda }),
        dbConfigurado: false,
        origen: 'demo',
        error: error.message
      };
    }
  }

  // Compatibilidad con código anterior.
  static async obtenerTodos(opciones = {}) {
    const resultado = await this.listar(opciones);
    return resultado.productos;
  }

  static async obtenerPorId(id) {
    const { rows } = await query(`SELECT ${COLUMNAS} FROM productos WHERE id = $1`, [Number(id)]);
    return rows[0] ? normalizarProducto(rows[0]) : null;
  }

  static async crear({
    nombre,
    descripcion = '',
    categoria,
    precio,
    imagen_url,
    stock = 0,
    sku = null,
    destacado = false,
    activo = true,
    usuarioId = null
  }) {
    const sql = `
      INSERT INTO productos (nombre, descripcion, categoria, precio, imagen_url, stock, sku, destacado, activo, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${COLUMNAS}
    `;
    const { rows } = await query(sql, [
      nombre.trim(),
      descripcion.trim(),
      (categoria || 'Colección Exclusiva').trim(),
      Number(precio),
      imagen_url.trim(),
      Number(stock),
      sku ? sku.trim() : null,
      Boolean(destacado),
      Boolean(activo),
      usuarioId
    ]);
    return normalizarProducto(rows[0]);
  }

  static async actualizar(id, {
    nombre,
    descripcion = '',
    categoria,
    precio,
    imagen_url,
    stock = 0,
    sku = null,
    destacado = false,
    activo = true
  }) {
    const sql = `
      UPDATE productos
      SET nombre = $1,
          descripcion = $2,
          categoria = $3,
          precio = $4,
          imagen_url = $5,
          stock = $6,
          sku = $7,
          destacado = $8,
          activo = $9,
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING ${COLUMNAS}
    `;
    const { rows } = await query(sql, [
      nombre.trim(),
      descripcion.trim(),
      (categoria || 'Colección Exclusiva').trim(),
      Number(precio),
      imagen_url.trim(),
      Number(stock),
      sku ? sku.trim() : null,
      Boolean(destacado),
      Boolean(activo),
      Number(id)
    ]);
    return rows[0] ? normalizarProducto(rows[0]) : null;
  }

  static async eliminar(id) {
    const { rows } = await query('DELETE FROM productos WHERE id = $1 RETURNING id', [Number(id)]);
    return rows.length > 0;
  }

  static async contar() {
    const { rows } = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE activo = TRUE)::int AS activos,
         COUNT(*) FILTER (WHERE stock <= 3)::int AS bajo_stock
       FROM productos`
    );
    return rows[0] || { total: 0, activos: 0, bajo_stock: 0 };
  }
}
