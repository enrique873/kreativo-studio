export const prerender = false;

import type { APIRoute } from 'astro';

const NOTION_DB_ID = '3d6aea20-d76e-4774-abb4-3e00f5a7d651';
const NOTION_VERSION = '2022-06-28';

export const POST: APIRoute = async ({ request }) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  let body: { nombre?: string; email?: string; whatsapp?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido.' }), { status: 400, headers });
  }

  const { nombre, email, whatsapp } = body;

  if (!nombre || !email || !whatsapp) {
    return new Response(JSON.stringify({ error: 'Faltan campos requeridos.' }), { status: 400, headers });
  }

  const NOTION_TOKEN = import.meta.env.NOTION_TOKEN;
  if (!NOTION_TOKEN) {
    console.error('NOTION_TOKEN no configurado');
    return new Response(JSON.stringify({ error: 'Configuración incompleta.' }), { status: 500, headers });
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Notion API error:', response.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'Error al guardar en Notion.', detail: data }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });

  } catch (err: any) {
    console.error('Error inesperado:', err.message);
    return new Response(JSON.stringify({ error: 'Error interno.', detail: err.message }), { status: 500, headers });
  }
};

// Handle preflight OPTIONS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
