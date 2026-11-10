// models/ProductoModel.js
// Capa Modelo: Operaciones CRUD de Productos en PostgreSQL con respaldo inicial

import { query } from '../config/database';

export const PRODUCTOS_DEMO = [
  {
    id: 1,
    nombre: 'Bolso Tote Rose Gold Edition',
    categoria: 'Bolsos',
    precio: 145000,
    imagen_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    nombre: 'Collar Corona Lummar Baño de Oro',
    categoria: 'Joyería',
    precio: 89000,
    imagen_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    nombre: 'Perfume Velvet Blossom 100ml',
    categoria: 'Fragancias',
    precio: 195000,
    imagen_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    nombre: 'Set de Brochas Champagne Pro',
    categoria: 'Beauty',
    precio: 110000,
    imagen_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 5,
    nombre: 'Cartera Crossbody Nude Matte',
    categoria: 'Bolsos',
    precio: 128000,
    imagen_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 6,
    nombre: 'Reloj Minimalista Rose Pearl',
    categoria: 'Accesorios',
    precio: 210000,
    imagen_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'
  }
];

export class ProductoModel {
  static async obtenerTodos() {
    try {
      const { rows } = await query(
        'SELECT id, nombre, categoria, precio, imagen_url, stock FROM productos ORDER BY id DESC'
      );
      return rows.map(r => ({ ...r, precio: Number(r.precio) }));
    } catch (error) {
      return PRODUCTOS_DEMO;
    }
  }

  static async crear({ nombre, categoria, precio, imagen_url, usuarioId = null }) {
    const sql = `
      INSERT INTO productos (nombre, categoria, precio, imagen_url, creado_por)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, categoria, precio, imagen_url
    `;
    const { rows } = await query(sql, [
      nombre.trim(),
      (categoria || 'Exclusivo').trim(),
      Number(precio),
      imagen_url.trim(),
      usuarioId
    ]);
    return rows[0];
  }

  static async eliminar(id) {
    await query('DELETE FROM productos WHERE id = $1', [Number(id)]);
    return true;
  }
}
