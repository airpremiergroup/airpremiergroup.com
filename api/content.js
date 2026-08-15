import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'airpremier_default_secret_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    return decoded && decoded.role === 'admin';
  } catch (err) {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (req.method === 'GET') {
      return res.status(200).json({ data: {}, warning: 'DATABASE_URL no configurada en variables de entorno' });
    }
    return res.status(500).json({ success: false, error: 'DATABASE_URL no está configurada en Vercel.' });
  }

  const sql = neon(databaseUrl);

  // Asegurar que la tabla exista
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS site_content (
        key VARCHAR(100) PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (tableError) {
    console.warn('Nota sobre creación de tabla:', tableError.message);
  }

  // GET: Obtener todos los contenidos guardados
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT key, content FROM site_content`;
      const data = {};
      rows.forEach(row => {
        data[row.key] = row.content;
      });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al consultar Neon:', error);
      return res.status(500).json({ success: false, error: error.message, data: {} });
    }
  }

  // POST: Guardar modificaciones (Requiere Auth)
  if (req.method === 'POST') {
    const isAuthorized = verifyToken(req);
    if (!isAuthorized) {
      return res.status(401).json({ success: false, error: 'No autorizado. Inicie sesión como administrador.' });
    }

    try {
      const body = req.body || {};
      const itemsToUpdate = body.items || body;

      const keys = Object.keys(itemsToUpdate);
      if (keys.length === 0) {
        return res.status(400).json({ success: false, error: 'No se enviaron datos para actualizar' });
      }

      // Upsert cada elemento
      for (const key of keys) {
        const content = itemsToUpdate[key];
        if (typeof content === 'string') {
          await sql`
            INSERT INTO site_content (key, content, updated_at)
            VALUES (${key}, ${content}, NOW())
            ON CONFLICT (key)
            DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
          `;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Se actualizaron ${keys.length} elementos exitosamente en Neon.tech`,
        updatedCount: keys.length
      });
    } catch (error) {
      console.error('Error al guardar en Neon:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
