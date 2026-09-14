const SKIP = new Set(['company']);

export function formatLead(data, site = 'KV-web') {
  const lines = Object.entries(data)
    .filter(([key, value]) => !SKIP.has(key) && String(value ?? '').trim() !== '')
    .map(([key, value]) => `${key}: ${String(value).trim().slice(0, 2000)}`);
  return `🔔 ${site}\n\n${lines.join('\n')}`.slice(0, 3900);
}

function json(status, body, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra }
  });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}

function phoneOk(data) {
  return String(data?.['Телефон'] || '').replace(/\D/g, '').length >= 9;
}

async function sendTelegram(env, text, fetchImpl) {
  const res = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text })
  });
  return res.ok;
}

async function sendMail(env, data, text, fetchImpl) {
  const res = await fetchImpl('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_ACCESS_KEY,
      subject: `KV-web: ${data['Форма'] || 'Заявка'}`,
      from_name: data['Имя'] || 'Сайт KV-web',
      message: text
    })
  });
  if (!res.ok) return false;
  const body = await res.json().catch(() => ({}));
  return body.success !== false && body.success !== 'false';
}

export async function handleLead(request, env, fetchImpl = fetch) {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method' }, headers);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: 'json' }, headers);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json(400, { ok: false, error: 'json' }, headers);
  }
  if (String(data.company || '').trim()) {
    return json(200, { ok: true }, headers);
  }
  if (!phoneOk(data)) {
    return json(400, { ok: false, error: 'phone' }, headers);
  }

  const text = formatLead(data, env.SITE || 'KV-web');
  const jobs = [];
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(sendTelegram(env, text, fetchImpl).then(ok => ({ telegram: ok })));
  }
  if (env.WEB3FORMS_ACCESS_KEY) {
    jobs.push(sendMail(env, data, text, fetchImpl).then(ok => ({ email: ok })));
  }
  if (!jobs.length) {
    return json(502, { ok: false, error: 'no channels' }, headers);
  }

  const results = Object.assign({ telegram: false, email: false }, ...await Promise.all(jobs));
  const ok = Boolean(results.telegram || results.email);
  return json(ok ? 200 : 502, {
    ok,
    telegram: Boolean(results.telegram),
    email: Boolean(results.email)
  }, headers);
}

export default {
  fetch(request, env) {
    return handleLead(request, env);
  }
};
