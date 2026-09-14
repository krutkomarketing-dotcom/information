import assert from 'node:assert/strict';
import test from 'node:test';
import { handleLead, formatLead } from './lead.mjs';

const env = {
  TELEGRAM_BOT_TOKEN: '123:ABC',
  TELEGRAM_CHAT_ID: '42',
  WEB3FORMS_ACCESS_KEY: 'web3-key',
  SITE: 'KV-web'
};

function post(body) {
  return new Request('https://leads.example/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://kv.example' },
    body: JSON.stringify(body)
  });
}

test('formatLead lists form fields and skips empty honeypot', () => {
  const text = formatLead({
    Форма: 'Быстрая заявка',
    Имя: 'Анна',
    Телефон: '+375291112233',
    Сообщение: 'Нужен лендинг',
    company: ''
  }, 'KV-web');
  assert.match(text, /KV-web/);
  assert.match(text, /Анна/);
  assert.match(text, /Нужен лендинг/);
  assert.doesNotMatch(text, /company/i);
});

test('rejects a lead without a phone', async () => {
  const res = await handleLead(post({ Имя: 'Анна', Сообщение: 'привет' }), env, async () => {
    throw new Error('should not send');
  });
  assert.equal(res.status, 400);
});

test('honeypot returns ok and does not call Telegram or email', async () => {
  let calls = 0;
  const res = await handleLead(post({
    Имя: 'Бот',
    Телефон: '+375291112233',
    company: 'spam.example'
  }), env, async () => {
    calls += 1;
    return new Response('nope', { status: 500 });
  });
  assert.equal(res.status, 200);
  assert.equal(calls, 0);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test('sends the lead to Telegram and Web3Forms', async () => {
  const calls = [];
  const res = await handleLead(post({
    Форма: 'Аудит сайта',
    Имя: 'Илья',
    Телефон: '+375292528043',
    Сообщение: 'Хочу аудит'
  }), env, async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true, success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
  const tg = calls.find(c => String(c.url).includes('api.telegram.org'));
  const mail = calls.find(c => String(c.url).includes('api.web3forms.com'));
  assert.ok(tg, 'telegram call');
  assert.ok(mail, 'email call');
  assert.match(tg.url, /bot123:ABC\/sendMessage/);
  const tgBody = JSON.parse(tg.init.body);
  assert.equal(tgBody.chat_id, '42');
  assert.match(tgBody.text, /Хочу аудит/);
  const mailBody = JSON.parse(mail.init.body);
  assert.equal(mailBody.access_key, 'web3-key');
  assert.match(mailBody.message, /Хочу аудит/);
  const payload = await res.json();
  assert.equal(payload.telegram, true);
  assert.equal(payload.email, true);
  assert.equal(JSON.stringify(payload).includes('123:ABC'), false);
});

test('returns 502 when every channel fails', async () => {
  const res = await handleLead(post({
    Телефон: '+375292528043',
    Имя: 'Анна'
  }), env, async () => new Response('fail', { status: 500 }));
  assert.equal(res.status, 502);
});

test('emails via FormSubmit when CONTACT_EMAIL is set', async () => {
  const calls = [];
  const res = await handleLead(post({
    Форма: 'Быстрая заявка',
    Имя: 'Анна',
    Телефон: '+375292528043',
    Сообщение: 'Нужен лендинг'
  }), {
    ...env,
    WEB3FORMS_ACCESS_KEY: '',
    CONTACT_EMAIL: 'krutko.marketing@gmail.com'
  }, async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true, success: 'true' }), { status: 200 });
  });
  assert.equal(res.status, 200);
  const mail = calls.find(c => String(c.url).includes('formsubmit.co/ajax/krutko.marketing@gmail.com'));
  assert.ok(mail, 'formsubmit call');
  const body = JSON.parse(mail.init.body);
  assert.match(body['Сообщение'], /Нужен лендинг/);
  assert.equal(body.company, undefined);
});

test('OPTIONS is a CORS preflight, not a lead', async () => {
  const res = await handleLead(new Request('https://leads.example/lead', {
    method: 'OPTIONS',
    headers: { Origin: 'https://kv.example' }
  }), env, async () => {
    throw new Error('should not send');
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://kv.example');
});
