/* UCD AI Hackathon — page behaviour. No dependencies.
   Reads window.HACKATHON (config.js) and fills every [data-cfg] slot, wires the
   register buttons, draws the stats and partner logos, runs the countdown,
   the Saturday/Sunday tabs and the mobile menu. */
(function () {
  'use strict';
  var C = window.HACKATHON || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- text slots ---- */
  $$('[data-cfg]').forEach(function (el) {
    var v = C[el.getAttribute('data-cfg')];
    if (v !== undefined && v !== null && String(v).trim() !== '') el.textContent = v;
  });

  /* ---- register buttons ---- */
  var url = (C.registerUrl || '').trim();
  $$('[data-register]').forEach(function (a) {
    if (url) {
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
    } else {
      a.textContent = 'Registration opens soon';
      a.setAttribute('aria-disabled', 'true');
      a.addEventListener('click', function (e) { e.preventDefault(); });
    }
  });

  /* ---- mail links ---- */
  var mail = (C.contactEmail || '').trim();
  $$('[data-mail]').forEach(function (a) {
    if (mail) a.href = 'mailto:' + mail + '?subject=' + encodeURIComponent(C.name || 'UCD AI Hackathon');
    else a.removeAttribute('href');
  });
  $$('[data-mail-partner]').forEach(function (a) {
    if (mail) a.href = 'mailto:' + mail + '?subject=' + encodeURIComponent((C.name || 'UCD AI Hackathon') + ': partnership');
    else a.removeAttribute('href');
  });

  /* ---- stats ---- */
  var stats = $('#stats');
  if (stats && Array.isArray(C.stats)) {
    stats.innerHTML = C.stats.map(function (s) {
      return '<div class="stat"><div class="value">' + esc(s.value) + '</div><div class="label">' + esc(s.label) + '</div></div>';
    }).join('');
  }

  /* ---- partners ---- */
  var grid = $('#partners-grid');
  if (grid) {
    var list = Array.isArray(C.partners) ? C.partners.filter(function (p) { return p && p.file; }) : [];
    if (list.length) {
      grid.className = 'partners-grid';
      grid.innerHTML = list.map(function (p) {
        var img = '<img src="' + esc(p.file) + '" alt="' + esc(p.name || '') + '" loading="lazy">';
        return p.url
          ? '<a class="partner" href="' + esc(p.url) + '" target="_blank" rel="noopener" title="' + esc(p.name || '') + '">' + img + '</a>'
          : '<div class="partner" title="' + esc(p.name || '') + '">' + img + '</div>';
      }).join('');
    } else {
      grid.className = 'partners-empty';
      grid.innerHTML = '<strong>Partners to be announced.</strong><br>Want your logo here? ' +
        (mail ? '<a href="mailto:' + esc(mail) + '?subject=' + encodeURIComponent((C.name || 'UCD AI Hackathon') + ': partnership') + '">Get in touch</a>.' : 'Get in touch.');
    }
  }

  /* ---- countdown ---- */
  var cd = $('#countdown');
  var start = C.start ? new Date(C.start) : null;
  if (cd && start && !isNaN(start.getTime())) {
    var cells = { days: $('[data-cd="days"]', cd), hours: $('[data-cd="hours"]', cd), minutes: $('[data-cd="minutes"]', cd), seconds: $('[data-cd="seconds"]', cd) };
    var tick = function () {
      var ms = start.getTime() - Date.now();
      if (ms <= 0) { cd.hidden = true; clearInterval(timer); return; }
      var s = Math.floor(ms / 1000);
      cells.days.textContent = Math.floor(s / 86400);
      cells.hours.textContent = pad(Math.floor(s % 86400 / 3600));
      cells.minutes.textContent = pad(Math.floor(s % 3600 / 60));
      cells.seconds.textContent = pad(s % 60);
      cd.hidden = false;
    };
    var timer = setInterval(tick, 1000);
    tick();
  }

  /* ---- programme tabs ---- */
  var tabs = $$('.tab');
  tabs.forEach(function (tab, i) {
    var select = function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    };
    tab.addEventListener('click', select);
    tab.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (j < 0 || j >= tabs.length) return;
      e.preventDefault(); tabs[j].focus(); tabs[j].click();
    });
  });

  /* ---- mobile menu ---- */
  var toggle = $('.nav-toggle'), nav = $('#nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---- footer social links ---- */
  var fl = $('#footer-links');
  if (fl) {
    if (C.linkedinUrl) fl.insertAdjacentHTML('afterbegin', '<a href="' + esc(C.linkedinUrl) + '" target="_blank" rel="noopener">LinkedIn</a>');
    if (C.instagramUrl) fl.insertAdjacentHTML('afterbegin', '<a href="' + esc(C.instagramUrl) + '" target="_blank" rel="noopener">Instagram</a>');
    if (mail) fl.insertAdjacentHTML('afterbegin', '<a href="mailto:' + esc(mail) + '">Contact</a>');
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
