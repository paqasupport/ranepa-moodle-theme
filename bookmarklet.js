/**
 * ==============================================================================
 * Replace BRS & LMS Sync Bookmarklet 🎓
 * ==============================================================================
 * Скрипт-закладка (Bookmarklet) для автоматического сбора оценок БРС и дедлайнов
 * с официального сайта СДО РАНХиГС (lms.ranepa.ru) в веб-приложение Replace.
 *
 * 🔒 БЕЗОПАСНОСТЬ (Zero-Trust):
 * - Скрипт НЕ знает, НЕ читает и НЕ запрашивает ваш пароль.
 * - Все запросы выполняются строго в контексте вашего браузера с вашими
 *   текущими сессионными куками (credentials: 'include').
 * - На сервер Replace отправляется исключительно спарсенная HTML-информация
 *   о ваших предметах и оценках, привязанная к разовому 6-значному коду.
 *
 * 🚀 КАК ИСПОЛЬЗОВАТЬ:
 * 1. Создайте в браузере новую закладку.
 * 2. В поле «URL» / «Адрес» вставьте данный код, предварительно обернув его
 *    в `javascript:(...)()` или скопировав готовую строку из приложения Replace.
 * 3. Откройте https://lms.ranepa.ru, авторизуйтесь и кликните по закладке.
 * ==============================================================================
 */

(async () => {
  // ----------------------------------------------------------------------------
  // 0. КОНФИГУРАЦИЯ СИНХРОНИЗАЦИИ
  // ----------------------------------------------------------------------------
  // Разовый 6-значный код привязки, сгенерированный в вашем профиле Replace:
  const SYNC_CODE = '114055'; 

  // Официальный адрес API Replace (куда передаются спарсенные данные):
  const API_ENDPOINT = 'https://paqareplace.com/api/users/brs/extension-sync';

  // ----------------------------------------------------------------------------
  // 1. ЗАЩИТА ОТ СЛУЧАЙНОГО ЗАПУСКА НА ДРУГИХ САЙТАХ
  // ----------------------------------------------------------------------------
  // Проверяем, что закладка нажата именно на домене lms.ranepa.ru.
  // Если пользователь находится на другом сайте — предупреждаем и перенаправляем.
  if (!location.hostname.includes('lms.ranepa.ru')) {
    alert('Сначала откройте сайт lms.ranepa.ru, войдите в аккаунт СДО и нажмите на эту закладку ещё раз!');
    location.href = 'https://lms.ranepa.ru/my/';
    return;
  }

  // ----------------------------------------------------------------------------
  // 2. СОЗДАНИЕ ВСПЛЫВАЮЩЕГО HUD-УВЕДОМЛЕНИЯ НА ЭКРАНЕ
  // ----------------------------------------------------------------------------
  // Создаём аккуратную тёмную плашку (Material 3 стиль) поверх страницы Moodle,
  // чтобы пользователь наглядно видел текущий прогресс сбора данных.
  const banner = document.createElement('div');
  banner.style.cssText = [
    'position: fixed',
    'top: 16px',
    'left: 50%',
    'transform: translateX(-50%)',
    'z-index: 9999999',
    'background: #1D1B20',
    'color: #E6E0E9',
    'border: 2px solid #D0BCFF',
    'padding: 14px 20px',
    'border-radius: 18px',
    'font: 700 13px/1.4 system-ui, -apple-system, sans-serif',
    'box-shadow: 0 12px 32px rgba(0,0,0,0.55)',
    'max-width: 90vw',
    'text-align: center',
    'transition: all 0.3s ease'
  ].join(';');

  banner.textContent = `⏳ Replace БРС (код ${SYNC_CODE}): загружаем ведомость и календарь...`;
  document.body.appendChild(banner);

  try {
    // --------------------------------------------------------------------------
    // 3. ЗАПРОС СВОДНОЙ ВЕДОМОСТИ ОЦЕНОК (Overview Report)
    // --------------------------------------------------------------------------
    // Делаем GET-запрос к сводной странице оценок Moodle.
    // { credentials: 'include' } указывает браузеру автоматически прикрепить
    // куки активной сессии пользователя (MoodleSession). Пароль не нужен!
    const overviewResponse = await fetch('/grade/report/overview/index.php', {
      credentials: 'include'
    });
    const ovHtml = await overviewResponse.text();

    // Проверяем, залогинен ли студент: если в ответе рендерится форма логина — значит сессия истекла
    if (ovHtml.includes('id="login"') && !ovHtml.includes('grade-report-overview')) {
      throw new Error('Вы не вошли в аккаунт СДО на этой странице');
    }

    // --------------------------------------------------------------------------
    // 4. ИЗВЛЕЧЕНИЕ СЕССИОННОГО КЛЮЧА И ID ПОЛЬЗОВАТЕЛЯ
    // --------------------------------------------------------------------------
    // Moodle требует CSRF-токен `sesskey` для экспорта календаря.
    // Пытаемся взять его из глобального объекта Moodle (window.M.cfg) либо парсим регуляркой из HTML.
    const sesskey =
      (window.M && window.M.cfg && window.M.cfg.sesskey) ||
      (ovHtml.match(/"sesskey"\s*:\s*"([^"]+)"/) || ovHtml.match(/sesskey=([a-zA-Z0-9]+)/) || [])[1] ||
      '';

    // Извлекаем числовой User ID студента (нужен для построения прямых ссылок на оценки)
    const userId = (ovHtml.match(/"userId"\s*:\s*(\d+)/) || ovHtml.match(/user=(\d+)/) || [])[1] || '';

    // --------------------------------------------------------------------------
    // 5. ГЕНЕРАЦИЯ ССЫЛКИ НА ЭКСПОРТ ДЕДЛАЙНОВ КАЛЕНДАРЯ (.ICS)
    // --------------------------------------------------------------------------
    // Эмулируем стандартный экспорт календаря Moodle: отправляем POST на /calendar/export.php.
    // Moodle генерирует подписанную ссылку с постоянным токеном календаря (export_execute.php).
    let calendarExportUrl = '';
    if (sesskey) {
      try {
        const calParams = new URLSearchParams({
          sesskey: sesskey,
          _qf__core_calendar_export_form: '1',
          'events[exportevents]': 'all',          // Экспортировать все события
          'period[timeperiod]': 'recentupcoming', // Текущие и предстоящие дедлайны
          generateurl: '1'                        // Запрос именно веб-ссылки, а не скачивания файла
        });

        const calResponse = await fetch('/calendar/export.php?', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: calParams.toString()
        });
        const calHtml = await calResponse.text();

        // Ищем в HTML сгенерированный уникальный URL экспорта
        const calMatch = calHtml.match(/https:\/\/lms\.ranepa\.ru\/calendar\/export_execute\.php\?[^\s"'<>]+/);
        if (calMatch) {
          calendarExportUrl = calMatch[0].replace(/&amp;/g, '&');
        }
      } catch (e) {
        // Ошибка календаря не критична — оценки всё равно продолжат собираться
      }
    }

    // --------------------------------------------------------------------------
    // 6. ПАРСИНГ СПИСКА АКТУАЛЬНЫХ ДИСЦИПЛИН
    // --------------------------------------------------------------------------
    // Из сводной таблицы достаем ссылки на персональные ведомости каждого курса.
    // Фильтруем дубликаты и исключаем курсы с пометкой "(архив)".
    const courseList = [];
    const courseRegex = /href="([^"]*course\/user\.php\?[^"]*mode=grade[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = courseRegex.exec(ovHtml)) !== null) {
      const rawUrl = match[1].replace(/&amp;/g, '&');
      const idMatch = rawUrl.match(/[?&]id=(\d+)/);
      const courseId = idMatch ? idMatch[1] : '';
      const courseTitle = match[2].replace(/<[^>]+>/g, '').trim();

      // Пропускаем пустые, архивные или уже добавленные предметы
      if (courseId && courseTitle && !courseTitle.toLowerCase().includes('(архив)') && !courseList.some(c => c.id === courseId)) {
        // Гарантируем наличие параметра &user=ID в URL, чтобы Moodle отдал оценки текущего студента
        const fullUrl = rawUrl.includes('user=') ? rawUrl : (rawUrl + (userId ? `&user=${userId}` : ''));
        courseList.push({ id: courseId, url: fullUrl });
      }
    }

    // --------------------------------------------------------------------------
    // 7. ПАРАЛЛЕЛЬНЫЙ СБОР ОЦЕНОК И ЗАДАНИЙ ПО ВСЕМ КУРСАМ
    // --------------------------------------------------------------------------
    banner.textContent = `⏳ Replace БРС: собираем работы и отзывы (${courseList.length} предм.)...`;

    const courseHtmlMap = {};  // Детальные ведомости оценок по курсам
    const assignHtmlMap = {};  // Списки заданий со статусами сдачи (/mod/assign/index.php)

    // Запускаем запросы параллельно через Promise.all, экономя время
    await Promise.all(
      courseList.map(async (course) => {
        try {
          const [gradeResp, assignResp] = await Promise.all([
            fetch(course.url, { credentials: 'include' }),
            fetch(`/mod/assign/index.php?id=${course.id}`, { credentials: 'include' }).catch(() => null)
          ]);

          if (gradeResp && gradeResp.ok) {
            courseHtmlMap[course.id] = await gradeResp.text();
          }
          if (assignResp && assignResp.ok) {
            assignHtmlMap[course.id] = await assignResp.text();
          }
        } catch (e) {
          // Игнорируем сетевые сбои по отдельным курсам, собираем максимум доступного
        }
      })
    );

    // --------------------------------------------------------------------------
    // 8. ОТПРАВКА ДАННЫХ В ПРОФИЛЬ REPLACE
    // --------------------------------------------------------------------------
    banner.textContent = '⏳ Replace БРС: отправляем данные в ваш профиль...';

    // Формируем полезную нагрузку: разовый код + спарсенный HTML ведомостей + ссылка на iCal
    const payload = {
      code: SYNC_CODE,
      overview_html: ovHtml,
      course_htmls: courseHtmlMap,
      courses_html: courseHtmlMap,
      assign_htmls: assignHtmlMap,
      calendar_url: calendarExportUrl,
      calendar_export_url: calendarExportUrl
    };

    const apiResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resultData = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      throw new Error(resultData.detail || `Ошибка сервера (${apiResponse.status})`);
    }

    // --------------------------------------------------------------------------
    // 9. ОТОБРАЖЕНИЕ УСПЕШНОГО РЕЗУЛЬТАТА
    // --------------------------------------------------------------------------
    banner.style.borderColor = '#81C784'; // Нежно-зелёная рамка успеха
    banner.style.color = '#A5D6A7';
    banner.innerHTML = `✅ <b>БРС, работы и дедлайны отправлены в Replace!</b><br>` +
      `<span style="font-size:11.5px; opacity:0.9;">` +
      `Дисциплин: ${resultData.courses_count || courseList.length}, ` +
      `дедлайнов: ${resultData.calendar_synced || 0}` +
      `</span>`;

    // Плашка автоматически исчезнет через 6 секунд
    setTimeout(() => banner.remove(), 6000);

  } catch (error) {
    // --------------------------------------------------------------------------
    // 10. ОБРАБОТКА ОШИБОК
    // --------------------------------------------------------------------------
    banner.style.borderColor = '#F2B8B5'; // Пастельно-красная рамка ошибки
    banner.style.color = '#F2B8B5';
    banner.textContent = `❌ Ошибка: ${error.message || error}`;
    setTimeout(() => banner.remove(), 7000);
  }
})();
