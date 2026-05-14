// api/proxy.js — déployer sur Vercel
// Variables d'environnement à configurer sur Vercel :
//   HIGGSFIELD_API_KEY  → votre clé API Higgsfield
//   ANTHROPIC_API_KEY   → votre clé API Anthropic

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...body } = req.body;

  try {
    // ── Upload image vers Higgsfield ──
    if (action === 'upload') {
      const { filename, content_type } = body;
      const r = await fetch('https://api.higgsfield.ai/v1/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.HIGGSFIELD_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content_type })
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // ── PUT image (relay vers S3 signé) ──
    if (action === 'put_image') {
      const { upload_url, image_b64, content_type } = body;
      const buf = Buffer.from(image_b64, 'base64');
      const r = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': content_type },
        body: buf
      });
      return res.status(r.status).json({ ok: r.ok });
    }

    // ── Confirmer upload ──
    if (action === 'confirm') {
      const { media_id, type } = body;
      const r = await fetch('https://api.higgsfield.ai/v1/media/confirm', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.HIGGSFIELD_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_id, type })
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // ── Générer image ──
    if (action === 'generate') {
      const r = await fetch('https://api.higgsfield.ai/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.HIGGSFIELD_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // ── Statut job ──
    if (action === 'job_status') {
      const { job_id } = body;
      const r = await fetch(`https://api.higgsfield.ai/v1/jobs/${job_id}`, {
        headers: { 'Authorization': `Bearer ${process.env.HIGGSFIELD_API_KEY}` }
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // ── Analyse Anthropic (description DA) ──
    if (action === 'analyze') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(400).json({ error: 'Action inconnue' });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
