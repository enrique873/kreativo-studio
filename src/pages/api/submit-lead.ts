export const prerender = false;

import type { APIRoute } from 'astro';

const NOTION_DB_ID = '3d6aea20-d76e-4774-abb4-3e00f5a7d651';
const NOTION_VERSION = '2022-06-28';

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  let body: { nombre?: string; email?: string; whatsapp?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers });
  }

  const { nombre, email, whatsapp } = body;
  if (!nombre || !email || !whatsapp) {
    return new Response(JSON.stringify({ error: 'Faltan campos' }), { status: 400, headers });
  }

  const NOTION_TOKEN = import.meta.env.NOTION_TOKEN;
  if (!NOTION_TOKEN) {
    return new Response(JSON.stringify({ error: 'Falta NOTION_TOKEN' }), { status: 500, headers });
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Nombre:   { title: [{ text: { content: nombre } }] },
        Email:    { email },
        WhatsApp: { phone_number: whatsapp },
        Fuente:   { select: { name: 'Formulario Prompts' } },
        Estado:   { select: { name: 'Nuevo' } },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Notion error:', res.status, JSON.stringify(data));
    return new Response(JSON.stringify({ error: 'Error Notion', detail: data }), { status: 502, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
