/* ==========================================================================
   KV-web — переключение языка (RU / EN) без сборки.

   Как это работает:
   • Разметка index.html — источник правды для RU. Переводимые элементы
     помечены data-i18n="ключ", атрибуты — data-i18n-alt / -placeholder /
     -title / -aria-label / -data-hint / -content.
   • Английские тексты лежат в i18n/en.js (window.I18N_EN = { ключ: текст }).
     Нет ключа в словаре — элемент остаётся русским, страница не ломается.
   • Язык определяет инлайн-сниппет в <head> (window.KV_LANG): ?lang=,
     потом localStorage, потом язык браузера + часовой пояс.
   • Для строк внутри script.js: T('ключ', 'русский текст', {vars}),
     для структур данных (тарифы, города): TD('ключ', объект) — английские
     поля накладываются поверх русских по той же структуре.
   • Элементы с data-lang-only="ru" / "en" показываются только в этом языке.
   ========================================================================== */
(function () {
  'use strict';

  var lang = window.KV_LANG === 'en' ? 'en' : 'ru';
  var dict = (lang === 'en' && window.I18N_EN) ? window.I18N_EN : {};
  var CYR = /[Ѐ-ӿ]/;

  function has(key) { return Object.prototype.hasOwnProperty.call(dict, key); }

  function interpolate(str, vars) {
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : m;
    });
  }

  /* T('key', 'русский текст', {n: 5}) → перевод или русский текст */
  function T(key, ru, vars) {
    var v = has(key) ? dict[key] : ru;
    return interpolate(v == null ? '' : v, vars);
  }
  T.lang = lang;
  T.locale = lang === 'en' ? 'en-US' : 'ru-RU';
  T.config = dict.__config || {};   // EN-only переключатели поведения (например, скрытые регионы глобуса)

  function isObj(v) { return v && typeof v === 'object'; }
  function merge(ru, en) {
    if (Array.isArray(ru)) {
      return ru.map(function (item, i) {
        return (Array.isArray(en) && en[i] !== undefined) ? merge(item, en[i]) : item;
      });
    }
    if (isObj(ru)) {
      var out = {};
      Object.keys(ru).forEach(function (k) {
        out[k] = (isObj(en) && en[k] !== undefined) ? merge(ru[k], en[k]) : ru[k];
      });
      return out;
    }
    return (en === undefined || en === null) ? ru : en;
  }

  /* TD('plans', PLAN_DATA) → копия PLAN_DATA с английскими строками поверх */
  function TD(key, ruData) {
    return has(key) ? merge(ruData, dict[key]) : ruData;
  }

  window.T = T;
  window.TD = TD;

  /* ---------- применение к DOM ---------- */
  var ATTRS = ['alt', 'placeholder', 'title', 'aria-label', 'data-hint', 'content'];

  function setText(el, value) {
    if (value.indexOf('<') !== -1) { el.innerHTML = value; return; }
    if (!el.children.length) { el.textContent = value; return; }
    // смешанный контент (иконка, кнопка внутри): меняем только русский текстовый узел
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && CYR.test(n.nodeValue)) {
        var lead = (n.nodeValue.match(/^\s*/) || [''])[0];
        var tail = (n.nodeValue.match(/\s*$/) || [''])[0];
        n.nodeValue = lead + value + tail;
        return;
      }
    }
    el.textContent = value;
  }

  function translateDOM(root) {
    root = root || document;

    // элементы только для одного языка
    var only = root.querySelectorAll('[data-lang-only]');
    for (var i = 0; i < only.length; i++) {
      if (only[i].getAttribute('data-lang-only') !== lang) only[i].parentNode.removeChild(only[i]);
    }

    if (lang !== 'en') return;

    var els = root.querySelectorAll('[data-i18n]');
    for (var j = 0; j < els.length; j++) {
      var key = els[j].getAttribute('data-i18n');
      if (has(key)) setText(els[j], dict[key]);
    }
    ATTRS.forEach(function (a) {
      var nodes = root.querySelectorAll('[data-i18n-' + a + ']');
      for (var k = 0; k < nodes.length; k++) {
        var ak = nodes[k].getAttribute('data-i18n-' + a);
        if (has(ak)) nodes[k].setAttribute(a, dict[ak]);
      }
    });
  }
  T.translateDOM = translateDOM;

  /* ---------- переключатель RU / EN ---------- */
  function switchTo(next) {
    if (next === lang) return;
    try { localStorage.setItem('kv_lang', next); } catch (e) {}
    var url = new URL(location.href);
    url.searchParams.delete('lang');
    location.replace(url.toString());
  }

  function initSwitcher() {
    var btns = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var isOn = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-on', isOn);
      b.setAttribute('aria-pressed', String(isOn));
      b.addEventListener('click', function (e) {
        e.preventDefault();
        switchTo(this.getAttribute('data-lang'));
      });
    }
  }

  function reveal() { document.documentElement.classList.remove('i18n-wait'); }

  // скрипт подключён с defer → DOM уже разобран
  translateDOM(document);
  initSwitcher();

  // показываем страницу после того, как script.js отрисует динамические блоки
  document.addEventListener('DOMContentLoaded', function () { setTimeout(reveal, 0); });
  setTimeout(reveal, 2500); // страховка
})();
