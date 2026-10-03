// Vercel serverless function — guarda lead en Notion
// Base de datos: Leads — 30 Prompts de IA
const NOTION_DB_ID = '3d6aea20-d76e-4774-abb4-3e00f5a7d651';
const NOTION_VERSION = '2022-06-28';

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — permite llamadas desde kreativostudio.com
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { nombre, email, whatsapp } = req.body || {};

  if (!nombre || !email || !whatsapp) {
    return res.status(400).json({ error: 'Faltan campos requeridos.' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  if (!NOTION_TOKEN) {
    console.error('NOTION_TOKEN no configurado');
    return res.status(500).json({ error: 'Configuración incompleta.' });
  }

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          Nombre: {
            title: [{ text: { content: nombre } }],
          },
          Email: {
            email: email,
          },
          WhatsApp: {
            phone_number: whatsapp,
          },
          Fuente: {
            select: { name: 'Formulario Prompts' },
          },
          Estado: {
            select: { name: 'Nuevo' },
          },
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Notion error:', errBody);
      return res.status(502).json({ error: 'Error al guardar en Notion.' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
