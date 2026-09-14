/* ==========================================================================
   KV-web — логика лендинга.

   Заявки: если ENDPOINT пустой, форма шлёт письмо через FormSubmit
   на CONTACT.email (первый раз нужно подтвердить ящик по ссылке из письма).
   Когда задеплоен worker/ (почта + Telegram, секреты не в странице),
   впишите его URL в ENDPOINT — форма пойдёт туда и перестанет звать FormSubmit.
   Тексты, которые видит пользователь, обёрнуты в T() — см. i18n.js / i18n/en.js.
   ========================================================================== */
const CONTACT = {
  phoneDisplay: '+375 (29) 252-80-43',
  phoneTel: '+375292528043',
  email: 'krutko.marketing@gmail.com',
  telegram: 'https://t.me/sq_dbl',
  whatsapp: 'https://wa.me/375292528043'
};

const FORM_CONFIG = {
  ENDPOINT: 'https://kv-web-leads.kvweb.workers.dev',
  SITE: 'KV-web — лендинг'
};

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- мобильное меню ---------- */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('mainnav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? T('top.label.otkryt-menyu', 'Открыть меню') : T('top.label.zakryt-menyu', 'Закрыть меню'));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---------- интерактивная иллюстрация первого экрана ---------- */
  initHeroInteractive();

  function initHeroInteractive() {
    const stage = document.getElementById('heroStage');
    if (!stage) return;

    const spots = Array.from(stage.querySelectorAll('.hero-spot'));
    const hint = stage.querySelector('.hero-stage__hint');
    if (!spots.length) return;

    let activeSpot = null;

    // На телефоне карточка центрируется по точке и может вылезти за сцену —
    // сдвигаем её внутрь через --pop-shift (см. .hero-spot__pop в style.css)
    function fitPop(spot) {
      const pop = spot.querySelector('.hero-spot__pop');
      if (!pop || window.innerWidth > 768) return;
      pop.style.setProperty('--pop-shift', '0px');
      const s = stage.getBoundingClientRect();
      const p = pop.getBoundingClientRect();
      const pad = 8;
      let shift = 0;
      if (p.left < s.left + pad) shift = (s.left + pad) - p.left;
      else if (p.right > s.right - pad) shift = (s.right - pad) - p.right;
      if (shift) pop.style.setProperty('--pop-shift', shift.toFixed(1) + 'px');
    }

    function setActive(spot) {
      if (activeSpot === spot) return;
      if (activeSpot) activeSpot.classList.remove('is-open');
      activeSpot = spot;
      if (activeSpot) {
        activeSpot.classList.add('is-open');
        fitPop(activeSpot);
      }
    }

    function clearActive() {
      if (activeSpot) {
        activeSpot.classList.remove('is-open');
        activeSpot = null;
      }
    }

    spots.forEach(spot => {
      // Клик / тап
      spot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (hint) hint.style.opacity = '0';
        if (activeSpot === spot) {
          clearActive();
        } else {
          setActive(spot);
        }
      });

      // Мышь: мгновенное появление без задержек и лагов
      spot.addEventListener('mouseenter', () => {
        if (hint) hint.style.opacity = '0';
        setActive(spot);
      });

      spot.addEventListener('mouseleave', () => {
        clearActive();
      });

      // Доступность с клавиатуры
      spot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (hint) hint.style.opacity = '0';
          if (activeSpot === spot) clearActive();
          else setActive(spot);
        } else if (e.key === 'Escape') {
          clearActive();
        }
      });
    });

    // Снятие подсветки при клике мимо
    document.addEventListener('click', (e) => {
      if (!stage.contains(e.target)) {
        clearActive();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') clearActive();
    });
  }

  /* ---------- выпадашка «Услуги» ---------- */
  document.querySelectorAll('.subtoggle').forEach(btn => {
    const li = btn.closest('.has-sub');
    btn.addEventListener('click', () => {
      const open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.has-sub')) {
      document.querySelectorAll('.has-sub.is-open').forEach(li => {
        li.classList.remove('is-open');
        li.querySelector('.subtoggle')?.setAttribute('aria-expanded', 'false');
      });
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-sub.is-open').forEach(li => li.classList.remove('is-open'));
    if (nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      burger?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- квиз ---------- */
  const quiz = document.getElementById('quizForm');
  if (quiz) {
    const steps = [...quiz.querySelectorAll('.quiz__step')];
    const fill = document.getElementById('quizFill');
    const count = document.getElementById('quizCount');
    const back = document.getElementById('quizBack');
    const next = document.getElementById('quizNext');
    const send = document.getElementById('quizSend');
    const total = steps.length;
    let cur = 0;

    const render = () => {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === cur));
      fill.style.width = ((cur + 1) / total * 100).toFixed(1) + '%';
      count.textContent = T('quiz.count', '{n} из {total}', { n: cur + 1, total });
      back.hidden = cur === 0;
      next.hidden = cur === total - 1;
      send.hidden = cur !== total - 1;
    };

    next.addEventListener('click', () => {
      if (cur < total - 1) { cur++; render(); scrollIntoQuiz(); }
    });
    back.addEventListener('click', () => {
      if (cur > 0) { cur--; render(); scrollIntoQuiz(); }
    });
    const scrollIntoQuiz = () => {
      const top = quiz.getBoundingClientRect().top;
      if (top < 0) quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    render();
    attachSubmit(quiz, 'Квиз: расчёт стоимости');
  }

  /* ---------- карусель и фильтр кейсов ---------- */
  const chips = [...document.querySelectorAll('.chip')];
  const cases = [...document.querySelectorAll('.case')];
  const empty = document.querySelector('.cases__empty');
  const casesTrack = document.getElementById('casesTrack');
  const prevBtn = document.getElementById('casesPrev');
  const nextBtn = document.getElementById('casesNext');
  const sidePrevBtn = document.getElementById('casesSidePrev');
  const sideNextBtn = document.getElementById('casesSideNext');
  const currEl = document.getElementById('casesCounterCurr');
  const totalEl = document.getElementById('casesCounterTotal');
  const progressFill = document.getElementById('casesProgress');
  const dotsContainer = document.getElementById('casesDots');

  if (casesTrack) {
    const getVisibleCases = () => cases.filter(c => !c.hidden && c.style.display !== 'none');
    const padZero = (n) => String(n).padStart(2, '0');
    const getStep = () => (window.innerWidth > 768 ? 2 : 1);
    const getTotalSlides = () => {
      const visible = getVisibleCases();
      const step = getStep();
      return Math.max(1, Math.ceil(visible.length / step));
    };

    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let hasMoved = false;
    let animId = null;
    let currentSlide = 0;

    const updateCarouselUI = () => {
      const visible = getVisibleCases();
      const totalSlides = getTotalSlides();
      const step = getStep();

      if (totalEl) totalEl.textContent = padZero(totalSlides);

      if (visible.length === 0) {
        if (currEl) currEl.textContent = '00';
        if (progressFill) progressFill.style.width = '0%';
        document.querySelectorAll('.js-cases-prev, .js-cases-next').forEach(btn => { btn.disabled = true; });
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
      }

      // Вычисляем активный слайд по положению скролла
      let activeSlide = 0;
      let minDiff = Infinity;
      for (let s = 0; s < totalSlides; s++) {
        const cardIndex = Math.min(visible.length - 1, s * step);
        const card = visible[cardIndex];
        if (!card) continue;
        const targetPos = card.offsetLeft - casesTrack.offsetLeft;
        const diff = Math.abs(casesTrack.scrollLeft - targetPos);
        if (diff < minDiff) {
          minDiff = diff;
          activeSlide = s;
        }
      }

      currentSlide = activeSlide;
      if (currEl) currEl.textContent = padZero(activeSlide + 1);

      // Прогрессбар
      const maxScroll = casesTrack.scrollWidth - casesTrack.clientWidth;
      if (progressFill) {
        if (maxScroll <= 10 || totalSlides <= 1) {
          progressFill.style.width = '100%';
        } else {
          const percent = ((activeSlide + 1) / totalSlides) * 100;
          progressFill.style.width = Math.max(20, Math.min(100, percent)) + '%';
        }
      }

      // Стрелки навигации: синхронно обновляем все кнопки влево и вправо
      const isStart = activeSlide === 0 && casesTrack.scrollLeft <= 12;
      const isEnd = activeSlide >= totalSlides - 1 || (maxScroll > 10 && casesTrack.scrollLeft >= maxScroll - 16);

      document.querySelectorAll('.js-cases-prev').forEach(btn => { btn.disabled = isStart; });
      document.querySelectorAll('.js-cases-next').forEach(btn => { btn.disabled = isEnd; });

      // Точки
      if (dotsContainer) {
        const dots = [...dotsContainer.children];
        dots.forEach((dot, idx) => {
          dot.classList.toggle('is-active', idx === activeSlide);
          dot.setAttribute('aria-selected', idx === activeSlide ? 'true' : 'false');
        });
      }
    };

    // Мягкая, плавная интерполяция перемотки без резких рывков
    const smoothScrollTo = (targetX, duration = 620) => {
      if (animId) cancelAnimationFrame(animId);

      const start = casesTrack.scrollLeft;
      const maxScroll = casesTrack.scrollWidth - casesTrack.clientWidth;
      const clampedTarget = Math.max(0, Math.min(targetX, maxScroll));
      const dist = clampedTarget - start;

      if (Math.abs(dist) < 2) return;

      const startTime = performance.now();
      casesTrack.style.scrollSnapType = 'none';
      casesTrack.style.scrollBehavior = 'auto';

      // Кубическая функция замедления: мягкий старт и очень плавное торможение
      const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const stepFn = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeInOutCubic(progress);

        casesTrack.scrollLeft = start + dist * ease;

        if (progress < 1) {
          animId = requestAnimationFrame(stepFn);
        } else {
          casesTrack.scrollLeft = clampedTarget;
          casesTrack.style.scrollSnapType = '';
          casesTrack.style.scrollBehavior = '';
          animId = null;
          updateCarouselUI();
        }
      };

      animId = requestAnimationFrame(stepFn);
    };

    const scrollToSlide = (slideIndex) => {
      const visible = getVisibleCases();
      const step = getStep();
      const targetCardIndex = Math.min(visible.length - 1, slideIndex * step);
      const targetCard = visible[targetCardIndex];
      if (!targetCard) return;
      const leftPos = targetCard.offsetLeft - casesTrack.offsetLeft;
      smoothScrollTo(leftPos, 620);
    };

    const renderDots = () => {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const totalSlides = getTotalSlides();
      for (let s = 0; s < totalSlides; s++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cases__dot' + (s === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', T('types.label.slide', 'Перейти к слайду {n}', { n: s + 1 }));
        dot.addEventListener('click', () => {
          scrollToSlide(s);
        });
        dotsContainer.appendChild(dot);
      }
    };

    const goNext = () => {
      const totalSlides = getTotalSlides();
      const nextSlide = Math.min(totalSlides - 1, currentSlide + 1);
      scrollToSlide(nextSlide);
    };

    const goPrev = () => {
      const prevSlide = Math.max(0, currentSlide - 1);
      scrollToSlide(prevSlide);
    };

    // Клики по кнопкам-стрелкам в шапке
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);

    // Клики по боковым плавающим стрелкам
    if (sideNextBtn) sideNextBtn.addEventListener('click', goNext);
    if (sidePrevBtn) sidePrevBtn.addEventListener('click', goPrev);

    // Слушатель скролла с requestAnimationFrame
    let scrollTicking = false;
    casesTrack.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          updateCarouselUI();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    // Drag-to-scroll мышью на десктопе
    casesTrack.addEventListener('mousedown', e => {
      if (e.target.closest('a, button')) return;
      isDown = true;
      hasMoved = false;
      casesTrack.classList.add('is-dragging');
      startX = e.pageX - casesTrack.offsetLeft;
      scrollLeftStart = casesTrack.scrollLeft;
    });

    window.addEventListener('mousemove', e => {
      if (!isDown) return;
      const x = e.pageX - casesTrack.offsetLeft;
      const walk = (x - startX) * 1.3;
      if (Math.abs(walk) > 4) {
        hasMoved = true;
      }
      casesTrack.scrollLeft = scrollLeftStart - walk;
    });

    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      casesTrack.classList.remove('is-dragging');
      if (hasMoved) {
        const preventClick = evt => {
          evt.stopPropagation();
          evt.preventDefault();
        };
        casesTrack.addEventListener('click', preventClick, { capture: true, once: true });
      }
    };

    window.addEventListener('mouseup', endDrag);

    // Первичная инициализация
    renderDots();
    updateCarouselUI();
    window.addEventListener('resize', () => {
      renderDots();
      updateCarouselUI();
    }, { passive: true });

    // Фильтры категорий
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => { c.classList.remove('is-on'); c.setAttribute('aria-selected', 'false'); });
        chip.classList.add('is-on');
        chip.setAttribute('aria-selected', 'true');
        const f = chip.dataset.filter;
        let shown = 0;
        cases.forEach(card => {
          const ok = f === 'all' || (card.dataset.tags || '').split(' ').includes(f);
          card.hidden = !ok;
          card.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown !== 0;

        casesTrack.scrollTo({ left: 0, behavior: 'auto' });
        renderDots();
        setTimeout(updateCarouselUI, 60);
      });
    });
  }

  /* ---------- ДИНАМИЧЕСКИЕ ТАРИФЫ (РЫНОЧНЫЕ ЦЕНЫ С ВЫЧЕТОМ 20%) ---------- */
  const PLAN_DATA = TD('plans', {
    landing: {
      sub: 'Стоимость создания продающего лендинга в Беларуси с выгодой 20% от рынка',
      plans: [
        {
          term: 'Сроки разработки: 4-7 дней',
          desc: 'Быстрый запуск для теста ниши или услуги. До 5 конверсионных блоков с мобильной адаптацией.',
          market: '1 740 BYN',
          price: 'от 1 390 BYN',
          val: 1390,
          items: [
            { t: 'Анализ ниши и конкурентов', on: true },
            { t: 'Продающий текст и структура (4U / AIDA)', on: true },
            { t: 'Индивидуальный дизайн (Figma)', on: true },
            { t: 'Чистая адаптивная верстка (HTML5/CSS3/JS)', on: true },
            { t: 'Подключение форм и уведомлений в Telegram', on: true },
            { t: 'Базовая SEO-оптимизация и метатеги', on: true },
            { t: 'Сложная 3D-графика и шейдеры', on: false },
            { t: 'Интеграция с CRM-системами', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 8-14 дней',
          desc: 'Полноценный высококонверсионный лендинг для товарного бизнеса, услуг или B2B-направления.',
          market: '2 800 BYN',
          price: 'от 2 240 BYN',
          val: 2240,
          items: [
            { t: 'Глубокий CustDev и анализ целевой аудитории', on: true },
            { t: 'Маркетинговый копирайтинг и прототипирование', on: true },
            { t: 'Премиальный авторский UI/UX дизайн', on: true },
            { t: 'Плавные микровзаимодействия и анимация', on: true },
            { t: 'Интеграция с amoCRM / Bitrix24', on: true },
            { t: 'Подключение онлайн-оплаты (ЕРИП / bePaid)', on: true },
            { t: 'Настройка аналитики (Яндекс Метрика + цели)', on: true },
            { t: 'Гарантия и техподдержка 30 дней', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 14-22 дня',
          desc: 'Уникальный имиджевый лендинг уровня Awwwards: 3D-модели, интерактив, максимальный ROAS.',
          market: '4 200 BYN',
          price: 'от 3 360 BYN',
          val: 3360,
          items: [
            { t: 'Полный цикл: стратегия + позиционирование', on: true },
            { t: '3D-сцены (Three.js), Canvas и интерактивный моушн', on: true },
            { t: 'Нестандартные калькуляторы и квиз-воронки', on: true },
            { t: 'Интеграция сквозной аналитики и Telegram WebApp', on: true },
            { t: 'Скорость 95+ баллов Google PageSpeed', on: true },
            { t: 'A/B-тестирование первого экрана', on: true },
            { t: 'Персональное ведение ведущим инженером', on: true },
            { t: 'Приоритетная поддержка 60 дней', on: true }
          ]
        }
      ]
    },
    ios: {
      sub: 'Стоимость разработки нативных приложений для iOS (Swift / SwiftUI) в Беларуси с выгодой 20%',
      plans: [
        {
          term: 'Сроки разработки: 12-20 дней',
          desc: 'Быстрый нативный MVP на SwiftUI: до 3 экранов, базовая бизнес-логика, локальное хранение данных.',
          market: '4 940 BYN',
          price: 'от 3 950 BYN',
          val: 3950,
          items: [
            { t: 'Проектирование экранов и архитектуры iOS', on: true },
            { t: 'Нативная разработка на Swift 6 / SwiftUI', on: true },
            { t: 'Поддержка iOS 17 / iOS 18 и Dynamic Island', on: true },
            { t: 'Локальная база данных (SwiftData / CoreData)', on: true },
            { t: 'Адаптация под все модели iPhone', on: true },
            { t: 'Серверный бэкенд и push-уведомления', on: false },
            { t: 'Встроенные покупки (In-App Purchases)', on: false },
            { t: 'Публикация в App Store', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 20-35 дней',
          desc: 'Полнофункциональное мобильное приложение с бэкендом, авторизацией и синхронизацией.',
          market: '8 900 BYN',
          price: 'от 7 120 BYN',
          val: 7120,
          items: [
            { t: 'Индивидуальный дизайн iOS Human Interface', on: true },
            { t: 'Нативный стек: Swift + SwiftUI + Combine', on: true },
            { t: 'REST API бэкенд и облачная база данных', on: true },
            { t: 'Авторизация (Apple ID, номер телефона)', on: true },
            { t: 'Push-уведомления (APNs) и глубокие ссылки', on: true },
            { t: 'Интеграция подписок (StoreKit 2)', on: true },
            { t: 'Полная подготовка и публикация в App Store', on: true },
            { t: 'Гарантийное сопровождение 45 дней', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 35-60 дней',
          desc: 'Сложная мобильная экосистема: интеграция CoreML, видеотрекинг, виджеты, оффлайн-режим.',
          market: '14 750 BYN',
          price: 'от 11 800 BYN',
          val: 11800,
          items: [
            { t: 'Архитектура высокой нагрузки и оффлайн-кэш', on: true },
            { t: 'Нейросети на устройстве (CoreML / Vision / AI)', on: true },
            { t: 'Интеграция HealthKit / фитнес-датчиков', on: true },
            { t: 'Виджеты рабочего стола iOS + Live Activities', on: true },
            { t: 'Многофакторная безопасность и шифрование', on: true },
            { t: 'CI/CD сборка, TestFlight бета-тестирование', on: true },
            { t: 'Прохождение строгой модерации App Store Review', on: true },
            { t: 'Выделенная техподдержка 90 дней', on: true }
          ]
        }
      ]
    },
    express: {
      sub: 'Стоимость срочного запуска экспресс-лендинга за 2-4 дня в Беларуси с выгодой 20%',
      plans: [
        {
          term: 'Сроки разработки: 2-3 дня',
          desc: 'Срочный запуск промо-страницы акции, мероприятия или теста спроса на одну услугу.',
          market: '860 BYN',
          price: 'от 690 BYN',
          val: 690,
          items: [
            { t: 'Готовая протестированная модульная сетка', on: true },
            { t: 'Копирайтинг оффера и УТП за 24 часа', on: true },
            { t: 'Адаптация под все мобильные экраны', on: true },
            { t: 'Форма сбора лидов с уведомлением в Telegram', on: true },
            { t: 'Установка счетчика Яндекс Метрики', on: true },
            { t: 'Индивидуальная анимация', on: false },
            { t: 'Интеграция с CRM', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 3-4 дня',
          desc: 'Экспресс-лендинг до 4 экранов с фирменным стилем и интеграцией воронки продаж.',
          market: '1 400 BYN',
          price: 'от 1 120 BYN',
          val: 1120,
          items: [
            { t: 'Индивидуальный дизайн первого экрана', on: true },
            { t: 'Блок преимуществ, услуг и прайс-листа', on: true },
            { t: 'Интерактивный калькулятор или квиз', on: true },
            { t: 'Моментальная пересылка лидов менеджеру', on: true },
            { t: 'Базовая интеграция с amoCRM', on: true },
            { t: 'Настройка пикселей рекламы (VK / Meta)', on: true },
            { t: 'Поддержка 14 дней после запуска', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 4-5 дней',
          desc: 'Быстрый запуск «под ключ» с маркетинговой связкой и готовностью к платному трафику.',
          market: '2 100 BYN',
          price: 'от 1 680 BYN',
          val: 1680,
          items: [
            { t: 'Проработка сильного позиционирования', on: true },
            { t: 'Уникальная графика и брендированные баннеры', on: true },
            { t: 'Подключение эквайринга (ЕРИП / карты)', on: true },
            { t: 'Полная интеграция с CRM (сделки + контакты)', on: true },
            { t: 'UTM-разметка и цели для контекстной рекламы', on: true },
            { t: 'Домен и хостинг на 1 год в подарок', on: true },
            { t: 'Техподдержка 30 дней', on: true }
          ]
        }
      ]
    },
    card: {
      sub: 'Стоимость создания презентабельного сайта-визитки компании в Беларуси с выгодой 20%',
      plans: [
        {
          term: 'Сроки разработки: 3-5 дней',
          desc: 'Аккуратная цифровая визитка специалиста, юриста, мастера или небольшой компании.',
          market: '1 110 BYN',
          price: 'от 890 BYN',
          val: 890,
          items: [
            { t: 'Структура: о себе, услуги, прайс, контакты', on: true },
            { t: 'Адаптация под смартфоны и планшеты', on: true },
            { t: 'Кнопки быстрой связи: звонок, WhatsApp, Telegram', on: true },
            { t: 'Интерактивная карта проезда', on: true },
            { t: 'Почтовый ящик на вашем домене', on: true },
            { t: 'Мультиязычность', on: false },
            { t: 'Личный кабинет', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 5-8 дней',
          desc: 'Многостраничная или расширенная визитка компании с каталогом работ и сертификатами.',
          market: '1 860 BYN',
          price: 'от 1 490 BYN',
          val: 1490,
          items: [
            { t: 'До 5 структурированных разделов', on: true },
            { t: 'Портфолио с галереей и кейсами', on: true },
            { t: 'Форма онлайн-записи / расчета стоимости', on: true },
            { t: 'Базовое SEO-продвижение под поисковики', on: true },
            { t: 'Защищенный SSL-сертификат HTTPS', on: true },
            { t: 'Подключение Google Analytics и Метрики', on: true },
            { t: 'Техподдержка 30 дней', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 7-12 дней',
          desc: 'Имиджевая цифровая визитка премиум-класса с эксклюзивным дизайном и каталогом.',
          market: '2 740 BYN',
          price: 'от 2 190 BYN',
          val: 2190,
          items: [
            { t: 'Авторский фирменный стиль и типографика', on: true },
            { t: 'Интерактивный прайс-лист с фильтрами', on: true },
            { t: 'Двуязычная версия (RU / EN)', on: true },
            { t: 'Сквозная интеграция с CRM-системой', on: true },
            { t: 'Быстродействие 95+ PageSpeed', on: true },
            { t: 'Настройка корпоративной почты для сотрудников', on: true },
            { t: 'Расширенная гарантия 60 дней', on: true }
          ]
        }
      ]
    },
    corp: {
      sub: 'Стоимость разработки официального корпоративного сайта в Беларуси с выгодой 20%',
      plans: [
        {
          term: 'Сроки разработки: 10-18 дней',
          desc: 'Корпоративный сайт до 10 страниц: история, руководство, услуги, реквизиты, вакансии.',
          market: '2 990 BYN',
          price: 'от 2 390 BYN',
          val: 2390,
          items: [
            { t: 'Проектирование информационной архитектуры', on: true },
            { t: 'Каталог услуг компании с карточками', on: true },
            { t: 'Раздел новостей / блог со статьями', on: true },
            { t: 'Удобная панель управления контентом', on: true },
            { t: 'Базовая SEO-оптимизация всех страниц', on: true },
            { t: 'Интеграция с 1С / складом', on: false },
            { t: 'Личный кабинет клиента', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 18-30 дней',
          desc: 'Масштабный корпоративный ресурс для производства, логистики, медицины или B2B.',
          market: '4 810 BYN',
          price: 'от 3 850 BYN',
          val: 3850,
          items: [
            { t: 'Многоуровневый каталог продукции с PDF-скачиванием', on: true },
            { t: 'Калькулятор стоимости услуг для клиентов', on: true },
            { t: 'Интеграция с amoCRM / Bitrix24', on: true },
            { t: 'Раздел документов, лицензий и тендеров', on: true },
            { t: 'Формы для разных отделов (продажи, закупки, HR)', on: true },
            { t: 'Оптимизация скорости и Core Web Vitals', on: true },
            { t: 'Обучение ваших сотрудников работе с сайтом', on: true },
            { t: 'Гарантийное обслуживание 45 дней', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 30-50 дней',
          desc: 'Флагманский корпоративный портал высокой сложности: интеграция с 1С, мультиязычность, API.',
          market: '7 800 BYN',
          price: 'от 6 240 BYN',
          val: 6240,
          items: [
            { t: 'Высоконагруженная архитектура (Node.js/Python/Go)', on: true },
            { t: 'Двусторонняя синхронизация с 1С / ERP', on: true },
            { t: 'Личный кабинет оптового партнера / дилера', on: true },
            { t: 'Мультиязычность (до 3 языковых версий)', on: true },
            { t: 'Разграничение прав доступа для филиалов', on: true },
            { t: 'Высокий уровень кибербезопасности и резервное копирование', on: true },
            { t: 'Полное SEO-проектирование под Яндекс и Google', on: true },
            { t: 'Персональное сопровождение 90 дней', on: true }
          ]
        }
      ]
    },
    shop: {
      sub: 'Стоимость создания интернет-магазина в Беларуси с выгодой 20% от рынка',
      plans: [
        {
          term: 'Сроки разработки: 12-20 дней',
          desc: 'Быстрый запуск e-commerce: каталог до 300 товаров, корзина, оформление заказа.',
          market: '3 360 BYN',
          price: 'от 2 690 BYN',
          val: 2690,
          items: [
            { t: 'Каталог с категориями и поиском', on: true },
            { t: 'Карточка товара с галереей и характеристиками', on: true },
            { t: 'Удобная корзина и оформление за 1 шаг', on: true },
            { t: 'Уведомления о заказах в Telegram и на почту', on: true },
            { t: 'Базовая панель управления товарами', on: true },
            { t: 'Онлайн-эквайринг банков', on: false },
            { t: 'Автоматическая выгрузка из 1С', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 20-35 дней',
          desc: 'Полноценный магазин с приемом платежей (ЕРИП / карты), фильтрами и доставкой.',
          market: '5 700 BYN',
          price: 'от 4 560 BYN',
          val: 4560,
          items: [
            { t: 'Умный фильтр товаров по параметрам', on: true },
            { t: 'Онлайн-оплата картами и ЕРИП (bePaid / Webpay)', on: true },
            { t: 'Интеграция со службами доставки (Европочта, Белпочта, CDEK)', on: true },
            { t: 'Личный кабинет покупателя с историей заказов', on: true },
            { t: 'Скидки, промокоды и триггерные скидки', on: true },
            { t: 'Синхронизация с CRM-системой', on: true },
            { t: 'SEO-структура под ключевые товарные запросы', on: true },
            { t: 'Сопровождение 45 дней', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 35-55 дней',
          desc: 'Автоматизированный маркетплейс / гипермаркет: тысячи товаров, 1С, остатки онлайн.',
          market: '9 350 BYN',
          price: 'от 7 480 BYN',
          val: 7480,
          items: [
            { t: 'Автоматический двусторонний обмен с 1С / МойСклад', on: true },
            { t: 'Обновление цен и остатков в реальном времени', on: true },
            { t: 'B2B-функционал: оптовые цены, счета для юрлиц', on: true },
            { t: 'Программа бонусов, кешбэк и накопительные скидки', on: true },
            { t: 'Высокая скорость фильтрации при 50 000+ товарах', on: true },
            { t: 'Брошенные корзины и допродажи в Telegram', on: true },
            { t: 'Защита от сбоев в пиковые распродажи', on: true },
            { t: 'Приоритетная поддержка 90 дней', on: true }
          ]
        }
      ]
    },
    wp: {
      sub: 'Стоимость разработки сайта на WordPress в Беларуси с выгодой 20% от рынка',
      plans: [
        {
          term: 'Сроки разработки: 5-9 дней',
          desc: 'Чистый сайт на WordPress: легкая тема, удобное редактирование текстов и фото.',
          market: '1 600 BYN',
          price: 'от 1 280 BYN',
          val: 1280,
          items: [
            { t: 'Установка и базовая настройка WP', on: true },
            { t: 'Чистая верстка без тяжелых конструкторов Elementor', on: true },
            { t: 'Удобное добавление страниц через блоки Gutenberg', on: true },
            { t: 'Адаптивность для всех мобильных экранов', on: true },
            { t: 'Защита админки от спама и взлома', on: true },
            { t: 'Кастомные типы записей ACF Pro', on: false },
            { t: 'Интеграция со сторонними сервисами', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 10-18 дней',
          desc: 'Индивидуальная кастомная тема на WordPress + ACF: скорость загрузки 90+ баллов.',
          market: '2 600 BYN',
          price: 'от 2 080 BYN',
          val: 2080,
          items: [
            { t: 'Разработка темы с нуля под ваш макет Figma', on: true },
            { t: 'Полностью кастомные поля (ACF Pro)', on: true },
            { t: 'Высокая скорость работы (отклик до 0.4 сек)', on: true },
            { t: 'SEO-плагины (Yoast / RankMath) с правильной разметкой', on: true },
            { t: 'Формы обратной связи с валидацией и спам-фильтром', on: true },
            { t: 'Интеграция с Telegram-ботом заявок', on: true },
            { t: 'Видеоинструкция по редактированию сайта', on: true },
            { t: 'Поддержка 30 дней', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 18-28 дней',
          desc: 'Мощный портал / сервис на WordPress + WooCommerce с оптимизацией высокой нагрузки.',
          market: '3 990 BYN',
          price: 'от 3 190 BYN',
          val: 3190,
          items: [
            { t: 'Архитектура Headless WP или глубокая кастомизация', on: true },
            { t: 'WooCommerce с кастомным оформлением корзины', on: true },
            { t: 'Интеграция платежных шлюзов РБ (ЕРИП, банки)', on: true },
            { t: 'Redis Object Cache для мгновенного отклика', on: true },
            { t: 'Тонкая настройка безопасности и автобэкапы', on: true },
            { t: 'Многоязычность через WPML / Polylang', on: true },
            { t: 'Персональная поддержка 60 дней', on: true }
          ]
        }
      ]
    },
    design: {
      sub: 'Стоимость UX/UI дизайна и редизайна сайта в Беларуси с выгодой 20% от рынка',
      plans: [
        {
          term: 'Сроки разработки: 4-7 дней',
          desc: 'Редизайн ключевого экрана или лендинга: современный визуальный стиль и конверсионная сетка.',
          market: '1 150 BYN',
          price: 'от 920 BYN',
          val: 920,
          items: [
            { t: 'Экспресс-аудит текущего сайта и ошибок UX', on: true },
            { t: 'Проработка структуры первого экрана и оффера', on: true },
            { t: 'Отрисовка дизайн-макета в Figma (десктоп)', on: true },
            { t: 'Подбор цветовой палитры и шрифтовых пар', on: true },
            { t: 'Подготовка ассетов для верстальщика', on: true },
            { t: 'Мобильная адаптивная версия', on: false },
            { t: 'Интерактивный кликабельный прототип', on: false }
          ]
        },
        {
          term: 'Сроки разработки: 8-15 дней',
          desc: 'Комплексный UI/UX дизайн сайта: десктоп + планшет + мобильные экраны, UI-кит.',
          market: '2 060 BYN',
          price: 'от 1 650 BYN',
          val: 1650,
          items: [
            { t: 'Анализ конкурентов и CJM (пути клиента)', on: true },
            { t: 'Черно-белый интерактивный прототип логики', on: true },
            { t: 'Уникальный дизайн всех блоков в Figma', on: true },
            { t: 'Адаптивные версии под все разрешения (Desktop + Mobile)', on: true },
            { t: 'Полноценный UI Kit: кнопки, поля, состояния, иконки', on: true },
            { t: 'Спецификация анимаций для разработчиков', on: true },
            { t: '2 итерации правок включены в стоимость', on: true },
            { t: 'Авторский надзор при верстке', on: true }
          ]
        },
        {
          term: 'Сроки разработки: 15-25 дней',
          desc: 'Премиальный креативный дизайн уровня Awwwards: 3D-графика, дизайн-система, брендинг.',
          market: '3 350 BYN',
          price: 'от 2 680 BYN',
          val: 2680,
          items: [
            { t: 'Глубокий брендинг и разработка айдентики', on: true },
            { t: '3D-иллюстрации и эксклюзивные графические материалы', on: true },
            { t: 'Полная дизайн-система с токенами и компонентами', on: true },
            { t: 'Интерактивный кликабельный прототип высокой точности', on: true },
            { t: 'Моушн-дизайн и раскадровка микровзаимодействий', on: true },
            { t: 'Презентация концепций перед руководством', on: true },
            { t: 'Полный авторский контроль реализации разработчиками', on: true },
            { t: 'Пожизненная передача всех исходников и прав', on: true }
          ]
        }
      ]
    }
  });

  const ptabs = [...document.querySelectorAll('.ptab')];
  const pricingSub = document.querySelector('.js-pricing-sub');
  const planCards = [...document.querySelectorAll('.js-plan-card')];

  function updatePricingPlans(catKey) {
    const data = PLAN_DATA[catKey];
    if (!data) return;

    if (pricingSub) {
      pricingSub.textContent = data.sub;
    }

    planCards.forEach((card, idx) => {
      const tierData = data.plans[idx];
      if (!tierData) return;

      const termEl = card.querySelector('.js-plan-term');
      const descEl = card.querySelector('.js-plan-desc');
      const listEl = card.querySelector('.js-plan-list');
      const marketEl = card.querySelector('.plan__market-price s');
      const valEl = card.querySelector('.js-plan-val');

      if (termEl) termEl.textContent = tierData.term;
      if (descEl) descEl.textContent = tierData.desc;

      if (marketEl) marketEl.textContent = T('pricing.market-prefix', 'рыночная ') + tierData.market;
      if (valEl) {
        valEl.textContent = tierData.price;
        valEl.setAttribute('data-count', tierData.val);
        valEl.classList.remove('is-updated');
        void valEl.offsetWidth;
        valEl.classList.add('is-updated');
      }

      if (listEl && tierData.items) {
        listEl.innerHTML = tierData.items.map(it => 
          `<li class="${it.on ? 'on' : 'off'}">${it.t}</li>`
        ).join('');
      }
    });
  }

  ptabs.forEach(tab => {
    tab.addEventListener('click', () => {
      playHaptic('tap');
      ptabs.forEach(t => { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');
      const cat = tab.getAttribute('data-plan-cat') || 'landing';
      updatePricingPlans(cat);
    });
  });
  // первичный рендер из данных: так статичная разметка и словарь EN не расходятся
  updatePricingPlans('landing');

  /* ---------- отзывы о команде ---------- */
  const scroller = document.querySelector('.reviews__scroller');
  const revPrev = document.querySelector('.js-rev-prev');
  const revNext = document.querySelector('.js-rev-next');

  if (scroller && (revPrev || revNext)) {
    const getScrollStep = () => {
      const card = scroller.querySelector('.rev');
      return card ? card.offsetWidth + 20 : 390;
    };
    const updateArrows = () => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (revPrev) revPrev.disabled = scroller.scrollLeft <= 5;
      if (revNext) revNext.disabled = maxScroll <= 5 || scroller.scrollLeft >= maxScroll - 5;
    };
    revPrev?.addEventListener('click', () => {
      scroller.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
    revNext?.addEventListener('click', () => {
      scroller.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
    scroller.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    // Initial check
    setTimeout(updateArrows, 100);
  }

  /* ---------- FAQ: плавное раскрытие, открыт всегда один ----------
     <details> сам по себе схлопывается рывком, поэтому высоту тела
     анимируем руками. Разметка остаётся семантической: без JS блок
     работает как обычный <details>, просто без плавности.            */
  const accs = [...document.querySelectorAll('.acc')];
  const ACC_MS = 420;
  const ACC_EASE = 'cubic-bezier(.22,1,.36,1)';
  const slowMo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  accs.forEach(acc => {
    const sum = acc.querySelector('summary');
    const body = acc.querySelector('.acc__body');
    if (!sum || !body) return;
    acc._anim = null;

    const stop = () => { if (acc._anim) { acc._anim.cancel(); acc._anim = null; } };

    // нижний отступ гасим вместе с высотой, иначе в конце остаётся «ступенька»
    const padOpen = () => getComputedStyle(body).paddingBottom;

    const expand = () => {
      stop();
      const pad = acc.open ? padOpen() : null;
      acc.open = true;
      acc.classList.add('is-anim');
      const pb = pad || padOpen();
      const h = body.scrollHeight;
      acc._anim = body.animate(
        [{ height: '0px', paddingBottom: '0px', opacity: 0 },
         { height: h + 'px', paddingBottom: pb, opacity: 1 }],
        { duration: ACC_MS, easing: ACC_EASE }
      );
      acc._anim.onfinish = () => { acc.classList.remove('is-anim'); acc._anim = null; };
    };

    const collapse = () => {
      stop();
      acc.classList.add('is-anim');
      const h = body.getBoundingClientRect().height || body.scrollHeight;
      const pb = padOpen();
      acc._anim = body.animate(
        [{ height: h + 'px', paddingBottom: pb, opacity: 1 },
         { height: '0px', paddingBottom: '0px', opacity: 0 }],
        { duration: ACC_MS - 80, easing: ACC_EASE }
      );
      acc._anim.onfinish = () => {
        acc.open = false;
        acc.classList.remove('is-anim');
        acc._anim = null;
      };
    };

    acc._collapse = collapse;

    sum.addEventListener('click', e => {
      e.preventDefault();
      if (slowMo) {                       // уважаем «уменьшить движение»
        const wasOpen = acc.open;
        accs.forEach(o => { if (o !== acc) o.open = false; });
        acc.open = !wasOpen;
        return;
      }
      if (acc.open && !acc.classList.contains('is-closing')) {
        collapse();
      } else {
        accs.forEach(o => { if (o !== acc && o.open) o._collapse(); });
        expand();
        if (typeof window.triggerFaqGuyReaction === 'function') {
          window.triggerFaqGuyReaction();
        }
      }
    });
  });

  /* ==========================================================================
     ИНТЕРАКТИВНЫЙ ПЕРСОНАЖ FAQ (ПЛАВНЫЕ РЕАКЦИИ)
     ========================================================================== */
  function initFaqGuy() {
    const head = document.getElementById('faqGuyHead');
    const arm = document.getElementById('faqGuyArm');

    if (!head || !arm) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Реакция на клик по FAQ — плавное почесывание затылка и задумчивый кивок
    let reactionTimer = null;
    window.triggerFaqGuyReaction = function() {
      clearTimeout(reactionTimer);
      
      arm.classList.remove('is-reacting');
      head.classList.remove('is-nodding');
      void arm.offsetWidth; // перезапуск CSS-анимации

      arm.classList.add('is-reacting');
      head.classList.add('is-nodding');

      reactionTimer = setTimeout(() => {
        arm.classList.remove('is-reacting');
        head.classList.remove('is-nodding');
      }, 1350);
    };
  }

  initFaqGuy();

  /* ---------- «Показать всё» в блоке о команде ---------- */
  const more = document.getElementById('teamMore');
  const teamText = document.getElementById('teamText');
  if (more && teamText) {
    more.addEventListener('click', () => {
      const clamped = teamText.classList.toggle('is-clamped');
      more.textContent = clamped ? T('team.show-all', 'Показать всё') : T('team.collapse', 'Свернуть');
      more.setAttribute('aria-expanded', String(!clamped));
    });
  }

  /* ---------- формы ---------- */
  document.querySelectorAll('form.form').forEach(f => attachSubmit(f, f.dataset.form || 'Заявка'));

  /* ==========================================================================
     3D ИНТЕРАКТИВНЫЙ ГЛОБУС THREE.JS
     ========================================================================== */
  const globeCanvas = document.getElementById('globeCanvas');
  const globeViewport = document.getElementById('globeViewport');
  const globeTooltip = document.getElementById('globeTooltip');
  const gtipFlag = document.getElementById('gtipFlag');
  const gtipCountry = document.getElementById('gtipCountry');
  const gtipCity = document.getElementById('gtipCity');
  const gtipBadge = document.getElementById('gtipBadge');
  const gtipText = document.getElementById('gtipText');

  if (globeCanvas && globeViewport && typeof THREE !== 'undefined') {
    // Каталог активных точек глобальной сети KV-web
    // Каталог активных городов глобальной сети KV-web (реальные координаты, комфортное распределение)
    const HUBS = TD('hubs', {
      // --- Главный офис (HQ) ---
      minsk: {
        id: 'minsk',
        name: 'Минск',
        country: 'Беларусь',
        flag: '🇧🇾',
        badge: 'Штаб-квартира',
        tag: '⭐ Главный технологический офис',
        desc: 'Главный технологический центр KV-web. Разработка высоконагруженных веб-сервисов, B2B платформ и SEO-стратегий.',
        caseStudy: '50+ запущенных проектов: интернет-магазины, личные кабинеты, корпоративные порталы с выводом в топ-3.',
        lat: 53.9045, lon: 27.5615,
        color: 0xFF6915, colorHex: '#FF6915',
        region: 'by',
        isHQ: true,
        isPrimary: true
      },

      // --- Западная, Северная и Южная Европа ---
      london: {
        id: 'london',
        name: 'Лондон',
        country: 'Великобритания',
        flag: '🇬🇧',
        badge: 'Fintech & SaaS',
        tag: '🚀 Western Europe',
        desc: 'Финтех-сервисы, SaaS платформы и защищенные клиентские кабинеты по европейским стандартам.',
        caseStudy: 'Личный кабинет финансовой платформы, интерактивный калькулятор доходности и Open Banking API.',
        lat: 51.5074, lon: -0.1278,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        isPrimary: true
      },
      paris: {
        id: 'paris',
        name: 'Париж',
        country: 'Франция',
        flag: '🇫🇷',
        badge: 'Luxury & Brands',
        tag: '🎨 France',
        desc: 'Имиджевые сайты, премиальные интерфейсы и промо-страницы для европейских брендов.',
        caseStudy: 'Имиджевый сайт архитектурного бюро с интерактивным 3D-каталогом проектов.',
        lat: 48.8566, lon: 2.3522,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'london'
      },
      berlin: {
        id: 'berlin',
        name: 'Берлин',
        country: 'Германия',
        flag: '🇩🇪',
        badge: 'Tech & Startups',
        tag: '💡 Germany',
        desc: 'Веб-приложения и промо-сайты для европейских технологических стартапов.',
        caseStudy: 'Презентационная платформа стартапа с интерактивным 3D-конфигуратором продукта.',
        lat: 52.5200, lon: 13.4050,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        isPrimary: true
      },
      warsaw: {
        id: 'warsaw',
        name: 'Варшава',
        country: 'Польша',
        flag: '🇵🇱',
        badge: 'Порталы & Каталоги',
        tag: '🇪🇺 Central Europe',
        desc: 'Европейские порталы, мультиязычные каталоги и интеграции с CRM.',
        caseStudy: 'Сервис аренды оборудования с автоматическим расчетом стоимости и полным соответствием GDPR.',
        lat: 52.2297, lon: 21.0122,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'berlin'
      },
      stockholm: {
        id: 'stockholm',
        name: 'Стокгольм',
        country: 'Швеция',
        flag: '🇸🇪',
        badge: 'Nordic Highload',
        tag: '❄️ Скандинавия',
        desc: 'Минималистичные высокопроизводительные веб-сервисы для рынка Северной Европы.',
        caseStudy: 'B2B-сервис аналитики с адаптивным интерфейсом под стандарты доступности WCAG.',
        lat: 59.3293, lon: 18.0686,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'berlin'
      },
      milan: {
        id: 'milan',
        name: 'Милан',
        country: 'Италия',
        flag: '🇮🇹',
        badge: 'Fashion & E-Com',
        tag: '🏛️ Южная Европа',
        desc: 'Премиальные интернет-магазины, fashion-каталоги и сервисы бронирования.',
        caseStudy: 'Эксклюзивный интернет-магазин дизайнерской мебели с мультивалютной корзиной.',
        lat: 45.4642, lon: 9.1900,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'paris'
      },
      barcelona: {
        id: 'barcelona',
        name: 'Барселона',
        country: 'Испания',
        flag: '🇪🇸',
        badge: 'Travel & Media',
        tag: '☀️ Пиренеи',
        desc: 'Порталы бронирования, медиа-проекты и мультиязычные платформы юга Европы.',
        caseStudy: 'Платформа бронирования премиальных яхт и апартаментов с онлайн-календарем занятости.',
        lat: 41.3851, lon: 2.1734,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'paris'
      },

      // --- Ближний Восток & Азия (MENA) ---
      dubai: {
        id: 'dubai',
        name: 'Дубай',
        country: 'ОАЭ',
        flag: '🇦🇪',
        badge: 'E-Commerce & Luxury',
        tag: '🌍 Ближний Восток',
        desc: 'Мультиязычные интернет-магазины, порталы элитной недвижимости и сервисы ОАЭ.',
        caseStudy: 'Премиум-магазин парфюмерии со шлюзами Stripe/Tap и каталог элитной недвижимости.',
        lat: 25.2048, lon: 55.2708,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        isPrimary: true
      },
      riyadh: {
        id: 'riyadh',
        name: 'Эр-Рияд',
        country: 'Саудовская Аравия',
        flag: '🇸🇦',
        badge: 'B2B Порталы & RTL',
        tag: '🇸🇦 Саудовская Аравия',
        desc: 'Локализация под арабский рынок (RTL) и интеграция с национальными шлюзами Mada / STC Pay.',
        caseStudy: 'Корпоративный сайт производственного холдинга с полной поддержкой арабского языка.',
        lat: 24.7136, lon: 46.6753,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },
      istanbul: {
        id: 'istanbul',
        name: 'Стамбул',
        country: 'Турция',
        flag: '🇹🇷',
        badge: 'Trade & Logistics',
        tag: '🌉 Трансконтинентальный хаб',
        desc: 'Торговые площадки, оптовые B2B-каталоги и логистические сервисы между Европой и Азией.',
        caseStudy: 'Мультиязычный B2B-каталог фабрики с автоматической выгрузкой коммерческих предложений.',
        lat: 41.0082, lon: 28.9784,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },
      doha: {
        id: 'doha',
        name: 'Доха',
        country: 'Катар',
        flag: '🇶🇦',
        badge: 'Invest & Events',
        tag: '🇶🇦 Катар',
        desc: 'Сайты инвестиционных фондов и презентационные посадочные страницы мероприятий.',
        caseStudy: 'Лендинг международного инвестиционного саммита с онлайн-регистрацией.',
        lat: 25.2854, lon: 51.5310,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },
      singapore: {
        id: 'singapore',
        name: 'Сингапур',
        country: 'Сингапур',
        flag: '🇸🇬',
        badge: 'Fintech & Cloud',
        tag: '🌏 Азиатский хаб',
        desc: 'Азиатский технологический хаб: облачные платформы и финансовые сервисы.',
        caseStudy: 'Веб-платформа финтех-сервиса с мультиязычной документацией и API интеграцией.',
        lat: 1.3521, lon: 103.8198,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },

      // --- СНГ, Кавказ & Центральная Азия ---
      astana: {
        id: 'astana',
        name: 'Астана',
        country: 'Казахстан',
        flag: '🇰🇿',
        badge: 'Корп. порталы & 1С',
        tag: '🤝 Центральная Азия',
        desc: 'Корпоративные сайты холдингов, оптовые каталоги и автоматизация продаж.',
        caseStudy: 'B2B портал холдинга на 15 000 товаров с интеграцией 1С и личным кабинетом дилера.',
        lat: 51.1694, lon: 71.4491,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        isPrimary: true
      },
      almaty: {
        id: 'almaty',
        name: 'Алматы',
        country: 'Казахстан',
        flag: '🇰🇿',
        badge: 'E-commerce & Kaspi',
        tag: '🤝 Казахстан',
        desc: 'Интернет-магазины с интеграцией Kaspi Pay и локальной логистикой.',
        caseStudy: 'Онлайн-магазин товаров для дома с синхронизацией Kaspi Магазина.',
        lat: 43.2389, lon: 76.8897,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      tashkent: {
        id: 'tashkent',
        name: 'Ташкент',
        country: 'Узбекистан',
        flag: '🇺🇿',
        badge: 'B2B Каталоги & Payme',
        tag: '🤝 Узбекистан',
        desc: 'Сайты производителей, интеграция платежных систем Payme / Click.',
        caseStudy: 'Официальный каталог продукции строительного комбината с онлайн-калькулятором.',
        lat: 41.2995, lon: 69.2401,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      tbilisi: {
        id: 'tbilisi',
        name: 'Тбилиси',
        country: 'Грузия',
        flag: '🇬🇪',
        badge: 'IT Services & Expat',
        tag: '🇬🇪 Кавказ',
        desc: 'Сайты для международных IT-компаний, релокационных сервисов и туризма.',
        caseStudy: 'Мультиязычный портал сервиса аренды авто с моментальным подтверждением брони.',
        lat: 41.7151, lon: 44.8271,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      baku: {
        id: 'baku',
        name: 'Баку',
        country: 'Азербайджан',
        flag: '🇦🇿',
        badge: 'Logistics & Energy',
        tag: '🇦🇿 Каспийский регион',
        desc: 'Корпоративные порталы логистических и промышленных предприятий региона.',
        caseStudy: 'Портал логистического оператора с личным кабинетом клиента и трекингом грузов.',
        lat: 40.4093, lon: 49.8671,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      moscow: {
        id: 'moscow',
        name: 'Москва',
        country: 'Россия',
        flag: '🇷🇺',
        badge: 'E-commerce & Highload',
        tag: '🤝 B2B Сеть',
        desc: 'Высоконагруженные порталы, интеграции 1С и сквозная аналитика.',
        caseStudy: 'Оптовый B2B портал с кабинетом партнера и интеграцией Битрикс24.',
        lat: 55.7558, lon: 37.6173,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'minsk'
      },

      // --- Северная Америка (США & Канада) ---
      newyork: {
        id: 'newyork',
        name: 'Нью-Йорк',
        country: 'США',
        flag: '🇺🇸',
        badge: 'B2B Платформы',
        tag: '⚡ East Coast',
        desc: 'Высоконагруженные лендинги и маркетинговые воронки для клиентов на рынке США.',
        caseStudy: 'Высоконагруженный B2B маркетплейс оптовых поставок с оптимизацией под Google Ads США.',
        lat: 40.7128, lon: -74.0060,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        isPrimary: true
      },
      sanfrancisco: {
        id: 'sanfrancisco',
        name: 'Сан-Франциско',
        country: 'США',
        flag: '🇺🇸',
        badge: 'Silicon Valley & AI',
        tag: '⚡ Silicon Valley',
        desc: 'Промо-сайты и веб-приложения для AI-стартапов и технологических платформ Калифорнии.',
        caseStudy: 'Презентационный сайт генеративного AI-сервиса с интерактивной демо-песочницей в браузере.',
        lat: 37.7749, lon: -122.4194,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        isPrimary: true
      },
      chicago: {
        id: 'chicago',
        name: 'Чикаго',
        country: 'США',
        flag: '🇺🇸',
        badge: 'Logistics & Trade',
        tag: '⚡ Midwest',
        desc: 'Корпоративные порталы логистических и производственных компаний.',
        caseStudy: 'Кабинет отслеживания грузов и расчет стоимости логистики в реальном времени.',
        lat: 41.8781, lon: -87.6298,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        parentHub: 'newyork'
      },
      miami: {
        id: 'miami',
        name: 'Майами',
        country: 'США',
        flag: '🇺🇸',
        badge: 'Luxury Real Estate',
        tag: '⚡ Florida',
        desc: 'Лендинги премиальной недвижимости, яхтенных чартеров и инвестиций во Флориде.',
        caseStudy: 'Презентационный лендинг жилого комплекса в Майами-Бич с интерактивными 3D-планировками.',
        lat: 25.7617, lon: -80.1918,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        parentHub: 'newyork'
      },
      toronto: {
        id: 'toronto',
        name: 'Торонто',
        country: 'Канада',
        flag: '🇨🇦',
        badge: 'Enterprise & FinTech',
        tag: '🇨🇦 Canada',
        desc: 'Корпоративные сайты и B2B порталы для канадского финансового и ритейл секторов.',
        caseStudy: 'Корпоративный сайт страховой группы с онлайн-калькулятором полисов.',
        lat: 43.6532, lon: -79.3832,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        parentHub: 'newyork'
      }
    });
    // регионы, скрытые для текущего языка (i18n/en.js → __config.hideHubRegions)
    (T.config.hideHubRegions || []).forEach(r => {
      Object.keys(HUBS).forEach(k => { if (HUBS[k].region === r) delete HUBS[k]; });
    });

    // Конвертер географических координат в координаты сферы Three.js
    const GLOBE_RADIUS = 2.0;
    const latLonToVec3 = (lat, lon, radius = GLOBE_RADIUS) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.cos(theta) * Math.sin(phi));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(theta) * Math.sin(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Сцена, камера, рендерер
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, globeViewport.clientWidth / globeViewport.clientHeight, 0.1, 100);
    camera.position.z = 5.3;

    let targetZoomZ = 5.3;

    const renderer = new THREE.WebGLRenderer({
      canvas: globeCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(globeViewport.clientWidth, globeViewport.clientHeight);

    // Группа вращения глобуса
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Освещение: мягкий студийный свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xe8f0ff, 1.15);
    sunLight.position.set(5, 4, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x396ceb, 0.85);
    rimLight.position.set(-6, -2, -5);
    scene.add(rimLight);

    // Текстура глобуса (натуральная фотореалистичная гео-карта Земли высокой четкости)
    const textureLoader = new THREE.TextureLoader();
    const texturePath = 'img/globe-texture.png?v=true_earth_v10';
    const globeTexture = textureLoader.load(texturePath, (t) => {
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      if (renderer) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      globeMesh.material.needsUpdate = true;
    });

    // Сфера планеты
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.52,
      metalness: 0.08,
      emissive: 0x030a1c,
      emissiveIntensity: 0.18
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Атмосферный ореол
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.035, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x396ceb,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(haloMesh);

    // Тонкая сферическая координатная 3D-сетка (параллели и меридианы)
    const gridGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.002, 36, 18);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x396ceb,
      wireframe: true,
      transparent: true,
      opacity: 0.045
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // Коллекции интерактивных 3D объектов
    const hubObjects = {};
    const interactiveHitMeshes = [];
    const beaconRings = [];
    const arcObjects = [];
    const pulseParticles = [];

    // Высота физической булавки над поверхностью глобуса
    const PIN_HEIGHT = 0.052;

    // 1. Создание физических булавок (канцелярские гвоздики с металлическим стержнем и эмалевой шапочкой)
    Object.keys(HUBS).forEach(key => {
      const hub = HUBS[key];
      const basePos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS * 1.001);
      const normal = basePos.clone().normalize();

      // Точка крепления нити (шейка булавки) и вершина (шапочка)
      const headPos = basePos.clone().add(normal.clone().multiplyScalar(PIN_HEIGHT));
      const neckPos = basePos.clone().add(normal.clone().multiplyScalar(PIN_HEIGHT * 0.72));

      // Металлический стержень булавки (серебристая стальная игла)
      const needleGeo = new THREE.CylinderGeometry(0.0035, 0.0022, PIN_HEIGHT, 8);
      const needleMat = new THREE.MeshStandardMaterial({
        color: 0xC4CBD5,
        metalness: 0.88,
        roughness: 0.22
      });
      const needleMesh = new THREE.Mesh(needleGeo, needleMat);
      needleMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(PIN_HEIGHT * 0.5)));
      needleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      globeGroup.add(needleMesh);

      // Шапочка булавки (глянцевая эмалевая головка: оранжевая для Минска HQ, изумрудная для городов)
      const headRadius = hub.isHQ ? 0.038 : (hub.isPrimary ? 0.027 : 0.022);
      const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: hub.isHQ ? 0xFF6915 : 0x22C55E,
        metalness: 0.15,
        roughness: 0.30
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.copy(headPos);
      globeGroup.add(headMesh);

      // Маленький мягкий световой ореол вокруг шапочки
      const haloGeo = new THREE.SphereGeometry(headRadius * 1.4, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: hub.isHQ ? 0xFF6915 : 0x22C55E,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(headPos);
      globeGroup.add(haloMesh);

      // Тёмная металлическая шайба в основании у поверхности Земли
      const washerGeo = new THREE.RingGeometry(0.010, headRadius * 1.05, 20);
      const washerMat = new THREE.MeshBasicMaterial({
        color: 0x03081A,
        side: THREE.DoubleSide
      });
      const washerMesh = new THREE.Mesh(washerGeo, washerMat);
      washerMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.002)));
      washerMesh.lookAt(basePos.clone().add(normal.clone().multiplyScalar(2)));
      globeGroup.add(washerMesh);

      // Тонкая тактильная волна-пульс на поверхности Земли вокруг булавки (.wpin__ripple)
      const ringGeo = new THREE.RingGeometry(headRadius * 0.95, headRadius * 1.30, 32);
      const rings = [];
      for (let i = 0; i < 2; i++) {
        const ringMat = new THREE.MeshBasicMaterial({
          color: hub.isHQ ? 0xFF6915 : 0x38E585,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.004)));
        ringMesh.lookAt(basePos.clone().add(normal.clone().multiplyScalar(2)));
        globeGroup.add(ringMesh);
        rings.push(ringMesh);
      }

      beaconRings.push({
        rings,
        headMesh,
        haloMesh,
        duration: hub.isHQ ? 2.2 : 3.0,
        offset: Math.random() * 3.0,
        isHQ: hub.isHQ
      });

      // Невидимый увеличенный хитбокс для комфортного клика по булавке
      const hitGeo = new THREE.SphereGeometry(0.085, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(headPos);
      hitMesh.userData = { hubKey: key, hubData: hub, basePos, normal, headPos };
      globeGroup.add(hitMesh);
      interactiveHitMeshes.push(hitMesh);

      hubObjects[key] = {
        data: hub,
        basePos,
        normal,
        headPos,
        neckPos,
        needleMesh,
        coreMesh: headMesh,
        headMesh,
        haloMesh,
        rings
      };
    });

    // Функция построения точной геодезической дуги (Great Circle SLERP) строго между головками булавок
    // 2. Создание градиентных световых вуалей (Style 6: Curtain Arc / Aurora Ribbon)
    // Построение вертикальной шторки от поверхности Земли до высшей точки геодезической траектории
    const createCurtainGeometry = (p1, p2, baseP1, baseP2, numPoints = 32, maxLift = 0.14) => {
      const u = p1.clone().normalize();
      const v = p2.clone().normalize();
      const r1 = p1.length();
      const r2 = p2.length();
      const rBase1 = baseP1.length();
      const rBase2 = baseP2.length();

      const dot = Math.max(-1.0, Math.min(1.0, u.dot(v)));
      const theta = Math.acos(dot);
      const sinTheta = Math.sin(theta);

      // Высота подъема дуги в зените (зависит от расстояния)
      const lift = Math.min(maxLift, Math.max(0.045, theta * 0.095));

      const topPoints = [];
      const vertices = [];
      const uvs = [];
      const indices = [];

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        let w;
        if (sinTheta < 0.0001) {
          w = u.clone().lerp(v, t).normalize();
        } else {
          const c1 = Math.sin((1 - t) * theta) / sinTheta;
          const c2 = Math.sin(t * theta) / sinTheta;
          w = u.clone().multiplyScalar(c1).add(v.clone().multiplyScalar(c2)).normalize();
        }

        const topR = (r1 * (1 - t) + r2 * t) + lift * Math.sin(Math.PI * t);
        const botR = (rBase1 * (1 - t) + rBase2 * t);

        const topPt = w.clone().multiplyScalar(topR);
        const botPt = w.clone().multiplyScalar(botR);
        topPoints.push(topPt);

        // vertex 2*i: основание у поверхности планеты
        vertices.push(botPt.x, botPt.y, botPt.z);
        uvs.push(t, 0.0);

        // vertex 2*i + 1: верхний гребень дуги
        vertices.push(topPt.x, topPt.y, topPt.z);
        uvs.push(t, 1.0);
      }

      for (let i = 0; i < numPoints; i++) {
        const b1 = 2 * i;
        const t1 = 2 * i + 1;
        const b2 = 2 * (i + 1);
        const t2 = 2 * (i + 1) + 1;

        indices.push(b1, t1, b2);
        indices.push(t1, t2, b2);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      return { geo, topPoints };
    };

    const curtainVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const curtainFragmentShader = `
      uniform vec3 uColorBottom;
      uniform vec3 uColorTop;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        // Деликатный градиент высоты: нижние 70% прозрачны, чтобы не заслонять материки и океаны,
        // а к верхнему гребню плавно формируется мягкая золотая световая аура
        float vFade = pow(vUv.y, 3.0);
        // Мягкое угасание у оснований булавок
        float edgeFade = sin(vUv.x * 3.14159265);
        // Медленное органическое дыхание световой волны
        float wave = 0.88 + 0.12 * sin(vUv.x * 10.0 - uTime * 2.2);

        float alpha = vFade * edgeFade * uOpacity * wave;

        // Переход от теплого янтаря к сияющему золоту
        vec3 col = mix(uColorBottom, uColorTop, pow(vUv.y, 1.8));
        gl_FragColor = vec4(col, alpha);
      }
    `;

    const minskHub = hubObjects['minsk'];
    const minskHead = minskHub.headPos;
    const minskBase = minskHub.basePos;

    Object.keys(HUBS).forEach(key => {
      if (key === 'minsk') return;
      const targetHub = hubObjects[key];
      const targetHead = targetHub.headPos;
      const targetBase = targetHub.basePos;

      const { geo: curtainGeo, topPoints } = createCurtainGeometry(minskHead, targetHead, minskBase, targetBase, 32, 0.14);

      const isTrunk = targetHub.data.isPrimary;
      const baseCurtainOpacity = isTrunk ? 0.40 : 0.22;
      const baseCrestOpacity = isTrunk ? 0.75 : 0.50;

      // 1. Полупрозрачная градиентная световая вуаль (Curtain)
      const curtainMat = new THREE.ShaderMaterial({
        vertexShader: curtainVertexShader,
        fragmentShader: curtainFragmentShader,
        uniforms: {
          uColorBottom: { value: new THREE.Color(0xFF8F00) }, // Глубокий тёплый янтарь
          uColorTop: { value: new THREE.Color(0xFFE082) },    // Сияющее светлое золото
          uOpacity: { value: baseCurtainOpacity },
          uTime: { value: 0 }
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
      globeGroup.add(curtainMesh);

      // 2. Тончайший сияющий гребень вдоль верхней кромки вуали (Crest Filament)
      const crestCurve = new THREE.CatmullRomCurve3(topPoints);
      const crestGeo = new THREE.TubeGeometry(crestCurve, 32, 0.0016, 5, false);
      const crestMat = new THREE.MeshBasicMaterial({
        color: 0xFFD56B,
        transparent: true,
        opacity: baseCrestOpacity,
        blending: THREE.AdditiveBlending
      });
      const crestMesh = new THREE.Mesh(crestGeo, crestMat);
      globeGroup.add(crestMesh);

      arcObjects.push({
        hubKey: key,
        curtainMesh,
        crestMesh,
        baseCurtainOpacity,
        baseCrestOpacity,
        isTrunk
      });
    });

    // UI Элементы управления и карточка
    const hudItems = [...document.querySelectorAll('.globe-hud__item')];
    const wtabs = [...document.querySelectorAll('.wtab')];
    const spinBtn = document.getElementById('globeSpinBtn');
    const zoomInBtn = document.getElementById('globeZoomIn');
    const zoomOutBtn = document.getElementById('globeZoomOut');
    const gcardCity = document.getElementById('gcardCity');
    const gcardFlag = document.getElementById('gcardFlag');
    const gcardTag = document.getElementById('gcardTag');
    const gcardDesc = document.getElementById('gcardDesc');

    // Текущее состояние вращения
    let autoSpin = true;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotX = (HUBS.minsk.lat * Math.PI / 180) * 0.65;
    let targetRotY = -(HUBS.minsk.lon * Math.PI / 180) - Math.PI / 2;
    let activeHubKey = 'minsk';
    let hoveredHubKey = null;
    let isTransitioning = true;
    let lastUserActionTime = Date.now();

    globeGroup.rotation.x = targetRotX;
    globeGroup.rotation.y = targetRotY;

    // Подсветка активного города и натянутой к нему световой вуали (без изменения высоты/масштаба)
    const highlightActiveCityNetwork = (hubKey) => {
      if (hubKey && hubKey !== 'minsk') {
        arcObjects.forEach(arc => {
          if (arc.hubKey === hubKey) {
            // Выбранная траектория озаряется яркой золотой вуалью
            arc.curtainMesh.material.uniforms.uOpacity.value = 0.95;
            arc.crestMesh.material.opacity = 1.0;
            arc.crestMesh.material.color.setHex(0xFFF2A8);
          } else {
            // Остальные траектории деликатно смягчаются
            arc.curtainMesh.material.uniforms.uOpacity.value = 0.10;
            arc.crestMesh.material.opacity = 0.16;
            arc.crestMesh.material.color.setHex(0xD4AF37);
          }
        });

        // Подсветка активной булавки
        Object.keys(hubObjects).forEach(k => {
          const h = hubObjects[k];
          if (k === hubKey) {
            h.headMesh.scale.set(1.25, 1.25, 1.25);
            h.haloMesh.material.opacity = 0.55;
          } else {
            h.headMesh.scale.set(1.0, 1.0, 1.0);
            h.haloMesh.material.opacity = 0.22;
          }
        });
      } else {
        // Режим по умолчанию (все световые вуали в мягком фоновом свечении)
        arcObjects.forEach(arc => {
          arc.curtainMesh.material.uniforms.uOpacity.value = arc.baseCurtainOpacity;
          arc.crestMesh.material.opacity = arc.baseCrestOpacity;
          arc.crestMesh.material.color.setHex(0xFFE082);
        });
        Object.keys(hubObjects).forEach(k => {
          const h = hubObjects[k];
          h.headMesh.scale.set(1.0, 1.0, 1.0);
          h.haloMesh.material.opacity = 0.22;
        });
      }
    };

    // Обновление карточки и активных пунктов
    const selectHub = (hubKey, smoothFly = true) => {
      const hub = HUBS[hubKey];
      if (!hub) return;
      activeHubKey = hubKey;

      if (gcardCity) gcardCity.textContent = hub.name;
      if (gcardFlag) gcardFlag.textContent = hub.flag;
      if (gcardTag) {
        gcardTag.textContent = hub.tag;
        gcardTag.style.color = hub.colorHex;
        gcardTag.style.borderColor = hub.colorHex + '66';
        gcardTag.style.background = hub.colorHex + '22';
      }
      if (gcardDesc) gcardDesc.textContent = hub.desc;

      hudItems.forEach(item => {
        item.classList.toggle('is-active', item.dataset.hub === hubKey);
      });

      wtabs.forEach(t => {
        const tr = t.dataset.region;
        const on = tr === hub.region || (tr === 'me' && hub.region === 'mena') || (tr === 'na' && hub.region === 'us');
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
      });

      highlightActiveCityNetwork(hubKey);

      // Плавный поворот глобуса к выбранной точке
      if (smoothFly) {
        targetRotX = (hub.lat * Math.PI / 180) * 0.65;
        targetRotY = -(hub.lon * Math.PI / 180) - Math.PI / 2;
        isTransitioning = true;
      }
    };

    // Привязка кликов по HUD
    hudItems.forEach(item => {
      item.addEventListener('click', () => {
        const hubKey = item.dataset.hub;
        selectHub(hubKey, true);
        lastUserActionTime = Date.now();
      });
    });

    // Привязка кликов по фильтрам регионов (.wtab)
    wtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const reg = tab.dataset.region;
        wtabs.forEach(t => {
          const on = t === tab;
          t.classList.toggle('is-on', on);
          t.setAttribute('aria-selected', String(on));
        });

        if (reg === 'all' || reg === 'by') {
          selectHub('minsk', true);
        } else if (reg === 'mena' || reg === 'me') {
          selectHub('dubai', true);
        } else if (reg === 'eu') {
          selectHub('london', true);
        } else if (reg === 'us' || reg === 'na') {
          selectHub('sanfrancisco', true);
        } else if (reg === 'cis') {
          selectHub('astana', true);
        }
        lastUserActionTime = Date.now();
      });
    });

    // Кнопки зума
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        targetZoomZ = Math.max(3.6, targetZoomZ - 0.7);
        lastUserActionTime = Date.now();
      });
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        targetZoomZ = Math.min(6.5, targetZoomZ + 0.7);
        lastUserActionTime = Date.now();
      });
    }

    // Кнопка авто-вращения
    if (spinBtn) {
      spinBtn.classList.add('is-active');
      spinBtn.addEventListener('click', () => {
        autoSpin = !autoSpin;
        spinBtn.classList.toggle('is-active', autoSpin);
        lastUserActionTime = Date.now();
      });
    }

    // Зум колесиком мыши
    globeViewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetZoomZ = Math.min(6.5, Math.max(3.6, targetZoomZ + e.deltaY * 0.0035));
      lastUserActionTime = Date.now();
    }, { passive: false });

    // Интерактивное перетаскивание (Mouse & Touch Drag)
    const onPointerDown = (clientX, clientY) => {
      isDragging = true;
      dragStartX = clientX;
      dragStartY = clientY;
      lastMouseX = clientX;
      lastMouseY = clientY;
      velX = 0;
      velY = 0;
      isTransitioning = false;
      lastUserActionTime = Date.now();
    };

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const checkHubHover = (clientX, clientY) => {
      const rect = globeCanvas.getBoundingClientRect();
      mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);

      const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
      if (hits.length > 0 && hits[0].object.userData.hubKey) {
        const hitKey = hits[0].object.userData.hubKey;
        if (hoveredHubKey !== hitKey) {
          hoveredHubKey = hitKey;
          const hub = HUBS[hitKey];

          // Заполняем попап
          if (gtipFlag) gtipFlag.textContent = hub.flag;
          if (gtipCountry) gtipCountry.textContent = hub.country;
          if (gtipCity) gtipCity.textContent = hub.name;
          if (gtipBadge) gtipBadge.textContent = hub.badge;
          if (gtipText) gtipText.textContent = hub.caseStudy;

          // Подсвечиваем активную связь
          highlightActiveCityNetwork(hitKey);
          globeCanvas.style.cursor = 'pointer';
        }
      } else {
        if (hoveredHubKey !== null) {
          hoveredHubKey = null;
          highlightActiveCityNetwork(activeHubKey);
          globeCanvas.style.cursor = isDragging ? 'grabbing' : 'grab';
          if (globeTooltip) globeTooltip.classList.remove('is-visible');
        }
      }
    };

    const onPointerMove = (clientX, clientY) => {
      if (isDragging) {
        const dx = clientX - lastMouseX;
        const dy = clientY - lastMouseY;
        lastMouseX = clientX;
        lastMouseY = clientY;

        velY = dx * 0.006;
        velX = dy * 0.006;

        globeGroup.rotation.y += velY;
        globeGroup.rotation.x = Math.max(-0.85, Math.min(0.85, globeGroup.rotation.x + velX));
        lastUserActionTime = Date.now();
        if (globeTooltip) globeTooltip.classList.remove('is-visible');
      } else {
        checkHubHover(clientX, clientY);
      }
    };

    const onPointerUp = (clientX, clientY) => {
      if (!isDragging) return;
      isDragging = false;

      // Если перемещение было меньше 6px — это клик по пину
      const dist = Math.hypot(clientX - dragStartX, clientY - dragStartY);
      if (dist < 6) {
        const rect = globeCanvas.getBoundingClientRect();
        mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseVec, camera);
        const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
        if (hits.length > 0 && hits[0].object.userData.hubKey) {
          selectHub(hits[0].object.userData.hubKey, true);
        }
      }
      lastUserActionTime = Date.now();
    };

    // Мышиные события
    globeCanvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => onPointerUp(e.clientX, e.clientY));
    globeViewport.addEventListener('mouseleave', () => {
      if (globeTooltip) globeTooltip.classList.remove('is-visible');
      hoveredHubKey = null;
      highlightActiveCityNetwork(activeHubKey);
    });

    // Тач события
    globeCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    });

    // Ресайз адаптив
    const handleResize = () => {
      const w = globeViewport.clientWidth;
      const h = globeViewport.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    // Оптимизация: рендерим только когда глобус виден на экране
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(globeViewport);

    // Главный цикл анимации
    let clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Плавный переход к выбранному хабу (Lerp)
      if (isTransitioning) {
        let diffY = (targetRotY - globeGroup.rotation.y) % (Math.PI * 2);
        if (diffY < -Math.PI) diffY += Math.PI * 2;
        if (diffY > Math.PI) diffY -= Math.PI * 2;

        globeGroup.rotation.y += diffY * 0.08;
        globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.08;

        if (Math.abs(diffY) < 0.002 && Math.abs(targetRotX - globeGroup.rotation.x) < 0.002) {
          isTransitioning = false;
        }
      } else if (!isDragging) {
        velX *= 0.92;
        velY *= 0.92;
        globeGroup.rotation.y += velY;
        globeGroup.rotation.x = Math.max(-0.85, Math.min(0.85, globeGroup.rotation.x + velX));

        // Фоновое автовращение (если пользователь не трогает и не наводит на хаб)
        if (autoSpin && !hoveredHubKey && (Date.now() - lastUserActionTime > 3500)) {
          globeGroup.rotation.y += 0.0025;
        }
      }

      // Плавный зум камеры
      camera.position.z += (targetZoomZ - camera.position.z) * 0.1;

      // Анимация расходящихся импульсов от точек (концентрические расширяющиеся волны)
      beaconRings.forEach((b) => {
        b.rings.forEach((ring, idx) => {
          // Вторая волна смещена по фазе на 50%
          const phase = (((elapsed + b.offset + idx * (b.duration * 0.5)) % b.duration) / b.duration);
          // Плавное кубическое расширение волны
          const easedPhase = Math.pow(phase, 0.70);
          const scale = 0.5 + easedPhase * 3.4; // Расходится заметно шире от точки
          ring.scale.set(scale, scale, scale);
          ring.material.opacity = Math.max(0, (1 - easedPhase) * 0.85);
        });

        // Мягкое свечение ореола микро-точки в такт рождению волн
        const pulse = Math.sin(elapsed * 2.8 + b.offset) * 0.12;
        b.haloMesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
      });

      // Анимация живого светового мерцания вуалей
      arcObjects.forEach(arc => {
        arc.curtainMesh.material.uniforms.uTime.value = elapsed;
      });



      // Позиционирование 3D попапа при наведении на микро-маяк
      if (hoveredHubKey && globeTooltip && hubObjects[hoveredHubKey]) {
        const hub = hubObjects[hoveredHubKey];
        const worldPos = hub.basePos.clone().applyMatrix4(globeGroup.matrixWorld);

        // Проверка: точка на видимой передней полусфере относительно камеры
        const normalWorld = hub.normal.clone().applyEuler(globeGroup.rotation);
        const toCamera = camera.position.clone().sub(worldPos).normalize();
        const dot = normalWorld.dot(toCamera);

        if (dot > 0.05) {
          const proj = worldPos.clone().project(camera);
          const sx = (proj.x * 0.5 + 0.5) * globeViewport.clientWidth;
          const sy = (-proj.y * 0.5 + 0.5) * globeViewport.clientHeight;

          globeTooltip.style.left = `${Math.round(sx)}px`;
          globeTooltip.style.top = `${Math.round(sy)}px`;
          globeTooltip.classList.add('is-visible');
        } else {
          globeTooltip.classList.remove('is-visible');
        }
      }

      renderer.render(scene, camera);
    };

    animate();
  }


  /* ==================== МОУШН ====================
     Правило: контент виден по умолчанию, анимация — надстройка.
     Элементы «взводятся» (.is-armed) только из JS, поэтому при отключённом
     или упавшем скрипте страница просто показывает всё как есть.
     Плюс подстраховка: через 3 с всё в пределах двух экранов открывается
     принудительно — на случай скрытой вкладки или headless-рендера,
     где IntersectionObserver может не сработать.                         */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch  = matchMedia('(hover: none)').matches;
  const small  = matchMedia('(max-width: 768px)').matches;

  const armed = [...document.querySelectorAll('.reveal, .stagger')];
  let sweep = null;
  const hero  = document.querySelector('[data-hero]');

  const open = el => { el.classList.add('is-in'); el.classList.remove('is-armed'); };

  if (reduce) {
    armed.forEach(open);
    hero?.classList.add('is-in');
  } else {
    // индексы стаггера и строк заголовка — в разметке им не место
    document.querySelectorAll('.stagger').forEach(box => {
      [...box.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 6)));
    });
    document.querySelectorAll('.hero__h1 .line > span').forEach((l, i) => l.style.setProperty('--l', i));
    document.querySelectorAll('[data-hero-el]').forEach((el, i) => el.style.setProperty('--l', i + 2));

    armed.forEach(el => el.classList.add('is-armed'));

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { open(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '240px 0px -4% 0px', threshold: 0.01 });   // стартуем заранее:
                                                                // при быстром скролле блок
                                                                // приезжает уже проявленным
    armed.forEach(el => io.observe(el));

    setTimeout(() => hero?.classList.add('is-in'), 60);

    // Подстраховка на весь документ, а не только на первые экраны: если блок
    // уже на виду, а наблюдатель по какой-то причине молчит (скрытая вкладка,
    // headless-рендер), открываем его принудительно. Дешёво — элементов ~30.
    sweep = () => {
      for (let i = armed.length - 1; i >= 0; i--) {
        const el = armed[i];
        if (!el.classList.contains('is-armed')) { armed.splice(i, 1); continue; }
        // строго то, что уже на экране: элементы ниже сгиба оставляем
        // наблюдателю, иначе они откроются заранее и анимации не будет видно
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) open(el);
      }
    };
    setTimeout(sweep, 2500);
  }

  /* ---------- цена доезжает до значения: взгляд остаётся на цифре ---------- */
  if (!reduce) {
    const nums = [...document.querySelectorAll('[data-count]')];
    const fmt = n => n.toLocaleString(T.locale).replace(/ /g, ' ');
    const nio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        nio.unobserve(e.target);
        const el = e.target;
        const to = parseInt(el.dataset.count, 10);
        if (!to) return;
        const t0 = performance.now(), dur = 900;
        const tick = now => {
          const k = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 4);           // ease-out-quart
          el.textContent = T('pricing.price-fmt', 'от {n} BYN', { n: fmt(Math.round(to * eased)) });
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    nums.forEach(n => nio.observe(n));
  }

  /* ---------- индикатор прочитанного ---------- */
  const bar = document.querySelector('.progress__bar');

  /* ---------- панель действий на телефоне ----------
     Прячем её, когда квиз или нижняя форма и так на экране: дублировать
     призыв поверх той же кнопки — только мешать.                        */
  const abar = document.querySelector('.actionbar');
  let formsVisible = 0;
  if (abar) {
    abar.hidden = false;
    const fio = new IntersectionObserver(entries => {
      entries.forEach(e => { formsVisible += e.isIntersecting ? 1 : -1; });
      formsVisible = Math.max(0, formsVisible);
    }, { threshold: 0.15 });
    ['#quiz', '.cta', '.offer'].forEach(sel => {
      const n = document.querySelector(sel);
      if (n) fio.observe(n);
    });
  }

  /* ---------- один обработчик скролла на всё ----------
     Планируем кадр заново на каждое событие и отменяем предыдущий: так
     применяется всегда последнее состояние, а не то, что успело устареть,
     пока браузер придерживал rAF.                                        */
  let rafId = 0;
  const onScroll = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;

      if (bar && !reduce) bar.style.width = (max > 0 ? (y / max) * 100 : 0).toFixed(2) + '%';

      if (abar) abar.classList.toggle('is-up', y > 700 && formsVisible === 0);

      if (sweep && armed.length) sweep();

    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- параллакс декора: только мышь и большой экран ----------
     На тач-скролле пересчёт transform на каждый кадр даёт рывки,
     поэтому там он не включается вовсе.                                 */
  if (!reduce && !touch && !small) {
    const drifters = [...document.querySelectorAll('.star, .case__shot')];
    drifters.forEach(el => { el.dataset.rot = getComputedStyle(el).transform; });
    let raf = 0;
    const drift = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = innerHeight;
        drifters.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const p = (r.top + r.height / 2 - vh / 2) / vh;
          const dir = i % 2 ? -1 : 1;
          const base = el.classList.contains('case__shot') ? 16 : 28;
          const keep = el.dataset.rot === 'none' ? '' : el.dataset.rot;
          el.style.transform = `${keep} translate3d(0, ${(p * base * dir).toFixed(1)}px, 0)`;
        });
      });
    };
    addEventListener('scroll', drift, { passive: true });
    drift();
  }

  /* ================== отправка форм ================== */
  function attachSubmit(form, title) {
    const msg = form.querySelector('.formmsg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // проверка обязательных полей
      let bad = null;
      form.querySelectorAll('[required]').forEach(inp => {
        const val = inp.value.trim();
        const okPhone = inp.type !== 'tel' || val.replace(/\D/g, '').length >= 9;
        const ok = val !== '' && okPhone;
        inp.classList.toggle('is-bad', !ok);
        if (!ok && !bad) bad = inp;
      });
      if (bad) {
        say(msg, T('form.required', 'Заполните телефон и имя — иначе мы не сможем с вами связаться.'), 'is-bad');
        bad.focus();
        return;
      }

      const data = collect(form);
      data['Форма'] = title;
      data['Страница'] = location.href;

      const btn = form.querySelector('button[type="submit"]');
      const label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = T('form.sending', 'Отправляем…'); }

      try {
        const result = await deliver(data);
        form.reset();
        form.querySelectorAll('.is-bad').forEach(el => el.classList.remove('is-bad'));
        if (result.quiet) {
          say(msg, T('form.success', 'Спасибо! Заявка принята — свяжемся с вами в ближайшее время.'), 'is-ok');
        } else {
          showSent(msg, result);
        }
      } catch (err) {
        console.error(err);
        showFail(msg);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      }
    });
  }

  function collect(form) {
    const out = {};
    new FormData(form).forEach((v, k) => {
      const val = String(v).trim();
      if (!val) return;
      out[k] = out[k] ? out[k] + ', ' + val : val;
    });
    return out;
  }

  function say(node, text, cls) {
    if (!node) return;
    node.textContent = text;
    node.className = 'formmsg ' + cls;
  }

  function channelLink(href, text) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text;
    return a;
  }

  function showSent(node, result) {
    if (!node) return;
    const wa = CONTACT.whatsapp + '?text=' + encodeURIComponent(T('form.wa-text', 'Здравствуйте, пишу с сайта KV-web'));
    node.className = 'formmsg is-ok';
    node.replaceChildren();
    const lead = result.via === 'worker'
      ? T('form.sent-worker', 'Заявка принята. Можно сразу написать нам: ')
      : T('form.sent-email', 'Заявка ушла на почту. Если удобнее — напишите сразу: ');
    node.append(
      document.createTextNode(lead),
      channelLink(CONTACT.telegram, 'Telegram'),
      document.createTextNode(' · '),
      channelLink(wa, 'WhatsApp')
    );
  }

  function showFail(node) {
    if (!node) return;
    node.className = 'formmsg is-bad';
    node.replaceChildren();
    node.append(
      document.createTextNode(T('form.fail-prefix', 'Не получилось отправить. Позвоните {phone} или напишите в ', { phone: CONTACT.phoneDisplay })),
      channelLink(CONTACT.telegram, 'Telegram'),
      document.createTextNode(' / '),
      channelLink(CONTACT.whatsapp, 'WhatsApp'),
      document.createTextNode('.')
    );
  }

  async function deliver(data) {
    if (String(data.company || '').trim()) return { quiet: true };
    const payload = { ...data };
    delete payload.company;

    if (FORM_CONFIG.ENDPOINT) {
      const res = await fetch(FORM_CONFIG.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const body = await res.json().catch(() => ({}));
      if (body.ok === false) throw new Error('lead rejected');
      return { via: 'worker', ...body };
    }

    const res = await fetch('https://formsubmit.co/ajax/krutko.marketing@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: FORM_CONFIG.SITE + ': ' + (payload['Форма'] || 'Заявка'),
        _template: 'table',
        _captcha: 'false',
        ...payload
      })
    });
    const body = await res.json().catch(() => ({}));
    const accepted = body.success === true || body.success === 'true';
    if (!res.ok || !accepted) throw new Error(body.message || 'email ' + res.status);
    return { via: 'email' };
  }

  /* =========================================================
     ИНТЕРАКТИВНЫЕ ИНЖЕНЕРНЫЕ ВИДЖЕТЫ В БЛОКЕ «О НАС»
     ========================================================= */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  // Синтез ультра-легких тактильных щелчков через Web Audio API (без внешних файлов)
  let audioCtx = null;
  function playHaptic(type = 'click') {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!audioCtx) audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.016);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);
        osc.start(now);
        osc.stop(now + 0.018);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1040, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (err) {
      // AudioContext unavailable or restricted
    }
  }

  function initFounderWidgets() {
    // 1. ВИДЖЕТ FRONTEND & СКОРОСТЬ
    const widgetFrontend = document.getElementById('widget-card-frontend');
    if (widgetFrontend) {
      const presets = widgetFrontend.querySelectorAll('.js-perf-preset');
      const circle = widgetFrontend.querySelector('.js-perf-circle');
      const scoreEl = widgetFrontend.querySelector('.js-perf-score');
      const timeEl = widgetFrontend.querySelector('.js-perf-time');
      const fpsEl = widgetFrontend.querySelector('.js-perf-fps');
      const codeLines = widgetFrontend.querySelector('.js-perf-code');
      const engineEl = widgetFrontend.querySelector('.js-code-engine');
      const weightEl = widgetFrontend.querySelector('.js-code-weight');
      const speedEl = widgetFrontend.querySelector('.js-code-speed');
      const vitalsEl = widgetFrontend.querySelector('.js-perf-vitals');
      const tag2El = widgetFrontend.querySelector('.js-perf-tag2');
      const rerunBtn = widgetFrontend.querySelector('.js-perf-rerun');
      const tuneWeightBtn = widgetFrontend.querySelector('.js-tune-weight');

      const presetData = TD('presets', {
        vanilla: {
          score: 100,
          time: 'Отклик 0.28 сек',
          fps: '60 FPS',
          engine: "'Vanilla + Vite'",
          weight: "'12.4 kB'",
          speed: "'60 FPS'",
          vitals: 'Core Web Vitals: PASS',
          tag2: '0 лишних скриптов',
          isBad: false
        },
        builder: {
          score: 38,
          time: 'Отклик 3.90 сек',
          fps: '24 FPS',
          engine: "'Конструктор / Bloated CMS'",
          weight: "'842 kB'",
          speed: "'24 FPS'",
          vitals: 'Core Web Vitals: FAILED',
          tag2: '62 лишних скрипта',
          isBad: true
        },
        catalog: {
          score: 98,
          time: 'Отклик 0.42 сек',
          fps: '60 FPS',
          engine: "'Next.js + FastSSR'",
          weight: "'48.6 kB'",
          speed: "'60 FPS'",
          vitals: 'Core Web Vitals: PASS',
          tag2: 'Edge Caching: HIT',
          isBad: false
        }
      });

      // Интерактивный тюнер веса бандла
      const weightSteps = TD('weightSteps', [
        { weight: "'12.4 kB'", score: 100, time: 'Отклик 0.28 сек', tag2: '0 лишних скриптов', isBad: false },
        { weight: "'48.2 kB'", score: 98, time: 'Отклик 0.39 сек', tag2: 'Tree-shaking: 100%', isBad: false },
        { weight: "'184 kB'", score: 91, time: 'Отклик 0.85 сек', tag2: 'Оптимизированный бандл', isBad: false },
        { weight: "'842 kB'", score: 38, time: 'Отклик 3.90 сек', tag2: '62 лишних скрипта', isBad: true }
      ]);
      let weightIdx = 0;

      let currentScore = 100;
      let animId = null;

      function animateScore(targetScore, isBad) {
        if (animId) cancelAnimationFrame(animId);
        const startScore = currentScore;
        const startTime = performance.now();
        const duration = 400;

        function step(now) {
          const progress = Math.min(1, (now - startTime) / duration);
          const ease = 1 - Math.pow(1 - progress, 3);
          const val = Math.round(startScore + (targetScore - startScore) * ease);
          if (scoreEl) scoreEl.textContent = val;
          if (circle) circle.setAttribute('stroke-dasharray', `${val}, 100`);

          if (progress < 1) {
            animId = requestAnimationFrame(step);
          } else {
            currentScore = targetScore;
            if (scoreEl) scoreEl.textContent = targetScore;
            if (circle) circle.setAttribute('stroke-dasharray', `${targetScore}, 100`);
          }
        }
        animId = requestAnimationFrame(step);

        if (isBad) {
          circle?.classList.add('circle--bad');
          scoreEl?.classList.add('percentage--bad');
          timeEl?.classList.add('widget-score-val--bad');
          vitalsEl?.classList.remove('wtag--lime');
          vitalsEl?.classList.add('wtag--bad');
          fpsEl?.classList.remove('widget-pill--lime');
        } else {
          circle?.classList.remove('circle--bad');
          scoreEl?.classList.remove('percentage--bad');
          timeEl?.classList.remove('widget-score-val--bad');
          vitalsEl?.classList.remove('wtag--bad');
          vitalsEl?.classList.add('wtag--lime');
          fpsEl?.classList.add('widget-pill--lime');
        }
      }

      function applyPreset(key) {
        const d = presetData[key];
        if (!d) return;

        if (key === 'vanilla') weightIdx = 0;
        else if (key === 'catalog') weightIdx = 1;
        else if (key === 'builder') weightIdx = 3;

        presets.forEach(p => {
          const active = p.dataset.preset === key;
          p.classList.toggle('is-active', active);
          if (active && key === 'builder') p.classList.add('is-builder');
          else p.classList.remove('is-builder');
        });

        animateScore(d.score, d.isBad);
        if (timeEl) timeEl.textContent = d.time;
        if (fpsEl) fpsEl.textContent = d.fps;
        if (engineEl) engineEl.textContent = d.engine;
        if (weightEl) weightEl.textContent = d.weight;
        if (speedEl) speedEl.textContent = d.speed;
        if (vitalsEl) vitalsEl.textContent = d.vitals;
        if (tag2El) tag2El.textContent = d.tag2;

        if (codeLines) {
          codeLines.classList.add('is-flash');
          setTimeout(() => codeLines.classList.remove('is-flash'), 300);
        }
      }

      presets.forEach(btn => {
        btn.addEventListener('click', () => {
          playHaptic('click');
          applyPreset(btn.dataset.preset);
        });
      });

      rerunBtn?.addEventListener('click', () => {
        playHaptic('beep');
        const activePreset = widgetFrontend.querySelector('.js-perf-preset.is-active')?.dataset.preset || 'vanilla';
        const d = presetData[activePreset];
        currentScore = 0;
        if (scoreEl) scoreEl.textContent = '0';
        if (circle) circle.setAttribute('stroke-dasharray', '0, 100');
        setTimeout(() => animateScore(d.score, d.isBad), 80);
      });

      tuneWeightBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playHaptic('click');
        weightIdx = (weightIdx + 1) % weightSteps.length;
        const current = weightSteps[weightIdx];
        if (weightEl) weightEl.textContent = current.weight;
        if (timeEl) timeEl.textContent = current.time;
        if (tag2El) tag2El.textContent = current.tag2;
        animateScore(current.score, current.isBad);
        if (codeLines) {
          codeLines.classList.add('is-flash');
          setTimeout(() => codeLines.classList.remove('is-flash'), 250);
        }
      });
    }

    // 2. ВИДЖЕТ BACKEND & ТЕРМИНАЛ
    const widgetBackend = document.getElementById('widget-card-backend');
    if (widgetBackend) {
      const screen = widgetBackend.querySelector('.js-term-screen');
      const logsContainer = widgetBackend.querySelector('.js-term-logs');
      const form = widgetBackend.querySelector('.js-term-form');
      const input = widgetBackend.querySelector('.js-term-input');
      const pulseDot = widgetBackend.querySelector('.js-term-pulse');
      const chips = widgetBackend.querySelectorAll('.js-term-btn');
      const uptimeEl = widgetBackend.querySelector('.js-term-uptime');

      // Живой секундомер аптайма кластера
      let uptimeSeconds = 342 * 86400 + 18 * 3600 + 42 * 60 + 19;
      if (uptimeEl) {
        function updateUptimeDisplay() {
          const d = Math.floor(uptimeSeconds / 86400);
          const h = Math.floor((uptimeSeconds % 86400) / 3600);
          const m = Math.floor((uptimeSeconds % 3600) / 60);
          const s = uptimeSeconds % 60;
          uptimeEl.textContent = T('about.uptime', 'Uptime: {t} • Защита от DDoS', { t: `${d}d ${h}h ${m}m ${s}s` });
        }
        setInterval(() => {
          uptimeSeconds++;
          updateUptimeDisplay();
        }, 1000);
      }

      function scrollTerminal() {
        if (screen) screen.scrollTop = screen.scrollHeight;
      }

      function addTerminalLine(html, isCmd = false) {
        if (!logsContainer) return;
        const line = document.createElement('div');
        line.className = 'term-line term-line--stream' + (isCmd ? ' term-line--cmd' : '');
        line.innerHTML = html;
        logsContainer.appendChild(line);
        scrollTerminal();
      }

      function executeCommand(cmd) {
        const cleanCmd = cmd.trim().toLowerCase();
        if (!cleanCmd) return;

        playHaptic('beep');
        addTerminalLine(`<span class="term-prompt">$</span> ${escapeHtml(cleanCmd)}`, true);
        if (pulseDot) pulseDot.classList.add('is-busy');

        if (cleanCmd === 'load' || cleanCmd.startsWith('load') || cleanCmd === 'stress') {
          setTimeout(() => addTerminalLine(T('term.load-1', '<span class="term-prompt">&gt;</span> Запуск теста: 10 000 параллельных rps...')), 120);
          setTimeout(() => addTerminalLine('<span class="term-icon">✔</span> Redis Cache: hit rate 99.8% <span class="term-meta">[0.3ms]</span>'), 280);
          setTimeout(() => addTerminalLine(T('term.load-3', '<span class="term-icon">✔</span> PostgreSQL: пул 42/500 соединений OK')), 440);
          setTimeout(() => {
            addTerminalLine(T('term.load-4', '<span class="term-icon">✔</span> 10 000 запросов обработано за 0.78с. Ошибок: 0 (200 OK)'));
            if (pulseDot) pulseDot.classList.remove('is-busy');
          }, 600);
        } else if (cleanCmd === 'ping') {
          setTimeout(() => addTerminalLine(T('term.ping-1', '<span class="term-prompt">&gt;</span> Минск (BY-IX): <span class="term-icon">1.1ms</span>')), 100);
          setTimeout(() => addTerminalLine(T('term.ping-2', '<span class="term-prompt">&gt;</span> Москва (MSK-IX): <span class="term-icon">7.9ms</span>')), 200);
          setTimeout(() => {
            addTerminalLine(T('term.ping-3', '<span class="term-prompt">&gt;</span> Франкфурт: <span class="term-icon">23.4ms</span>'));
            if (pulseDot) pulseDot.classList.remove('is-busy');
          }, 320);
        } else if (cleanCmd === 'backup') {
          setTimeout(() => addTerminalLine(T('term.backup-1', '<span class="term-prompt">&gt;</span> Создание снепшота PostgreSQL базы...')), 120);
          setTimeout(() => {
            addTerminalLine(T('term.backup-2', '<span class="term-icon">✔</span> Снимок зашифрован (AES-256) и сохранен в S3 (2.8с)'));
            if (pulseDot) pulseDot.classList.remove('is-busy');
          }, 350);
        } else if (cleanCmd === 'clear') {
          logsContainer.innerHTML = '';
          if (pulseDot) pulseDot.classList.remove('is-busy');
        } else if (cleanCmd === 'help') {
          setTimeout(() => {
            addTerminalLine(T('term.help', '<span class="term-prompt">&gt;</span> Команды: <b>load</b>, <b>ping</b>, <b>backup</b>, <b>status</b>, <b>clear</b>'));
            if (pulseDot) pulseDot.classList.remove('is-busy');
          }, 100);
        } else if (cleanCmd === 'status') {
          setTimeout(() => {
            addTerminalLine(T('term.status', '<span class="term-icon">✔</span> CPU: 7% • ОЗУ: 1.2/16 GB • Nginx workers: 8 • 0 сбоев'));
            if (pulseDot) pulseDot.classList.remove('is-busy');
          }, 120);
        } else {
          setTimeout(() => {
            addTerminalLine(T('term.not-found', "<span style=\"color:#ff5f56\">kv-cluster: '{cmd}' не найдена. Введите 'help'</span>", { cmd: escapeHtml(cleanCmd) }));
            if (pulseDot) pulseDot.classList.remove('is-busy');
          }, 120);
        }
      }

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!input) return;
        const val = input.value;
        input.value = '';
        executeCommand(val);
      });

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          playHaptic('click');
          const cmd = chip.dataset.cmd;
          executeCommand(cmd);
        });
      });
    }

    // 3. ВИДЖЕТ TELEGRAM & CRM СИМУЛЯТОР
    const widgetTg = document.getElementById('widget-card-telegram');
    if (widgetTg) {
      const simBtn = widgetTg.querySelector('.js-tg-simulate');
      const clearBtn = widgetTg.querySelector('.js-tg-clear');
      const statusEl = widgetTg.querySelector('.js-tg-status');
      const clientEl = widgetTg.querySelector('.js-tg-client');
      const tariffEl = widgetTg.querySelector('.js-tg-tariff');
      const budgetEl = widgetTg.querySelector('.js-tg-budget');
      const badgeEl = widgetTg.querySelector('.js-tg-badge');
      const timeEl = widgetTg.querySelector('.js-tg-time');
      const crmStatusEl = widgetTg.querySelector('.js-tg-crm-status');
      const repliesFeed = widgetTg.querySelector('.js-tg-replies');
      const leadMsg = widgetTg.querySelector('.js-tg-msg-lead');

      const btnCrm = widgetTg.querySelector('.js-tg-btn-crm');
      const btnReply = widgetTg.querySelector('.js-tg-btn-reply');
      const btnInvoice = widgetTg.querySelector('.js-tg-btn-invoice');

      let leadNum = 148;
      const sampleLeads = TD('leads', [
        { name: 'Екатерина (Минск)', tariff: 'Интернет-магазин + CRM', budget: '3 200 BYN', crm: 'amoCRM: Новый лид' },
        { name: 'Дмитрий (Гродно)', tariff: 'Telegram Mini App (Каталог + Заказ)', budget: '2 400 BYN', crm: 'Bitrix24: Сделка создана' },
        { name: 'Максим (Брест)', tariff: 'Сайт-сервис + Калькулятор', budget: '3 800 BYN', crm: 'amoCRM: Квалификация' },
        { name: 'Ольга (Витебск)', tariff: 'Корпоративный портал', budget: '1 950 BYN', crm: 'amoCRM: Новый лид' }
      ]);
      let leadIdx = 0;

      function getCurrentTimeStr() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return T('about.delivered', '{t} • Доставлено', { t: `${hh}:${mm}` });
      }

      simBtn?.addEventListener('click', () => {
        playHaptic('pop');
        if (!statusEl) return;
        statusEl.textContent = T('about.bot-typing', 'печатает...');
        statusEl.classList.add('is-typing');

        setTimeout(() => {
          statusEl.textContent = T('about.bot-onlayn', 'бот онлайн');
          statusEl.classList.remove('is-typing');

          leadNum++;
          const data = sampleLeads[leadIdx % sampleLeads.length];
          leadIdx++;

          if (badgeEl) badgeEl.textContent = T('about.new-lead', 'Новая заявка • Сайт #{n}', { n: leadNum });
          if (clientEl) clientEl.textContent = data.name;
          if (tariffEl) tariffEl.textContent = data.tariff;
          if (budgetEl) budgetEl.textContent = data.budget;
          if (crmStatusEl) {
            crmStatusEl.textContent = data.crm;
            crmStatusEl.style.color = '#00D26A';
          }
          if (timeEl) timeEl.textContent = getCurrentTimeStr();

          if (leadMsg) {
            leadMsg.classList.remove('is-pop');
            void leadMsg.offsetWidth; // force reflow
            leadMsg.classList.add('is-pop');
          }
        }, 350);
      });

      clearBtn?.addEventListener('click', () => {
        playHaptic('tap');
        if (repliesFeed) {
          repliesFeed.innerHTML = '';
        }
        if (statusEl) {
          statusEl.textContent = T('about.bot-cleared', 'история очищена');
          statusEl.style.color = 'rgba(255,255,255,0.6)';
          setTimeout(() => {
            statusEl.textContent = T('about.bot-onlayn', 'бот онлайн');
            statusEl.style.color = '';
          }, 1000);
        }
        if (leadMsg) {
          leadMsg.classList.remove('is-pop');
          void leadMsg.offsetWidth;
          leadMsg.classList.add('is-pop');
        }
      });

      btnCrm?.addEventListener('click', () => {
        playHaptic('click');
        if (!crmStatusEl) return;
        crmStatusEl.textContent = T('about.crm-qualified', 'amoCRM: Квалифицирован инженером');
        crmStatusEl.style.color = 'var(--lime)';
      });

      btnReply?.addEventListener('click', () => {
        playHaptic('click');
        if (!repliesFeed) return;
        const bubble = document.createElement('div');
        bubble.className = 'tg-msg tg-msg--out is-pop';
        bubble.innerHTML = T('about.reply-bubble', '<b>Вы:</b> Здравствуйте! Получили заявку #{n}, свяжемся с вами в Telegram в течение 10 минут.', { n: leadNum });
        repliesFeed.appendChild(bubble);
        bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      btnInvoice?.addEventListener('click', () => {
        playHaptic('click');
        if (!repliesFeed) return;
        const bubble = document.createElement('div');
        bubble.className = 'tg-msg tg-msg--sys is-pop';
        bubble.innerHTML = T('about.invoice-bubble', '<b>Счет в ЕРИП:</b> #KV-{n} сформирован. Оплата через мобильный банк без комиссии.', { n: leadNum });
        repliesFeed.appendChild(bubble);
        bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  // Запуск интерактивных виджетов
  initFounderWidgets();

  /* ========================================================================
     ГАРАНТИИ И СТАНДАРТЫ КАЧЕСТВА: Spotlight Glow & Lighthouse Gauge
     Вдохновлено шаблонами MotionSites (Glow Features, EMBER, Finlytic)
     ======================================================================== */
  initStandardsModule();

  function initStandardsModule() {
    // 1. Spotlight Glow на карточках гарантий
    const cards = document.querySelectorAll('.guarantee-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--spot-x', `${x}px`);
        card.style.setProperty('--spot-y', `${y}px`);
      });
    });

    // 2. Анимация круговой шкалы Google Lighthouse при скролле
    const gaugeCircle = document.querySelector('.js-gauge-circle');
    const gaugeNum = document.querySelector('.js-gauge-num');
    if (gaugeCircle && gaugeNum) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gaugeCircle.classList.add('is-animated');
            let current = 0;
            const target = 99;
            const stepTime = 16;
            const timer = setInterval(() => {
              current += 3;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              gaugeNum.textContent = current;
            }, stepTime);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });

      observer.observe(gaugeCircle);
    }
  }

  /* ========================================================================
     МАГНИТНЫЕ КНОПКИ (Magnetic Physics & Elastic Spring)
     Вдохновлено шаблоном Impressive Hero с MotionSites и Awwwards
     ======================================================================== */
  initMagneticPhysics();

  function initMagneticPhysics() {
    // Отключаем на тач-устройствах и при prefers-reduced-motion
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targetSelector = '.btn, .cases__arrow, .tg-sim-btn, .tg-clear-btn, .widget-presets-bar button';
    const buttons = Array.from(document.querySelectorAll(targetSelector));
    if (!buttons.length) return;

    buttons.forEach(btn => {
      btn.classList.add('is-magnetic');

      let bounding = null;
      let rafId = null;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let isHovered = false;

      const isLarge = btn.classList.contains('btn--lg');
      const isArrow = btn.classList.contains('cases__arrow');
      const strength = isLarge ? 0.32 : (isArrow ? 0.44 : 0.28);
      const maxDist = isLarge ? 16 : (isArrow ? 10 : 12);

      function updateBounds() {
        bounding = btn.getBoundingClientRect();
      }

      function lerp(start, end, factor) {
        return start + (end - start) * factor;
      }

      function loop() {
        currentX = lerp(currentX, targetX, 0.22);
        currentY = lerp(currentY, targetY, 0.22);

        const rot = (currentX / maxDist) * 3.2;

        btn.style.setProperty('--mag-x', `${currentX.toFixed(2)}px`);
        btn.style.setProperty('--mag-y', `${currentY.toFixed(2)}px`);
        btn.style.setProperty('--mag-r', `${rot.toFixed(2)}deg`);

        if (!isHovered && Math.abs(currentX) < 0.05 && Math.abs(currentY) < 0.05) {
          btn.style.setProperty('--mag-x', '0px');
          btn.style.setProperty('--mag-y', '0px');
          btn.style.setProperty('--mag-r', '0deg');
          rafId = null;
          return;
        }

        rafId = requestAnimationFrame(loop);
      }

      btn.addEventListener('mouseenter', () => {
        isHovered = true;
        updateBounds();
        btn.classList.remove('is-magnetic-release');
        if (!rafId) rafId = requestAnimationFrame(loop);
      });

      btn.addEventListener('mousemove', (e) => {
        if (!bounding) updateBounds();
        const centerX = bounding.left + bounding.width / 2;
        const centerY = bounding.top + bounding.height / 2;

        const deltaX = (e.clientX - centerX) * strength;
        const deltaY = (e.clientY - centerY) * strength;

        targetX = Math.max(-maxDist, Math.min(maxDist, deltaX));
        targetY = Math.max(-maxDist, Math.min(maxDist, deltaY));

        const px = ((e.clientX - bounding.left) / bounding.width * 100).toFixed(1);
        const py = ((e.clientY - bounding.top) / bounding.height * 100).toFixed(1);
        btn.style.setProperty('--mag-px', `${px}%`);
        btn.style.setProperty('--mag-py', `${py}%`);
      });

      btn.addEventListener('mouseleave', () => {
        isHovered = false;
        targetX = 0;
        targetY = 0;
        btn.classList.add('is-magnetic-release');
      });

      window.addEventListener('scroll', updateBounds, { passive: true });
      window.addEventListener('resize', updateBounds, { passive: true });
    });
  }
});


