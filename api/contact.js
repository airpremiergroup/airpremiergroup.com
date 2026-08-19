import { Resend } from 'resend';

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Por favor complete todos los campos del formulario.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY no configurada');
      return res.status(500).json({ success: false, error: 'RESEND_API_KEY no está configurada en las variables de entorno de Vercel.' });
    }

    const resend = new Resend(apiKey);
    
    // Destinatarios: Se pueden configurar varios separados por coma en Vercel
    const toEmailRaw = process.env.CONTACT_RECEIVER_EMAIL || 'contacto@airpremiergroup.com, airpremiergroup@gmail.com';
    const toEmails = toEmailRaw.split(',').map(e => e.trim()).filter(Boolean);

    // Remitente corporativo verificado en Resend
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'AIR PREMIER GROUP <notificaciones@airpremiergroup.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #070e17; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #0a192f; border-radius: 8px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header { background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 2px solid #38bdf8; }
          .header h2 { margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 1px; }
          .header p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; }
          .content { padding: 28px; }
          .field-group { margin-bottom: 20px; }
          .field-label { font-size: 11px; text-transform: uppercase; color: #38bdf8; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
          .field-value { background-color: #172a45; padding: 12px 14px; border-radius: 4px; font-size: 14px; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.05); }
          .message-box { background-color: #172a45; padding: 16px; border-radius: 4px; font-size: 14px; color: #f1f5f9; border-left: 3px solid #38bdf8; white-space: pre-wrap; line-height: 1.6; }
          .footer { background-color: #070e17; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>AIR PREMIER GROUP C.A.</h2>
            <p>Nuevo Requerimiento Confidencial desde el Portal Web</p>
          </div>
          <div class="content">
            <div class="field-group">
              <div class="field-label">Nombre Completo y Cargo:</div>
              <div class="field-value">${escapeHtml(name)}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Correo Electrónico de Contacto:</div>
              <div class="field-value"><a href="mailto:${escapeHtml(email)}" style="color: #38bdf8; text-decoration: none;">${escapeHtml(email)}</a></div>
            </div>
            <div class="field-group">
              <div class="field-label">Mensaje / Requerimiento Técnico:</div>
              <div class="message-box">${escapeHtml(message)}</div>
            </div>
          </div>
          <div class="footer">
            Mensaje recibido a través del formulario de contacto oficial en <b>airpremiergroup.com</b>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      reply_to: email,
      subject: `📩 Solicitud de Negocios: ${name}`,
      html: htmlContent,
    });

    if (data.error) {
      console.error('Error al enviar correo con Resend:', data.error);
      return res.status(400).json({ success: false, error: data.error.message });
    }

    return res.status(200).json({
      success: true,
      message: '¡Gracias por contactar a AIR PREMIER GROUP! Su solicitud ha sido enviada exitosamente. Nuestro equipo se comunicará a la brevedad.',
      id: data.data?.id
    });
  } catch (error) {
    console.error('Error inesperado en api/contact:', error);
    return res.status(500).json({ success: false, error: 'Ocurrió un error al procesar el envío. Por favor intente más tarde.' });
  }
}
