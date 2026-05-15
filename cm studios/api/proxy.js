module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var body = req.body;
  var action = body.action;

  try {

    if (action === 'upload') {
      var r = await fetch('https://api.higgsfield.ai/v1/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.HIGGSFIELD_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: body.filename,
          content_type: body.content_type
        })
      });
      var data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === 'put_image') {
      var buf = Buffer.from(body.image_b64, 'base64');
      var r2 = await fetch(body.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': body.content_type },
        body: buf
      });
      return res.status(r2.status).json({ ok: r2.ok });
    }

    if (action === 'confirm') {
      var r3 = await fetch('https://api.higgsfield.ai/v1/media/confirm', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.HIGGSFIELD_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          media_id: body.media_id,
          type: body.type
        })
      });
      var data3 = await r3.json();
      return res.status(r3.status).json(data3);
    }

    if (action === 'generate') {
      var payload = Object.assign({}, body);
      delete payload.action;
      var r4 = await fetch('https://api.higgsfield.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.HIGGSFIELD_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      var data4 = await r4.json();
      return res.status(r4.status).json(data4);
    }

    if (action === 'job_status') {
      var r5 = await fetch('https://api.higgsfield.ai/v1/jobs/' + body.job_id, {
        headers: {
          'Authorization': 'Bearer ' + process.env.HIGGSFIELD_API_KEY
        }
      });
      var data5 = await r5.json();
      return res.status(r5.status).json(data5);
    }

    if (action === 'analyze') {
      var analyzePayload = Object.assign({}, body);
      delete analyzePayload.action;
      var r6 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(analyzePayload)
      });
      var data6 = await r6.json();
      return res.status(r6.status).json(data6);
    }

    if (action === 'ping') {
      return res.status(200).json({ ok: true, message: 'Proxy CM Studio opérationnel' });
    }

    return res.status(400).json({ error: 'Action inconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
