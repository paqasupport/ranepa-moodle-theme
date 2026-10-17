// ==UserScript==
// @name         Paqa M3 Theme for Moodle (РАНХиГС LMS)
// @namespace    https://lms.ranepa.ru/
// @version      2.0.5
// @description  Material 3 Expressive тема для СДО РАНХиГС с интерактивной Paqa Studio
// @author       Paqa Team
// @match        https://lms.ranepa.ru/*
// @updateURL    https://raw.githubusercontent.com/paqasupport/ranepa-moodle-theme/main/moodle-theme.user.js
// @downloadURL  https://raw.githubusercontent.com/paqasupport/ranepa-moodle-theme/main/moodle-theme.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==
/* jshint esversion: 11, loopfunc: true, shadow: true */

(function() {
  'use strict';

  // 1. Storage Bridge (GM storage with localStorage fallback)
  const StorageBridge = {
    get: function(keys, cb) {
      const result = {};
      const keyList = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
      keyList.forEach(k => {
        let val;
        if (typeof GM_getValue === 'function') {
          try { val = GM_getValue(k, undefined); } catch(e){}
        }
        if (val === undefined || val === null) {
          try {
            const raw = localStorage.getItem(k);
            if (raw !== null) val = JSON.parse(raw);
          } catch(e){}
        }
        if (val !== undefined && val !== null) {
          result[k] = val;
        }
      });
      if (cb) cb(result);
      return Promise.resolve(result);
    },
    set: function(items, cb) {
      for (const [k, v] of Object.entries(items)) {
        if (typeof GM_setValue === 'function') {
          try { GM_setValue(k, v); } catch(e){}
        }
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch(e){}
      }
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('mc_moodle_channel');
          bc.postMessage({ type: 'STORAGE_CHANGED', items: items });
          bc.close();
        }
      } catch(e){}
      if (cb) cb();
      return Promise.resolve();
    }
  };

  // 2. Chrome Extension Polyfill for content.js
  const chromePolyfill = {
    storage: {
      local: {
        get: (keys, cb) => StorageBridge.get(keys, cb),
        set: (items, cb) => StorageBridge.set(items, cb)
      },
      sync: {
        get: (keys, cb) => StorageBridge.get(keys, cb),
        set: (items, cb) => StorageBridge.set(items, cb)
      },
      onChanged: {
        addListener: (fn) => {
          window.addEventListener('storage', (e) => {
            if (e.key) {
              try {
                fn({ [e.key]: { newValue: JSON.parse(e.newValue) } }, 'local');
              } catch(err){}
            }
          });
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('mc_moodle_channel');
            bc.onmessage = (ev) => {
              if (ev.data && ev.data.type === 'STORAGE_CHANGED') {
                const changes = {};
                for (const [k, v] of Object.entries(ev.data.items)) {
                  changes[k] = { newValue: v };
                }
                fn(changes, 'local');
              }
            };
          }
        }
      }
    },
    runtime: {
      onMessage: {
        addListener: (fn) => {
          window.addEventListener('mc-message', (e) => {
            if (e.detail) fn(e.detail, {}, () => {});
          });
        }
      },
      getURL: (path) => path
    },
    tabs: {
      create: (opts) => window.open(opts.url, '_blank'),
      query: (q, cb) => cb([{ id: 1 }]),
      sendMessage: (tabId, msg, cb) => {
        window.dispatchEvent(new CustomEvent('mc-message', { detail: msg }));
        if (cb) cb({ success: true });
      }
    }
  };

  // 3. Inject Base CSS immediately at document-start
  const baseCssContent = "/* ========================================================\r\n   PaqaReplace M3 Theme Engine for Moodle (lms.ranepa.ru)\r\n   Material Design 3 + Nunito Typography\r\n   ======================================================== */\r\n\r\n@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap');\r\n\r\n:root {\r\n  --mc-enabled: 1;\r\n  --mc-bg: #1C1B1F;\r\n  --mc-bg-card: #2B2930;\r\n  --mc-bg-card-low: #1D1B20;\r\n  --mc-bg-navbar: #1D1B20;\r\n  --mc-bg-drawer: #2B2930;\r\n  --mc-text: #E6E1E5;\r\n  --mc-text-muted: #CAC4D0;\r\n  --mc-accent: #D0BCFF;\r\n  --mc-accent-container: #4F378B;\r\n  --mc-on-accent-container: #EADDFF;\r\n  --mc-accent-hover: #EADDFF;\r\n  --mc-accent-contrast: #381E72;\r\n  --mc-border: #49454F;\r\n  --mc-outline-variant: rgba(73, 69, 79, 0.6);\r\n  --mc-radius: 20px;\r\n  --mc-radius-btn: 24px;\r\n  --mc-blur: 16px;\r\n  --mc-font: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r\n  --mc-bg-image: none;\r\n  --mc-border-width: 1px;\r\n  --mc-card-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);\r\n  --mc-card-padding: 16px 20px;\r\n  --mc-font-size: 14px;\r\n  --mc-bg-dim: 0;\r\n  --mc-bg-blur: 0px;\r\n}\r\n\r\n/* ========================================================\r\n   1. ГЛОБАЛЬНЫЙ ФОН И ШРИФТ\r\n   ======================================================== */\r\nbody.mc-active,\r\nbody.mc-active html {\r\n  background-color: var(--mc-bg) !important;\r\n  background-image: var(--mc-bg-image) !important;\r\n  background-size: cover !important;\r\n  background-attachment: fixed !important;\r\n  background-position: center !important;\r\n  color: var(--mc-text) !important;\r\n  /* Применяем шрифт только к body, чтобы не сломать иконки (FontAwesome) */\r\n  font-family: var(--mc-font); \r\n}\r\n\r\n/* Применяем шрифт к текстовым элементам, но ИСКЛЮЧАЕМ иконки */\r\nbody.mc-active h1, body.mc-active h2, body.mc-active h3, body.mc-active h4, body.mc-active h5, body.mc-active h6,\r\nbody.mc-active p, body.mc-active a, body.mc-active span:not(.icon):not(.fa):not(.fas):not(.far):not([class*=\"icon\"]):not(.mc-pinned-badge *):not(.mc-pinned-badge),\r\nbody.mc-active div:not(.icon):not(.fa):not(.fas):not(.far):not([class*=\"icon\"]):not(.mc-pinned-badge *):not(.mc-pinned-badge),\r\nbody.mc-active input, body.mc-active button, body.mc-active select, body.mc-active textarea {\r\n  font-family: var(--mc-font);\r\n}\r\n\r\n/* Принудительно перекрашиваем все тексты (заголовки, описания, списки, затемненный текст, ССЫЛКИ, формы, легенды) */\r\nbody.mc-active h1, body.mc-active h2, body.mc-active h3, body.mc-active h4, body.mc-active h5, body.mc-active h6,\r\nbody.mc-active p, body.mc-active span:not(.icon):not(.fa):not(.fas):not(.far):not([class*=\"icon\"]):not(.mc-pinned-badge *):not(.mc-pinned-badge),\r\nbody.mc-active li, body.mc-active td, body.mc-active th, body.mc-active label,\r\nbody.mc-active legend, body.mc-active fieldset, body.mc-active .fheader, body.mc-active .ftoggler,\r\nbody.mc-active .form-control-static, body.mc-active .felement, body.mc-active .fitem, body.mc-active .fitemtitle,\r\nbody.mc-active .fstaticlabel, body.mc-active .form-text, body.mc-active .form-description, body.mc-active .col-form-label,\r\nbody.mc-active strong, body.mc-active b, body.mc-active em, body.mc-active small, body.mc-active font,\r\nbody.mc-active .dimmed_text, body.mc-active .dimmed, body.mc-active .text-muted, body.mc-active .text-dark,\r\nbody.mc-active a, body.mc-active a:visited, body.mc-active a:active,\r\nbody.mc-active .nav-link, body.mc-active .page-link, body.mc-active .btn-link {\r\n  color: var(--mc-text) !important;\r\n  text-decoration: none !important;\r\n}\r\n\r\n/* Формы (техподдержка, профиль, опросы, задания) */\r\nbody.mc-active .mform,\r\nbody.mc-active .mform *:not(.btn):not(.btn *):not(.badge):not(.badge *):not(i):not(svg):not(img):not(.mc-act-badge):not(.mc-pinned-badge):not(.mc-pinned-badge *),\r\nbody.mc-active form:not(#adminsearchform) *:not(.btn):not(.btn *):not(.badge):not(.badge *):not(i):not(svg):not(img):not(.mc-act-badge):not(.mc-pinned-badge):not(.mc-pinned-badge *),\r\nbody.mc-active .box.generalbox,\r\nbody.mc-active .box.generalbox *:not(.mc-pinned-badge):not(.mc-pinned-badge *) {\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Ховер для ссылок */\r\nbody.mc-active a:hover, body.mc-active .nav-link:hover, body.mc-active .page-link:hover {\r\n  color: var(--mc-accent) !important;\r\n}\r\n\r\n/* Восстанавливаем шрифты иконок и добавляем фильтр для SVG иконок */\r\nbody.mc-active .icon,\r\nbody.mc-active .fa,\r\nbody.mc-active .fas,\r\nbody.mc-active .far,\r\nbody.mc-active i,\r\nbody.mc-active [class*=\"icon\"],\r\nbody.mc-active .dropdown-menu .icon {\r\n  font-family: \"FontAwesome\", \"Font Awesome 5 Free\", \"Font Awesome 6 Free\", \"moodleicons\", sans-serif !important;\r\n}\r\n\r\nbody.mc-active img.icon,\r\nbody.mc-active .icon img,\r\nbody.mc-active [class*=\"icon\"] img,\r\nbody.mc-active img[src*=\"/i/\"],\r\nbody.mc-active img[src*=\"/t/\"],\r\nbody.mc-active img[src*=\"icon\"],\r\nbody.mc-active svg.icon,\r\nbody.mc-active .icon svg,\r\nbody.mc-active .iscurrent svg,\r\nbody.mc-active .current svg {\r\n  filter: var(--mc-icon-filter) !important;\r\n}\r\n\r\nbody.mc-active i.icon,\r\nbody.mc-active i.fa,\r\nbody.mc-active i.fas,\r\nbody.mc-active i.far,\r\nbody.mc-active span.icon:not(.text-success):not(.text-danger):not(.text-warning):not(.text-info) {\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Иконки закладок, нарисованные через ::before / ::after (псевдоэлементы) */\r\nbody.mc-active .iscurrent::before,\r\nbody.mc-active .iscurrent::after,\r\nbody.mc-active .current::before,\r\nbody.mc-active .current::after,\r\nbody.mc-active li.section.current .content > h3::before {\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n\r\n/* ========================================================\r\n   2. ПОЛНОЕ УНИЧТОЖЕНИЕ БЕЛЫХ ФОНОВ (.bg-white, .bg-light, .main-inner)\r\n   ======================================================== */\r\nbody.mc-active .bg-white,\r\nbody.mc-active .bg-light,\r\nbody.mc-active [class*=\"bg-white\"],\r\nbody.mc-active [class*=\"bg-light\"] {\r\n  background-color: transparent !important;\r\n}\r\n\r\nbody.mc-active .drawer,\r\nbody.mc-active [data-region=\"drawer\"],\r\nbody.mc-active #theme_boost-drawers-courseindex,\r\nbody.mc-active #theme_boost-drawers-blocks,\r\nbody.mc-active .drawer-left,\r\nbody.mc-active .drawer-right,\r\nbody.mc-active .drawer-course-index,\r\nbody.mc-active .drawercontent {\r\n  background-color: var(--mc-bg-drawer) !important;\r\n  color: var(--mc-text) !important;\r\n  border-color: var(--mc-border) !important;\r\n}\r\n\r\nbody.mc-active #page,\r\nbody.mc-active #page-wrapper,\r\nbody.mc-active #page-content,\r\nbody.mc-active #region-main-box,\r\nbody.mc-active #region-main,\r\nbody.mc-active .region-main-content,\r\nbody.mc-active .main-inner,\r\nbody.mc-active #topofscroll,\r\nbody.mc-active .tertiary-navigation,\r\nbody.mc-active .tertiary-navigation > div,\r\nbody.mc-active .tertiary-navigation nav,\r\nbody.mc-active .tertiary-navigation ul,\r\nbody.mc-active .secondary-navigation,\r\nbody.mc-active .secondary-navigation > div,\r\nbody.mc-active .secondary-navigation .navigation,\r\nbody.mc-active .secondary-navigation .container-fluid,\r\nbody.mc-active .secondary-navigation .container,\r\nbody.mc-active .secondary-navigation nav,\r\nbody.mc-active .secondary-navigation ul,\r\nbody.mc-active .secondary-navigation li:not(.active),\r\nbody.mc-active .secondary-navigation .nav,\r\nbody.mc-active .secondary-navigation .nav-tabs,\r\nbody.mc-active .secondary-navigation .more-nav,\r\nbody.mc-active .secondary-navigation [role=\"tablist\"],\r\nbody.mc-active .moremenu,\r\nbody.mc-active nav.moremenu,\r\nbody.mc-active ul.more-nav,\r\nbody.mc-active .nav-tabs,\r\nbody.mc-active ul.nav-tabs,\r\nbody.mc-active .nav-tabs-wrapper,\r\nbody.mc-active .nav-tabs > li,\r\nbody.mc-active .moremenu > ul,\r\nbody.mc-active .more-nav,\r\nbody.mc-active #page-header,\r\nbody.mc-active #page-header .card,\r\nbody.mc-active #page-header .card-body,\r\nbody.mc-active .page-context-header,\r\nbody.mc-active .page-header-headings,\r\nbody.mc-active [data-region=\"secondary-navigation\"],\r\nbody.mc-active [data-region=\"secondary-navigation\"] > div,\r\nbody.mc-active [data-region=\"secondary-navigation\"] nav,\r\nbody.mc-active [data-region=\"secondary-navigation\"] ul,\r\nbody.mc-active [data-region=\"paged-content-page\"],\r\nbody.mc-active [data-region=\"paged-content-page\"] > div,\r\nbody.mc-active .paged-content-page,\r\nbody.mc-active .paged-content-page > div,\r\nbody.mc-active .content-item-container,\r\nbody.mc-active .contact,\r\nbody.mc-active .message,\r\nbody.mc-active .popover-region-footer,\r\nbody.mc-active .popover-region-footer-container {\r\n  background-color: transparent !important;\r\n  background: transparent !important;\r\n  box-shadow: none !important;\r\n  border-color: var(--mc-border) !important;\r\n}\r\n\r\nbody.mc-active #page-header h1,\r\nbody.mc-active .page-header-headings h1,\r\nbody.mc-active .page-title,\r\nbody.mc-active .mock-page-title,\r\nbody.mc-active .dashboard-heading,\r\nbody.mc-active .block_myoverview h5,\r\nbody.mc-active .block_myoverview .block-title,\r\nbody.mc-active .block_mydashboard h5,\r\nbody.mc-active .block_mydashboard .card-title {\r\n  width: fit-content !important;\r\n  max-width: 100% !important;\r\n  display: block !important;\r\n  margin-bottom: 0.75rem !important;\r\n}\r\n\r\nbody.mc-active .secondary-navigation .nav-tabs,\r\nbody.mc-active .moremenu .nav-tabs,\r\nbody.mc-active .nav-tabs {\r\n  border-bottom: 1px solid var(--mc-border) !important;\r\n  background: transparent !important;\r\n  background-color: transparent !important;\r\n}\r\n\r\nbody.mc-active .dropdown-item {\r\n  color: var(--mc-text) !important;\r\n  background-color: transparent !important;\r\n}\r\n\r\nbody.mc-active .popover-region-footer a,\r\nbody.mc-active .see-all-link {\r\n  color: var(--mc-accent) !important;\r\n  background-color: transparent !important;\r\n}\r\n\r\n/* ========================================================\r\n   3. КАРТОЧКИ КУРСОВ И БЛОКИ\r\n   ======================================================== */\r\nbody.mc-active .card,\r\nbody.mc-active .dashboard-card,\r\nbody.mc-active .dashboard-card-deck .dashboard-card,\r\nbody.mc-active .course-summary-card,\r\nbody.mc-active .coursebox,\r\nbody.mc-active .course-info-container,\r\nbody.mc-active .course-listitem,\r\nbody.mc-active .dashboard-list-item,\r\nbody.mc-active .block_myoverview .list-group-item,\r\nbody.mc-active .block_myoverview [data-region=\"course-content\"],\r\nbody.mc-active ul.list-group > li.course-listitem,\r\nbody.mc-active [data-region=\"courses-view\"] .list-group-item,\r\nbody.mc-active [data-region=\"course-content\"],\r\nbody.mc-active [data-region=\"card-deck\"] .card,\r\nbody.mc-active [data-region=\"courses-view\"] .card,\r\nbody.mc-active [data-region=\"courses-view\"] .course-summary-card,\r\nbody.mc-active [data-region=\"courses-view\"] [data-region=\"course-content\"],\r\nbody.mc-active [data-region=\"paged-content-page\"] .card,\r\nbody.mc-active .block,\r\nbody.mc-active .block_html,\r\nbody.mc-active .generaltable {\r\n  background-color: var(--mc-bg-card) !important;\r\n  border-width: var(--mc-border-width, 1px) !important;\r\n  border-style: solid !important;\r\n  border-color: var(--mc-border) !important;\r\n  border-radius: var(--mc-radius) !important;\r\n  box-shadow: var(--mc-card-shadow, 0 4px 20px rgba(0, 0, 0, 0.3)) !important;\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Очищаем внутренние слои карточки от белого фона, НО НЕ ТРОГАЕМ КАРТИНКИ И БЕЙДЖИ */\r\nbody.mc-active .card-body,\r\nbody.mc-active .card-content,\r\nbody.mc-active .course-info-container,\r\nbody.mc-active .coursebox .content,\r\nbody.mc-active .summary,\r\nbody.mc-active [data-region=\"course-content\"] > div,\r\nbody.mc-active .card *:not([class*=\"badge\"]):not([class*=\"text-bg-\"]):not(.courseimage):not(.dashboard-card-img):not(.course-summary-card-img):not(.btn):not(.label):not(.status):not(.course-status):not(.nav-link):not(.dropdown-item):not([role=\"tab\"]):not([role=\"menuitem\"]):not(.progress):not(.progress-bar):not(.mydashboard-progress):not(.mydashboard-progress-string):not(.dropdown-menu):not([class*=\"dropdown-menu\"]):not(.popover):not(.modal-content):not(select):not(option):not(input):not(textarea):not([data-region=\"moodle-actionmenu\"]),\r\nbody.mc-active .dashboard-card *:not([class*=\"badge\"]):not([class*=\"text-bg-\"]):not(.courseimage):not(.dashboard-card-img):not(.course-summary-card-img):not(.btn):not(.label):not(.status):not(.course-status):not(.nav-link):not(.dropdown-item):not([role=\"tab\"]):not([role=\"menuitem\"]):not(.progress):not(.progress-bar):not(.mydashboard-progress):not(.mydashboard-progress-string):not(.dropdown-menu):not([class*=\"dropdown-menu\"]):not(.popover):not(.modal-content):not(select):not(option):not(input):not(textarea):not([data-region=\"moodle-actionmenu\"]),\r\nbody.mc-active .coursebox *:not([class*=\"badge\"]):not([class*=\"text-bg-\"]):not(.courseimage):not(.dashboard-card-img):not(.course-summary-card-img):not(.btn):not(.label):not(.status):not(.course-status):not(.nav-link):not(.dropdown-item):not([role=\"tab\"]):not([role=\"menuitem\"]):not(.progress):not(.progress-bar):not(.mydashboard-progress):not(.mydashboard-progress-string):not(.dropdown-menu):not([class*=\"dropdown-menu\"]):not(.popover):not(.modal-content):not(select):not(option):not(input):not(textarea):not([data-region=\"moodle-actionmenu\"]),\r\nbody.mc-active .course-listitem *:not([class*=\"badge\"]):not([class*=\"text-bg-\"]):not(.courseimage):not(.dashboard-card-img):not(.course-summary-card-img):not(.btn):not(.label):not(.status):not(.course-status):not(.nav-link):not(.dropdown-item):not([role=\"tab\"]):not([role=\"menuitem\"]):not(.progress):not(.progress-bar):not(.mydashboard-progress):not(.mydashboard-progress-string):not(.dropdown-menu):not([class*=\"dropdown-menu\"]):not(.popover):not(.modal-content):not(select):not(option):not(input):not(textarea):not([data-region=\"moodle-actionmenu\"]),\r\nbody.mc-active .list-group-item *:not([class*=\"badge\"]):not([class*=\"text-bg-\"]):not(.courseimage):not(.dashboard-card-img):not(.course-summary-card-img):not(.btn):not(.label):not(.status):not(.course-status):not(.nav-link):not(.dropdown-item):not([role=\"tab\"]):not([role=\"menuitem\"]):not(.progress):not(.progress-bar):not(.mydashboard-progress):not(.mydashboard-progress-string):not(.dropdown-menu):not([class*=\"dropdown-menu\"]):not(.popover):not(.modal-content):not(select):not(option):not(input):not(textarea):not([data-region=\"moodle-actionmenu\"]),\r\nbody.mc-active .dashboard-list-item *:not([class*=\"badge\"]):not([class*=\"text-bg-\"]):not(.courseimage):not(.dashboard-card-img):not(.course-summary-card-img):not(.btn):not(.label):not(.status):not(.course-status):not(.nav-link):not(.dropdown-item):not([role=\"tab\"]):not([role=\"menuitem\"]):not(.progress):not(.progress-bar):not(.mydashboard-progress):not(.mydashboard-progress-string):not(.dropdown-menu):not([class*=\"dropdown-menu\"]):not(.popover):not(.modal-content):not(select):not(option):not(input):not(textarea):not([data-region=\"moodle-actionmenu\"]) {\r\n  background-color: transparent !important;\r\n}\r\n\r\n/* Универсальный фикс читаемости: весь текст внутри курсов и сообщений делаем светлым по умолчанию */\r\nbody.mc-active [data-region=\"courses-view\"] *,\r\nbody.mc-active .coursebox *,\r\nbody.mc-active .course-listitem *,\r\nbody.mc-active .message-app * {\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Название курса - делаем видимым (и в карточках, и в списках)! */\r\nbody.mc-active [data-region=\"courses-view\"] .card a,\r\nbody.mc-active [data-region=\"courses-view\"] .card h1,\r\nbody.mc-active [data-region=\"courses-view\"] .card h2,\r\nbody.mc-active [data-region=\"courses-view\"] .card h3,\r\nbody.mc-active [data-region=\"courses-view\"] .card h4,\r\nbody.mc-active .list-group-item a,\r\nbody.mc-active .list-group-item h1,\r\nbody.mc-active .list-group-item h2,\r\nbody.mc-active .list-group-item h3,\r\nbody.mc-active .list-group-item h4,\r\nbody.mc-active .course-listitem a,\r\nbody.mc-active .coursename,\r\nbody.mc-active .coursename a,\r\nbody.mc-active .coursename .multiline {\r\n  color: var(--mc-accent) !important;\r\n  font-weight: 800 !important;\r\n  font-size: 16px !important;\r\n  text-decoration: none !important;\r\n}\r\n\r\nbody.mc-active .coursename:hover,\r\nbody.mc-active .coursename a:hover,\r\nbody.mc-active .list-group-item a:hover {\r\n  color: var(--mc-accent-hover) !important;\r\n  text-decoration: underline !important;\r\n}\r\n\r\n/* Текст описания курса */\r\nbody.mc-active [data-region=\"courses-view\"] .card .text-muted,\r\nbody.mc-active [data-region=\"courses-view\"] .card .categoryname,\r\nbody.mc-active [data-region=\"courses-view\"] .card p,\r\nbody.mc-active [data-region=\"courses-view\"] .card span,\r\nbody.mc-active .list-group-item p,\r\nbody.mc-active .list-group-item span,\r\nbody.mc-active .course-listitem p,\r\nbody.mc-active .course-listitem span {\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Фиксы стандартных цветов Bootstrap (чтобы черный не сливался с фоном) */\r\nbody.mc-active .text-dark,\r\nbody.mc-active a.text-dark,\r\nbody.mc-active .text-body {\r\n  color: var(--mc-text) !important;\r\n}\r\nbody.mc-active .text-danger,\r\nbody.mc-active a.text-danger {\r\n  color: #ff8a8a !important; /* Яркий красный для темной темы */\r\n}\r\nbody.mc-active .text-success,\r\nbody.mc-active a.text-success {\r\n  color: #81c784 !important; /* Яркий зеленый для темной темы */\r\n}\r\nbody.mc-active .text-warning,\r\nbody.mc-active a.text-warning {\r\n  color: #ffd54f !important; /* Яркий желтый */\r\n}\r\nbody.mc-active .text-info,\r\nbody.mc-active a.text-info {\r\n  color: #4fc3f7 !important; /* Яркий голубой */\r\n}\r\n\r\n/* Закругление обложки курса */\r\nbody.mc-active .dashboard-card-img,\r\nbody.mc-active .course-summary-card-img,\r\nbody.mc-active .courseimage,\r\nbody.mc-active .course-image {\r\n  border-radius: 14px !important;\r\n  /* Убеждаемся, что фон не перекрывается прозрачным, если картинка задана фоном */\r\n}\r\n\r\n\r\n/* ========================================================\r\n   4. ВЕРХНИЙ БЛОК И КНОПКА \"УЧЕТ ПРИЧИН ПРОПУСКОВ ЗАНЯТИЙ\"\r\n   ======================================================== */\r\nbody.mc-active .block_html a,\r\nbody.mc-active .block_html .btn,\r\nbody.mc-active .block_html a[href*=\"help\"],\r\nbody.mc-active .block_html a[href*=\"propusk\"],\r\nbody.mc-active .block_html center a {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius-btn) !important;\r\n  padding: 10px 24px !important;\r\n  font-weight: 700 !important;\r\n  display: inline-block !important;\r\n  text-decoration: none !important;\r\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;\r\n  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;\r\n}\r\n\r\n\r\n/* ========================================================\r\n   5. КНОПКА \"ПЕРЕЙТИ К КУРСУ\"\r\n   ======================================================== */\r\n/* Базовые стили для всех кнопок */\r\nbody.mc-active .btn,\r\nbody.mc-active .btn-secondary,\r\nbody.mc-active .btn-outline-secondary,\r\nbody.mc-active .sectionbutton,\r\nbody.mc-active button:not(.close) {\r\n  background-color: var(--mc-bg-card) !important;\r\n  color: var(--mc-text) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius-btn) !important;\r\n  transition: all 0.2s;\r\n}\r\n\r\nbody.mc-active .btn:hover,\r\nbody.mc-active .btn-secondary:hover,\r\nbody.mc-active .btn-outline-secondary:hover,\r\nbody.mc-active .sectionbutton:hover,\r\nbody.mc-active button:not(.close):hover {\r\n  background-color: var(--mc-outline-variant) !important;\r\n  color: var(--mc-accent) !important;\r\n  border-color: var(--mc-accent) !important;\r\n}\r\n\r\nbody.mc-active .btn.active,\r\nbody.mc-active .btn:active,\r\nbody.mc-active .sectionbutton.active {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border-color: var(--mc-accent-container) !important;\r\n}\r\n\r\n/* Первичные кнопки (Primary) и Перейти к курсу */\r\nbody.mc-active .btn-primary,\r\nbody.mc-active .dashboard-card a.btn,\r\nbody.mc-active .course-summary-card a.btn,\r\nbody.mc-active .course-info-container a.btn,\r\nbody.mc-active a[href*=\"/course/view.php\"].btn,\r\nbody.mc-active .coursebox .btn,\r\nbody.mc-active [data-region=\"course-content\"] a.btn {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border: none !important;\r\n  border-radius: var(--mc-radius-btn) !important;\r\n  font-weight: 800 !important;\r\n  padding: 8px 22px !important;\r\n  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3) !important;\r\n}\r\n\r\n/* ========================================================\r\n   5.1. ФИЛЬТРЫ КУРСОВ И ВКЛАДКИ (NAV-PILLS / DROPDOWNS)\r\n   ======================================================== */\r\nbody.mc-active .block_mydashboard [data-region=\"filter\"] a,\r\nbody.mc-active .block_mydashboard [data-region=\"filter\"] button,\r\nbody.mc-active .block_myoverview [data-region=\"filter\"] a,\r\nbody.mc-active .block_myoverview [data-region=\"filter\"] button,\r\nbody.mc-active [data-region=\"courses-view\"] [data-region=\"filter\"] a,\r\nbody.mc-active [data-region=\"courses-view\"] [data-region=\"filter\"] button,\r\nbody.mc-active [data-region=\"filter\"] a,\r\nbody.mc-active [data-region=\"filter\"] button,\r\nbody.mc-active [data-region=\"filter\"] .dropdown-toggle,\r\nbody.mc-active .block_mydashboard .nav .nav-link,\r\nbody.mc-active .block_mydashboard .nav-pills .nav-link,\r\nbody.mc-active .block_mydashboard .nav-tabs .nav-link,\r\nbody.mc-active .block_myoverview .nav .nav-link,\r\nbody.mc-active .block_myoverview .nav-pills .nav-link,\r\nbody.mc-active .block_myoverview .nav-tabs .nav-link,\r\nbody.mc-active [data-region=\"courses-view\"] .nav .nav-link,\r\nbody.mc-active [data-region=\"courses-view\"] .nav-pills .nav-link,\r\nbody.mc-active [data-region=\"courses-view\"] .nav-tabs .nav-link,\r\nbody.mc-active [data-region=\"courses-view\"] .btn,\r\nbody.mc-active [data-region=\"courses-view\"] .dropdown-toggle,\r\nbody.mc-active a.rounded-pill,\r\nbody.mc-active button.rounded-pill,\r\nbody.mc-active .rounded-pill,\r\nbody.mc-active ul.nav-pills li.nav-item a.nav-link,\r\nbody.mc-active .nav-pills .nav-link,\r\nbody.mc-active .block_mydashboard .dropdown-toggle,\r\nbody.mc-active .block_myoverview .dropdown-toggle,\r\nbody.mc-active .block_mydashboard .btn-outline-secondary,\r\nbody.mc-active .block_mydashboard .btn-secondary,\r\nbody.mc-active .block_mydashboard .btn-light,\r\nbody.mc-active .block_myoverview .btn-outline-secondary,\r\nbody.mc-active .block_myoverview .btn-secondary,\r\nbody.mc-active .block_myoverview .btn-light,\r\nbody.mc-active .dropdown-toggle,\r\nbody.mc-active .btn-light,\r\nbody.mc-active .btn-outline-secondary,\r\nbody.mc-active .btn-secondary,\r\nbody.mc-active [data-region=\"display-selector\"] button,\r\nbody.mc-active [data-region=\"display-selector\"] a,\r\nbody.mc-active [data-region=\"sorting-selector\"] button,\r\nbody.mc-active [data-region=\"sorting-selector\"] a,\r\nbody.mc-active .btn-group .btn,\r\nbody.mc-active .page-link {\r\n  background-color: var(--mc-bg-card-low) !important;\r\n  color: var(--mc-text) !important;\r\n  border-radius: var(--mc-radius-btn, 24px) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  font-weight: 600 !important;\r\n  padding: 6px 16px !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  text-decoration: none !important;\r\n  box-shadow: none !important;\r\n  transition: all 0.2s ease !important;\r\n}\r\n\r\nbody.mc-active a.rounded-pill.active,\r\nbody.mc-active button.rounded-pill.active,\r\nbody.mc-active .rounded-pill.active,\r\nbody.mc-active a.active,\r\nbody.mc-active button.active,\r\nbody.mc-active .btn.active,\r\nbody.mc-active .nav-link.active,\r\nbody.mc-active .nav-item.active > a,\r\nbody.mc-active .nav-item.active > .nav-link,\r\nbody.mc-active li.active > a,\r\nbody.mc-active li.active > .nav-link,\r\nbody.mc-active [data-region=\"filter\"] a.active,\r\nbody.mc-active [data-region=\"filter\"] button.active,\r\nbody.mc-active [data-region=\"filter\"] .active,\r\nbody.mc-active [data-region=\"filter\"] .nav-link.active,\r\nbody.mc-active [data-region=\"filter\"] .nav-item.active > a,\r\nbody.mc-active [data-region=\"filter\"] .nav-item.active > .nav-link,\r\nbody.mc-active [data-region=\"filter\"] [aria-selected=\"true\"],\r\nbody.mc-active [data-region=\"filter\"] li[aria-selected=\"true\"] > a,\r\nbody.mc-active [data-region=\"filter\"] [aria-current=\"page\"],\r\nbody.mc-active [data-region=\"filter\"] [aria-current=\"true\"],\r\nbody.mc-active [data-region=\"display-selector\"] .active,\r\nbody.mc-active [data-region=\"display-selector\"] button.active,\r\nbody.mc-active [data-region=\"display-selector\"] a.active,\r\nbody.mc-active [data-region=\"display-selector\"] [aria-selected=\"true\"],\r\nbody.mc-active [data-region=\"display-selector\"] [aria-current=\"page\"],\r\nbody.mc-active [data-region=\"display-selector\"] [aria-current=\"true\"],\r\nbody.mc-active [data-region=\"sorting-selector\"] .active,\r\nbody.mc-active [data-region=\"sorting-selector\"] button.active,\r\nbody.mc-active [data-region=\"sorting-selector\"] a.active,\r\nbody.mc-active .block_mydashboard .nav .nav-link.active,\r\nbody.mc-active .block_mydashboard .nav-pills .nav-link.active,\r\nbody.mc-active .block_mydashboard .nav-item.active > a,\r\nbody.mc-active .block_mydashboard .nav-item.active > .nav-link,\r\nbody.mc-active .block_mydashboard [aria-selected=\"true\"],\r\nbody.mc-active .block_mydashboard [aria-current=\"page\"],\r\nbody.mc-active .block_myoverview .nav .nav-link.active,\r\nbody.mc-active .block_myoverview .nav-pills .nav-link.active,\r\nbody.mc-active .block_myoverview .nav-item.active > a,\r\nbody.mc-active .block_myoverview .nav-item.active > .nav-link,\r\nbody.mc-active .block_myoverview [aria-selected=\"true\"],\r\nbody.mc-active .block_myoverview [aria-current=\"page\"],\r\nbody.mc-active [data-region=\"courses-view\"] .nav-link.active,\r\nbody.mc-active [data-region=\"courses-view\"] .nav-item.active > a,\r\nbody.mc-active [data-region=\"courses-view\"] [aria-selected=\"true\"],\r\nbody.mc-active ul.nav-pills li.nav-item a.nav-link.active,\r\nbody.mc-active .nav-pills .nav-link.active,\r\nbody.mc-active .nav-pills .nav-item.active > .nav-link,\r\nbody.mc-active .nav-tabs .nav-link.active,\r\nbody.mc-active .nav-tabs .nav-item.active > .nav-link,\r\nbody.mc-active [aria-selected=\"true\"]:not(li):not(.tab-pane),\r\nbody.mc-active [aria-current=\"page\"]:not(li),\r\nbody.mc-active [aria-current=\"true\"]:not(li),\r\nbody.mc-active .page-item.active .page-link {\r\n  background-color: var(--mc-accent) !important;\r\n  color: var(--mc-accent-contrast) !important;\r\n  border: 1px solid var(--mc-accent) !important;\r\n  border-color: var(--mc-accent) !important;\r\n  font-weight: 700 !important;\r\n}\r\n\r\nbody.mc-active a.rounded-pill.active *,\r\nbody.mc-active button.rounded-pill.active *,\r\nbody.mc-active .nav-link.active *,\r\nbody.mc-active a.active *,\r\nbody.mc-active button.active *,\r\nbody.mc-active [aria-selected=\"true\"]:not(li):not(.tab-pane) * {\r\n  color: var(--mc-accent-contrast) !important;\r\n  fill: var(--mc-accent-contrast) !important;\r\n}\r\n\r\nbody.mc-active a.rounded-pill:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active button.rounded-pill:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active .rounded-pill:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active [data-region=\"filter\"] a:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active [data-region=\"filter\"] button:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active .block_mydashboard .nav .nav-link:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active .block_myoverview .nav .nav-link:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active [data-region=\"courses-view\"] .nav-link:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active ul.nav-pills li.nav-item a.nav-link:hover:not(.active):not([aria-selected=\"true\"]),\r\nbody.mc-active .dropdown-toggle:hover {\r\n  background-color: var(--mc-bg-card) !important;\r\n  color: var(--mc-accent-hover) !important;\r\n  border-color: var(--mc-accent) !important;\r\n}\r\n\r\n/* ========================================================\r\n   6. ПОИСК И INPUT (УБИРАЕМ БЕЛЫЕ ФОНЫ ПОЛЕЙ ВВОДА И ВЫРАВНИВАЕМ ПОИСК)\r\n   ======================================================== */\r\nbody.mc-active .mydashboard-filters-coursesearch-box,\r\nbody.mc-active .mydashboard-filters-coursesearch,\r\nbody.mc-active .coursesearch-box,\r\nbody.mc-active .block_mydashboard .mydashboard-filters .mydashboard-filters-coursesearch-box,\r\nbody.mc-active .block_mydashboard .mydashboard-filters .mydashboard-filters-coursesearch-box .mydashboard-filters-coursesearch,\r\nbody.mc-active .block_mydashboard .mydashboard-filters .mydashboard-filters-coursesearch-box .mydashboard-filters-coursesearch .coursesearch-box {\r\n  border: none !important;\r\n  outline: none !important;\r\n  box-shadow: none !important;\r\n  background: transparent !important;\r\n  background-color: transparent !important;\r\n  padding: 0 !important;\r\n  min-height: 0 !important;\r\n}\r\n\r\nbody.mc-active .coursesearch-box,\r\nbody.mc-active .block_mydashboard .mydashboard-filters .mydashboard-filters-coursesearch-box .mydashboard-filters-coursesearch .coursesearch-box {\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  gap: 10px !important;\r\n  width: 100% !important;\r\n}\r\n\r\nbody.mc-active input[type=\"text\"],\r\nbody.mc-active input[type=\"search\"],\r\nbody.mc-active input[type=\"email\"],\r\nbody.mc-active input[type=\"password\"],\r\nbody.mc-active textarea,\r\nbody.mc-active select,\r\nbody.mc-active .form-control,\r\nbody.mc-active .custom-select,\r\nbody.mc-active .block_mydashboard input,\r\nbody.mc-active .block_myoverview input,\r\nbody.mc-active [data-region=\"courses-view\"] input {\r\n  background-color: var(--mc-bg-card-low) !important;\r\n  color: var(--mc-text) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius-btn, 24px) !important;\r\n  padding: 6px 16px !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\nbody.mc-active input:focus,\r\nbody.mc-active textarea:focus,\r\nbody.mc-active .form-control:focus {\r\n  border-color: var(--mc-accent) !important;\r\n  background-color: var(--mc-bg-card) !important;\r\n}\r\n\r\n/* Выравниваем поле поиска курса и кнопку \"Поиск\" по высоте (40px) */\r\nbody.mc-active input[name=\"coursesearch\"],\r\nbody.mc-active .coursesearch-box input[type=\"text\"],\r\nbody.mc-active .mydashboard-filters-coursesearch input[type=\"text\"],\r\nbody.mc-active .block_mydashboard .mydashboard-filters .mydashboard-filters-coursesearch-box .mydashboard-filters-coursesearch .coursesearch-box input[type=\"text\"],\r\nbody.mc-active .simplesearchform input[type=\"text\"],\r\nbody.mc-active .simplesearchform input[type=\"search\"] {\r\n  height: 40px !important;\r\n  min-height: 40px !important;\r\n  max-height: 40px !important;\r\n  padding: 0 18px !important;\r\n  font-size: 14px !important;\r\n  line-height: 38px !important;\r\n  box-sizing: border-box !important;\r\n  border-radius: var(--mc-radius-btn, 24px) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  background-color: var(--mc-bg-card-low) !important;\r\n  color: var(--mc-text) !important;\r\n  margin: 0 !important;\r\n}\r\n\r\nbody.mc-active .simplesearchform .btn,\r\nbody.mc-active .block_mydashboard .simplesearchform .btn,\r\nbody.mc-active .block_myoverview .simplesearchform .btn,\r\nbody.mc-active .block_mydashboard button[type=\"submit\"],\r\nbody.mc-active .block_myoverview button[type=\"submit\"],\r\nbody.mc-active [data-region=\"courses-view\"] button[type=\"submit\"],\r\nbody.mc-active [data-action=\"search\"],\r\nbody.mc-active button[data-coursesearch=\"coursesearch\"],\r\nbody.mc-active .coursesearch-box button,\r\nbody.mc-active .coursesearch-box .btn,\r\nbody.mc-active .mydashboard-filters-coursesearch button,\r\nbody.mc-active .block_mydashboard .mydashboard-filters .mydashboard-filters-coursesearch-box .mydashboard-filters-coursesearch .coursesearch-box button {\r\n  height: 40px !important;\r\n  min-height: 40px !important;\r\n  max-height: 40px !important;\r\n  background-color: var(--mc-bg-card-low) !important;\r\n  color: var(--mc-text) !important;\r\n  border-radius: var(--mc-radius-btn, 24px) !important;\r\n  padding: 0 22px !important;\r\n  font-size: 14px !important;\r\n  line-height: 38px !important;\r\n  font-weight: 700 !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  box-sizing: border-box !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n  margin: 0 !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\nbody.mc-active .simplesearchform .btn:hover,\r\nbody.mc-active .block_mydashboard button[type=\"submit\"]:hover,\r\nbody.mc-active .block_myoverview button[type=\"submit\"]:hover,\r\nbody.mc-active [data-region=\"courses-view\"] button[type=\"submit\"]:hover,\r\nbody.mc-active [data-action=\"search\"]:hover,\r\nbody.mc-active button[data-coursesearch=\"coursesearch\"]:hover,\r\nbody.mc-active .coursesearch-box button:hover,\r\nbody.mc-active .coursesearch-box .btn:hover {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border-color: var(--mc-accent) !important;\r\n}\r\n\r\n\r\n/* ========================================================\r\n   7. ВЫПАДАЮЩИЕ СПИСКИ (DROPDOWN MENUS), ПОПОВЕРЫ И МОДАЛКИ\r\n   (100% НЕПРОЗРАЧНЫЙ СПЛОШНОЙ ФОН)\r\n   ======================================================== */\r\nbody.mc-active .dropdown-menu,\r\nbody.mc-active .dropdown-menu.show,\r\nbody.mc-active .show > .dropdown-menu,\r\nbody.mc-active .primary-navigation .dropdown-menu,\r\nbody.mc-active .moremenu .dropdown-menu,\r\nbody.mc-active [data-region=\"moremenu\"] .dropdown-menu,\r\nbody.mc-active .navigation .dropdown-menu,\r\nbody.mc-active [data-region=\"moodle-actionmenu\"] .dropdown-menu,\r\nbody.mc-active .action-menu .dropdown-menu,\r\nbody.mc-active .moodle-actionmenu .dropdown-menu,\r\nbody.mc-active .menubar .dropdown-menu,\r\nbody.mc-active .usermenu .dropdown-menu,\r\nbody.mc-active .card .dropdown-menu,\r\nbody.mc-active .dashboard-card .dropdown-menu,\r\nbody.mc-active .coursebox .dropdown-menu,\r\nbody.mc-active .list-group-item .dropdown-menu,\r\nbody.mc-active .block_myoverview .dropdown-menu,\r\nbody.mc-active .block_mydashboard .dropdown-menu,\r\nbody.mc-active [data-region=\"filter\"] .dropdown-menu,\r\nbody.mc-active [data-region=\"display-selector\"] .dropdown-menu,\r\nbody.mc-active [data-region=\"sorting-selector\"] .dropdown-menu,\r\nbody.mc-active [data-region=\"paging-control\"] .dropdown-menu,\r\nbody.mc-active .popover-region-container,\r\nbody.mc-active .popover-region-content,\r\nbody.mc-active .popover,\r\nbody.mc-active .popover-body,\r\nbody.mc-active .moodle-dialogue-base .moodle-dialogue-wrap,\r\nbody.mc-active .modal-content,\r\nbody.mc-active [data-region=\"right-hand-drawer\"],\r\nbody.mc-active .message-app {\r\n  background-color: var(--mc-card-solid, var(--mc-bg-solid, #2B2930)) !important;\r\n  background: var(--mc-card-solid, var(--mc-bg-solid, #2B2930)) !important;\r\n  opacity: 1 !important;\r\n  visibility: visible !important;\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.15)) !important;\r\n  border-radius: var(--mc-radius, 12px) !important;\r\n  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 6px 16px rgba(0, 0, 0, 0.45) !important;\r\n  backdrop-filter: none !important;\r\n  -webkit-backdrop-filter: none !important;\r\n  z-index: 1065 !important;\r\n  color: var(--mc-text) !important;\r\n  min-width: 220px !important;\r\n  max-width: calc(100vw - 32px) !important;\r\n}\r\n\r\nbody.mc-active .popover-region-header,\r\nbody.mc-active .popover-region-footer {\r\n  background-color: transparent !important;\r\n  background: transparent !important;\r\n  border-color: var(--mc-border) !important;\r\n}\r\n\r\n/* Тексты внутри уведомлений и попапов */\r\nbody.mc-active .popover-region-container *,\r\nbody.mc-active .message-app * {\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\nbody.mc-active .content-item-body,\r\nbody.mc-active .notification-message,\r\nbody.mc-active .text-muted,\r\nbody.mc-active .time {\r\n  color: var(--mc-text-muted) !important;\r\n}\r\n\r\n/* Элементы выпадающих списков */\r\nbody.mc-active .dropdown-item {\r\n  color: var(--mc-text) !important;\r\n  background-color: transparent !important;\r\n  background: transparent !important;\r\n  padding: 8px 16px !important;\r\n  font-size: 0.95rem !important;\r\n  border-radius: calc(var(--mc-radius, 12px) - 4px) !important;\r\n  transition: background-color 0.15s ease, color 0.15s ease !important;\r\n  white-space: normal !important;\r\n  line-height: 1.4 !important;\r\n  word-break: break-word !important;\r\n}\r\n\r\nbody.mc-active .dropdown-item:hover,\r\nbody.mc-active .dropdown-item:focus,\r\nbody.mc-active .content-item-container:hover,\r\nbody.mc-active .message-app .list-group-item:hover {\r\n  background-color: var(--mc-accent-container, rgba(255, 255, 255, 0.1)) !important;\r\n  color: var(--mc-on-accent-container, var(--mc-text)) !important;\r\n}\r\n\r\nbody.mc-active .dropdown-item.active,\r\nbody.mc-active .dropdown-item:active,\r\nbody.mc-active .dropdown-item[aria-current=\"true\"],\r\nbody.mc-active .dropdown-item[aria-selected=\"true\"] {\r\n  background-color: var(--mc-accent) !important;\r\n  color: var(--mc-accent-contrast, #ffffff) !important;\r\n  font-weight: 600 !important;\r\n}\r\n\r\nbody.mc-active .dropdown-item.active i,\r\nbody.mc-active .dropdown-item.active .icon,\r\nbody.mc-active .dropdown-item:active i,\r\nbody.mc-active .dropdown-item:active .icon {\r\n  color: var(--mc-accent-contrast, #ffffff) !important;\r\n}\r\n\r\nbody.mc-active .dropdown-divider {\r\n  border-top: 1px solid var(--mc-border) !important;\r\n  opacity: 0.6 !important;\r\n  margin: 4px 0 !important;\r\n}\r\n\r\nbody.mc-active select option,\r\nbody.mc-active .custom-select option {\r\n  background-color: var(--mc-card-solid, #2B2930) !important;\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n\r\n/* ========================================================\r\n   8. ХЕДЕР (NAVBAR) И САЙДБАР (DRAWER)\r\n   ======================================================== */\r\nbody.mc-active .navbar,\r\nbody.mc-active nav.navbar,\r\nbody.mc-active [role=\"banner\"],\r\nbody.mc-active #header,\r\nbody.mc-active header.navbar,\r\nbody.mc-active .navbar.fixed-top,\r\nbody.mc-active .navbar-light.bg-white,\r\nbody.mc-active .navbar-light {\r\n  background-color: var(--mc-bg-navbar) !important;\r\n  backdrop-filter: blur(var(--mc-blur)) !important;\r\n  border-bottom: 1px solid var(--mc-border) !important;\r\n  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4) !important;\r\n  z-index: 1040 !important;\r\n  overflow: visible !important;\r\n}\r\n\r\nbody.mc-active .navbar .nav-link,\r\nbody.mc-active .navbar .site-name,\r\nbody.mc-active .navbar .usertext,\r\nbody.mc-active .navbar .btn-link,\r\nbody.mc-active .navbar .icon,\r\nbody.mc-active #header .nav-link,\r\nbody.mc-active #header .site-name,\r\nbody.mc-active #header .usertext,\r\nbody.mc-active #header .icon,\r\nbody.mc-active .primary-navigation .nav-link {\r\n  color: var(--mc-text) !important;\r\n  font-weight: 600 !important;\r\n  opacity: 0.95 !important;\r\n  background-color: transparent !important;\r\n}\r\n\r\n/* Сброс фона кнопки профиля (userbutton), НЕ затрагивая выпадающее меню */\r\nbody.mc-active .usermenu .userbutton,\r\nbody.mc-active .usermenu .userbutton *,\r\nbody.mc-active .userbutton,\r\nbody.mc-active .userbutton * {\r\n  background-color: transparent !important;\r\n  border: none !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\n/* Гарантия 100% непрозрачности и фона для выпадающего меню пользователя */\r\nbody.mc-active .usermenu .dropdown-menu,\r\nbody.mc-active .userbutton + .dropdown-menu,\r\nbody.mc-active [data-region=\"usermenu\"] .dropdown-menu {\r\n  background-color: var(--mc-card-solid, var(--mc-bg-solid, #2B2930)) !important;\r\n  background: var(--mc-card-solid, var(--mc-bg-solid, #2B2930)) !important;\r\n  opacity: 1 !important;\r\n  visibility: visible !important;\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.15)) !important;\r\n  border-radius: var(--mc-radius, 12px) !important;\r\n  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 6px 16px rgba(0, 0, 0, 0.45) !important;\r\n  z-index: 1065 !important;\r\n}\r\n\r\n/* Только кружок с инициалами красим */\r\nbody.mc-active .usermenu .userinitials,\r\nbody.mc-active .usermenu img.userpicture,\r\nbody.mc-active .userbutton .userinitials,\r\nbody.mc-active .userbutton img.userpicture,\r\nbody.mc-active .avatar.word-initials {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: 50% !important;\r\n  width: 38px !important;\r\n  height: 38px !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n  padding: 0 !important;\r\n  margin: 0 !important;\r\n  box-sizing: border-box !important;\r\n}\r\n\r\nbody.mc-active .navbar .nav-link:hover,\r\nbody.mc-active .navbar .btn-link:hover,\r\nbody.mc-active #header .nav-link:hover,\r\nbody.mc-active .primary-navigation .nav-link:hover {\r\n  background-color: var(--mc-hover-bg) !important;\r\n  color: var(--mc-accent) !important;\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* Активные элементы навигации и меню (включая активную вкладку на островке) */\r\nbody.mc-active .list-group-item.active,\r\nbody.mc-active .nav-link.active,\r\nbody.mc-active .nav-item.active > .nav-link,\r\nbody.mc-active .primary-navigation .nav-link.active,\r\nbody.mc-active .primary-navigation .nav-item.active > .nav-link,\r\nbody.mc-active #header .nav-link.active,\r\nbody.mc-active #header .nav-item.active > .nav-link,\r\nbody.mc-active .drawer-course-index .active,\r\nbody.mc-active .drawer-course-index .active *,\r\nbody.mc-active .currentlink,\r\nbody.mc-active .currentlink *,\r\nbody.mc-active .active_tree_node,\r\nbody.mc-active .active_tree_node * {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border-radius: var(--mc-radius-btn, 20px) !important;\r\n  font-weight: 700 !important;\r\n  opacity: 1 !important;\r\n  border-color: transparent !important;\r\n}\r\n\r\n/* Иконки уведомлений и сообщений в шапке */\r\nbody.mc-active .navbar .popover-region .nav-link,\r\nbody.mc-active .navbar .popover-region .icon,\r\nbody.mc-active #header .popover-region .nav-link,\r\nbody.mc-active #header .popover-region .icon {\r\n  color: var(--mc-text) !important;\r\n  opacity: 0.9 !important;\r\n}\r\n\r\n/* Скроллбары для темной темы */\r\nbody.mc-active ::-webkit-scrollbar {\r\n  width: 8px;\r\n  height: 8px;\r\n}\r\nbody.mc-active ::-webkit-scrollbar-track {\r\n  background: transparent;\r\n}\r\nbody.mc-active ::-webkit-scrollbar-thumb {\r\n  background: var(--mc-border);\r\n  border-radius: 4px;\r\n}\r\nbody.mc-active ::-webkit-scrollbar-thumb:hover {\r\n  background: var(--mc-text-muted);\r\n}\r\n\r\n/* ========================================================\r\n   9. ПЛАШКИ АКТИВНОСТЕЙ И ЗАДАНИЙ (Activity Items)\r\n   ======================================================== */\r\nbody.mc-active .activity-item,\r\nbody.mc-active .course-module,\r\nbody.mc-active .section li.activity,\r\nbody.mc-active .tile,\r\nbody.mc-active .coursebox,\r\nbody.mc-active .activity-basis,\r\nbody.mc-active .activity-wrapper {\r\n  background-color: var(--mc-bg-card) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius-btn) !important;\r\n  padding: 16px !important;\r\n  margin-bottom: 12px !important;\r\n  transition: background-color 0.2s ease, border-color 0.2s ease !important;\r\n}\r\n\r\nbody.mc-active .activity-item:hover,\r\nbody.mc-active .course-module:hover,\r\nbody.mc-active .section li.activity:hover,\r\nbody.mc-active .tile:hover {\r\n  background-color: var(--mc-bg-navbar) !important;\r\n  border-color: var(--mc-text-muted) !important;\r\n}\r\n\r\n/* Убиваем вложенные белые фоны внутри заданий, но сохраняем бейджи и кнопки */\r\nbody.mc-active .activity-item *:not(.badge):not(.btn),\r\nbody.mc-active .course-module *:not(.badge):not(.btn),\r\nbody.mc-active .section li.activity *:not(.badge):not(.btn),\r\nbody.mc-active .tile *:not(.badge):not(.btn) {\r\n  background-color: transparent !important;\r\n}\r\n\r\n/* ========================================================\r\n   9.5. БЕЙДЖИ И ПЛАШКИ (Текущий раздел, статусы)\r\n   ======================================================== */\r\n/* Скрываем навязчивые системные плашки Moodle \"Выделено\" в оглавлении и на странице */\r\nbody.mc-active .current-badge,\r\nbody.mc-active .drawer-course-index .badge,\r\nbody.mc-active #theme_boost-drawers-courseindex .badge,\r\nbody.mc-active .courseindex-item .badge,\r\nbody.mc-active .courseindex-section .badge,\r\nbody.mc-active .courseindex-section-title .badge,\r\nbody.mc-active [data-region=\"section-badges\"],\r\nbody.mc-active .section-badges {\r\n  display: none !important;\r\n}\r\n\r\nbody.mc-active .iscurrent:not(.avatar):not(.avatars),\r\nbody.mc-active .badge:not(.current-badge):not(.avatar),\r\nbody.mc-active .course-content span[class*=\"current\"]:not(.current-badge):not(.avatar) {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border-radius: 12px !important;\r\n  padding: 4px 8px !important;\r\n  font-weight: 600 !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n}\r\n\r\n/* ========================================================\r\n   10. ТАБЛИЦЫ, ЖУРНАЛ ОЦЕНОК (USER GRADE REPORT) И СТАТУСЫ СДАЧИ\r\n   ======================================================== */\r\n/* Сброс CSS-переменных Bootstrap 5 и базовые цвета для всех таблиц */\r\nbody.mc-active table,\r\nbody.mc-active .table,\r\nbody.mc-active .generaltable,\r\nbody.mc-active .user-grade,\r\nbody.mc-active #user-grades,\r\nbody.mc-active .gradereport-user-table,\r\nbody.mc-active .gradingtable {\r\n  --bs-table-bg: transparent !important;\r\n  --bs-table-accent-bg: transparent !important;\r\n  --bs-table-striped-bg: rgba(255, 255, 255, 0.03) !important;\r\n  --bs-table-striped-color: var(--mc-text) !important;\r\n  --bs-table-active-bg: var(--mc-hover-bg, rgba(255, 255, 255, 0.08)) !important;\r\n  --bs-table-active-color: var(--mc-text) !important;\r\n  --bs-table-hover-bg: var(--mc-hover-bg, rgba(255, 255, 255, 0.08)) !important;\r\n  --bs-table-hover-color: var(--mc-text) !important;\r\n  background-color: transparent !important;\r\n  background: transparent !important;\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Ячейки таблиц и снятие Bootstrap 5 inset-теней */\r\nbody.mc-active table th,\r\nbody.mc-active table td,\r\nbody.mc-active .table th,\r\nbody.mc-active .table td,\r\nbody.mc-active .generaltable th,\r\nbody.mc-active .generaltable td,\r\nbody.mc-active .user-grade th,\r\nbody.mc-active .user-grade td,\r\nbody.mc-active #user-grades th,\r\nbody.mc-active #user-grades td,\r\nbody.mc-active .gradereport-user-table th,\r\nbody.mc-active .gradereport-user-table td,\r\nbody.mc-active .gradingtable th,\r\nbody.mc-active .gradingtable td,\r\nbody.mc-active .table > :not(caption) > * > * {\r\n  border-color: var(--mc-border) !important;\r\n  background-color: transparent !important;\r\n  background: transparent !important;\r\n  box-shadow: none !important;\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Липкие колонки (Sticky Column — название задания в журнале оценок) */\r\nbody.mc-active .path-grade-report-user .user-grade tbody th,\r\nbody.mc-active .path-grade-report-user .user-grade tbody td,\r\nbody.mc-active .user-grade tbody th.column-itemname,\r\nbody.mc-active .user-grade tbody th.item,\r\nbody.mc-active .user-grade tbody th[scope=\"row\"],\r\nbody.mc-active #user-grades tbody th,\r\nbody.mc-active table.user-grade th,\r\nbody.mc-active .generaltable th.c0,\r\nbody.mc-active .generaltable td.c0 {\r\n  background-color: var(--mc-card-solid, var(--mc-bg-card, #2B2930)) !important;\r\n  background: var(--mc-card-solid, var(--mc-bg-card, #2B2930)) !important;\r\n  color: var(--mc-text) !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\n/* Полосатые таблицы */\r\nbody.mc-active .table-striped tbody tr:nth-of-type(odd) td,\r\nbody.mc-active .table-striped tbody tr:nth-of-type(odd) th,\r\nbody.mc-active .generaltable tbody tr:nth-of-type(odd) td,\r\nbody.mc-active .generaltable tbody tr:nth-of-type(odd) th,\r\nbody.mc-active .user-grade tbody tr:nth-of-type(odd) td,\r\nbody.mc-active .user-grade tbody tr:nth-of-type(odd) th {\r\n  background-color: rgba(255, 255, 255, 0.03) !important;\r\n  background: rgba(255, 255, 255, 0.03) !important;\r\n}\r\n\r\n/* ЗАЩИТА ОТ БЕЛОГО ВЫДЕЛЕНИЯ НА HOVER / НАВЕДЕНИЕ В ТАБЛИЦАХ И ЖУРНАЛЕ ОЦЕНОК */\r\nbody.mc-active .table-hover tbody tr:hover,\r\nbody.mc-active .table-hover tbody tr:hover > *,\r\nbody.mc-active .table-hover tbody tr:hover td,\r\nbody.mc-active .table-hover tbody tr:hover th,\r\nbody.mc-active .generaltable tbody tr:hover,\r\nbody.mc-active .generaltable tbody tr:hover > *,\r\nbody.mc-active .generaltable tbody tr:hover td,\r\nbody.mc-active .generaltable tbody tr:hover th,\r\nbody.mc-active .user-grade tbody tr:hover,\r\nbody.mc-active .user-grade tbody tr:hover > *,\r\nbody.mc-active .user-grade tbody tr:hover td,\r\nbody.mc-active .user-grade tbody tr:hover th,\r\nbody.mc-active table.user-grade tr:hover td,\r\nbody.mc-active table.user-grade tr:hover th,\r\nbody.mc-active table.user-grade tr:hover > *,\r\nbody.mc-active #user-grades tr:hover td,\r\nbody.mc-active #user-grades tr:hover th,\r\nbody.mc-active #user-grades tr:hover > *,\r\nbody.mc-active .gradereport_user table tr:hover td,\r\nbody.mc-active .gradereport_user table tr:hover th,\r\nbody.mc-active .path-grade-report-user table tr:hover td,\r\nbody.mc-active .path-grade-report-user table tr:hover th,\r\nbody.mc-active .path-grade-report-user table tr:hover > *,\r\nbody.mc-active table tbody tr:hover,\r\nbody.mc-active table tbody tr:hover > *,\r\nbody.mc-active table tbody tr:hover td,\r\nbody.mc-active table tbody tr:hover th,\r\nbody.mc-active tr:hover td,\r\nbody.mc-active tr:hover th,\r\nbody.mc-active tr:hover > *,\r\nbody.mc-active tr.highlight,\r\nbody.mc-active tr.highlighted,\r\nbody.mc-active tr.active,\r\nbody.mc-active tr.selected,\r\nbody.mc-active tr.table-active,\r\nbody.mc-active tr.highlight td,\r\nbody.mc-active tr.highlight th,\r\nbody.mc-active tr.highlighted td,\r\nbody.mc-active tr.highlighted th,\r\nbody.mc-active td.highlight,\r\nbody.mc-active td.highlighted,\r\nbody.mc-active td.active,\r\nbody.mc-active td.selected,\r\nbody.mc-active th.highlight,\r\nbody.mc-active th.highlighted,\r\nbody.mc-active th.active,\r\nbody.mc-active th.selected,\r\nbody.mc-active .table-active,\r\nbody.mc-active .table-active > th,\r\nbody.mc-active .table-active > td,\r\nbody.mc-active .table-light,\r\nbody.mc-active .table-light > th,\r\nbody.mc-active .table-light > td {\r\n  background-color: var(--mc-hover-bg, rgba(255, 255, 255, 0.08)) !important;\r\n  background: var(--mc-hover-bg, rgba(255, 255, 255, 0.08)) !important;\r\n  box-shadow: none !important;\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\n/* Тексты, ссылки и заголовки внутри строк таблицы */\r\nbody.mc-active table tr a,\r\nbody.mc-active .user-grade a,\r\nbody.mc-active .column-itemname a,\r\nbody.mc-active .generaltable a {\r\n  color: var(--mc-text) !important;\r\n  text-decoration: none !important;\r\n}\r\n\r\nbody.mc-active table tr a:hover,\r\nbody.mc-active table tr:hover a,\r\nbody.mc-active .user-grade a:hover,\r\nbody.mc-active .column-itemname a:hover,\r\nbody.mc-active .generaltable a:hover {\r\n  color: var(--mc-accent) !important;\r\n  text-decoration: underline !important;\r\n}\r\n\r\nbody.mc-active table tr *,\r\nbody.mc-active table tr:hover *,\r\nbody.mc-active table tr.highlight *,\r\nbody.mc-active table tr.active * {\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\nbody.mc-active table tr .text-muted,\r\nbody.mc-active table tr:hover .text-muted,\r\nbody.mc-active table tr .small,\r\nbody.mc-active table tr:hover .small,\r\nbody.mc-active table tr small,\r\nbody.mc-active table tr:hover small,\r\nbody.mc-active table tr .dimmed_text,\r\nbody.mc-active table tr:hover .dimmed_text,\r\nbody.mc-active .column-itemname .small,\r\nbody.mc-active .column-itemname small {\r\n  color: var(--mc-text-muted) !important;\r\n  opacity: 0.9 !important;\r\n}\r\n\r\n/* Иконки типов заданий внутри таблиц */\r\nbody.mc-active table .icon,\r\nbody.mc-active table i,\r\nbody.mc-active table img.icon,\r\nbody.mc-active .user-grade .icon,\r\nbody.mc-active .user-grade img.icon {\r\n  filter: var(--mc-icon-filter) !important;\r\n  opacity: 0.9 !important;\r\n}\r\n\r\n/* Цвета статусов (Успешно, Опаздывает, Проверено) */\r\nbody.mc-active .table-success td, body.mc-active .table-success th, body.mc-active tr.success td,\r\nbody.mc-active .alert-success {\r\n  background-color: rgba(40, 167, 69, 0.15) !important;\r\n  color: #81c784 !important;\r\n}\r\n\r\nbody.mc-active .table-warning td, body.mc-active .table-warning th, body.mc-active tr.warning td,\r\nbody.mc-active .alert-warning {\r\n  background-color: rgba(255, 193, 7, 0.15) !important;\r\n  color: #ffd54f !important;\r\n}\r\n\r\nbody.mc-active .table-danger td, body.mc-active .table-danger th, body.mc-active tr.danger td,\r\nbody.mc-active .alert-danger {\r\n  background-color: rgba(220, 53, 69, 0.15) !important;\r\n  color: #e57373 !important;\r\n}\r\n\r\nbody.mc-active .table-info td, body.mc-active .table-info th, body.mc-active tr.info td,\r\nbody.mc-active .alert-info {\r\n  background-color: rgba(23, 162, 184, 0.15) !important;\r\n  color: #4dd0e1 !important;\r\n}\r\n\r\n\r\n/* ========================================================\r\n   PWA ВАЙБ (СЕТКА, КАРТОЧКИ, HEADER, DROPDOWN, FAB)\r\n   ======================================================== */\r\n\r\n/* 1. Скрываем боковую панель только на дашборде, но сохраняем оглавление на страницах курсов */\r\nbody.mc-active#page-my-index .drawer-left,\r\nbody.mc-active.path-my .drawer-left {\r\n  display: none !important;\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   КОМПАКТНОЕ ОГЛАВЛЕНИЕ КУРСА (COURSE INDEX DRAWER)\r\n   ──────────────────────────────────────────────────────── */\r\n/* 1. Ширина боковой панели оглавления — делаем аккуратную компактную колонку */\r\nbody.mc-active #theme_boost-drawers-courseindex,\r\nbody.mc-active .drawer.drawer-left.drawer-course-index,\r\nbody.mc-active .drawer.drawer-left {\r\n  width: 270px !important;\r\n  max-width: 270px !important;\r\n  background-color: var(--mc-bg-drawer, var(--mc-bg-card-low)) !important;\r\n  border-right: 1px solid var(--mc-border) !important;\r\n  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.25) !important;\r\n}\r\n\r\nbody.mc-active .drawer.drawer-left .drawerheader,\r\nbody.mc-active #theme_boost-drawers-courseindex .drawerheader {\r\n  height: 48px !important;\r\n  min-height: 48px !important;\r\n  max-height: 48px !important;\r\n  padding: 0 12px !important;\r\n  background-color: var(--mc-bg-drawer, var(--mc-bg-card-low)) !important;\r\n  border-bottom: 1px solid var(--mc-border) !important;\r\n}\r\n\r\nbody.mc-active .drawer.drawer-left .drawertoggle,\r\nbody.mc-active #theme_boost-drawers-courseindex .drawertoggle,\r\nbody.mc-active .drawer.drawer-left .btn,\r\nbody.mc-active #theme_boost-drawers-courseindex .btn {\r\n  color: var(--mc-text) !important;\r\n  background: transparent !important;\r\n  border: none !important;\r\n}\r\n\r\nbody.mc-active .drawer.drawer-left .drawercontent,\r\nbody.mc-active #theme_boost-drawers-courseindex .drawercontent,\r\nbody.mc-active [data-region=\"courseindex\"],\r\nbody.mc-active .courseindex {\r\n  padding: 8px 10px !important;\r\n  background-color: transparent !important;\r\n  border: none !important;\r\n}\r\n\r\n/* Сбрасываем ВСЕ дефолтные красные рамки РАНХиГС в оглавлении */\r\nbody.mc-active .drawer-course-index *,\r\nbody.mc-active #theme_boost-drawers-courseindex *,\r\nbody.mc-active .drawer.drawer-left *,\r\nbody.mc-active [data-region=\"courseindex\"] *,\r\nbody.mc-active .courseindex * {\r\n  border-color: transparent !important;\r\n  outline: none !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\n/* 2. Сброс раздутых отступов у секций оглавления */\r\nbody.mc-active .courseindex-section,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-section {\r\n  background: transparent !important;\r\n  background-color: transparent !important;\r\n  border: none !important;\r\n  outline: none !important;\r\n  box-shadow: none !important;\r\n  padding: 0 !important;\r\n  margin: 0 0 2px 0 !important;\r\n  border-radius: 0 !important;\r\n}\r\n\r\n/* Вложенный список активностей внутри секции */\r\nbody.mc-active .courseindex-sectioncontent,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-sectioncontent {\r\n  padding-left: 12px !important;\r\n  margin: 0 0 4px 0 !important;\r\n  border-left: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1)) !important;\r\n}\r\n\r\n/* 3. Компактные элементы (пункты секций и активностей) */\r\nbody.mc-active .courseindex-item,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item {\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  padding: 4px 8px !important;\r\n  margin: 1px 0 !important;\r\n  border-radius: 6px !important;\r\n  border: 1px solid transparent !important;\r\n  min-height: 28px !important;\r\n  transition: all 0.15s ease !important;\r\n  background-color: transparent !important;\r\n}\r\n\r\nbody.mc-active .courseindex-link,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-link {\r\n  color: var(--mc-text) !important;\r\n  font-size: 13px !important;\r\n  line-height: 1.25 !important;\r\n  font-weight: 600 !important;\r\n  padding: 0 !important;\r\n  margin: 0 !important;\r\n  border: none !important;\r\n  text-decoration: none !important;\r\n  overflow: hidden !important;\r\n  text-overflow: ellipsis !important;\r\n  white-space: nowrap !important;\r\n  flex: 1 !important;\r\n}\r\n\r\n/* Иконка шеврона/сворачивания */\r\nbody.mc-active .courseindex-chevron,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-chevron,\r\nbody.mc-active .courseindex-item [data-action=\"toggle\"] {\r\n  width: 18px !important;\r\n  height: 18px !important;\r\n  font-size: 11px !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n  margin-right: 4px !important;\r\n  color: var(--mc-text) !important;\r\n  opacity: 0.7 !important;\r\n}\r\n\r\n/* 4. Наведение на пункт оглавления */\r\nbody.mc-active .courseindex-item:hover,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item:hover {\r\n  background-color: var(--mc-bg-card, rgba(255, 255, 255, 0.08)) !important;\r\n}\r\n\r\nbody.mc-active .courseindex-item:hover .courseindex-link,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item:hover .courseindex-link {\r\n  color: var(--mc-accent) !important;\r\n}\r\n\r\n/* 5. Активный/текущий пункт — подсвечиваем ТОЛЬКО конкретную строчку, а не всю секцию */\r\nbody.mc-active .courseindex-item.current,\r\nbody.mc-active .courseindex-item.pageitem,\r\nbody.mc-active .courseindex-item.active,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item.current,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item.pageitem,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item.active {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border: 1px solid var(--mc-accent) !important;\r\n  border-left: 3px solid var(--mc-accent) !important;\r\n  border-radius: 6px !important;\r\n}\r\n\r\nbody.mc-active .courseindex-item.current *,\r\nbody.mc-active .courseindex-item.pageitem *,\r\nbody.mc-active .courseindex-item.active *,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item.current *,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item.pageitem *,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-item.active * {\r\n  color: var(--mc-on-accent-container) !important;\r\n}\r\n\r\n/* ГАРАНТИЯ: родительский контейнер секции никогда не заливается фоном активного элемента */\r\nbody.mc-active .courseindex-section.current,\r\nbody.mc-active .courseindex-section.pageitem,\r\nbody.mc-active .courseindex-section.active,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-section.current,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-section.pageitem,\r\nbody.mc-active [data-region=\"courseindex\"] .courseindex-section.active {\r\n  background-color: transparent !important;\r\n  background: transparent !important;\r\n  border: none !important;\r\n  box-shadow: none !important;\r\n  padding: 0 !important;\r\n}\r\n\r\n/* ========================================================\r\n   ОФОРМЛЕНИЕ СТРАНИЦЫ КУРСА В СДО (ТОЧНО КАК В ПЕСОЧНИЦЕ)\r\n   ======================================================== */\r\nbody.mc-active .course-content ul.topics > li.section,\r\nbody.mc-active .course-content ul.weeks > li.section,\r\nbody.mc-active .course-content .section.main,\r\nbody.mc-active li.section.main,\r\nbody.mc-active #region-main .course-content .section.main {\r\n  background-color: var(--mc-bg-card) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius, 20px) !important;\r\n  padding: 24px !important;\r\n  margin-bottom: 24px !important;\r\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;\r\n  list-style: none !important;\r\n}\r\n\r\n/* Сбрасываем вложенные контейнеры секции, чтобы не было вложенных рамок */\r\nbody.mc-active li.section .course-section,\r\nbody.mc-active li.section .content,\r\nbody.mc-active li.section ul.section,\r\nbody.mc-active li.section .course-sectionbox {\r\n  background: transparent !important;\r\n  border: none !important;\r\n  box-shadow: none !important;\r\n  padding: 0 !important;\r\n  margin: 0 !important;\r\n}\r\n\r\nbody.mc-active .course-content ul.topics,\r\nbody.mc-active .course-content ul.weeks {\r\n  padding-left: 0 !important;\r\n  margin-left: 0 !important;\r\n}\r\n\r\nbody.mc-active .course-content .section.main::before,\r\nbody.mc-active .course-content .section.main::after,\r\nbody.mc-active li.section::before,\r\nbody.mc-active li.section::after {\r\n  display: none !important;\r\n}\r\n\r\n/* Заголовок секции (Общее, Тема 1...) */\r\nbody.mc-active .sectionname,\r\nbody.mc-active .sectionname a,\r\nbody.mc-active .section-title,\r\nbody.mc-active .section-title a,\r\nbody.mc-active .course-section-header,\r\nbody.mc-active .course-content .section-title h3,\r\nbody.mc-active .course-content h3.sectionname {\r\n  font-size: 1.25rem !important;\r\n  font-weight: 800 !important;\r\n  color: var(--mc-text) !important;\r\n  margin-bottom: 18px !important;\r\n  background: transparent !important;\r\n  background-color: transparent !important;\r\n  border: none !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\n/* Кнопка \"Свернуть все\" / \"Развернуть все\" */\r\nbody.mc-active .collapseall,\r\nbody.mc-active .expandall,\r\nbody.mc-active [data-action=\"collapse-all\"],\r\nbody.mc-active .section-collapsemenu button {\r\n  background: transparent !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius-btn, 20px) !important;\r\n  color: var(--mc-text-muted) !important;\r\n  font-size: 11px !important;\r\n  padding: 4px 10px !important;\r\n  transition: all 0.2s ease !important;\r\n}\r\n\r\nbody.mc-active .collapseall:hover,\r\nbody.mc-active .expandall:hover,\r\nbody.mc-active .section-collapsemenu button:hover {\r\n  color: var(--mc-text) !important;\r\n  border-color: var(--mc-accent) !important;\r\n}\r\n\r\n/* Сбрасываем внешние обертки Moodle вокруг элементов активности, чтобы НЕ БЫЛО вложенных рамок */\r\nbody.mc-active .section li.activity,\r\nbody.mc-active .course-module,\r\nbody.mc-active .activity-wrapper,\r\nbody.mc-active .activity-basis,\r\nbody.mc-active .activity-instance,\r\nbody.mc-active .activity-item .activity-basis,\r\nbody.mc-active .activity-item .activity-instance {\r\n  background: transparent !important;\r\n  border: none !important;\r\n  box-shadow: none !important;\r\n  padding: 0 !important;\r\n  margin: 0 !important;\r\n}\r\n\r\nbody.mc-active .section li.activity {\r\n  margin-bottom: 10px !important;\r\n  list-style: none !important;\r\n}\r\n\r\n/* ЕДИНСТВЕННАЯ чистая карточка активности (ровно как в песочнице) */\r\nbody.mc-active .activity-item {\r\n  background-color: var(--mc-bg-card-low) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: 12px !important;\r\n  padding: 14px 18px !important;\r\n  margin-bottom: 0 !important;\r\n  transition: transform 0.2s ease, border-color 0.2s ease !important;\r\n  display: flex !important;\r\n  flex-direction: column !important;\r\n  gap: 8px !important;\r\n}\r\n\r\nbody.mc-active .activity-item:hover {\r\n  border-color: var(--mc-accent) !important;\r\n  transform: translateX(4px) !important;\r\n}\r\n\r\n/* Описание и даты активности делаем аккуратными и приглушенными */\r\nbody.mc-active .activity-item .activity-dates,\r\nbody.mc-active .activity-item .activity-information,\r\nbody.mc-active .activity-item .description,\r\nbody.mc-active .activity-item .contentafterlink {\r\n  font-size: 12px !important;\r\n  color: var(--mc-text-muted) !important;\r\n  margin-top: 4px !important;\r\n  line-height: 1.4 !important;\r\n  border: none !important;\r\n  background: transparent !important;\r\n}\r\n\r\n/* Бейджи для заданий (БРС, Задание, Материал, Тест) */\r\nbody.mc-active .mc-act-badge {\r\n  background: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  font-size: 11px !important;\r\n  font-weight: 800 !important;\r\n  padding: 3px 8px !important;\r\n  border-radius: 6px !important;\r\n  margin-right: 10px !important;\r\n  display: inline-block !important;\r\n  vertical-align: middle !important;\r\n  letter-spacing: 0.3px !important;\r\n  text-transform: uppercase !important;\r\n}\r\n\r\n/* Чипсы курса (семестр, препод, группа) */\r\nbody.mc-active .mc-course-chips {\r\n  display: flex !important;\r\n  flex-wrap: wrap !important;\r\n  gap: 8px !important;\r\n  margin-top: 6px !important;\r\n  margin-bottom: 14px !important;\r\n}\r\n\r\nbody.mc-active .mc-chip {\r\n  background: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  font-size: 12px !important;\r\n  font-weight: 700 !important;\r\n  padding: 4px 10px !important;\r\n  border-radius: 8px !important;\r\n  border: 1px solid var(--mc-border, transparent) !important;\r\n}\r\n\r\n/* Прогресс-бар курса в шапке */\r\nbody.mc-active .mc-course-prog-box {\r\n  display: flex !important;\r\n  flex-direction: column !important;\r\n  gap: 6px !important;\r\n  margin-top: 8px !important;\r\n  margin-bottom: 16px !important;\r\n}\r\n\r\nbody.mc-active .mc-course-prog-box .course-prog-text {\r\n  font-size: 13px !important;\r\n  font-weight: 700 !important;\r\n  color: var(--mc-text) !important;\r\n}\r\n\r\nbody.mc-active .mc-course-prog-box .course-prog-text strong {\r\n  color: var(--mc-accent) !important;\r\n}\r\n\r\n/* Вкладки навигации курса (Курс, Настройки, Оценки) */\r\nbody.mc-active #page-header {\r\n  margin-bottom: 6px !important;\r\n  padding-bottom: 0 !important;\r\n}\r\n\r\nbody.mc-active .secondary-navigation,\r\nbody.mc-active [data-region=\"secondary-navigation\"] {\r\n  margin-top: 14px !important;\r\n  margin-bottom: 24px !important;\r\n  padding: 0 !important;\r\n  background: transparent !important;\r\n  border: none !important;\r\n  display: block !important;\r\n  visibility: visible !important;\r\n  clear: both !important;\r\n}\r\n\r\nbody.mc-active .secondary-navigation .nav-tabs,\r\nbody.mc-active .secondary-navigation ul.more-nav,\r\nbody.mc-active [data-region=\"secondary-navigation\"] .nav-tabs,\r\nbody.mc-active [data-region=\"secondary-navigation\"] ul.more-nav {\r\n  border-bottom: 1px solid var(--mc-border) !important;\r\n  gap: 12px !important;\r\n  padding-bottom: 16px !important;\r\n  margin-top: 0 !important;\r\n  margin-bottom: 0 !important;\r\n  display: flex !important;\r\n  flex-wrap: wrap !important;\r\n  align-items: center !important;\r\n  visibility: visible !important;\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* Принудительно показываем все вкладки курса (\"Курс\", \"Оценки\" и др.) с зазором между ними */\r\nbody.mc-active .secondary-navigation .nav-tabs > li:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]),\r\nbody.mc-active .secondary-navigation .nav-tabs > li.d-none:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]),\r\nbody.mc-active .secondary-navigation ul.more-nav > li:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]),\r\nbody.mc-active .secondary-navigation ul.more-nav > li.d-none:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]),\r\nbody.mc-active [data-region=\"secondary-navigation\"] .nav-tabs > li:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]),\r\nbody.mc-active [data-region=\"secondary-navigation\"] .nav-tabs > li.d-none:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]),\r\nbody.mc-active [data-region=\"secondary-navigation\"] ul.more-nav > li:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]),\r\nbody.mc-active [data-region=\"secondary-navigation\"] ul.more-nav > li.d-none:not([data-region=\"morebutton\"]):not(.dropdown-moremenu):not([data-key=\"moremenu\"]) {\r\n  display: inline-flex !important;\r\n  visibility: visible !important;\r\n  opacity: 1 !important;\r\n  margin: 0 !important;\r\n  margin-right: 12px !important;\r\n}\r\n\r\nbody.mc-active .secondary-navigation .nav-tabs > li:last-child,\r\nbody.mc-active .secondary-navigation ul.more-nav > li:last-child,\r\nbody.mc-active [data-region=\"secondary-navigation\"] .nav-tabs > li:last-child,\r\nbody.mc-active [data-region=\"secondary-navigation\"] ul.more-nav > li:last-child {\r\n  margin-right: 0 !important;\r\n}\r\n\r\n/* Скрываем кнопку \"Больше...\" во вторичной навигации, так как все вкладки уже развернуты */\r\nbody.mc-active .secondary-navigation li[data-region=\"morebutton\"],\r\nbody.mc-active .secondary-navigation li.dropdown-moremenu,\r\nbody.mc-active .secondary-navigation li[data-key=\"moremenu\"],\r\nbody.mc-active [data-region=\"secondary-navigation\"] li[data-region=\"morebutton\"],\r\nbody.mc-active [data-region=\"secondary-navigation\"] li.dropdown-moremenu,\r\nbody.mc-active [data-region=\"secondary-navigation\"] li[data-key=\"moremenu\"] {\r\n  display: none !important;\r\n  visibility: hidden !important;\r\n  opacity: 0 !important;\r\n  pointer-events: none !important;\r\n  width: 0 !important;\r\n  height: 0 !important;\r\n  margin: 0 !important;\r\n  padding: 0 !important;\r\n}\r\n\r\nbody.mc-active .secondary-navigation .nav-link,\r\nbody.mc-active [data-region=\"secondary-navigation\"] .nav-link {\r\n  border-radius: var(--mc-radius-btn, 24px) !important;\r\n  padding: 8px 20px !important;\r\n  font-weight: 700 !important;\r\n  font-size: 13px !important;\r\n  background-color: var(--mc-bg-card-low) !important;\r\n  color: var(--mc-text) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  transition: all 0.2s ease !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  gap: 6px !important;\r\n  visibility: visible !important;\r\n  opacity: 1 !important;\r\n  text-decoration: none !important;\r\n  margin: 0 !important;\r\n  margin-bottom: 0 !important;\r\n}\r\n\r\nbody.mc-active .secondary-navigation .nav-link:hover,\r\nbody.mc-active [data-region=\"secondary-navigation\"] .nav-link:hover {\r\n  background-color: rgba(255, 255, 255, 0.08) !important;\r\n}\r\n\r\nbody.mc-active .secondary-navigation .nav-link.active,\r\nbody.mc-active .secondary-navigation li.active > .nav-link,\r\nbody.mc-active [data-region=\"secondary-navigation\"] .nav-link.active,\r\nbody.mc-active [data-region=\"secondary-navigation\"] li.active > .nav-link {\r\n  background-color: var(--mc-accent) !important;\r\n  color: var(--mc-accent-contrast) !important;\r\n  border-color: var(--mc-accent) !important;\r\n}\r\n\r\nbody.mc-active #page.drawers.show-drawer-left .drawer-toggles .drawer-left-toggle,\r\nbody.mc-active #page.drawers.show-drawer-left .drawer-left-toggle {\r\n  display: none !important;\r\n}\r\n\r\nbody.mc-active .drawer-toggles .drawer-left-toggle .btn {\r\n  width: 46px !important;\r\n  height: 52px !important;\r\n  min-height: 52px !important;\r\n  border-radius: 20px !important;\r\n  padding: 0 !important;\r\n  margin: 0 !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n  background-color: var(--mc-bg-navbar, var(--mc-bg-card)) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;\r\n}\r\n\r\nbody.mc-active.mc-nav-height-compact .drawer-toggles .drawer-left-toggle .btn {\r\n  height: 44px !important;\r\n  min-height: 44px !important;\r\n}\r\n\r\nbody.mc-active.mc-nav-height-tall .drawer-toggles .drawer-left-toggle .btn {\r\n  height: 60px !important;\r\n  min-height: 60px !important;\r\n}\r\n\r\n/* Гарантия корректных отступов страницы от фиксированного хедера и сайдбара */\r\nbody.mc-active #page.drawers {\r\n  margin-top: 60px !important;\r\n}\r\nbody.mc-active.drawer-open-left #page.drawers {\r\n  margin-left: 270px !important;\r\n}\r\nbody.mc-active#page-my-index #page.drawers,\r\nbody.mc-active#page-my-index #page-wrapper {\r\n  margin-left: 0 !important;\r\n  padding-left: 0 !important;\r\n}\r\n/* Фикс дублирующихся курсов (Moodle рендерит и десктоп и мобайл версии одновременно) */\r\nbody.mc-active .mydashboard-mobile,\r\nbody.mc-active .block_mydashboard .mobile,\r\nbody.mc-active .block_mydashboard .d-md-none,\r\nbody.mc-active .block_mydashboard .hidden-desktop,\r\nbody.mc-active .block_mydashboard .visible-phone,\r\nbody.mc-active .block_mydashboard .visible-xs,\r\nbody.mc-active .block_mydashboard .visible-sm,\r\nbody.mc-active .list-group.d-md-none,\r\nbody.mc-active .list-group-item.d-md-none,\r\nbody.mc-active .list-group-item.mobile,\r\nbody.mc-active .list-group-item[data-region=\"mobile\"] {\r\n  display: none !important;\r\n}\r\n\r\n/* 2. Шапка (Header) и верхняя навигация */\r\nbody.mc-active .primary-navigation {\r\n  display: flex !important;\r\n  align-items: center !important;\r\n}\r\nbody.mc-active .primary-navigation .navigation .nav-link {\r\n  color: var(--mc-text) !important;\r\n  font-weight: 600 !important;\r\n  border-radius: 12px !important;\r\n  padding: 8px 14px !important;\r\n  margin: 0 4px !important;\r\n  transition: all 0.2s ease !important;\r\n}\r\nbody.mc-active .primary-navigation .navigation .nav-link:hover {\r\n  background-color: rgba(255, 255, 255, 0.08) !important;\r\n  color: var(--mc-accent) !important;\r\n}\r\nbody.mc-active .primary-navigation .navigation .nav-link.active {\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n}\r\n\r\n/* 3. Дропдаун профиля (фиксы фона) */\r\nbody.mc-active .usermenu .dropdown-menu {\r\n  background-color: var(--mc-card-solid, var(--mc-bg-solid, #2B2930)) !important;\r\n  background: var(--mc-card-solid, var(--mc-bg-solid, #2B2930)) !important;\r\n  opacity: 1 !important;\r\n  backdrop-filter: none !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius, 16px) !important;\r\n  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55) !important;\r\n}\r\n/* Аватарка (кругляшок) - гарантируем чистый круг без лишних фонов и рамок */\r\nbody.mc-active .avatar.current,\r\nbody.mc-active .avatar,\r\nbody.mc-active .avatars,\r\nbody.mc-active span.avatar,\r\nbody.mc-active .page-header-image,\r\nbody.mc-active .page-header-image a,\r\nbody.mc-active a.userpicture,\r\nbody.mc-active a.aabtn,\r\nbody.mc-active .userbutton a {\r\n  background-color: transparent !important;\r\n  background: transparent !important;\r\n  border: none !important;\r\n  outline: none !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\nbody.mc-active .avatar.current::before, \r\nbody.mc-active .avatar.current::after,\r\nbody.mc-active .avatars::before,\r\nbody.mc-active .avatars::after,\r\nbody.mc-active .avatar::before,\r\nbody.mc-active .avatar::after {\r\n  display: none !important;\r\n  content: none !important;\r\n}\r\n\r\nbody.mc-active .userinitials, \r\nbody.mc-active .userpicture.userinitials,\r\nbody.mc-active img.userpicture,\r\nbody.mc-active .userpicture img {\r\n  background: var(--mc-accent-container) !important;\r\n  background-color: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  border-radius: 50% !important;\r\n  border: none !important;\r\n  box-shadow: none !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n}\r\n\r\n/* 4. Карточки курсов (Grid) */\r\nbody.mc-active .block_mydashboard .list-group,\r\nbody.mc-active [data-region=\"course-content\"] .list-group,\r\nbody.mc-active .mydashboard-desktop {\r\n  display: grid !important;\r\n  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;\r\n  gap: 20px !important;\r\n  flex-direction: row !important;\r\n  border: none !important;\r\n  background: transparent !important;\r\n}\r\n\r\n@media (max-width: 1050px) {\r\n  body.mc-active .block_mydashboard .list-group,\r\n  body.mc-active [data-region=\"course-content\"] .list-group,\r\n  body.mc-active .mydashboard-desktop {\r\n    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)) !important;\r\n  }\r\n}\r\n\r\nbody.mc-active .list-group-item.mydashboard-list-item,\r\nbody.mc-active .dashboard-card,\r\nbody.mc-active .dashboard-card-deck .dashboard-card,\r\nbody.mc-active [data-region=\"card-deck\"] .card,\r\nbody.mc-active [data-region=\"courses-view\"] .card {\r\n  border-radius: var(--mc-radius, 20px) !important;\r\n  overflow: hidden !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  background: var(--mc-bg-card) !important;\r\n  padding: 24px !important;\r\n  display: flex !important;\r\n  flex-direction: column !important;\r\n  min-height: 310px !important;\r\n  box-sizing: border-box !important;\r\n  height: 100% !important;\r\n  margin-bottom: 0 !important;\r\n  box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;\r\n  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease, border-color 0.2s ease !important;\r\n  position: relative !important;\r\n}\r\n\r\nbody.mc-active .list-group-item.mydashboard-list-item:hover,\r\nbody.mc-active .dashboard-card:hover,\r\nbody.mc-active .dashboard-card-deck .dashboard-card:hover,\r\nbody.mc-active [data-region=\"card-deck\"] .card:hover,\r\nbody.mc-active [data-region=\"courses-view\"] .card:hover {\r\n  box-shadow: 0 12px 32px rgba(0,0,0,0.4) !important;\r\n  border-color: var(--mc-accent) !important;\r\n}\r\n\r\n/* Обложка курса на всю ширину верхней части */\r\nbody.mc-active .mc-course-cover {\r\n  position: absolute !important;\r\n  top: 0 !important;\r\n  left: 0 !important;\r\n  right: 0 !important;\r\n  height: 120px !important;\r\n  border-radius: calc(var(--mc-radius, 20px) - 1px) calc(var(--mc-radius, 20px) - 1px) 0 0 !important;\r\n  background-size: cover !important;\r\n  background-position: center !important;\r\n  opacity: 0.9 !important;\r\n  z-index: 1 !important;\r\n  display: block !important;\r\n}\r\nbody.mc-active .list-group-item.mydashboard-list-item {\r\n  padding-top: 144px !important; /* Отступ под обложку */\r\n  overflow: hidden !important; /* Чтобы обложка не вылезала за радиус */\r\n}\r\n\r\n/* Полностью скрываем старые бейджи (Текущий) и кафедру, они мусорят интерфейс */\r\nbody.mc-active .mydashboard-statuses,\r\nbody.mc-active .mydashboard-course-category {\r\n  display: none !important;\r\n}\r\n\r\n/* Закладка (Избранное) перемещаем строго вниз и вправо */\r\nbody.mc-active .mydashboard-menu-box,\r\nbody.mc-active .mydahboard-menu-box {\r\n  position: absolute !important;\r\n  bottom: 24px !important;\r\n  right: 24px !important;\r\n  top: auto !important;\r\n  z-index: 10 !important;\r\n}\r\n\r\nbody.mc-active .btn-favourite {\r\n  background: transparent !important;\r\n  border: none !important;\r\n  padding: 0 !important;\r\n  cursor: pointer !important;\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n}\r\n\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydashboard-menu-box,\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydashboard-menu-box *,\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydashboard-menu-box *::before,\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydashboard-menu-box *::after,\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydahboard-menu-box,\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydahboard-menu-box *,\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydahboard-menu-box *::before,\r\nbody.mc-active .list-group-item.mydashboard-list-item .mydahboard-menu-box *::after,\r\nbody.mc-active .list-group-item.mydashboard-list-item [class*=\"menu-box\"],\r\nbody.mc-active .list-group-item.mydashboard-list-item [class*=\"menu-box\"] *,\r\nbody.mc-active .list-group-item.mydashboard-list-item [class*=\"menu-box\"] *::before,\r\nbody.mc-active .list-group-item.mydashboard-list-item [class*=\"menu-box\"] *::after,\r\nbody.mc-active .list-group-item.mydashboard-list-item a:not(.mydashboard-coursename):not(.mc-fab-button),\r\nbody.mc-active .list-group-item.mydashboard-list-item a:not(.mydashboard-coursename):not(.mc-fab-button) *,\r\nbody.mc-active .list-group-item.mydashboard-list-item a:not(.mydashboard-coursename):not(.mc-fab-button) *::before,\r\nbody.mc-active .list-group-item.mydashboard-list-item a:not(.mydashboard-coursename):not(.mc-fab-button) *::after,\r\nbody.mc-active .list-group-item.mydashboard-list-item button,\r\nbody.mc-active .list-group-item.mydashboard-list-item button *,\r\nbody.mc-active .list-group-item.mydashboard-list-item button *::before,\r\nbody.mc-active .list-group-item.mydashboard-list-item button *::after,\r\nbody.mc-active .btn-favourite,\r\nbody.mc-active .btn-favourite i,\r\nbody.mc-active .btn-favourite svg,\r\nbody.mc-active .btn-favourite img,\r\nbody.mc-active .btn-favourite .icon,\r\nbody.mc-active .btn-favourite *::before,\r\nbody.mc-active .btn-favourite *::after,\r\nbody.mc-active .mydashboard-menu-box .btn-favourite,\r\nbody.mc-active .mydashboard-menu-box i,\r\nbody.mc-active .mydashboard-menu-box svg,\r\nbody.mc-active .mydahboard-menu-box .btn-favourite,\r\nbody.mc-active .mydahboard-menu-box i,\r\nbody.mc-active .mydahboard-menu-box svg,\r\nbody.mc-active [class*=\"bookmark\"]:not([class*=\"nav\"]):not([class*=\"pill\"]):not(.rounded-pill),\r\nbody.mc-active [class*=\"bookmark\"]:not([class*=\"nav\"]):not([class*=\"pill\"]):not(.rounded-pill) *,\r\nbody.mc-active [class*=\"bookmark\"]:not([class*=\"nav\"]):not([class*=\"pill\"]):not(.rounded-pill) *::before,\r\nbody.mc-active [class*=\"bookmark\"]:not([class*=\"nav\"]):not([class*=\"pill\"]):not(.rounded-pill) *::after,\r\nbody.mc-active .btn-favourite,\r\nbody.mc-active .btn-favourite i,\r\nbody.mc-active .btn-favourite svg,\r\nbody.mc-active .btn-favourite img,\r\nbody.mc-active .btn-favourite .icon,\r\nbody.mc-active .btn-favourite *::before,\r\nbody.mc-active .btn-favourite *::after,\r\nbody.mc-active .mydashboard-menu-box .btn-favourite,\r\nbody.mc-active .mydashboard-menu-box i,\r\nbody.mc-active .mydashboard-menu-box svg,\r\nbody.mc-active .mydahboard-menu-box .btn-favourite,\r\nbody.mc-active .mydahboard-menu-box i,\r\nbody.mc-active i.fa-bookmark,\r\nbody.mc-active i.fa-bookmark-o,\r\nbody.mc-active .fa-bookmark,\r\nbody.mc-active .fa-bookmark-o {\r\n  color: var(--mc-text) !important;\r\n  fill: currentColor !important;\r\n  stroke: currentColor !important;\r\n  filter: none !important;\r\n  opacity: 0.8 !important;\r\n  transition: all 0.2s ease !important;\r\n}\r\n\r\nbody.mc-active .btn-favourite:hover,\r\nbody.mc-active .btn-favourite:hover i,\r\nbody.mc-active .btn-favourite:hover svg,\r\nbody.mc-active .mydashboard-menu-box:hover i,\r\nbody.mc-active .mydahboard-menu-box:hover i,\r\nbody.mc-active i.fa-bookmark:hover,\r\nbody.mc-active i.fa-bookmark-o:hover {\r\n  color: var(--mc-accent) !important;\r\n  fill: var(--mc-accent) !important;\r\n  stroke: var(--mc-accent) !important;\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* Активная закладка (курс добавлен в избранное) */\r\nbody.mc-active .btn-favourite.active,\r\nbody.mc-active .btn-favourite.active i,\r\nbody.mc-active .btn-favourite.active svg,\r\nbody.mc-active .btn-favourite.favourited,\r\nbody.mc-active .btn-favourite.favourited i,\r\nbody.mc-active .btn-favourite.favourited svg,\r\nbody.mc-active i.fa-bookmark:not(.fa-bookmark-o) {\r\n  color: var(--mc-accent) !important;\r\n  fill: var(--mc-accent) !important;\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* Устранение дублирующих закладок в карточках курсов (режим \"карточки\" / дашборд) */\r\nbody.mc-active .dashboard-card [data-region=\"favourite-icon\"],\r\nbody.mc-active .list-group-item [data-region=\"favourite-icon\"],\r\nbody.mc-active [data-region=\"course-content\"] [data-region=\"favourite-icon\"],\r\nbody.mc-active .course-listitem [data-region=\"favourite-icon\"],\r\nbody.mc-active .dashboard-card .favourite-icon,\r\nbody.mc-active .list-group-item .favourite-icon,\r\nbody.mc-active [data-region=\"course-content\"] .favourite-icon,\r\nbody.mc-active .course-listitem .favourite-icon {\r\n  display: none !important;\r\n}\r\n\r\nbody.mc-active .hidden,\r\nbody.mc-active [data-region=\"favourite-icon\"].hidden,\r\nbody.mc-active .favourite-icon.hidden {\r\n  display: none !important;\r\n  visibility: hidden !important;\r\n}\r\n\r\n/* Если внутри кнопки .btn-favourite лежат обе иконки (outline и filled), переключаем их по классу active */\r\nbody.mc-active .btn-favourite:not(.active):not(.favourited) .fa-bookmark:not(.fa-bookmark-o) {\r\n  display: none !important;\r\n}\r\n\r\nbody.mc-active .btn-favourite.active .fa-bookmark-o,\r\nbody.mc-active .btn-favourite.favourited .fa-bookmark-o {\r\n  display: none !important;\r\n}\r\n\r\n/* Заголовок курса (Теперь с чипсами!) */\r\nbody.mc-active .mydashboard-course {\r\n  order: 1 !important;\r\n  margin-bottom: 8px !important;\r\n  padding-right: 0 !important;\r\n  display: flex !important;\r\n  flex-direction: column !important;\r\n  flex: 1 !important; /* Растягиваем, чтобы прогресс-бар ушел вниз */\r\n}\r\nbody.mc-active .mydashboard-coursename {\r\n  text-decoration: none !important;\r\n  display: flex !important;\r\n  flex-direction: column !important;\r\n  height: 100% !important;\r\n}\r\n\r\n/* Главное название курса */\r\nbody.mc-active .mc-course-title-main {\r\n  font-size: calc(var(--mc-font-size, 14px) * 1.15) !important;\r\n  font-weight: 700 !important;\r\n  color: var(--mc-text) !important;\r\n  line-height: 1.35 !important;\r\n  display: block !important;\r\n  margin-bottom: 10px !important;\r\n}\r\n\r\n/* Контейнер для тегов (чипсов) */\r\nbody.mc-active .mc-course-chips {\r\n  display: flex !important;\r\n  flex-wrap: wrap !important;\r\n  gap: 6px !important;\r\n  margin-top: auto !important;\r\n  margin-bottom: 12px !important;\r\n}\r\n\r\n/* Сами чипсы (семестр, препод, группа) */\r\nbody.mc-active .mc-chip {\r\n  background: var(--mc-accent-container) !important;\r\n  color: var(--mc-on-accent-container) !important;\r\n  font-size: calc(var(--mc-font-size, 14px) * 0.82) !important;\r\n  padding: 3px 8px !important;\r\n  border-radius: 6px !important;\r\n  font-weight: 700 !important;\r\n  letter-spacing: 0.1px !important;\r\n}\r\n\r\n/* Прогресс (В самом низу карточки) */\r\nbody.mc-active .mydashboard-progress {\r\n  order: 10 !important;\r\n  margin-top: auto !important;\r\n  padding: 0 !important;\r\n  padding-top: 12px !important;\r\n  padding-right: 48px !important; /* Отступ справа, чтобы не перекрывать иконку закладки */\r\n  display: flex !important;\r\n  flex-direction: column !important;\r\n  gap: 6px !important;\r\n  width: 100% !important;\r\n  box-sizing: border-box !important;\r\n  z-index: 5 !important;\r\n  visibility: visible !important;\r\n  opacity: 1 !important;\r\n  min-height: 28px !important;\r\n}\r\n\r\nbody.mc-active .mydashboard-progress-string {\r\n  font-size: calc(var(--mc-font-size, 14px) * 0.85) !important;\r\n  font-weight: 700 !important;\r\n  color: var(--mc-text) !important;\r\n  opacity: 0.85 !important;\r\n  margin-bottom: 0 !important;\r\n  line-height: 1.2 !important;\r\n  display: block !important;\r\n  visibility: visible !important;\r\n}\r\n\r\nbody.mc-active .mydashboard-progress-string strong {\r\n  color: var(--mc-accent) !important;\r\n  font-weight: 800 !important;\r\n}\r\n\r\nbody.mc-active .progress {\r\n  height: 6px !important;\r\n  min-height: 6px !important;\r\n  background-color: var(--mc-outline-variant, rgba(127, 127, 127, 0.2)) !important;\r\n  background: var(--mc-outline-variant, rgba(127, 127, 127, 0.2)) !important;\r\n  border-radius: 6px !important;\r\n  overflow: hidden !important;\r\n  display: flex !important;\r\n  width: 100% !important;\r\n  margin: 0 !important;\r\n  border: none !important;\r\n  visibility: visible !important;\r\n}\r\n\r\nbody.mc-active .progress-bar {\r\n  height: 100% !important;\r\n  min-height: 6px !important;\r\n  background-color: var(--mc-accent) !important;\r\n  background: var(--mc-accent) !important;\r\n  border-radius: 6px !important;\r\n  transition: width 0.3s ease !important;\r\n  box-shadow: none !important;\r\n  display: block !important;\r\n  visibility: visible !important;\r\n}\r\n\r\n/* ========================================================\r\n   КОМПАКТНЫЙ РЕЖИМ ДЛЯ КАРТОЧЕК КУРСОВ (COMPACT MODE)\r\n   ======================================================== */\r\nbody.mc-active.mc-compact-mode .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-compact-mode .dashboard-card,\r\nbody.mc-active.mc-compact-mode [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-compact-mode [data-region=\"courses-view\"] .card {\r\n  min-height: 190px !important;\r\n  padding: 14px 18px !important;\r\n  padding-top: 74px !important; /* 56px обложка + 18px отступ текста под ней */\r\n  gap: 8px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .mc-course-cover {\r\n  height: 56px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .mc-course-title-main {\r\n  font-size: 0.96rem !important;\r\n  line-height: 1.25 !important;\r\n  margin-bottom: 8px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .mc-course-chips {\r\n  gap: 4px !important;\r\n  margin-bottom: 6px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .mc-chip {\r\n  font-size: 11px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .mydashboard-progress {\r\n  padding-right: 36px !important;\r\n  gap: 4px !important;\r\n  margin-top: auto !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .mydashboard-progress-string {\r\n  font-size: 11px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .progress {\r\n  height: 5px !important;\r\n  min-height: 5px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .mydashboard-menu-box,\r\nbody.mc-active.mc-compact-mode .mydahboard-menu-box {\r\n  bottom: 12px !important;\r\n  right: 14px !important;\r\n}\r\n\r\nbody.mc-active.mc-compact-mode .block_mydashboard .list-group,\r\nbody.mc-active.mc-compact-mode [data-region=\"course-content\"] .list-group,\r\nbody.mc-active.mc-compact-mode .mydashboard-desktop {\r\n  gap: 12px !important;\r\n}\r\n\r\n/* 5. Учет пропусков (FAB) */\r\nbody.mc-active .mc-fab-button {\r\n  position: fixed !important;\r\n  bottom: 30px !important;\r\n  right: 30px !important;\r\n  background: var(--mc-accent) !important;\r\n  color: var(--mc-accent-contrast, #381E72) !important;\r\n  padding: 14px 22px !important;\r\n  border-radius: 30px !important;\r\n  font-weight: 800 !important;\r\n  font-size: 1rem !important;\r\n  box-shadow: 0 8px 24px rgba(208, 188, 255, 0.4) !important;\r\n  z-index: 9999 !important;\r\n  text-decoration: none !important;\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  gap: 10px !important;\r\n  transition: transform 0.2s, box-shadow 0.2s !important;\r\n}\r\nbody.mc-active .mc-fab-button:hover {\r\n  transform: scale(1.05) !important;\r\n  box-shadow: 0 12px 32px rgba(208, 188, 255, 0.6) !important;\r\n}\r\n\r\n/* ========================================================\r\n   6. ИЗОЛЯЦИЯ ПАНЕЛИ PAQA STUDIO LIVE\r\n   ======================================================== */\r\nbody.mc-active #paqa-theme-studio-live {\r\n  background: #1E1E1E !important;\r\n  color: #E6E1E5 !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live #paqa-ts-header {\r\n  background: #121212 !important;\r\n  border-bottom: 1px solid #333 !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live #paqa-ts-header h2 {\r\n  color: #D0BCFF !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live .paqa-ts-close {\r\n  color: #aaa !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live .paqa-ts-close:hover {\r\n  color: #ffffff !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live .paqa-ts-content {\r\n  background: #1E1E1E !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live label {\r\n  color: #E6E1E5 !important;\r\n  font-weight: 700 !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live input[type=\"text\"]#ts-bgimg {\r\n  background: #2B2930 !important;\r\n  color: #FFFFFF !important;\r\n  border: 1px solid #444 !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live .paqa-btn {\r\n  background-color: #D0BCFF !important;\r\n  color: #381E72 !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live .paqa-btn.picker {\r\n  background-color: #4F378B !important;\r\n  color: #FFFFFF !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live #paqa-ts-move-btn {\r\n  background-color: #006A6A !important;\r\n  color: #FFFFFF !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live #paqa-ts-undo,\r\nbody.mc-active #paqa-theme-studio-live #paqa-ts-reset-hidden {\r\n  background-color: #333333 !important;\r\n  color: #FFFFFF !important;\r\n}\r\nbody.mc-active #paqa-theme-studio-live #paqa-ts-save {\r\n  background-color: #D0BCFF !important;\r\n  color: #381E72 !important;\r\n}\r\n\r\n/* ========================================================\r\n   FILEMANAGER / FILEPICKER FIXES\r\n   ======================================================== */\r\n/* 1. Внешняя карточка — ТОЛЬКО сам блок filemanager и filepicker */\r\nbody.mc-active .filemanager,\r\nbody.mc-active .filepicker {\r\n  background: var(--mc-bg-card-low) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  border-radius: var(--mc-radius, 16px) !important;\r\n  color: var(--mc-text) !important;\r\n  overflow: hidden !important;\r\n  position: relative !important;\r\n}\r\n\r\n/* 2. Сбрасываем внешнюю обёртку строки формы и внутренние контейнеры, чтобы не было вложенных рамок и лишних плашек */\r\nbody.mc-active [data-fieldtype=\"filemanager\"],\r\nbody.mc-active .fitem_ffilemanager,\r\nbody.mc-active .felement.ffilemanager,\r\nbody.mc-active .filemanager .fp-generallayout,\r\nbody.mc-active .filepicker .fp-generallayout,\r\nbody.mc-active .filemanager .filemanager-container,\r\nbody.mc-active .filemanager .dndupload-target,\r\nbody.mc-active .filemanager .dndupload-dropzone,\r\nbody.mc-active .filemanager .dndupload-message,\r\nbody.mc-active .filemanager .dndupload-uploadinprogress,\r\nbody.mc-active .dndupload-target,\r\nbody.mc-active .dndupload-dropzone,\r\nbody.mc-active .dndupload-message {\r\n  background: transparent !important;\r\n  background-color: transparent !important;\r\n  border: none !important;\r\n  box-shadow: none !important;\r\n}\r\n\r\n/* 3. Оверлей зоны перетаскивания файлов (dropzone) — прозрачный, аккуратный пунктир и НИКОГДА не перекрывает файлы */\r\nbody.mc-active .filemanager .dndupload-target,\r\nbody.mc-active .filemanager .dndupload-dropzone {\r\n  border: 2px dashed rgba(255, 255, 255, 0.15) !important;\r\n  border-radius: calc(var(--mc-radius, 16px) - 4px) !important;\r\n  background: transparent !important;\r\n  background-color: transparent !important;\r\n  pointer-events: none !important;\r\n}\r\n\r\nbody.mc-active .filemanager .dndupload-target.dragover,\r\nbody.mc-active .filemanager .dndupload-dropzone.dragover,\r\nbody.mc-active .filemanager .dndupload-target:hover {\r\n  border-color: var(--mc-accent, #D0BCFF) !important;\r\n  background: rgba(208, 188, 255, 0.05) !important;\r\n}\r\n\r\n/* 4. Текст и стрелка внутри зоны перетаскивания */\r\nbody.mc-active .filemanager .dndupload-message,\r\nbody.mc-active .filemanager .dndupload-text,\r\nbody.mc-active .filemanager .dndupload-message-title {\r\n  color: var(--mc-text-muted, rgba(255, 255, 255, 0.6)) !important;\r\n  font-weight: 500 !important;\r\n  text-shadow: none !important;\r\n  pointer-events: none !important;\r\n}\r\n\r\nbody.mc-active .filemanager .dndupload-arrow {\r\n  color: var(--mc-accent, #D0BCFF) !important;\r\n  filter: invert(0.8) sepia(1) saturate(5) hue-rotate(220deg) !important;\r\n  opacity: 0.8 !important;\r\n  pointer-events: none !important;\r\n}\r\n\r\n/* Тулбар файлового менеджера */\r\nbody.mc-active .filemanager .fp-navbar,\r\nbody.mc-active .filepicker .fp-navbar {\r\n  background: rgba(0, 0, 0, 0.15) !important;\r\n  border-bottom: 1px solid var(--mc-border) !important;\r\n  padding: 6px 12px !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-toolbar .btn,\r\nbody.mc-active .filemanager .filemanager-toolbar .btn,\r\nbody.mc-active .filemanager .fp-navbar .btn,\r\nbody.mc-active .filepicker .fp-navbar .btn {\r\n  background: var(--mc-bg-card) !important;\r\n  border: 1px solid var(--mc-border) !important;\r\n  color: var(--mc-text) !important;\r\n  border-radius: 20px !important;\r\n  padding: 4px 10px !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-toolbar .btn:hover,\r\nbody.mc-active .filemanager .filemanager-toolbar .btn:hover,\r\nbody.mc-active .filemanager .fp-navbar .btn:hover {\r\n  background: var(--mc-outline-variant) !important;\r\n  color: var(--mc-accent) !important;\r\n}\r\n\r\n/* Строка пути (Файлы / папки) */\r\nbody.mc-active .filemanager .fp-pathbar,\r\nbody.mc-active .filepicker .fp-pathbar {\r\n  background: transparent !important;\r\n  border-bottom: 1px solid var(--mc-border) !important;\r\n  color: var(--mc-text) !important;\r\n  padding: 6px 14px !important;\r\n  font-size: 13px !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-pathbar a,\r\nbody.mc-active .filepicker .fp-pathbar a {\r\n  color: var(--mc-text) !important;\r\n  text-decoration: none !important;\r\n  border: none !important;\r\n}\r\n\r\n/* Контейнер сетки файлов — гарантированно поверх дропзоны */\r\nbody.mc-active .filemanager .fp-content,\r\nbody.mc-active .filepicker .fp-content {\r\n  background: transparent !important;\r\n  padding: 16px !important;\r\n  min-height: 140px !important;\r\n  position: relative !important;\r\n  z-index: 10 !important;\r\n  pointer-events: auto !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-iconview,\r\nbody.mc-active .filepicker .fp-iconview {\r\n  display: flex !important;\r\n  flex-wrap: wrap !important;\r\n  gap: 12px !important;\r\n  position: relative !important;\r\n  z-index: 20 !important;\r\n  pointer-events: auto !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-file,\r\nbody.mc-active .filepicker .fp-file {\r\n  position: relative !important;\r\n  z-index: 20 !important;\r\n  border: none !important;\r\n  background: transparent !important;\r\n  box-shadow: none !important;\r\n  padding: 6px !important;\r\n  text-align: center !important;\r\n  pointer-events: auto !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-iconview .fp-file,\r\nbody.mc-active .filepicker .fp-iconview .fp-file {\r\n  display: inline-block !important;\r\n  vertical-align: top !important;\r\n  width: 110px !important;\r\n  margin: 8px !important;\r\n  padding: 8px !important;\r\n  border-radius: 14px !important;\r\n  text-align: center !important;\r\n  cursor: pointer !important;\r\n  transition: background-color 0.2s ease, transform 0.15s ease !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-iconview .fp-file:hover,\r\nbody.mc-active .filepicker .fp-iconview .fp-file:hover {\r\n  background-color: rgba(255, 255, 255, 0.08) !important;\r\n}\r\n\r\n/* Ссылки внутри файла (основной кликабельный контейнер карточки в Moodle) */\r\nbody.mc-active .filemanager .fp-file a,\r\nbody.mc-active .filepicker .fp-file a,\r\nbody.mc-active .filemanager .fp-filename a,\r\nbody.mc-active .filepicker .fp-filename a {\r\n  color: var(--mc-text) !important;\r\n  border: none !important;\r\n  background: transparent !important;\r\n  text-decoration: none !important;\r\n  display: block !important;\r\n  visibility: visible !important;\r\n  opacity: 1 !important;\r\n  pointer-events: auto !important;\r\n}\r\n\r\n/* Карточка миниатюры файла */\r\nbody.mc-active .filemanager .fp-thumbnail,\r\nbody.mc-active .filepicker .fp-thumbnail {\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.12)) !important;\r\n  border-radius: 12px !important;\r\n  background-color: var(--mc-bg-card, #2B2930) !important;\r\n  overflow: hidden !important;\r\n  position: relative !important;\r\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n  margin: 0 auto !important;\r\n  width: 90px !important;\r\n  height: 90px !important;\r\n}\r\n\r\nbody.mc-active .filemanager .fp-thumbnail img,\r\nbody.mc-active .filepicker .fp-thumbnail img {\r\n  display: block !important;\r\n  visibility: visible !important;\r\n  opacity: 1 !important;\r\n  max-width: 76px !important;\r\n  max-height: 76px !important;\r\n  margin: auto !important;\r\n}\r\n\r\n/* Имя файла */\r\nbody.mc-active .filemanager .fp-filename-field,\r\nbody.mc-active .filemanager .fp-filename,\r\nbody.mc-active .filepicker .fp-filename-field,\r\nbody.mc-active .filepicker .fp-filename {\r\n  background: transparent !important;\r\n  border: none !important;\r\n  color: var(--mc-text, #E6E1E5) !important;\r\n  text-align: center !important;\r\n  font-size: 12px !important;\r\n  line-height: 1.4 !important;\r\n  box-shadow: none !important;\r\n  margin-top: 6px !important;\r\n  position: relative !important;\r\n  z-index: 2 !important;\r\n  word-break: break-word !important;\r\n  display: block !important;\r\n  visibility: visible !important;\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* Кнопка контекстного меню на файле */\r\nbody.mc-active .filemanager .fp-contextmenu,\r\nbody.mc-active .filepicker .fp-contextmenu {\r\n  position: absolute !important;\r\n  top: 4px !important;\r\n  right: 4px !important;\r\n  background: var(--mc-bg-card-low, #1D1B20) !important;\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.15)) !important;\r\n  color: var(--mc-text, #E6E1E5) !important;\r\n  border-radius: 8px !important;\r\n  padding: 2px 5px !important;\r\n  z-index: 25 !important;\r\n  display: inline-flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n}\r\n\r\n/* Убираем только спиннеры и лишние технические оверлеи загрузки */\r\nbody.mc-active .filemanager .fp-file .fp-thumbnail-loading,\r\nbody.mc-active .filemanager .fp-file .loading-icon,\r\nbody.mc-active .filemanager .fp-file .spinner,\r\nbody.mc-active .filemanager .fp-file [class*=\"loading\"],\r\nbody.mc-active .filemanager .fp-file [class*=\"spinner\"],\r\nbody.mc-active .filemanager .fp-file .mc-act-badge,\r\nbody.mc-active .filepicker .fp-file .fp-thumbnail-loading,\r\nbody.mc-active .filepicker .fp-file .loading-icon,\r\nbody.mc-active .filepicker .fp-file .spinner,\r\nbody.mc-active .filepicker .fp-file [class*=\"loading\"],\r\nbody.mc-active .filepicker .fp-file [class*=\"spinner\"],\r\nbody.mc-active .filepicker .fp-file .mc-act-badge {\r\n  display: none !important;\r\n  visibility: hidden !important;\r\n  opacity: 0 !important;\r\n  pointer-events: none !important;\r\n}\r\n\r\n/* Сбрасываем любые псевдоэлементы на файлах */\r\nbody.mc-active .filemanager .fp-file::before,\r\nbody.mc-active .filemanager .fp-file::after,\r\nbody.mc-active .filemanager .fp-thumbnail::before,\r\nbody.mc-active .filemanager .fp-thumbnail::after,\r\nbody.mc-active .filemanager .fp-filename-field::before,\r\nbody.mc-active .filemanager .fp-filename-field::after,\r\nbody.mc-active .filemanager .fp-filename::before,\r\nbody.mc-active .filemanager .fp-filename::after,\r\nbody.mc-active .filepicker .fp-file::before,\r\nbody.mc-active .filepicker .fp-file::after,\r\nbody.mc-active .filepicker .fp-thumbnail::before,\r\nbody.mc-active .filepicker .fp-thumbnail::after,\r\nbody.mc-active .filepicker .fp-filename-field::before,\r\nbody.mc-active .filepicker .fp-filename-field::after,\r\nbody.mc-active .filepicker .fp-filename::before,\r\nbody.mc-active .filepicker .fp-filename::after {\r\n  display: none !important;\r\n  content: none !important;\r\n}\r\n\r\n/* Убираем рамки-кнопки со ссылок в тексте задания */\r\nbody.mc-active #region-main a:not(.btn):not(.nav-link):not(.page-link):not(.mc-fab-button):not([role=\"button\"]):not(.aalink) {\r\n  border: none !important;\r\n}\r\n\r\n/* ========================================================\r\n   ЗАКРЕПЛЕННЫЕ КУРСЫ (PIN TO TOP)\r\n   ======================================================== */\r\nbody.mc-active [data-mc-pinned=\"true\"],\r\nbody.mc-active .list-group-item.mydashboard-list-item[data-mc-pinned=\"true\"],\r\nbody.mc-active .dashboard-card[data-mc-pinned=\"true\"],\r\nbody.mc-active .course-listitem[data-mc-pinned=\"true\"] {\r\n  order: -100 !important;\r\n}\r\n\r\nbody.mc-active .mc-pinned-badge,\r\nbody.mc-active .mc-pinned-badge *,\r\nbody.mc-active .mc-pinned-badge i,\r\nbody.mc-active .mc-pinned-badge span,\r\nbody.mc-active .card .mc-pinned-badge,\r\nbody.mc-active .card .mc-pinned-badge *,\r\nbody.mc-active .dashboard-card .mc-pinned-badge,\r\nbody.mc-active .dashboard-card .mc-pinned-badge *,\r\nbody.mc-active .list-group-item .mc-pinned-badge,\r\nbody.mc-active .list-group-item .mc-pinned-badge *,\r\nbody.mc-active .box.generalbox .mc-pinned-badge,\r\nbody.mc-active .box.generalbox .mc-pinned-badge * {\r\n  color: #ffd54f !important;\r\n  fill: #ffd54f !important;\r\n  -webkit-text-fill-color: #ffd54f !important;\r\n}\r\n\r\nbody.mc-active .mc-pinned-badge {\r\n  position: absolute !important;\r\n  top: 10px !important;\r\n  left: 10px !important;\r\n  background: rgba(18, 18, 20, 0.88) !important;\r\n  backdrop-filter: blur(6px) !important;\r\n  -webkit-backdrop-filter: blur(6px) !important;\r\n  color: #ffd54f !important;\r\n  border: 1px solid rgba(255, 213, 79, 0.6) !important;\r\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;\r\n  font-size: 11px !important;\r\n  font-weight: 800 !important;\r\n  padding: 3px 9px !important;\r\n  border-radius: 12px !important;\r\n  z-index: 10 !important;\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  gap: 5px !important;\r\n  line-height: 1 !important;\r\n  pointer-events: none !important;\r\n}\r\n\r\n/* ========================================================\r\n   БЛОК 2: ПРОГРЕСС-БАРЫ И ИНДИКАТОРЫ\r\n   ======================================================== */\r\nbody.mc-active.mc-progress-slim .progress {\r\n  height: 4px !important;\r\n  min-height: 4px !important;\r\n  border-radius: 4px !important;\r\n}\r\nbody.mc-active.mc-progress-normal .progress {\r\n  height: 8px !important;\r\n  min-height: 8px !important;\r\n  border-radius: 6px !important;\r\n}\r\nbody.mc-active.mc-progress-thick .progress {\r\n  height: 14px !important;\r\n  min-height: 14px !important;\r\n  border-radius: 8px !important;\r\n}\r\nbody.mc-active.mc-progress-flat .progress-bar {\r\n  box-shadow: none !important;\r\n  background-image: none !important;\r\n}\r\nbody.mc-active.mc-progress-glow .progress-bar {\r\n  box-shadow: 0 0 12px var(--mc-accent, #D0BCFF), 0 0 4px var(--mc-accent, #D0BCFF) !important;\r\n}\r\nbody.mc-active.mc-progress-striped .progress-bar {\r\n  background-image: linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent) !important;\r\n  background-size: 1rem 1rem !important;\r\n  animation: mc-progress-stripes 1s linear infinite !important;\r\n}\r\n@keyframes mc-progress-stripes {\r\n  0% { background-position: 1rem 0; }\r\n  100% { background-position: 0 0; }\r\n}\r\nbody.mc-active.mc-progress-badge-hidden .mydashboard-progress-string {\r\n  display: none !important;\r\n}\r\nbody.mc-active.mc-progress-badge-pill .mydashboard-progress-string {\r\n  background: var(--mc-accent-container, rgba(208, 188, 255, 0.2)) !important;\r\n  color: var(--mc-on-accent-container, var(--mc-text)) !important;\r\n  padding: 2px 8px !important;\r\n  border-radius: 10px !important;\r\n  font-weight: 800 !important;\r\n}\r\n\r\n/* ========================================================\r\n   БЛОК 3: НАВИГАЦИОННАЯ ШАПКА И ОСТРОВОК (FLOATING ISLAND)\r\n   ======================================================== */\r\nbody.mc-active.mc-nav-style-floating nav.navbar,\r\nbody.mc-active.mc-nav-style-floating #header {\r\n  margin: 12px 0 0 0 !important;\r\n  border-radius: 20px !important;\r\n  background-color: var(--mc-bg-card, var(--mc-card-solid, #2B2930)) !important;\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.12)) !important;\r\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28) !important;\r\n  left: 28px !important;\r\n  right: 28px !important;\r\n  width: calc(100% - 56px) !important;\r\n  max-width: calc(100% - 56px) !important;\r\n  transition: all 0.25s ease !important;\r\n}\r\n\r\nbody.mc-active.mc-nav-style-floating:has(#page.drawers:not(.show-drawer-left) .drawer-toggles .drawer-left-toggle) nav.navbar,\r\nbody.mc-active.mc-nav-style-floating:has(#page.drawers:not(.show-drawer-left) .drawer-toggles .drawer-left-toggle) #header,\r\nbody.mc-active.mc-nav-style-floating.mc-has-left-toggle nav.navbar,\r\nbody.mc-active.mc-nav-style-floating.mc-has-left-toggle #header {\r\n  left: 74px !important;\r\n  right: 28px !important;\r\n  width: calc(100% - 102px) !important;\r\n  max-width: calc(100% - 102px) !important;\r\n}\r\n\r\nbody.mc-active:not(.mc-nav-style-floating):has(#page.drawers:not(.show-drawer-left) .drawer-toggles .drawer-left-toggle) nav.navbar,\r\nbody.mc-active:not(.mc-nav-style-floating).mc-has-left-toggle nav.navbar {\r\n  padding-left: 74px !important;\r\n}\r\n\r\nbody.mc-active.mc-nav-style-glass nav.navbar,\r\nbody.mc-active.mc-nav-style-glass #header {\r\n  backdrop-filter: blur(16px) saturate(160%) !important;\r\n  -webkit-backdrop-filter: blur(16px) saturate(160%) !important;\r\n  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25) !important;\r\n}\r\n\r\nbody.mc-active.mc-avatar-circle .userpicture,\r\nbody.mc-active.mc-avatar-circle .userinitials,\r\nbody.mc-active.mc-avatar-circle .usermenu img {\r\n  border-radius: 50% !important;\r\n}\r\nbody.mc-active.mc-avatar-rounded .userpicture,\r\nbody.mc-active.mc-avatar-rounded .userinitials,\r\nbody.mc-active.mc-avatar-rounded .usermenu img {\r\n  border-radius: 10px !important;\r\n}\r\nbody.mc-active.mc-avatar-square .userpicture,\r\nbody.mc-active.mc-avatar-square .userinitials,\r\nbody.mc-active.mc-avatar-square .usermenu img {\r\n  border-radius: 4px !important;\r\n}\r\n\r\nbody.mc-active.mc-nav-height-compact nav.navbar,\r\nbody.mc-active.mc-nav-height-compact #header {\r\n  min-height: 48px !important;\r\n  max-height: 48px !important;\r\n  height: 48px !important;\r\n  padding-top: 4px !important;\r\n  padding-bottom: 4px !important;\r\n}\r\nbody.mc-active.mc-nav-height-normal nav.navbar,\r\nbody.mc-active.mc-nav-height-normal #header {\r\n  min-height: 60px !important;\r\n  max-height: 60px !important;\r\n  height: 60px !important;\r\n}\r\nbody.mc-active.mc-nav-height-tall nav.navbar,\r\nbody.mc-active.mc-nav-height-tall #header {\r\n  min-height: 72px !important;\r\n  max-height: 72px !important;\r\n  height: 72px !important;\r\n  padding-top: 12px !important;\r\n  padding-bottom: 12px !important;\r\n}\r\n\r\nbody.mc-active.mc-nav-clean .primary-navigation,\r\nbody.mc-active.mc-nav-clean nav.navbar .site-name,\r\nbody.mc-active.mc-nav-clean .navbar-nav .nav-item:not(.user-nav):not(.popover-region) {\r\n  opacity: 0.7 !important;\r\n  transition: opacity 0.2s ease !important;\r\n}\r\nbody.mc-active.mc-nav-clean .primary-navigation:hover,\r\nbody.mc-active.mc-nav-clean nav.navbar:hover .site-name,\r\nbody.mc-active.mc-nav-clean nav.navbar:hover .nav-item {\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* ========================================================\r\n   БЛОК 4: АНИМАЦИИ И МИКРО-ВЗАИМОДЕЙСТВИЯ\r\n   ======================================================== */\r\nbody.mc-active.mc-anim-smooth .dashboard-card,\r\nbody.mc-active.mc-anim-smooth .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-anim-smooth [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-anim-smooth [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-anim-smooth .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-anim-smooth .course-listitem,\r\nbody.mc-active.mc-anim-smooth .btn,\r\nbody.mc-active.mc-anim-smooth button,\r\nbody.mc-active.mc-anim-smooth a {\r\n  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important;\r\n}\r\nbody.mc-active.mc-anim-snappy .dashboard-card,\r\nbody.mc-active.mc-anim-snappy .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-anim-snappy [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-anim-snappy [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-anim-snappy .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-anim-snappy .course-listitem,\r\nbody.mc-active.mc-anim-snappy .btn,\r\nbody.mc-active.mc-anim-snappy button,\r\nbody.mc-active.mc-anim-snappy a {\r\n  transition: all 0.12s ease-out !important;\r\n}\r\nbody.mc-active.mc-anim-instant .dashboard-card,\r\nbody.mc-active.mc-anim-instant .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-anim-instant [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-anim-instant [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-anim-instant .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-anim-instant .course-listitem,\r\nbody.mc-active.mc-anim-instant .btn,\r\nbody.mc-active.mc-anim-instant button,\r\nbody.mc-active.mc-anim-instant a {\r\n  transition: none !important;\r\n}\r\n\r\nbody.mc-active.mc-hover-lift .dashboard-card,\r\nbody.mc-active.mc-hover-lift .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-hover-lift [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-hover-lift [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-hover-lift .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-hover-lift .course-listitem {\r\n  transition: transform 0.25s ease, box-shadow 0.25s ease !important;\r\n}\r\nbody.mc-active.mc-hover-lift .dashboard-card:hover,\r\nbody.mc-active.mc-hover-lift .dashboard-card-deck .dashboard-card:hover,\r\nbody.mc-active.mc-hover-lift [data-region=\"card-deck\"] .card:hover,\r\nbody.mc-active.mc-hover-lift [data-region=\"courses-view\"] .card:hover,\r\nbody.mc-active.mc-hover-lift .list-group-item.mydashboard-list-item:hover,\r\nbody.mc-active.mc-hover-lift .course-listitem:hover {\r\n  transform: translateY(-6px) !important;\r\n  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.32), 0 6px 12px rgba(0, 0, 0, 0.2) !important;\r\n}\r\n\r\nbody.mc-active.mc-hover-glow .dashboard-card,\r\nbody.mc-active.mc-hover-glow .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-hover-glow [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-hover-glow [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-hover-glow .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-hover-glow .course-listitem {\r\n  transition: box-shadow 0.25s ease, border-color 0.25s ease !important;\r\n}\r\nbody.mc-active.mc-hover-glow .dashboard-card:hover,\r\nbody.mc-active.mc-hover-glow .dashboard-card-deck .dashboard-card:hover,\r\nbody.mc-active.mc-hover-glow [data-region=\"card-deck\"] .card:hover,\r\nbody.mc-active.mc-hover-glow [data-region=\"courses-view\"] .card:hover,\r\nbody.mc-active.mc-hover-glow .list-group-item.mydashboard-list-item:hover,\r\nbody.mc-active.mc-hover-glow .course-listitem:hover {\r\n  transform: none !important;\r\n  box-shadow: 0 0 24px var(--mc-accent, #D0BCFF), 0 0 8px var(--mc-accent, #D0BCFF) !important;\r\n  border-color: var(--mc-accent, #D0BCFF) !important;\r\n}\r\n\r\nbody.mc-active.mc-hover-tilt .dashboard-card,\r\nbody.mc-active.mc-hover-tilt .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-hover-tilt [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-hover-tilt [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-hover-tilt .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-hover-tilt .course-listitem {\r\n  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.28s ease !important;\r\n  transform-style: preserve-3d !important;\r\n}\r\nbody.mc-active.mc-hover-tilt .dashboard-card:hover,\r\nbody.mc-active.mc-hover-tilt .dashboard-card-deck .dashboard-card:hover,\r\nbody.mc-active.mc-hover-tilt [data-region=\"card-deck\"] .card:hover,\r\nbody.mc-active.mc-hover-tilt [data-region=\"courses-view\"] .card:hover,\r\nbody.mc-active.mc-hover-tilt .list-group-item.mydashboard-list-item:hover,\r\nbody.mc-active.mc-hover-tilt .course-listitem:hover {\r\n  transform: perspective(700px) translateY(-8px) rotateX(7deg) rotateY(-7deg) scale(1.02) !important;\r\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45), 0 0 16px var(--mc-accent, rgba(208, 188, 255, 0.3)) !important;\r\n}\r\n\r\nbody.mc-active.mc-hover-none .dashboard-card:hover,\r\nbody.mc-active.mc-hover-none .dashboard-card-deck .dashboard-card:hover,\r\nbody.mc-active.mc-hover-none [data-region=\"card-deck\"] .card:hover,\r\nbody.mc-active.mc-hover-none [data-region=\"courses-view\"] .card:hover,\r\nbody.mc-active.mc-hover-none .list-group-item.mydashboard-list-item:hover,\r\nbody.mc-active.mc-hover-none .course-listitem:hover {\r\n  transform: none !important;\r\n}\r\n\r\nbody.mc-active.mc-btn-press .btn:active,\r\nbody.mc-active.mc-btn-press button:active,\r\nbody.mc-active.mc-btn-press .mc-fab-button:active {\r\n  transform: scale(0.96) !important;\r\n}\r\n\r\n/* ========================================================\r\n   БЛОК 5: ЗЕРНИСТЫЙ ФОН (GRAIN OVERLAY) И ЗАТЕМНЕНИЕ / БЛЮР\r\n   ======================================================== */\r\nbody.mc-active::before {\r\n  content: '';\r\n  position: fixed;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  height: 100vh;\r\n  background-color: rgba(0, 0, 0, var(--mc-bg-dim, 0)) !important;\r\n  backdrop-filter: blur(var(--mc-bg-blur, 0px)) !important;\r\n  -webkit-backdrop-filter: blur(var(--mc-bg-blur, 0px)) !important;\r\n  pointer-events: none !important;\r\n  z-index: 0 !important;\r\n}\r\n\r\nbody.mc-active.mc-grain-overlay::after {\r\n  content: '';\r\n  position: fixed;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  height: 100vh;\r\n  pointer-events: none;\r\n  z-index: 999998;\r\n  opacity: 0.045;\r\n  background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\");\r\n}\r\n\r\n/* ========================================================\r\n   РАЗМЕР ШРИФТА И ПЛОТНОСТЬ КАРТОЧЕК\r\n   ======================================================== */\r\nbody.mc-active {\r\n  font-size: var(--mc-font-size, 14px) !important;\r\n}\r\nbody.mc-active .card,\r\nbody.mc-active .dashboard-card,\r\nbody.mc-active .dashboard-card-deck .dashboard-card,\r\nbody.mc-active [data-region=\"card-deck\"] .card,\r\nbody.mc-active [data-region=\"courses-view\"] .card,\r\nbody.mc-active .list-group-item.mydashboard-list-item,\r\nbody.mc-active .course-listitem {\r\n  font-size: var(--mc-font-size, 14px) !important;\r\n}\r\nbody.mc-active .mc-course-title-main,\r\nbody.mc-active .coursename,\r\nbody.mc-active .card-title,\r\nbody.mc-active .course-info-container h3,\r\nbody.mc-active .course-info-container h4 {\r\n  font-size: calc(var(--mc-font-size, 14px) * 1.15) !important;\r\n}\r\nbody.mc-active .mc-chip {\r\n  font-size: calc(var(--mc-font-size, 14px) * 0.82) !important;\r\n}\r\nbody.mc-active .mydashboard-progress-string {\r\n  font-size: calc(var(--mc-font-size, 14px) * 0.85) !important;\r\n}\r\n\r\nbody.mc-active.mc-density-compact .dashboard-card-deck,\r\nbody.mc-active.mc-density-compact [data-region=\"card-deck\"],\r\nbody.mc-active.mc-density-compact .block_mydashboard .list-group {\r\n  gap: 14px !important;\r\n}\r\nbody.mc-active.mc-density-compact .dashboard-card,\r\nbody.mc-active.mc-density-compact .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-density-compact [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-density-compact [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-density-compact .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-density-compact .course-listitem {\r\n  padding: 16px !important;\r\n  padding-top: 114px !important;\r\n  min-height: 220px !important;\r\n}\r\nbody.mc-active.mc-density-compact .mc-course-cover {\r\n  height: 96px !important;\r\n}\r\nbody.mc-active.mc-density-compact .mc-course-title-main,\r\nbody.mc-active.mc-density-compact .coursename {\r\n  font-size: 0.98rem !important;\r\n  margin-bottom: 8px !important;\r\n}\r\n\r\nbody.mc-active.mc-density-spacious .dashboard-card-deck,\r\nbody.mc-active.mc-density-spacious [data-region=\"card-deck\"],\r\nbody.mc-active.mc-density-spacious .block_mydashboard .list-group {\r\n  gap: 26px !important;\r\n}\r\nbody.mc-active.mc-density-spacious .dashboard-card,\r\nbody.mc-active.mc-density-spacious .dashboard-card-deck .dashboard-card,\r\nbody.mc-active.mc-density-spacious [data-region=\"card-deck\"] .card,\r\nbody.mc-active.mc-density-spacious [data-region=\"courses-view\"] .card,\r\nbody.mc-active.mc-density-spacious .list-group-item.mydashboard-list-item,\r\nbody.mc-active.mc-density-spacious .course-listitem {\r\n  padding: 28px !important;\r\n  padding-top: 168px !important;\r\n  min-height: 330px !important;\r\n}\r\nbody.mc-active.mc-density-spacious .mc-course-cover {\r\n  height: 144px !important;\r\n}\r\nbody.mc-active.mc-density-spacious .mc-course-title-main,\r\nbody.mc-active.mc-density-spacious .coursename {\r\n  font-size: 1.25rem !important;\r\n  margin-bottom: 18px !important;\r\n}\r\n\r\n\r\n\r\n\r\n";
  if (typeof GM_addStyle === 'function') {
    try {
      GM_addStyle(baseCssContent);
    } catch(e) {
      injectBaseStyleTag(baseCssContent);
    }
  } else {
    injectBaseStyleTag(baseCssContent);
  }

  function injectBaseStyleTag(css) {
    const s = document.createElement('style');
    s.id = 'mc-base-theme-style';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  // 4. Run Core Theme Engine (content.js) with chrome polyfill
  (function(chrome) {
/**
 * Paqa Moodle Customizer - Content Script
 * Applies Material 3 & Paqa themes smoothly at document_start
 */

(() => {
  const STYLE_ID = 'mc-dynamic-theme-style';

  const DEFAULT_SETTINGS = {
    enabled: true,
    preset: 'purple',
    accentColor: '#D0BCFF',
    accentContainer: '#4F378B',
    bgColor: '#1C1B1F',
    cardColor: '#2B2930',
    cardOpacity: 95,
    textColor: '#E6E1E5',
    borderRadius: 20,
    btnRadius: 24,
    fontFamily: "'Nunito', sans-serif",
    bgImage: '',
    hideFooter: true,
    compactMode: false,
    cardBlur: 0,
    borderWidth: 1,
    fontSize: 14,
    shadowStyle: 'soft',
    cardPadding: 'default',
    coverStyle: 'gradient',
    courseCustomizations: {},
    progressColorMode: 'accent',
    progressHeight: 'normal',
    progressStyle: 'flat',
    progressBadge: 'text',
    navbarStyle: 'full',
    avatarShape: 'circle',
    navbarHeight: 'normal',
    navbarClean: false,
    cardHoverEffect: 'lift',
    animSpeed: 'smooth',
    buttonPress: true,
    bgDim: 0,
    bgBlur: 0,
    bgGrain: false,
    elementLayers: {},
    movedElements: {},
    hiddenSelectors: []
  };

  let currentSettings = { ...DEFAULT_SETTINGS };

  // Конвертация HEX в RGBA
  function hexToRgba(hex, alphaPercent) {
    if (!hex) return 'rgba(43, 41, 48, 0.95)';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alphaPercent / 100})`;
  }

  // Расчет контрастного цвета текста
  function getContrastText(hex) {
    if (!hex) return '#381E72';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 140) ? '#381E72' : '#FFFFFF';
  }

  // Маппинг селекторов песочницы (Mockup) на реальный DOM Moodle LMS
  const SELECTOR_ALIASES = {
    '.search-box': '.block_myoverview .input-group, .block_mydashboard .input-group, [data-region="courses-view"] .input-group, .search-widget, div.search-input, [data-region="search-input"], .simplesearchform, .search-box',
    '.search-input': '.block_myoverview input, .block_mydashboard input, [data-region="courses-view"] input, input[placeholder*="Поиск"], .search-input',
    '.search-btn': '.block_myoverview button[type="submit"], .block_mydashboard button[type="submit"], [data-action="search"], .search-btn',
    '.sort-view-box': '[data-region="sorting-selector"], [data-region="display-selector"], [data-action="set-display-mode"], .sort-view-box',
    '.sort-dropdown': '[data-region="sorting-selector"] button, [data-region="sorting-selector"] .dropdown-toggle, .sort-dropdown',
    '.view-toggles': '[data-region="display-selector"], [data-action="set-display-mode"], .view-toggles',
    '.dashboard-filters': '[data-region="filter"], [data-region="filter-tabs"], .dashboard-filters',
    '[data-filter-id="all"]': '[data-region="filter"] [data-value="all"], [data-value="all"], .filter-pill[data-filter-id="all"]',
    '[data-filter-id="year"]': '[data-region="filter"] .dropdown-toggle, .filter-pill[data-filter-id="year"]',
    '[data-filter-id="inprogress"]': '[data-region="filter"] [data-value="inprogress"], [data-value="inprogress"], .filter-pill[data-filter-id="inprogress"]',
    '[data-filter-id="past"]': '[data-region="filter"] [data-value="past"], [data-value="past"], .filter-pill[data-filter-id="past"]',
    '[data-filter-id="future"]': '[data-region="filter"] [data-value="future"], [data-value="future"], .filter-pill[data-filter-id="future"]',
    '[data-filter-id="favourites"]': '[data-region="filter"] [data-value="favourites"], [data-value="favourites"], .filter-pill[data-filter-id="favourites"]',
    '.filter-pill': '[data-region="filter"] button, [data-region="filter"] .nav-link, [data-region="filter"] .dropdown-toggle, [data-region="filter"] a, .filter-pill',
    '.dashboard-heading': '.dashboard-heading, .block_myoverview h5, .block_myoverview .block-title, .block_mydashboard h5, .block_mydashboard .card-title',
    '.mock-page-title': '#page-header h1, .page-header-headings h1, .page-title, .mock-page-title',
    '.mock-navbar': 'nav.navbar, #header, .navbar, .fixed-top, .mock-navbar',
    '.mock-card': '.dashboard-card, .list-group-item.mydashboard-list-item, [data-region="course-content"], .course-summary-card, .mock-card',
    '.mock-page-footer': '#page-footer, footer, .mock-page-footer',
    '.mc-fab-button': '#mc-quick-support-fab, .mc-fab-button',
    '.mock-brand': '.navbar-brand, #header .navbar-brand, .mock-brand',
    '.notification-badge': '#nav-notification-popover-container, .popover-region-notifications, .notification-badge',
    '.mock-nav-messages': '#nav-message-popover-container, .popover-region-messages, .mock-nav-messages',
    '.mock-nav-profile': '#usernavigation .usermenu, .usermenu, .userbutton, .userpicture, .mock-nav-profile'
  };

  function getResolvedSelector(sel) {
    if (!sel) return '';
    const trimmed = sel.trim();
    if (SELECTOR_ALIASES[trimmed]) return SELECTOR_ALIASES[trimmed];

    // Заголовок Дашборд (строго отдельный заголовок, НЕ вся карточка!)
    if (trimmed.includes('dashboard-heading') || (trimmed.includes('block_myoverview') && trimmed.includes('h5')) || (trimmed.includes('block_mydashboard') && (trimmed.includes('h5') || trimmed.includes('card-title')))) {
      return '.dashboard-heading, .block_myoverview h5, .block_myoverview .block-title, .block_mydashboard h5, .block_mydashboard .card-title';
    }

    // Заголовок Онлайн-обучение
    if (trimmed.includes('page-header h1') || trimmed.includes('mock-page-title') || trimmed.includes('page-title')) {
      return '#page-header h1, .page-header-headings h1, .page-title, .mock-page-title';
    }

    // Элементы островка шапки (Navbar)
    if (trimmed.includes('mock-brand') || trimmed.includes('navbar-brand')) {
      return '.navbar-brand, #header .navbar-brand, .mock-brand';
    }
    if (trimmed.includes('notification')) {
      return '#nav-notification-popover-container, .popover-region-notifications, .notification-badge';
    }
    if (trimmed.includes('message') || trimmed.includes('mock-nav-messages')) {
      return '#nav-message-popover-container, .popover-region-messages, .mock-nav-messages';
    }
    if (trimmed.includes('usermenu') || trimmed.includes('userbutton') || trimmed.includes('userpicture') || trimmed.includes('mock-nav-profile') || trimmed.includes('user-item')) {
      return '#usernavigation .usermenu, .usermenu, .userbutton, .userpicture, .mock-nav-profile';
    }
    if (trimmed.includes('nth-child(1)')) {
      return '.primary-navigation .nav-item:nth-child(1), .mock-primary-nav .nav-item:nth-child(1)';
    }
    if (trimmed.includes('nth-child(2)')) {
      return '.primary-navigation .nav-item:nth-child(2), .mock-primary-nav .nav-item:nth-child(2)';
    }
    if (trimmed.includes('nth-child(3)')) {
      return '.primary-navigation .nav-item:nth-child(3), .mock-primary-nav .nav-item:nth-child(3)';
    }

    // Отдельные кнопки фильтров
    if (trimmed.includes('favourites') || trimmed.includes('Избранные')) {
      return '[data-region="filter"] [data-value="favourites"], [data-value="favourites"], .filter-pill[data-filter-id="favourites"]';
    }
    if (trimmed.includes('future') || trimmed.includes('Предстоящие')) {
      return '[data-region="filter"] [data-value="future"], [data-value="future"], .filter-pill[data-filter-id="future"]';
    }
    if (trimmed.includes('inprogress') || trimmed.includes('Текущие')) {
      return '[data-region="filter"] [data-value="inprogress"], [data-value="inprogress"], .filter-pill[data-filter-id="inprogress"]';
    }
    if (trimmed.includes('past') || trimmed.includes('Прошедшие')) {
      return '[data-region="filter"] [data-value="past"], [data-value="past"], .filter-pill[data-filter-id="past"]';
    }
    if (trimmed.includes('year') || trimmed.includes('Учебный год')) {
      return '[data-region="filter"] .dropdown-toggle, .filter-pill[data-filter-id="year"]';
    }
    if (trimmed.includes('all') && (trimmed.includes('filter') || trimmed.includes('Все'))) {
      return '[data-region="filter"] [data-value="all"], [data-value="all"], .filter-pill[data-filter-id="all"]';
    }

    // Если в селекторе фигурирует поиск
    if (trimmed.includes('search') || trimmed.includes('Поиск') || trimmed.includes('simplesearchform')) {
      return '.block_myoverview .input-group, .block_mydashboard .input-group, [data-region="courses-view"] .input-group, .search-widget, div.search-input, [data-region="search-input"], .simplesearchform, .search-box';
    }
    // Если в селекторе фигурирует сортировка или вид
    if (trimmed.includes('sorting') || trimmed.includes('sort') || trimmed.includes('display') || trimmed.includes('view-toggles')) {
      return '[data-region="sorting-selector"], [data-region="display-selector"], [data-action="set-display-mode"], .sort-view-box';
    }
    // Если в селекторе фигурируют фильтры вообще
    if (trimmed.includes('dashboard-filters') || trimmed.includes('filter-tabs')) {
      return '[data-region="filter"], [data-region="filter-tabs"], .dashboard-filters, ul.nav-pills';
    }
    // Карточки курсов (ТОЛЬКО при точном совпадении!)
    if (trimmed === '.mock-card' || trimmed === '.dashboard-card' || trimmed === '.list-group-item.mydashboard-list-item' || trimmed === '.course-summary-card') {
      return '.dashboard-card, .list-group-item.mydashboard-list-item, [data-region="course-content"], .course-summary-card, .mock-card';
    }
    // Шапка целиком (ТОЛЬКО при точном совпадении!)
    if (trimmed === '.mock-navbar' || trimmed === 'nav.navbar' || trimmed === '#header' || trimmed === '.fixed-top') {
      return 'nav.navbar, #header, .navbar, .fixed-top, .mock-navbar';
    }
    // Если в селекторе фигурирует футер
    if (trimmed.includes('footer')) {
      return '#page-footer, footer, .mock-page-footer';
    }
    return trimmed;
  }

  function expandAndPrefixSelector(selector, prefix = 'body.mc-active') {
    if (!selector) return '';
    const resolved = getResolvedSelector(selector);
    return resolved
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (s.startsWith(prefix) ? s : `${prefix} ${s}`))
      .join(', ');
  }

  function resolveElements(sel) {
    if (!sel) return [];
    const resolvedSelector = getResolvedSelector(sel);
    let elements = [];
    try {
      elements = Array.from(document.querySelectorAll(resolvedSelector));
    } catch (e) {}

    if (elements.length > 0) return elements;

    // Резервный динамический поиск через элементы DOM Moodle
    const trimmed = sel.trim();

    // 1. Поиск: находим input поиска курсов и берем его внешний контейнер
    if (trimmed.includes('search') || trimmed.includes('Поиск') || trimmed.includes('simplesearchform')) {
      const inputs = document.querySelectorAll(
        '.block_myoverview input, .block_mydashboard input, [data-region="courses-view"] input, input[placeholder*="Поиск"], input[type="search"], input[name="search"]'
      );
      const containers = [];
      inputs.forEach(input => {
        const box = input.closest('.input-group, .search-widget, .search-input, [class*="search"], form') || input.parentElement;
        if (box && !containers.includes(box)) containers.push(box);
      });
      if (containers.length > 0) return containers;
    }

    // 2. Сортировка и вид
    if (trimmed.includes('sorting') || trimmed.includes('sort') || trimmed.includes('display') || trimmed.includes('view')) {
      const sortElements = document.querySelectorAll(
        '[data-region="sorting-selector"], [data-region="display-selector"], [data-action="set-display-mode"], .block_myoverview .dropdown, .block_mydashboard .dropdown'
      );
      const containers = [];
      sortElements.forEach(s => {
        const box = s.closest('.d-flex, .nav, [class*="sort"], [class*="view"]') || s;
        if (box && !containers.includes(box)) containers.push(box);
      });
      if (containers.length > 0) return containers;
    }

    // 3. Отдельные кнопки фильтров
    if (trimmed.includes('favourites') || trimmed.includes('Избранные')) {
      const match = Array.from(document.querySelectorAll('[data-region="filter"] a, [data-region="filter"] button, [data-value="favourites"], .filter-pill')).find(b => (b.dataset && b.dataset.value === 'favourites') || b.textContent.includes('Избранные'));
      if (match) return [match];
    }
    if (trimmed.includes('future') || trimmed.includes('Предстоящие')) {
      const match = Array.from(document.querySelectorAll('[data-region="filter"] a, [data-region="filter"] button, [data-value="future"], .filter-pill')).find(b => (b.dataset && b.dataset.value === 'future') || b.textContent.includes('Предстоящие'));
      if (match) return [match];
    }
    if (trimmed.includes('inprogress') || trimmed.includes('Текущие')) {
      const match = Array.from(document.querySelectorAll('[data-region="filter"] a, [data-region="filter"] button, [data-value="inprogress"], .filter-pill')).find(b => (b.dataset && b.dataset.value === 'inprogress') || b.textContent.includes('Текущие'));
      if (match) return [match];
    }
    if (trimmed.includes('past') || trimmed.includes('Прошедшие')) {
      const match = Array.from(document.querySelectorAll('[data-region="filter"] a, [data-region="filter"] button, [data-value="past"], .filter-pill')).find(b => (b.dataset && b.dataset.value === 'past') || b.textContent.includes('Прошедшие'));
      if (match) return [match];
    }
    if (trimmed.includes('year') || trimmed.includes('Учебный год')) {
      const match = Array.from(document.querySelectorAll('[data-region="filter"] a, [data-region="filter"] button, .filter-pill')).find(b => b.textContent.includes('Учебный год'));
      if (match) return [match];
    }
    if (trimmed.includes('all') && (trimmed.includes('filter') || trimmed.includes('Все'))) {
      const match = Array.from(document.querySelectorAll('[data-region="filter"] a, [data-region="filter"] button, [data-value="all"], .filter-pill')).find(b => (b.dataset && b.dataset.value === 'all') || b.textContent.trim() === 'Все');
      if (match) return [match];
    }
    if (trimmed.includes('filter')) {
      const filters = Array.from(document.querySelectorAll('[data-region="filter"], [data-region="filter-tabs"], .dashboard-filters, ul.nav-pills'));
      if (filters.length > 0) return filters;
    }

    return [];
  }

  // Динамическая адаптация карточек курсов (работает даже при AJAX-подгрузке)
  function liveThemeDOM() {
    if (!currentSettings.enabled) return;

    // Защита от Moodle JS, который может перезаписывать классы body (из-за этого слетает фон)
    if (document.body) {
      if (!document.body.classList.contains('mc-active')) {
        document.body.classList.add('mc-active');
      }
      document.body.classList.toggle('mc-hide-footer', !!currentSettings.hideFooter);
      document.body.classList.toggle('mc-compact-mode', !!currentSettings.compactMode);
      document.body.classList.toggle('mc-density-compact', currentSettings.cardPadding === 'compact');
      document.body.classList.toggle('mc-density-spacious', currentSettings.cardPadding === 'spacious');

      document.body.classList.remove('mc-progress-slim', 'mc-progress-normal', 'mc-progress-thick');
      document.body.classList.add(`mc-progress-${currentSettings.progressHeight || 'normal'}`);

      document.body.classList.remove('mc-progress-flat', 'mc-progress-glow', 'mc-progress-striped');
      document.body.classList.add(`mc-progress-${currentSettings.progressStyle || 'flat'}`);

      document.body.classList.remove('mc-progress-badge-text', 'mc-progress-badge-pill', 'mc-progress-badge-hidden');
      document.body.classList.add(`mc-progress-badge-${currentSettings.progressBadge || 'text'}`);

      document.body.classList.remove('mc-nav-style-full', 'mc-nav-style-floating', 'mc-nav-style-glass');
      document.body.classList.add(`mc-nav-style-${currentSettings.navbarStyle || 'full'}`);

      document.body.classList.remove('mc-avatar-circle', 'mc-avatar-rounded', 'mc-avatar-square');
      document.body.classList.add(`mc-avatar-${currentSettings.avatarShape || 'circle'}`);

      document.body.classList.remove('mc-nav-height-compact', 'mc-nav-height-normal', 'mc-nav-height-tall');
      document.body.classList.add(`mc-nav-height-${currentSettings.navbarHeight || 'normal'}`);

      document.body.classList.toggle('mc-nav-clean', !!currentSettings.navbarClean);

      document.body.classList.remove('mc-hover-lift', 'mc-hover-glow', 'mc-hover-tilt', 'mc-hover-none');
      document.body.classList.add(`mc-hover-${currentSettings.cardHoverEffect || 'lift'}`);

      document.body.classList.remove('mc-anim-smooth', 'mc-anim-snappy', 'mc-anim-instant');
      document.body.classList.add(`mc-anim-${currentSettings.animSpeed || 'smooth'}`);

      document.body.classList.toggle('mc-btn-press', currentSettings.buttonPress !== undefined ? currentSettings.buttonPress : true);
      document.body.classList.toggle('mc-grain-overlay', !!currentSettings.bgGrain);
    }

    // 1. Находим все курсы по ссылкам view.php
    const courseLinks = document.querySelectorAll('a[href*="/course/view.php"]');
    courseLinks.forEach(link => {
      // Ищем карточку-родитель конкретного курса (и для сетки, и для списка)
      let card = link.closest('.list-group-item, .dashboard-card, .course-summary-card, .coursebox, .course-listitem');
      if (!card) {
        const candidate = link.closest('.card');
        if (candidate && !candidate.classList.contains('block_mydashboard') && !candidate.classList.contains('block')) {
          card = candidate;
        }
      }
      if (card) {
        card.style.setProperty('background-color', 'var(--mc-bg-card)', 'important');
        card.style.setProperty('background', 'var(--mc-bg-card)', 'important');
        card.style.removeProperty('border');
        card.style.removeProperty('box-shadow');
        card.style.setProperty('border-radius', 'var(--mc-radius, 24px)', 'important');
        if (currentSettings.cardBlur && currentSettings.cardBlur > 0) {
          card.style.setProperty('backdrop-filter', 'blur(var(--mc-blur, 0px))', 'important');
          card.style.setProperty('-webkit-backdrop-filter', 'blur(var(--mc-blur, 0px))', 'important');
        } else {
          card.style.removeProperty('backdrop-filter');
          card.style.removeProperty('-webkit-backdrop-filter');
        }

        // Безопасно убираем фон только у главных обёрток, чтобы не задеть бейджи и картинки
        card.querySelectorAll('.card-body, .course-info-container, .row, [class*="col-"], .d-flex, .p-3, .p-2').forEach(wrapper => {
           wrapper.style.setProperty('background-color', 'transparent', 'important');
        });
      }



      // Кнопка "Перейти к курсу"
      if (link.textContent.includes('Перейти') || link.classList.contains('btn')) {
        link.style.setProperty('background-color', 'var(--mc-accent-container)', 'important');
        link.style.setProperty('color', 'var(--mc-on-accent-container)', 'important');
        link.style.setProperty('border-radius', 'var(--mc-radius-btn)', 'important');
        link.style.setProperty('border', 'none', 'important');
        link.style.setProperty('font-weight', '700', 'important');
      }
    });

    // 2. Кнопка "Учет причин пропусков занятий" и PWA блоки
    // Убираем блок "Если отсутствует необходимый курс"
    const missingBlock = document.getElementById('inst8016');
    if (missingBlock) {
      missingBlock.style.setProperty('display', 'none', 'important');
    }

    // Делаем плавающую кнопку из "Учет причин пропусков"
    const uchetBlock = document.getElementById('inst8885');
    if (uchetBlock) {
      const btn = uchetBlock.querySelector('a, center a');
      if (btn && !document.querySelector('.mc-fab-button')) {
        // Клонируем кнопку и выносим в корень
        const fab = document.createElement('a');
        fab.href = btn.href;
        fab.className = 'mc-fab-button';
        fab.innerHTML = '<i class="fa fa-calendar-check-o"></i> Учет пропусков';
        document.body.appendChild(fab);
      }
      uchetBlock.style.setProperty('display', 'none', 'important');
    }

    // 2.3.1 Скрываем навязчивые служебные плашки Moodle "Выделено"
    document.querySelectorAll('.badge, .current-badge, [class*="badge"], [data-region="section-badges"]').forEach(b => {
      const txt = (b.textContent || '').trim().toLowerCase();
      if (txt === 'выделено' || txt === 'highlighted') {
        b.style.setProperty('display', 'none', 'important');
      }
    });

    // 2.4 Дедупликация карточек курсов (Moodle рендерит десктоп и мобильную версии одновременно)
    const seenCourses = new Map();
    document.querySelectorAll('.list-group-item.mydashboard-list-item, .block_mydashboard .list-group-item').forEach(card => {
      // Если карточка явно помечена как мобильная системными классами Bootstrap/Moodle
      if (card.matches('.mobile, [class*="mobile"], .d-md-none, .hidden-desktop') ||
          card.closest('.mydashboard-mobile, .block_mydashboard .mobile, .d-md-none, .hidden-desktop, [class*="mobile"]')) {
        card.style.setProperty('display', 'none', 'important');
        card.remove();
        return;
      }

      const link = card.querySelector('a.mydashboard-coursename, a[href*="id="]');
      if (!link) return;

      const match = link.href.match(/[?&]id=(\d+)/);
      const courseId = match ? match[1] : link.href;

      if (seenCourses.has(courseId)) {
        const existing = seenCourses.get(courseId);
        const existingText = existing.textContent || '';
        const currentText = card.textContent || '';

        const existingHasEllipsis = existingText.includes('...') || existingText.includes('…');
        const currentHasEllipsis = currentText.includes('...') || currentText.includes('…');

        if (existingHasEllipsis && !currentHasEllipsis) {
          existing.style.setProperty('display', 'none', 'important');
          existing.remove();
          seenCourses.set(courseId, card);
        } else if (!existingHasEllipsis && currentHasEllipsis) {
          card.style.setProperty('display', 'none', 'important');
          card.remove();
        } else if (currentText.length > existingText.length) {
          existing.style.setProperty('display', 'none', 'important');
          existing.remove();
          seenCourses.set(courseId, card);
        } else {
          card.style.setProperty('display', 'none', 'important');
          card.remove();
        }
      } else {
        seenCourses.set(courseId, card);
      }
    });

    // 2.5 Красивый парсинг названий курсов и добавление обложек
    document.querySelectorAll('.list-group-item.mydashboard-list-item:not(.mc-parsed-card)').forEach(card => {
      card.classList.add('mc-parsed-card');
      const link = card.querySelector('a.mydashboard-coursename');
      if (!link) return;

      // Добавляем красивую обложку
      let courseId = 1;
      const match = link.href.match(/id=(\d+)/);
      if (match) courseId = parseInt(match[1]);

      card.dataset.mcCourseId = courseId;

      const hue1 = (courseId * 137) % 360;
      const hue2 = (courseId * 43) % 360;
      const cover = document.createElement('div');
      cover.className = 'mc-course-cover';
      cover.setAttribute('style', `background: linear-gradient(135deg, hsl(${hue1}, 60%, 40%), hsl(${hue2}, 70%, 20%)) !important;`);

      // Если есть бейдж "Обучающийся", он будет спозиционирован абсолютно
      card.insertBefore(cover, card.firstChild);

      // Парсим название
      const fullText = link.textContent.trim();
      const parts = fullText.split('[');
      const mainTitle = parts[0].trim();
      card.dataset.mcOrigTitle = mainTitle;

      let html = `<span class="mc-course-title-main">${mainTitle}</span>`;
      if (parts.length > 1) {
        html += `<div class="mc-course-chips">`;
        for (let i = 1; i < parts.length; i++) {
           const chipText = parts[i].replace(']', '').trim();
           if (chipText) html += `<span class="mc-chip">${chipText}</span>`;
        }
        html += `</div>`;
      }
      link.innerHTML = html;
    });

    // 2.5.0 Применение персональной кастомизации курсов и стиля обложек
    const courseCustoms = currentSettings.courseCustomizations || {};
    const coverStyle = currentSettings.coverStyle || 'gradient';

    document.querySelectorAll('.list-group-item.mydashboard-list-item, .dashboard-card, .course-summary-card, .course-listitem').forEach(card => {
      const link = card.querySelector('a.mydashboard-coursename, a[href*="id="]');
      let courseId = card.dataset.mcCourseId;
      if (!courseId && link) {
        const match = link.href.match(/[?&]id=(\d+)/);
        if (match) courseId = match[1];
      }
      if (!courseId) return;

      const custom = courseCustoms[courseId] || {};

      // 1. Название курса (универсально для списка и сетки карточек)
      let titleMainEl = card.querySelector('.mc-course-title-main');
      if (!titleMainEl) {
        titleMainEl = card.querySelector('.coursename, .course-info-container h3, .course-info-container h4, a[href*="/course/view.php"] .multiline, .card-title, a[href*="/course/view.php"]');
      }
      if (titleMainEl) {
        if (!card.dataset.mcOrigTitle) {
          card.dataset.mcOrigTitle = titleMainEl.textContent.trim();
        }
        const targetTitle = custom.customTitle || card.dataset.mcOrigTitle;
        if (targetTitle && titleMainEl.textContent.trim() !== targetTitle) {
          titleMainEl.textContent = targetTitle;
        }
      }

      // 2. Обложка курса (URL или выбранный стиль, универсально для сетки и списка)
      let coverEl = card.querySelector('.mc-course-cover, .dashboard-card-img, .card-img-top, [data-region="course-image"], .course-image');
      if (!coverEl && card.classList.contains('dashboard-card')) {
        coverEl = card.querySelector('.course-info-container, .card-body');
      }
      if (coverEl) {
        if (custom.customCover) {
          coverEl.style.setProperty('background', `url("${custom.customCover}") center/cover no-repeat`, 'important');
          if (coverEl.tagName === 'IMG') {
            coverEl.src = custom.customCover;
          }
        } else {
          const numId = parseInt(courseId, 10) || 1;
          const hue1 = (numId * 137) % 360;
          const hue2 = (numId * 43) % 360;
          let bgVal = `linear-gradient(135deg, hsl(${hue1}, 60%, 40%), hsl(${hue2}, 70%, 20%))`;
          if (coverStyle === 'pastel') {
            bgVal = `linear-gradient(135deg, hsl(${hue1}, 45%, 60%), hsl(${hue2}, 40%, 40%))`;
          } else if (coverStyle === 'neon') {
            bgVal = `linear-gradient(135deg, hsl(${hue1}, 95%, 55%), hsl(${hue2}, 90%, 25%))`;
          } else if (coverStyle === 'mono') {
            bgVal = `linear-gradient(135deg, #333333, #161616)`;
          }
          coverEl.style.setProperty('background', bgVal, 'important');
        }
      }

      // 3. Закрепление курса (Pin to top через CSS order без DOM-мутаций)
      let badge = card.querySelector('.mc-pinned-badge');
      if (custom.pinned) {
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'mc-pinned-badge';
          card.insertBefore(badge, card.firstChild);
        }
        badge.innerHTML = '<i class="fa fa-thumb-tack" style="color: #ffd54f !important; -webkit-text-fill-color: #ffd54f !important; margin-right: 5px;"></i><span style="color: #ffd54f !important; -webkit-text-fill-color: #ffd54f !important; font-weight: 800 !important;">Закреплен</span>';
        badge.style.setProperty('color', '#ffd54f', 'important');
        badge.style.setProperty('-webkit-text-fill-color', '#ffd54f', 'important');
        if (card.getAttribute('data-mc-pinned') !== 'true') {
          card.setAttribute('data-mc-pinned', 'true');
        }
        card.style.setProperty('order', '-100', 'important');
      } else {
        if (badge) badge.remove();
        if (card.hasAttribute('data-mc-pinned')) {
          card.removeAttribute('data-mc-pinned');
        }
        card.style.removeProperty('order');
      }
    });

    // 2.5.1 Формирование и стандартизация прогресс-бара карточки курса (как в песочнице)
    document.querySelectorAll('.list-group-item.mydashboard-list-item, .block_mydashboard .list-group-item, .dashboard-card, [data-region="course-content"], .coursebox, .course-listitem').forEach(card => {
      let percent = 0;
      let percentFound = false;

      // 1. Проверяем существующий прогресс-бар (Moodle aria-valuenow или style.width)
      const existingBar = card.querySelector('.progress-bar, [role="progressbar"]');
      if (existingBar) {
        const ariaVal = existingBar.getAttribute('aria-valuenow') || existingBar.getAttribute('data-value');
        if (ariaVal !== null && !isNaN(parseInt(ariaVal, 10))) {
          percent = parseInt(ariaVal, 10);
          percentFound = true;
        } else if (existingBar.style && existingBar.style.width && existingBar.style.width.includes('%')) {
          const wMatch = existingBar.style.width.match(/(\d+)%/);
          if (wMatch) {
            percent = parseInt(wMatch[1], 10);
            percentFound = true;
          }
        }
      }

      // 2. Проверяем сохраненный атрибут на контейнере прогресса
      if (!percentFound) {
        const prevProg = card.querySelector('.mydashboard-progress');
        if (prevProg && prevProg.getAttribute('data-rendered-percent') !== null) {
          const val = prevProg.getAttribute('data-rendered-percent');
          if (val !== '' && !isNaN(parseInt(val, 10))) {
            percent = parseInt(val, 10);
            percentFound = true;
          }
        }
      }

      // 3. Проверяем текстовые элементы с процентами
      if (!percentFound) {
        const pctEl = card.querySelector('[data-region="progress-percentage"], .progress-percentage, .text-muted, .progress-desc');
        if (pctEl) {
          const m = (pctEl.textContent || '').match(/(\d+)%/);
          if (m) {
            percent = parseInt(m[1], 10);
            percentFound = true;
          }
        }
      }

      // 4. Проверяем весь текст карточки на наличие %
      if (!percentFound) {
        const text = (card.textContent || '').trim();
        const percentMatch = text.match(/(\d+)%/);
        if (percentMatch) {
          percent = parseInt(percentMatch[1], 10);
          percentFound = true;
        }
      }

      percent = Math.max(0, Math.min(100, percent));

      // Прячем любые отдельные дублирующиеся элементы с процентами от Moodle
      card.querySelectorAll('*').forEach(el => {
        if (!el.closest('.mydashboard-progress') && el.children.length === 0 && /^\s*\d+%\s*$/.test(el.textContent)) {
          el.style.setProperty('display', 'none', 'important');
        }
      });

      let progressContainer = card.querySelector('.mydashboard-progress');
      if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.className = 'mydashboard-progress';
        card.appendChild(progressContainer);
      } else if (progressContainer.parentElement !== card) {
        card.appendChild(progressContainer);
      }

      let barColor = 'var(--mc-accent, #D0BCFF)';
      let strongColor = 'var(--mc-accent, #D0BCFF)';
      const colorMode = currentSettings.progressColorMode || 'accent';

      if (colorMode === 'smart') {
        if (percent < 25) {
          barColor = '#ff5252';
        } else if (percent < 60) {
          barColor = '#ffa726';
        } else if (percent < 100) {
          barColor = '#29b6f6';
        } else {
          barColor = '#66bb6a';
        }
        strongColor = barColor;
      } else if (colorMode === 'gradient') {
        barColor = 'linear-gradient(90deg, #ff5252, #ffa726, #29b6f6, #66bb6a)';
        strongColor = '#29b6f6';
      }

      const strVal = String(percent);
      const colorKey = `${percent}_${colorMode}`;
      if (progressContainer.getAttribute('data-rendered-key') !== colorKey || !progressContainer.querySelector('.progress')) {
        progressContainer.setAttribute('data-rendered-key', colorKey);
        progressContainer.setAttribute('data-rendered-percent', strVal);
        progressContainer.innerHTML = `
          <div class="mydashboard-progress-string">Прогресс: <strong style="color: ${strongColor} !important;">${percent}%</strong></div>
          <div class="progress" style="background: var(--mc-outline-variant, rgba(127, 127, 127, 0.2)) !important; overflow: hidden !important; width: 100% !important; display: flex !important; margin: 0 !important; border: none !important;">
            <div class="progress-bar" role="progressbar" style="width: ${percent}% !important; height: 100% !important; background: ${barColor} !important; --mc-bar-color: ${strongColor}; display: block !important; transition: width 0.3s ease !important;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        `;
      }

      const menuBox = card.querySelector('.mydashboard-menu-box, .mydahboard-menu-box');
      if (menuBox && menuBox.parentElement !== card) {
        card.appendChild(menuBox);
      }
    });

    // 2.6 Перенос техподдержки в подвал (Footer)
    const drawerList = document.querySelector('#theme_boost-drawers-primary .list-group');
    if (drawerList && !drawerList.classList.contains('mc-drawer-parsed')) {
        drawerList.classList.add('mc-drawer-parsed');
        const links = Array.from(drawerList.querySelectorAll('a'));
        const supportLink = links.find(a => a.textContent.includes('технической поддержки'));
        const footer = document.querySelector('#page-footer') || document.body;
        if (supportLink && !document.querySelector('.mc-support-link-footer')) {
            const newLink = document.createElement('a');
            newLink.href = supportLink.href;
            newLink.textContent = supportLink.textContent;
            newLink.className = 'mc-support-link-footer';
            footer.appendChild(newLink);
            supportLink.style.setProperty('display', 'none', 'important'); // Прячем из меню
        }
    }

    // 2.3 Восстановление обводки и стилей для кнопок-фильтров дашборда (Все, Учебный год, Текущие, Поиск и т.д.)
    document.querySelectorAll('.mydashboard-filters-coursesearch-box, .mydashboard-filters-coursesearch, .coursesearch-box').forEach(box => {
      box.style.setProperty('border', 'none', 'important');
      box.style.setProperty('outline', 'none', 'important');
      box.style.setProperty('box-shadow', 'none', 'important');
      box.style.setProperty('background', 'transparent', 'important');
      box.style.setProperty('background-color', 'transparent', 'important');
      box.style.setProperty('padding', '0', 'important');
      box.style.setProperty('min-height', '0', 'important');
    });

    document.querySelectorAll('.block_mydashboard, .block_myoverview, [data-region="courses-view"], #region-main, .main-inner, .block').forEach(dash => {
      dash.querySelectorAll('[data-region="filter"] a, [data-region="filter"] button, .nav .nav-link, .nav-pills .nav-link, .nav-tabs .nav-link, .dropdown-toggle, input[type="text"], input[type="search"], .form-control, button[type="submit"], [data-action="search"], button[data-coursesearch="coursesearch"], .coursesearch-box button, .simplesearchform .btn, [data-region="display-selector"] button, [data-region="display-selector"] a, [data-region="sorting-selector"] button, [data-region="sorting-selector"] a, .btn-outline-secondary, .btn-secondary, a.rounded-pill, button.rounded-pill').forEach(btn => {
        if (btn.closest('.list-group-item, .mydashboard-list-item, .mc-course-cover, .mc-fab-button, .mc-course-chips')) return;
        if (btn.tagName === 'I' || btn.tagName === 'SPAN' || btn.tagName === 'SVG') return;

        // Выравниваем высоту поля поиска курса и кнопки "Поиск"
        if (btn.getAttribute('name') === 'coursesearch' || btn.getAttribute('data-coursesearch') === 'coursesearch' || btn.closest('.coursesearch-box, .mydashboard-filters-coursesearch, .simplesearchform')) {
          btn.style.setProperty('height', '40px', 'important');
          btn.style.setProperty('min-height', '40px', 'important');
          btn.style.setProperty('max-height', '40px', 'important');
          btn.style.setProperty('box-sizing', 'border-box', 'important');
          btn.style.setProperty('line-height', '38px', 'important');
          btn.style.setProperty('margin', '0', 'important');
          if (btn.tagName === 'INPUT') {
            btn.style.setProperty('padding', '0 18px', 'important');
          } else {
            btn.style.setProperty('padding', '0 22px', 'important');
            btn.style.setProperty('display', 'inline-flex', 'important');
            btn.style.setProperty('align-items', 'center', 'important');
            btn.style.setProperty('justify-content', 'center', 'important');
          }
        }

        btn.style.setProperty('border-radius', 'var(--mc-radius-btn, 24px)', 'important');

        // Проверяем, активна ли кнопка
        const isActive = btn.classList.contains('active') ||
                         btn.getAttribute('aria-selected') === 'true' ||
                         btn.getAttribute('aria-current') === 'page' ||
                         btn.getAttribute('aria-current') === 'true' ||
                         btn.parentElement?.classList.contains('active') ||
                         btn.parentElement?.getAttribute('aria-selected') === 'true';

        if (isActive) {
          btn.style.setProperty('background-color', 'var(--mc-accent)', 'important');
          btn.style.setProperty('color', 'var(--mc-accent-contrast)', 'important');
          btn.style.setProperty('border', '1px solid var(--mc-accent)', 'important');
          btn.style.setProperty('font-weight', '700', 'important');
          btn.querySelectorAll('span, i, svg').forEach(s => {
            s.style.setProperty('color', 'var(--mc-accent-contrast)', 'important');
            s.style.setProperty('fill', 'var(--mc-accent-contrast)', 'important');
          });
        } else {
          if (btn.tagName !== 'INPUT') {
            btn.style.setProperty('background-color', 'var(--mc-bg-card-low)', 'important');
            btn.style.setProperty('color', 'var(--mc-text)', 'important');
          }
          btn.style.setProperty('border', '1px solid var(--mc-border)', 'important');
          btn.style.setProperty('font-weight', '600', 'important');
        }
      });
    });

    // Принудительно задаем обводку и скругление для карточек курсов ("клетки" и список)
    document.querySelectorAll('.list-group-item.mydashboard-list-item, .dashboard-card, .dashboard-card-deck .dashboard-card, [data-region="card-deck"] .card, [data-region="courses-view"] .card, .course-listitem').forEach(card => {
      card.style.removeProperty('border');
      card.style.removeProperty('box-shadow');
      card.style.setProperty('border-radius', 'var(--mc-radius, 20px)', 'important');
      card.style.setProperty('background-color', 'var(--mc-bg-card)', 'important');
      if (!card.hasAttribute('data-mc-moved') && !card.hasAttribute('data-mc-layer')) {
        card.style.setProperty('overflow', 'hidden', 'important');
      }
      if (currentSettings.cardBlur && currentSettings.cardBlur > 0) {
        card.style.setProperty('backdrop-filter', 'blur(var(--mc-blur, 0px))', 'important');
        card.style.setProperty('-webkit-backdrop-filter', 'blur(var(--mc-blur, 0px))', 'important');
      } else {
        card.style.removeProperty('backdrop-filter');
        card.style.removeProperty('-webkit-backdrop-filter');
      }
    });

    // Синхронизируем класс наличия кнопки левой навигации (для отступа шапки в одну строчку с кнопкой)
    if (document.body) {
      const hasVisibleLeftToggle = !!document.querySelector('#page.drawers:not(.show-drawer-left) .drawer-toggles .drawer-left-toggle');
      document.body.classList.toggle('mc-has-left-toggle', hasVisibleLeftToggle);
    }

    // 2.7 Окраска иконок избранного (закладок) в цвет текста темы (адаптируется к светлой и темной теме)
    document.querySelectorAll('.list-group-item.mydashboard-list-item, .dashboard-card-deck .dashboard-card, .course-listitem').forEach(card => {
      card.querySelectorAll('*').forEach(el => {
        if (el.classList.contains('mc-course-cover') ||
            el.classList.contains('mc-chip') ||
            el.classList.contains('mc-course-chips') ||
            el.classList.contains('mc-course-title-main') ||
            el.classList.contains('mc-pinned-badge') ||
            el.closest('.mc-pinned-badge') ||
            el.closest('.mydashboard-course, .mydashboard-coursename, .progress, .progress-bar, .mydashboard-progress-string') ||
            el.classList.contains('mydashboard-progress')) {
          return;
        }

        // Любой оставшийся элемент карточки (закладка, кнопка меню, иконка)
        el.style.setProperty('color', 'var(--mc-text)', 'important');
        el.style.setProperty('filter', 'none', 'important');

        const tag = el.tagName.toLowerCase();
        if (tag === 'svg' || tag === 'path') {
          el.style.setProperty('stroke', 'var(--mc-text)', 'important');
          el.style.setProperty('color', 'var(--mc-text)', 'important');
          if (el.getAttribute('fill') && el.getAttribute('fill') !== 'none') {
            el.style.setProperty('fill', 'var(--mc-text)', 'important');
          }
        }
        if (tag === 'img') {
          const src = el.src;
          if (src) {
            el.style.setProperty('background-color', 'var(--mc-text)', 'important');
            el.style.setProperty('-webkit-mask-image', `url("${src}")`, 'important');
            el.style.setProperty('mask-image', `url("${src}")`, 'important');
            el.style.setProperty('-webkit-mask-size', 'contain', 'important');
            el.style.setProperty('mask-size', 'contain', 'important');
            el.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
            el.style.setProperty('mask-repeat', 'no-repeat', 'important');
          }
        }
      });
    });

    document.querySelectorAll('.btn-favourite, .mydashboard-menu-box, .mydahboard-menu-box, .fa-bookmark, .fa-bookmark-o').forEach(fav => {
      fav.style.setProperty('filter', 'none', 'important');
      fav.style.setProperty('color', 'var(--mc-text)', 'important');
      fav.querySelectorAll('*').forEach(child => {
        child.style.setProperty('filter', 'none', 'important');
        child.style.setProperty('color', 'var(--mc-text)', 'important');
        if (child.tagName === 'svg' || child.tagName === 'path') {
          child.style.setProperty('stroke', 'var(--mc-text)', 'important');
        }
      });
    });

    // 2.7.1 Устранение двойных закладок в карточках курсов (режим "карточки" / дашборд)
    document.querySelectorAll('.list-group-item.mydashboard-list-item, .dashboard-card, .course-listitem, [data-region="card-deck"] .card, [data-region="course-content"], .block_mydashboard .list-group-item').forEach(card => {
      // 1. Скрываем нативный индикатор [data-region="favourite-icon"], если в карточке есть кнопка .btn-favourite
      const btnFav = card.querySelector('.btn-favourite, .mydashboard-menu-box, .mydahboard-menu-box');
      const favRegion = card.querySelector('[data-region="favourite-icon"], .favourite-icon');
      if (btnFav && favRegion) {
        favRegion.style.setProperty('display', 'none', 'important');
      }

      // 2. Если внутри кнопки .btn-favourite находятся два тега <i> (контурный и залитый одновременно)
      card.querySelectorAll('.btn-favourite').forEach(btn => {
        const isAct = btn.classList.contains('active') || btn.classList.contains('favourited');
        const outlineIcon = btn.querySelector('.fa-bookmark-o');
        const filledIcon = btn.querySelector('.fa-bookmark:not(.fa-bookmark-o)');
        if (outlineIcon && filledIcon) {
          if (isAct) {
            outlineIcon.style.setProperty('display', 'none', 'important');
            filledIcon.style.setProperty('display', 'inline-block', 'important');
          } else {
            filledIcon.style.setProperty('display', 'none', 'important');
            outlineIcon.style.setProperty('display', 'inline-block', 'important');
          }
        }
      });

      // 3. Если в карточке оказалось несколько одинаковых кнопок закладок (дубли верстки)
      const allFavBtns = card.querySelectorAll('.btn-favourite, .mydashboard-menu-box, .mydahboard-menu-box');
      if (allFavBtns.length > 1) {
        for (let i = 1; i < allFavBtns.length; i++) {
          allFavBtns[i].style.setProperty('display', 'none', 'important');
        }
      }
    });
    if (window.location.pathname.includes('/course/view.php')) {
      // 1. Шапка курса: заголовок, чипы и прогресс-бар
      const h1 = document.querySelector('#page-header h1, .page-header-headings h1, .page-context-header h1');
      if (h1 && !h1.classList.contains('mc-parsed-course-header')) {
        h1.classList.add('mc-parsed-course-header');
        const fullTitle = h1.textContent.trim();
        const parts = fullTitle.split('[');
        const mainTitle = parts[0].trim();
        h1.textContent = mainTitle;
        h1.style.setProperty('font-size', '1.65rem', 'important');
        h1.style.setProperty('font-weight', '800', 'important');
        h1.style.setProperty('color', 'var(--mc-text)', 'important');
        h1.style.setProperty('margin-bottom', '8px', 'important');

        if (parts.length > 1) {
          let chipsBox = h1.parentElement.querySelector('.mc-course-chips');
          if (!chipsBox) {
            chipsBox = document.createElement('div');
            chipsBox.className = 'mc-course-chips';
            h1.parentElement.insertBefore(chipsBox, h1.nextSibling);
          }
          chipsBox.innerHTML = '';
          for (let i = 1; i < parts.length; i++) {
            const chipText = parts[i].replace(']', '').trim();
            if (chipText) {
              const chip = document.createElement('span');
              chip.className = 'mc-chip';
              chip.textContent = chipText;
              chipsBox.appendChild(chip);
            }
          }
        }
      }

      // 2. Добавляем прогресс-бар курса в шапку (как в песочнице)
      const h1El = document.querySelector('#page-header h1, .page-header-headings h1, .page-context-header h1');
      if (h1El) {
        // Ищем активности с отслеживанием выполнения
        const completableActs = Array.from(document.querySelectorAll('.activity-item, li.activity')).filter(act => {
          return !act.closest('.filemanager, .filepicker, #filemanager') &&
                 !!act.querySelector('[data-region="completion-info"], .activity-completion, [data-action="toggle-manual-completion"], .completion-info, .automatic-completion-conditions, form.togglecompletion');
        });

        const completedActs = completableActs.filter(act => {
          const isDoneManual = !!act.querySelector(
            'button[data-toggletype="manual:undo"], button[data-action="toggle-manual-completion"][aria-checked="true"], button[data-action="toggle-manual-completion"].btn-outline-success, button[aria-label*="Выполнено"], button[aria-label*="Отмечено как выполнено"], button[aria-label*="Done"]'
          );
          const isDoneAuto = !!act.querySelector(
            '[data-region="completion-info"] .badge-success, [data-region="completion-info"] .text-success, [data-region="completion-info"] .bg-success, [data-region="completion-info"] .text-bg-success, [data-region="completion-info"] [data-state="completed"], [data-region="completion-info"] [data-state="pass"], .iscompleted, img[src*="completion-manual-y"], img[src*="completion-auto-y"], img[src*="completion-auto-pass"]'
          );
          return isDoneManual || isDoneAuto;
        });

        let percent = null;
        // Проверяем встроенный индикатор Moodle если есть
        const moodleProg = document.querySelector('[data-region="course-progress"], .block_completion_progress .progressBar, .course-progress-bar');
        if (moodleProg) {
          const ariaVal = moodleProg.getAttribute('aria-valuenow') || moodleProg.getAttribute('data-value');
          if (ariaVal !== null && !isNaN(parseInt(ariaVal, 10))) {
            percent = parseInt(ariaVal, 10);
          } else {
            const m = (moodleProg.textContent || '').match(/(\d+)%/);
            if (m) percent = parseInt(m[1], 10);
          }
        }

        if (percent === null) {
          const total = completableActs.length;
          const done = completedActs.length;
          percent = total > 0 ? Math.round((done / total) * 100) : 0;
        }

        percent = Math.max(0, Math.min(100, percent));

        let progBox = document.querySelector('#mc-live-course-progress');
        if (!progBox) {
          progBox = document.createElement('div');
          progBox.id = 'mc-live-course-progress';
          progBox.className = 'mc-course-prog-box';
          if (h1El.parentElement) {
            const nextTarget = h1El.parentElement.querySelector('.mc-course-chips') || h1El;
            h1El.parentElement.insertBefore(progBox, nextTarget.nextSibling);
          }
        }

        const currentAttr = progBox.getAttribute('data-percent');
        if (currentAttr !== String(percent) || !progBox.querySelector('.progress')) {
          progBox.setAttribute('data-percent', String(percent));
          progBox.innerHTML = `
            <div class="course-prog-text">Прогресс курса: <strong>${percent}%</strong></div>
            <div class="progress" style="height: 6px !important; min-height: 6px !important; background: var(--mc-outline-variant, rgba(127, 127, 127, 0.2)) !important; border-radius: 6px !important; overflow: hidden !important; width: 220px !important; display: flex !important; margin: 0 !important; border: none !important;">
              <div class="progress-bar" role="progressbar" style="width: ${percent}% !important; height: 100% !important; background: var(--mc-accent) !important; border-radius: 6px !important; transition: width 0.3s ease !important;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          `;
        }
      }

      // 3. Добавляем бейджи к активностям (БРС, Задание, Материал, Тест) ровно как в песочнице
      document.querySelectorAll('.activity-item, li.activity').forEach(act => {
        if (act.closest('.filemanager, .filepicker, .fp-file, #filemanager')) return;
        // Избегаем повторной обработки
        if (act.querySelector('.mc-act-badge')) return;

        const link = act.querySelector('a.aalink, .activityname a, a[href*="/mod/"]');
        if (!link) return;

        const text = (link.textContent || '').trim();
        const cls = (act.className || '') + ' ' + (link.className || '');
        let badgeText = '';

        if (text.includes('БРС') || text.includes('Балльно-рейтинг')) {
          badgeText = 'БРС';
        } else if (cls.includes('quiz') || text.toLowerCase().includes('тест')) {
          badgeText = 'Тест';
        } else if (cls.includes('assign') || text.toLowerCase().includes('задание') || text.toLowerCase().includes('практическ')) {
          badgeText = 'Задание';
        } else if (cls.includes('resource') || cls.includes('folder') || text.toLowerCase().includes('лекция') || text.toLowerCase().includes('материал')) {
          badgeText = 'Материал';
        } else if (cls.includes('url') || text.toLowerCase().includes('ссылка')) {
          badgeText = 'Ссылка';
        } else if (cls.includes('forum') || text.toLowerCase().includes('форум')) {
          badgeText = 'Форум';
        }

        if (badgeText) {
          const badge = document.createElement('span');
          badge.className = 'mc-act-badge';
          badge.textContent = badgeText;
          const target = act.querySelector('.activity-instance, .activity-basis, .d-flex') || act;
          target.insertBefore(badge, target.firstChild);

          // Убираем дублирование типа в тексте (например "БРС БРС..." или "Задание Задание...")
          const linkTextEl = link.querySelector('.instancename') || link;
          Array.from(linkTextEl.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              const regex = new RegExp(`^\\s*${badgeText}\\s*[-:—]?\\s*`, 'i');
              if (regex.test(node.textContent)) {
                node.textContent = node.textContent.replace(regex, '');
              }
            }
          });
        }
      });

      // 4. Разворачиваем вкладки курса (Курс, Оценки) во вторичной навигации
      const navBars = document.querySelectorAll('.secondary-navigation, [data-region="secondary-navigation"]');
      navBars.forEach(secNav => {
        secNav.style.setProperty('display', 'block', 'important');
        secNav.style.setProperty('visibility', 'visible', 'important');

        const navList = secNav.querySelector('.nav-tabs, ul.more-nav, ul.nav');
        if (navList) {
          navList.style.setProperty('display', 'flex', 'important');
          navList.style.setProperty('visibility', 'visible', 'important');
          navList.style.setProperty('opacity', '1', 'important');

          // Если Moodle успел переместить ссылки внутрь .dropdown-menu, достаем их в основной ряд
          const dropdownMenus = secNav.querySelectorAll('.dropdown-menu');
          dropdownMenus.forEach(dropdownMenu => {
            dropdownMenu.querySelectorAll('a.dropdown-item').forEach(item => {
              const itemText = item.textContent.replace(/^[✓✔\s]+/, '').trim();
              if (!itemText) return;
              const exists = Array.from(navList.children).some(child =>
                !child.matches('.dropdown, [data-region="morebutton"], .dropdown-moremenu, [data-key="moremenu"]') &&
                child.textContent.replace(/^[✓✔\s]+/, '').trim().toLowerCase().includes(itemText.toLowerCase())
              );
              if (!exists) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.setAttribute('role', 'none');
                const a = document.createElement('a');
                a.href = item.href;
                a.className = 'nav-link' + (item.classList.contains('active') ? ' active' : '');
                a.textContent = itemText;
                li.appendChild(a);
                const dropLi = navList.querySelector('.dropdown, [data-region="morebutton"], .dropdown-moremenu, [data-key="moremenu"]');
                if (dropLi) {
                  navList.insertBefore(li, dropLi);
                } else {
                  navList.appendChild(li);
                }
              }
            });
          });

          // Показываем обычные вкладки (Курс, Оценки), снимая d-none и inline скрытие
          Array.from(navList.children).forEach(li => {
            if (li.matches('.dropdown, [data-region="morebutton"], .dropdown-moremenu, [data-key="moremenu"]') || li.textContent.trim().toLowerCase().startsWith('больше')) {
              // Прячем кнопку "Больше..."
              li.style.setProperty('display', 'none', 'important');
              li.style.setProperty('visibility', 'hidden', 'important');
              li.style.setProperty('opacity', '0', 'important');
              li.style.setProperty('pointer-events', 'none', 'important');
            } else {
              li.classList.remove('d-none');
              li.style.setProperty('display', 'inline-flex', 'important');
              li.style.setProperty('visibility', 'visible', 'important');
              li.style.setProperty('opacity', '1', 'important');
            }
          });
        }
      });

      // Скрытие остаточных кнопок "Больше..." только внутри вторичной навигации
      document.querySelectorAll('.secondary-navigation [data-region="morebutton"], .secondary-navigation .dropdown-moremenu, .secondary-navigation [data-key="moremenu"], [data-region="secondary-navigation"] [data-region="morebutton"], [data-region="secondary-navigation"] .dropdown-moremenu, [data-region="secondary-navigation"] [data-key="moremenu"]').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      });
    }

    // 3. Динамический "убийца" белых фонов (100% гарантия)
    // Ищем все карточки курсов, главный контент и навигационные панели
    const courseAnchors = document.querySelectorAll('a[href*="/course/view.php"], .coursebox, [data-region="course-content"], #region-main, #page-content, .secondary-navigation, .tertiary-navigation, #page-header, .moremenu, .nav-tabs, [data-region="secondary-navigation"]');
    courseAnchors.forEach(anchor => {
      let container = anchor;
      const isNav = anchor.id === 'region-main' ||
                    anchor.id === 'page-content' ||
                    anchor.id === 'page-header' ||
                    anchor.hasAttribute('data-region') ||
                    anchor.classList.contains('secondary-navigation') ||
                    anchor.classList.contains('tertiary-navigation') ||
                    anchor.classList.contains('moremenu') ||
                    anchor.classList.contains('nav-tabs');

      // Если это не главные или навигационные регионы, ищем родительскую карточку
      if (!isNav) {
        while (container && container.parentElement && !container.classList.contains('block_myoverview') && !container.classList.contains('list-group') && container.tagName !== 'BODY') {
          if (container.classList.contains('card') || container.classList.contains('list-group-item') || container.classList.contains('coursebox') || container.classList.contains('course-listitem')) {
            break; // Нашли!
          }
          container = container.parentElement;
        }
      }

      if (container && container !== document.body) {
        if (isNav) {
          // Навигационные и главные регионы делаем полностью прозрачными
          container.style.setProperty('background-color', 'transparent', 'important');
          container.style.setProperty('background', 'transparent', 'important');
          container.style.setProperty('border-color', 'var(--mc-border)', 'important');
        } else {
          // Карточки курсов красим в тёмный цвет темы
          container.style.setProperty('background-color', 'var(--mc-bg-card)', 'important');
          container.style.setProperty('background', 'var(--mc-bg-card)', 'important');
          container.style.setProperty('border', '1px solid var(--mc-border)', 'important');
          container.style.setProperty('border-radius', 'var(--mc-radius)', 'important');
        }

        // Сканируем все внутренности и уничтожаем белые фоны
        container.querySelectorAll('*').forEach(el => {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const classes = Array.from(el.classList).join(' ').toLowerCase();

          // Очистка контейнеров вкладок (nav-tabs, secondary-navigation, moremenu)
          if (classes.includes('nav-tabs') || classes.includes('moremenu') || classes.includes('secondary-navigation') || classes.includes('more-nav') || (classes.includes('nav-item') && !classes.includes('nav-link'))) {
            if (!classes.includes('nav-link') && el.tagName !== 'A' && el.tagName !== 'BUTTON') {
              el.style.setProperty('background-color', 'transparent', 'important');
              el.style.setProperty('background', 'transparent', 'important');
              el.style.setProperty('border-color', 'var(--mc-border)', 'important');
              return;
            }
          }

          const text = el.textContent.trim().toLowerCase();
          if ((text === 'текущий' || text === 'текущий раздел') && el.children.length === 0 && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
              el.style.setProperty('background-color', 'var(--mc-accent-container)', 'important');
              el.style.setProperty('color', 'var(--mc-on-accent-container)', 'important');
              el.style.setProperty('border-radius', '8px', 'important');
              el.style.setProperty('padding', '1px 6px', 'important');
              el.style.setProperty('font-size', '0.75em', 'important');
              el.style.setProperty('font-weight', '600', 'important');
              el.style.setProperty('display', 'inline-block', 'important');
              el.style.setProperty('vertical-align', 'middle', 'important');
              el.style.setProperty('line-height', '1.4', 'important');
              el.style.setProperty('white-space', 'nowrap', 'important');
              el.style.setProperty('margin-top', '-2px', 'important');

              // Красим иконку закладки (ищем в более широком родительском контейнере)
              let container = el.closest('li.section, .course-section, .d-flex, .row, .card-body, .content');
              if (!container) container = el.parentElement;
              if (container) {
                  container.querySelectorAll('i, .fa, .fas, .far, .icon').forEach(icon => {
                      if (icon !== el) icon.style.setProperty('color', 'var(--mc-text)', 'important');
                  });
                  container.querySelectorAll('svg, img').forEach(icon => {
                      icon.style.setProperty('filter', 'var(--mc-icon-filter)', 'important');
                  });
              }
              return;
          }

          if (classes.includes('progress') || classes.includes('progress-bar') || classes.includes('mydashboard-progress') || el.closest('.mydashboard-progress, .progress')) {
             return; // Прогресс-бар не трогаем, чтобы не убить серый фон трека
          }
          if (classes.includes('badge') || classes.includes('status') || classes.includes('current') || classes.includes('highlight') || el.tagName === 'IMG' || el.closest('[data-region="filter"], [data-region="sorting-selector"], [data-region="display-selector"], .simplesearchform')) {
             return; // Эти точно не трогаем (бейджи оценок, картинки, фильтры и переключатели дашборда)
          }
          if (classes.includes('bg-') && !classes.includes('bg-white') && !classes.includes('bg-light')) {
             return; // Защищаем цветные фоны (bg-secondary и т.д.)
          }
          if (el.closest('.filemanager, .filepicker, [data-fieldtype="filemanager"], .fp-file, .fp-generallayout')) {
             return; // Файловый менеджер имеет свои изолированные стили, не трогаем его
          }
          if (classes.includes('dropdown-menu') || classes.includes('popover') || classes.includes('modal-content') || el.closest('.dropdown-menu, .popover, .popover-region-container, .popover-region-content, .modal, .modal-dialog, .modal-content, [data-region="moodle-actionmenu"], .action-menu, .moodle-dialogue-wrap, select, .custom-select, [role="menu"], [role="listbox"]')) {
             return; // Выпадающие списки, поповеры и всплывающие меню ВСЕГДА должны оставаться непрозрачными!
          }

          let isLight = false;
          const rgbMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgbMatch) {
             const r = parseInt(rgbMatch[1], 10);
             const g = parseInt(rgbMatch[2], 10);
             const b = parseInt(rgbMatch[3], 10);
             // Считаем фон светлым, если он ярче 220 по всем каналам (светло-серый, белый, пастельный)
             if (r > 220 && g > 220 && b > 220) {
                 isLight = true;
             }
          }
          if (bg === '#fff' || bg === '#ffffff') isLight = true;

          // Если браузер реально отрисовал белый или светло-серый фон
          if (isLight) {
              if (classes.includes('userinitials') || (classes.includes('userpicture') && el.tagName === 'IMG')) {
                  el.style.setProperty('border', 'none', 'important');
                  el.style.setProperty('box-shadow', 'none', 'important');
                  el.style.setProperty('border-radius', '50%', 'important');
                  return;
              }
              const isAvatarWrapper = classes.includes('userpicture') || classes.includes('avatar') || classes.includes('userbutton') || !!el.closest('.page-header-image, .userpicture, .avatar, .userbutton');
              if (isAvatarWrapper) {
                  el.style.setProperty('border', 'none', 'important');
                  el.style.setProperty('box-shadow', 'none', 'important');
                  el.style.setProperty('background', 'transparent', 'important');
                  el.style.setProperty('background-color', 'transparent', 'important');
                  return;
              }

              // Если это реально кнопка или плашка (НО НЕ обычные текстовые ссылки <a> и НЕ обертки аватарок)
              const isRealBtn = (classes.includes('btn') || el.tagName === 'BUTTON' || (classes.includes('nav-link') && !classes.includes('nav-tabs'))) &&
                                !classes.includes('instancename') &&
                                !el.closest('.page-header-image, .userpicture, .avatar, .userbutton, .usermenu') &&
                                !el.querySelector('.userinitials, img.userpicture');
              if (isRealBtn) {
                  el.style.setProperty('background-color', 'var(--mc-bg-card)', 'important');
                  el.style.setProperty('color', 'var(--mc-text)', 'important');
                  el.style.setProperty('border', '1px solid var(--mc-border)', 'important');
                  el.style.setProperty('border-color', 'var(--mc-border)', 'important');
              } else {
                  // Обычный контейнер или ссылку просто делаем прозрачным без лишних рамок
                  el.style.setProperty('background-color', 'transparent', 'important');
                  el.style.setProperty('background', 'transparent', 'important');
                  if (el.tagName === 'A' && !classes.includes('btn')) {
                      el.style.setProperty('border', 'none', 'important');
                  }
              }
          }
        });
      }
    });

    // 4. Очистка файлового менеджера и гарантия того, что оверлей дропзоны не перекрывает файлы
    document.querySelectorAll('.filemanager, .filepicker, [data-fieldtype="filemanager"]').forEach(fm => {
      // Сбрасываем лишние оверлеи и плашки
      fm.querySelectorAll('.dndupload-target, .dndupload-dropzone, .dndupload-message, .dndupload-uploadinprogress, .filemanager-container, .fp-generallayout').forEach(el => {
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
      });
      // Если добавлены файлы — оверлей уходит на задний план и не перехватывает клики
      const files = fm.querySelectorAll('.fp-file');
      if (files.length > 0) {
        fm.querySelectorAll('.dndupload-target, .dndupload-dropzone, .dndupload-message').forEach(el => {
          el.style.setProperty('pointer-events', 'none', 'important');
          el.style.setProperty('z-index', '1', 'important');
        });
        files.forEach(f => {
          f.style.setProperty('position', 'relative', 'important');
          f.style.setProperty('z-index', '20', 'important');
          f.style.setProperty('pointer-events', 'auto', 'important');
        });
      }
      fm.querySelectorAll('.fp-thumbnail-loading, .loading-icon, .spinner, .fp-reficons, .mc-act-badge').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      });
      // Гарантируем корректное отображение файлов в режиме сетки/иконок (fp-iconview), списка и дерева
      fm.querySelectorAll('.fp-file').forEach(fileEl => {
        fileEl.style.setProperty('position', 'relative', 'important');
        fileEl.style.setProperty('z-index', '20', 'important');
        fileEl.style.setProperty('pointer-events', 'auto', 'important');
        fileEl.style.setProperty('visibility', 'visible', 'important');
        fileEl.style.setProperty('opacity', '1', 'important');

        // Все ссылки внутри .fp-file (основной контейнер карточки в Moodle) должны быть видимы
        fileEl.querySelectorAll('a').forEach(aEl => {
          if (!aEl.classList.contains('fp-contextmenu')) {
            aEl.style.setProperty('display', 'block', 'important');
          }
          aEl.style.setProperty('visibility', 'visible', 'important');
          aEl.style.setProperty('opacity', '1', 'important');
          aEl.style.setProperty('pointer-events', 'auto', 'important');
        });

        fileEl.querySelectorAll('.fp-thumbnail, .fp-filename, .fp-filename-field, .fp-fileinfo').forEach(visibleEl => {
          visibleEl.style.setProperty('visibility', 'visible', 'important');
          visibleEl.style.setProperty('opacity', '1', 'important');
        });

        // Прячем только реальные спиннеры загрузки и бейджи
        fileEl.querySelectorAll('.fp-thumbnail-loading, .loading-icon, .spinner, [class*="loading"], [class*="spinner"], .mc-act-badge').forEach(extra => {
          extra.style.setProperty('display', 'none', 'important');
          extra.style.setProperty('visibility', 'hidden', 'important');
        });
      });
    });

    // 5. Перекрашиваем темный текст внутри форм, карточек и статических описаний
    document.querySelectorAll('.mform, form, .box.generalbox, #region-main .card, #region-main, .card-body').forEach(container => {
      container.querySelectorAll('h1, h2, h3, h4, h5, p, span, div, legend, label, .felement, .form-control-static, font, strong, b').forEach(el => {
        if (el.closest('.btn, .badge, .mc-act-badge, .mc-pinned-badge, select, button, .mc-fab-button')) return;
        const color = window.getComputedStyle(el).color;
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1], 10);
          const g = parseInt(match[2], 10);
          const b = parseInt(match[3], 10);
          // Если текст тёмный на тёмном фоне (яркость меньше 110)
          if (r < 110 && g < 110 && b < 110) {
            el.style.setProperty('color', 'var(--mc-text)', 'important');
          }
        }
      });
    });

    // 6. Гарантия 100% непрозрачности для всех выпадающих списков, поповеров и контекстных меню
    document.querySelectorAll('.dropdown-menu, .popover-region-container, .popover, .modal-content, [data-region="moodle-actionmenu"] .dropdown-menu, .action-menu .dropdown-menu, .moodle-dialogue-wrap, .primary-navigation .dropdown-menu, .moremenu .dropdown-menu, [data-region="moremenu"] .dropdown-menu, .usermenu .dropdown-menu').forEach(menu => {
      menu.style.setProperty('background-color', 'var(--mc-card-solid)', 'important');
      menu.style.setProperty('background', 'var(--mc-card-solid)', 'important');
      menu.style.setProperty('opacity', '1', 'important');
      menu.style.setProperty('border', '1px solid var(--mc-border)', 'important');
      menu.style.setProperty('z-index', '1065', 'important');
      menu.style.setProperty('box-shadow', '0 16px 40px rgba(0, 0, 0, 0.75), 0 6px 16px rgba(0, 0, 0, 0.45)', 'important');
    });

    // 7. Сброс белых фонов в ячейках таблиц и журнале оценок
    document.querySelectorAll('.user-grade th, .user-grade td, .generaltable th, .generaltable td, table th, table td').forEach(cell => {
      const bg = window.getComputedStyle(cell).backgroundColor;
      if (bg === 'rgb(255, 255, 255)' || bg === '#fff' || bg === '#ffffff') {
        cell.style.setProperty('background-color', 'var(--mc-card-solid)', 'important');
      }
    });

    // 8. Сброс рамок и лишних фонов у оберток аватарок (устранение квадратов вокруг круглой аватарки)
    document.querySelectorAll('.page-header-image, .page-header-image a, a.userpicture, .usermenu a, .userbutton a').forEach(av => {
      av.style.setProperty('border', 'none', 'important');
      av.style.setProperty('box-shadow', 'none', 'important');
      av.style.setProperty('background', 'transparent', 'important');
      av.style.setProperty('background-color', 'transparent', 'important');
    });
    document.querySelectorAll('.userinitials').forEach(av => {
      av.style.setProperty('border', 'none', 'important');
      av.style.setProperty('box-shadow', 'none', 'important');
      av.style.setProperty('border-radius', '50%', 'important');
    });

    // 9. Слои элементов (На передний план / На задний план из Paqa Studio)
    document.querySelectorAll('[data-mc-layer]').forEach(el => {
      let hasLayer = false;
      if (currentSettings.elementLayers) {
        for (const [sel] of Object.entries(currentSettings.elementLayers)) {
          const els = resolveElements(sel);
          if (els.includes(el)) { hasLayer = true; break; }
        }
      }
      if (!hasLayer) {
        el.style.removeProperty('z-index');
        delete el.dataset.mcLayer;
      }
    });

    if (currentSettings.elementLayers) {
      for (const [sel, layer] of Object.entries(currentSettings.elementLayers)) {
        const els = resolveElements(sel);
        for (const el of els) {
          el.style.setProperty('position', 'relative', 'important');
          if (layer === 'front') {
            el.style.setProperty('z-index', '999999', 'important');
          } else if (layer === 'back') {
            el.style.setProperty('z-index', '1', 'important');
          }
          el.dataset.mcLayer = layer;

          // Устраняем "коробку" / обрезку: поднимаем overflow: visible по цепочке предков
          let p = el.parentElement;
          while (p && p !== document.body && p !== document.documentElement) {
            p.style.setProperty('overflow', 'visible', 'important');
            p = p.parentElement;
          }
        }
      }
    }

    // 9.1 Перемещение элементов (из Paqa Studio)
    document.querySelectorAll('[data-mc-moved="true"]').forEach(el => {
      let isStillMoved = false;
      if (currentSettings.movedElements) {
        for (const [sel] of Object.entries(currentSettings.movedElements)) {
          const els = resolveElements(sel);
          if (els.includes(el)) { isStillMoved = true; break; }
        }
      }
      if (!isStillMoved) {
        el.style.removeProperty('transform');
        el.style.removeProperty('position');
        el.style.removeProperty('z-index');
        delete el.dataset.mcMoved;
      }
    });

    if (currentSettings.movedElements) {
      for (const [sel, pos] of Object.entries(currentSettings.movedElements)) {
        const els = resolveElements(sel);
        for (const el of els) {
          el.style.setProperty('transform', `translate(${pos.x}px, ${pos.y}px)`, 'important');
          el.style.setProperty('position', 'relative', 'important');
          const isFront = currentSettings.elementLayers && currentSettings.elementLayers[sel] === 'front';
          const isBack = currentSettings.elementLayers && currentSettings.elementLayers[sel] === 'back';
          const zIndex = isFront ? '999999' : (isBack ? '1' : '9999');
          el.style.setProperty('z-index', zIndex, 'important');
          el.dataset.mcMoved = 'true';

          // Устраняем "коробку" / обрезку: предки не должны скрывать overflow
          let p = el.parentElement;
          while (p && p !== document.body && p !== document.documentElement) {
            p.style.setProperty('overflow', 'visible', 'important');
            p = p.parentElement;
          }
        }
      }
    }

    // 10. Скрытие элементов (Ластик из Paqa Studio)
    document.querySelectorAll('[data-mc-hidden="true"]').forEach(el => {
      let isStillHidden = false;
      if (currentSettings.hiddenSelectors) {
        for (const sel of currentSettings.hiddenSelectors) {
          const els = resolveElements(sel);
          if (els.includes(el)) { isStillHidden = true; break; }
        }
      }
      if (!isStillHidden) {
        el.style.removeProperty('display');
        delete el.dataset.mcHidden;
      }
    });

    if (currentSettings.hiddenSelectors && currentSettings.hiddenSelectors.length > 0) {
      for (const sel of currentSettings.hiddenSelectors) {
        const els = resolveElements(sel);
        for (const el of els) {
          el.style.setProperty('display', 'none', 'important');
          el.dataset.mcHidden = 'true';
        }
      }
    }
  }

  // Применение стилей в DOM
  window.mcCurrentSettings = currentSettings;

  function applyStyles(settings) {
    currentSettings = settings;
    window.mcCurrentSettings = settings;

    // Внедряем классы body для активации темы
    const applyBodyClasses = () => {
      if (document.body) {
        if (settings.enabled) {
          document.body.classList.add('mc-active');
          document.body.classList.toggle('mc-hide-footer', !!settings.hideFooter);
          document.body.classList.toggle('mc-compact-mode', !!settings.compactMode);
          document.body.classList.toggle('mc-density-compact', settings.cardPadding === 'compact');
          document.body.classList.toggle('mc-density-spacious', settings.cardPadding === 'spacious');

          // Блок 2: прогресс-бары
          document.body.classList.remove('mc-progress-slim', 'mc-progress-normal', 'mc-progress-thick');
          document.body.classList.add(`mc-progress-${settings.progressHeight || 'normal'}`);

          document.body.classList.remove('mc-progress-flat', 'mc-progress-glow', 'mc-progress-striped');
          document.body.classList.add(`mc-progress-${settings.progressStyle || 'flat'}`);

          document.body.classList.remove('mc-progress-badge-text', 'mc-progress-badge-pill', 'mc-progress-badge-hidden');
          document.body.classList.add(`mc-progress-badge-${settings.progressBadge || 'text'}`);

          // Блок 3: шапка и аватар
          document.body.classList.remove('mc-nav-style-full', 'mc-nav-style-floating', 'mc-nav-style-glass');
          document.body.classList.add(`mc-nav-style-${settings.navbarStyle || 'full'}`);

          document.body.classList.remove('mc-avatar-circle', 'mc-avatar-rounded', 'mc-avatar-square');
          document.body.classList.add(`mc-avatar-${settings.avatarShape || 'circle'}`);

          document.body.classList.remove('mc-nav-height-compact', 'mc-nav-height-normal', 'mc-nav-height-tall');
          document.body.classList.add(`mc-nav-height-${settings.navbarHeight || 'normal'}`);

          document.body.classList.toggle('mc-nav-clean', !!settings.navbarClean);

          // Блок 4: ховер и анимации
          document.body.classList.remove('mc-hover-lift', 'mc-hover-glow', 'mc-hover-tilt', 'mc-hover-none');
          document.body.classList.add(`mc-hover-${settings.cardHoverEffect || 'lift'}`);

          document.body.classList.remove('mc-anim-smooth', 'mc-anim-snappy', 'mc-anim-instant');
          document.body.classList.add(`mc-anim-${settings.animSpeed || 'smooth'}`);

          document.body.classList.toggle('mc-btn-press', settings.buttonPress !== undefined ? settings.buttonPress : true);

          // Блок 5: зернистость
          document.body.classList.toggle('mc-grain-overlay', !!settings.bgGrain);
        } else {
          document.body.classList.remove(
            'mc-active', 'mc-hide-footer', 'mc-compact-mode', 'mc-density-compact', 'mc-density-spacious',
            'mc-progress-slim', 'mc-progress-normal', 'mc-progress-thick',
            'mc-progress-flat', 'mc-progress-glow', 'mc-progress-striped',
            'mc-progress-badge-text', 'mc-progress-badge-pill', 'mc-progress-badge-hidden',
            'mc-nav-style-full', 'mc-nav-style-floating', 'mc-nav-style-glass',
            'mc-avatar-circle', 'mc-avatar-rounded', 'mc-avatar-square',
            'mc-nav-height-compact', 'mc-nav-height-normal', 'mc-nav-height-tall',
            'mc-nav-clean',
            'mc-hover-lift', 'mc-hover-glow', 'mc-hover-tilt', 'mc-hover-none',
            'mc-anim-smooth', 'mc-anim-snappy', 'mc-anim-instant',
            'mc-btn-press', 'mc-grain-overlay'
          );
        }
      }
    };

    if (document.body) {
      applyBodyClasses();
    } else {
      document.addEventListener('DOMContentLoaded', applyBodyClasses, { once: true });
    }

    if (!settings.enabled) return;

    const cardRgba = hexToRgba(settings.cardColor, settings.cardOpacity);
    const contrastText = getContrastText(settings.accentColor);
    const containerColor = settings.accentContainer || hexToRgba(settings.accentColor, 35);
    const onContainerText = getContrastText(containerColor);
    const bgImageRule = (settings.bgImage && settings.bgImage.trim()) ? `url("${settings.bgImage.trim()}")` : 'none';

    const root = document.documentElement;
    const bdy = document.body || root;

    // Определяем темную тему через яркость фона (формула Luma)
    let isDark = true;
    if (settings.bgColor) {
      let c = settings.bgColor.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      const luma = (((num >> 16) & 255) * 299 + ((num >> 8) & 255) * 587 + (num & 255) * 114) / 1000;
      isDark = luma < 128;
    }
    const solidCard = (settings.cardColor && settings.cardColor.length >= 7) ? settings.cardColor.slice(0, 7) : (settings.cardColor || (isDark ? '#2B2930' : '#FFFFFF'));

    const shadowMap = {
      none: 'none',
      flat: '0 1px 3px rgba(0, 0, 0, 0.08)',
      soft: '0 6px 18px rgba(0, 0, 0, 0.08)',
      deep: '0 16px 36px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.16)',
      neon: `0 0 20px ${hexToRgba(settings.accentColor, 40)}, 0 0 6px ${settings.accentColor}`
    };
    const cardShadowVal = shadowMap[settings.shadowStyle] || shadowMap.soft;

    const padMap = {
      compact: '10px 14px',
      spacious: '24px 28px',
      default: '16px 20px'
    };
    const cardPadVal = padMap[settings.cardPadding] || padMap.default;

    const vars = {
      '--mc-bg': settings.bgColor,
      '--mc-bg-solid': settings.bgColor,
      '--mc-bg-card': cardRgba,
      '--mc-card-solid': solidCard,
      '--mc-bg-card-low': hexToRgba(settings.bgColor, 90),
      '--mc-bg-navbar': hexToRgba(settings.bgColor, 96),
      '--mc-bg-drawer': settings.cardColor || settings.bgColor,
      '--mc-text': settings.textColor,
      '--mc-text-muted': hexToRgba(settings.textColor, 70),
      '--mc-border': isDark ? hexToRgba(settings.textColor, 22) : hexToRgba(settings.textColor, 28),
      '--mc-hover-bg': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      '--mc-accent': settings.accentColor,
      '--mc-accent-container': containerColor,
      '--mc-on-accent-container': onContainerText,
      '--mc-accent-hover': settings.accentColor + 'dd',
      '--mc-accent-contrast': contrastText,
      '--mc-radius': settings.borderRadius + 'px',
      '--mc-radius-btn': settings.btnRadius + 'px',
      '--mc-font': settings.fontFamily,
      '--mc-bg-image': bgImageRule,
      '--mc-icon-filter': isDark ? 'invert(1) brightness(0.9)' : 'none',
      '--mc-outline-variant': isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
      '--mc-blur': (settings.cardBlur || 0) + 'px',
      '--mc-border-width': (settings.borderWidth !== undefined ? settings.borderWidth : 1) + 'px',
      '--mc-font-size': (settings.fontSize || 14) + 'px',
      '--mc-card-shadow': cardShadowVal,
      '--mc-card-padding': cardPadVal,
      '--mc-bg-dim': ((settings.bgDim || 0) / 100).toString(),
      '--mc-bg-blur': (settings.bgBlur || 0) + 'px'
    };

    // 1. Прямая инъекция (обход CSP и специфичности)
    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v, 'important');
      bdy.style.setProperty(k, v, 'important');
    }

    // 2. Генерация CSS блока как запасной вариант (без !important внутри var, чтобы Chrome не блокировал синтаксис)
    let cssVars = ':root {\n';
    for (const [k, v] of Object.entries(vars)) {
      cssVars += `  ${k}: ${v};\n`;
    }
    cssVars += '}\n';

    let extraCss = cssVars;

    // Стили блюра / стекломорфизма (Glassmorphism)
    if (settings.cardBlur && settings.cardBlur > 0) {
      extraCss += `
body.mc-active .card,
body.mc-active .dashboard-card,
body.mc-active .list-group-item.mydashboard-list-item,
body.mc-active .course-listitem,
body.mc-active .navbar,
body.mc-active #region-main,
body.mc-active .drawer,
body.mc-active .modal-content {
  backdrop-filter: blur(var(--mc-blur, 0px)) !important;
  -webkit-backdrop-filter: blur(var(--mc-blur, 0px)) !important;
}\n`;
    }

    // Тени карточек и толщина границы
    extraCss += `
body.mc-active .card,
body.mc-active .dashboard-card,
body.mc-active .dashboard-card-deck .dashboard-card,
body.mc-active [data-region="card-deck"] .card,
body.mc-active [data-region="courses-view"] .card,
body.mc-active .list-group-item.mydashboard-list-item,
body.mc-active .course-listitem {
  box-shadow: var(--mc-card-shadow) !important;
  border-width: var(--mc-border-width, 1px) !important;
  border-style: solid !important;
  border-color: var(--mc-border) !important;
}
body.mc-active {
  font-size: var(--mc-font-size, 14px) !important;
}
body.mc-active .card,
body.mc-active .dashboard-card,
body.mc-active .dashboard-card-deck .dashboard-card,
body.mc-active [data-region="card-deck"] .card,
body.mc-active [data-region="courses-view"] .card,
body.mc-active .list-group-item.mydashboard-list-item,
body.mc-active .course-listitem {
  font-size: var(--mc-font-size, 14px) !important;
}
body.mc-active .mc-course-title-main,
body.mc-active .coursename,
body.mc-active .card-title,
body.mc-active .course-info-container h3,
body.mc-active .course-info-container h4 {
  font-size: calc(var(--mc-font-size, 14px) * 1.15) !important;
}
body.mc-active .mc-chip {
  font-size: calc(var(--mc-font-size, 14px) * 0.82) !important;
}
body.mc-active .mydashboard-progress-string {
  font-size: calc(var(--mc-font-size, 14px) * 0.85) !important;
}

/* Плотность карточек Moodle LMS */
body.mc-active.mc-density-compact .dashboard-card-deck,
body.mc-active.mc-density-compact [data-region="card-deck"],
body.mc-active.mc-density-compact .block_mydashboard .list-group {
  gap: 14px !important;
}
body.mc-active.mc-density-compact .dashboard-card,
body.mc-active.mc-density-compact .list-group-item.mydashboard-list-item,
body.mc-active.mc-density-compact .course-listitem {
  padding: 16px !important;
  padding-top: 114px !important;
  min-height: 220px !important;
}
body.mc-active.mc-density-compact .mc-course-cover {
  height: 96px !important;
}
body.mc-active.mc-density-compact .mc-course-title-main {
  font-size: 0.98rem !important;
  margin-bottom: 8px !important;
}

body.mc-active.mc-density-spacious .dashboard-card-deck,
body.mc-active.mc-density-spacious [data-region="card-deck"],
body.mc-active.mc-density-spacious .block_mydashboard .list-group {
  gap: 26px !important;
}
body.mc-active.mc-density-spacious .dashboard-card,
body.mc-active.mc-density-spacious .list-group-item.mydashboard-list-item,
body.mc-active.mc-density-spacious .course-listitem {
  padding: 28px !important;
  padding-top: 168px !important;
  min-height: 330px !important;
}
body.mc-active.mc-density-spacious .mc-course-cover {
  height: 144px !important;
}
body.mc-active.mc-density-spacious .mc-course-title-main {
  font-size: 1.25rem !important;
  margin-bottom: 18px !important;
}

/* Закрепленные курсы (Pin to top) */
body.mc-active [data-mc-pinned="true"],
body.mc-active .list-group-item.mydashboard-list-item[data-mc-pinned="true"],
body.mc-active .dashboard-card[data-mc-pinned="true"],
body.mc-active .course-listitem[data-mc-pinned="true"] {
  order: -100 !important;
}

/* Бейдж закрепленного курса */
body.mc-active .mc-pinned-badge,
body.mc-active .mc-pinned-badge *,
body.mc-active .mc-pinned-badge i,
body.mc-active .mc-pinned-badge span,
body.mc-active .card .mc-pinned-badge,
body.mc-active .card .mc-pinned-badge *,
body.mc-active .dashboard-card .mc-pinned-badge,
body.mc-active .dashboard-card .mc-pinned-badge *,
body.mc-active .list-group-item .mc-pinned-badge,
body.mc-active .list-group-item .mc-pinned-badge *,
body.mc-active .box.generalbox .mc-pinned-badge,
body.mc-active .box.generalbox .mc-pinned-badge * {
  color: #ffd54f !important;
  fill: #ffd54f !important;
  -webkit-text-fill-color: #ffd54f !important;
}

body.mc-active .mc-pinned-badge {
  position: absolute !important;
  top: 10px !important;
  left: 10px !important;
  background: rgba(18, 18, 20, 0.88) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  color: #ffd54f !important;
  border: 1px solid rgba(255, 213, 79, 0.6) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  padding: 3px 9px !important;
  border-radius: 12px !important;
  z-index: 10 !important;
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  line-height: 1 !important;
  pointer-events: none !important;
}

/* Прогресс-бары и индикаторы (Блок 2) */
body.mc-active.mc-progress-slim .progress {
  height: 4px !important;
  min-height: 4px !important;
  border-radius: 4px !important;
}
body.mc-active.mc-progress-slim .progress-bar {
  border-radius: 4px !important;
}

body.mc-active.mc-progress-normal .progress {
  height: 8px !important;
  min-height: 8px !important;
  border-radius: 8px !important;
}
body.mc-active.mc-progress-normal .progress-bar {
  border-radius: 8px !important;
}

body.mc-active.mc-progress-thick .progress {
  height: 14px !important;
  min-height: 14px !important;
  border-radius: 10px !important;
}
body.mc-active.mc-progress-thick .progress-bar {
  border-radius: 10px !important;
}

body.mc-active.mc-progress-glow .progress-bar {
  box-shadow: 0 0 10px var(--mc-bar-color, var(--mc-accent)), 0 0 3px var(--mc-bar-color, var(--mc-accent)) !important;
}

body.mc-active.mc-progress-striped .progress-bar {
  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.22) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.22) 50%, rgba(255, 255, 255, 0.22) 75%, transparent 75%, transparent) !important;
  background-size: 16px 16px !important;
  animation: mcStripesMove 1.5s linear infinite !important;
}

@keyframes mcStripesMove {
  0% { background-position: 0 0; }
  100% { background-position: 32px 0; }
}

body.mc-active.mc-progress-badge-hidden .mydashboard-progress-string {
  display: none !important;
}

body.mc-active.mc-progress-badge-pill .mydashboard-progress-string {
  display: inline-flex !important;
  align-self: flex-start !important;
  padding: 3px 9px !important;
  border-radius: 12px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(4px) !important;
  margin-bottom: 2px !important;
}

/* Шапка (Navbar) и навигация (Блок 3) */
body.mc-active.mc-nav-style-floating nav.navbar,
body.mc-active.mc-nav-style-floating #header {
  margin: 12px 18px !important;
  border-radius: 20px !important;
  background-color: var(--mc-bg-card, var(--mc-card-solid, #2B2930)) !important;
  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.12)) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28) !important;
  width: calc(100% - 36px) !important;
  max-width: calc(100% - 36px) !important;
  left: 18px !important;
  right: 18px !important;
  transition: all 0.25s ease !important;
}

body.mc-active.mc-nav-style-glass nav.navbar,
body.mc-active.mc-nav-style-glass #header {
  backdrop-filter: blur(16px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(160%) !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25) !important;
}

body.mc-active.mc-avatar-circle .userpicture,
body.mc-active.mc-avatar-circle .userinitials,
body.mc-active.mc-avatar-circle .usermenu img {
  border-radius: 50% !important;
}
body.mc-active.mc-avatar-rounded .userpicture,
body.mc-active.mc-avatar-rounded .userinitials,
body.mc-active.mc-avatar-rounded .usermenu img {
  border-radius: 10px !important;
}
body.mc-active.mc-avatar-square .userpicture,
body.mc-active.mc-avatar-square .userinitials,
body.mc-active.mc-avatar-square .usermenu img {
  border-radius: 4px !important;
}

body.mc-active.mc-nav-height-compact nav.navbar,
body.mc-active.mc-nav-height-compact #header {
  min-height: 48px !important;
  max-height: 48px !important;
  height: 48px !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
body.mc-active.mc-nav-height-normal nav.navbar,
body.mc-active.mc-nav-height-normal #header {
  min-height: 60px !important;
  max-height: 60px !important;
  height: 60px !important;
}
body.mc-active.mc-nav-height-tall nav.navbar,
body.mc-active.mc-nav-height-tall #header {
  min-height: 72px !important;
  max-height: 72px !important;
  height: 72px !important;
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}

body.mc-active.mc-nav-clean .primary-navigation,
body.mc-active.mc-nav-clean nav.navbar .site-name,
body.mc-active.mc-nav-clean .navbar-nav .nav-item:not(.user-nav):not(.popover-region) {
  opacity: 0.7 !important;
  transition: opacity 0.2s ease !important;
}
body.mc-active.mc-nav-clean .primary-navigation:hover,
body.mc-active.mc-nav-clean nav.navbar:hover .site-name,
body.mc-active.mc-nav-clean nav.navbar:hover .nav-item {
  opacity: 1 !important;
}

/* Анимации и микро-взаимодействия (Блок 4) */
body.mc-active.mc-anim-smooth .dashboard-card,
body.mc-active.mc-anim-smooth .list-group-item.mydashboard-list-item,
body.mc-active.mc-anim-smooth .course-listitem,
body.mc-active.mc-anim-smooth .btn,
body.mc-active.mc-anim-smooth button,
body.mc-active.mc-anim-smooth a {
  transition: all 0.35s cubic-bezier(0.2, 0, 0, 1) !important;
}

body.mc-active.mc-anim-snappy .dashboard-card,
body.mc-active.mc-anim-snappy .list-group-item.mydashboard-list-item,
body.mc-active.mc-anim-snappy .course-listitem,
body.mc-active.mc-anim-snappy .btn,
body.mc-active.mc-anim-snappy button,
body.mc-active.mc-anim-snappy a {
  transition: all 0.15s ease !important;
}

body.mc-active.mc-anim-instant .dashboard-card,
body.mc-active.mc-anim-instant .list-group-item.mydashboard-list-item,
body.mc-active.mc-anim-instant .course-listitem,
body.mc-active.mc-anim-instant .btn,
body.mc-active.mc-anim-instant button,
body.mc-active.mc-anim-instant a {
  transition: none !important;
  animation: none !important;
}

body.mc-active.mc-hover-lift .dashboard-card,
body.mc-active.mc-hover-lift .dashboard-card-deck .dashboard-card,
body.mc-active.mc-hover-lift [data-region="card-deck"] .card,
body.mc-active.mc-hover-lift [data-region="courses-view"] .card,
body.mc-active.mc-hover-lift .list-group-item.mydashboard-list-item,
body.mc-active.mc-hover-lift .course-listitem {
  transition: transform 0.25s ease, box-shadow 0.25s ease !important;
}
body.mc-active.mc-hover-lift .dashboard-card:hover,
body.mc-active.mc-hover-lift .dashboard-card-deck .dashboard-card:hover,
body.mc-active.mc-hover-lift [data-region="card-deck"] .card:hover,
body.mc-active.mc-hover-lift [data-region="courses-view"] .card:hover,
body.mc-active.mc-hover-lift .list-group-item.mydashboard-list-item:hover,
body.mc-active.mc-hover-lift .course-listitem:hover {
  transform: translateY(-6px) !important;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.32), 0 6px 12px rgba(0, 0, 0, 0.2) !important;
}

body.mc-active.mc-hover-glow .dashboard-card,
body.mc-active.mc-hover-glow .dashboard-card-deck .dashboard-card,
body.mc-active.mc-hover-glow [data-region="card-deck"] .card,
body.mc-active.mc-hover-glow [data-region="courses-view"] .card,
body.mc-active.mc-hover-glow .list-group-item.mydashboard-list-item,
body.mc-active.mc-hover-glow .course-listitem {
  transition: box-shadow 0.25s ease, border-color 0.25s ease !important;
}
body.mc-active.mc-hover-glow .dashboard-card:hover,
body.mc-active.mc-hover-glow .dashboard-card-deck .dashboard-card:hover,
body.mc-active.mc-hover-glow [data-region="card-deck"] .card:hover,
body.mc-active.mc-hover-glow [data-region="courses-view"] .card:hover,
body.mc-active.mc-hover-glow .list-group-item.mydashboard-list-item:hover,
body.mc-active.mc-hover-glow .course-listitem:hover {
  transform: none !important;
  box-shadow: 0 0 24px var(--mc-accent, #D0BCFF), 0 0 8px var(--mc-accent, #D0BCFF) !important;
  border-color: var(--mc-accent, #D0BCFF) !important;
}

body.mc-active.mc-hover-tilt .dashboard-card,
body.mc-active.mc-hover-tilt .dashboard-card-deck .dashboard-card,
body.mc-active.mc-hover-tilt [data-region="card-deck"] .card,
body.mc-active.mc-hover-tilt [data-region="courses-view"] .card,
body.mc-active.mc-hover-tilt .list-group-item.mydashboard-list-item,
body.mc-active.mc-hover-tilt .course-listitem {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.28s ease !important;
  transform-style: preserve-3d !important;
}
body.mc-active.mc-hover-tilt .dashboard-card:hover,
body.mc-active.mc-hover-tilt .dashboard-card-deck .dashboard-card:hover,
body.mc-active.mc-hover-tilt [data-region="card-deck"] .card:hover,
body.mc-active.mc-hover-tilt [data-region="courses-view"] .card:hover,
body.mc-active.mc-hover-tilt .list-group-item.mydashboard-list-item:hover,
body.mc-active.mc-hover-tilt .course-listitem:hover {
  transform: perspective(700px) translateY(-8px) rotateX(7deg) rotateY(-7deg) scale(1.02) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45), 0 0 16px var(--mc-accent, rgba(208, 188, 255, 0.3)) !important;
}

body.mc-active.mc-hover-none .dashboard-card:hover,
body.mc-active.mc-hover-none .dashboard-card-deck .dashboard-card:hover,
body.mc-active.mc-hover-none [data-region="card-deck"] .card:hover,
body.mc-active.mc-hover-none [data-region="courses-view"] .card:hover,
body.mc-active.mc-hover-none .list-group-item.mydashboard-list-item:hover,
body.mc-active.mc-hover-none .course-listitem:hover {
  transform: none !important;
}

body.mc-active.mc-btn-press button:active,
body.mc-active.mc-btn-press .btn:active,
body.mc-active.mc-btn-press a.btn:active,
body.mc-active.mc-btn-press [data-region="filter"] a:active,
body.mc-active.mc-btn-press [data-region="filter"] button:active {
  transform: scale(0.95) !important;
  transition: transform 0.08s ease !important;
}

/* Фоновые обои и эффекты (Блок 5) */
body.mc-active::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, var(--mc-bg-dim, 0)) !important;
  backdrop-filter: blur(var(--mc-bg-blur, 0px)) !important;
  -webkit-backdrop-filter: blur(var(--mc-bg-blur, 0px)) !important;
  pointer-events: none !important;
  z-index: 0 !important;
}

body.mc-active.mc-grain-overlay::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E") !important;
  pointer-events: none !important;
  z-index: 999998 !important;
}

body.mc-active #page-wrapper,
body.mc-active #page {
  position: relative !important;
  z-index: 1 !important;
}

body.mc-active nav.navbar,
body.mc-active .navbar,
body.mc-active #header,
body.mc-active header.navbar,
body.mc-active .navbar.fixed-top {
  z-index: 1040 !important;
  overflow: visible !important;
}\n`;

    // Если есть скрытые элементы
    if (settings.hiddenSelectors && settings.hiddenSelectors.length > 0) {
      const hiddenRules = settings.hiddenSelectors
        .map(sel => expandAndPrefixSelector(sel, 'body.mc-active'))
        .filter(Boolean)
        .join(', ');
      if (hiddenRules) {
        extraCss += `${hiddenRules} { display: none !important; }\n`;
      }
    }

    // Если настроены слои (передний / задний план)
    if (settings.elementLayers) {
      for (const [sel, layer] of Object.entries(settings.elementLayers)) {
        const layerRule = expandAndPrefixSelector(sel, 'body.mc-active');
        if (layerRule) {
          const layerZ = layer === 'front' ? '999999' : '1';
          extraCss += `${layerRule} { position: relative !important; z-index: ${layerZ} !important; }\n`;
        }
      }
    }

    // Если есть передвинутые элементы
    if (settings.movedElements) {
      for (const [sel, pos] of Object.entries(settings.movedElements)) {
        const moveRule = expandAndPrefixSelector(sel, 'body.mc-active');
        if (moveRule) {
          const isFront = settings.elementLayers && settings.elementLayers[sel] === 'front';
          const isBack = settings.elementLayers && settings.elementLayers[sel] === 'back';
          const zVal = isFront ? '999999' : (isBack ? '1' : '100');
          const isHeading = /h[1-6]|heading|page-title/i.test(sel);
          const isText = /title|text|label|chip|name|brand|link|badge|initials|button|item|dropdown/i.test(sel);
          let sizing = '';
          if (isHeading) {
            sizing = 'width: fit-content !important; max-width: 100% !important; display: block !important; margin-bottom: 0.75rem !important;';
          } else if (isText) {
            sizing = 'width: fit-content !important; max-width: 100% !important; display: inline-block !important;';
          }
          extraCss += `${moveRule} { transform: translate(${pos.x}px, ${pos.y}px) !important; position: relative !important; z-index: ${zVal} !important; ${sizing} }\n`;
        }
      }
      extraCss += `
body.mc-active [data-mc-moved="true"],
body.mc-active .block_myoverview,
body.mc-active .block_mydashboard,
body.mc-active .block_myoverview .card-body,
body.mc-active .block_mydashboard .card-body,
body.mc-active .dashboard-filters,
body.mc-active [data-region="filter"],
body.mc-active .input-group,
body.mc-active .simplesearchform {
  overflow: visible !important;
}\n`;
    }

    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = extraCss;

    // ВИЗУАЛЬНЫЙ ДЕБАГ: Зеленая вспышка при успешном применении темы
    let flash = document.getElementById('mc-debug-flash');
    if (!flash && document.body) {
      flash = document.createElement('div');
      flash.id = 'mc-debug-flash';
      flash.style = 'position:fixed;top:0;left:0;width:100%;height:4px;background:#00ff00;z-index:999999;pointer-events:none;transition:opacity 0.5s;';
      document.body.appendChild(flash);
      setTimeout(() => { if (flash) flash.style.opacity = '0'; }, 100);
      setTimeout(() => { if (flash) flash.remove(); }, 600);
    }

    liveThemeDOM();
  }

  window.mcApplyStyles = applyStyles;

  function loadAndApply() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('mcSettings', (data) => {
        const settings = Object.assign({}, DEFAULT_SETTINGS, data ? data.mcSettings : {});
        applyStyles(settings);
        setTimeout(liveThemeDOM, 300);
        setTimeout(liveThemeDOM, 800);
        setTimeout(liveThemeDOM, 1500);
        setTimeout(liveThemeDOM, 3000);
      });
    } else {
      let saved = null;
      try {
        const raw = localStorage.getItem('mcSettings');
        if (raw) saved = JSON.parse(raw);
      } catch (e) {}
      applyStyles(Object.assign({}, DEFAULT_SETTINGS, saved || {}));
      setTimeout(liveThemeDOM, 300);
      setTimeout(liveThemeDOM, 800);
      setTimeout(liveThemeDOM, 1500);
      setTimeout(liveThemeDOM, 3000);
    }
  }

  // MutationObserver для отслеживания смены вкладок Moodle (AJAX)
  let observerTimer = null;
  const observer = new MutationObserver(() => {
    if (observerTimer) clearTimeout(observerTimer);
    observerTimer = setTimeout(liveThemeDOM, 100);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Мгновенная подсветка выбранного фильтра и адаптация при переключении вида/фильтров
  document.addEventListener('click', (e) => {
    const filterBtn = e.target && e.target.closest && e.target.closest('[data-region="filter"] a, [data-region="filter"] button, .nav-pills .nav-link, .nav-tabs .nav-link, .nav .nav-link, [data-region="display-selector"] button, [data-region="display-selector"] a');
    if (filterBtn) {
      const container = filterBtn.closest('.nav, .nav-pills, .nav-tabs, [data-region="filter"], [data-region="display-selector"], .btn-group');
      if (container) {
        container.querySelectorAll('a, button, .nav-link').forEach(other => {
          if (other !== filterBtn) {
            other.classList.remove('active');
            other.setAttribute('aria-selected', 'false');
            other.style.setProperty('background-color', 'var(--mc-bg-card-low)', 'important');
            other.style.setProperty('color', 'var(--mc-text)', 'important');
            other.style.setProperty('border', '1px solid var(--mc-border)', 'important');
            other.style.setProperty('font-weight', '600', 'important');
          }
        });
      }
      filterBtn.classList.add('active');
      filterBtn.setAttribute('aria-selected', 'true');
      filterBtn.style.setProperty('background-color', 'var(--mc-accent)', 'important');
      filterBtn.style.setProperty('color', 'var(--mc-accent-contrast)', 'important');
      filterBtn.style.setProperty('border', '1px solid var(--mc-accent)', 'important');
      filterBtn.style.setProperty('font-weight', '700', 'important');

      setTimeout(liveThemeDOM, 50);
      setTimeout(liveThemeDOM, 250);
      setTimeout(liveThemeDOM, 600);
    } else if (e.target && e.target.closest && e.target.closest('[data-action="set-display-mode"], [data-region="sorting-selector"], .btn-group, [data-action="toggle-manual-completion"], form.togglecompletion')) {
      setTimeout(liveThemeDOM, 100);
      setTimeout(liveThemeDOM, 400);
      setTimeout(liveThemeDOM, 800);
    }
  }, true);

  // 2.8 Автоматический сбор слепка реального дашборда и текущей страницы курса для Песочницы
  function parseCoursesFromDoc(doc) {
    const cards = doc.querySelectorAll('.list-group-item.mydashboard-list-item, .block_mydashboard .list-group-item, .dashboard-card-deck .dashboard-card, [data-region="card-deck"] .card, .course-listitem');
    const courses = [];
    const seenIds = new Set();

    cards.forEach((card, index) => {
      if (card.matches('.mobile, [class*="mobile"], .d-md-none, .hidden-desktop')) return;

      const link = card.querySelector('a.mydashboard-coursename, a[href*="/course/view.php"], a[href*="id="]');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      const match = href.match(/[?&]id=(\d+)/);
      const courseId = match ? parseInt(match[1], 10) : (index + 1);

      if (seenIds.has(courseId)) return;
      seenIds.add(courseId);

      let title = '';
      const chips = [];

      const titleEl = card.querySelector('.mc-course-title-main');
      if (titleEl) {
        title = titleEl.textContent.trim();
        card.querySelectorAll('.mc-chip').forEach(c => chips.push(c.textContent.trim()));
      } else {
        const fullText = link.textContent.trim();
        const parts = fullText.split('[');
        title = parts[0].trim();
        for (let i = 1; i < parts.length; i++) {
          const chipText = parts[i].replace(']', '').trim();
          if (chipText) chips.push(chipText);
        }
      }

      let progress = '0%';
      const pContainer = card.querySelector('.mydashboard-progress');
      if (pContainer && pContainer.getAttribute('data-rendered-percent') !== null && pContainer.getAttribute('data-rendered-percent') !== '') {
        progress = pContainer.getAttribute('data-rendered-percent') + '%';
      } else {
        const pBar = card.querySelector('.progress-bar, [role="progressbar"]');
        if (pBar) {
          const ariaVal = pBar.getAttribute('aria-valuenow') || pBar.getAttribute('data-value');
          if (ariaVal !== null && !isNaN(parseInt(ariaVal, 10))) {
            progress = parseInt(ariaVal, 10) + '%';
          } else if (pBar.style && pBar.style.width && pBar.style.width.includes('%')) {
            const wMatch = pBar.style.width.match(/(\d+)%/);
            if (wMatch) progress = wMatch[1] + '%';
          }
        }
        if (progress === '0%') {
          const pctEl = card.querySelector('[data-region="progress-percentage"], .progress-percentage, .text-muted, .progress-desc');
          if (pctEl) {
            const m = (pctEl.textContent || '').match(/(\d+)%/);
            if (m) progress = m[1] + '%';
          }
        }
        if (progress === '0%') {
          const m = (card.textContent || '').match(/(\d+)%/);
          if (m) progress = m[1] + '%';
        }
      }

      const isFavourite = !!card.querySelector('.btn-favourite.active, .fa-bookmark:not(.fa-bookmark-o), [data-action="unfavourite-course"]');

      const hue1 = (courseId * 137) % 360;
      const hue2 = (courseId * 43) % 360;

      courses.push({
        id: courseId,
        title: title || 'Учебный курс',
        chips: chips,
        progress: progress,
        isFavourite: isFavourite,
        hue1: hue1,
        hue2: hue2,
        url: href
      });
    });
    return courses;
  }

  function captureMoodleSnapshot() {
    try {
      const isCoursePage = window.location.pathname.includes('/course/view.php');
      const isDashboard = window.location.pathname.includes('/my') || window.location.pathname === '/' || window.location.pathname.includes('index.php');

      let activePageType = 'custom';
      if (isCoursePage) {
        activePageType = 'course';
      } else if (isDashboard) {
        activePageType = 'dashboard';
      }

      // Запоминаем активный пункт в шапке (Онлайн-обучение, Все курсы, Обращение в службу техподдержки и т.д.)
      let activeNavText = '';
      const activeNavEl = document.querySelector('.primary-navigation .nav-link.active, .navbar .nav-link.active, [data-region="primary-navigation"] .active');
      if (activeNavEl) {
        activeNavText = activeNavEl.textContent.trim();
      }

      // 0. Захватываем живой контент страницы (#page без фиксированных боковых панелей Moodle и футера)
      let pageEl = document.getElementById('page') || document.getElementById('region-main-box') || document.getElementById('page-content') || document.body;
      let rawHtml = '';
      if (pageEl) {
        const clone = pageEl.cloneNode(true);
        // Удаляем скрипты, служебные плавающие виджеты, боковые панели Moodle (drawers), фиксированные шапки и футер
        clone.querySelectorAll('script, #paqa-theme-studio-live, #mc-debug-flash, .drawer, .drawer-left, [class*="drawer"], .fixed-top, nav.fixed-top, .navbar.fixed-top, footer, #page-footer').forEach(s => s.remove());
        rawHtml = clone.innerHTML;
        rawHtml = rawHtml.replace(/(src|href)="\/(?!\/)/g, '$1="https://lms.ranepa.ru/');
      }

      // 1. Приветствие и заголовок
      let greeting = '';
      const hElements = document.querySelectorAll('h1, h2, .page-header-headings, .welcome-message, .page-context-header');
      for (const h of hElements) {
        const text = (h.textContent || '').trim();
        if (text.includes('Здравствуйте') || text.includes('Добро пожаловать')) {
          greeting = text;
          break;
        }
      }

      // 2. Инициалы пользователя
      let initials = '';
      const initialsEl = document.querySelector('.userinitials, .userbutton .avatar, .usermenu .userinitials');
      if (initialsEl && initialsEl.textContent.trim()) {
        initials = initialsEl.textContent.trim();
      } else {
        const userNameEl = document.querySelector('.usertext, .usermenu .usertext, .logininfo');
        if (userNameEl) {
          const parts = userNameEl.textContent.trim().split(/\s+/);
          if (parts.length >= 2) {
            initials = (parts[0][0] + parts[1][0]).toUpperCase();
          } else if (parts.length === 1 && parts[0].length >= 2) {
            initials = parts[0].substring(0, 2).toUpperCase();
          }
        }
      }

      // 3. Данные текущего курса (если мы внутри курса)
      let currentCourse = null;
      if (isCoursePage) {
        const h1 = document.querySelector('h1, .page-header-headings h1, .page-context-header h1, header#page-header h1');
        const courseTitle = h1 ? h1.textContent.trim() : document.title;

        // Разбираем заголовок на основное название и теги/чипы [1 семестр], [301-СА-24]
        const parts = courseTitle.split('[');
        const mainTitle = parts[0].trim();
        const chips = [];
        for (let i = 1; i < parts.length; i++) {
          const chipText = parts[i].replace(']', '').trim();
          if (chipText) chips.push(chipText);
        }

        const sections = [];
        const sectionNodes = document.querySelectorAll(
          '.course-content ul.topics > li.section, ' +
          '.course-content ul.weeks > li.section, ' +
          '.course-content .section.main, ' +
          'li.section.main, ' +
          '.course-section'
        );

        sectionNodes.forEach((sec, idx) => {
          let secTitleEl = sec.querySelector('.sectionname, .section-title, h3, h4');
          let secTitle = '';
          if (secTitleEl) {
            const clone = secTitleEl.cloneNode(true);
            clone.querySelectorAll('.badge, .current-badge, [class*="badge"]').forEach(b => b.remove());
            secTitle = clone.textContent.trim().replace(/\s*(Выделено|Highlighted)\s*/gi, '').trim();
          }
          if (!secTitle) {
            secTitle = (idx === 0 ? 'Общее' : `Раздел ${idx}`);
          }

          const acts = [];
          sec.querySelectorAll('.activity-item, .activity, .activity-basis, li.activity').forEach(act => {
            const actNameEl = act.querySelector('.instancename, .activityname, a.aalink, .activity-title');
            if (!actNameEl) return;

            let actName = actNameEl.textContent.trim();
            actName = actName.replace(/^(Файл|Тест|Задание|Гиперссылка|Форум|Папка|Страница)\s*/i, '').trim();
            if (!actName) return;

            let type = 'file';
            const cls = (act.className || '').toLowerCase() + ' ' + (actNameEl.className || '').toLowerCase();
            const lowerName = actName.toLowerCase();

            if (cls.includes('quiz') || lowerName.includes('тест')) {
              type = 'quiz';
            } else if (cls.includes('assign') || lowerName.includes('задание') || lowerName.includes('практическ')) {
              type = 'assign';
            } else if (cls.includes('url') || lowerName.includes('ссылка') || lowerName.includes('гиперссылка')) {
              type = 'url';
            } else if (cls.includes('forum') || lowerName.includes('форум')) {
              type = 'forum';
            } else if (actName.includes('БРС') || lowerName.includes('балльно-рейтинг')) {
              type = 'brs';
            } else {
              type = 'file';
            }

            const isDone = !!act.querySelector('.completion-info .badge-success, .iscompleted, [data-toggletype="manual:true"], .autocompletion .badge-success, input:checked');

            acts.push({
              name: actName,
              type: type,
              completed: isDone
            });
          });

          if (secTitle || acts.length > 0) {
            sections.push({
              title: secTitle,
              activities: acts
            });
          }
        });

        // Запасной поиск для других тем оформления (плитки, одностраничный курс)
        if (sections.length === 0) {
          const directActs = [];
          document.querySelectorAll('.activity-item, .activity, .activity-basis').forEach(act => {
            const actNameEl = act.querySelector('.instancename, .activityname, a.aalink, .activity-title');
            if (actNameEl) {
              const text = actNameEl.textContent.trim().replace(/^(Файл|Тест|Задание|Гиперссылка|Форум|Папка|Страница)\s*/i, '').trim();
              if (text) {
                directActs.push({
                  name: text,
                  type: 'file',
                  completed: false
                });
              }
            }
          });
          if (directActs.length > 0) {
            sections.push({
              title: 'Содержание курса',
              activities: directActs
            });
          }
        }

        currentCourse = {
          title: courseTitle,
          mainTitle: mainTitle,
          chips: chips,
          sections: sections,
          url: window.location.href
        };
      }

      // 4. Сканируем курсы дашборда на текущей странице
      let courses = parseCoursesFromDoc(document);

      // 5. Логотип и уведомления из шапки
      let logoHtml = '';
      const brandEl = document.querySelector('.navbar-brand, .site-name, [data-region="branding"]');
      if (brandEl) {
        logoHtml = brandEl.innerHTML.trim().replace(/(src|href)="\/(?!\/)/g, '$1="https://lms.ranepa.ru/');
      }

      let notifCount = '0';
      const badgeEl = document.querySelector('.popover-region-notifications .count-container, [data-region="count-container"]');
      if (badgeEl) {
        notifCount = badgeEl.textContent.trim() || '0';
      }

      const snapshot = {
        activePage: activePageType,
        pageTitle: document.title,
        pageUrl: window.location.href,
        rawHtml: rawHtml,
        activeNavText: activeNavText,
        currentCourse: currentCourse,
        greeting: greeting || '',
        initials: initials || 'БЕ',
        logoHtml: logoHtml || '',
        notifCount: notifCount,
        courses: courses,
        capturedAt: Date.now()
      };

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['mcDashboardSnapshot', 'mcSavedPages'], (stored) => {
          const prev = stored && stored.mcDashboardSnapshot;
          if (prev && prev.courses && prev.courses.length > 0 && (!snapshot.courses || snapshot.courses.length === 0)) {
            snapshot.courses = prev.courses;
          }

          const savedPages = (stored && stored.mcSavedPages) || {};
          if (isDashboard && rawHtml) {
            savedPages.dashboard = {
              title: document.title || 'Дашборд • Онлайн-обучение',
              rawHtml: rawHtml
            };
          } else if (isCoursePage) {
            savedPages.course = {
              title: document.title,
              courseData: currentCourse,
              rawHtml: rawHtml
            };
          } else {
            savedPages.custom = {
              title: document.title || 'Текущая страница',
              url: window.location.href,
              rawHtml: rawHtml
            };
          }

          chrome.storage.local.set({ mcDashboardSnapshot: snapshot, mcSavedPages: savedPages });
          try {
            localStorage.setItem('mcDashboardSnapshot', JSON.stringify(snapshot));
            localStorage.setItem('mcSavedPages', JSON.stringify(savedPages));
          } catch (e) {}

          // Если курсов дашборда ещё нет (например, зашли сразу в курс), подтягиваем их фоном с /my/
          if (!snapshot.courses || snapshot.courses.length === 0) {
            fetch('/my/')
              .then(res => res.text())
              .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const fetchedCourses = parseCoursesFromDoc(doc);
                if (fetchedCourses.length > 0) {
                  snapshot.courses = fetchedCourses;
                  const dPageEl = doc.getElementById('page') || doc.getElementById('region-main-box') || doc.body;
                  if (dPageEl && !savedPages.dashboard) {
                    const dClone = dPageEl.cloneNode(true);
                    dClone.querySelectorAll('script, #paqa-theme-studio-live, #mc-debug-flash, .drawer, .drawer-left, [class*="drawer"], .fixed-top, nav.fixed-top, .navbar.fixed-top').forEach(s => s.remove());
                    let dHtml = dClone.innerHTML.replace(/(src|href)="\/(?!\/)/g, '$1="https://lms.ranepa.ru/');
                    savedPages.dashboard = {
                      title: 'Дашборд • Онлайн-обучение',
                      rawHtml: dHtml
                    };
                  }
                  chrome.storage.local.set({ mcDashboardSnapshot: snapshot, mcSavedPages: savedPages });
                  try {
                    localStorage.setItem('mcDashboardSnapshot', JSON.stringify(snapshot));
                    localStorage.setItem('mcSavedPages', JSON.stringify(savedPages));
                  } catch (e) {}
                }
              })
              .catch(() => {});
          }
        });
      }

      return snapshot;
    } catch (err) {
      console.error("Capture snapshot error:", err);
      return null;
    }
  }

  // Запуск фонового сохранения снапшота при загрузке страницы Moodle
  setTimeout(captureMoodleSnapshot, 1000);
  setTimeout(captureMoodleSnapshot, 3000);

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'PING_VERSION') {
        sendResponse({ version: 2 });
        return true;
      }

      if (request.type === 'GET_DASHBOARD_SNAPSHOT') {
        const snap = captureMoodleSnapshot();
        sendResponse({ success: true, snapshot: snap });
        return true;
      }

      if (request.type === 'APPLY_THEME') {
        try {
          applyStyles(request.settings);
          sendResponse({ success: true });
        } catch (err) {
          console.error("PaqaReplace Error:", err);
          sendResponse({ success: false, error: err.message });
        }
      }
      return true; // Держим канал открытым для асинхронного ответа
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.mcSettings && changes.mcSettings.newValue) {
        try {
          applyStyles(changes.mcSettings.newValue);
        } catch (e) {
          console.error("Storage change sync error:", e);
        }
      }
    });
  }

  loadAndApply();
})();

  })(chromePolyfill);

  // 5. Full Paqa Studio Sandbox (HTML embedded for in-page overlay)
  const fullStudioHtml = "<!DOCTYPE html>\r\n<html lang=\"ru\">\r\n<head>\r\n  <meta charset=\"UTF-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Paqa Studio • Песочница тем Moodle</title>\r\n  <style>\n/* ========================================================\r\n   PAQA THEME STUDIO • STYLESHEET (studio-page.css)\r\n   Material Design 3 Sandbox for РАНХиГС LMS Moodle\r\n   ======================================================== */\r\n\r\n:root {\r\n  --studio-bg: #121214;\r\n  --studio-surface: #1e1e22;\r\n  --studio-surface-variant: #28282e;\r\n  --studio-border: rgba(255, 255, 255, 0.08);\r\n  --studio-text: #e6e1e5;\r\n  --studio-text-sub: #9e9ba5;\r\n  --studio-primary: #d0bcff;\r\n  --studio-on-primary: #381e72;\r\n  --studio-success: #4fd994;\r\n  --studio-danger: #ffb4ab;\r\n  --studio-sidebar-width: 350px;\r\n}\r\n\r\n* {\r\n  box-sizing: border-box;\r\n  margin: 0;\r\n  padding: 0;\r\n}\r\n\r\nbody,\r\nbody.mc-active {\r\n  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;\r\n  background-color: var(--studio-bg) !important;\r\n  color: var(--studio-text) !important;\r\n  overflow: hidden !important;\r\n  height: 100vh !important;\r\n  width: 100vw !important;\r\n}\r\n\r\n.studio-app {\r\n  display: flex;\r\n  height: 100vh;\r\n  width: 100vw;\r\n  overflow: hidden;\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   1. ЛЕВАЯ ПАНЕЛЬ (SIDEBAR)\r\n   ──────────────────────────────────────────────────────── */\r\n.studio-sidebar {\r\n  width: var(--studio-sidebar-width);\r\n  min-width: var(--studio-sidebar-width);\r\n  height: 100vh;\r\n  background: var(--studio-surface) !important;\r\n  border-right: 1px solid var(--studio-border);\r\n  display: flex;\r\n  flex-direction: column;\r\n  z-index: 999999 !important;\r\n  position: relative !important;\r\n  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   ИЗОЛЯЦИЯ ИНТЕРФЕЙСА PAQA STUDIO ОТ СТИЛЕЙ СДО\r\n   Интерфейс редактора (сайдбар, панель управления, тулбар)\r\n   всегда имеет тёмную тему и свои контрастные цвета,\r\n   независимо от того, какая тема (светлая/тёмная) выбрана для СДО!\r\n   ──────────────────────────────────────────────────────── */\r\n.studio-sidebar,\r\n.studio-sidebar *,\r\n.preview-viewport-topbar,\r\n.preview-viewport-topbar *,\r\nbody.mc-active .studio-sidebar,\r\nbody.mc-active .studio-sidebar *,\r\nbody.mc-active .preview-viewport-topbar,\r\nbody.mc-active .preview-viewport-topbar * {\r\n  box-sizing: border-box;\r\n}\r\n\r\n.studio-sidebar h1,\r\n.studio-sidebar h2,\r\n.studio-sidebar .section-heading,\r\n.studio-sidebar .section-heading i,\r\nbody.mc-active .studio-sidebar h1,\r\nbody.mc-active .studio-sidebar h2,\r\nbody.mc-active .studio-sidebar .section-heading,\r\nbody.mc-active .studio-sidebar .section-heading i {\r\n  color: #ffffff !important;\r\n}\r\n\r\n.studio-sidebar label,\r\n.studio-sidebar span:not(.preset-dot):not(.studio-slider),\r\n.studio-sidebar .control-row label,\r\n.studio-sidebar .range-header span,\r\n.studio-sidebar .toggle-control-row span,\r\n.studio-sidebar .color-hex,\r\n.studio-sidebar .styled-input,\r\n.studio-sidebar .styled-select,\r\n.studio-sidebar .preset-pill,\r\n.studio-sidebar .tool-action-btn,\r\n.studio-sidebar .tool-sub-btn,\r\n.studio-sidebar .btn-secondary-action,\r\nbody.mc-active .studio-sidebar label,\r\nbody.mc-active .studio-sidebar span:not(.preset-dot):not(.studio-slider),\r\nbody.mc-active .studio-sidebar .control-row label,\r\nbody.mc-active .studio-sidebar .range-header span,\r\nbody.mc-active .studio-sidebar .toggle-control-row span,\r\nbody.mc-active .studio-sidebar .color-hex,\r\nbody.mc-active .studio-sidebar .styled-input,\r\nbody.mc-active .studio-sidebar .styled-select,\r\nbody.mc-active .studio-sidebar .preset-pill,\r\nbody.mc-active .studio-sidebar .tool-action-btn,\r\nbody.mc-active .studio-sidebar .tool-sub-btn,\r\nbody.mc-active .studio-sidebar .btn-secondary-action {\r\n  color: var(--studio-text, #e6e1e5) !important;\r\n}\r\n\r\n.studio-sidebar .tagline,\r\n.studio-sidebar .range-val,\r\n.studio-sidebar .section-hint,\r\n.studio-sidebar .save-status,\r\nbody.mc-active .studio-sidebar .tagline,\r\nbody.mc-active .studio-sidebar .range-val,\r\nbody.mc-active .studio-sidebar .section-hint,\r\nbody.mc-active .studio-sidebar .save-status {\r\n  color: var(--studio-text-sub, #9e9ba5) !important;\r\n}\r\n\r\n.studio-sidebar .preset-pill,\r\nbody.mc-active .studio-sidebar .preset-pill {\r\n  background: var(--studio-surface-variant, #28282e) !important;\r\n  border: 1px solid var(--studio-border, rgba(255, 255, 255, 0.08)) !important;\r\n  color: var(--studio-text, #e6e1e5) !important;\r\n}\r\n\r\n.studio-sidebar .preset-pill.active,\r\nbody.mc-active .studio-sidebar .preset-pill.active {\r\n  color: #ffffff !important;\r\n  border-color: var(--studio-primary, #d0bcff) !important;\r\n  box-shadow: 0 0 12px rgba(208, 188, 255, 0.3) !important;\r\n}\r\n\r\n.studio-sidebar .save-status.unsaved,\r\nbody.mc-active .studio-sidebar .save-status.unsaved {\r\n  color: #ffd271 !important;\r\n}\r\n\r\n.studio-sidebar .save-status.saved,\r\nbody.mc-active .studio-sidebar .save-status.saved {\r\n  color: var(--studio-success, #4fd994) !important;\r\n}\r\n\r\n.studio-sidebar .btn-primary-save,\r\n.studio-sidebar .btn-primary-save *,\r\nbody.mc-active .studio-sidebar .btn-primary-save,\r\nbody.mc-active .studio-sidebar .btn-primary-save * {\r\n  color: var(--studio-on-primary, #381e72) !important;\r\n}\r\n\r\n.studio-sidebar .tool-sub-btn.danger,\r\nbody.mc-active .studio-sidebar .tool-sub-btn.danger {\r\n  color: var(--studio-danger, #ffb4ab) !important;\r\n}\r\n\r\n.studio-sidebar .styled-input,\r\n.studio-sidebar .styled-select,\r\nbody.mc-active .studio-sidebar .styled-input,\r\nbody.mc-active .studio-sidebar .styled-select {\r\n  background: var(--studio-surface-variant, #28282e) !important;\r\n  border-color: var(--studio-border, rgba(255, 255, 255, 0.08)) !important;\r\n  color: var(--studio-text, #e6e1e5) !important;\r\n}\r\n\r\n/* Верхняя панель управления окном предпросмотра */\r\n.preview-viewport-topbar,\r\nbody.mc-active .preview-viewport-topbar {\r\n  background: #141218 !important;\r\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;\r\n}\r\n\r\n.preview-viewport-topbar .viewport-status,\r\n.preview-viewport-topbar .viewport-status *,\r\n#preview-viewport-status,\r\nbody.mc-active .preview-viewport-topbar .viewport-status,\r\nbody.mc-active .preview-viewport-topbar .viewport-status *,\r\nbody.mc-active #preview-viewport-status {\r\n  color: #c4eed0 !important;\r\n}\r\n\r\n.preview-viewport-topbar .viewport-view-tab,\r\nbody.mc-active .preview-viewport-topbar .viewport-view-tab {\r\n  color: var(--studio-text-sub, #9e9ba5) !important;\r\n  background: transparent !important;\r\n  border: 1px solid transparent !important;\r\n}\r\n\r\n.preview-viewport-topbar .viewport-view-tab:hover,\r\nbody.mc-active .preview-viewport-topbar .viewport-view-tab:hover {\r\n  color: #ffffff !important;\r\n}\r\n\r\n.preview-viewport-topbar .viewport-view-tab.active,\r\nbody.mc-active .preview-viewport-topbar .viewport-view-tab.active {\r\n  background: #2b2930 !important;\r\n  color: #ffffff !important;\r\n  border-color: rgba(255, 255, 255, 0.12) !important;\r\n}\r\n\r\n.preview-viewport-topbar .btn-viewport-action,\r\nbody.mc-active .preview-viewport-topbar .btn-viewport-action {\r\n  color: #ffffff !important;\r\n  background: rgba(255, 255, 255, 0.06) !important;\r\n  border: 1px solid rgba(255, 255, 255, 0.12) !important;\r\n}\r\n\r\n.sidebar-header {\r\n  padding: 20px 24px 16px;\r\n  border-bottom: 1px solid var(--studio-border);\r\n  background: rgba(30, 30, 34, 0.7);\r\n  backdrop-filter: blur(10px);\r\n}\r\n\r\n.header-branding {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n}\r\n\r\n.logo-emoji {\r\n  font-size: 28px;\r\n  line-height: 1;\r\n}\r\n\r\n.sidebar-header h1 {\r\n  font-size: 20px;\r\n  font-weight: 800;\r\n  color: #fff;\r\n  letter-spacing: -0.3px;\r\n}\r\n\r\n.tagline {\r\n  font-size: 12px;\r\n  color: var(--studio-text-sub);\r\n  font-weight: 600;\r\n}\r\n\r\n/* Кнопка сохранения и статус */\r\n.save-bar {\r\n  padding: 16px 24px;\r\n  background: var(--studio-surface-variant);\r\n  border-bottom: 1px solid var(--studio-border);\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n}\r\n\r\n.btn-primary-save {\r\n  width: 100%;\r\n  padding: 14px 20px;\r\n  background: linear-gradient(135deg, #d0bcff, #a88bf8);\r\n  color: var(--studio-on-primary);\r\n  border: none;\r\n  border-radius: 16px;\r\n  font-size: 15px;\r\n  font-weight: 800;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 10px;\r\n  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);\r\n  box-shadow: 0 4px 16px rgba(208, 188, 255, 0.25);\r\n}\r\n\r\n.btn-primary-save:hover {\r\n  transform: translateY(-2px);\r\n  box-shadow: 0 8px 24px rgba(208, 188, 255, 0.4);\r\n}\r\n\r\n.btn-primary-save:active {\r\n  transform: translateY(0);\r\n}\r\n\r\n.save-status {\r\n  font-size: 12px;\r\n  text-align: center;\r\n  color: var(--studio-text-sub);\r\n  font-weight: 600;\r\n  transition: color 0.2s;\r\n}\r\n\r\n.save-status.unsaved {\r\n  color: #ffd271;\r\n}\r\n\r\n.save-status.saved {\r\n  color: var(--studio-success);\r\n}\r\n\r\n/* Прокручиваемый контент панели */\r\n.sidebar-content {\r\n  flex: 1;\r\n  overflow-y: auto;\r\n  padding: 20px 24px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 24px;\r\n}\r\n\r\n.sidebar-content::-webkit-scrollbar {\r\n  width: 6px;\r\n}\r\n\r\n.sidebar-content::-webkit-scrollbar-thumb {\r\n  background: rgba(255, 255, 255, 0.15);\r\n  border-radius: 10px;\r\n}\r\n\r\n.control-section {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 14px;\r\n  padding-bottom: 20px;\r\n  border-bottom: 1px solid var(--studio-border);\r\n}\r\n\r\n.section-heading {\r\n  font-size: 14px;\r\n  font-weight: 800;\r\n  text-transform: uppercase;\r\n  letter-spacing: 0.8px;\r\n  color: var(--studio-primary);\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n\r\n.section-hint {\r\n  font-size: 12px;\r\n  color: var(--studio-text-sub);\r\n  line-height: 1.4;\r\n}\r\n\r\n/* Готовые палитры */\r\n.presets-grid {\r\n  display: grid;\r\n  grid-template-columns: repeat(3, 1fr);\r\n  gap: 8px;\r\n}\r\n\r\n.preset-pill {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  padding: 8px 10px;\r\n  background: var(--studio-surface-variant);\r\n  border: 1px solid var(--studio-border);\r\n  border-radius: 12px;\r\n  color: var(--studio-text);\r\n  font-size: 13px;\r\n  font-weight: 700;\r\n  cursor: pointer;\r\n  transition: all 0.2s ease;\r\n}\r\n\r\n.preset-pill:hover {\r\n  background: rgba(255, 255, 255, 0.08);\r\n  border-color: rgba(255, 255, 255, 0.2);\r\n}\r\n\r\n.preset-pill.active {\r\n  border-color: var(--studio-primary);\r\n  background: rgba(208, 188, 255, 0.12);\r\n  color: #fff;\r\n}\r\n\r\n.preset-dot {\r\n  width: 14px;\r\n  height: 14px;\r\n  border-radius: 50%;\r\n  flex-shrink: 0;\r\n  box-shadow: 0 0 4px rgba(0,0,0,0.3);\r\n}\r\n\r\n/* Колорпикеры */\r\n.control-row {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 12px;\r\n}\r\n\r\n.control-row.stacked {\r\n  flex-direction: column;\r\n  align-items: flex-start;\r\n  gap: 8px;\r\n}\r\n\r\n.control-row label {\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n  color: var(--studio-text);\r\n}\r\n\r\n.color-picker-box {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  background: var(--studio-surface-variant);\r\n  padding: 4px 10px 4px 6px;\r\n  border-radius: 12px;\r\n  border: 1px solid var(--studio-border);\r\n}\r\n\r\n.color-picker-box input[type=\"color\"] {\r\n  width: 28px;\r\n  height: 28px;\r\n  border: none;\r\n  border-radius: 8px;\r\n  background: none;\r\n  cursor: pointer;\r\n  padding: 0;\r\n}\r\n\r\n.color-picker-box input[type=\"color\"]::-webkit-color-swatch-wrapper {\r\n  padding: 0;\r\n}\r\n\r\n.color-picker-box input[type=\"color\"]::-webkit-color-swatch {\r\n  border: none;\r\n  border-radius: 8px;\r\n}\r\n\r\n.color-hex {\r\n  font-family: 'JetBrains Mono', monospace;\r\n  font-size: 12px;\r\n  font-weight: 600;\r\n  color: var(--studio-text-sub);\r\n}\r\n\r\n/* Ползунки */\r\n.range-control {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n}\r\n\r\n.range-header {\r\n  display: flex;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n}\r\n\r\n.range-val {\r\n  font-family: 'JetBrains Mono', monospace;\r\n  font-size: 12px;\r\n  background: var(--studio-surface-variant);\r\n  padding: 2px 8px;\r\n  border-radius: 8px;\r\n  color: var(--studio-primary);\r\n  font-weight: 700;\r\n}\r\n\r\ninput[type=\"range\"] {\r\n  -webkit-appearance: none;\r\n  width: 100%;\r\n  height: 6px;\r\n  background: var(--studio-surface-variant);\r\n  border-radius: 6px;\r\n  outline: none;\r\n}\r\n\r\ninput[type=\"range\"]::-webkit-slider-thumb {\r\n  -webkit-appearance: none;\r\n  width: 18px;\r\n  height: 18px;\r\n  border-radius: 50%;\r\n  background: var(--studio-primary);\r\n  cursor: pointer;\r\n  box-shadow: 0 2px 6px rgba(0,0,0,0.4);\r\n  transition: transform 0.15s;\r\n}\r\n\r\ninput[type=\"range\"]::-webkit-slider-thumb:hover {\r\n  transform: scale(1.2);\r\n}\r\n\r\n/* Селекты и текстовые инпуты */\r\n.styled-select, .styled-input {\r\n  width: 100%;\r\n  padding: 10px 14px;\r\n  background: var(--studio-surface-variant);\r\n  border: 1px solid var(--studio-border);\r\n  border-radius: 12px;\r\n  color: var(--studio-text);\r\n  font-family: inherit;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n  outline: none;\r\n  transition: border-color 0.2s;\r\n}\r\n\r\n.styled-select:focus, .styled-input:focus {\r\n  border-color: var(--studio-primary);\r\n}\r\n\r\n/* Тумблеры */\r\n.toggle-control-row {\r\n  display: flex;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n}\r\n\r\n.studio-switch {\r\n  position: relative;\r\n  display: inline-block;\r\n  width: 44px;\r\n  height: 24px;\r\n}\r\n\r\n.studio-switch input {\r\n  opacity: 0;\r\n  width: 0;\r\n  height: 0;\r\n}\r\n\r\n.studio-slider {\r\n  position: absolute;\r\n  cursor: pointer;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  background-color: var(--studio-surface-variant);\r\n  transition: .3s cubic-bezier(0.2, 0.8, 0.2, 1);\r\n  border-radius: 24px;\r\n  border: 1px solid var(--studio-border);\r\n}\r\n\r\n.studio-slider:before {\r\n  position: absolute;\r\n  content: \"\";\r\n  height: 18px;\r\n  width: 18px;\r\n  left: 2px;\r\n  bottom: 2px;\r\n  background-color: #fff;\r\n  transition: .3s cubic-bezier(0.2, 0.8, 0.2, 1);\r\n  border-radius: 50%;\r\n}\r\n\r\n.studio-switch input:checked + .studio-slider {\r\n  background-color: var(--studio-primary);\r\n  border-color: var(--studio-primary);\r\n}\r\n\r\n.studio-switch input:checked + .studio-slider:before {\r\n  transform: translateX(20px);\r\n  background-color: var(--studio-on-primary);\r\n}\r\n\r\n/* Инструменты редактора */\r\n.tools-btn-grid {\r\n  display: grid;\r\n  grid-template-columns: 1fr 1fr;\r\n  gap: 8px;\r\n}\r\n\r\n.tool-action-btn {\r\n  padding: 10px 12px;\r\n  background: var(--studio-surface-variant);\r\n  border: 1px solid var(--studio-border);\r\n  border-radius: 12px;\r\n  color: var(--studio-text);\r\n  font-size: 13px;\r\n  font-weight: 700;\r\n  cursor: pointer;\r\n  transition: all 0.2s;\r\n}\r\n\r\n.tool-action-btn:hover {\r\n  background: rgba(255, 255, 255, 0.08);\r\n}\r\n\r\n.tool-action-btn.active {\r\n  border-color: var(--studio-primary);\r\n  background: rgba(208, 188, 255, 0.15);\r\n  color: #fff;\r\n}\r\n\r\n.tools-sub-row {\r\n  display: flex;\r\n  gap: 8px;\r\n}\r\n\r\n.tool-sub-btn {\r\n  flex: 1;\r\n  padding: 8px 10px;\r\n  background: transparent;\r\n  border: 1px solid var(--studio-border);\r\n  border-radius: 10px;\r\n  color: var(--studio-text-sub);\r\n  font-size: 12px;\r\n  font-weight: 600;\r\n  cursor: pointer;\r\n}\r\n\r\n.tool-sub-btn:hover {\r\n  color: #fff;\r\n  border-color: rgba(255, 255, 255, 0.2);\r\n}\r\n\r\n.tool-sub-btn.danger:hover {\r\n  color: var(--studio-danger);\r\n  border-color: rgba(255, 180, 171, 0.3);\r\n}\r\n\r\n.active-mode-banner {\r\n  padding: 8px 12px;\r\n  background: rgba(208, 188, 255, 0.15);\r\n  border: 1px solid var(--studio-primary);\r\n  border-radius: 10px;\r\n  font-size: 12px;\r\n  color: #fff;\r\n  font-weight: 600;\r\n  text-align: center;\r\n}\r\n\r\n.bottom-actions {\r\n  margin-top: auto;\r\n  padding-top: 10px;\r\n}\r\n\r\n.btn-secondary-action {\r\n  width: 100%;\r\n  padding: 12px;\r\n  background: transparent;\r\n  border: 1px solid var(--studio-border);\r\n  border-radius: 14px;\r\n  color: var(--studio-text-sub);\r\n  font-size: 13px;\r\n  font-weight: 700;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 8px;\r\n  transition: all 0.2s;\r\n}\r\n\r\n.btn-secondary-action:hover {\r\n  color: #fff;\r\n  border-color: rgba(255, 255, 255, 0.25);\r\n  background: rgba(255, 255, 255, 0.04);\r\n}\r\n\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   2. ПРАВАЯ ОБЛАСТЬ: ПРЕДПРОСМОТР (БЛОК 2.2)\r\n   ──────────────────────────────────────────────────────── */\r\n.studio-preview-pane {\r\n  flex: 1;\r\n  display: flex;\r\n  flex-direction: column;\r\n  height: 100vh;\r\n  overflow: hidden;\r\n  background: #0e0e11;\r\n  position: relative;\r\n}\r\n\r\n/* Верхняя полоса статуса предпросмотра */\r\n.preview-viewport-bar {\r\n  height: 48px;\r\n  background: #18181c;\r\n  border-bottom: 1px solid var(--studio-border);\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  padding: 0 24px;\r\n  z-index: 10;\r\n}\r\n\r\n.viewport-info {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n  font-size: 13px;\r\n  font-weight: 700;\r\n  color: var(--studio-text-sub);\r\n}\r\n\r\n.status-dot {\r\n  width: 8px;\r\n  height: 8px;\r\n  border-radius: 50%;\r\n  background: var(--studio-success);\r\n  box-shadow: 0 0 8px var(--studio-success);\r\n}\r\n\r\n.btn-viewport-action {\r\n  background: var(--studio-surface-variant);\r\n  border: 1px solid var(--studio-border);\r\n  color: var(--studio-text);\r\n  padding: 6px 14px;\r\n  border-radius: 10px;\r\n  font-size: 12px;\r\n  font-weight: 700;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  transition: all 0.2s ease;\r\n}\r\n\r\n.btn-viewport-action:hover {\r\n  background: rgba(255, 255, 255, 0.1);\r\n  color: #fff;\r\n  border-color: rgba(255, 255, 255, 0.2);\r\n}\r\n\r\n/* Скролл-контейнер для интерактивной страницы */\r\n.preview-scroll-container {\r\n  flex: 1;\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n  padding: 24px 20px 80px;\r\n  display: flex;\r\n  justify-content: center;\r\n  align-items: flex-start;\r\n  background: radial-gradient(circle at center top, #1a1a22 0%, #0d0d10 100%);\r\n  contain: paint !important;\r\n  isolation: isolate !important;\r\n  position: relative !important;\r\n  transform: translateZ(0) !important;\r\n}\r\n\r\n/* Полное подавление всплывающих и фиксированных боковых меню Moodle */\r\n.preview-moodle-page .drawer,\r\n.preview-moodle-page .drawer-left,\r\n.preview-moodle-page .drawer-right,\r\n.preview-moodle-page [class*=\"drawer\"],\r\n.preview-moodle-page [id*=\"drawer\"],\r\n.preview-moodle-page #theme_boost-drawers-courseindex,\r\n.preview-moodle-page #theme_boost-drawers-primary,\r\n.preview-moodle-page .fixed-top,\r\n.preview-moodle-page nav.fixed-top,\r\n.preview-moodle-page .navbar.fixed-top,\r\n.preview-moodle-page [data-region=\"fixed-drawer\"],\r\n.preview-moodle-page .drawer-toggler {\r\n  display: none !important;\r\n  visibility: hidden !important;\r\n  position: static !important;\r\n  width: 0 !important;\r\n  height: 0 !important;\r\n  max-width: 0 !important;\r\n  max-height: 0 !important;\r\n  overflow: hidden !important;\r\n  pointer-events: none !important;\r\n}\r\n\r\n/* Скрываем навязчивые плашки \"Выделено\" */\r\n.preview-moodle-page .current-badge,\r\n.preview-moodle-page [data-region=\"section-badges\"],\r\n.preview-moodle-page .section-badges,\r\n.preview-moodle-page .badge-info {\r\n  display: none !important;\r\n}\r\n\r\n.preview-scroll-container::-webkit-scrollbar {\r\n  width: 10px;\r\n}\r\n\r\n.preview-scroll-container::-webkit-scrollbar-thumb {\r\n  background: rgba(255, 255, 255, 0.2);\r\n  border-radius: 10px;\r\n}\r\n\r\n.preview-scroll-container::-webkit-scrollbar-thumb:hover {\r\n  background: rgba(255, 255, 255, 0.35);\r\n}\r\n\r\n/* Интерактивный макет страницы СДО (браузерное окно) */\r\n.preview-moodle-page {\r\n  width: 100%;\r\n  max-width: 1240px;\r\n  min-height: 800px;\r\n  height: auto;\r\n  margin-bottom: 60px;\r\n  background-color: var(--mc-bg, #1C1B1F);\r\n  background-image: var(--mc-bg-image, none);\r\n  background-size: cover;\r\n  background-position: center;\r\n  background-attachment: fixed;\r\n  color: var(--mc-text, #E6E1E5);\r\n  font-family: var(--mc-font, 'Nunito', sans-serif);\r\n  border-radius: 24px;\r\n  border: 1px solid rgba(255, 255, 255, 0.1);\r\n  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);\r\n  display: flex;\r\n  flex-direction: column;\r\n  position: relative;\r\n  overflow: visible;\r\n  transition: background-color 0.15s ease, color 0.15s ease;\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   ШАПКА (HEADER / NAVBAR) СДО\r\n   ──────────────────────────────────────────────────────── */\r\n.mock-navbar {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  padding: 8px 28px;\r\n  min-height: 58px;\r\n  max-height: 58px;\r\n  height: 58px;\r\n  background: var(--mc-bg-navbar, var(--mc-bg-card, #2B2930)) !important;\r\n  border-bottom: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1)) !important;\r\n  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);\r\n  position: relative !important;\r\n  top: auto !important;\r\n  left: auto !important;\r\n  right: auto !important;\r\n  border-radius: 24px 24px 0 0;\r\n  z-index: 5;\r\n  transition: background 0.15s ease, border-color 0.15s ease;\r\n  overflow: hidden;\r\n}\r\n\r\n.navbar-left {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 16px;\r\n}\r\n\r\n.mock-brand,\r\n#mock-navbar-brand {\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  max-height: 42px !important;\r\n  height: 42px !important;\r\n  overflow: hidden !important;\r\n  text-decoration: none;\r\n}\r\n\r\n.mock-crest-wrapper {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  height: 38px;\r\n  max-height: 38px;\r\n}\r\n\r\n.mock-brand img,\r\n#mock-navbar-brand img,\r\n.mock-crest-wrapper img,\r\n.mock-crest-wrapper svg {\r\n  max-height: 38px !important;\r\n  height: 38px !important;\r\n  width: auto !important;\r\n  max-width: 44px !important;\r\n  object-fit: contain !important;\r\n  display: block !important;\r\n}\r\n\r\n.mock-primary-nav .nav {\r\n  display: flex;\r\n  list-style: none;\r\n  gap: 6px;\r\n  align-items: center;\r\n  margin: 0;\r\n  padding: 0;\r\n}\r\n\r\n.mock-primary-nav .nav-link {\r\n  color: var(--mc-text, #E6E1E5) !important;\r\n  text-decoration: none;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n  padding: 6px 14px;\r\n  border-radius: var(--mc-radius-btn, 20px);\r\n  transition: all 0.2s ease;\r\n  opacity: 0.95;\r\n}\r\n\r\n.mock-primary-nav .nav-link:hover {\r\n  opacity: 1;\r\n  background: rgba(255, 255, 255, 0.06);\r\n  color: var(--mc-accent, #D0BCFF) !important;\r\n}\r\n\r\n.mock-primary-nav .nav-link.active {\r\n  background: var(--mc-accent-container, #4F378B) !important;\r\n  color: var(--mc-on-accent-container, #E6E1E5) !important;\r\n  font-weight: 700;\r\n  opacity: 1;\r\n}\r\n\r\n.navbar-right .mock-user-nav {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 14px;\r\n}\r\n\r\n.mock-user-nav .icon-item {\r\n  width: 34px;\r\n  height: 34px;\r\n  border-radius: 50%;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  color: var(--mc-text, #E6E1E5) !important;\r\n  cursor: pointer;\r\n  position: relative;\r\n  opacity: 0.85;\r\n  transition: background 0.2s ease, opacity 0.2s ease;\r\n}\r\n\r\n.mock-user-nav .icon-item i {\r\n  color: var(--mc-text, #E6E1E5) !important;\r\n}\r\n\r\n.mock-user-nav .icon-item:hover {\r\n  opacity: 1;\r\n  background: rgba(255, 255, 255, 0.08);\r\n}\r\n\r\n.notification-badge .badge-count {\r\n  position: absolute;\r\n  top: 2px;\r\n  right: 2px;\r\n  background: #e53935;\r\n  color: #fff;\r\n  font-size: 10px;\r\n  font-weight: 900;\r\n  padding: 1px 5px;\r\n  border-radius: 10px;\r\n  line-height: 1.2;\r\n}\r\n\r\n.mock-user-nav .user-item {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  cursor: pointer;\r\n  padding: 2px 4px;\r\n  border-radius: 20px;\r\n  transition: background 0.2s ease;\r\n}\r\n\r\n.mock-user-nav .user-item:hover {\r\n  background: rgba(255, 255, 255, 0.06);\r\n}\r\n\r\n.mock-user-nav .user-item .userinitials {\r\n  width: 34px;\r\n  height: 34px;\r\n  border-radius: 50%;\r\n  background: var(--mc-accent-container, #4F378B);\r\n  color: var(--mc-on-accent-container, #E6E1E5);\r\n  font-weight: 800;\r\n  font-size: 13px;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);\r\n}\r\n\r\n.mock-user-chevron {\r\n  font-size: 12px;\r\n  color: var(--mc-text, #E6E1E5) !important;\r\n  opacity: 0.7;\r\n}\r\n\r\n/* Контент страницы Moodle */\r\n.mock-page-content {\r\n  flex: 1;\r\n  padding: 24px 24px 36px;\r\n}\r\n\r\n.mock-container {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 20px;\r\n}\r\n\r\n.mock-page-header {\r\n  margin-bottom: 4px;\r\n}\r\n\r\n.mock-page-title {\r\n  font-size: 26px;\r\n  font-weight: 800;\r\n  color: var(--mc-text, #E6E1E5);\r\n  letter-spacing: -0.3px;\r\n  margin: 0;\r\n  width: fit-content !important;\r\n  max-width: 100% !important;\r\n  display: inline-block !important;\r\n}\r\n\r\n\r\n.live-sync-banner {\r\n  background: rgba(144, 216, 148, 0.12);\r\n  border: 1px solid rgba(144, 216, 148, 0.35);\r\n  border-radius: 14px;\r\n  padding: 10px 18px;\r\n  margin-bottom: 20px;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  font-size: 13px;\r\n  color: #c4eed0;\r\n  font-weight: 600;\r\n}\r\n\r\n.live-sync-banner i {\r\n  font-size: 16px;\r\n  color: #90d894;\r\n}\r\n\r\n.demo-notice-banner {\r\n  background: rgba(208, 188, 255, 0.12);\r\n  border: 1px solid rgba(208, 188, 255, 0.3);\r\n  border-radius: 14px;\r\n  padding: 12px 18px;\r\n  margin-bottom: 20px;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  font-size: 13px;\r\n  color: #e6e1e5;\r\n  font-weight: 500;\r\n}\r\n\r\n.demo-notice-banner i {\r\n  font-size: 16px;\r\n  color: #d0bcff;\r\n}\r\n\r\n.demo-notice-banner a {\r\n  color: #d0bcff;\r\n  font-weight: 700;\r\n  text-decoration: underline;\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   3. ДАШБОРД, КАРТОЧКИ КУРСОВ И ЭЛЕМЕНТЫ (БЛОК 2.3)\r\n   ──────────────────────────────────────────────────────── */\r\n.mock-dashboard-card {\r\n  background: var(--mc-bg-card, #2B2930);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.08));\r\n  border-radius: var(--mc-radius, 20px);\r\n  padding: 28px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 20px;\r\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);\r\n  transition: background 0.15s ease, border-color 0.15s ease, border-radius 0.15s ease;\r\n}\r\n\r\n.dashboard-card-header {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 16px;\r\n}\r\n\r\n.dashboard-heading {\r\n  font-size: 20px;\r\n  font-weight: 800;\r\n  color: var(--mc-text, #E6E1E5);\r\n  display: block !important;\r\n  width: fit-content !important;\r\n  max-width: 100% !important;\r\n}\r\n\r\n/* Фильтры курсов */\r\n.dashboard-filters {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 8px;\r\n  align-items: center;\r\n}\r\n\r\n.filter-pill {\r\n  background-color: var(--mc-bg-card-low, #201f24);\r\n  color: var(--mc-text, #E6E1E5);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1));\r\n  border-radius: var(--mc-radius-btn, 24px);\r\n  padding: 7px 18px;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n  cursor: pointer;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  transition: all 0.15s ease;\r\n}\r\n\r\n.filter-pill:hover {\r\n  border-color: var(--mc-accent, #D0BCFF);\r\n  color: var(--mc-accent, #D0BCFF);\r\n}\r\n\r\n.filter-pill.active {\r\n  background-color: var(--mc-accent, #D0BCFF) !important;\r\n  color: var(--mc-accent-contrast, #381E72) !important;\r\n  border: 1px solid var(--mc-accent, #D0BCFF) !important;\r\n  font-weight: 800 !important;\r\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);\r\n}\r\n\r\n/* Поиск и сортировка */\r\n.dashboard-search-row {\r\n  display: flex;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n  flex-wrap: wrap;\r\n  gap: 14px;\r\n  padding-top: 4px;\r\n}\r\n\r\n.search-box {\r\n  display: flex;\r\n  gap: 8px;\r\n  align-items: center;\r\n}\r\n\r\n.search-input {\r\n  background-color: var(--mc-bg-card-low, #201f24);\r\n  color: var(--mc-text, #E6E1E5);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1));\r\n  border-radius: var(--mc-radius-btn, 24px);\r\n  height: 38px;\r\n  min-height: 38px;\r\n  max-height: 38px;\r\n  padding: 0 16px;\r\n  font-size: 13px;\r\n  line-height: 36px;\r\n  box-sizing: border-box;\r\n  outline: none;\r\n  width: 220px;\r\n  transition: border-color 0.2s ease;\r\n}\r\n\r\n.search-input:focus {\r\n  border-color: var(--mc-accent, #D0BCFF);\r\n}\r\n\r\n.search-btn {\r\n  background-color: var(--mc-bg-card-low, #201f24);\r\n  color: var(--mc-text, #E6E1E5);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1));\r\n  border-radius: var(--mc-radius-btn, 24px);\r\n  height: 38px;\r\n  min-height: 38px;\r\n  max-height: 38px;\r\n  padding: 0 18px;\r\n  font-size: 13px;\r\n  line-height: 36px;\r\n  font-weight: 700;\r\n  box-sizing: border-box;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  cursor: pointer;\r\n  transition: all 0.2s ease;\r\n}\r\n\r\n.search-btn:hover {\r\n  background-color: var(--mc-accent-container, #4F378B);\r\n  color: var(--mc-on-accent-container, #E6E1E5);\r\n  border-color: var(--mc-accent, #D0BCFF);\r\n}\r\n\r\n.sort-view-box {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  font-size: 13px;\r\n  color: var(--mc-text, #E6E1E5);\r\n  opacity: 0.9;\r\n}\r\n\r\n.sort-dropdown {\r\n  background: var(--mc-bg-card-low, #201f24);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1));\r\n  color: var(--mc-text, #E6E1E5);\r\n  border-radius: var(--mc-radius-btn, 24px);\r\n  padding: 6px 14px;\r\n  font-size: 12px;\r\n  font-weight: 600;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n}\r\n\r\n.view-toggles {\r\n  display: flex;\r\n  gap: 4px;\r\n  background: var(--mc-bg-card-low, #201f24);\r\n  padding: 3px;\r\n  border-radius: var(--mc-radius-btn, 24px);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1));\r\n}\r\n\r\n.view-btn {\r\n  background: transparent;\r\n  border: none;\r\n  color: var(--mc-text, #E6E1E5);\r\n  padding: 5px 10px;\r\n  border-radius: var(--mc-radius-btn, 20px);\r\n  font-size: 12px;\r\n  cursor: pointer;\r\n  opacity: 0.6;\r\n  transition: all 0.15s ease;\r\n}\r\n\r\n.view-btn.active {\r\n  background: var(--mc-accent, #D0BCFF);\r\n  color: var(--mc-accent-contrast, #381E72);\r\n  opacity: 1;\r\n  font-weight: 700;\r\n}\r\n\r\n/* Сетка карточек курсов в песочнице — СТРОГО 3 В РЯДУ КАК В СДО */\r\nbody.mc-active .mock-courses-grid,\r\nbody.mc-active .preview-moodle-page .mock-courses-grid,\r\nbody.mc-active .preview-moodle-page .block_mydashboard .list-group,\r\nbody.mc-active #mock-courses-container,\r\n.mock-courses-grid {\r\n  display: grid !important;\r\n  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;\r\n  gap: 20px !important;\r\n  margin-top: 10px !important;\r\n}\r\n\r\n@media (max-width: 960px) {\r\n  body.mc-active .mock-courses-grid,\r\n  body.mc-active .preview-moodle-page .mock-courses-grid,\r\n  body.mc-active .preview-moodle-page .block_mydashboard .list-group,\r\n  body.mc-active #mock-courses-container,\r\n  .mock-courses-grid {\r\n    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;\r\n  }\r\n}\r\n\r\nbody.mc-active .mock-courses-grid.list-view,\r\nbody.mc-active .preview-moodle-page .mock-courses-grid.list-view,\r\nbody.mc-active #mock-courses-container.list-view,\r\n.mock-courses-grid.list-view {\r\n  grid-template-columns: 1fr !important;\r\n}\r\n\r\n.mock-card {\r\n  background: var(--mc-bg-card, #2B2930);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.08));\r\n  border-radius: var(--mc-radius, 24px);\r\n  padding: 24px;\r\n  padding-top: 144px; /* Отступ под обложку сверху ровно как в СДО */\r\n  display: flex;\r\n  flex-direction: column;\r\n  position: relative;\r\n  overflow: hidden; /* Обложка обрезается по верхнему радиусу */\r\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);\r\n  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease, box-shadow 0.3s ease;\r\n  min-height: 290px;\r\n  font-size: var(--mc-font-size, 14px) !important;\r\n}\r\n\r\n.mock-card:hover {\r\n  border-color: var(--mc-accent, #D0BCFF);\r\n}\r\n\r\n.mc-course-cover {\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  height: 120px;\r\n  border-radius: calc(var(--mc-radius, 20px) - 1px) calc(var(--mc-radius, 20px) - 1px) 0 0;\r\n  width: 100%;\r\n  opacity: 0.9;\r\n  z-index: 1;\r\n  background-size: cover;\r\n  background-position: center;\r\n}\r\n\r\n.mydashboard-course {\r\n  display: flex;\r\n  flex-direction: column;\r\n  flex: 1;\r\n  margin-bottom: 8px;\r\n}\r\n\r\n.mydashboard-course .mydashboard-coursename {\r\n  text-decoration: none;\r\n  display: flex;\r\n  flex-direction: column;\r\n  height: 100%;\r\n}\r\n\r\n.mc-course-title-main {\r\n  font-size: calc(var(--mc-font-size, 14px) * 1.15) !important;\r\n  font-weight: 800;\r\n  color: var(--mc-text, #E6E1E5);\r\n  line-height: 1.35;\r\n  margin-bottom: 14px;\r\n  display: block;\r\n}\r\n\r\n.mc-course-chips {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 14px;\r\n  margin-top: auto;\r\n  margin-bottom: 12px;\r\n}\r\n\r\n.mc-chip {\r\n  font-size: calc(var(--mc-font-size, 14px) * 0.85) !important;\r\n  font-weight: 600;\r\n  color: var(--mc-text, #E6E1E5);\r\n  opacity: 0.8;\r\n  background: transparent;\r\n  padding: 0;\r\n  border-radius: 0;\r\n}\r\n\r\n.mydashboard-progress {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 6px;\r\n  margin-top: auto;\r\n  padding-right: 36px;\r\n}\r\n\r\n.mydashboard-progress-string {\r\n  font-size: calc(var(--mc-font-size, 14px) * 0.85) !important;\r\n  font-weight: 700;\r\n  color: var(--mc-text, #E6E1E5);\r\n  opacity: 0.85;\r\n}\r\n\r\n.mydashboard-progress-string strong {\r\n  color: var(--mc-accent, #D0BCFF);\r\n  font-weight: 800;\r\n}\r\n\r\n.progress {\r\n  height: 6px;\r\n  background: var(--mc-outline-variant, rgba(127, 127, 127, 0.2));\r\n  border-radius: 6px;\r\n  overflow: hidden;\r\n}\r\n\r\n.progress-bar {\r\n  height: 100%;\r\n  background: var(--mc-accent, #D0BCFF);\r\n  border-radius: 6px;\r\n  transition: width 0.3s ease;\r\n}\r\n\r\n/* Закладка (Избранное) ВНИЗУ СПРАВА как в реальном Moodle */\r\n.mydashboard-menu-box {\r\n  position: absolute;\r\n  bottom: 24px;\r\n  right: 24px;\r\n  top: auto;\r\n  z-index: 10;\r\n}\r\n\r\n.btn-favourite {\r\n  background: transparent;\r\n  border: none;\r\n  color: var(--mc-text, #E6E1E5);\r\n  font-size: 17px;\r\n  cursor: pointer;\r\n  opacity: 0.75;\r\n  transition: all 0.2s ease;\r\n  padding: 0;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n\r\n.btn-favourite:hover {\r\n  transform: scale(1.15);\r\n  color: var(--mc-accent, #D0BCFF);\r\n  opacity: 1;\r\n}\r\n\r\n.btn-favourite.active {\r\n  color: var(--mc-accent, #D0BCFF);\r\n  opacity: 1;\r\n}\r\n\r\n/* Режим отображения списком (List view) */\r\n.mock-courses-grid.list-view {\r\n  grid-template-columns: 1fr !important;\r\n}\r\n\r\n.mock-courses-grid.list-view .mock-card {\r\n  flex-direction: row;\r\n  align-items: center;\r\n  padding: 16px 22px;\r\n}\r\n\r\n.mock-courses-grid.list-view .mc-course-cover {\r\n  width: 80px;\r\n  height: 60px;\r\n  flex-shrink: 0;\r\n}\r\n\r\n.mock-courses-grid.list-view .mydashboard-course {\r\n  flex: 1;\r\n}\r\n\r\n.mock-courses-grid.list-view .mydashboard-progress {\r\n  width: 140px;\r\n  margin-top: 0;\r\n}\r\n\r\n.mock-courses-grid.list-view .mydashboard-menu-box {\r\n  position: static;\r\n  margin-left: 14px;\r\n}\r\n\r\n/* Футер Moodle */\r\n.mock-page-footer {\r\n  background: var(--mc-bg-card, #2B2930);\r\n  border-top: 1px solid var(--mc-border, rgba(255, 255, 255, 0.08));\r\n  padding: 24px 36px;\r\n  margin-top: auto;\r\n  transition: all 0.2s ease;\r\n}\r\n\r\n.mock-footer-inner {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 12px;\r\n  align-items: center;\r\n  text-align: center;\r\n}\r\n\r\n.mock-footer-links {\r\n  display: flex;\r\n  gap: 20px;\r\n  flex-wrap: wrap;\r\n  justify-content: center;\r\n}\r\n\r\n.mock-footer-link {\r\n  color: var(--mc-accent, #D0BCFF);\r\n  font-size: 12px;\r\n  text-decoration: none;\r\n  font-weight: 600;\r\n}\r\n\r\n.mock-footer-link:hover {\r\n  text-decoration: underline;\r\n}\r\n\r\n.mock-footer-copy {\r\n  font-size: 12px;\r\n  color: var(--mc-text, #E6E1E5);\r\n  opacity: 0.6;\r\n}\r\n\r\n.mc-hide-footer #mock-page-footer {\r\n  display: none !important;\r\n}\r\n\r\n/* Компактный режим */\r\n.mc-compact-mode .mock-card {\r\n  min-height: 190px !important;\r\n  padding: 14px 18px !important;\r\n  padding-top: 74px !important; /* Ровно 56px обложка + 18px отступ текста */\r\n  gap: 8px !important;\r\n}\r\n\r\n.mc-compact-mode .mc-course-cover {\r\n  height: 56px !important;\r\n}\r\n\r\n.mc-compact-mode .mc-course-title-main {\r\n  font-size: 0.96rem !important;\r\n  line-height: 1.25 !important;\r\n  margin-bottom: 8px !important;\r\n}\r\n\r\n.mc-compact-mode .mc-course-chips {\r\n  gap: 4px !important;\r\n  margin-bottom: 6px !important;\r\n}\r\n\r\n.mc-compact-mode .mc-chip {\r\n  font-size: 11px !important;\r\n}\r\n\r\n.mc-compact-mode .mydashboard-progress {\r\n  padding-right: 36px !important;\r\n  gap: 4px !important;\r\n  margin-top: auto !important;\r\n}\r\n\r\n.mc-compact-mode .mydashboard-progress-string {\r\n  font-size: 11px !important;\r\n}\r\n\r\n.mc-compact-mode .progress {\r\n  height: 5px !important;\r\n  min-height: 5px !important;\r\n}\r\n\r\n.mc-compact-mode .mydashboard-menu-box {\r\n  bottom: 12px !important;\r\n  right: 14px !important;\r\n}\r\n\r\n.mc-compact-mode .mock-page-content {\r\n  padding: 16px 20px !important;\r\n}\r\n\r\n.mc-compact-mode .mock-courses-grid {\r\n  gap: 12px !important;\r\n}\r\n\r\n/* Полностью скрываем FAB кнопку учета пропусков в песочнице */\r\n.mc-fab-button,\r\n#mock-fab,\r\n.studio-app .mc-fab-button,\r\nbody.mc-active .mc-fab-button {\r\n  display: none !important;\r\n  visibility: hidden !important;\r\n  opacity: 0 !important;\r\n  pointer-events: none !important;\r\n}\r\n\r\n/* Инструмент Ластик (Hover highlight) */\r\n.mc-eraser-mode {\r\n  cursor: crosshair !important;\r\n}\r\n\r\n.mc-eraser-mode * {\r\n  cursor: crosshair !important;\r\n}\r\n\r\n.mc-eraser-target-hover {\r\n  outline: 2px dashed #ff5252 !important;\r\n  outline-offset: 2px !important;\r\n  background-color: rgba(255, 82, 82, 0.15) !important;\r\n}\r\n\r\n/* Инструмент Переместить (Drag move) */\r\n.mc-move-mode {\r\n  cursor: grab !important;\r\n}\r\n\r\n.mc-move-mode * {\r\n  cursor: grab !important;\r\n}\r\n\r\n.mc-move-mode .mc-moving {\r\n  cursor: grabbing !important;\r\n  opacity: 0.85 !important;\r\n  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4) !important;\r\n  transition: none !important;\r\n}\r\n\r\n.mc-move-target-hover {\r\n  outline: 2px dashed #00bfa5 !important;\r\n  outline-offset: 3px !important;\r\n  border-radius: 8px !important;\r\n  background-color: rgba(0, 191, 165, 0.12) !important;\r\n}\r\n\r\n/* Всплывающий тост */\r\n.studio-toast {\r\n  position: fixed;\r\n  bottom: 28px;\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  background: #1e1e24;\r\n  color: #fff;\r\n  border: 1px solid var(--studio-primary);\r\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);\r\n  padding: 12px 24px;\r\n  border-radius: 14px;\r\n  font-size: 14px;\r\n  font-weight: 700;\r\n  z-index: 9999;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n  animation: fadeInToast 0.25s ease;\r\n}\r\n\r\n@keyframes fadeInToast {\r\n  from { opacity: 0; transform: translate(-50%, 15px); }\r\n  to { opacity: 1; transform: translate(-50%, 0); }\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   ВЬЮ-ТОГГЛ И СТРАНИЦА КУРСА В ПЕСОЧНИЦЕ\r\n   ──────────────────────────────────────────────────────── */\r\n.viewport-views-toggle {\r\n  display: none !important;\r\n}\r\n\r\n.viewport-view-tab {\r\n  background: transparent;\r\n  border: none;\r\n  color: var(--studio-text-sub);\r\n  padding: 5px 14px;\r\n  border-radius: 8px;\r\n  font-size: 12px;\r\n  font-weight: 700;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  transition: all 0.2s ease;\r\n}\r\n\r\n.viewport-view-tab:hover {\r\n  color: #fff;\r\n}\r\n\r\n.viewport-view-tab.active {\r\n  background: var(--studio-primary, #d0bcff);\r\n  color: #1c1b1f;\r\n}\r\n\r\n.mock-course-hero-card {\r\n  background: var(--mc-bg-card, #2B2930);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.08));\r\n  border-radius: var(--mc-radius, 20px);\r\n  padding: 24px 28px 20px;\r\n  margin-bottom: 24px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 14px;\r\n}\r\n\r\n.mock-course-title-row {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 12px;\r\n}\r\n\r\n.mock-course-title {\r\n  font-size: 1.55rem;\r\n  font-weight: 800;\r\n  color: var(--mc-text, #E6E1E5);\r\n  line-height: 1.35;\r\n  margin: 0;\r\n}\r\n\r\n.mock-course-progress-badge {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 6px;\r\n  max-width: 260px;\r\n}\r\n\r\n.mock-course-progress-badge .course-prog-text {\r\n  font-size: 13px;\r\n  font-weight: 700;\r\n  color: var(--mc-text, #E6E1E5);\r\n}\r\n\r\n.mock-course-progress-badge .progress {\r\n  height: 6px;\r\n  background: rgba(255, 255, 255, 0.12);\r\n  border-radius: 6px;\r\n  overflow: hidden;\r\n}\r\n\r\n.mock-secondary-nav {\r\n  margin-top: 14px;\r\n  margin-bottom: 6px;\r\n  border-bottom: 1px solid var(--mc-border, rgba(255, 255, 255, 0.12));\r\n  clear: both;\r\n}\r\n\r\n.mock-secondary-nav .nav-tabs {\r\n  display: flex;\r\n  gap: 12px;\r\n  border: none;\r\n  padding-bottom: 12px;\r\n  margin: 0;\r\n}\r\n\r\n.mock-secondary-nav .nav-link {\r\n  border-radius: var(--mc-radius-btn, 24px);\r\n  padding: 8px 18px;\r\n  font-weight: 700;\r\n  font-size: 13px;\r\n  text-decoration: none;\r\n  background-color: var(--mc-bg-card-low, #1D1B20);\r\n  color: var(--mc-text, #E6E1E5);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.12));\r\n  transition: all 0.2s;\r\n}\r\n\r\n.mock-secondary-nav .nav-link.active {\r\n  background-color: var(--mc-accent, #D0BCFF) !important;\r\n  color: var(--mc-accent-contrast, #381E72) !important;\r\n  border-color: var(--mc-accent, #D0BCFF) !important;\r\n}\r\n\r\n.mock-course-section-block {\r\n  background-color: var(--mc-bg-card, #2B2930);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.12));\r\n  border-radius: var(--mc-radius, 20px);\r\n  padding: 20px 24px;\r\n  margin-bottom: 16px;\r\n}\r\n\r\n.mock-section-header {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  margin-bottom: 16px;\r\n  color: var(--mc-text, #E6E1E5);\r\n  font-weight: 700;\r\n}\r\n\r\n.mock-section-chevron {\r\n  width: 24px;\r\n  height: 24px;\r\n  border-radius: 50%;\r\n  background: var(--mc-bg-card-low, rgba(0, 0, 0, 0.2));\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  font-size: 14px;\r\n}\r\n\r\n.mock-section-title {\r\n  font-size: 1.15rem;\r\n  font-weight: 800;\r\n  flex: 1;\r\n}\r\n\r\n.mock-collapse-btn {\r\n  font-size: 12px;\r\n  opacity: 0.6;\r\n  cursor: pointer;\r\n}\r\n\r\n.mock-section-items {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 10px;\r\n}\r\n\r\n.mock-activity-card {\r\n  background-color: var(--mc-bg-card-low, #1D1B20);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.1));\r\n  border-radius: 12px;\r\n  padding: 14px 18px;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  transition: transform 0.2s, border-color 0.2s;\r\n}\r\n\r\n.mock-activity-card:hover {\r\n  border-color: var(--mc-accent, #D0BCFF);\r\n  transform: translateX(4px);\r\n}\r\n\r\n.mock-act-badge {\r\n  background: var(--mc-accent-container, #4F378B);\r\n  color: var(--mc-on-accent-container, #EADDFF);\r\n  font-size: 11px;\r\n  font-weight: 800;\r\n  padding: 2px 8px;\r\n  border-radius: 6px;\r\n  border: 1px solid var(--mc-border, transparent);\r\n}\r\n\r\n.mock-act-icon {\r\n  font-size: 16px;\r\n  color: var(--mc-accent, #D0BCFF);\r\n}\r\n\r\n.mock-act-title {\r\n  font-size: 14px;\r\n  font-weight: 600;\r\n  color: var(--mc-text, #E6E1E5);\r\n  flex: 1;\r\n}\r\n\r\n.mock-act-status {\r\n  margin-left: auto;\r\n  font-size: 11px;\r\n  font-weight: 700;\r\n  padding: 3px 8px;\r\n  border-radius: 6px;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 5px;\r\n}\r\n\r\n.mock-act-status.completed {\r\n  background: rgba(144, 216, 148, 0.15);\r\n  color: #90D894;\r\n  border: 1px solid rgba(144, 216, 148, 0.3);\r\n}\r\n\r\n/* Кастомная захваченная страница СДО (техподдержка, задания, профиль) */\r\n.mock-custom-view {\r\n  width: 100%;\r\n}\r\n\r\n.mock-custom-page-wrapper {\r\n  width: 100%;\r\n}\r\n\r\n.mock-custom-page-wrapper #page {\r\n  padding: 0 !important;\r\n  margin: 0 !important;\r\n  background: transparent !important;\r\n}\r\n\r\n.mock-custom-page-wrapper #page-content {\r\n  padding: 0 !important;\r\n}\r\n\r\n.mock-custom-page-wrapper .card,\r\n.mock-custom-page-wrapper .box,\r\n.mock-custom-page-wrapper .mform {\r\n  max-width: 900px;\r\n  margin: 0 auto;\r\n}\r\n\r\n/* Устранение обрезки \"боксом\" для перемещаемых и перемещенных элементов */\r\n.mock-dashboard-card,\r\n.dashboard-card-header,\r\n.dashboard-filters,\r\n.dashboard-search-row,\r\n.mock-courses-grid,\r\n.mock-card,\r\n.mock-page-content,\r\n.mock-container,\r\n[data-studio-moved=\"true\"],\r\n.mc-moving {\r\n  overflow: visible !important;\r\n}\r\n\r\n/* Плотность карточек: Компактная */\r\n.mc-density-compact .mock-courses-grid {\r\n  gap: 14px !important;\r\n}\r\n.mc-density-compact .mock-card {\r\n  padding: 16px !important;\r\n  padding-top: 114px !important;\r\n  min-height: 220px !important;\r\n}\r\n.mc-density-compact .mc-course-cover {\r\n  height: 96px !important;\r\n}\r\n.mc-density-compact .mc-course-title-main {\r\n  font-size: 0.98rem !important;\r\n  margin-bottom: 8px !important;\r\n}\r\n.mc-density-compact .mc-course-chips {\r\n  gap: 6px !important;\r\n  margin-bottom: 8px !important;\r\n}\r\n.mc-density-compact .mc-chip {\r\n  font-size: 10px !important;\r\n  padding: 2px 7px !important;\r\n}\r\n\r\n/* Плотность карточек: Просторная */\r\n.mc-density-spacious .mock-courses-grid {\r\n  gap: 26px !important;\r\n}\r\n.mc-density-spacious .mock-card {\r\n  padding: 28px !important;\r\n  padding-top: 168px !important;\r\n  min-height: 330px !important;\r\n}\r\n.mc-density-spacious .mc-course-cover {\r\n  height: 144px !important;\r\n}\r\n.mc-density-spacious .mc-course-title-main {\r\n  font-size: 1.25rem !important;\r\n  margin-bottom: 18px !important;\r\n}\r\n.mc-density-spacious .mc-course-chips {\r\n  gap: 16px !important;\r\n  margin-bottom: 16px !important;\r\n}\r\n\r\n/* Модальное окно настройки курса */\r\n.studio-modal-backdrop {\r\n  position: fixed;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n  background: rgba(0, 0, 0, 0.7);\r\n  backdrop-filter: blur(8px);\r\n  z-index: 9999999;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 20px;\r\n}\r\n\r\n.studio-modal-card {\r\n  background: var(--studio-surface, #1e1e24);\r\n  border: 1px solid var(--studio-border, rgba(255, 255, 255, 0.15));\r\n  border-radius: 20px;\r\n  width: 100%;\r\n  max-width: 440px;\r\n  padding: 24px;\r\n  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);\r\n  display: flex;\r\n  flex-direction: column;\r\n}\r\n\r\n.studio-modal-header {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  margin-bottom: 16px;\r\n}\r\n\r\n.studio-modal-title {\r\n  font-size: 16px;\r\n  font-weight: 800;\r\n  color: var(--studio-text, #fff);\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n\r\n.studio-modal-close {\r\n  background: none;\r\n  border: none;\r\n  color: var(--studio-text-sub, #aaa);\r\n  font-size: 22px;\r\n  cursor: pointer;\r\n  line-height: 1;\r\n}\r\n\r\n.studio-modal-close:hover {\r\n  color: #fff;\r\n}\r\n\r\n.btn-course-settings {\r\n  background: rgba(255, 255, 255, 0.08);\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.15));\r\n  color: var(--mc-text, #E6E1E5);\r\n  width: 28px;\r\n  height: 28px;\r\n  border-radius: 50%;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  cursor: pointer;\r\n  font-size: 12px;\r\n  margin-right: 6px;\r\n  transition: all 0.2s ease;\r\n}\r\n\r\n.btn-course-settings:hover {\r\n  background: var(--mc-accent, #D0BCFF);\r\n  color: var(--mc-accent-contrast, #381E72);\r\n  transform: rotate(45deg);\r\n}\r\n\r\n.mc-pinned-badge,\r\n.mc-pinned-badge *,\r\n.mc-pinned-badge i,\r\n.mc-pinned-badge span,\r\n.mock-card .mc-pinned-badge,\r\n.mock-card .mc-pinned-badge * {\r\n  color: #ffd54f !important;\r\n  fill: #ffd54f !important;\r\n  -webkit-text-fill-color: #ffd54f !important;\r\n}\r\n\r\n.mc-pinned-badge {\r\n  position: absolute;\r\n  top: 10px;\r\n  left: 10px;\r\n  background: rgba(18, 18, 20, 0.88) !important;\r\n  backdrop-filter: blur(6px);\r\n  -webkit-backdrop-filter: blur(6px);\r\n  color: #ffd54f !important;\r\n  border: 1px solid rgba(255, 213, 79, 0.6) !important;\r\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);\r\n  font-size: 10px;\r\n  font-weight: 800;\r\n  padding: 3px 8px;\r\n  border-radius: 12px;\r\n  z-index: 5;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 5px;\r\n  pointer-events: none !important;\r\n}\r\n\r\n.mock-card[data-mc-pinned=\"true\"],\r\n[data-mc-pinned=\"true\"] {\r\n  order: -100 !important;\r\n}\r\n\r\n/* ===================================================\r\n   ПРОГРЕСС-БАРЫ И ИНДИКАТОРЫ УСПЕВАЕМОСТИ (БЛОК 2)\r\n   =================================================== */\r\n\r\n/* Толщина прогресс-бара */\r\n.mc-progress-slim .progress {\r\n  height: 4px !important;\r\n  min-height: 4px !important;\r\n  border-radius: 4px !important;\r\n}\r\n.mc-progress-slim .progress-bar {\r\n  border-radius: 4px !important;\r\n}\r\n\r\n.mc-progress-normal .progress {\r\n  height: 8px !important;\r\n  min-height: 8px !important;\r\n  border-radius: 8px !important;\r\n}\r\n.mc-progress-normal .progress-bar {\r\n  border-radius: 8px !important;\r\n}\r\n\r\n.mc-progress-thick .progress {\r\n  height: 14px !important;\r\n  min-height: 14px !important;\r\n  border-radius: 10px !important;\r\n}\r\n.mc-progress-thick .progress-bar {\r\n  border-radius: 10px !important;\r\n}\r\n\r\n/* Эффекты полосы */\r\n.mc-progress-glow .progress-bar {\r\n  box-shadow: 0 0 10px var(--mc-bar-color, var(--mc-accent)), 0 0 3px var(--mc-bar-color, var(--mc-accent)) !important;\r\n}\r\n\r\n.mc-progress-striped .progress-bar {\r\n  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.22) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.22) 50%, rgba(255, 255, 255, 0.22) 75%, transparent 75%, transparent) !important;\r\n  background-size: 16px 16px !important;\r\n  animation: mcStripesMove 1.5s linear infinite !important;\r\n}\r\n\r\n@keyframes mcStripesMove {\r\n  0% { background-position: 0 0; }\r\n  100% { background-position: 32px 0; }\r\n}\r\n\r\n/* Стиль отображения процентов */\r\n.mc-progress-badge-hidden .mydashboard-progress-string {\r\n  display: none !important;\r\n}\r\n\r\n.mc-progress-badge-pill .mydashboard-progress-string {\r\n  display: inline-flex !important;\r\n  align-self: flex-start !important;\r\n  padding: 3px 9px !important;\r\n  border-radius: 12px !important;\r\n  font-size: 11px !important;\r\n  font-weight: 700 !important;\r\n  background: rgba(255, 255, 255, 0.08) !important;\r\n  border: 1px solid rgba(255, 255, 255, 0.12) !important;\r\n  backdrop-filter: blur(4px) !important;\r\n  margin-bottom: 2px !important;\r\n}\r\n\r\n/* ===================================================\r\n   ШАПКА (NAVBAR) И НАВИГАЦИЯ (БЛОК 3)\r\n   =================================================== */\r\n\r\n/* 1. Стиль шапки: Островной плавающий (Floating Island) */\r\n.mc-nav-style-floating .mock-navbar {\r\n  margin: 12px 18px !important;\r\n  border-radius: 20px !important;\r\n  background: var(--mc-bg-card, var(--mc-card-solid, #2B2930)) !important;\r\n  border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.12)) !important;\r\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28) !important;\r\n  width: calc(100% - 36px) !important;\r\n  max-width: calc(100% - 36px) !important;\r\n  transition: all 0.25s ease !important;\r\n}\r\n\r\n/* 2. Стиль шапки: Ультра-стекло (Glassmorphism) */\r\n.mc-nav-style-glass .mock-navbar {\r\n  backdrop-filter: blur(16px) saturate(160%) !important;\r\n  -webkit-backdrop-filter: blur(16px) saturate(160%) !important;\r\n  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25) !important;\r\n}\r\n\r\n/* 3. Форма аватара пользователя */\r\n.mc-avatar-circle .userinitials,\r\n.mc-avatar-circle .userpicture,\r\n.mc-avatar-circle .mock-user-nav .user-item .userinitials {\r\n  border-radius: 50% !important;\r\n}\r\n\r\n.mc-avatar-rounded .userinitials,\r\n.mc-avatar-rounded .userpicture,\r\n.mc-avatar-rounded .mock-user-nav .user-item .userinitials {\r\n  border-radius: 10px !important;\r\n}\r\n\r\n.mc-avatar-square .userinitials,\r\n.mc-avatar-square .userpicture,\r\n.mc-avatar-square .mock-user-nav .user-item .userinitials {\r\n  border-radius: 4px !important;\r\n}\r\n\r\n/* 4. Высота шапки */\r\n.mc-nav-height-compact .mock-navbar {\r\n  min-height: 48px !important;\r\n  max-height: 48px !important;\r\n  height: 48px !important;\r\n  padding-top: 4px !important;\r\n  padding-bottom: 4px !important;\r\n}\r\n\r\n.mc-nav-height-normal .mock-navbar {\r\n  min-height: 60px !important;\r\n  max-height: 60px !important;\r\n  height: 60px !important;\r\n}\r\n\r\n.mc-nav-height-tall .mock-navbar {\r\n  min-height: 72px !important;\r\n  max-height: 72px !important;\r\n  height: 72px !important;\r\n  padding-top: 12px !important;\r\n  padding-bottom: 12px !important;\r\n}\r\n\r\n/* 5. Минималистичная чистая шапка */\r\n.mc-nav-clean .mock-primary-nav {\r\n  opacity: 0.7 !important;\r\n  transition: opacity 0.2s ease;\r\n}\r\n.mc-nav-clean .mock-primary-nav:hover {\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* ===================================================\r\n   АНИМАЦИИ И МИКРО-ВЗАИМОДЕЙСТВИЯ (БЛОК 4)\r\n   =================================================== */\r\n\r\n/* 1. Скорость анимаций */\r\n.mc-anim-smooth .mock-card,\r\n.mc-anim-smooth .btn,\r\n.mc-anim-smooth button,\r\n.mc-anim-smooth a {\r\n  transition: all 0.35s cubic-bezier(0.2, 0, 0, 1) !important;\r\n}\r\n\r\n.mc-anim-snappy .mock-card,\r\n.mc-anim-snappy .btn,\r\n.mc-anim-snappy button,\r\n.mc-anim-snappy a {\r\n  transition: all 0.15s ease !important;\r\n}\r\n\r\n.mc-anim-instant .mock-card,\r\n.mc-anim-instant .btn,\r\n.mc-anim-instant button,\r\n.mc-anim-instant a {\r\n  transition: none !important;\r\n  animation: none !important;\r\n}\r\n\r\n/* 2. Эффекты при наведении на карточки */\r\n.mock-courses-grid {\r\n  perspective: 1200px;\r\n}\r\n\r\n.mc-hover-lift .mock-card {\r\n  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease !important;\r\n}\r\n.mc-hover-lift .mock-card:hover {\r\n  transform: translateY(-6px) !important;\r\n  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.32), 0 6px 12px rgba(0, 0, 0, 0.2) !important;\r\n}\r\n\r\n.mc-hover-glow .mock-card {\r\n  transition: box-shadow 0.25s ease, border-color 0.25s ease !important;\r\n}\r\n.mc-hover-glow .mock-card:hover {\r\n  transform: none !important;\r\n  box-shadow: 0 0 24px var(--mc-accent, #D0BCFF), 0 0 8px var(--mc-accent, #D0BCFF) !important;\r\n  border-color: var(--mc-accent, #D0BCFF) !important;\r\n}\r\n\r\n.mc-hover-tilt .mock-card {\r\n  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.28s ease !important;\r\n  transform-style: preserve-3d !important;\r\n}\r\n.mc-hover-tilt .mock-card:hover {\r\n  transform: perspective(600px) translateY(-8px) rotateX(7deg) rotateY(-7deg) scale(1.02) !important;\r\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45), 0 0 16px rgba(208, 188, 255, 0.2) !important;\r\n}\r\n\r\n.mc-hover-none .mock-card:hover {\r\n  transform: none !important;\r\n}\r\n\r\n/* 3. Упругий клик по кнопкам (Scale Press) */\r\n.mc-btn-press button:active,\r\n.mc-btn-press .btn:active,\r\n.mc-btn-press a.btn:active,\r\n.mc-btn-press .filter-pill:active,\r\n.mc-btn-press .view-btn:active {\r\n  transform: scale(0.95) !important;\r\n  transition: transform 0.08s ease !important;\r\n}\r\n\r\n/* ===================================================\r\n   ФОНОВЫЕ ОБОИ И ЭФФЕКТЫ (БЛОК 5)\r\n   =================================================== */\r\n\r\n.preview-moodle-page::before {\r\n  content: '';\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  background-color: rgba(0, 0, 0, var(--mc-bg-dim, 0));\r\n  backdrop-filter: blur(var(--mc-bg-blur, 0px));\r\n  -webkit-backdrop-filter: blur(var(--mc-bg-blur, 0px));\r\n  pointer-events: none;\r\n  z-index: 1;\r\n  border-radius: 24px;\r\n}\r\n\r\n.preview-moodle-page.mc-grain-overlay::after {\r\n  content: '';\r\n  position: absolute;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\");\r\n  pointer-events: none;\r\n  z-index: 2;\r\n  border-radius: 24px;\r\n}\r\n\r\n.mock-navbar,\r\n.mock-page-content,\r\n.mock-page-footer {\r\n  position: relative;\r\n  z-index: 3;\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   КНОПКА ЗАКРЫТИЯ В ХЕДЕРЕ САЙДБАРА И МОБИЛЬНАЯ НАВИГАЦИЯ\r\n   ──────────────────────────────────────────────────────── */\r\n.sidebar-header {\r\n  display: flex !important;\r\n  justify-content: space-between !important;\r\n  align-items: center !important;\r\n  padding: 16px 20px !important;\r\n}\r\n\r\n.btn-studio-close-header {\r\n  background: rgba(255, 255, 255, 0.08) !important;\r\n  border: 1px solid var(--studio-border, rgba(255, 255, 255, 0.12)) !important;\r\n  color: var(--studio-text, #e6e1e5) !important;\r\n  width: 36px !important;\r\n  height: 36px !important;\r\n  border-radius: 50% !important;\r\n  display: flex !important;\r\n  align-items: center !important;\r\n  justify-content: center !important;\r\n  font-size: 16px !important;\r\n  cursor: pointer !important;\r\n  transition: all 0.2s ease !important;\r\n  flex-shrink: 0 !important;\r\n}\r\n\r\n.btn-studio-close-header:hover,\r\n.btn-studio-close-header:active {\r\n  background: rgba(255, 80, 80, 0.25) !important;\r\n  color: #ffb4ab !important;\r\n  border-color: rgba(255, 80, 80, 0.5) !important;\r\n}\r\n\r\n.studio-mobile-nav {\r\n  display: none;\r\n  background: var(--studio-surface-variant, #28282e);\r\n  padding: 8px 14px;\r\n  border-bottom: 1px solid var(--studio-border, rgba(255, 255, 255, 0.08));\r\n  gap: 10px;\r\n}\r\n\r\n.studio-mobile-tab-btn {\r\n  flex: 1;\r\n  padding: 10px 14px;\r\n  border-radius: 10px;\r\n  background: rgba(255, 255, 255, 0.04);\r\n  border: 1px solid transparent;\r\n  color: var(--studio-text-sub, #9e9ba5);\r\n  font-size: 13px;\r\n  font-weight: 700;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 8px;\r\n  cursor: pointer;\r\n  transition: all 0.2s ease;\r\n}\r\n\r\n.studio-mobile-tab-btn.active {\r\n  background: var(--studio-primary, #d0bcff);\r\n  color: var(--studio-on-primary, #381e72);\r\n  border-color: var(--studio-primary, #d0bcff);\r\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);\r\n}\r\n\r\n.btn-mobile-back-to-settings {\r\n  display: none !important;\r\n}\r\n\r\n/* ────────────────────────────────────────────────────────\r\n   МОБИЛЬНАЯ АДАПТАЦИЯ (ЭКРАНЫ <= 900px: СМАРТФОНЫ И ПЛАНШЕТЫ)\r\n   ──────────────────────────────────────────────────────── */\r\n@media (max-width: 900px) {\r\n  html, body {\r\n    width: 100vw !important;\r\n    height: 100% !important;\r\n    height: 100dvh !important;\r\n    overflow: hidden !important;\r\n  }\r\n\r\n  .studio-app {\r\n    flex-direction: column !important;\r\n    width: 100vw !important;\r\n    height: 100% !important;\r\n    height: 100dvh !important;\r\n    overflow: hidden !important;\r\n    position: relative !important;\r\n  }\r\n\r\n  .studio-mobile-nav {\r\n    display: flex !important;\r\n  }\r\n\r\n  .btn-mobile-back-to-settings {\r\n    display: inline-flex !important;\r\n  }\r\n\r\n  .studio-sidebar {\r\n    width: 100vw !important;\r\n    min-width: 100vw !important;\r\n    max-width: 100vw !important;\r\n    height: 100% !important;\r\n    border-right: none !important;\r\n    display: flex !important;\r\n    flex-direction: column !important;\r\n  }\r\n\r\n  .studio-sidebar.mobile-hidden {\r\n    display: none !important;\r\n  }\r\n\r\n  .studio-preview-pane {\r\n    display: none !important;\r\n    width: 100vw !important;\r\n    min-width: 100vw !important;\r\n    max-width: 100vw !important;\r\n    height: 100% !important;\r\n    flex: 1 !important;\r\n    overflow-x: auto !important;\r\n    -webkit-overflow-scrolling: touch !important;\r\n  }\r\n\r\n  .studio-preview-pane.mobile-active {\r\n    display: flex !important;\r\n  }\r\n\r\n  .preview-viewport-bar {\r\n    padding: 8px 12px !important;\r\n    flex-wrap: wrap !important;\r\n    gap: 8px !important;\r\n  }\r\n\r\n  .preview-scroll-container {\r\n    padding: 12px 8px 100px !important;\r\n    overflow-x: auto !important;\r\n    -webkit-overflow-scrolling: touch !important;\r\n    justify-content: flex-start !important;\r\n  }\r\n\r\n  .preview-moodle-page {\r\n    min-width: 340px !important;\r\n    width: 100% !important;\r\n    max-width: 100% !important;\r\n    border-radius: 14px !important;\r\n    margin-bottom: 30px !important;\r\n  }\r\n\r\n  .mock-navbar {\r\n    padding: 8px 12px !important;\r\n  }\r\n\r\n  .mock-primary-nav {\r\n    display: none !important;\r\n  }\r\n\r\n  .sidebar-content {\r\n    padding: 16px 16px 120px !important;\r\n    -webkit-overflow-scrolling: touch !important;\r\n  }\r\n\r\n  .presets-grid {\r\n    grid-template-columns: repeat(3, 1fr) !important;\r\n    gap: 8px !important;\r\n  }\r\n\r\n  .preset-pill {\r\n    padding: 8px 6px !important;\r\n    font-size: 11px !important;\r\n  }\r\n}\r\n\r\n\r\n\r\n\r\n\n</style>\r\n  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css\">\r\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\r\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\r\n  <link href=\"https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Manrope:wght@500;700&display=swap\" rel=\"stylesheet\">\r\n</head>\r\n<body>\r\n  <div class=\"studio-app\">\r\n    <!-- ЛЕВАЯ ПАНЕЛЬ: УПРАВЛЕНИЕ И НАСТРОЙКИ -->\r\n    <aside class=\"studio-sidebar\" id=\"studio-sidebar\">\r\n      <div class=\"sidebar-header\">\r\n        <div class=\"header-branding\">\r\n          <span class=\"logo-emoji\">🎨</span>\r\n          <div>\r\n            <h1>Paqa Studio</h1>\r\n            <span class=\"tagline\">Песочница тем РАНХиГС LMS</span>\r\n          </div>\r\n        </div>\r\n        <button type=\"button\" id=\"btn-close-studio-sidebar\" class=\"btn-studio-close-header\" title=\"Закрыть песочницу\">\r\n          <i class=\"fa fa-times\"></i>\r\n        </button>\r\n      </div>\r\n\r\n      <!-- Мобильный переключатель вкладок (для смартфонов и планшетов) -->\r\n      <div class=\"studio-mobile-nav\" id=\"studio-mobile-nav\">\r\n        <button type=\"button\" class=\"studio-mobile-tab-btn active\" id=\"tab-btn-settings\" data-tab=\"settings\">\r\n          <i class=\"fa fa-sliders\"></i> Настройки\r\n        </button>\r\n        <button type=\"button\" class=\"studio-mobile-tab-btn\" id=\"tab-btn-preview\" data-tab=\"preview\">\r\n          <i class=\"fa fa-eye\"></i> Предпросмотр\r\n        </button>\r\n      </div>\r\n\r\n      <!-- Главная кнопка сохранения -->\r\n      <div class=\"save-bar\">\r\n        <button id=\"btn-save-theme\" class=\"btn-primary-save\">\r\n          <i class=\"fa fa-floppy-o\"></i> Сохранить и применить\r\n        </button>\r\n        <div class=\"save-status\" id=\"save-status\">Все изменения применены</div>\r\n      </div>\r\n\r\n      <!-- Прокручиваемый список настроек -->\r\n      <div class=\"sidebar-content\">\r\n        <!-- Палитры / Пресеты -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-paint-brush\"></i> Готовые палитры</h2>\r\n          <div class=\"presets-grid\">\r\n            <button class=\"preset-pill\" data-preset=\"purple\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #1C1B1F, #D0BCFF);\"></span>\r\n              Purple\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"blue\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #191C20, #9DCAFC);\"></span>\r\n              Blue\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"teal\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #191C1C, #4FD9D9);\"></span>\r\n              Teal\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"green\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #191D16, #90D894);\"></span>\r\n              Green\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"orange\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #201B16, #FFB871);\"></span>\r\n              Orange\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"pink\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #201A1C, #FFB1C9);\"></span>\r\n              Pink\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"red\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #201A18, #FFB3AE);\"></span>\r\n              Red\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"mono\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #181818, #C4C4C4);\"></span>\r\n              Mono\r\n            </button>\r\n            <button class=\"preset-pill\" data-preset=\"light\">\r\n              <span class=\"preset-dot\" style=\"background: linear-gradient(135deg, #FFFBFE, #6750A4);\"></span>\r\n              Light M3\r\n            </button>\r\n          </div>\r\n\r\n          <div style=\"display: flex; gap: 8px; margin-top: 12px;\">\r\n            <button type=\"button\" class=\"tool-sub-btn\" id=\"btn-save-as-preset\" style=\"flex: 1; font-size: 11px; padding: 6px 8px;\">\r\n              <i class=\"fa fa-bookmark-o\"></i> Сохранить пресет\r\n            </button>\r\n            <button type=\"button\" class=\"tool-sub-btn\" id=\"btn-export-theme\" title=\"Экспорт темы в JSON\" style=\"padding: 6px 10px; font-size: 11px;\">\r\n              <i class=\"fa fa-share-alt\"></i> Экспорт\r\n            </button>\r\n            <button type=\"button\" class=\"tool-sub-btn\" id=\"btn-import-theme\" title=\"Импорт темы из JSON\" style=\"padding: 6px 10px; font-size: 11px;\">\r\n              <i class=\"fa fa-download\"></i> Импорт\r\n            </button>\r\n          </div>\r\n          <div id=\"user-presets-container\" style=\"display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;\"></div>\r\n        </section>\r\n\r\n        <!-- Цвета -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-sliders\"></i> Цвета темы</h2>\r\n          \r\n          <div class=\"control-row\">\r\n            <label for=\"color-bg\">Цвет фона страницы</label>\r\n            <div class=\"color-picker-box\">\r\n              <input type=\"color\" id=\"color-bg\" value=\"#1C1B1F\">\r\n              <span class=\"color-hex\" id=\"hex-bg\">#1C1B1F</span>\r\n            </div>\r\n          </div>\r\n\r\n          <div class=\"control-row\">\r\n            <label for=\"color-card\">Цвет карточек</label>\r\n            <div class=\"color-picker-box\">\r\n              <input type=\"color\" id=\"color-card\" value=\"#2B2930\">\r\n              <span class=\"color-hex\" id=\"hex-card\">#2B2930</span>\r\n            </div>\r\n          </div>\r\n\r\n          <div class=\"control-row\">\r\n            <label for=\"color-accent\">Акцентный цвет</label>\r\n            <div class=\"color-picker-box\">\r\n              <input type=\"color\" id=\"color-accent\" value=\"#D0BCFF\">\r\n              <span class=\"color-hex\" id=\"hex-accent\">#D0BCFF</span>\r\n            </div>\r\n          </div>\r\n\r\n          <div class=\"control-row\">\r\n            <label for=\"color-accent-container\">Цвет плашек / кнопок</label>\r\n            <div class=\"color-picker-box\">\r\n              <input type=\"color\" id=\"color-accent-container\" value=\"#4F378B\">\r\n              <span class=\"color-hex\" id=\"hex-accent-container\">#4F378B</span>\r\n            </div>\r\n          </div>\r\n\r\n          <div class=\"control-row\">\r\n            <label for=\"color-text\">Цвет текста</label>\r\n            <div class=\"color-picker-box\">\r\n              <input type=\"color\" id=\"color-text\" value=\"#E6E1E5\">\r\n              <span class=\"color-hex\" id=\"hex-text\">#E6E1E5</span>\r\n            </div>\r\n          </div>\r\n        </section>\r\n\r\n        <!-- Геометрия и стиль -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-cube\"></i> Геометрия и эффекты</h2>\r\n          \r\n          <div class=\"range-control\">\r\n            <div class=\"range-header\">\r\n              <span>Скругление карточек</span>\r\n              <span class=\"range-val\" id=\"val-radius\">20px</span>\r\n            </div>\r\n            <input type=\"range\" id=\"range-radius\" min=\"0\" max=\"36\" value=\"20\">\r\n          </div>\r\n\r\n          <div class=\"range-control\">\r\n            <div class=\"range-header\">\r\n              <span>Форма кнопок</span>\r\n              <span class=\"range-val\" id=\"val-btn-radius\">24px</span>\r\n            </div>\r\n            <input type=\"range\" id=\"range-btn-radius\" min=\"0\" max=\"32\" value=\"24\">\r\n          </div>\r\n\r\n          <div class=\"range-control\">\r\n            <div class=\"range-header\">\r\n              <span>Непрозрачность карточек</span>\r\n              <span class=\"range-val\" id=\"val-opacity\">95%</span>\r\n            </div>\r\n            <input type=\"range\" id=\"range-opacity\" min=\"30\" max=\"100\" value=\"95\">\r\n          </div>\r\n\r\n          <div class=\"range-control\">\r\n            <div class=\"range-header\">\r\n              <span>Размытие фона (Glassmorphism)</span>\r\n              <span class=\"range-val\" id=\"val-blur\">0px</span>\r\n            </div>\r\n            <input type=\"range\" id=\"range-blur\" min=\"0\" max=\"30\" value=\"0\">\r\n          </div>\r\n\r\n          <div class=\"range-control\">\r\n            <div class=\"range-header\">\r\n              <span>Толщина границы</span>\r\n              <span class=\"range-val\" id=\"val-border-width\">1px</span>\r\n            </div>\r\n            <input type=\"range\" id=\"range-border-width\" min=\"0\" max=\"4\" value=\"1\">\r\n          </div>\r\n        </section>\r\n\r\n        <!-- Шрифт и оформление -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-font\"></i> Шрифт и оформление</h2>\r\n          \r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-font\">Основной шрифт</label>\r\n            <select id=\"select-font\" class=\"styled-select\">\r\n              <option value=\"'Nunito', sans-serif\">Nunito (Фирменный PWA)</option>\r\n              <option value=\"'Inter', sans-serif\">Inter</option>\r\n              <option value=\"'Manrope', sans-serif\">Manrope (РАНХиГС)</option>\r\n              <option value=\"'JetBrains Mono', monospace\">JetBrains Mono</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"range-control\">\r\n            <div class=\"range-header\">\r\n              <span>Размер шрифта интерфейса</span>\r\n              <span class=\"range-val\" id=\"val-font-size\">14px</span>\r\n            </div>\r\n            <input type=\"range\" id=\"range-font-size\" min=\"12\" max=\"20\" value=\"14\">\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-shadow\">Стиль теней</label>\r\n            <select id=\"select-shadow\" class=\"styled-select\">\r\n              <option value=\"soft\">Мягкие тени MD3 (по умолчанию)</option>\r\n              <option value=\"none\">Без теней (Flat / плоский)</option>\r\n              <option value=\"deep\">Глубокие 3D-тени</option>\r\n              <option value=\"neon\">Неоновое свечение (Accent Glow)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-density\">Плотность карточек</label>\r\n            <select id=\"select-density\" class=\"styled-select\">\r\n              <option value=\"default\">Стандартная</option>\r\n              <option value=\"compact\">Компактная (меньше отступов)</option>\r\n              <option value=\"spacious\">Просторная (большие отступы)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-cover-style\">Стиль обложек курсов</label>\r\n            <select id=\"select-cover-style\" class=\"styled-select\">\r\n              <option value=\"gradient\">Яркие градиенты (по умолчанию)</option>\r\n              <option value=\"pastel\">Мягкая пастель</option>\r\n              <option value=\"neon\">Неоновый киберпанк</option>\r\n              <option value=\"mono\">Минималистичный монохром</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"input-bg-image\">Фоновые обои (картинка)</label>\r\n            <div style=\"display: flex; gap: 8px;\">\r\n              <input type=\"text\" id=\"input-bg-image\" class=\"styled-input\" placeholder=\"https://... или выберите с ПК\" style=\"flex: 1;\">\r\n              <button type=\"button\" class=\"tool-sub-btn\" id=\"btn-upload-bg-file\" title=\"Загрузить картинку с компьютера\" style=\"white-space: nowrap; padding: 0 10px; font-size: 12px;\">\r\n                <i class=\"fa fa-folder-open-o\"></i> С ПК\r\n              </button>\r\n              <button type=\"button\" class=\"tool-sub-btn danger\" id=\"btn-clear-bg-image\" title=\"Удалить обои\" style=\"padding: 0 8px; font-size: 12px;\">\r\n                <i class=\"fa fa-trash-o\"></i>\r\n              </button>\r\n            </div>\r\n            <input type=\"file\" id=\"file-bg-image\" accept=\"image/*\" style=\"display: none;\">\r\n          </div>\r\n\r\n          <div class=\"control-row\">\r\n            <label for=\"range-bg-dim\">Затемнение обоев</label>\r\n            <div class=\"range-control\">\r\n              <input type=\"range\" id=\"range-bg-dim\" min=\"0\" max=\"90\" step=\"5\" value=\"0\">\r\n              <span class=\"range-val\" id=\"val-bg-dim\">0%</span>\r\n            </div>\r\n          </div>\r\n\r\n          <div class=\"control-row\">\r\n            <label for=\"range-bg-blur\">Размытие обоев</label>\r\n            <div class=\"range-control\">\r\n              <input type=\"range\" id=\"range-bg-blur\" min=\"0\" max=\"20\" step=\"1\" value=\"0\">\r\n              <span class=\"range-val\" id=\"val-bg-blur\">0px</span>\r\n            </div>\r\n          </div>\r\n\r\n          <div class=\"toggle-control-row\">\r\n            <span>Пленочный шум (Grain overlay)</span>\r\n            <label class=\"studio-switch\">\r\n              <input type=\"checkbox\" id=\"toggle-bg-grain\">\r\n              <span class=\"studio-slider\"></span>\r\n            </label>\r\n          </div>\r\n        </section>\r\n\r\n        <!-- Прогресс и индикаторы -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-tasks\"></i> Прогресс и индикаторы</h2>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-progress-color-mode\">Цветовая схема шкалы</label>\r\n            <select id=\"select-progress-color-mode\" class=\"styled-select\">\r\n              <option value=\"accent\" selected>Цвет акцента темы</option>\r\n              <option value=\"smart\">Умный цвет (0-25-60-100%)</option>\r\n              <option value=\"gradient\">Радужный перелив (Градиент)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-progress-height\">Толщина шкалы прогресса</label>\r\n            <select id=\"select-progress-height\" class=\"styled-select\">\r\n              <option value=\"slim\">Тонкая полоса (4px)</option>\r\n              <option value=\"normal\" selected>Стандартная (8px)</option>\r\n              <option value=\"thick\">Крупная выразительная (14px)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-progress-style\">Визуальный эффект</label>\r\n            <select id=\"select-progress-style\" class=\"styled-select\">\r\n              <option value=\"flat\" selected>Классический плоский</option>\r\n              <option value=\"glow\">Неоновое свечение (Glow)</option>\r\n              <option value=\"striped\">Полосатый паттерн (Striped)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-progress-badge\">Стиль процентов</label>\r\n            <select id=\"select-progress-badge\" class=\"styled-select\">\r\n              <option value=\"text\" selected>Текст (\"Прогресс: 75%\")</option>\r\n              <option value=\"pill\">Компактная таблетка (Бейдж)</option>\r\n              <option value=\"hidden\">Скрыть надпись (Только полоса)</option>\r\n            </select>\r\n          </div>\r\n        </section>\r\n\r\n        <!-- Шапка и навигация -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-bars\"></i> Шапка и навигация</h2>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-navbar-style\">Стиль шапки (Navbar)</label>\r\n            <select id=\"select-navbar-style\" class=\"styled-select\">\r\n              <option value=\"full\" selected>Классическая во всю ширину</option>\r\n              <option value=\"floating\">Островная плавающая (Floating Island)</option>\r\n              <option value=\"glass\">Ультра-стекло (Glassmorphism)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-avatar-shape\">Форма аватара</label>\r\n            <select id=\"select-avatar-shape\" class=\"styled-select\">\r\n              <option value=\"circle\" selected>Круглая (Circle 50%)</option>\r\n              <option value=\"rounded\">Мягкий сквиркл (Squircle)</option>\r\n              <option value=\"square\">Строгий квадрат (Square)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-navbar-height\">Высота шапки</label>\r\n            <select id=\"select-navbar-height\" class=\"styled-select\">\r\n              <option value=\"compact\">Компактная (48px)</option>\r\n              <option value=\"normal\" selected>Стандартная (60px)</option>\r\n              <option value=\"tall\">Просторная (72px)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"toggle-control-row\">\r\n            <span>Минималистичная шапка (чистый вид)</span>\r\n            <label class=\"studio-switch\">\r\n              <input type=\"checkbox\" id=\"toggle-navbar-clean\">\r\n              <span class=\"studio-slider\"></span>\r\n            </label>\r\n          </div>\r\n        </section>\r\n\r\n        <!-- Анимации и эффекты -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-bolt\"></i> Анимации и физика</h2>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-card-hover-effect\">Эффект при наведении на карточки</label>\r\n            <select id=\"select-card-hover-effect\" class=\"styled-select\">\r\n              <option value=\"lift\" selected>Плавный подъем (Lift up)</option>\r\n              <option value=\"glow\">Неоновый ореол (Accent Glow)</option>\r\n              <option value=\"tilt\">3D-наклон (Perspective Tilt)</option>\r\n              <option value=\"none\">Без эффекта (Статичный)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"control-row stacked\">\r\n            <label for=\"select-anim-speed\">Скорость переходов</label>\r\n            <select id=\"select-anim-speed\" class=\"styled-select\">\r\n              <option value=\"smooth\" selected>Плавная кинетика (0.35s)</option>\r\n              <option value=\"snappy\">Быстрый отклик (0.15s)</option>\r\n              <option value=\"instant\">Мгновенно (0s / для слабых ПК)</option>\r\n            </select>\r\n          </div>\r\n\r\n          <div class=\"toggle-control-row\">\r\n            <span>Упругий клик по кнопкам (Scale Press)</span>\r\n            <label class=\"studio-switch\">\r\n              <input type=\"checkbox\" id=\"toggle-button-press\" checked>\r\n              <span class=\"studio-slider\"></span>\r\n            </label>\r\n          </div>\r\n        </section>\r\n\r\n        <!-- Опции интерфейса -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-toggle-on\"></i> Опции интерфейса</h2>\r\n          \r\n          <div class=\"toggle-control-row\">\r\n            <span>Скрыть футер сайта</span>\r\n            <label class=\"studio-switch\">\r\n              <input type=\"checkbox\" id=\"toggle-hide-footer\" checked>\r\n              <span class=\"studio-slider\"></span>\r\n            </label>\r\n          </div>\r\n\r\n          <div class=\"toggle-control-row\">\r\n            <span>Компактный режим</span>\r\n            <label class=\"studio-switch\">\r\n              <input type=\"checkbox\" id=\"toggle-compact\">\r\n              <span class=\"studio-slider\"></span>\r\n            </label>\r\n          </div>\r\n        </section>\r\n\r\n        <!-- Интерактивные инструменты -->\r\n        <section class=\"control-section\">\r\n          <h2 class=\"section-heading\"><i class=\"fa fa-magic\"></i> Интерактивный редактор</h2>\r\n          <p class=\"section-hint\">Нажмите кнопку и выберите любой элемент на макете справа:</p>\r\n          \r\n          <div class=\"tools-btn-grid\">\r\n            <button class=\"tool-action-btn\" id=\"tool-eraser\">\r\n              <i class=\"fa fa-eraser\"></i> 👻 Ластик (скрыть)\r\n            </button>\r\n            <button class=\"tool-action-btn\" id=\"tool-move\">\r\n              <i class=\"fa fa-arrows\"></i> ✋ Передвинуть\r\n            </button>\r\n          </div>\r\n\r\n          <div class=\"tools-sub-row\">\r\n            <button class=\"tool-sub-btn\" id=\"tool-undo\" title=\"Вернуть последний скрытый элемент\">\r\n              <i class=\"fa fa-undo\"></i> Вернуть\r\n            </button>\r\n            <button class=\"tool-sub-btn danger\" id=\"tool-reset-elements\" title=\"Сбросить все скрытые и перемещенные элементы\">\r\n              <i class=\"fa fa-trash-o\"></i> Сбросить всё\r\n            </button>\r\n          </div>\r\n\r\n          <!-- Управление слоями (Передний / Задний план) для выбранного элемента -->\r\n          <div class=\"element-layer-controls\" id=\"element-layer-controls\" style=\"display: none; margin-top: 12px; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.15)); border-radius: 12px;\">\r\n            <div class=\"layer-control-title\" style=\"font-size: 12px; font-weight: 700; margin-bottom: 4px; color: var(--mc-accent, #D0BCFF);\">\r\n              <i class=\"fa fa-clone\"></i> Порядок слоя (Z-Index):\r\n            </div>\r\n            <div class=\"layer-selected-name\" id=\"layer-selected-name\" style=\"font-size: 11px; margin-bottom: 8px; opacity: 0.85; word-break: break-all;\">\r\n              Элемент: <span id=\"layer-item-name\" style=\"font-weight: 700; color: #fff;\">Поиск</span>\r\n            </div>\r\n            <div class=\"tools-btn-grid\" style=\"grid-template-columns: 1fr 1fr; gap: 8px;\">\r\n              <button class=\"tool-sub-btn\" id=\"tool-layer-front\" title=\"Перенести на самый передний план над всеми боксами\">\r\n                <i class=\"fa fa-level-up\"></i> 🔝 На передний план\r\n              </button>\r\n              <button class=\"tool-sub-btn\" id=\"tool-layer-back\" title=\"Перенести на задний план\">\r\n                <i class=\"fa fa-level-down\"></i> 🔽 На задний план\r\n              </button>\r\n            </div>\r\n            <button class=\"tool-sub-btn\" id=\"tool-reset-selected\" style=\"width: 100%; margin-top: 8px; justify-content: center;\" title=\"Сбросить смещение только этого элемента\">\r\n              <i class=\"fa fa-refresh\"></i> Сбросить этот элемент\r\n            </button>\r\n          </div>\r\n\r\n          <div class=\"active-mode-banner\" id=\"active-mode-banner\" style=\"display: none;\"></div>\r\n        </section>\r\n\r\n        <!-- Быстрые действия -->\r\n        <div class=\"bottom-actions\">\r\n          <button id=\"btn-reset-defaults\" class=\"btn-secondary-action\">\r\n            <i class=\"fa fa-refresh\"></i> Сбросить тему по умолчанию\r\n          </button>\r\n        </div>\r\n      </div>\r\n    </aside>\r\n\r\n    <!-- ПРАВАЯ ОБЛАСТЬ: ИНТЕРАКТИВНОЕ ОКНО-КОПИЯ СДО -->\r\n    <main class=\"studio-preview-pane\">\r\n      <div class=\"preview-viewport-bar\">\r\n        <div class=\"viewport-info\">\r\n          <span class=\"status-dot\"></span>\r\n          <span id=\"preview-viewport-status\">Интерактивный предпросмотр СДО (РАНХиГС LMS)</span>\r\n        </div>\r\n        <div class=\"viewport-views-toggle\" style=\"display: none !important;\">\r\n          <button class=\"viewport-view-tab\" id=\"btn-view-custom\" data-view=\"custom\" style=\"display: none;\">\r\n            <i class=\"fa fa-file-text-o\"></i> <span id=\"label-view-custom\">Текущая страница</span>\r\n          </button>\r\n          <button class=\"viewport-view-tab active\" id=\"btn-view-dashboard\" data-view=\"dashboard\">\r\n            <i class=\"fa fa-th-large\"></i> Дашборд\r\n          </button>\r\n          <button class=\"viewport-view-tab\" id=\"btn-view-course\" data-view=\"course\">\r\n            <i class=\"fa fa-book\"></i> Страница курса\r\n          </button>\r\n        </div>\r\n        <div class=\"viewport-actions\">\r\n          <button type=\"button\" id=\"btn-mobile-back-to-settings\" class=\"btn-viewport-action btn-mobile-back-to-settings\" title=\"Вернуться к настройкам\">\r\n            <i class=\"fa fa-sliders\"></i> Настройки\r\n          </button>\r\n          <button id=\"btn-open-lms\" class=\"btn-viewport-action\" title=\"Открыть реальный сайт СДО\">\r\n            <i class=\"fa fa-external-link\"></i> Открыть lms.ranepa.ru\r\n          </button>\r\n        </div>\r\n      </div>\r\n\r\n      <!-- Внутренняя интерактивная копия страницы Moodle -->\r\n      <div class=\"preview-scroll-container\" id=\"preview-canvas\">\r\n        <div class=\"mc-active preview-moodle-page\" id=\"moodle-mockup\">\r\n          \r\n          <!-- ХЕДЕР / NAVBAR (в точности как в СДО РАНХиГС) -->\r\n          <header class=\"navbar mock-navbar\">\r\n            <div class=\"navbar-left\">\r\n              <a href=\"#\" class=\"navbar-brand mock-brand\" id=\"mock-navbar-brand\" data-moodle-selector=\".navbar-brand, #header .navbar-brand, .mock-brand\" title=\"Логотип РАНХиГС\">\r\n                <div class=\"mock-crest-wrapper\">\r\n                  <img src=\"data:image/png;base64,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\" alt=\"РАНХиГС\" class=\"mock-brand-icon\">\r\n                </div>\r\n              </a>\r\n              <nav class=\"primary-navigation mock-primary-nav\">\r\n                <ul class=\"nav\">\r\n                  <li class=\"nav-item\" data-moodle-selector=\".primary-navigation .nav-item:nth-child(1), .mock-primary-nav .nav-item:nth-child(1)\"><a class=\"nav-link active\" href=\"#\">Онлайн-обучение</a></li>\r\n                  <li class=\"nav-item\" data-moodle-selector=\".primary-navigation .nav-item:nth-child(2), .mock-primary-nav .nav-item:nth-child(2)\"><a class=\"nav-link\" href=\"#\">Все курсы</a></li>\r\n                  <li class=\"nav-item\" data-moodle-selector=\".primary-navigation .nav-item:nth-child(3), .mock-primary-nav .nav-item:nth-child(3)\"><a class=\"nav-link\" href=\"#\">Обращение в службу технической поддержки</a></li>\r\n                </ul>\r\n              </nav>\r\n            </div>\r\n\r\n            <div class=\"navbar-right\">\r\n              <div class=\"navbar-nav mock-user-nav\">\r\n                <div class=\"nav-item icon-item mock-nav-messages\" title=\"Сообщения\" data-moodle-selector=\"#nav-message-popover-container, .popover-region-messages, .mock-nav-messages\"><i class=\"fa fa-comment-o\"></i></div>\r\n                <div class=\"nav-item icon-item notification-badge\" title=\"Уведомления\" data-moodle-selector=\"#nav-notification-popover-container, .popover-region-notifications, .notification-badge\">\r\n                  <i class=\"fa fa-bell-o\"></i>\r\n                  <span class=\"badge-count\" id=\"mock-notif-count\">5</span>\r\n                </div>\r\n                <div class=\"nav-item user-item mock-nav-profile\" title=\"Профиль\" data-moodle-selector=\"#usernavigation .usermenu, .usermenu, .userbutton, .userpicture, .mock-nav-profile\">\r\n                  <span class=\"userinitials\" id=\"mock-user-initials\">БЕ</span>\r\n                  <i class=\"fa fa-angle-down mock-user-chevron\"></i>\r\n                </div>\r\n              </div>\r\n            </div>\r\n          </header>\r\n\r\n          <!-- 1. ОСНОВНОЙ КОНТЕНТ ДАШБОРДА -->\r\n          <div class=\"mock-page-content\" id=\"mock-view-dashboard\">\r\n            <div class=\"mock-container\">\r\n              \r\n              <div class=\"mock-page-header\">\r\n                <h1 class=\"mock-page-title\" data-moodle-selector=\"#page-header h1, .page-header-headings h1, .page-title\">Онлайн-обучение</h1>\r\n              </div>\r\n\r\n              <!-- Блок Дашборда -->\r\n              <section class=\"block_mydashboard mock-dashboard-card\">\r\n                <div class=\"dashboard-card-header\">\r\n                  <h2 class=\"dashboard-heading\" data-moodle-selector=\".dashboard-heading, .block_myoverview h5, .block_myoverview .block-title, .block_mydashboard h5, .block_mydashboard .card-title\">Дашборд</h2>\r\n                  \r\n                  <!-- Фильтры курсов -->\r\n                  <div class=\"dashboard-filters\" data-moodle-selector=\".dashboard-filters\">\r\n                    <button class=\"filter-pill active\" data-filter-id=\"all\" data-moodle-selector='[data-filter-id=\"all\"]'>Все</button>\r\n                    <button class=\"filter-pill dropdown-pill\" data-filter-id=\"year\" data-moodle-selector='[data-filter-id=\"year\"]'>Учебный год <i class=\"fa fa-angle-down\"></i></button>\r\n                    <button class=\"filter-pill\" data-filter-id=\"inprogress\" data-moodle-selector='[data-filter-id=\"inprogress\"]'>Текущие</button>\r\n                    <button class=\"filter-pill\" data-filter-id=\"past\" data-moodle-selector='[data-filter-id=\"past\"]'>Прошедшие</button>\r\n                    <button class=\"filter-pill\" data-filter-id=\"future\" data-moodle-selector='[data-filter-id=\"future\"]'>Предстоящие</button>\r\n                    <button class=\"filter-pill\" data-filter-id=\"favourites\" data-moodle-selector='[data-filter-id=\"favourites\"]'>Избранные</button>\r\n                  </div>\r\n\r\n                  <!-- Поиск и сортировка -->\r\n                  <div class=\"dashboard-search-row\">\r\n                    <div class=\"search-box\" data-moodle-selector=\".block_myoverview .input-group, .block_mydashboard .input-group, [data-region='courses-view'] .input-group, .search-widget, div.search-input, [data-region='search-input'], .simplesearchform, .search-box\">\r\n                      <input type=\"text\" placeholder=\"Поиск курса\" class=\"search-input\">\r\n                      <button class=\"search-btn\">Поиск</button>\r\n                    </div>\r\n                    <div class=\"sort-view-box\" data-moodle-selector=\"[data-region='sorting-selector'], [data-region='display-selector'], [data-action='set-display-mode'], .sort-view-box\">\r\n                      <span class=\"sort-label\">Сортировать по:</span>\r\n                      <button class=\"sort-dropdown\">Название курса <i class=\"fa fa-angle-down\"></i></button>\r\n                      <span class=\"view-label\">Вид:</span>\r\n                      <div class=\"view-toggles\">\r\n                        <button class=\"view-btn active\" title=\"Сетка\"><i class=\"fa fa-th-large\"></i></button>\r\n                        <button class=\"view-btn\" title=\"Список\"><i class=\"fa fa-bars\"></i></button>\r\n                      </div>\r\n                    </div>\r\n                  </div>\r\n                </div>\r\n\r\n                <!-- Сетка карточек курсов (динамически формируется из аккаунта СДО) -->\r\n                <div class=\"list-group mock-courses-grid\" id=\"mock-courses-container\"></div>\r\n              </section>\r\n            </div>\r\n          </div>\r\n\r\n          <!-- 2. СТРАНИЦА КУРСА: С ЛЕВОЙ ПАНЕЛЬЮ ОГЛАВЛЕНИЯ И КРАСИВЫМИ МАТЕРИАЛАМИ -->\r\n          <div class=\"mock-page-content mock-course-view\" id=\"mock-view-course\" style=\"display: none;\">\r\n            \r\n            <!-- Шапка курса (Hero Card) -->\r\n            <div class=\"mock-course-hero-card\">\r\n              <div class=\"mock-breadcrumbs\">\r\n                <span>Онлайн-обучение</span>\r\n                <i class=\"fa fa-angle-right\"></i>\r\n                <span>Мои курсы</span>\r\n                <i class=\"fa fa-angle-right\"></i>\r\n                <span class=\"breadcrumb-current\" id=\"mock-breadcrumb-title\">Учебный курс</span>\r\n              </div>\r\n\r\n              <div class=\"mock-course-title-row\">\r\n                <div class=\"mock-course-title-group\">\r\n                  <h1 class=\"mock-course-title\" id=\"mock-course-title\">Администрирование сетевых операционных систем</h1>\r\n                </div>\r\n                <div class=\"mock-course-progress-badge\" id=\"mock-course-progress-badge\">\r\n                  <div class=\"course-prog-text\">Прогресс курса: <strong id=\"mock-course-prog-val\">30%</strong></div>\r\n                  <div class=\"progress\">\r\n                    <div class=\"progress-bar\" id=\"mock-course-prog-bar\" style=\"width: 30%;\"></div>\r\n                  </div>\r\n                </div>\r\n              </div>\r\n\r\n              <!-- Вторичная навигация (вкладки курса) -->\r\n              <div class=\"secondary-navigation mock-secondary-nav\">\r\n                <nav class=\"moremenu navigation\">\r\n                  <ul class=\"nav more-nav nav-tabs\">\r\n                    <li class=\"nav-item\"><a class=\"nav-link active\" href=\"#\"><i class=\"fa fa-book\"></i> Курс</a></li>\r\n                    <li class=\"nav-item\"><a class=\"nav-link\" href=\"#\"><i class=\"fa fa-bar-chart\"></i> Оценки</a></li>\r\n                  </ul>\r\n                </nav>\r\n              </div>\r\n            </div>\r\n\r\n            <!-- Двухколоночный лейаут курса -->\r\n            <div class=\"mock-course-body-grid\">\r\n              \r\n              <!-- ЛЕВАЯ ПАНЕЛЬ: Оглавление курса (Course Index) -->\r\n              <aside class=\"mock-course-index-panel\" id=\"mock-course-index-panel\">\r\n                <div class=\"course-index-header\">\r\n                  <div class=\"course-index-title\">\r\n                    <i class=\"fa fa-list-ul\"></i>\r\n                    <span>Оглавление курса</span>\r\n                  </div>\r\n                </div>\r\n                <div class=\"course-index-list\" id=\"mock-course-index-list\">\r\n                  <!-- Заполняется динамически оглавлением курса -->\r\n                </div>\r\n              </aside>\r\n\r\n              <!-- ПРАВАЯ ЧАСТЬ: Разделы и материалы курса -->\r\n              <main class=\"mock-course-main-content\">\r\n                <div class=\"mock-course-content-list\" id=\"mock-course-sections-container\">\r\n                  <!-- Карточки разделов с материалами курса -->\r\n                </div>\r\n              </main>\r\n\r\n            </div>\r\n\r\n          </div>\r\n\r\n          <!-- 3. ТЕКУЩАЯ ЖИВАЯ СТРАНИЦА СДО -->\r\n          <div class=\"mock-page-content mock-custom-view\" id=\"mock-view-custom\" style=\"display: none;\">\r\n            <div class=\"mock-container\" id=\"mock-custom-content\">\r\n              <!-- Сюда динамически монтируется живая страница -->\r\n            </div>\r\n          </div>\r\n\r\n          <!-- ФУТЕР САЙТА Moodle -->\r\n          <footer class=\"mock-page-footer\" id=\"mock-page-footer\">\r\n            <div class=\"mock-footer-inner\">\r\n              <div class=\"mock-footer-links\">\r\n                <a href=\"#\" class=\"mock-footer-link\">Справка по СДО</a>\r\n                <a href=\"#\" class=\"mock-footer-link\">Политика конфиденциальности</a>\r\n                <a href=\"#\" class=\"mock-footer-link mc-support-link-footer\">Служба технической поддержки РАНХиГС</a>\r\n              </div>\r\n              <div class=\"mock-footer-copy\">© 2026 РАНХиГС • Система дистанционного обучения</div>\r\n            </div>\r\n          </footer>\r\n\r\n        </div>\r\n      </div>\r\n    </main>\r\n  </div>\r\n\r\n  <!-- Модальное окно персональной настройки конкретного курса -->\r\n  <div class=\"studio-modal-backdrop\" id=\"modal-course-customizer\" style=\"display: none;\">\r\n    <div class=\"studio-modal-card\">\r\n      <div class=\"studio-modal-header\">\r\n        <div class=\"studio-modal-title\">\r\n          <i class=\"fa fa-sliders\"></i> Настройка курса\r\n        </div>\r\n        <button class=\"studio-modal-close\" id=\"btn-close-course-modal\">&times;</button>\r\n      </div>\r\n\r\n      <div class=\"studio-modal-body\">\r\n        <div class=\"modal-course-orig-title\" id=\"modal-course-orig-name\" style=\"font-size: 13px; font-weight: 700; color: var(--mc-text-muted, #aaa); margin-bottom: 14px; padding: 8px 12px; background: rgba(255,255,255,0.04); border-radius: 10px;\">\r\n          Название курса\r\n        </div>\r\n\r\n        <div class=\"control-row stacked\" style=\"margin-bottom: 14px;\">\r\n          <label for=\"input-custom-course-title\">Своё / Короткое название:</label>\r\n          <input type=\"text\" id=\"input-custom-course-title\" class=\"styled-input\" placeholder=\"Например: Информатика, Матан\">\r\n        </div>\r\n\r\n        <div class=\"control-row stacked\" style=\"margin-bottom: 14px;\">\r\n          <label for=\"input-custom-course-cover\">Картинка на обложку:</label>\r\n          <div style=\"display: flex; gap: 8px;\">\r\n            <input type=\"text\" id=\"input-custom-course-cover\" class=\"styled-input\" placeholder=\"https://... или выберите с ПК\" style=\"flex: 1;\">\r\n            <button type=\"button\" class=\"tool-sub-btn\" id=\"btn-upload-course-cover\" title=\"Загрузить с ПК\" style=\"white-space: nowrap; padding: 0 10px; font-size: 12px;\">\r\n              <i class=\"fa fa-folder-open-o\"></i> С ПК\r\n            </button>\r\n            <button type=\"button\" class=\"tool-sub-btn danger\" id=\"btn-clear-course-cover\" title=\"Удалить обложку\" style=\"padding: 0 8px; font-size: 12px;\">\r\n              <i class=\"fa fa-trash-o\"></i>\r\n            </button>\r\n          </div>\r\n          <input type=\"file\" id=\"file-custom-course-cover\" accept=\"image/*\" style=\"display: none;\">\r\n          <div class=\"cover-preview-box\" id=\"modal-cover-preview\" style=\"display: none; width: 100%; height: 70px; border-radius: 8px; margin-top: 8px; background-size: cover; background-position: center;\"></div>\r\n        </div>\r\n\r\n        <div class=\"toggle-control-row\" style=\"margin-bottom: 18px;\">\r\n          <span>📌 Закрепить вверху (Pin to top)</span>\r\n          <label class=\"studio-switch\">\r\n            <input type=\"checkbox\" id=\"toggle-course-pinned\">\r\n            <span class=\"studio-slider\"></span>\r\n          </label>\r\n        </div>\r\n\r\n        <div class=\"modal-actions-row\" style=\"display: flex; gap: 10px;\">\r\n          <button class=\"btn-primary-save\" id=\"btn-apply-course-custom\" style=\"flex: 1; padding: 10px 16px; font-size: 13px;\">\r\n            ✓ Применить\r\n          </button>\r\n          <button class=\"tool-sub-btn danger\" id=\"btn-reset-course-custom\" style=\"padding: 10px 14px; font-size: 13px;\">\r\n            ↺ Сбросить курс\r\n          </button>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n\r\n  <!-- Модальное окно экспорта / импорта темы -->\r\n  <div class=\"studio-modal-backdrop\" id=\"modal-theme-share\" style=\"display: none;\">\r\n    <div class=\"studio-modal-card\">\r\n      <div class=\"studio-modal-header\">\r\n        <div class=\"studio-modal-title\" id=\"modal-theme-share-title\">\r\n          <i class=\"fa fa-share-alt\"></i> Экспорт / Импорт темы\r\n        </div>\r\n        <button class=\"studio-modal-close\" id=\"btn-close-share-modal\">&times;</button>\r\n      </div>\r\n\r\n      <div class=\"studio-modal-body\">\r\n        <div style=\"font-size: 12px; color: var(--mc-text-muted, #aaa); margin-bottom: 10px;\" id=\"modal-theme-share-desc\">\r\n          Скопируйте этот JSON-код или вставьте код темы от одногруппника, чтобы мгновенно применить стиль:\r\n        </div>\r\n        <textarea id=\"textarea-theme-json\" class=\"styled-input\" rows=\"8\" style=\"width: 100%; font-family: monospace; font-size: 11px; line-height: 1.4; resize: vertical; margin-bottom: 12px;\" placeholder=\"{ &quot;preset&quot;: ... }\"></textarea>\r\n\r\n        <div style=\"display: flex; gap: 10px;\">\r\n          <button class=\"btn-primary-save\" id=\"btn-copy-theme-json\" style=\"flex: 1; padding: 10px; font-size: 13px;\">\r\n            <i class=\"fa fa-copy\"></i> Скопировать код\r\n          </button>\r\n          <button class=\"btn-primary-save\" id=\"btn-apply-imported-theme\" style=\"flex: 1; padding: 10px; font-size: 13px;\">\r\n            <i class=\"fa fa-check\"></i> Применить тему\r\n          </button>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n\r\n  <!-- Всплывающие уведомления (Toast) -->\r\n  <div id=\"studio-toast\" class=\"studio-toast\" style=\"display: none;\"></div>\r\n\r\n  <script>\n/**\r\n * ========================================================\r\n * PAQA THEME STUDIO • LOGIC CONTROLLER (studio-page.js)\r\n * Material Design 3 Sandbox for РАНХиГС LMS Moodle\r\n * Part 3.1: Presets, Theme Engine & Live Preview\r\n * ========================================================\r\n */\r\n\r\n// 1. Все 9 официальных палитр Paqa Moodle\r\nconst PRESETS = {\r\n  purple: {\r\n    accentColor: '#D0BCFF',\r\n    accentContainer: '#4F378B',\r\n    bgColor: '#1C1B1F',\r\n    cardColor: '#2B2930',\r\n    cardOpacity: 95,\r\n    textColor: '#E6E1E5',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  blue: {\r\n    accentColor: '#9DCAFC',\r\n    accentContainer: '#00497D',\r\n    bgColor: '#191C20',\r\n    cardColor: '#272A2F',\r\n    cardOpacity: 95,\r\n    textColor: '#E2E2E6',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  teal: {\r\n    accentColor: '#4FD9D9',\r\n    accentContainer: '#004F50',\r\n    bgColor: '#191C1C',\r\n    cardColor: '#272B2B',\r\n    cardOpacity: 95,\r\n    textColor: '#E0E3E3',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  green: {\r\n    accentColor: '#90D894',\r\n    accentContainer: '#0F5214',\r\n    bgColor: '#191D16',\r\n    cardColor: '#272B24',\r\n    cardOpacity: 95,\r\n    textColor: '#E2E3DD',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  orange: {\r\n    accentColor: '#FFB871',\r\n    accentContainer: '#693C00',\r\n    bgColor: '#201B16',\r\n    cardColor: '#2E2720',\r\n    cardOpacity: 95,\r\n    textColor: '#ECE0D7',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  pink: {\r\n    accentColor: '#FFB1C9',\r\n    accentContainer: '#7E2F49',\r\n    bgColor: '#201A1C',\r\n    cardColor: '#2D2528',\r\n    cardOpacity: 95,\r\n    textColor: '#ECE0E2',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  red: {\r\n    accentColor: '#FFB3AE',\r\n    accentContainer: '#8B2024',\r\n    bgColor: '#201A18',\r\n    cardColor: '#2E2624',\r\n    cardOpacity: 95,\r\n    textColor: '#ECE0DE',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  mono: {\r\n    accentColor: '#C4C4C4',\r\n    accentContainer: '#444444',\r\n    bgColor: '#181818',\r\n    cardColor: '#252525',\r\n    cardOpacity: 95,\r\n    textColor: '#E1E1E1',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  },\r\n  light: {\r\n    accentColor: '#6750A4',\r\n    accentContainer: '#EADDFF',\r\n    bgColor: '#FFFBFE',\r\n    cardColor: '#F3EDF7',\r\n    cardOpacity: 100,\r\n    textColor: '#1C1B1F',\r\n    borderRadius: 20,\r\n    btnRadius: 24,\r\n    fontFamily: \"'Nunito', sans-serif\"\r\n  }\r\n};\r\n\r\nconst DEFAULT_SETTINGS = {\r\n  enabled: true,\r\n  preset: 'purple',\r\n  accentColor: '#D0BCFF',\r\n  accentContainer: '#4F378B',\r\n  bgColor: '#1C1B1F',\r\n  cardColor: '#2B2930',\r\n  cardOpacity: 95,\r\n  textColor: '#E6E1E5',\r\n  borderRadius: 20,\r\n  btnRadius: 24,\r\n  fontFamily: \"'Nunito', sans-serif\",\r\n  bgImage: '',\r\n  hideFooter: true,\r\n  compactMode: false,\r\n  cardBlur: 0,\r\n  borderWidth: 1,\r\n  fontSize: 14,\r\n  shadowStyle: 'soft',\r\n  cardPadding: 'default',\r\n  elementLayers: {},\r\n  coverStyle: 'gradient',\r\n  courseCustomizations: {},\r\n  progressColorMode: 'accent',\r\n  progressHeight: 'normal',\r\n  progressStyle: 'flat',\r\n  progressBadge: 'text',\r\n  navbarStyle: 'full',\r\n  avatarShape: 'circle',\r\n  navbarHeight: 'normal',\r\n  navbarClean: false,\r\n  cardHoverEffect: 'lift',\r\n  animSpeed: 'smooth',\r\n  buttonPress: true,\r\n  bgDim: 0,\r\n  bgBlur: 0,\r\n  bgGrain: false,\r\n  hiddenSelectors: [],\r\n  movedElements: {}\r\n};\r\n\r\nlet currentSettings = { ...DEFAULT_SETTINGS };\r\n\r\n// 2. Вспомогательные функции цвета и контраста\r\nfunction hexToRgba(hex, alphaPercent) {\r\n  if (!hex) return 'rgba(43, 41, 48, 0.95)';\r\n  let c = hex.replace('#', '');\r\n  if (c.length === 3) c = c.split('').map(x => x + x).join('');\r\n  const num = parseInt(c, 16);\r\n  const r = (num >> 16) & 255;\r\n  const g = (num >> 8) & 255;\r\n  const b = num & 255;\r\n  return `rgba(${r}, ${g}, ${b}, ${alphaPercent / 100})`;\r\n}\r\n\r\nfunction getContrastText(hex) {\r\n  if (!hex) return '#381E72';\r\n  let c = hex.replace('#', '');\r\n  if (c.length === 3) c = c.split('').map(x => x + x).join('');\r\n  const num = parseInt(c, 16);\r\n  const r = (num >> 16) & 255;\r\n  const g = (num >> 8) & 255;\r\n  const b = num & 255;\r\n  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;\r\n  return (yiq >= 140) ? '#381E72' : '#FFFFFF';\r\n}\r\n\r\nfunction isColorDark(hex) {\r\n  if (!hex) return true;\r\n  let c = hex.replace('#', '');\r\n  if (c.length === 3) c = c.split('').map(x => x + x).join('');\r\n  const num = parseInt(c, 16);\r\n  const r = (num >> 16) & 255;\r\n  const g = (num >> 8) & 255;\r\n  const b = num & 255;\r\n  const brightness = (r * 299 + g * 587 + b * 114) / 1000;\r\n  return brightness < 128;\r\n}\r\n\r\n// Маппинг селекторов песочницы (Mockup) на реальный DOM Moodle LMS\r\nconst SELECTOR_ALIASES = {\r\n  '.search-box': '.block_myoverview .input-group, .block_mydashboard .input-group, [data-region=\"courses-view\"] .input-group, .search-widget, div.search-input, [data-region=\"search-input\"], .simplesearchform, .search-box',\r\n  '.search-input': '.block_myoverview input, .block_mydashboard input, [data-region=\"courses-view\"] input, input[placeholder*=\"Поиск\"], .search-input',\r\n  '.search-btn': '.block_myoverview button[type=\"submit\"], .block_mydashboard button[type=\"submit\"], [data-action=\"search\"], .search-btn',\r\n  '.sort-view-box': '[data-region=\"sorting-selector\"], [data-region=\"display-selector\"], [data-action=\"set-display-mode\"], .sort-view-box',\r\n  '.sort-dropdown': '[data-region=\"sorting-selector\"] button, [data-region=\"sorting-selector\"] .dropdown-toggle, .sort-dropdown',\r\n  '.view-toggles': '[data-region=\"display-selector\"], [data-action=\"set-display-mode\"], .view-toggles',\r\n  '.dashboard-filters': '[data-region=\"filter\"], [data-region=\"filter-tabs\"], .dashboard-filters',\r\n  '[data-filter-id=\"all\"]': '[data-region=\"filter\"] [data-value=\"all\"], [data-value=\"all\"], .filter-pill[data-filter-id=\"all\"]',\r\n  '[data-filter-id=\"year\"]': '[data-region=\"filter\"] .dropdown-toggle, .filter-pill[data-filter-id=\"year\"]',\r\n  '[data-filter-id=\"inprogress\"]': '[data-region=\"filter\"] [data-value=\"inprogress\"], [data-value=\"inprogress\"], .filter-pill[data-filter-id=\"inprogress\"]',\r\n  '[data-filter-id=\"past\"]': '[data-region=\"filter\"] [data-value=\"past\"], [data-value=\"past\"], .filter-pill[data-filter-id=\"past\"]',\r\n  '[data-filter-id=\"future\"]': '[data-region=\"filter\"] [data-value=\"future\"], [data-value=\"future\"], .filter-pill[data-filter-id=\"future\"]',\r\n  '[data-filter-id=\"favourites\"]': '[data-region=\"filter\"] [data-value=\"favourites\"], [data-value=\"favourites\"], .filter-pill[data-filter-id=\"favourites\"]',\r\n  '.filter-pill': '[data-region=\"filter\"] button, [data-region=\"filter\"] .nav-link, [data-region=\"filter\"] .dropdown-toggle, [data-region=\"filter\"] a, .filter-pill',\r\n  '.dashboard-heading': '.dashboard-heading, .block_myoverview h5, .block_myoverview .block-title, .block_mydashboard h5, .block_mydashboard .card-title',\r\n  '.mock-page-title': '#page-header h1, .page-header-headings h1, .page-title, .mock-page-title',\r\n  '.mock-navbar': 'nav.navbar, #header, .navbar, .fixed-top, .mock-navbar',\r\n  '.mock-card': '.dashboard-card, .list-group-item.mydashboard-list-item, [data-region=\"course-content\"], .course-summary-card, .mock-card',\r\n  '.mock-page-footer': '#page-footer, footer, .mock-page-footer',\r\n  '.mc-fab-button': '#mc-quick-support-fab, .mc-fab-button',\r\n  '.mock-brand': '.navbar-brand, #header .navbar-brand, .mock-brand',\r\n  '.notification-badge': '#nav-notification-popover-container, .popover-region-notifications, .notification-badge',\r\n  '.mock-nav-messages': '#nav-message-popover-container, .popover-region-messages, .mock-nav-messages',\r\n  '.mock-nav-profile': '#usernavigation .usermenu, .usermenu, .userbutton, .userpicture, .mock-nav-profile'\r\n};\r\n\r\n// 3. Мгновенное применение темы к интерактивному макету СДО\r\nfunction applyThemeToMockup(s) {\r\n  const mockup = document.getElementById('moodle-mockup');\r\n  if (!mockup) return;\r\n\r\n  const isDark = isColorDark(s.bgColor);\r\n  const cardRgba = hexToRgba(s.cardColor, s.cardOpacity);\r\n  const solidCard = (s.cardColor && s.cardColor.length >= 7) ? s.cardColor.slice(0, 7) : (s.cardColor || (isDark ? '#2B2930' : '#FFFFFF'));\r\n  const contrastText = getContrastText(s.accentColor);\r\n  const containerColor = s.accentContainer || hexToRgba(s.accentColor, 35);\r\n  const bgImageRule = s.bgImage && s.bgImage.trim() ? `url(\"${s.bgImage.trim()}\")` : 'none';\r\n\r\n  const shadowMap = {\r\n    none: 'none',\r\n    flat: '0 1px 3px rgba(0, 0, 0, 0.08)',\r\n    soft: '0 6px 18px rgba(0, 0, 0, 0.08)',\r\n    deep: '0 16px 36px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.16)',\r\n    neon: `0 0 20px ${hexToRgba(s.accentColor, 40)}, 0 0 6px ${s.accentColor}`\r\n  };\r\n  const cardShadowVal = shadowMap[s.shadowStyle] || shadowMap.soft;\r\n\r\n  const padMap = {\r\n    compact: '10px 14px',\r\n    spacious: '24px 28px',\r\n    default: '16px 20px'\r\n  };\r\n  const cardPadVal = padMap[s.cardPadding] || padMap.default;\r\n\r\n  // Динамические CSS-переменные\r\n  const vars = {\r\n    '--mc-bg': s.bgColor,\r\n    '--mc-bg-solid': s.bgColor,\r\n    '--mc-bg-card': cardRgba,\r\n    '--mc-card-solid': solidCard,\r\n    '--mc-bg-card-low': isDark ? hexToRgba(s.cardColor, 75) : hexToRgba(s.cardColor, 85),\r\n    '--mc-bg-navbar': hexToRgba(s.bgColor, 96),\r\n    '--mc-bg-drawer': s.cardColor || s.bgColor,\r\n    '--mc-text': s.textColor,\r\n    '--mc-text-muted': hexToRgba(s.textColor, 70),\r\n    '--mc-border': isDark ? hexToRgba(s.textColor, 22) : hexToRgba(s.textColor, 28),\r\n    '--mc-hover-bg': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',\r\n    '--mc-accent': s.accentColor,\r\n    '--mc-accent-container': containerColor,\r\n    '--mc-on-accent-container': getContrastText(containerColor),\r\n    '--mc-accent-contrast': contrastText,\r\n    '--mc-radius': s.borderRadius + 'px',\r\n    '--mc-radius-btn': s.btnRadius + 'px',\r\n    '--mc-font': s.fontFamily,\r\n    '--mc-bg-image': bgImageRule,\r\n    '--mc-outline-variant': isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',\r\n    '--mc-blur': (s.cardBlur || 0) + 'px',\r\n    '--mc-border-width': (s.borderWidth !== undefined ? s.borderWidth : 1) + 'px',\r\n    '--mc-font-size': (s.fontSize || 14) + 'px',\r\n    '--mc-card-shadow': cardShadowVal,\r\n    '--mc-card-padding': cardPadVal,\r\n    '--mc-bg-dim': ((s.bgDim || 0) / 100).toString(),\r\n    '--mc-bg-blur': (s.bgBlur || 0) + 'px'\r\n  };\r\n\r\n  for (const [k, v] of Object.entries(vars)) {\r\n    mockup.style.setProperty(k, v);\r\n  }\r\n\r\n  // Применяем плотность через классы на контейнере макета\r\n  mockup.classList.toggle('mc-density-compact', s.cardPadding === 'compact');\r\n  mockup.classList.toggle('mc-density-spacious', s.cardPadding === 'spacious');\r\n\r\n  // Классы стиля и формы прогресс-баров (Блок 2)\r\n  mockup.classList.remove('mc-progress-slim', 'mc-progress-normal', 'mc-progress-thick');\r\n  mockup.classList.add(`mc-progress-${s.progressHeight || 'normal'}`);\r\n\r\n  mockup.classList.remove('mc-progress-flat', 'mc-progress-glow', 'mc-progress-striped');\r\n  mockup.classList.add(`mc-progress-${s.progressStyle || 'flat'}`);\r\n\r\n  mockup.classList.remove('mc-progress-badge-text', 'mc-progress-badge-pill', 'mc-progress-badge-hidden');\r\n  mockup.classList.add(`mc-progress-badge-${s.progressBadge || 'text'}`);\r\n\r\n  // Классы шапки и навигации (Блок 3)\r\n  mockup.classList.remove('mc-nav-style-full', 'mc-nav-style-floating', 'mc-nav-style-glass');\r\n  mockup.classList.add(`mc-nav-style-${s.navbarStyle || 'full'}`);\r\n\r\n  mockup.classList.remove('mc-avatar-circle', 'mc-avatar-rounded', 'mc-avatar-square');\r\n  mockup.classList.add(`mc-avatar-${s.avatarShape || 'circle'}`);\r\n\r\n  mockup.classList.remove('mc-nav-height-compact', 'mc-nav-height-normal', 'mc-nav-height-tall');\r\n  mockup.classList.add(`mc-nav-height-${s.navbarHeight || 'normal'}`);\r\n\r\n  mockup.classList.toggle('mc-nav-clean', !!s.navbarClean);\r\n\r\n  // Классы анимаций и микро-взаимодействий (Блок 4)\r\n  mockup.classList.remove('mc-hover-lift', 'mc-hover-glow', 'mc-hover-tilt', 'mc-hover-none');\r\n  mockup.classList.add(`mc-hover-${s.cardHoverEffect || 'lift'}`);\r\n\r\n  mockup.classList.remove('mc-anim-smooth', 'mc-anim-snappy', 'mc-anim-instant');\r\n  mockup.classList.add(`mc-anim-${s.animSpeed || 'smooth'}`);\r\n\r\n  mockup.classList.toggle('mc-btn-press', s.buttonPress !== undefined ? s.buttonPress : true);\r\n  mockup.classList.toggle('mc-grain-overlay', !!s.bgGrain);\r\n\r\n  // Применяем размер шрифта, блюр, тени и толщину границ к карточкам курсов\r\n  const fSize = (s.fontSize || 14) + 'px';\r\n  mockup.style.fontSize = fSize;\r\n  mockup.style.setProperty('--mc-font-size', fSize);\r\n  mockup.querySelectorAll('.mock-card, .list-group-item.mydashboard-list-item, .mock-course-card').forEach(card => {\r\n    card.style.fontSize = fSize;\r\n    card.style.boxShadow = cardShadowVal;\r\n    card.style.borderWidth = (s.borderWidth !== undefined ? s.borderWidth : 1) + 'px';\r\n    card.style.padding = ''; // Сбрасываем инлайн padding чтобы работали CSS классы плотности\r\n    card.querySelectorAll('.mc-course-title-main').forEach(t => { t.style.fontSize = `calc(${fSize} * 1.15)`; });\r\n    card.querySelectorAll('.mc-chip').forEach(c => { c.style.fontSize = `calc(${fSize} * 0.85)`; });\r\n    card.querySelectorAll('.mydashboard-progress-string').forEach(p => { p.style.fontSize = `calc(${fSize} * 0.85)`; });\r\n    if (s.cardBlur && s.cardBlur > 0) {\r\n      card.style.backdropFilter = `blur(${s.cardBlur}px)`;\r\n      card.style.webkitBackdropFilter = `blur(${s.cardBlur}px)`;\r\n    } else {\r\n      card.style.backdropFilter = 'none';\r\n      card.style.webkitBackdropFilter = 'none';\r\n    }\r\n  });\r\n\r\n  // Опции футера и компактного режима\r\n  mockup.classList.toggle('mc-hide-footer', !!s.hideFooter);\r\n  mockup.classList.toggle('mc-compact-mode', !!s.compactMode);\r\n\r\n  // Скрытые элементы макета\r\n  const allHidden = s.hiddenSelectors || [];\r\n  mockup.querySelectorAll('[data-studio-hidden=\"true\"]').forEach(el => {\r\n    el.style.display = '';\r\n    delete el.dataset.studioHidden;\r\n  });\r\n\r\n  allHidden.forEach(sel => {\r\n    const querySel = (SELECTOR_ALIASES[sel.trim()] ? `${sel}, ${SELECTOR_ALIASES[sel.trim()]}` : sel);\r\n    try {\r\n      mockup.querySelectorAll(querySel).forEach(el => {\r\n        el.style.display = 'none';\r\n        el.dataset.studioHidden = 'true';\r\n      });\r\n    } catch (e) {\r\n      console.warn(\"Invalid selector:\", sel);\r\n    }\r\n  });\r\n\r\n  // Перемещенные элементы макета и порядок слоев\r\n  mockup.querySelectorAll('[data-studio-moved=\"true\"], [data-studio-layer], [data-studio-hidden=\"true\"]').forEach(el => {\r\n    el.style.removeProperty('transform');\r\n    el.style.removeProperty('position');\r\n    el.style.removeProperty('z-index');\r\n    el.style.removeProperty('display');\r\n    delete el.dataset.studioMoved;\r\n    delete el.dataset.studioLayer;\r\n    delete el.dataset.studioHidden;\r\n  });\r\n\r\n  const layers = s.elementLayers || {};\r\n  for (const [sel, layer] of Object.entries(layers)) {\r\n    const querySel = (SELECTOR_ALIASES[sel.trim()] ? `${sel}, ${SELECTOR_ALIASES[sel.trim()]}` : sel);\r\n    try {\r\n      mockup.querySelectorAll(querySel).forEach(el => {\r\n        el.style.position = 'relative';\r\n        el.style.zIndex = layer === 'front' ? '999999' : '1';\r\n        el.dataset.studioLayer = layer;\r\n        let p = el.parentElement;\r\n        while (p && p !== mockup && p !== document.body) {\r\n          p.style.setProperty('overflow', 'visible', 'important');\r\n          p = p.parentElement;\r\n        }\r\n      });\r\n    } catch (e) {\r\n      console.warn(\"Invalid layer selector:\", sel);\r\n    }\r\n  }\r\n\r\n  const moved = s.movedElements || {};\r\n  for (const [sel, pos] of Object.entries(moved)) {\r\n    const querySel = (SELECTOR_ALIASES[sel.trim()] ? `${sel}, ${SELECTOR_ALIASES[sel.trim()]}` : sel);\r\n    try {\r\n      mockup.querySelectorAll(querySel).forEach(el => {\r\n        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;\r\n        el.style.position = 'relative';\r\n        const isFront = layers[sel] === 'front';\r\n        const isBack = layers[sel] === 'back';\r\n        el.style.zIndex = isFront ? '999999' : (isBack ? '1' : '100');\r\n        el.dataset.studioMoved = 'true';\r\n        if (el.matches && el.matches('h1, h2, h3, h4, h5, h6, .dashboard-heading, .mock-page-title')) {\r\n          el.style.display = 'block';\r\n          el.style.width = 'fit-content';\r\n        } else if (el.matches && el.matches('p, span, a, label, button, .chip, .badge')) {\r\n          el.style.display = 'inline-block';\r\n          el.style.width = 'fit-content';\r\n        }\r\n\r\n        // Устраняем \"коробку\" / обрезку: предки не должны скрывать overflow\r\n        let p = el.parentElement;\r\n        while (p && p !== mockup && p !== document.body) {\r\n          p.style.setProperty('overflow', 'visible', 'important');\r\n          p = p.parentElement;\r\n        }\r\n      });\r\n    } catch (e) {\r\n      console.warn(\"Invalid moved selector:\", sel);\r\n    }\r\n  }\r\n}\r\n\r\n\r\n// ────────────────────────────────────────────────────────\r\n// 4. ЭЛЕМЕНТЫ УПРАВЛЕНИЯ И СВЯЗЬ С ИНТЕРФЕЙСОМ (БЛОК 3.2)\r\n// ────────────────────────────────────────────────────────\r\nconst els = {\r\n  bg: document.getElementById('color-bg'),\r\n  card: document.getElementById('color-card'),\r\n  accent: document.getElementById('color-accent'),\r\n  accentContainer: document.getElementById('color-accent-container'),\r\n  text: document.getElementById('color-text'),\r\n  hexBg: document.getElementById('hex-bg'),\r\n  hexCard: document.getElementById('hex-card'),\r\n  hexAccent: document.getElementById('hex-accent'),\r\n  hexAccentContainer: document.getElementById('hex-accent-container'),\r\n  hexText: document.getElementById('hex-text'),\r\n  radius: document.getElementById('range-radius'),\r\n  btnRadius: document.getElementById('range-btn-radius'),\r\n  opacity: document.getElementById('range-opacity'),\r\n  blur: document.getElementById('range-blur'),\r\n  borderWidth: document.getElementById('range-border-width'),\r\n  fontSize: document.getElementById('range-font-size'),\r\n  valRadius: document.getElementById('val-radius'),\r\n  valBtnRadius: document.getElementById('val-btn-radius'),\r\n  valOpacity: document.getElementById('val-opacity'),\r\n  valBlur: document.getElementById('val-blur'),\r\n  valBorderWidth: document.getElementById('val-border-width'),\r\n  valFontSize: document.getElementById('val-font-size'),\r\n  font: document.getElementById('select-font'),\r\n  shadow: document.getElementById('select-shadow'),\r\n  density: document.getElementById('select-density'),\r\n  coverStyle: document.getElementById('select-cover-style'),\r\n  progressColorMode: document.getElementById('select-progress-color-mode'),\r\n  progressHeight: document.getElementById('select-progress-height'),\r\n  progressStyle: document.getElementById('select-progress-style'),\r\n  progressBadge: document.getElementById('select-progress-badge'),\r\n  navbarStyle: document.getElementById('select-navbar-style'),\r\n  avatarShape: document.getElementById('select-avatar-shape'),\r\n  navbarHeight: document.getElementById('select-navbar-height'),\r\n  navbarClean: document.getElementById('toggle-navbar-clean'),\r\n  cardHoverEffect: document.getElementById('select-card-hover-effect'),\r\n  animSpeed: document.getElementById('select-anim-speed'),\r\n  buttonPress: document.getElementById('toggle-button-press'),\r\n  bgImage: document.getElementById('input-bg-image'),\r\n  bgDim: document.getElementById('range-bg-dim'),\r\n  valBgDim: document.getElementById('val-bg-dim'),\r\n  bgBlur: document.getElementById('range-bg-blur'),\r\n  valBgBlur: document.getElementById('val-bg-blur'),\r\n  bgGrain: document.getElementById('toggle-bg-grain'),\r\n  hideFooter: document.getElementById('toggle-hide-footer'),\r\n  compact: document.getElementById('toggle-compact'),\r\n  saveBtn: document.getElementById('btn-save-theme'),\r\n  saveStatus: document.getElementById('save-status'),\r\n  resetDefaultsBtn: document.getElementById('btn-reset-defaults'),\r\n  presetBtns: document.querySelectorAll('.preset-pill'),\r\n  toast: document.getElementById('studio-toast')\r\n};\r\n\r\n// Отображение всплывающего Toast-уведомления\r\nlet toastTimer = null;\r\nfunction showToast(msg) {\r\n  if (!els.toast) return;\r\n  els.toast.textContent = msg;\r\n  els.toast.style.display = 'flex';\r\n  if (toastTimer) clearTimeout(toastTimer);\r\n  toastTimer = setTimeout(() => {\r\n    els.toast.style.display = 'none';\r\n  }, 2800);\r\n}\r\n\r\nfunction setSaveStatus(state) {\r\n  if (!els.saveStatus) return;\r\n  if (state === 'unsaved') {\r\n    els.saveStatus.textContent = '● Есть несохраненные изменения';\r\n    els.saveStatus.className = 'save-status unsaved';\r\n  } else if (state === 'saved') {\r\n    els.saveStatus.textContent = '✓ Все изменения сохранены и применены';\r\n    els.saveStatus.className = 'save-status saved';\r\n  }\r\n}\r\n\r\n// Синхронизация формы с объектом настроек\r\nfunction updateUIFromSettings(s) {\r\n  if (els.bg) { els.bg.value = s.bgColor; els.hexBg.textContent = s.bgColor; }\r\n  if (els.card) { els.card.value = s.cardColor; els.hexCard.textContent = s.cardColor; }\r\n  if (els.accent) { els.accent.value = s.accentColor; els.hexAccent.textContent = s.accentColor; }\r\n  if (els.accentContainer) {\r\n    const val = s.accentContainer || (PRESETS[s.preset] && PRESETS[s.preset].accentContainer) || '#4F378B';\r\n    els.accentContainer.value = val;\r\n    if (els.hexAccentContainer) els.hexAccentContainer.textContent = val;\r\n  }\r\n  if (els.text) { els.text.value = s.textColor; els.hexText.textContent = s.textColor; }\r\n\r\n  if (els.radius) { els.radius.value = s.borderRadius; els.valRadius.textContent = s.borderRadius + 'px'; }\r\n  if (els.btnRadius) { els.btnRadius.value = s.btnRadius; els.valBtnRadius.textContent = s.btnRadius + 'px'; }\r\n  if (els.opacity) { els.opacity.value = s.cardOpacity; els.valOpacity.textContent = s.cardOpacity + '%'; }\r\n  if (els.blur) { els.blur.value = s.cardBlur || 0; if (els.valBlur) els.valBlur.textContent = (s.cardBlur || 0) + 'px'; }\r\n  if (els.borderWidth) { els.borderWidth.value = s.borderWidth !== undefined ? s.borderWidth : 1; if (els.valBorderWidth) els.valBorderWidth.textContent = (s.borderWidth !== undefined ? s.borderWidth : 1) + 'px'; }\r\n  if (els.fontSize) { els.fontSize.value = s.fontSize || 14; if (els.valFontSize) els.valFontSize.textContent = (s.fontSize || 14) + 'px'; }\r\n\r\n  if (els.font) els.font.value = s.fontFamily;\r\n  if (els.shadow) els.shadow.value = s.shadowStyle || 'soft';\r\n  if (els.density) els.density.value = s.cardPadding || 'default';\r\n  if (els.coverStyle) els.coverStyle.value = s.coverStyle || 'gradient';\r\n  if (els.progressColorMode) els.progressColorMode.value = s.progressColorMode || 'accent';\r\n  if (els.progressHeight) els.progressHeight.value = s.progressHeight || 'normal';\r\n  if (els.progressStyle) els.progressStyle.value = s.progressStyle || 'flat';\r\n  if (els.progressBadge) els.progressBadge.value = s.progressBadge || 'text';\r\n  if (els.navbarStyle) els.navbarStyle.value = s.navbarStyle || 'full';\r\n  if (els.avatarShape) els.avatarShape.value = s.avatarShape || 'circle';\r\n  if (els.navbarHeight) els.navbarHeight.value = s.navbarHeight || 'normal';\r\n  if (els.navbarClean) els.navbarClean.checked = !!s.navbarClean;\r\n  if (els.cardHoverEffect) els.cardHoverEffect.value = s.cardHoverEffect || 'lift';\r\n  if (els.animSpeed) els.animSpeed.value = s.animSpeed || 'smooth';\r\n  if (els.buttonPress) els.buttonPress.checked = s.buttonPress !== undefined ? s.buttonPress : true;\r\n  if (els.bgImage) els.bgImage.value = s.bgImage || '';\r\n  if (els.bgDim) { els.bgDim.value = s.bgDim || 0; if (els.valBgDim) els.valBgDim.textContent = (s.bgDim || 0) + '%'; }\r\n  if (els.bgBlur) { els.bgBlur.value = s.bgBlur || 0; if (els.valBgBlur) els.valBgBlur.textContent = (s.bgBlur || 0) + 'px'; }\r\n  if (els.bgGrain) els.bgGrain.checked = !!s.bgGrain;\r\n  if (els.hideFooter) els.hideFooter.checked = !!s.hideFooter;\r\n  if (els.compact) els.compact.checked = !!s.compactMode;\r\n\r\n  els.presetBtns.forEach(btn => {\r\n    btn.classList.toggle('active', btn.dataset.preset === s.preset);\r\n  });\r\n}\r\n\r\n// Считывание из полей ввода при изменениях\r\nfunction readSettingsFromUI() {\r\n  currentSettings.bgColor = els.bg.value;\r\n  els.hexBg.textContent = els.bg.value;\r\n\r\n  currentSettings.cardColor = els.card.value;\r\n  els.hexCard.textContent = els.card.value;\r\n\r\n  currentSettings.accentColor = els.accent.value;\r\n  els.hexAccent.textContent = els.accent.value;\r\n\r\n  if (els.accentContainer) {\r\n    currentSettings.accentContainer = els.accentContainer.value;\r\n    if (els.hexAccentContainer) els.hexAccentContainer.textContent = els.accentContainer.value;\r\n  }\r\n\r\n  currentSettings.textColor = els.text.value;\r\n  els.hexText.textContent = els.text.value;\r\n\r\n  currentSettings.borderRadius = parseInt(els.radius.value, 10);\r\n  els.valRadius.textContent = currentSettings.borderRadius + 'px';\r\n\r\n  currentSettings.btnRadius = parseInt(els.btnRadius.value, 10);\r\n  els.valBtnRadius.textContent = currentSettings.btnRadius + 'px';\r\n\r\n  currentSettings.cardOpacity = parseInt(els.opacity.value, 10);\r\n  els.valOpacity.textContent = currentSettings.cardOpacity + '%';\r\n\r\n  if (els.blur) {\r\n    currentSettings.cardBlur = parseInt(els.blur.value, 10);\r\n    if (els.valBlur) els.valBlur.textContent = currentSettings.cardBlur + 'px';\r\n  }\r\n  if (els.borderWidth) {\r\n    currentSettings.borderWidth = parseInt(els.borderWidth.value, 10);\r\n    if (els.valBorderWidth) els.valBorderWidth.textContent = currentSettings.borderWidth + 'px';\r\n  }\r\n  if (els.fontSize) {\r\n    currentSettings.fontSize = parseInt(els.fontSize.value, 10);\r\n    if (els.valFontSize) els.valFontSize.textContent = currentSettings.fontSize + 'px';\r\n  }\r\n  if (els.shadow) currentSettings.shadowStyle = els.shadow.value;\r\n  if (els.density) currentSettings.cardPadding = els.density.value;\r\n  if (els.coverStyle) currentSettings.coverStyle = els.coverStyle.value;\r\n  if (els.progressColorMode) currentSettings.progressColorMode = els.progressColorMode.value;\r\n  if (els.progressHeight) currentSettings.progressHeight = els.progressHeight.value;\r\n  if (els.progressStyle) currentSettings.progressStyle = els.progressStyle.value;\r\n  if (els.progressBadge) currentSettings.progressBadge = els.progressBadge.value;\r\n  if (els.navbarStyle) currentSettings.navbarStyle = els.navbarStyle.value;\r\n  if (els.avatarShape) currentSettings.avatarShape = els.avatarShape.value;\r\n  if (els.navbarHeight) currentSettings.navbarHeight = els.navbarHeight.value;\r\n  if (els.navbarClean) currentSettings.navbarClean = els.navbarClean.checked;\r\n  if (els.cardHoverEffect) currentSettings.cardHoverEffect = els.cardHoverEffect.value;\r\n  if (els.animSpeed) currentSettings.animSpeed = els.animSpeed.value;\r\n  if (els.buttonPress) currentSettings.buttonPress = els.buttonPress.checked;\r\n\r\n  currentSettings.fontFamily = els.font.value;\r\n  currentSettings.bgImage = els.bgImage.value.trim();\r\n  if (els.bgDim) {\r\n    currentSettings.bgDim = parseInt(els.bgDim.value, 10);\r\n    if (els.valBgDim) els.valBgDim.textContent = currentSettings.bgDim + '%';\r\n  }\r\n  if (els.bgBlur) {\r\n    currentSettings.bgBlur = parseInt(els.bgBlur.value, 10);\r\n    if (els.valBgBlur) els.valBgBlur.textContent = currentSettings.bgBlur + 'px';\r\n  }\r\n  if (els.bgGrain) currentSettings.bgGrain = els.bgGrain.checked;\r\n  currentSettings.hideFooter = els.hideFooter.checked;\r\n  currentSettings.compactMode = els.compact.checked;\r\n\r\n  currentSettings.preset = 'custom';\r\n  els.presetBtns.forEach(btn => btn.classList.remove('active'));\r\n\r\n  setSaveStatus('unsaved');\r\n  applyThemeToMockup(currentSettings);\r\n  broadcastLiveToMoodle();\r\n}\r\n\r\n// Мгновенная живая трансляция изменений в Moodle и сохранение в storage (Debounce 100ms)\r\nlet liveBroadcastTimer = null;\r\nfunction broadcastLiveToMoodle() {\r\n  if (liveBroadcastTimer) clearTimeout(liveBroadcastTimer);\r\n  liveBroadcastTimer = setTimeout(() => {\r\n    // 1. Немедленно синхронизируем storage, чтобы chrome.storage.onChanged сработал во всех вкладках Moodle\r\n    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {\r\n      chrome.storage.local.set({ mcSettings: currentSettings });\r\n    }\r\n\r\n    // 2. Дополнительно отправляем прямое сообщение APPLY_THEME через chrome.tabs\r\n    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {\r\n      chrome.tabs.query({}, (tabs) => {\r\n        if (!tabs || !tabs.length) return;\r\n        tabs.forEach(tab => {\r\n          chrome.tabs.sendMessage(tab.id, {\r\n            type: 'APPLY_THEME',\r\n            settings: currentSettings\r\n          }).catch(() => {});\r\n        });\r\n      });\r\n    }\r\n  }, 100);\r\n}\r\n\r\n// Применение готового пресета\r\nfunction applyPreset(name) {\r\n  const p = PRESETS[name];\r\n  if (!p) return;\r\n  currentSettings = { ...currentSettings, ...p, preset: name };\r\n  updateUIFromSettings(currentSettings);\r\n  applyThemeToMockup(currentSettings);\r\n  setSaveStatus('unsaved');\r\n  document.querySelectorAll('.user-preset-pill').forEach(pill => pill.classList.remove('active'));\r\n  broadcastLiveToMoodle();\r\n}\r\n\r\n// Сохранение темы и трансляция во все открытые вкладки Moodle\r\nfunction saveThemeToMoodle() {\r\n  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {\r\n    chrome.storage.local.set({ mcSettings: currentSettings }, () => {\r\n      setSaveStatus('saved');\r\n      showToast('✓ Тема сохранена и отправлена во все вкладки Moodle! ✨');\r\n    });\r\n\r\n    // Рассылка прямого сообщения открытым вкладкам Moodle\r\n    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {\r\n      chrome.tabs.query({}, (tabs) => {\r\n        if (!tabs || !tabs.length) return;\r\n        tabs.forEach(tab => {\r\n          chrome.tabs.sendMessage(tab.id, {\r\n            type: 'APPLY_THEME',\r\n            settings: currentSettings\r\n          }).catch(() => {});\r\n        });\r\n      });\r\n    }\r\n  } else {\r\n    try {\r\n      localStorage.setItem('mcSettings', JSON.stringify(currentSettings));\r\n      if (typeof BroadcastChannel !== 'undefined') {\r\n        const bc = new BroadcastChannel('mc_moodle_channel');\r\n        bc.postMessage({ type: 'STORAGE_CHANGED', items: { mcSettings: currentSettings } });\r\n        bc.close();\r\n      }\r\n      if (window.parent && window.parent !== window && typeof window.parent.mcApplyStyles === 'function') {\r\n        window.parent.mcApplyStyles(currentSettings);\r\n      }\r\n    } catch (e) {}\r\n    setSaveStatus('saved');\r\n    showToast('✓ Тема сохранена и применена! ✨');\r\n  }\r\n}\r\n\r\n// ────────────────────────────────────────────────────────\r\n// СЖАТИЕ И ЧТЕНИЕ ЛОКАЛЬНЫХ ФОТО И ИЗОБРАЖЕНИЙ С ПК\r\n// ────────────────────────────────────────────────────────\r\nfunction compressAndReadImage(file, maxWidth, quality, callback) {\r\n  if (!file) return;\r\n  if (!file.type || !file.type.startsWith('image/')) {\r\n    showToast('⚠️ Выбранный файл не является изображением');\r\n    return;\r\n  }\r\n\r\n  const reader = new FileReader();\r\n  reader.onload = (e) => {\r\n    const img = new Image();\r\n    img.onload = () => {\r\n      let width = img.width;\r\n      let height = img.height;\r\n      const maxDim = maxWidth || 1920;\r\n\r\n      if (width > maxDim || height > maxDim) {\r\n        if (width > height) {\r\n          height = Math.round((height * maxDim) / width);\r\n          width = maxDim;\r\n        } else {\r\n          width = Math.round((width * maxDim) / height);\r\n          height = maxDim;\r\n        }\r\n      }\r\n\r\n      const canvas = document.createElement('canvas');\r\n      canvas.width = width;\r\n      canvas.height = height;\r\n      const ctx = canvas.getContext('2d');\r\n      ctx.drawImage(img, 0, 0, width, height);\r\n\r\n      const dataUrl = canvas.toDataURL('image/jpeg', quality || 0.85);\r\n      callback(dataUrl);\r\n    };\r\n    img.onerror = () => {\r\n      showToast('⚠️ Не удалось обработать выбранное изображение');\r\n    };\r\n    img.src = e.target.result;\r\n  };\r\n  reader.onerror = () => {\r\n    showToast('⚠️ Ошибка при чтении файла с ПК');\r\n  };\r\n  reader.readAsDataURL(file);\r\n}\r\n\r\n// ────────────────────────────────────────────────────────\r\n// ПОЛЬЗОВАТЕЛЬСКИЕ ПРЕСЕТЫ (БЛОК 6)\r\n// ────────────────────────────────────────────────────────\r\nlet savedCustomPresets = {};\r\n\r\nfunction loadCustomPresets() {\r\n  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {\r\n    chrome.storage.local.get(['mcCustomPresets'], (data) => {\r\n      savedCustomPresets = (data && data.mcCustomPresets) || {};\r\n      renderCustomPresets();\r\n    });\r\n  } else {\r\n    try {\r\n      const raw = localStorage.getItem('mcCustomPresets');\r\n      savedCustomPresets = raw ? JSON.parse(raw) : {};\r\n    } catch (e) {\r\n      savedCustomPresets = {};\r\n    }\r\n    renderCustomPresets();\r\n  }\r\n}\r\n\r\nfunction saveCustomPresetsToStorage() {\r\n  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {\r\n    chrome.storage.local.set({ mcCustomPresets: savedCustomPresets }, () => {\r\n      renderCustomPresets();\r\n    });\r\n  } else {\r\n    try {\r\n      localStorage.setItem('mcCustomPresets', JSON.stringify(savedCustomPresets));\r\n    } catch (e) {}\r\n    renderCustomPresets();\r\n  }\r\n}\r\n\r\nfunction renderCustomPresets() {\r\n  const container = document.getElementById('user-presets-container');\r\n  if (!container) return;\r\n  container.innerHTML = '';\r\n  const names = Object.keys(savedCustomPresets);\r\n  if (names.length === 0) {\r\n    container.style.display = 'none';\r\n    return;\r\n  }\r\n  container.style.display = 'flex';\r\n\r\n  names.forEach(name => {\r\n    const pill = document.createElement('div');\r\n    pill.className = 'preset-pill user-preset-pill';\r\n    pill.dataset.customPresetName = name;\r\n    pill.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; border: 1px solid var(--mc-outline, rgba(255,255,255,0.15)); background: var(--mc-bg-card-low, rgba(255,255,255,0.05)); color: var(--mc-text, #fff); transition: all 0.2s;';\r\n\r\n    const presetData = savedCustomPresets[name];\r\n    const dotColor = presetData.accentColor || '#D0BCFF';\r\n\r\n    pill.innerHTML = `\r\n      <span style=\"width: 8px; height: 8px; border-radius: 50%; background: ${dotColor}; flex-shrink: 0;\"></span>\r\n      <span style=\"font-weight: 600;\">${escapeHtml(name)}</span>\r\n      <button type=\"button\" class=\"btn-delete-user-preset\" title=\"Удалить пресет\" style=\"background: none; border: none; color: inherit; opacity: 0.5; cursor: pointer; padding: 0 0 0 4px; font-size: 13px; line-height: 1;\">&times;</button>\r\n    `;\r\n\r\n    // Применение пресета по клику\r\n    pill.addEventListener('click', (e) => {\r\n      if (e.target.closest('.btn-delete-user-preset')) return;\r\n      applyCustomPreset(name);\r\n    });\r\n\r\n    // Удаление пресета\r\n    const delBtn = pill.querySelector('.btn-delete-user-preset');\r\n    if (delBtn) {\r\n      delBtn.addEventListener('click', (e) => {\r\n        e.stopPropagation();\r\n        if (confirm(`Удалить пресет «${name}»?`)) {\r\n          delete savedCustomPresets[name];\r\n          saveCustomPresetsToStorage();\r\n          showToast(`🗑️ Пресет «${name}» удален`);\r\n        }\r\n      });\r\n      delBtn.addEventListener('mouseenter', () => { delBtn.style.opacity = '1'; delBtn.style.color = '#ff6b6b'; });\r\n      delBtn.addEventListener('mouseleave', () => { delBtn.style.opacity = '0.5'; delBtn.style.color = 'inherit'; });\r\n    }\r\n\r\n    container.appendChild(pill);\r\n  });\r\n}\r\n\r\nfunction applyCustomPreset(name) {\r\n  const p = savedCustomPresets[name];\r\n  if (!p) return;\r\n  currentSettings = Object.assign({}, currentSettings, p, { preset: 'custom' });\r\n  updateUIFromSettings(currentSettings);\r\n  applyThemeToMockup(currentSettings);\r\n  setSaveStatus('unsaved');\r\n  els.presetBtns.forEach(btn => btn.classList.remove('active'));\r\n  document.querySelectorAll('.user-preset-pill').forEach(pill => {\r\n    pill.classList.toggle('active', pill.dataset.customPresetName === name);\r\n  });\r\n  broadcastLiveToMoodle();\r\n  showToast(`✨ Применен пресет «${name}»`);\r\n}\r\n\r\n// ────────────────────────────────────────────────────────\r\n// ЭКСПОРТ И ИМПОРТ ТЕМЫ (JSON ШЕРИНГ - БЛОК 6)\r\n// ────────────────────────────────────────────────────────\r\nfunction openThemeShareModal(mode) {\r\n  const modal = document.getElementById('modal-theme-share');\r\n  const title = document.getElementById('modal-theme-share-title');\r\n  const desc = document.getElementById('modal-theme-share-desc');\r\n  const textarea = document.getElementById('textarea-theme-json');\r\n  const copyBtn = document.getElementById('btn-copy-theme-json');\r\n  const applyBtn = document.getElementById('btn-apply-imported-theme');\r\n\r\n  if (!modal) return;\r\n\r\n  if (mode === 'export') {\r\n    if (title) title.innerHTML = '<i class=\"fa fa-share-alt\"></i> Экспорт темы';\r\n    if (desc) desc.textContent = 'Скопируйте этот JSON-код темы и отправьте друзьям или одногруппникам:';\r\n    if (copyBtn) copyBtn.style.display = 'block';\r\n    if (applyBtn) applyBtn.style.display = 'none';\r\n\r\n    const exportData = {\r\n      preset: currentSettings.preset || 'custom',\r\n      bgColor: currentSettings.bgColor,\r\n      cardColor: currentSettings.cardColor,\r\n      cardOpacity: currentSettings.cardOpacity,\r\n      accentColor: currentSettings.accentColor,\r\n      accentContainer: currentSettings.accentContainer,\r\n      textColor: currentSettings.textColor,\r\n      borderRadius: currentSettings.borderRadius,\r\n      btnRadius: currentSettings.btnRadius,\r\n      fontFamily: currentSettings.fontFamily,\r\n      fontSize: currentSettings.fontSize,\r\n      borderWidth: currentSettings.borderWidth,\r\n      cardBlur: currentSettings.cardBlur,\r\n      shadowStyle: currentSettings.shadowStyle,\r\n      cardPadding: currentSettings.cardPadding,\r\n      coverStyle: currentSettings.coverStyle,\r\n      progressColorMode: currentSettings.progressColorMode,\r\n      progressHeight: currentSettings.progressHeight,\r\n      progressStyle: currentSettings.progressStyle,\r\n      progressBadge: currentSettings.progressBadge,\r\n      navbarStyle: currentSettings.navbarStyle,\r\n      avatarShape: currentSettings.avatarShape,\r\n      navbarHeight: currentSettings.navbarHeight,\r\n      navbarClean: currentSettings.navbarClean,\r\n      cardHoverEffect: currentSettings.cardHoverEffect,\r\n      animSpeed: currentSettings.animSpeed,\r\n      buttonPress: currentSettings.buttonPress,\r\n      bgDim: currentSettings.bgDim,\r\n      bgBlur: currentSettings.bgBlur,\r\n      bgGrain: currentSettings.bgGrain,\r\n      bgImage: currentSettings.bgImage,\r\n      hideFooter: currentSettings.hideFooter,\r\n      compactMode: currentSettings.compactMode\r\n    };\r\n    if (textarea) textarea.value = JSON.stringify(exportData, null, 2);\r\n  } else {\r\n    if (title) title.innerHTML = '<i class=\"fa fa-download\"></i> Импорт темы';\r\n    if (desc) desc.textContent = 'Вставьте сюда скопированный JSON-код темы и нажмите «Применить тему»:';\r\n    if (copyBtn) copyBtn.style.display = 'none';\r\n    if (applyBtn) applyBtn.style.display = 'block';\r\n    if (textarea) {\r\n      textarea.value = '';\r\n      textarea.placeholder = '{\\n  \"accentColor\": \"#...\",\\n  \"bgColor\": \"#...\"\\n}';\r\n    }\r\n  }\r\n\r\n  modal.style.display = 'flex';\r\n}\r\n\r\nfunction closeThemeShareModal() {\r\n  const modal = document.getElementById('modal-theme-share');\r\n  if (modal) modal.style.display = 'none';\r\n}\r\n\r\n\r\n// ────────────────────────────────────────────────────────\r\n// 5. ИНТЕРАКТИВНОСТЬ МАКЕТА И ИНИЦИАЛИЗАЦИЯ (БЛОК 3.3)\r\n// ────────────────────────────────────────────────────────\r\nfunction initEventListeners() {\r\n  // Выбор пресетов\r\n  els.presetBtns.forEach(btn => {\r\n    btn.addEventListener('click', () => {\r\n      applyPreset(btn.dataset.preset);\r\n    });\r\n  });\r\n\r\n  // Изменение цветов\r\n  [els.bg, els.card, els.accent, els.accentContainer, els.text].forEach(input => {\r\n    if (input) {\r\n      input.addEventListener('input', readSettingsFromUI);\r\n    }\r\n  });\r\n\r\n  // Изменение ползунков\r\n  [els.radius, els.btnRadius, els.opacity, els.blur, els.borderWidth, els.fontSize].forEach(input => {\r\n    if (input) {\r\n      input.addEventListener('input', readSettingsFromUI);\r\n    }\r\n  });\r\n\r\n  // Шрифты, стили теней, плотность, обои, тумблеры\r\n  if (els.font) els.font.addEventListener('change', readSettingsFromUI);\r\n  if (els.shadow) els.shadow.addEventListener('change', readSettingsFromUI);\r\n  if (els.density) els.density.addEventListener('change', readSettingsFromUI);\r\n  if (els.coverStyle) {\r\n    els.coverStyle.addEventListener('change', () => {\r\n      readSettingsFromUI();\r\n      renderMockupCourses(latestSnapshot?.courses || DEMO_COURSES, latestSnapshot?.greeting, latestSnapshot?.initials, !!latestSnapshot?.courses, latestSnapshot?.logoHtml, latestSnapshot?.notifCount);\r\n    });\r\n  }\r\n  [els.progressColorMode, els.progressHeight, els.progressStyle, els.progressBadge].forEach(sel => {\r\n    if (sel) {\r\n      sel.addEventListener('change', () => {\r\n        readSettingsFromUI();\r\n        renderMockupCourses(latestSnapshot?.courses || DEMO_COURSES, latestSnapshot?.greeting, latestSnapshot?.initials, !!latestSnapshot?.courses, latestSnapshot?.logoHtml, latestSnapshot?.notifCount);\r\n      });\r\n    }\r\n  });\r\n  [els.navbarStyle, els.avatarShape, els.navbarHeight, els.navbarClean].forEach(el => {\r\n    if (el) el.addEventListener('change', readSettingsFromUI);\r\n  });\r\n  [els.cardHoverEffect, els.animSpeed, els.buttonPress].forEach(el => {\r\n    if (el) el.addEventListener('change', readSettingsFromUI);\r\n  });\r\n  if (els.bgImage) {\r\n    els.bgImage.addEventListener('input', readSettingsFromUI);\r\n    els.bgImage.addEventListener('change', readSettingsFromUI);\r\n  }\r\n  if (els.bgDim) {\r\n    els.bgDim.addEventListener('input', readSettingsFromUI);\r\n    els.bgDim.addEventListener('change', readSettingsFromUI);\r\n  }\r\n  if (els.bgBlur) {\r\n    els.bgBlur.addEventListener('input', readSettingsFromUI);\r\n    els.bgBlur.addEventListener('change', readSettingsFromUI);\r\n  }\r\n  if (els.bgGrain) {\r\n    els.bgGrain.addEventListener('change', readSettingsFromUI);\r\n  }\r\n  if (els.hideFooter) els.hideFooter.addEventListener('change', readSettingsFromUI);\r\n  if (els.compact) els.compact.addEventListener('change', readSettingsFromUI);\r\n\r\n  // Кнопка сохранения\r\n  if (els.saveBtn) {\r\n    els.saveBtn.addEventListener('click', saveThemeToMoodle);\r\n  }\r\n\r\n  // Кнопка сброса темы по умолчанию\r\n  if (els.resetDefaultsBtn) {\r\n    els.resetDefaultsBtn.addEventListener('click', () => {\r\n      currentSettings = { ...DEFAULT_SETTINGS, hiddenSelectors: [], movedElements: {}, elementLayers: {} };\r\n      applyPreset('purple');\r\n      saveThemeToMoodle();\r\n      showToast('Тема сброшена до настроек по умолчанию');\r\n    });\r\n  }\r\n\r\n  // Интерактив фильтров на макете СДО\r\n  const mockFilters = document.querySelectorAll('.dashboard-filters .filter-pill');\r\n  mockFilters.forEach(pill => {\r\n    pill.addEventListener('click', (e) => {\r\n      e.preventDefault();\r\n      mockFilters.forEach(p => p.classList.remove('active'));\r\n      pill.classList.add('active');\r\n    });\r\n  });\r\n\r\n  // Переключение вида (сетка / список) на макете СДО\r\n  const viewBtns = document.querySelectorAll('.view-btn');\r\n  const coursesGrid = document.querySelector('.mock-courses-grid');\r\n  viewBtns.forEach(btn => {\r\n    btn.addEventListener('click', () => {\r\n      viewBtns.forEach(b => b.classList.remove('active'));\r\n      btn.classList.add('active');\r\n      if (btn.title === 'Список' || btn.querySelector('.fa-bars')) {\r\n        coursesGrid?.classList.add('list-view');\r\n      } else {\r\n        coursesGrid?.classList.remove('list-view');\r\n      }\r\n    });\r\n  });\r\n\r\n\r\n\r\n  // Кнопка перехода на реальный LMS\r\n  const openLmsBtn = document.getElementById('btn-open-lms');\r\n  if (openLmsBtn) {\r\n    openLmsBtn.addEventListener('click', () => {\r\n      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {\r\n        chrome.tabs.create({ url: 'https://lms.ranepa.ru/' });\r\n      } else {\r\n        window.open('https://lms.ranepa.ru/', '_blank');\r\n      }\r\n    });\r\n  }\r\n\r\n  // Модальное окно кастомизации курса\r\n  const courseModal = document.getElementById('modal-course-customizer');\r\n  const closeCourseModalBtn = document.getElementById('btn-close-course-modal');\r\n  const applyCourseCustomBtn = document.getElementById('btn-apply-course-custom');\r\n  const resetCourseCustomBtn = document.getElementById('btn-reset-course-custom');\r\n  const customCoverInput = document.getElementById('input-custom-course-cover');\r\n  const coverPreview = document.getElementById('modal-cover-preview');\r\n\r\n  if (closeCourseModalBtn) {\r\n    closeCourseModalBtn.addEventListener('click', closeCourseCustomizerModal);\r\n  }\r\n  if (courseModal) {\r\n    courseModal.addEventListener('click', (e) => {\r\n      if (e.target === courseModal) closeCourseCustomizerModal();\r\n    });\r\n  }\r\n  if (customCoverInput) {\r\n    customCoverInput.addEventListener('input', () => {\r\n      const val = customCoverInput.value.trim();\r\n      if (coverPreview) {\r\n        if (val) {\r\n          coverPreview.style.backgroundImage = `url(\"${val}\")`;\r\n          coverPreview.style.display = 'block';\r\n        } else {\r\n          coverPreview.style.display = 'none';\r\n        }\r\n      }\r\n    });\r\n  }\r\n  if (applyCourseCustomBtn) {\r\n    applyCourseCustomBtn.addEventListener('click', () => {\r\n      if (!modalActiveCourse) return;\r\n      if (!currentSettings.courseCustomizations) currentSettings.courseCustomizations = {};\r\n      const titleVal = (document.getElementById('input-custom-course-title')?.value || '').trim();\r\n      const coverVal = (customCoverInput?.value || '').trim();\r\n      const pinnedVal = !!document.getElementById('toggle-course-pinned')?.checked;\r\n\r\n      if (!titleVal && !coverVal && !pinnedVal) {\r\n        delete currentSettings.courseCustomizations[modalActiveCourse.id];\r\n      } else {\r\n        currentSettings.courseCustomizations[modalActiveCourse.id] = {\r\n          customTitle: titleVal || undefined,\r\n          customCover: coverVal || undefined,\r\n          pinned: pinnedVal\r\n        };\r\n      }\r\n      closeCourseCustomizerModal();\r\n      renderMockupCourses(latestSnapshot?.courses || DEMO_COURSES, latestSnapshot?.greeting, latestSnapshot?.initials, !!latestSnapshot?.courses, latestSnapshot?.logoHtml, latestSnapshot?.notifCount);\r\n      saveThemeToMoodle();\r\n      showToast('✓ Персональные настройки курса сохранены! ✨');\r\n    });\r\n  }\r\n  if (resetCourseCustomBtn) {\r\n    resetCourseCustomBtn.addEventListener('click', () => {\r\n      if (!modalActiveCourse) return;\r\n      if (currentSettings.courseCustomizations) {\r\n        delete currentSettings.courseCustomizations[modalActiveCourse.id];\r\n      }\r\n      closeCourseCustomizerModal();\r\n      renderMockupCourses(latestSnapshot?.courses || DEMO_COURSES, latestSnapshot?.greeting, latestSnapshot?.initials, !!latestSnapshot?.courses, latestSnapshot?.logoHtml, latestSnapshot?.notifCount);\r\n      saveThemeToMoodle();\r\n      showToast('↺ Настройки курса сброшены');\r\n    });\r\n  }\r\n\r\n  // ── Блок 6: Сохранение своего пресета ──\r\n  const btnSavePreset = document.getElementById('btn-save-as-preset');\r\n  if (btnSavePreset) {\r\n    btnSavePreset.addEventListener('click', () => {\r\n      const name = prompt('Введите название для вашего пресета:', 'Мой стиль');\r\n      if (!name || !name.trim()) return;\r\n      const cleanName = name.trim();\r\n\r\n      savedCustomPresets[cleanName] = {\r\n        bgColor: currentSettings.bgColor,\r\n        cardColor: currentSettings.cardColor,\r\n        cardOpacity: currentSettings.cardOpacity,\r\n        accentColor: currentSettings.accentColor,\r\n        accentContainer: currentSettings.accentContainer,\r\n        textColor: currentSettings.textColor,\r\n        borderRadius: currentSettings.borderRadius,\r\n        btnRadius: currentSettings.btnRadius,\r\n        fontFamily: currentSettings.fontFamily,\r\n        fontSize: currentSettings.fontSize,\r\n        borderWidth: currentSettings.borderWidth,\r\n        cardBlur: currentSettings.cardBlur,\r\n        shadowStyle: currentSettings.shadowStyle,\r\n        cardPadding: currentSettings.cardPadding,\r\n        coverStyle: currentSettings.coverStyle,\r\n        progressColorMode: currentSettings.progressColorMode,\r\n        progressHeight: currentSettings.progressHeight,\r\n        progressStyle: currentSettings.progressStyle,\r\n        progressBadge: currentSettings.progressBadge,\r\n        navbarStyle: currentSettings.navbarStyle,\r\n        avatarShape: currentSettings.avatarShape,\r\n        navbarHeight: currentSettings.navbarHeight,\r\n        navbarClean: currentSettings.navbarClean,\r\n        cardHoverEffect: currentSettings.cardHoverEffect,\r\n        animSpeed: currentSettings.animSpeed,\r\n        buttonPress: currentSettings.buttonPress,\r\n        bgDim: currentSettings.bgDim,\r\n        bgBlur: currentSettings.bgBlur,\r\n        bgGrain: currentSettings.bgGrain,\r\n        bgImage: currentSettings.bgImage,\r\n        hideFooter: currentSettings.hideFooter,\r\n        compactMode: currentSettings.compactMode\r\n      };\r\n      saveCustomPresetsToStorage();\r\n      showToast(`✓ Пресет «${cleanName}» успешно сохранен! 🔖`);\r\n    });\r\n  }\r\n\r\n  // ── Блок 6: Экспорт и импорт темы ──\r\n  const btnExportTheme = document.getElementById('btn-export-theme');\r\n  const btnImportTheme = document.getElementById('btn-import-theme');\r\n  const btnCloseShareModal = document.getElementById('btn-close-share-modal');\r\n  const modalThemeShare = document.getElementById('modal-theme-share');\r\n  const btnCopyThemeJson = document.getElementById('btn-copy-theme-json');\r\n  const btnApplyImportedTheme = document.getElementById('btn-apply-imported-theme');\r\n\r\n  if (btnExportTheme) {\r\n    btnExportTheme.addEventListener('click', () => openThemeShareModal('export'));\r\n  }\r\n  if (btnImportTheme) {\r\n    btnImportTheme.addEventListener('click', () => openThemeShareModal('import'));\r\n  }\r\n  if (btnCloseShareModal) {\r\n    btnCloseShareModal.addEventListener('click', closeThemeShareModal);\r\n  }\r\n  if (modalThemeShare) {\r\n    modalThemeShare.addEventListener('click', (e) => {\r\n      if (e.target === modalThemeShare) closeThemeShareModal();\r\n    });\r\n  }\r\n  if (btnCopyThemeJson) {\r\n    btnCopyThemeJson.addEventListener('click', () => {\r\n      const textarea = document.getElementById('textarea-theme-json');\r\n      if (!textarea || !textarea.value) return;\r\n      navigator.clipboard.writeText(textarea.value).then(() => {\r\n        showToast('✓ Код темы скопирован в буфер обмена!');\r\n      }).catch(() => {\r\n        textarea.select();\r\n        document.execCommand('copy');\r\n        showToast('✓ Код темы скопирован!');\r\n      });\r\n    });\r\n  }\r\n  if (btnApplyImportedTheme) {\r\n    btnApplyImportedTheme.addEventListener('click', () => {\r\n      const textarea = document.getElementById('textarea-theme-json');\r\n      if (!textarea || !textarea.value.trim()) {\r\n        showToast('⚠️ Вставьте JSON-код темы');\r\n        return;\r\n      }\r\n      try {\r\n        const imported = JSON.parse(textarea.value.trim());\r\n        if (typeof imported !== 'object' || imported === null) {\r\n          throw new Error('Invalid format');\r\n        }\r\n        currentSettings = Object.assign({}, DEFAULT_SETTINGS, currentSettings, imported);\r\n        updateUIFromSettings(currentSettings);\r\n        applyThemeToMockup(currentSettings);\r\n        saveThemeToMoodle();\r\n        closeThemeShareModal();\r\n        showToast('🎉 Тема успешно импортирована и применена!');\r\n      } catch (err) {\r\n        showToast('❌ Ошибка: неверный формат JSON темы');\r\n      }\r\n    });\r\n  }\r\n\r\n  // ── Блок 6: Загрузка обоев с ПК и очистка ──\r\n  const btnUploadBgFile = document.getElementById('btn-upload-bg-file');\r\n  const fileBgImage = document.getElementById('file-bg-image');\r\n  const btnClearBgImage = document.getElementById('btn-clear-bg-image');\r\n\r\n  if (btnUploadBgFile && fileBgImage) {\r\n    btnUploadBgFile.addEventListener('click', () => fileBgImage.click());\r\n    fileBgImage.addEventListener('change', (e) => {\r\n      const file = e.target.files && e.target.files[0];\r\n      if (!file) return;\r\n      compressAndReadImage(file, 1920, 0.85, (dataUrl) => {\r\n        if (els.bgImage) els.bgImage.value = dataUrl;\r\n        readSettingsFromUI();\r\n        showToast('✓ Обои успешно загружены с вашего ПК! 🖼️');\r\n      });\r\n      fileBgImage.value = '';\r\n    });\r\n  }\r\n  if (btnClearBgImage) {\r\n    btnClearBgImage.addEventListener('click', () => {\r\n      if (els.bgImage) {\r\n        els.bgImage.value = '';\r\n        readSettingsFromUI();\r\n        showToast('Обои очищены');\r\n      }\r\n    });\r\n  }\r\n\r\n  // ── Блок 6: Загрузка обложки курса с ПК и очистка в модалке ──\r\n  const btnUploadCourseCover = document.getElementById('btn-upload-course-cover');\r\n  const fileCustomCourseCover = document.getElementById('file-custom-course-cover');\r\n  const btnClearCourseCover = document.getElementById('btn-clear-course-cover');\r\n\r\n  if (btnUploadCourseCover && fileCustomCourseCover) {\r\n    btnUploadCourseCover.addEventListener('click', () => fileCustomCourseCover.click());\r\n    fileCustomCourseCover.addEventListener('change', (e) => {\r\n      const file = e.target.files && e.target.files[0];\r\n      if (!file) return;\r\n      compressAndReadImage(file, 800, 0.85, (dataUrl) => {\r\n        if (customCoverInput) {\r\n          customCoverInput.value = dataUrl;\r\n          if (coverPreview) {\r\n            coverPreview.style.backgroundImage = `url(\"${dataUrl}\")`;\r\n            coverPreview.style.display = 'block';\r\n          }\r\n          showToast('✓ Обложка курса загружена с ПК! 📷');\r\n        }\r\n      });\r\n      fileCustomCourseCover.value = '';\r\n    });\r\n  }\r\n  if (btnClearCourseCover) {\r\n    btnClearCourseCover.addEventListener('click', () => {\r\n      if (customCoverInput) {\r\n        customCoverInput.value = '';\r\n        if (coverPreview) {\r\n          coverPreview.style.backgroundImage = 'none';\r\n          coverPreview.style.display = 'none';\r\n        }\r\n        showToast('Обложка курса очищена');\r\n      }\r\n    });\r\n  }\r\n}\r\n\r\n// ────────────────────────────────────────────────────────\r\n// ДИНАМИЧЕСКИЙ РЕНДЕРИНГ РЕАЛЬНЫХ КУРСОВ ИЗ СДО (SNAPSHOT)\r\n// ────────────────────────────────────────────────────────\r\nconst DEMO_COURSES = [\r\n  {\r\n    id: 101,\r\n    title: 'Информационные технологии в профессиональной деятельности',\r\n    chips: ['1 семестр', 'Базовый курс'],\r\n    progress: '45%',\r\n    isFavourite: true,\r\n    hue1: 210,\r\n    hue2: 270\r\n  },\r\n  {\r\n    id: 102,\r\n    title: 'Высшая математика и математический анализ',\r\n    chips: ['1 семестр', 'Практика'],\r\n    progress: '20%',\r\n    isFavourite: false,\r\n    hue1: 140,\r\n    hue2: 190\r\n  },\r\n  {\r\n    id: 103,\r\n    title: 'Иностранный язык в профессиональной коммуникации',\r\n    chips: ['2 семестр', 'Семинары'],\r\n    progress: '75%',\r\n    isFavourite: false,\r\n    hue1: 330,\r\n    hue2: 30\r\n  },\r\n  {\r\n    id: 104,\r\n    title: 'Основы проектной деятельности и управления проектами',\r\n    chips: ['1 семестр', 'Лекции'],\r\n    progress: '60%',\r\n    isFavourite: true,\r\n    hue1: 45,\r\n    hue2: 100\r\n  },\r\n  {\r\n    id: 105,\r\n    title: 'Безопасность жизнедеятельности и охрана труда',\r\n    chips: ['Зачетная дисциплина'],\r\n    progress: '100%',\r\n    isFavourite: false,\r\n    hue1: 175,\r\n    hue2: 220\r\n  },\r\n  {\r\n    id: 106,\r\n    title: 'Правоведение и основы государственной службы',\r\n    chips: ['Лекции и тесты'],\r\n    progress: '10%',\r\n    isFavourite: false,\r\n    hue1: 280,\r\n    hue2: 340\r\n  }\r\n];\r\n\r\nfunction escapeHtml(text) {\r\n  if (!text) return '';\r\n  return String(text)\r\n    .replace(/&/g, '&amp;')\r\n    .replace(/</g, '&lt;')\r\n    .replace(/>/g, '&gt;')\r\n    .replace(/\"/g, '&quot;')\r\n    .replace(/'/g, '&#039;');\r\n}\r\n\r\nlet modalActiveCourse = null;\r\n\r\nfunction openCourseCustomizerModal(course) {\r\n  if (!course) return;\r\n  modalActiveCourse = course;\r\n  const modal = document.getElementById('modal-course-customizer');\r\n  const origNameEl = document.getElementById('modal-course-orig-name');\r\n  const inputTitle = document.getElementById('input-custom-course-title');\r\n  const inputCover = document.getElementById('input-custom-course-cover');\r\n  const coverPreview = document.getElementById('modal-cover-preview');\r\n  const togglePinned = document.getElementById('toggle-course-pinned');\r\n\r\n  if (!modal) return;\r\n\r\n  const currentCustom = (currentSettings.courseCustomizations && currentSettings.courseCustomizations[course.id]) || {};\r\n\r\n  if (origNameEl) origNameEl.textContent = 'Курс: ' + (course.title || 'Учебный курс');\r\n  if (inputTitle) inputTitle.value = currentCustom.customTitle || '';\r\n  if (inputCover) {\r\n    inputCover.value = currentCustom.customCover || '';\r\n    if (coverPreview) {\r\n      if (currentCustom.customCover) {\r\n        coverPreview.style.backgroundImage = `url(\"${currentCustom.customCover}\")`;\r\n        coverPreview.style.display = 'block';\r\n      } else {\r\n        coverPreview.style.display = 'none';\r\n      }\r\n    }\r\n  }\r\n  if (togglePinned) togglePinned.checked = !!currentCustom.pinned;\r\n\r\n  modal.style.display = 'flex';\r\n}\r\n\r\nfunction closeCourseCustomizerModal() {\r\n  const modal = document.getElementById('modal-course-customizer');\r\n  if (modal) modal.style.display = 'none';\r\n  modalActiveCourse = null;\r\n}\r\n\r\nfunction renderMockupCourses(courses, greeting, initials, isLive, logoHtml, notifCount) {\r\n  const container = document.getElementById('mock-courses-container') || document.querySelector('.mock-courses-grid');\r\n  const initialsEl = document.getElementById('mock-user-initials');\r\n  const brandEl = document.getElementById('mock-navbar-brand');\r\n  const notifEl = document.getElementById('mock-notif-count');\r\n  const statusEl = document.getElementById('preview-viewport-status');\r\n\r\n  if (initialsEl && initials) {\r\n    initialsEl.textContent = initials;\r\n  }\r\n  const effectiveLogo = logoHtml || (latestSnapshot && latestSnapshot.logoHtml);\r\n  if (brandEl && effectiveLogo) {\r\n    brandEl.innerHTML = effectiveLogo;\r\n  } else if (brandEl && window.parent && window.parent !== window) {\r\n    try {\r\n      const parentBrand = window.parent.document.querySelector('.navbar-brand, .site-name, [data-region=\"branding\"]');\r\n      if (parentBrand && parentBrand.innerHTML.trim()) {\r\n        const liveLogo = parentBrand.innerHTML.trim().replace(/(src|href)=\"\\/(?!\\/)/g, '$1=\"https://lms.ranepa.ru/');\r\n        brandEl.innerHTML = liveLogo;\r\n        if (!latestSnapshot) latestSnapshot = {};\r\n        latestSnapshot.logoHtml = liveLogo;\r\n      }\r\n    } catch(e) {}\r\n  }\r\n  if (notifEl && notifCount) {\r\n    notifEl.textContent = notifCount;\r\n  }\r\n  if (statusEl) {\r\n    statusEl.textContent = isLive\r\n      ? `Интерактивный предпросмотр СДО (Синхронизировано: ${courses.length} курсов)`\r\n      : `Интерактивный предпросмотр СДО (РАНХиГС LMS)`;\r\n  }\r\n\r\n  if (!container) return;\r\n  container.innerHTML = '';\r\n\r\n  const courseList = (courses && courses.length > 0) ? courses : DEMO_COURSES;\r\n  const demoPercents = [45, 20, 75, 60, 100, 10];\r\n  const allZero = courseList.every(c => {\r\n    const v = parseInt(c.progress, 10);\r\n    return isNaN(v) || v === 0;\r\n  });\r\n\r\n  const customizations = currentSettings.courseCustomizations || {};\r\n\r\n  // Сортировка: закрепленные курсы идут в самом начале\r\n  const sortedList = [...courseList].sort((a, b) => {\r\n    const isPinnedA = !!(customizations[a.id] && customizations[a.id].pinned);\r\n    const isPinnedB = !!(customizations[b.id] && customizations[b.id].pinned);\r\n    if (isPinnedA && !isPinnedB) return -1;\r\n    if (!isPinnedA && isPinnedB) return 1;\r\n    return 0;\r\n  });\r\n\r\n  sortedList.forEach((course, idx) => {\r\n    const card = document.createElement('div');\r\n    card.className = 'list-group-item mydashboard-list-item mock-card';\r\n    card.dataset.courseId = course.id;\r\n\r\n    const custom = customizations[course.id] || {};\r\n    const displayTitle = custom.customTitle || course.title;\r\n    const isPinned = !!custom.pinned;\r\n    if (isPinned) {\r\n      card.setAttribute('data-mc-pinned', 'true');\r\n    }\r\n\r\n    let coverBg = '';\r\n    if (custom.customCover) {\r\n      coverBg = `url(\"${escapeHtml(custom.customCover)}\") center/cover no-repeat !important`;\r\n    } else {\r\n      const style = currentSettings.coverStyle || 'gradient';\r\n      if (style === 'pastel') {\r\n        coverBg = `linear-gradient(135deg, hsl(${course.hue1}, 45%, 60%), hsl(${course.hue2}, 40%, 40%)) !important`;\r\n      } else if (style === 'neon') {\r\n        coverBg = `linear-gradient(135deg, hsl(${course.hue1}, 95%, 55%), hsl(${course.hue2}, 90%, 25%)) !important`;\r\n      } else if (style === 'mono') {\r\n        coverBg = `linear-gradient(135deg, #333333, #161616) !important`;\r\n      } else {\r\n        coverBg = `linear-gradient(135deg, hsl(${course.hue1}, 60%, 40%), hsl(${course.hue2}, 70%, 20%)) !important`;\r\n      }\r\n    }\r\n\r\n    const pinnedBadgeHtml = isPinned ? `<div class=\"mc-pinned-badge\"><i class=\"fa fa-thumb-tack\" style=\"color: #ffd54f !important; margin-right: 4px;\"></i><span style=\"color: #ffd54f !important; font-weight: 800 !important;\">Закреплен</span></div>` : '';\r\n\r\n    const chipsHtml = (course.chips && course.chips.length > 0)\r\n      ? `<div class=\"mc-course-chips\">${course.chips.map(chip => `<span class=\"mc-chip\">${escapeHtml(chip)}</span>`).join('')}</div>`\r\n      : '';\r\n\r\n    let progressVal = parseInt(course.progress, 10);\r\n    if (isNaN(progressVal) || (allZero && progressVal === 0)) {\r\n      progressVal = demoPercents[idx % demoPercents.length];\r\n    }\r\n    progressVal = Math.max(0, Math.min(100, progressVal));\r\n\r\n    let barColor = 'var(--mc-accent, #D0BCFF)';\r\n    let strongColor = 'var(--mc-accent, #D0BCFF)';\r\n    const colorMode = currentSettings.progressColorMode || 'accent';\r\n\r\n    if (colorMode === 'smart') {\r\n      if (progressVal < 25) {\r\n        barColor = '#ff5252';\r\n      } else if (progressVal < 60) {\r\n        barColor = '#ffa726';\r\n      } else if (progressVal < 100) {\r\n        barColor = '#29b6f6';\r\n      } else {\r\n        barColor = '#66bb6a';\r\n      }\r\n      strongColor = barColor;\r\n    } else if (colorMode === 'gradient') {\r\n      barColor = 'linear-gradient(90deg, #ff5252, #ffa726, #29b6f6, #66bb6a)';\r\n      strongColor = '#29b6f6';\r\n    }\r\n\r\n    card.innerHTML = `\r\n      ${pinnedBadgeHtml}\r\n      <div class=\"mc-course-cover\" style=\"background: ${coverBg};\"></div>\r\n      <div class=\"mydashboard-course\">\r\n        <a href=\"#\" class=\"mydashboard-coursename\">\r\n          <span class=\"mc-course-title-main\">${escapeHtml(displayTitle)}</span>\r\n          ${chipsHtml}\r\n        </a>\r\n      </div>\r\n      <div class=\"mydashboard-progress\" data-rendered-percent=\"${progressVal}\">\r\n        <div class=\"mydashboard-progress-string\">Прогресс: <strong style=\"color: ${strongColor} !important;\">${progressVal}%</strong></div>\r\n        <div class=\"progress\">\r\n          <div class=\"progress-bar\" role=\"progressbar\" style=\"width: ${progressVal}%; background: ${barColor} !important; --mc-bar-color: ${strongColor};\" aria-valuenow=\"${progressVal}\" aria-valuemin=\"0\" aria-valuemax=\"100\"></div>\r\n        </div>\r\n      </div>\r\n      <div class=\"mydashboard-menu-box\">\r\n        <button class=\"btn-course-settings\" title=\"Настроить этот курс (обложка, название, закрепление)\">\r\n          <i class=\"fa fa-pencil\"></i>\r\n        </button>\r\n      </div>\r\n    `;\r\n\r\n    // Кнопка персональной настройки курса\r\n    const settingsBtn = card.querySelector('.btn-course-settings');\r\n    if (settingsBtn) {\r\n      settingsBtn.addEventListener('click', (e) => {\r\n        e.preventDefault();\r\n        e.stopPropagation();\r\n        openCourseCustomizerModal(course);\r\n      });\r\n    }\r\n\r\n    // Клик по названию курса открывает страницу этого курса в песочнице\r\n    const titleLink = card.querySelector('a.mydashboard-coursename');\r\n    if (titleLink) {\r\n      titleLink.addEventListener('click', (e) => {\r\n        e.preventDefault();\r\n        const fullCourse = {\r\n          title: course.title,\r\n          mainTitle: course.title,\r\n          chips: course.chips,\r\n          sections: (currentCourseData && currentCourseData.title === course.title) ? currentCourseData.sections : null\r\n        };\r\n        setActiveView('course', fullCourse);\r\n      });\r\n    }\r\n\r\n    container.appendChild(card);\r\n  });\r\n\r\n  // Применяем текущую тему к новым карточкам\r\n  applyThemeToMockup(currentSettings);\r\n}\r\n\r\nlet savedPagesData = {};\r\nlet latestSnapshot = null;\r\nlet currentCourseData = null;\r\n\r\n// Динамический рендеринг реального курса студента\r\nfunction renderMockupCourse(courseData) {\r\n  if (!courseData) return;\r\n\r\n  const titleEl = document.getElementById('mock-course-title');\r\n  if (titleEl) {\r\n    if (courseData.chips && courseData.chips.length > 0) {\r\n      let html = `<span class=\"mc-course-title-main\">${escapeHtml(courseData.mainTitle || courseData.title)}</span>`;\r\n      html += `<div class=\"mc-course-chips\" style=\"margin-top: 8px;\">`;\r\n      courseData.chips.forEach(chip => {\r\n        html += `<span class=\"mc-chip\">${escapeHtml(chip)}</span>`;\r\n      });\r\n      html += `</div>`;\r\n      titleEl.innerHTML = html;\r\n    } else {\r\n      titleEl.textContent = courseData.title || 'Страница учебного курса';\r\n    }\r\n  }\r\n\r\n  const container = document.getElementById('mock-course-sections-container');\r\n  if (!container) return;\r\n  container.innerHTML = '';\r\n\r\n  const sections = (courseData.sections && courseData.sections.length > 0)\r\n    ? courseData.sections\r\n    : [\r\n        {\r\n          title: 'Общее',\r\n          activities: [\r\n            { name: 'Балльно-рейтинговая система', type: 'brs', completed: true }\r\n          ]\r\n        },\r\n        {\r\n          title: 'Тема 1. Введение в курс',\r\n          activities: [\r\n            { name: 'Вводные материалы и методические указания', type: 'file', completed: true },\r\n            { name: 'Практическое контрольное задание', type: 'assign', completed: false }\r\n          ]\r\n        }\r\n      ];\r\n\r\n  sections.forEach((sec, idx) => {\r\n    const secBlock = document.createElement('div');\r\n    secBlock.className = 'mock-course-section-block';\r\n\r\n    const header = document.createElement('div');\r\n    header.className = 'mock-section-header';\r\n    header.innerHTML = `\r\n      <span class=\"mock-section-chevron\"><i class=\"fa fa-angle-down\"></i></span>\r\n      <span class=\"mock-section-title\">${escapeHtml(sec.title || `Раздел ${idx + 1}`)}</span>\r\n    `;\r\n    secBlock.appendChild(header);\r\n\r\n    const items = document.createElement('div');\r\n    items.className = 'mock-section-items';\r\n\r\n    if (sec.activities && sec.activities.length > 0) {\r\n      sec.activities.forEach(act => {\r\n        const actCard = document.createElement('div');\r\n        actCard.className = 'mock-activity-card';\r\n\r\n        let badgeHtml = '';\r\n        let iconHtml = '';\r\n\r\n        if (act.type === 'brs') {\r\n          badgeHtml = '<span class=\"mock-act-badge\">БРС</span>';\r\n        } else if (act.type === 'quiz') {\r\n          badgeHtml = '<span class=\"mock-act-badge\">Тест</span>';\r\n          iconHtml = '<i class=\"fa fa-question-circle mock-act-icon\"></i>';\r\n        } else if (act.type === 'assign') {\r\n          badgeHtml = '<span class=\"mock-act-badge\">Задание</span>';\r\n          iconHtml = '<i class=\"fa fa-check-square-o mock-act-icon\"></i>';\r\n        } else if (act.type === 'file') {\r\n          badgeHtml = '<span class=\"mock-act-badge\">Материал</span>';\r\n          iconHtml = '<i class=\"fa fa-file-text-o mock-act-icon\"></i>';\r\n        } else if (act.type === 'url') {\r\n          badgeHtml = '<span class=\"mock-act-badge\">Ссылка</span>';\r\n          iconHtml = '<i class=\"fa fa-link mock-act-icon\"></i>';\r\n        } else if (act.type === 'forum') {\r\n          badgeHtml = '<span class=\"mock-act-badge\">Форум</span>';\r\n          iconHtml = '<i class=\"fa fa-comments-o mock-act-icon\"></i>';\r\n        } else {\r\n          iconHtml = '<i class=\"fa fa-file-o mock-act-icon\"></i>';\r\n        }\r\n\r\n        const statusHtml = act.completed\r\n          ? `<span class=\"mock-act-status completed\"><i class=\"fa fa-check\"></i> Выполнено</span>`\r\n          : '';\r\n\r\n        actCard.innerHTML = `\r\n          ${badgeHtml}\r\n          ${iconHtml}\r\n          <span class=\"mock-act-title\">${escapeHtml(act.name || act)}</span>\r\n          ${statusHtml}\r\n        `;\r\n\r\n        items.appendChild(actCard);\r\n      });\r\n    } else {\r\n      const emptyNote = document.createElement('div');\r\n      emptyNote.style.cssText = 'color: var(--mc-text); opacity: 0.6; font-size: 13px; font-style: italic; padding: 6px 12px;';\r\n      emptyNote.textContent = 'Нет активных элементов в разделе';\r\n      items.appendChild(emptyNote);\r\n    }\r\n\r\n    secBlock.appendChild(items);\r\n    container.appendChild(secBlock);\r\n  });\r\n\r\n  // Динамический подсчет прогресса курса в шапке\r\n  function updateCourseProgress() {\r\n    let totalActs = 0;\r\n    let doneActs = 0;\r\n    const actCards = container.querySelectorAll('.mock-activity-card');\r\n    actCards.forEach(card => {\r\n      const badge = card.querySelector('.mock-act-badge');\r\n      if (badge && badge.textContent.trim() === 'БРС') return;\r\n      totalActs++;\r\n      if (card.querySelector('.mock-act-status.completed')) {\r\n        doneActs++;\r\n      }\r\n    });\r\n\r\n    const initialVal = parseInt(courseData.progress, 10);\r\n    const coursePct = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : (!isNaN(initialVal) && initialVal > 0 ? initialVal : 50);\r\n    const progValEl = document.getElementById('mock-course-prog-val');\r\n    const progBarEl = document.getElementById('mock-course-prog-bar');\r\n    if (progValEl) progValEl.textContent = `${coursePct}%`;\r\n    if (progBarEl) {\r\n      progBarEl.style.width = `${coursePct}%`;\r\n      progBarEl.setAttribute('aria-valuenow', coursePct);\r\n    }\r\n  }\r\n\r\n  // Клик по активности переключает статус \"Выполнено\" и обновляет прогресс-бар\r\n  container.querySelectorAll('.mock-activity-card').forEach(actCard => {\r\n    actCard.style.cursor = 'pointer';\r\n    actCard.title = 'Нажмите, чтобы переключить статус выполнения';\r\n    actCard.addEventListener('click', () => {\r\n      let statusEl = actCard.querySelector('.mock-act-status');\r\n      if (statusEl && statusEl.classList.contains('completed')) {\r\n        statusEl.remove();\r\n      } else {\r\n        if (!statusEl) {\r\n          statusEl = document.createElement('span');\r\n          actCard.appendChild(statusEl);\r\n        }\r\n        statusEl.className = 'mock-act-status completed';\r\n        statusEl.innerHTML = '<i class=\"fa fa-check\"></i> Выполнено';\r\n      }\r\n      updateCourseProgress();\r\n    });\r\n  });\r\n\r\n  updateCourseProgress();\r\n}\r\n\r\nfunction renderCustomPage(customData) {\r\n  const container = document.getElementById('mock-custom-content');\r\n  if (!container) return;\r\n  container.innerHTML = '';\r\n\r\n  const rawHtml = customData && customData.rawHtml;\r\n  if (rawHtml) {\r\n    const wrapper = document.createElement('div');\r\n    wrapper.className = 'mock-custom-page-wrapper';\r\n    wrapper.innerHTML = rawHtml;\r\n\r\n    // Удаляем скрипты и дублирующиеся фиксированные панели\r\n    wrapper.querySelectorAll('script, #paqa-theme-studio-live, #mc-debug-flash, .fixed-top, nav.fixed-top, .navbar.fixed-top, footer, #page-footer').forEach(s => s.remove());\r\n\r\n    container.appendChild(wrapper);\r\n  } else {\r\n    container.innerHTML = `\r\n      <div style=\"padding: 60px 20px; text-align: center; color: var(--mc-text);\">\r\n        <i class=\"fa fa-file-text-o\" style=\"font-size: 42px; margin-bottom: 16px; opacity: 0.5;\"></i>\r\n        <h3 style=\"margin-bottom: 8px;\">Страница СДО</h3>\r\n        <p style=\"color: var(--mc-text-muted); font-size: 14px;\">Откройте любую страницу в СДО (задание, техподдержка, профиль) и нажмите \"Открыть редактор\" в расширении.</p>\r\n      </div>\r\n    `;\r\n  }\r\n}\r\n\r\nfunction setActiveView(viewName, selectedCourse) {\r\n  const btnDash = document.getElementById('btn-view-dashboard');\r\n  const btnCourse = document.getElementById('btn-view-course');\r\n  const btnCustom = document.getElementById('btn-view-custom');\r\n  const statusEl = document.getElementById('preview-viewport-status');\r\n  const dashView = document.getElementById('mock-view-dashboard');\r\n  const courseView = document.getElementById('mock-view-course');\r\n  const customView = document.getElementById('mock-view-custom');\r\n\r\n  // Сбрасываем активность кнопок\r\n  if (btnDash) btnDash.classList.remove('active');\r\n  if (btnCourse) btnCourse.classList.remove('active');\r\n  if (btnCustom) btnCustom.classList.remove('active');\r\n\r\n  // Скрываем все области\r\n  if (dashView) dashView.style.display = 'none';\r\n  if (courseView) courseView.style.display = 'none';\r\n  if (customView) customView.style.display = 'none';\r\n\r\n  if (viewName === 'custom') {\r\n    if (btnCustom) btnCustom.classList.add('active');\r\n    if (customView) customView.style.display = 'block';\r\n\r\n    const customData = (savedPagesData && savedPagesData.custom) || (latestSnapshot && latestSnapshot.activePage === 'custom' ? latestSnapshot : null);\r\n    renderCustomPage(customData);\r\n    if (statusEl) {\r\n      statusEl.textContent = `Интерактивный предпросмотр: ${customData?.title || 'Текущая страница'}`;\r\n    }\r\n  } else if (viewName === 'course') {\r\n    if (btnCourse) btnCourse.classList.add('active');\r\n    if (courseView) courseView.style.display = 'block';\r\n\r\n    let courseData = selectedCourse || currentCourseData;\r\n    if (!courseData && savedPagesData.course && savedPagesData.course.courseData) {\r\n      courseData = savedPagesData.course.courseData;\r\n    }\r\n    if (!courseData && latestSnapshot && latestSnapshot.currentCourse) {\r\n      courseData = latestSnapshot.currentCourse;\r\n    }\r\n    if (!courseData && latestSnapshot && latestSnapshot.courses && latestSnapshot.courses.length > 0) {\r\n      const first = latestSnapshot.courses[0];\r\n      courseData = {\r\n        title: first.title,\r\n        mainTitle: first.title,\r\n        chips: first.chips,\r\n        sections: [\r\n          {\r\n            title: 'Общее',\r\n            activities: [\r\n              { name: 'Балльно-рейтинговая система', type: 'brs', completed: true }\r\n            ]\r\n          },\r\n          {\r\n            title: 'Материалы и задания',\r\n            activities: [\r\n              { name: 'План занятий и лекционные материалы', type: 'file', completed: true },\r\n              { name: 'Практическая контрольная работа № 1', type: 'assign', completed: false }\r\n            ]\r\n          }\r\n        ]\r\n      };\r\n    }\r\n\r\n    if (courseData) {\r\n      currentCourseData = courseData;\r\n      renderMockupCourse(courseData);\r\n      if (statusEl) statusEl.textContent = `Интерактивный предпросмотр курса: ${courseData.mainTitle || courseData.title}`;\r\n    } else {\r\n      if (statusEl) statusEl.textContent = `Интерактивный предпросмотр: Страница курса`;\r\n    }\r\n  } else {\r\n    // dashboard\r\n    if (btnDash) btnDash.classList.add('active');\r\n    if (dashView) dashView.style.display = 'block';\r\n\r\n    if (statusEl) {\r\n      statusEl.textContent = (latestSnapshot && latestSnapshot.courses && latestSnapshot.courses.length > 0)\r\n        ? `Интерактивный предпросмотр: Онлайн-обучение (${latestSnapshot.courses.length} курсов)`\r\n        : `Интерактивный предпросмотр СДО (РАНХиГС LMS)`;\r\n    }\r\n  }\r\n\r\n  // Применяем тему к текущему отображению\r\n  applyThemeToMockup(currentSettings);\r\n}\r\n\r\n// Загрузка настроек и слепка реального интерфейса\r\ndocument.addEventListener('DOMContentLoaded', () => {\r\n  initEventListeners();\r\n  loadCustomPresets();\r\n\r\n  const btnDash = document.getElementById('btn-view-dashboard');\r\n  const btnCourse = document.getElementById('btn-view-course');\r\n  const btnCustom = document.getElementById('btn-view-custom');\r\n  if (btnDash) btnDash.addEventListener('click', () => setActiveView('dashboard'));\r\n  if (btnCourse) btnCourse.addEventListener('click', () => setActiveView('course'));\r\n  if (btnCustom) btnCustom.addEventListener('click', () => setActiveView('custom'));\r\n\r\n  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {\r\n    chrome.storage.local.get(['mcSettings', 'mcDashboardSnapshot', 'mcSavedPages'], (data) => {\r\n      if (data && data.mcSettings) {\r\n        currentSettings = Object.assign({}, DEFAULT_SETTINGS, data.mcSettings);\r\n      }\r\n      updateUIFromSettings(currentSettings);\r\n\r\n      savedPagesData = (data && data.mcSavedPages) || {};\r\n      latestSnapshot = data && data.mcDashboardSnapshot;\r\n      const snap = latestSnapshot;\r\n\r\n      if (snap) {\r\n        if (snap.currentCourse) {\r\n          currentCourseData = snap.currentCourse;\r\n        } else if (savedPagesData.course && savedPagesData.course.courseData) {\r\n          currentCourseData = savedPagesData.course.courseData;\r\n        }\r\n\r\n        if (snap.courses && snap.courses.length > 0) {\r\n          renderMockupCourses(snap.courses, snap.greeting, snap.initials, true, snap.logoHtml, snap.notifCount);\r\n        } else {\r\n          renderMockupCourses(DEMO_COURSES, '', 'БЕ', false);\r\n        }\r\n\r\n        // Показываем кнопку кастомной страницы ТОЛЬКО если пользователь реально открыл редактор на отдельной странице (не дашборд и не курс)\r\n        const isCustomSpecificPage = snap.activePage === 'custom' && snap.pageUrl && !snap.pageUrl.includes('/my') && !snap.pageUrl.includes('/course/view');\r\n        if (isCustomSpecificPage && (snap.rawHtml || (savedPagesData && savedPagesData.custom))) {\r\n          if (btnCustom) btnCustom.style.display = 'inline-flex';\r\n          const lblCustom = document.getElementById('label-view-custom');\r\n          const title = snap.pageTitle || (savedPagesData.custom && savedPagesData.custom.title) || 'Страница СДО';\r\n          if (lblCustom) lblCustom.textContent = title.length > 25 ? title.substring(0, 25) + '…' : title;\r\n        } else {\r\n          if (btnCustom) btnCustom.style.display = 'none';\r\n        }\r\n\r\n        // Подсвечиваем активный пункт в шапке (если был передан из СДО)\r\n        if (snap.activeNavText) {\r\n          document.querySelectorAll('.mock-primary-nav .nav-link').forEach(link => {\r\n            link.classList.remove('active');\r\n            if (link.textContent.trim().toLowerCase().includes(snap.activeNavText.toLowerCase()) ||\r\n                snap.activeNavText.toLowerCase().includes(link.textContent.trim().toLowerCase())) {\r\n              link.classList.add('active');\r\n            }\r\n          });\r\n        }\r\n\r\n        if (snap.activePage === 'custom') {\r\n          setActiveView('custom');\r\n        } else if (snap.activePage === 'course') {\r\n          setActiveView('course');\r\n        } else {\r\n          setActiveView('dashboard');\r\n        }\r\n      } else {\r\n        renderMockupCourses(DEMO_COURSES, '', 'БЕ', false);\r\n        setActiveView('dashboard');\r\n      }\r\n\r\n      setSaveStatus('saved');\r\n    });\r\n\r\n    // Реактивное обновление при синхронизации новых слепков\r\n    chrome.storage.onChanged.addListener((changes, area) => {\r\n      if (area === 'local') {\r\n        if (changes.mcSavedPages && changes.mcSavedPages.newValue) {\r\n          savedPagesData = changes.mcSavedPages.newValue;\r\n          if (savedPagesData.course && savedPagesData.course.courseData) {\r\n            currentCourseData = savedPagesData.course.courseData;\r\n          }\r\n        }\r\n        if (changes.mcDashboardSnapshot && changes.mcDashboardSnapshot.newValue) {\r\n          latestSnapshot = changes.mcDashboardSnapshot.newValue;\r\n          const newSnap = latestSnapshot;\r\n          if (newSnap.currentCourse) {\r\n            currentCourseData = newSnap.currentCourse;\r\n          }\r\n          if (newSnap.courses && newSnap.courses.length > 0) {\r\n            renderMockupCourses(newSnap.courses, newSnap.greeting, newSnap.initials, true, newSnap.logoHtml, newSnap.notifCount);\r\n            showToast(`⚡ Синхронизировано: ${newSnap.courses.length} курсов`);\r\n          }\r\n          if (newSnap.activePage === 'custom' || (savedPagesData && savedPagesData.custom)) {\r\n            const btnCustom = document.getElementById('btn-view-custom');\r\n            const lblCustom = document.getElementById('label-view-custom');\r\n            if (btnCustom) btnCustom.style.display = 'inline-flex';\r\n            const title = newSnap.pageTitle || (savedPagesData.custom && savedPagesData.custom.title) || 'Страница СДО';\r\n            if (lblCustom) lblCustom.textContent = title.length > 25 ? title.substring(0, 25) + '…' : title;\r\n          }\r\n          if (newSnap.activePage === 'custom') {\r\n            setActiveView('custom');\r\n          } else if (newSnap.activePage === 'course') {\r\n            setActiveView('course');\r\n          }\r\n        }\r\n      }\r\n    });\r\n  } else {\r\n    try {\r\n      const rawSettings = localStorage.getItem('mcSettings');\r\n      if (rawSettings) {\r\n        currentSettings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(rawSettings));\r\n      }\r\n      const rawSnap = localStorage.getItem('mcDashboardSnapshot');\r\n      if (rawSnap) {\r\n        latestSnapshot = JSON.parse(rawSnap);\r\n      }\r\n      const rawPages = localStorage.getItem('mcSavedPages');\r\n      if (rawPages) {\r\n        savedPagesData = JSON.parse(rawPages);\r\n      }\r\n    } catch (e) {}\r\n\r\n    // Live sync from parent window if embedded in Moodle page\r\n    if (window.parent && window.parent !== window) {\r\n      try {\r\n        const parentBrand = window.parent.document.querySelector('.navbar-brand, .site-name, [data-region=\"branding\"]');\r\n        if (parentBrand && parentBrand.innerHTML.trim()) {\r\n          const liveLogo = parentBrand.innerHTML.trim().replace(/(src|href)=\"\\/(?!\\/)/g, '$1=\"https://lms.ranepa.ru/');\r\n          if (!latestSnapshot) latestSnapshot = {};\r\n          latestSnapshot.logoHtml = liveLogo;\r\n        }\r\n        if (window.parent.mcSettings) {\r\n          currentSettings = Object.assign({}, DEFAULT_SETTINGS, window.parent.mcSettings);\r\n        }\r\n      } catch (e) {}\r\n    }\r\n\r\n    updateUIFromSettings(currentSettings);\r\n\r\n    const snap = latestSnapshot;\r\n    if (snap) {\r\n      if (snap.currentCourse) {\r\n        currentCourseData = snap.currentCourse;\r\n      } else if (savedPagesData.course && savedPagesData.course.courseData) {\r\n        currentCourseData = savedPagesData.course.courseData;\r\n      }\r\n\r\n      if (snap.courses && snap.courses.length > 0) {\r\n        renderMockupCourses(snap.courses, snap.greeting, snap.initials, true, snap.logoHtml, snap.notifCount);\r\n      } else {\r\n        renderMockupCourses(DEMO_COURSES, snap.greeting || '', snap.initials || 'БЕ', false, snap.logoHtml, snap.notifCount);\r\n      }\r\n\r\n      const isCustomSpecificPage = snap.activePage === 'custom' && snap.pageUrl && !snap.pageUrl.includes('/my') && !snap.pageUrl.includes('/course/view');\r\n      if (isCustomSpecificPage && (snap.rawHtml || (savedPagesData && savedPagesData.custom))) {\r\n        if (btnCustom) btnCustom.style.display = 'inline-flex';\r\n        const lblCustom = document.getElementById('label-view-custom');\r\n        const title = snap.pageTitle || (savedPagesData.custom && savedPagesData.custom.title) || 'Страница СДО';\r\n        if (lblCustom) lblCustom.textContent = title.length > 25 ? title.substring(0, 25) + '…' : title;\r\n      } else {\r\n        if (btnCustom) btnCustom.style.display = 'none';\r\n      }\r\n\r\n      if (snap.activePage === 'custom') {\r\n        setActiveView('custom');\r\n      } else if (snap.activePage === 'course') {\r\n        setActiveView('course');\r\n      } else {\r\n        setActiveView('dashboard');\r\n      }\r\n    } else {\r\n      renderMockupCourses(DEMO_COURSES, '', 'БЕ', false);\r\n      setActiveView('dashboard');\r\n    }\r\n\r\n    setSaveStatus('saved');\r\n  }\r\n\r\n  setupMobileNav();\r\n});\r\n\r\n// Мобильная навигация между сайдбаром и макетом\r\nfunction setupMobileNav() {\r\n  const sidebar = document.getElementById('studio-sidebar');\r\n  const preview = document.querySelector('.studio-preview-pane');\r\n  const tabSettings = document.getElementById('tab-btn-settings');\r\n  const tabPreview = document.getElementById('tab-btn-preview');\r\n  const btnBack = document.getElementById('btn-mobile-back-to-settings');\r\n\r\n  function switchMobileTab(tab) {\r\n    if (tab === 'settings') {\r\n      if (sidebar) sidebar.classList.remove('mobile-hidden');\r\n      if (preview) preview.classList.remove('mobile-active');\r\n      if (tabSettings) tabSettings.classList.add('active');\r\n      if (tabPreview) tabPreview.classList.remove('active');\r\n    } else {\r\n      if (sidebar) sidebar.classList.add('mobile-hidden');\r\n      if (preview) preview.classList.add('mobile-active');\r\n      if (tabSettings) tabSettings.classList.remove('active');\r\n      if (tabPreview) tabPreview.classList.add('active');\r\n    }\r\n  }\r\n\r\n  if (tabSettings) tabSettings.addEventListener('click', () => switchMobileTab('settings'));\r\n  if (tabPreview) tabPreview.addEventListener('click', () => switchMobileTab('preview'));\r\n  if (btnBack) btnBack.addEventListener('click', () => switchMobileTab('settings'));\r\n\r\n  // Кнопка закрытия в шапке сайдбара\r\n  const closeSidebarBtn = document.getElementById('btn-close-studio-sidebar');\r\n  if (closeSidebarBtn) {\r\n    closeSidebarBtn.addEventListener('click', (e) => {\r\n      e.preventDefault();\r\n      e.stopPropagation();\r\n      if (window.parent && window.parent !== window) {\r\n        window.parent.postMessage({ type: 'CLOSE_STUDIO_OVERLAY' }, '*');\r\n      } else {\r\n        window.close();\r\n      }\r\n    });\r\n  }\r\n}\r\n\r\n\r\n// ────────────────────────────────────────────────────────\r\n// 6. ИНТЕРАКТИВНЫЙ ЛАСТИК И ПЕРЕДВИЖЕНИЕ ЭЛЕМЕНТОВ (БЛОК 4)\r\n// ────────────────────────────────────────────────────────\r\nconst toolEraserBtn = document.getElementById('tool-eraser');\r\nconst toolMoveBtn = document.getElementById('tool-move');\r\nconst toolUndoBtn = document.getElementById('tool-undo');\r\nconst toolResetBtn = document.getElementById('tool-reset-elements');\r\nconst activeModeBanner = document.getElementById('active-mode-banner');\r\nconst mockupCanvas = document.getElementById('moodle-mockup');\r\n\r\nlet isEraserActive = false;\r\nlet isMoveActive = false;\r\nlet lastHoveredEl = null;\r\nlet moveTarget = null;\r\nlet moveStartX = 0;\r\nlet moveStartY = 0;\r\nlet initialX = 0;\r\nlet initialY = 0;\r\n\r\n// Функция точного выбора интерактивной цели: текст имеет приоритет перед всей плашкой/боксом!\r\nfunction resolveInteractiveTarget(el) {\r\n  if (!el || el === mockupCanvas) return null;\r\n\r\n  // 1. Элементы островка шапки (логотип, навигационные ссылки, колокольчик, сообщения, профиль)\r\n  const navItem = el.closest(\r\n    '.mock-brand, .navbar-brand, .mock-primary-nav .nav-item, .primary-navigation .nav-item, ' +\r\n    '.notification-badge, .mock-nav-messages, .mock-nav-profile, .user-item, .icon-item'\r\n  );\r\n  if (navItem && navItem !== mockupCanvas) {\r\n    return navItem;\r\n  }\r\n\r\n  // 2. Приоритет текста: если кликнули по тексту, заголовку, чипу, ссылке или кнопке — выбираем ТОЛЬКО его\r\n  const textOrButton = el.closest(\r\n    'h1, h2, h3, h4, h5, h6, p, .mock-page-title, .dashboard-heading, ' +\r\n    '.mc-course-title-main, .coursename, .card-title, .mc-chip, .filter-pill, ' +\r\n    '.btn, button, a, .search-btn, .search-input, .mydashboard-progress-string, .badge, .mc-pinned-badge'\r\n  );\r\n  if (textOrButton && textOrButton !== mockupCanvas) {\r\n    return textOrButton;\r\n  }\r\n\r\n  // 3. Интерактивные виджеты (поиск, сортировка, фильтры)\r\n  const widget = el.closest('.search-box, .sort-view-box, .dashboard-filters, .mc-fab-button');\r\n  if (widget && widget !== mockupCanvas) {\r\n    return widget;\r\n  }\r\n\r\n  // 4. Отдельные карточки курсов (НЕ вся плашка дашборда!)\r\n  const cardItem = el.closest('.mock-card, .dashboard-card, .list-group-item.mydashboard-list-item, .mock-course-card');\r\n  if (cardItem && cardItem !== mockupCanvas) {\r\n    return cardItem;\r\n  }\r\n\r\n  // 5. Контейнеры верхнего уровня (ТОЛЬКО если кликнули строго по пустому фону навбара или футера)\r\n  if (el.classList.contains('mock-navbar') || el.classList.contains('mock-page-footer')) {\r\n    return el;\r\n  }\r\n\r\n  return el;\r\n}\r\n\r\n// Генерация уникального или надежного CSS-селектора для элемента\r\nfunction getElementSelector(el) {\r\n  if (!el) return '';\r\n  if (el.dataset && el.dataset.moodleSelector) return el.dataset.moodleSelector;\r\n\r\n  // Точечные селекторы для элементов шапки (островка сверху):\r\n  if (el.matches && el.matches('.mock-brand, .navbar-brand, #mock-navbar-brand')) {\r\n    return '.navbar-brand, #header .navbar-brand, .mock-brand';\r\n  }\r\n  if (el.matches && el.matches('.notification-badge, .nav-notification')) {\r\n    return '#nav-notification-popover-container, .popover-region-notifications, .notification-badge';\r\n  }\r\n  if (el.matches && el.matches('.mock-nav-messages, [title=\"Сообщения\"]')) {\r\n    return '#nav-message-popover-container, .popover-region-messages, .mock-nav-messages';\r\n  }\r\n  if (el.matches && el.matches('.mock-nav-profile, .user-item, [title=\"Профиль\"]')) {\r\n    return '#usernavigation .usermenu, .usermenu, .userbutton, .userpicture, .mock-nav-profile';\r\n  }\r\n  const navItem = el.closest ? el.closest('.mock-primary-nav .nav-item, .primary-navigation .nav-item') : null;\r\n  if (navItem && navItem.parentElement) {\r\n    const idx = Array.from(navItem.parentElement.children).indexOf(navItem) + 1;\r\n    if (idx > 0) {\r\n      return `.primary-navigation .nav-item:nth-child(${idx}), .mock-primary-nav .nav-item:nth-child(${idx})`;\r\n    }\r\n  }\r\n\r\n  // Точечные селекторы для текстовых элементов:\r\n  if (el.matches && el.matches('h1, .mock-page-title')) {\r\n    return '#page-header h1, .page-header-headings h1, .page-title, .mock-page-title';\r\n  }\r\n  if (el.matches && el.matches('h2.dashboard-heading, .dashboard-heading')) {\r\n    return '.dashboard-heading, .block_myoverview h5, .block_myoverview .block-title, .block_mydashboard h5, .block_mydashboard .card-title';\r\n  }\r\n  if (el.matches && el.matches('.mc-course-title-main, .coursename')) {\r\n    return '.mc-course-title-main, .coursename, .course-info-container h3, .course-info-container h4, a[href*=\"/course/view.php\"] .multiline';\r\n  }\r\n  if (el.matches && el.matches('.mc-chip')) {\r\n    return '.mc-chip';\r\n  }\r\n  if (el.dataset && el.dataset.filterId) {\r\n    return `[data-filter-id=\"${el.dataset.filterId}\"]`;\r\n  }\r\n  if (el.matches && el.matches('.filter-pill')) {\r\n    return '.filter-pill';\r\n  }\r\n  if (el.matches && el.matches('.search-input')) {\r\n    return '.block_myoverview input, .block_mydashboard input, [data-region=\"courses-view\"] input, input[placeholder*=\"Поиск\"], .search-input';\r\n  }\r\n  if (el.matches && el.matches('.search-btn')) {\r\n    return '.block_myoverview button[type=\"submit\"], .block_mydashboard button[type=\"submit\"], [data-action=\"search\"], .search-btn';\r\n  }\r\n\r\n  for (const [mockClass, realSelector] of Object.entries(SELECTOR_ALIASES)) {\r\n    try {\r\n      if (el.matches && el.matches(mockClass)) return realSelector;\r\n    } catch (e) {}\r\n  }\r\n\r\n  // Не позволяем дочерним элементам навбара или карточки брать селектор всей шапки\r\n  const moodleParent = el.closest('[data-moodle-selector]');\r\n  if (moodleParent && moodleParent !== el && (moodleParent.classList.contains('mock-navbar') || moodleParent.classList.contains('navbar') || moodleParent.classList.contains('mock-dashboard-card'))) {\r\n    // Не берем селектор контейнера\r\n  } else if (moodleParent && moodleParent.dataset.moodleSelector) {\r\n    return moodleParent.dataset.moodleSelector;\r\n  }\r\n\r\n  for (const [mockClass, realSelector] of Object.entries(SELECTOR_ALIASES)) {\r\n    try {\r\n      if (el.closest && el.closest(mockClass)) return realSelector;\r\n    } catch (e) {}\r\n  }\r\n\r\n  if (el.id) return '#' + el.id;\r\n  if (el.classList) {\r\n    const classes = Array.from(el.classList).filter(c => !c.includes('mc-') && !c.includes('active') && !c.includes('hover'));\r\n    if (classes.length > 0) {\r\n      return '.' + classes.slice(0, 2).join('.');\r\n    }\r\n  }\r\n  return el.tagName.toLowerCase();\r\n}\r\n\r\nfunction getReadableName(sel) {\r\n  if (!sel) return 'элемент';\r\n  if (sel.includes('mock-brand') || sel.includes('navbar-brand')) return 'Логотип (герб)';\r\n  if (sel.includes('nth-child(1)')) return 'Ссылка \"Онлайн-обучение\"';\r\n  if (sel.includes('nth-child(2)')) return 'Ссылка \"Все курсы\"';\r\n  if (sel.includes('nth-child(3)')) return 'Ссылка \"Поддержка\"';\r\n  if (sel.includes('notification')) return 'Колокольчик уведомлений';\r\n  if (sel.includes('message') || sel.includes('mock-nav-messages')) return 'Иконка сообщений';\r\n  if (sel.includes('usermenu') || sel.includes('userbutton') || sel.includes('userpicture') || sel.includes('profile')) return 'Профиль пользователя';\r\n  if (sel.includes('page-header h1') || sel.includes('page-title') || sel.includes('mock-page-title')) return 'Заголовок \"Онлайн-обучение\"';\r\n  if (sel.includes('dashboard-heading') || sel.includes('block-title')) return 'Заголовок \"Дашборд\"';\r\n  if (sel.includes('mc-course-title') || sel.includes('coursename')) return 'Название курса';\r\n  if (sel.includes('chip')) return 'Бейдж/Тег курса';\r\n  if (sel.includes('all')) return 'Вкладка \"Все\"';\r\n  if (sel.includes('year')) return 'Вкладка \"Учебный год\"';\r\n  if (sel.includes('inprogress')) return 'Вкладка \"Текущие\"';\r\n  if (sel.includes('past')) return 'Вкладка \"Прошедшие\"';\r\n  if (sel.includes('future')) return 'Вкладка \"Предстоящие\"';\r\n  if (sel.includes('favourites')) return 'Вкладка \"Избранные\"';\r\n  if (sel.includes('search')) return 'Поиск курса';\r\n  if (sel.includes('sorting') || sel.includes('display') || sel.includes('sort-view')) return 'Сортировка и вид';\r\n  if (sel.includes('filter')) return 'Фильтры';\r\n  if (sel.includes('dashboard-card') || sel.includes('mock-card') || sel.includes('mydashboard-list-item')) return 'Карточка курса';\r\n  if (sel.includes('navbar') || sel.includes('header')) return 'Островок шапки';\r\n  if (sel.includes('footer')) return 'Футер';\r\n  if (sel.includes('heading') || sel.includes('title')) return 'Заголовок';\r\n  if (sel.includes('fab')) return 'Кнопка поддержки';\r\n  return sel.length > 25 ? sel.slice(0, 25) + '...' : sel;\r\n}\r\n\r\nfunction setEraserMode(enabled) {\r\n  isEraserActive = enabled;\r\n  if (isEraserActive && isMoveActive) {\r\n    setMoveMode(false);\r\n  }\r\n  if (toolEraserBtn) toolEraserBtn.classList.toggle('active', enabled);\r\n\r\n  const layerBox = document.getElementById('element-layer-controls');\r\n  if (layerBox && enabled) layerBox.style.display = 'none';\r\n\r\n  if (activeModeBanner) {\r\n    if (enabled) {\r\n      activeModeBanner.textContent = '👻 Режим ластика: кликните по элементу на макете, чтобы скрыть';\r\n      activeModeBanner.style.display = 'block';\r\n    } else if (!isMoveActive) {\r\n      activeModeBanner.style.display = 'none';\r\n    }\r\n  }\r\n\r\n  if (mockupCanvas) {\r\n    mockupCanvas.classList.toggle('mc-eraser-mode', enabled);\r\n  }\r\n\r\n  if (!enabled && lastHoveredEl) {\r\n    lastHoveredEl.classList.remove('mc-eraser-target-hover');\r\n    lastHoveredEl = null;\r\n  }\r\n}\r\n\r\nfunction setMoveMode(enabled) {\r\n  isMoveActive = enabled;\r\n  if (isMoveActive && isEraserActive) {\r\n    setEraserMode(false);\r\n  }\r\n  if (toolMoveBtn) toolMoveBtn.classList.toggle('active', enabled);\r\n\r\n  const layerBox = document.getElementById('element-layer-controls');\r\n  if (layerBox && !enabled) layerBox.style.display = 'none';\r\n\r\n  if (activeModeBanner) {\r\n    if (enabled) {\r\n      activeModeBanner.textContent = '✋ Режим перемещения: зажмите мышкой любой элемент и перетащите его';\r\n      activeModeBanner.style.display = 'block';\r\n    } else if (!isEraserActive) {\r\n      activeModeBanner.style.display = 'none';\r\n    }\r\n  }\r\n\r\n  if (mockupCanvas) {\r\n    mockupCanvas.classList.toggle('mc-move-mode', enabled);\r\n  }\r\n\r\n  if (!enabled && lastHoveredEl) {\r\n    lastHoveredEl.classList.remove('mc-move-target-hover');\r\n    lastHoveredEl = null;\r\n  }\r\n}\r\n\r\nlet selectedElementSelector = null;\r\nlet selectedElementTarget = null;\r\n\r\nfunction selectElementForTools(el) {\r\n  if (!el || el === mockupCanvas) return;\r\n  const target = resolveInteractiveTarget(el);\r\n  if (!target || target === mockupCanvas) return;\r\n\r\n  selectedElementTarget = target;\r\n  selectedElementSelector = getElementSelector(target);\r\n\r\n  const layerBox = document.getElementById('element-layer-controls');\r\n  const itemName = document.getElementById('layer-item-name');\r\n  if (layerBox && itemName) {\r\n    layerBox.style.display = 'block';\r\n    itemName.textContent = getReadableName(selectedElementSelector);\r\n  }\r\n}\r\n\r\nif (toolEraserBtn) {\r\n  toolEraserBtn.addEventListener('click', () => {\r\n    setEraserMode(!isEraserActive);\r\n  });\r\n}\r\n\r\nif (toolMoveBtn) {\r\n  toolMoveBtn.addEventListener('click', () => {\r\n    setMoveMode(!isMoveActive);\r\n  });\r\n}\r\n\r\n// Подсветка элементов при наведении в режиме ластика или перемещения\r\nif (mockupCanvas) {\r\n  mockupCanvas.addEventListener('mouseover', (e) => {\r\n    if (isMoveActive) {\r\n      if (lastHoveredEl && lastHoveredEl !== e.target) {\r\n        lastHoveredEl.classList.remove('mc-move-target-hover');\r\n      }\r\n      if (e.target && e.target !== mockupCanvas && !moveTarget) {\r\n        const candidate = resolveInteractiveTarget(e.target);\r\n        if (candidate && candidate !== mockupCanvas) {\r\n          lastHoveredEl = candidate;\r\n          lastHoveredEl.classList.add('mc-move-target-hover');\r\n        }\r\n      }\r\n      return;\r\n    }\r\n\r\n    if (!isEraserActive) return;\r\n    if (lastHoveredEl && lastHoveredEl !== e.target) {\r\n      lastHoveredEl.classList.remove('mc-eraser-target-hover');\r\n    }\r\n    if (e.target && e.target !== mockupCanvas) {\r\n      lastHoveredEl = resolveInteractiveTarget(e.target) || e.target;\r\n      lastHoveredEl.classList.add('mc-eraser-target-hover');\r\n    }\r\n  });\r\n\r\n  mockupCanvas.addEventListener('mouseout', (e) => {\r\n    if (isMoveActive && lastHoveredEl) {\r\n      lastHoveredEl.classList.remove('mc-move-target-hover');\r\n    }\r\n    if (isEraserActive && e.target && e.target.classList) {\r\n      e.target.classList.remove('mc-eraser-target-hover');\r\n    }\r\n  });\r\n\r\n  // Зажатие мыши для перемещения элемента (Drag & Drop)\r\n  mockupCanvas.addEventListener('mousedown', (e) => {\r\n    if (!isMoveActive) return;\r\n    if (e.button !== 0) return; // Только левая кнопка мыши\r\n\r\n    e.preventDefault();\r\n    e.stopPropagation();\r\n\r\n    const target = resolveInteractiveTarget(e.target);\r\n    if (!target || target === mockupCanvas) return;\r\n\r\n    moveTarget = target;\r\n    moveTarget.classList.remove('mc-move-target-hover');\r\n    moveTarget.classList.add('mc-moving');\r\n    selectElementForTools(target);\r\n\r\n    moveStartX = e.clientX;\r\n    moveStartY = e.clientY;\r\n\r\n    initialX = 0;\r\n    initialY = 0;\r\n    const transform = window.getComputedStyle(moveTarget).transform;\r\n    if (transform && transform !== 'none') {\r\n      const mat = transform.match(/^matrix\\((.+)\\)$/);\r\n      if (mat) {\r\n        const vals = mat[1].split(', ');\r\n        initialX = parseFloat(vals[4]) || 0;\r\n        initialY = parseFloat(vals[5]) || 0;\r\n      }\r\n    }\r\n\r\n    moveTarget.style.setProperty('position', 'relative', 'important');\r\n    moveTarget.style.setProperty('z-index', '9999', 'important');\r\n    if (moveTarget.matches('h1, h2, h3, h4, h5, h6, .dashboard-heading, .mock-page-title, p, span, a')) {\r\n      moveTarget.style.setProperty('display', 'inline-block', 'important');\r\n      moveTarget.style.setProperty('width', 'fit-content', 'important');\r\n    }\r\n\r\n    // Устраняем \"коробку\" / обрезку: предки не должны скрывать overflow во время перетаскивания\r\n    let p = moveTarget.parentElement;\r\n    while (p && p !== mockupCanvas && p !== document.body) {\r\n      p.style.setProperty('overflow', 'visible', 'important');\r\n      p = p.parentElement;\r\n    }\r\n\r\n    const onMouseMove = (ev) => {\r\n      if (!moveTarget) return;\r\n      ev.preventDefault();\r\n      const dx = ev.clientX - moveStartX;\r\n      const dy = ev.clientY - moveStartY;\r\n      moveTarget.style.setProperty('transform', `translate(${initialX + dx}px, ${initialY + dy}px)`, 'important');\r\n    };\r\n\r\n    const onMouseUp = (ev) => {\r\n      document.removeEventListener('mousemove', onMouseMove, true);\r\n      document.removeEventListener('mouseup', onMouseUp, true);\r\n\r\n      if (!moveTarget) return;\r\n      const dx = ev.clientX - moveStartX;\r\n      const dy = ev.clientY - moveStartY;\r\n      const finalX = Math.round(initialX + dx);\r\n      const finalY = Math.round(initialY + dy);\r\n\r\n      moveTarget.classList.remove('mc-moving');\r\n\r\n      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {\r\n        const selector = getElementSelector(moveTarget);\r\n        if (!currentSettings.movedElements) currentSettings.movedElements = {};\r\n        currentSettings.movedElements[selector] = { x: finalX, y: finalY };\r\n        moveTarget.dataset.studioMoved = 'true';\r\n        setSaveStatus('unsaved');\r\n        broadcastLiveToMoodle();\r\n        showToast(`✋ Перемещен элемент: ${getReadableName(selector)} (${finalX}px, ${finalY}px)`);\r\n      }\r\n\r\n      moveTarget = null;\r\n    };\r\n\r\n    document.addEventListener('mousemove', onMouseMove, true);\r\n    document.addEventListener('mouseup', onMouseUp, true);\r\n  }, true);\r\n\r\n  // Клик для скрытия элемента в режиме ластика\r\n  mockupCanvas.addEventListener('click', (e) => {\r\n    if (isMoveActive) {\r\n      e.preventDefault();\r\n      e.stopPropagation();\r\n      return;\r\n    }\r\n    if (!isEraserActive) return;\r\n    e.preventDefault();\r\n    e.stopPropagation();\r\n\r\n    const target = e.target;\r\n    if (!target || target === mockupCanvas) return;\r\n\r\n    target.classList.remove('mc-eraser-target-hover');\r\n\r\n    const block = resolveInteractiveTarget(target) || target;\r\n    const selector = getElementSelector(block);\r\n\r\n    if (!currentSettings.hiddenSelectors) currentSettings.hiddenSelectors = [];\r\n    if (!currentSettings.hiddenSelectors.includes(selector)) {\r\n      currentSettings.hiddenSelectors.push(selector);\r\n    }\r\n\r\n    block.style.display = 'none';\r\n    block.dataset.studioHidden = 'true';\r\n\r\n    setSaveStatus('unsaved');\r\n    broadcastLiveToMoodle();\r\n    showToast(`👻 Скрыт элемент: ${getReadableName(selector)}`);\r\n  }, true);\r\n}\r\n\r\n// Кнопка «Вернуть» (Undo)\r\nif (toolUndoBtn) {\r\n  toolUndoBtn.addEventListener('click', () => {\r\n    const movedKeys = currentSettings.movedElements ? Object.keys(currentSettings.movedElements) : [];\r\n    if (isMoveActive && movedKeys.length > 0) {\r\n      const lastKey = movedKeys.pop();\r\n      delete currentSettings.movedElements[lastKey];\r\n      applyThemeToMockup(currentSettings);\r\n      setSaveStatus('unsaved');\r\n      broadcastLiveToMoodle();\r\n      showToast(`↩️ Сброшена позиция: ${getReadableName(lastKey)}`);\r\n      return;\r\n    }\r\n\r\n    if (currentSettings.hiddenSelectors && currentSettings.hiddenSelectors.length > 0) {\r\n      const removed = currentSettings.hiddenSelectors.pop();\r\n      applyThemeToMockup(currentSettings);\r\n      setSaveStatus('unsaved');\r\n      broadcastLiveToMoodle();\r\n      showToast(`↩️ Восстановлен элемент: ${getReadableName(removed)}`);\r\n    } else if (movedKeys.length > 0) {\r\n      const lastKey = movedKeys.pop();\r\n      delete currentSettings.movedElements[lastKey];\r\n      applyThemeToMockup(currentSettings);\r\n      setSaveStatus('unsaved');\r\n      broadcastLiveToMoodle();\r\n      showToast(`↩️ Сброшена позиция: ${getReadableName(lastKey)}`);\r\n    } else {\r\n      showToast('Нет действий для отмены');\r\n    }\r\n  });\r\n}\r\n\r\n// Кнопка «Сбросить всё» (Reset hidden, moved and layered elements)\r\nif (toolResetBtn) {\r\n  toolResetBtn.addEventListener('click', () => {\r\n    currentSettings.hiddenSelectors = [];\r\n    currentSettings.movedElements = {};\r\n    currentSettings.elementLayers = {};\r\n    const layerBox = document.getElementById('element-layer-controls');\r\n    if (layerBox) layerBox.style.display = 'none';\r\n    selectedElementSelector = null;\r\n    selectedElementTarget = null;\r\n\r\n    mockupCanvas.querySelectorAll('*').forEach(el => {\r\n      el.style.removeProperty('transform');\r\n      el.style.removeProperty('position');\r\n      el.style.removeProperty('z-index');\r\n      el.style.removeProperty('display');\r\n      delete el.dataset.studioMoved;\r\n      delete el.dataset.studioLayer;\r\n      delete el.dataset.studioHidden;\r\n    });\r\n\r\n    applyThemeToMockup(currentSettings);\r\n    broadcastLiveToMoodle();\r\n    saveThemeToMoodle();\r\n    showToast('🗑️ Все скрытые и перемещенные элементы сброшены!');\r\n  });\r\n}\r\n\r\n// Кнопка «На передний план» (Layer Front)\r\nconst toolLayerFront = document.getElementById('tool-layer-front');\r\nif (toolLayerFront) {\r\n  toolLayerFront.addEventListener('click', () => {\r\n    if (!selectedElementSelector) {\r\n      showToast('Сначала зажмите или выберите элемент на макете');\r\n      return;\r\n    }\r\n    if (!currentSettings.elementLayers) currentSettings.elementLayers = {};\r\n    currentSettings.elementLayers[selectedElementSelector] = 'front';\r\n    applyThemeToMockup(currentSettings);\r\n    setSaveStatus('unsaved');\r\n    broadcastLiveToMoodle();\r\n    showToast(`🔝 ${getReadableName(selectedElementSelector)} перенесен на самый передний план!`);\r\n  });\r\n}\r\n\r\n// Кнопка «На задний план» (Layer Back)\r\nconst toolLayerBack = document.getElementById('tool-layer-back');\r\nif (toolLayerBack) {\r\n  toolLayerBack.addEventListener('click', () => {\r\n    if (!selectedElementSelector) {\r\n      showToast('Сначала зажмите или выберите элемент на макете');\r\n      return;\r\n    }\r\n    if (!currentSettings.elementLayers) currentSettings.elementLayers = {};\r\n    currentSettings.elementLayers[selectedElementSelector] = 'back';\r\n    applyThemeToMockup(currentSettings);\r\n    setSaveStatus('unsaved');\r\n    broadcastLiveToMoodle();\r\n    showToast(`🔽 ${getReadableName(selectedElementSelector)} перенесен на задний план`);\r\n  });\r\n}\r\n\r\n// Кнопка «Сбросить этот элемент» (Reset Selected Element)\r\nconst toolResetSelected = document.getElementById('tool-reset-selected');\r\nif (toolResetSelected) {\r\n  toolResetSelected.addEventListener('click', () => {\r\n    if (!selectedElementSelector) {\r\n      showToast('Сначала выберите элемент на макете');\r\n      return;\r\n    }\r\n    if (currentSettings.movedElements) {\r\n      delete currentSettings.movedElements[selectedElementSelector];\r\n    }\r\n    if (currentSettings.elementLayers) {\r\n      delete currentSettings.elementLayers[selectedElementSelector];\r\n    }\r\n    if (selectedElementTarget) {\r\n      selectedElementTarget.style.removeProperty('transform');\r\n      selectedElementTarget.style.removeProperty('position');\r\n      selectedElementTarget.style.removeProperty('z-index');\r\n      delete selectedElementTarget.dataset.studioMoved;\r\n      delete selectedElementTarget.dataset.studioLayer;\r\n    }\r\n    applyThemeToMockup(currentSettings);\r\n    setSaveStatus('unsaved');\r\n    broadcastLiveToMoodle();\r\n    showToast(`↺ Положение ${getReadableName(selectedElementSelector)} сброшено`);\r\n  });\r\n}\r\n\n</script>\r\n\n  <script>\n    if (window.parent && window.parent !== window) {\n      document.querySelectorAll('#btn-close-studio-sidebar, .btn-studio-close-header').forEach(btn => {\n        btn.addEventListener('click', (e) => {\n          e.preventDefault();\n          e.stopPropagation();\n          window.parent.postMessage({ type: 'CLOSE_STUDIO_OVERLAY' }, '*');\n        });\n      });\n      const lmsBtn = document.getElementById('btn-open-lms');\n      if (lmsBtn) {\n        const closeBtn = lmsBtn.cloneNode(true);\n        closeBtn.id = 'studio-overlay-close-btn';\n        closeBtn.innerHTML = '<i class=\"fa fa-times\"></i> Закрыть песочницу';\n        closeBtn.title = 'Закрыть песочницу и вернуться в СДО';\n        closeBtn.style.background = '#381E72';\n        closeBtn.style.color = '#D0BCFF';\n        closeBtn.style.borderColor = '#4F378B';\n        closeBtn.style.fontWeight = '700';\n        closeBtn.addEventListener('click', (e) => {\n          e.preventDefault();\n          e.stopPropagation();\n          window.parent.postMessage({ type: 'CLOSE_STUDIO_OVERLAY' }, '*');\n        });\n        lmsBtn.parentNode.replaceChild(closeBtn, lmsBtn);\n      }\n    }\n  </script>\n</body>\n\r\n</html>\r\n";
  let studioOverlay = null;

  function toggleStudio() {
    try {
      const liveBrand = document.querySelector('.navbar-brand, .site-name, [data-region="branding"]');
      if (liveBrand && liveBrand.innerHTML.trim()) {
        const liveLogo = liveBrand.innerHTML.trim().replace(new RegExp('(src|href)="/(?!/)', 'g'), '$1="https://lms.ranepa.ru/');
        let snap = {};
        try {
          const rawSnap = localStorage.getItem('mcDashboardSnapshot');
          if (rawSnap) snap = JSON.parse(rawSnap);
        } catch(e) {}
        snap.logoHtml = liveLogo;
        localStorage.setItem('mcDashboardSnapshot', JSON.stringify(snap));
      }
    } catch(e) {}

    if (studioOverlay) {
      studioOverlay.style.display = studioOverlay.style.display === 'none' ? 'block' : 'none';
      return;
    }

    studioOverlay = document.createElement('div');
    studioOverlay.id = 'mc-studio-fullscreen-overlay';
    studioOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);display:block;box-sizing:border-box;';

    const iframe = document.createElement('iframe');
    iframe.id = 'mc-studio-iframe';
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.srcdoc = fullStudioHtml;

    studioOverlay.appendChild(iframe);
    (document.body || document.documentElement).appendChild(studioOverlay);
  }

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'CLOSE_STUDIO_OVERLAY') {
      if (studioOverlay) {
        studioOverlay.style.display = 'none';
      }
    }
  });

  // 6. Floating Action Button & Menu Integration
  function createFabButton() {
    if (document.getElementById('mc-fab-studio-btn')) return;
    const fab = document.createElement('div');
    fab.id = 'mc-fab-studio-btn';
    fab.innerHTML = '🎨';
    fab.title = 'Paqa Studio • Песочница тем (Alt+S, можно перетаскивать)';
    fab.style.cssText = 'position:fixed;bottom:90px;right:30px;width:48px;height:48px;border-radius:50%;background:var(--mc-accent,#D0BCFF);color:var(--mc-accent-contrast,#381E72);display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 6px 20px rgba(0,0,0,0.35);cursor:pointer;z-index:999998;transition:transform 0.15s,box-shadow 0.15s;user-select:none;';

    let isDraggingFab = false;
    let dragStartX = 0, dragStartY = 0;
    let fabOrigX = 0, fabOrigY = 0;
    let fabMoved = false;

    fab.addEventListener('mouseenter', () => { if (!isDraggingFab) { fab.style.transform = 'scale(1.1)'; } });
    fab.addEventListener('mouseleave', () => { if (!isDraggingFab) { fab.style.transform = 'scale(1)'; } });

    fab.addEventListener('mousedown', (e) => {
      if (e.button !== 0) { return; }
      isDraggingFab = true;
      fabMoved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = fab.getBoundingClientRect();
      fabOrigX = rect.left;
      fabOrigY = rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDraggingFab) { return; }
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        fabMoved = true;
      }
      fab.style.bottom = 'auto';
      fab.style.right = 'auto';
      fab.style.left = (fabOrigX + dx) + 'px';
      fab.style.top = (fabOrigY + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDraggingFab = false;
      fab.style.transform = 'scale(1)';
    });

    fab.addEventListener('click', () => {
      if (fabMoved) { return; }
      toggleStudio();
    });

    (document.body || document.documentElement).appendChild(fab);
  }

  if (document.body) { createFabButton(); }
  else { document.addEventListener('DOMContentLoaded', createFabButton); }

  // Hotkey Alt+S to toggle Studio
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 's' || e.key === 'ы' || e.code === 'KeyS')) {
      e.preventDefault();
      toggleStudio();
    }
  });

  // Tampermonkey Menu Command
  if (typeof GM_registerMenuCommand === 'function') {
    try {
      GM_registerMenuCommand('🎨 Paqa Studio (Песочница тем)', () => {
        toggleStudio();
      });
    } catch(e){}
  }

})();
