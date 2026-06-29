(function () {
  function getSearchParams() {
    var params = new URLSearchParams(window.location.search);
    try {
      if (window.parent && window.parent !== window) {
        var pp = new URLSearchParams(window.parent.location.search);
        pp.forEach(function (val, key) {
          if (!params.has(key)) params.set(key, val);
        });
      }
    } catch (e) {}
    return params;
  }

  function queryUser() {
    var params = getSearchParams();
    var qp = params.get('USER_NAME') || params.get('user_name') || '';
    if (qp) {
      localStorage.setItem('USER_NAME', qp);
      return qp;
    }
    return localStorage.getItem('USER_NAME') || '';
  }

  function metaContent(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el && el.content ? el.content.trim() : '';
  }

  function isPlaceholder(val) {
    if (!val) return true;
    return (
      val.indexOf('YOUR_HUB') !== -1 ||
      val.indexOf('YOUR_EAST') !== -1 ||
      val.indexOf('YOUR_WEST') !== -1 ||
      val.indexOf('%HUB_DOMAIN%') !== -1 ||
      val.indexOf('{hub_domain}') !== -1
    );
  }

  function hubDomainFromMeta() {
    var hub = metaContent('workshop-hub-domain');
    if (hub && !isPlaceholder(hub)) {
      return hub.replace(/^\./, '');
    }
    var params = getSearchParams();
    var qp = params.get('CLUSTER_DOMAIN') || params.get('HUB_DOMAIN');
    if (qp) {
      localStorage.setItem('CLUSTER_DOMAIN', qp);
      return qp.replace(/^\./, '');
    }
    var stored = localStorage.getItem('CLUSTER_DOMAIN');
    if (stored) return stored.replace(/^\./, '');
    var host = window.location.hostname || '';
    var idx = host.indexOf('.apps.');
    if (idx !== -1) {
      return host.slice(idx + 1);
    }
    var idx2 = host.indexOf('showroom-showroom.');
    if (idx2 === 0) {
      return host.slice('showroom-showroom.'.length);
    }
    if (host.indexOf('.') !== -1 && host.indexOf('github.io') === -1 && host.indexOf('localhost') === -1) {
      var parts = host.split('.');
      if (parts.length >= 3) {
        return 'apps.' + parts.slice(1).join('.');
      }
    }
    return '';
  }

  function eastDomainFromMeta(hubDomain) {
    var east = metaContent('workshop-east-domain');
    if (east && !isPlaceholder(east)) {
      return east;
    }
    var qp = getSearchParams().get('EAST_DOMAIN');
    if (qp) return qp;
    return hubDomain;
  }

  function westDomainFromMeta(hubDomain) {
    var west = metaContent('workshop-west-domain');
    if (west && !isPlaceholder(west)) {
      return west;
    }
    var qp = getSearchParams().get('WEST_DOMAIN');
    if (qp) return qp;
    return hubDomain;
  }

  function registrationUrl(hubDomain) {
    var m = metaContent('workshop-registration-url');
    if (m && !isPlaceholder(m) && m.indexOf('workshop-registration') !== -1) {
      return m.replace(/\/$/, '');
    }
    return hubDomain ? 'https://workshop-registration.' + hubDomain : '';
  }

  function replaceInText(text, hubDomain, eastDomain, westDomain, user, regUrl) {
    if (!text) return text;
    if (hubDomain) {
      text = text.replace(/YOUR_HUB_DOMAIN/g, hubDomain);
      text = text.replace(/%HUB_DOMAIN%/g, hubDomain);
      text = text.replace(/\{hub_domain\}/g, hubDomain);
    }
    if (eastDomain) {
      text = text.replace(/YOUR_EAST_DOMAIN/g, eastDomain);
      text = text.replace(/%EAST_DOMAIN%/g, eastDomain);
      text = text.replace(/\{east_domain\}/g, eastDomain);
    }
    if (westDomain) {
      text = text.replace(/YOUR_WEST_DOMAIN/g, westDomain);
      text = text.replace(/%WEST_DOMAIN%/g, westDomain);
      text = text.replace(/\{west_domain\}/g, westDomain);
    }
    var displayUser = user || 'guest (register first)';
    text = text.replace(/\{user_name\}/g, displayUser);
    text = text.replace(/%USER_NAME%/g, displayUser);
    text = text.replace(/pass:\[%USER_NAME%\]/g, displayUser);
    if (user) {
      text = text.replace(/\bguest \(register first\)/g, user);
    }
    if (regUrl) {
      text = text.replace(/%REGISTRATION_URL%/g, regUrl);
    }
    return text;
  }

  function linkifyLabTables() {
    document.querySelectorAll('table.tableblock code').forEach(function (code) {
      var t = (code.textContent || '').trim();
      if (!/^https?:\/\//.test(t)) return;
      var a = document.createElement('a');
      a.href = t;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'workshop-lab-link';
      a.textContent = t.replace(/^https?:\/\//, '');
      if (code.parentNode) code.parentNode.replaceChild(a, code);
    });
  }

  function replacePlaceholders(hubDomain, eastDomain, westDomain, user, regUrl) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      a.href = replaceInText(a.href, hubDomain, eastDomain, westDomain, user, regUrl);
    });
    document.querySelectorAll('code').forEach(function (el) {
      el.textContent = replaceInText(el.textContent, hubDomain, eastDomain, westDomain, user, regUrl);
    });
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (
        n.parentElement &&
        (n.parentElement.tagName === 'SCRIPT' || n.parentElement.tagName === 'STYLE')
      ) {
        continue;
      }
      var t = n.textContent;
      if (
        t.indexOf('YOUR_HUB') !== -1 ||
        t.indexOf('YOUR_EAST') !== -1 ||
        t.indexOf('%HUB_DOMAIN%') !== -1 ||
        t.indexOf('%EAST_DOMAIN%') !== -1 ||
        t.indexOf('{hub_domain}') !== -1 ||
        t.indexOf('{user_name}') !== -1 ||
        t.indexOf('%USER_NAME%') !== -1 ||
        (user && t.indexOf('guest (register first)') !== -1) ||
        t.indexOf('%REGISTRATION_URL%') !== -1
      ) {
        nodes.push(n);
      }
    }
    nodes.forEach(function (n) {
      n.textContent = replaceInText(n.textContent, hubDomain, eastDomain, westDomain, user, regUrl);
    });
    linkifyLabTables();
  }

  function wireQuickLinks(hubDomain, eastDomain) {
    if (!hubDomain) return;
    var links = {
      'link-console': 'https://console-openshift-console.' + hubDomain,
      'link-developer-hub': 'https://developer-hub.' + hubDomain,
      'link-gitea': 'https://gitlab.' + hubDomain,
      'link-devspaces': 'https://devspaces.' + (eastDomain || hubDomain),
      'link-openshift-ai':
        'https://rhods-dashboard-redhat-ods-applications.' + hubDomain
    };
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = links[id];
    });
  }

  function wireFooterLinks(hubDomain) {
    if (!hubDomain) return;
    var links = {
      'footer-link-skupper':
        'https://skupper-network-observer-service-interconnect.' +
        hubDomain,
      'footer-link-apis':
        'https://workshop-apis.' + hubDomain + '/httpbin/get',
      'footer-link-ai-gateway':
        'https://ai-gateway.' + hubDomain + '/v1/chat/completions',
      'footer-link-neuroface': 'https://neuroface.' + hubDomain,
      'footer-link-planb':
        'https://developer-hub.' +
        hubDomain +
        '/catalog/default/system/hybrid-mesh-shared-demos'
    };
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = links[id];
    });
  }

  function terminalBasePath() {
    var path = window.location.pathname || '/';
    var idx = path.indexOf('/en/');
    if (idx === -1) idx = path.indexOf('/es/');
    if (idx > 0) {
      return path.slice(0, idx) + '/terminal/';
    }
    return '/terminal/';
  }

  function wireTerminalPanel() {
    var toggle = document.getElementById('workshop-terminal-toggle');
    var panel = document.getElementById('workshop-terminal-panel');
    var frame = document.getElementById('workshop-terminal-frame');
    var closeBtn = document.getElementById('workshop-terminal-close');
    var newTabBtn = document.getElementById('workshop-terminal-newtab');
    if (!toggle || !panel || !frame) return;

    var terminalUrl = terminalBasePath();
    var TERMINAL_OPEN_KEY = 'workshop-terminal-open';
    var loaded = false;

    function blankFrame() {
      if (!frame || !loaded) return;
      try {
        var win = frame.contentWindow;
        if (win) {
          win.onbeforeunload = function() {};
          try { win.removeEventListener('beforeunload', win.onbeforeunload); } catch (e2) {}
        }
        frame.src = 'about:blank';
      } catch (e) {}
      loaded = false;
    }

    function setOpen(open, opts) {
      opts = opts || {};
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.classList.toggle('is-active', open);
      document.body.classList.toggle('workshop-terminal-open', open);
      if (open) {
        sessionStorage.setItem(TERMINAL_OPEN_KEY, '1');
        if (!loaded || opts.forceReload) {
          frame.src = terminalUrl;
          loaded = true;
        }
      } else {
        sessionStorage.removeItem(TERMINAL_OPEN_KEY);
        blankFrame();
      }
    }

    function reloadFrameIfOpen() {
      if (
        sessionStorage.getItem(TERMINAL_OPEN_KEY) === '1' &&
        panel.classList.contains('is-open') &&
        !loaded
      ) {
        frame.src = terminalUrl;
        loaded = true;
      }
    }

    function clearFrameUnloadGuard() {
      try {
        if (frame && frame.contentWindow) {
          frame.contentWindow.onbeforeunload = function() {};
          try { frame.contentWindow.removeEventListener('beforeunload', frame.contentWindow.onbeforeunload); } catch (e2) {}
        }
      } catch (e) {}
    }

    frame.addEventListener('load', function () {
      clearFrameUnloadGuard();
      setInterval(clearFrameUnloadGuard, 2000);
    });

    if (sessionStorage.getItem(TERMINAL_OPEN_KEY) === '1') {
      setOpen(true);
    }

    document.addEventListener('visibilitychange', function () {
      if (!panel.classList.contains('is-open')) return;
      if (document.visibilityState === 'visible' && !loaded) {
        reloadFrameIfOpen();
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if (panel.classList.contains('is-open')) {
        sessionStorage.setItem(TERMINAL_OPEN_KEY, '1');
      }
      clearFrameUnloadGuard();
    });

    window.addEventListener('pagehide', function () {
      if (panel.classList.contains('is-open')) {
        sessionStorage.setItem(TERMINAL_OPEN_KEY, '1');
      }
    });

    document.addEventListener(
      'click',
      function (e) {
        if (!panel.classList.contains('is-open')) return;
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (!href || href.charAt(0) === '#' || /^javascript:/i.test(href)) return;
        if (a.hasAttribute('download')) return;
        sessionStorage.setItem(TERMINAL_OPEN_KEY, '1');
        clearFrameUnloadGuard();
        
        // Extra guard for Antora nav links
        if (frame && frame.contentWindow) {
          frame.contentWindow.onbeforeunload = function() {};
        }
      },
      true
    );

    window.addEventListener('pageshow', function () {
      if (sessionStorage.getItem(TERMINAL_OPEN_KEY) === '1') {
        if (!panel.classList.contains('is-open')) {
          setOpen(true, { forceReload: true });
        } else {
          reloadFrameIfOpen();
        }
      }
    });

    toggle.onclick = function () {
      setOpen(!panel.classList.contains('is-open'));
    };

    if (closeBtn) {
      closeBtn.onclick = function () {
        setOpen(false);
      };
    }

    if (newTabBtn) {
      newTabBtn.onclick = function () {
        window.open(terminalUrl, '_blank', 'noopener,noreferrer');
      };
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        setOpen(false);
      }
    });
  }

  function wireRegistrationLinks(hubDomain, user) {
    var base = registrationUrl(hubDomain);
    var href = base ? base + (user ? '?USER_NAME=' + encodeURIComponent(user) : '') : '#';
    ['workshop-register-link', 'workshop-register-cta-main'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (base) {
        el.href = href;
        el.onclick = null;
      } else {
        el.href = '#';
        el.onclick = function (e) {
          e.preventDefault();
          alert('Open OpenShift Console → Hybrid Mesh AI Workshop to register.');
        };
      }
    });
    var regLink = document.getElementById('workshop-register-link');
    if (regLink) {
      regLink.style.display = user ? 'none' : '';
    }
  }

  function syncUserDisplay(user) {
    var badgeName = document.getElementById('user-badge-name');
    var badge = document.getElementById('user-badge');
    var editBtn = document.getElementById('vars-edit-btn');
    if (badgeName) badgeName.textContent = user || '';
    if (badge) {
      badge.style.display = user ? 'inline-flex' : 'none';
      badge.classList.toggle('is-registered', Boolean(user));
    }
  }

  function initUserBadge(user) {
    var badge = document.getElementById('user-badge');
    var editPanel = document.getElementById('vars-edit-panel');
    var editBtn = document.getElementById('vars-edit-btn');
    var ui = document.getElementById('user-name-input');
    var save = document.getElementById('vars-save');
    var cancelEdit = document.getElementById('vars-cancel-edit');

    syncUserDisplay(user);

    if (editPanel) editPanel.style.display = 'none';
    if (!user && ui) ui.value = '';

    if (editBtn) {
      editBtn.onclick = function () {
        if (badge) badge.style.display = 'none';
        var regLink = document.getElementById('workshop-register-link');
        if (regLink) regLink.style.display = 'none';
        editPanel.style.display = 'flex';
        if (ui) {
          ui.value = user || '';
          ui.focus();
        }
      };
    }

    if (cancelEdit) {
      cancelEdit.onclick = function () {
        editPanel.style.display = 'none';
        syncUserDisplay(user);
        var regLink = document.getElementById('workshop-register-link');
        if (regLink) regLink.style.display = user ? 'none' : '';
      };
    }

    if (save) {
      save.onclick = function () {
        var u = (ui && ui.value ? ui.value : '').trim();
        if (u) {
          localStorage.setItem('USER_NAME', u);
          var url = new URL(window.location.href);
          url.searchParams.set('USER_NAME', u);
          window.location.href = url.toString();
        }
      };
    }
  }

  function closeImageLightbox() {
    var overlay = document.getElementById('workshop-image-lightbox');
    if (overlay) overlay.classList.remove('is-open');
    document.body.classList.remove('workshop-lightbox-open');
  }

  function openImageLightbox(src, alt) {
    var overlay = document.getElementById('workshop-image-lightbox');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'workshop-image-lightbox';
      overlay.className = 'workshop-image-lightbox';
      overlay.innerHTML =
        '<button type="button" class="workshop-image-lightbox-close" aria-label="Close image">&times;</button>' +
        '<figure class="workshop-image-lightbox-figure">' +
        '<img class="workshop-image-lightbox-img" alt="">' +
        '<figcaption class="workshop-image-lightbox-caption"></figcaption>' +
        '</figure>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) {
        if (
          e.target === overlay ||
          e.target.classList.contains('workshop-image-lightbox-close')
        ) {
          closeImageLightbox();
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeImageLightbox();
      });
    }
    overlay.querySelector('.workshop-image-lightbox-img').src = src;
    overlay.querySelector('.workshop-image-lightbox-img').alt = alt || '';
    overlay.querySelector('.workshop-image-lightbox-caption').textContent = alt || '';
    overlay.classList.add('is-open');
    document.body.classList.add('workshop-lightbox-open');
  }

  function wireImageLightbox() {
    document
      .querySelectorAll('.doc .imageblock img, .doc .image img, .doc .imageblock object')
      .forEach(function (img) {
        if (img.dataset.lightboxBound) return;
        img.dataset.lightboxBound = '1';
        img.classList.add('workshop-zoomable');
        if (img.tagName === 'IMG') {
          img.tabIndex = 0;
          img.setAttribute('role', 'button');
          img.setAttribute('aria-label', 'Click to enlarge image');
        }
        var open = function (e) {
          e.preventDefault();
          var src = img.currentSrc || img.src || img.getAttribute('data');
          if (src) openImageLightbox(src, img.alt || img.title || '');
        };
        img.addEventListener('click', open);
        img.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open(e);
          }
        });
      });
  }

  function fixComponentHomeLinks() {
    document.querySelectorAll('a[href$="00-index.html"]').forEach(function (a) {
      a.href = a.href.replace(/00-index\.html$/, 'index.html');
    });
    document.querySelectorAll('.nav-panel-menu .title a, .breadcrumbs a').forEach(function (a) {
      var text = (a.textContent || '').trim();
      if (text.indexOf('(English)') !== -1) {
        a.textContent = text.replace(/\s*\(English\)\s*/g, ' ').trim();
      }
    });
    document.querySelectorAll('.nav-panel-explore .components .title').forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (text.indexOf('(English)') !== -1) {
        el.textContent = text.replace(/\s*\(English\)\s*/g, ' ').trim();
      }
    });
  }

  function applyUser() {
    var user = queryUser();
    var hubDomain = hubDomainFromMeta();
    var eastDomain = eastDomainFromMeta(hubDomain);
    var westDomain = westDomainFromMeta(hubDomain);
    var regUrl = registrationUrl(hubDomain);

    if (hubDomain) {
      localStorage.setItem('CLUSTER_DOMAIN', hubDomain);
    }

    replacePlaceholders(hubDomain, eastDomain, westDomain, user, regUrl);
    wireQuickLinks(hubDomain, eastDomain);
    wireFooterLinks(hubDomain);
    wireTerminalPanel();
    wireRegistrationLinks(hubDomain, user);
    initUserBadge(user);
    fixComponentHomeLinks();
    wireImageLightbox();

    if (hubDomain) {
      var regMeta = document.querySelector('meta[name="workshop-registration-url"]');
      if (
        regMeta &&
        (isPlaceholder(regMeta.content) || regMeta.content.indexOf('workshop-registration') === -1)
      ) {
        regMeta.content = 'https://workshop-registration.' + hubDomain;
      }
      var hubMeta = document.querySelector('meta[name="workshop-hub-domain"]');
      if (hubMeta && isPlaceholder(hubMeta.content)) {
        hubMeta.content = hubDomain;
      }
      var eastMeta = document.querySelector('meta[name="workshop-east-domain"]');
      if (eastMeta && isPlaceholder(eastMeta.content)) {
        eastMeta.content = eastDomain;
      }
      var westMeta = document.querySelector('meta[name="workshop-west-domain"]');
      if (westMeta && isPlaceholder(westMeta.content)) {
        westMeta.content = westDomain;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyUser);
  } else {
    applyUser();
  }
})();
