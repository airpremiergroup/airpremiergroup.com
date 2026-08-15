-- =========================================================
-- AIR PREMIER GROUP - Script de Base de Datos para Neon.tech
-- =========================================================

-- Tabla para almacenar los textos y contenidos dinámicos del sitio web
CREATE TABLE IF NOT EXISTS site_content (
    key VARCHAR(100) PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar búsquedas
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(key);
