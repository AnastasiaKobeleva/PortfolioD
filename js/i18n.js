(function () {
  'use strict';

  var STORAGE_KEY = 'site-lang';
  var DEFAULT_LANG = 'ru';
  var PAGE_TITLE_KEYS = {
    home: 'meta.homeTitle',
    about: 'meta.aboutTitle',
    projects: 'meta.projectsTitle',
    fintrack: 'meta.fintrackTitle',
    freshmart: 'meta.freshmartTitle',
    oredesign: 'meta.oredesignTitle',
    tbank: 'meta.tbankTitle'
  };

  var script = document.currentScript;
  if (!script || !script.src) {
    script = document.querySelector('script[src*="i18n.js"]');
  }
  var localesBase = (script && script.src)
    ? script.src.replace(/i18n\.js.*$/, '')
    : '/js/';

  function getLang() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ru') return stored;
    } catch (err) {
      /* private mode / blocked storage */
    }
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* ignore */
    }
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key && dict[key] != null) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (key && dict[key] != null) el.innerHTML = dict[key];
    });

    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key && dict[key] != null) el.setAttribute('title', dict[key]);
    });

    var page = document.documentElement.getAttribute('data-i18n-page');
    var titleKey = page && PAGE_TITLE_KEYS[page];
    if (titleKey && dict[titleKey] != null) {
      document.title = dict[titleKey];
    }
  }

  function labelForLang(lang) {
    return lang === 'en' ? 'EN' : 'RU';
  }

  function closeSwitch(root) {
    root.classList.remove('is-open');
    var toggle = root.querySelector('[data-lang-current]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function syncLangSwitch(lang) {
    document.querySelectorAll('[data-lang-switch]').forEach(function (root) {
      var current = root.querySelector('[data-lang-current]');
      if (current) current.textContent = labelForLang(lang);
      root.querySelectorAll('button[data-lang]').forEach(function (btn) {
        var isActive = btn.getAttribute('data-lang') === lang;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    });
  }

  function bindLangSwitch(lang) {
    document.querySelectorAll('[data-lang-switch]').forEach(function (root) {
      var toggle = root.querySelector('[data-lang-current]');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', function (event) {
          event.stopPropagation();
          var open = !root.classList.contains('is-open');
          document.querySelectorAll('[data-lang-switch]').forEach(closeSwitch);
          if (open) {
            root.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
          }
        });
      }

      root.querySelectorAll('button[data-lang]').forEach(function (btn) {
        btn.addEventListener('click', function (event) {
          event.stopPropagation();
          var next = btn.getAttribute('data-lang');
          if (next !== 'en' && next !== 'ru') return;
          if (next === lang) {
            closeSwitch(root);
            return;
          }
          setLang(next);
          location.reload();
        });
      });
    });

    document.addEventListener('click', function (event) {
      document.querySelectorAll('[data-lang-switch].is-open').forEach(function (root) {
        if (!root.contains(event.target)) closeSwitch(root);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        document.querySelectorAll('[data-lang-switch].is-open').forEach(closeSwitch);
      }
    });
  }

  function loadWebflow() {
    return new Promise(function (resolve) {
      function start() {
        var placeholder = document.querySelector('script[data-webflow-src]');
        if (!placeholder) { resolve(); return; }
        var src = placeholder.getAttribute('data-webflow-src');
        if (!src) { resolve(); return; }
        var injected = document.createElement('script');
        injected.src = src;
        injected.type = 'text/javascript';
        var done = false;
        function finish() {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve();
        }
        var timer = setTimeout(finish, 1000);
        injected.onload = finish;
        injected.onerror = finish;
        document.body.appendChild(injected);
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
      } else {
        start();
      }
    });
  }

  function clearPending() {
    document.documentElement.removeAttribute('data-i18n-pending');
  }

  function waitForIx2() {
    return new Promise(function (resolve) {
      var html = document.documentElement;
      if (html.classList.contains('w-mod-ix')) {
        resolve();
        return;
      }
      var done = false;
      var timer;
      var observer = new MutationObserver(function () {
        if (html.classList.contains('w-mod-ix')) finish();
      });
      function finish() {
        if (done) return;
        done = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve();
      }
      observer.observe(html, { attributes: true, attributeFilter: ['class'] });
      requestAnimationFrame(function () {
        requestAnimationFrame(finish);
      });
      timer = setTimeout(finish, 1000);
    });
  }

  function kickSafariLayers() {
    try {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
    } catch (e) {
      /* ignore */
    }
  }

  function isFullyHidden(el) {
    var inline = el.style.opacity;
    if (inline !== '' && parseFloat(inline) === 0) return true;
    if (inline === '') return parseFloat(window.getComputedStyle(el).opacity) === 0;
    return false;
  }

  function unstickIfHidden(el, clearTransform) {
    if (!isFullyHidden(el)) return;
    el.style.opacity = '1';
    if (clearTransform) {
      el.style.transform = 'none';
      el.style.webkitTransform = 'none';
    }
  }

  function forceVisibleIfStuck() {
    document.querySelectorAll('.full-page').forEach(function (el) {
      unstickIfHidden(el, true);
    });
    document.querySelectorAll('.navbar-wrapper').forEach(function (el) {
      unstickIfHidden(el, true);
    });
    var vh = window.innerHeight;
    document.querySelectorAll('[data-w-id]').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh) unstickIfHidden(el, true);
    });
  }

  var revealed = false;

  function revealPage(opts) {
    if (revealed) return;
    revealed = true;
    clearPending();
    kickSafariLayers();
    if (opts && opts.force) {
      requestAnimationFrame(function () {
        forceVisibleIfStuck();
      });
    }
  }

  function kickIx2() {
    try {
      if (window.Webflow && typeof window.Webflow.require === 'function') {
        var ix2 = window.Webflow.require('ix2');
        if (ix2 && typeof ix2.init === 'function') ix2.init();
      }
    } catch (e) {
      /* ignore */
    }
    kickSafariLayers();
  }

  function applyCvLinks(lang) {
    var file = lang === 'en'
      ? 'Kobeleva_Anastasia_CV_2026_EN.pdf'
      : 'Kobeleva_Anastasia_CV_2026.pdf';
    document.querySelectorAll('a[href*="Kobeleva_Anastasia_CV_2026"]').forEach(function (el) {
      var href = el.getAttribute('href');
      if (!href) return;
      el.setAttribute('href', href.replace(/Kobeleva_Anastasia_CV_2026(_EN)?\.pdf/, file));
      el.removeAttribute('download');
    });
  }

  var lang = getLang();
  document.documentElement.lang = lang;
  applyCvLinks(lang);
  syncLangSwitch(lang);
  bindLangSwitch(lang);

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      kickIx2();
      revealPage();
    }
  });

  setTimeout(function () {
    if (!document.documentElement.classList.contains('w-mod-ix')) {
      forceVisibleIfStuck();
    }
    revealPage({ force: true });
  }, 1000);

  var controller = new AbortController();
  var fetchTimeoutId = setTimeout(function () {
    controller.abort();
  }, 4000);

  var translations = fetch(localesBase + 'locales/' + lang + '.json', { signal: controller.signal })
    .then(function (response) {
      if (!response.ok) throw new Error('Failed to load locales');
      return response.json();
    })
    .then(function (dict) {
      applyTranslations(dict);
    })
    .catch(function () {
      /* Show the original HTML if JSON cannot be loaded. */
    })
    .then(function () {
      clearTimeout(fetchTimeoutId);
    });

  Promise.all([translations, loadWebflow()])
    .then(function () {
      return waitForIx2();
    })
    .then(revealPage)
    .catch(revealPage);
})();
