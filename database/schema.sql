-- ============================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL - LUMMAR SHOP
-- Se puede ejecutar completo en el editor SQL de Neon, Supabase o Vercel.
-- Es idempotente: se puede correr varias veces sin duplicar datos.
-- ============================================================================

-- 1. Usuarios (administradores y clientes)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(120) UNIQUE,
    avatar_url TEXT,
    rol VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (rol IN ('cliente', 'admin')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(120);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'admin';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Productos del catálogo
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(80) NOT NULL DEFAULT 'Colección Exclusiva',
    precio NUMERIC(12, 2) NOT NULL CHECK (precio > 0),
    imagen_url TEXT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    sku VARCHAR(60),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    destacado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS sku VARCHAR(60);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;

UPDATE productos SET stock = 0 WHERE stock IS NULL;
UPDATE productos SET activo = TRUE WHERE activo IS NULL;
UPDATE productos SET destacado = FALSE WHERE destacado IS NULL;
UPDATE productos SET categoria = 'Colección Exclusiva' WHERE categoria IS NULL OR TRIM(categoria) = '';

ALTER TABLE productos ALTER COLUMN stock SET DEFAULT 0;
ALTER TABLE productos ALTER COLUMN stock SET NOT NULL;
ALTER TABLE productos ALTER COLUMN activo SET DEFAULT TRUE;
ALTER TABLE productos ALTER COLUMN activo SET NOT NULL;
ALTER TABLE productos ALTER COLUMN destacado SET DEFAULT FALSE;
ALTER TABLE productos ALTER COLUMN destacado SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_creado_en ON productos (creado_en DESC);

-- 3. Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(40) NOT NULL,
    cliente_email VARCHAR(150),
    direccion TEXT,
    notas TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(150);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado_en ON pedidos (creado_en DESC);

-- 4. Auditoría de seguridad
CREATE TABLE IF NOT EXISTS auditoria_seguridad (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(150) NOT NULL,
    evento VARCHAR(100) NOT NULL,
    metodo_auth VARCHAR(50) NOT NULL,
    ip_address VARCHAR(60),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_seguridad (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_email ON auditoria_seguridad (usuario_email);

-- 5. Catálogo inicial: solo se inserta si la tabla está vacía
INSERT INTO productos (nombre, descripcion, categoria, precio, imagen_url, stock, destacado)
SELECT v.nombre, v.descripcion, v.categoria, v.precio, v.imagen_url, v.stock, v.destacado
FROM (VALUES
    ('Bolso Tote Rose Gold Edition', 'Bolso amplio en acabado rose gold, ideal para el día a día con un toque de lujo.', 'Bolsos', 145000.00, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', 12, TRUE),
    ('Collar Corona Lummar Baño de Oro', 'Collar delicado con baño de oro, perfecto para elevar cualquier outfit.', 'Joyería', 89000.00, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', 20, TRUE),
    ('Perfume Velvet Blossom 100ml', 'Fragancia floral y envolvente de larga duración. Presentación de 100 ml.', 'Fragancias', 195000.00, 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80', 8, FALSE),
    ('Set de Brochas Champagne Pro', 'Set profesional de brochas con acabado champagne. Incluye estuche.', 'Beauty', 110000.00, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', 15, FALSE),
    ('Cartera Crossbody Nude Matte', 'Cartera compacta en tono nude mate con correa ajustable.', 'Bolsos', 128000.00, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80', 10, FALSE),
    ('Reloj Minimalista Rose Pearl', 'Reloj de diseño minimalista con detalles rose pearl. Resistente al agua.', 'Accesorios', 210000.00, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80', 6, TRUE)
) AS v(nombre, descripcion, categoria, precio, imagen_url, stock, destacado)
WHERE NOT EXISTS (SELECT 1 FROM productos);
