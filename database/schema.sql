-- ============================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL (VERCEL POSTGRES / NEON / SUPABASE)
-- Proyecto: Lummar Shop MVC
-- ============================================================================

-- 1. Tabla de Usuarios con soporte para Google OAuth 2.0 + Contraseña Hasheada (Bcrypt)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,         -- Hash Bcrypt (12 rondas de sal)
    google_id VARCHAR(120) UNIQUE,               -- ID único de cuenta de Google OAuth
    avatar_url TEXT,
    rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('cliente', 'admin')),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Productos del Catálogo
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) DEFAULT 'Colección Exclusiva',
    precio NUMERIC(12, 2) NOT NULL CHECK (precio > 0),
    imagen_url TEXT NOT NULL,
    stock INT DEFAULT 15,
    creado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Auditoría de Accesos de Seguridad
CREATE TABLE IF NOT EXISTS auditoria_seguridad (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(150) NOT NULL,
    evento VARCHAR(100) NOT NULL,
    metodo_auth VARCHAR(50) NOT NULL,
    ip_address VARCHAR(60),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Datos Semilla (Catálogo Inicial de Lummar Shop)
INSERT INTO productos (nombre, categoria, precio, imagen_url, stock) VALUES
('Bolso Tote Rose Gold Edition', 'Bolsos', 145000.00, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', 12),
('Collar Corona Lummar Baño de Oro', 'Joyería', 89000.00, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', 20),
('Perfume Velvet Blossom 100ml', 'Fragancias', 195000.00, 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80', 8),
('Set de Brochas Champagne Pro', 'Beauty', 110000.00, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', 15),
('Cartera Crossbody Nude Matte', 'Bolsos', 128000.00, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80', 10),
('Reloj Minimalista Rose Pearl', 'Accesorios', 210000.00, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80', 6);
