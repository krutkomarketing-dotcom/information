# -*- coding: utf-8 -*-
"""
Проверка словаря EN против разметки и скриптов.

    python i18n/check.py

Печатает:
  • ключи из index.html / script.js, которых нет в i18n/en.js  → EN покажет русский текст
  • ключи из en.js, которые нигде не используются              → мусор, можно удалить
  • русские строки в index.html без data-i18n                 → забыли пометить

Ничего не меняет, только читает. Стандартная библиотека, зависимостей нет.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'index.html')
JS = os.path.join(ROOT, 'script.js')
EN = os.path.join(ROOT, 'i18n', 'en.js')

def read(p):
    return io.open(p, encoding='utf-8').read()

html = read(HTML)
js = read(JS)
en = read(EN)

# ключи в разметке: data-i18n="..." и data-i18n-<attr>="..."
used = set(re.findall(r'data-i18n(?:-[a-z-]+)?="([^"]+)"', html))
# ключи в скриптах: T('key', ...) и TD('key', ...)
used |= set(re.findall(r"\bTD?\(\s*'([^']+)'", js))

# ключи словаря: 'section.slug': и верхнеуровневые блоки данных (plans, hubs, ...)
defined = set(re.findall(r"^\s*'([^']+)':", en, flags=re.M))
defined |= set(re.findall(r"^\s{2}([a-zA-Z_]+):\s*[\[{]", en, flags=re.M))
defined.discard('__config')

missing = sorted(k for k in used if k not in defined)
orphan = sorted(k for k in defined if k not in used)

# русский текст в разметке без ключа (грубая проверка по текстовым узлам)
body = html[html.find('<body'):]
body = re.sub(r'<!--.*?-->', '', body, flags=re.S)
body = re.sub(r'<script.*?</script>', '', body, flags=re.S)
body = re.sub(r'<svg.*?</svg>', '', body, flags=re.S)
unmarked = []
for m in re.finditer(r'<([a-z0-9]+)([^>]*)>([^<]*[А-Яа-яЁё][^<]*)', body):
    tag, attrs, txt = m.groups()
    if 'data-i18n' in attrs:
        continue
    before = body[max(0, m.start() - 600):m.start()]
    # тарифы перерисовываются из PLAN_DATA (script.js) — переводятся через TD('plans'), а не разметку
    if 'js-plan-list' in before or 'js-plan-term' in before or 'js-plan-desc' in before:
        continue
    if tag in ('b', 'i', 'strong', 'em', 'span', 'a', 'small', 'mark', 's', 'u', 'sup', 'sub', 'br', 'li', 'p'):
        # мог быть помечен родитель (innerHTML-режим) — проверяем ближайший открытый тег с data-i18n выше
        if 'data-i18n' in before:
            continue
    unmarked.append('<%s> %s' % (tag, re.sub(r'\s+', ' ', txt).strip()[:70]))

def section(title, items):
    print('\n%s (%d)' % (title, len(items)))
    for it in items:
        print('  ' + it)

section('Нет перевода в en.js (на EN останется русский текст)', missing)
section('Лишние ключи в en.js (нигде не используются)', orphan)
section('Русский текст без data-i18n (возможно, забыли пометить)', unmarked)

sys.exit(1 if missing else 0)
