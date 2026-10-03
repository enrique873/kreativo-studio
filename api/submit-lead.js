// Vercel serverless function — guarda lead en Notion
// CommonJS explícito para compatibilidad con Vercel
const NOTION_DB_ID = '3d6aea20-d76e-4774-abb4-3e00f5a7d651';
const NOTION_VERSION = '2022-06-28';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Parse body (Vercel auto-parsea JSON pero parseamos manualmente por si acaso)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const { nombre, email, whatsapp } = body || {};
  if (!nombre || !email || !whatsapp) {
    return res.status(400).json({ error: 'Faltan campos', received: { nombre: !!nombre, email: !!email, whatsapp: !!whatsapp } });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  if (!NOTION_TOKEN) {
    console.error('[submit-lead] NOTION_TOKEN no configurado');
    return res.status(500).json({ error: 'Falta NOTION_TOKEN en variables de entorno.' });
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
          Nombre:   { title: [{ text: { content: nombre } }] },
          Email:    { email: email },
          WhatsApp: { phone_number: whatsapp },
          Fuente:   { select: { name: 'Formulario Prompts' } },
          Estado:   { select: { name: 'Nuevo' } },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[submit-lead] Notion error:', response.status, JSON.stringify(data));
      return res.status(502).json({ error: 'Error Notion', status: response.status, detail: data });
    }

    console.log('[submit-lead] OK — página creada:', data.id);
    return res.status(200).json({ ok: true, id: data.id });

  } catch (err) {
    console.error('[submit-lead] Error inesperado:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
