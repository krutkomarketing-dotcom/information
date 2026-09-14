import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

test('placeholder phone and email are gone', () => {
  assert.equal(html.includes('+375290000000'), false);
  assert.equal(html.includes('000-00-00'), false);
  assert.equal(html.includes('info@kv-web.ru'), false);
  assert.equal(js.includes('000-00-00'), false);
});

test('real phone, email, Telegram and WhatsApp are wired', () => {
  assert.match(html, /href="tel:\+375292528043"/);
  assert.match(html, /href="mailto:krutko\.marketing@gmail\.com"/);
  assert.match(html, /href="https:\/\/t\.me\/sq_dbl"/);
  assert.match(html, /href="https:\/\/wa\.me\/375292528043/);
  assert.match(html, /\+375 \(29\) 252-80-43/);
});

test('messenger icons do not loop back to the footer', () => {
  assert.doesNotMatch(html, /aria-label="Telegram"[^>]*href="#contacts"/);
  assert.doesNotMatch(html, /aria-label="WhatsApp"[^>]*href="#contacts"/);
  assert.equal(html.includes('aria-label="ВКонтакте"'), false);
  assert.equal(html.includes('aria-label="Behance"'), false);
});

test('order buttons land on a form, not the legal footer', () => {
  assert.match(html, /id="write"/);
  assert.equal((html.match(/class="case__btn"[^>]*href="#contacts"/g) || []).length, 0);
  assert.match(html, /href="#write"/);
});

test('every public form can carry a message and a honeypot', () => {
  const forms = html.match(/<form(?![^>]*js-term-form)[^>]*>[\s\S]*?<\/form>/g) || [];
  assert.equal(forms.length, 4);
  for (const form of forms) {
    assert.match(form, /name="Сообщение"/);
    assert.match(form, /name="company"/);
  }
});

test('empty endpoint does not fake a successful delivery', () => {
  assert.doesNotMatch(js, /ENDPOINT не задан/);
  assert.match(js, /formsubmit\.co\/ajax\/krutko\.marketing@gmail\.com/);
});
