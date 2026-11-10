// models/PedidoModel.js
// Capa Modelo: pedidos creados desde el carrito. El pago/cierre se realiza por WhatsApp.
// El stock se descuenta al crear el pedido y se devuelve si el pedido se cancela.

import { isDbConfigured, query, withTransaction } from '../config/database';

export const ESTADOS_PEDIDO = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];

export class PedidoError extends Error {
  constructor(message, status = 400, codigo = 'PEDIDO_INVALIDO') {
    super(message);
    this.name = 'PedidoError';
    this.status = status;
    this.codigo = codigo;
  }
}

function normalizarPedido(row) {
  let items = row.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (error) {
      items = [];
    }
  }

  return {
    ...row,
    items: Array.isArray(items) ? items : [],
    subtotal: Number(row.subtotal)
  };
}

function generarCodigo() {
  const tiempo = Date.now().toString(36).toUpperCase().slice(-6);
  const azar = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `LMM-${tiempo}${azar}`;
}

export class PedidoModel {
  static async crear({
    clienteNombre,
    clienteTelefono,
    clienteEmail = null,
    direccion = null,
    notas = null,
    items = []
  }) {
    if (!isDbConfigured()) {
      throw new PedidoError(
        'La base de datos no está configurada. El pedido no se puede registrar, pero puedes enviarlo por WhatsApp.',
        503,
        'DB_NO_CONFIGURADA'
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new PedidoError('El carrito está vacío.');
    }

    const cantidades = new Map();
    for (const item of items) {
      const id = Number(item.id);
      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(id) || id <= 0) continue;
      if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
      cantidades.set(id, Math.min(99, (cantidades.get(id) || 0) + Math.trunc(cantidad)));
    }

    if (cantidades.size === 0) {
      throw new PedidoError('No hay productos válidos en el pedido.');
    }

    return withTransaction(async (client) => {
      const ids = Array.from(cantidades.keys());
      const { rows: productos } = await client.query(
        `SELECT id, nombre, precio, stock, activo
         FROM productos
         WHERE id = ANY($1::int[])
         FOR UPDATE`,
        [ids]
      );

      const mapa = new Map(productos.map((producto) => [Number(producto.id), producto]));
      const lineas = [];
      let subtotal = 0;

      for (const [id, cantidad] of cantidades.entries()) {
        const producto = mapa.get(id);
        if (!producto || producto.activo === false) {
          throw new PedidoError('Uno de los productos ya no está disponible. Actualiza tu carrito.');
        }
        if (Number(producto.stock) < cantidad) {
          throw new PedidoError(
            `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}.`
          );
        }

        const precio = Number(producto.precio);
        const totalLinea = precio * cantidad;
        subtotal += totalLinea;
        lineas.push({
          id,
          nombre: producto.nombre,
          precio,
          cantidad,
          total: totalLinea
        });
      }

      const codigo = generarCodigo();
      const { rows } = await client.query(
        `INSERT INTO pedidos
           (codigo, cliente_nombre, cliente_telefono, cliente_email, direccion, notas, items, subtotal, estado, actualizado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'pendiente', CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          codigo,
          clienteNombre.trim(),
          clienteTelefono.trim(),
          clienteEmail ? clienteEmail.trim() : null,
          direccion ? direccion.trim() : null,
          notas ? notas.trim() : null,
          JSON.stringify(lineas),
          subtotal
        ]
      );

      for (const linea of lineas) {
        await client.query(
          `UPDATE productos
           SET stock = stock - $1, actualizado_en = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [linea.cantidad, linea.id]
        );
      }

      return normalizarPedido(rows[0]);
    });
  }

  static async listar({ estado = null, limite = 200 } = {}) {
    if (!isDbConfigured()) {
      throw new PedidoError(
        'La base de datos no está configurada.',
        503,
        'DB_NO_CONFIGURADA'
      );
    }

    const params = [];
    const condiciones = [];

    if (estado && ESTADOS_PEDIDO.includes(estado)) {
      params.push(estado);
      condiciones.push(`estado = $${params.length}`);
    }

    params.push(Math.min(500, Math.max(1, Number(limite) || 200)));
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT * FROM pedidos
       ${where}
       ORDER BY creado_en DESC, id DESC
       LIMIT $${params.length}`,
      params
    );

    return rows.map(normalizarPedido);
  }

  static async actualizarEstado(id, estado) {
    if (!ESTADOS_PEDIDO.includes(estado)) {
      throw new PedidoError('Estado de pedido no válido.');
    }

    if (!isDbConfigured()) {
      throw new PedidoError('La base de datos no está configurada.', 503, 'DB_NO_CONFIGURADA');
    }

    return withTransaction(async (client) => {
      const { rows } = await client.query('SELECT * FROM pedidos WHERE id = $1 FOR UPDATE', [
        Number(id)
      ]);
      const pedido = rows[0];

      if (!pedido) {
        throw new PedidoError('Pedido no encontrado.', 404, 'PEDIDO_NO_ENCONTRADO');
      }

      if (pedido.estado === estado) {
        return normalizarPedido(pedido);
      }

      const articulos = normalizarPedido(pedido).items;

      // Cancelar: devolver unidades al inventario.
      if (estado === 'cancelado' && pedido.estado !== 'cancelado') {
        for (const articulo of articulos) {
          await client.query(
            `UPDATE productos
             SET stock = stock + $1, actualizado_en = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [Number(articulo.cantidad), Number(articulo.id)]
          );
        }
      }

      // Reactivar un pedido cancelado: volver a descontar inventario.
      if (pedido.estado === 'cancelado' && estado !== 'cancelado') {
        const ids = articulos.map((articulo) => Number(articulo.id));
        const { rows: productos } = await client.query(
          `SELECT id, nombre, stock FROM productos WHERE id = ANY($1::int[]) FOR UPDATE`,
          [ids]
        );
        const mapa = new Map(productos.map((producto) => [Number(producto.id), producto]));

        for (const articulo of articulos) {
          const producto = mapa.get(Number(articulo.id));
          if (!producto) {
            throw new PedidoError(`El producto "${articulo.nombre}" ya no existe.`);
          }
          if (Number(producto.stock) < Number(articulo.cantidad)) {
            throw new PedidoError(`Stock insuficiente para reactivar "${producto.nombre}".`);
          }
        }

        for (const articulo of articulos) {
          await client.query(
            `UPDATE productos
             SET stock = stock - $1, actualizado_en = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [Number(articulo.cantidad), Number(articulo.id)]
          );
        }
      }

      const { rows: actualizado } = await client.query(
        `UPDATE pedidos
         SET estado = $1, actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [estado, Number(id)]
      );

      return normalizarPedido(actualizado[0]);
    });
  }

  static async contarPendientes() {
    if (!isDbConfigured()) return 0;
    try {
      const { rows } = await query(
        `SELECT COUNT(*)::int AS pendientes FROM pedidos WHERE estado = 'pendiente'`
      );
      return rows[0]?.pendientes || 0;
    } catch (error) {
      return 0;
    }
  }
}
