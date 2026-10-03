// This file is intentionally empty.
// The /api/submit-lead endpoint is handled by Vercel's serverless function
// located at /api/submit-lead.js in the project root.
export const prerender = true;
export async function GET() {
  return new Response('Not found', { status: 404 });
}
