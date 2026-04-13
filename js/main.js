/* ============================================================
   MAIN.JS — The Corpus
   Shared utilities used across all pages:
   Theme, toast notifications, lazy images, tooltips,
   active nav detection, back to top, page transitions,
   copy to clipboard, keyboard shortcuts, error handling
   ============================================================ */


/* ============================================================
   1. UTILITIES
   ============================================================ */

const Utils = {

  /* --- Debounce --- */
  debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /* --- Throttle --- */
  throttle(fn, limit = 100) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        fn(...args);
      }
    };
  },

  /* --- Select single element --- */
  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  /* --- Select all elements --- */
  $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  },

  /* --- Check if element is in viewport --- */
  isInViewport(el, offset = 0) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top    <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
      rect.bottom >= 0 - offset &&
      rect.left   <= (window.innerWidth  || document.documentElement.clientWidth)  + offset &&
      rect.right  >= 0 - offset
    );
  },

  /* --- Format date --- */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year:  'numeric',
      month: 'long',
      day:   'numeric',
    });
  },

  /* --- Truncate string --- */
  truncate(str, maxLength = 100) {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength).trimEnd() + '…';
  },

  /* --- Sanitize HTML — prevent XSS --- */
  sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /* --- Generate unique ID --- */
  generateId(prefix = 'tc') {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  },

  /* --- Get URL parameter --- */
  getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  },

  /* --- Set URL parameter without reload --- */
  setParam(key, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
  },

  /* --- Remove URL parameter --- */
  removeParam(key) {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
  },

  /* --- Storage helpers --- */
  storage: {
    get(key) {
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  },
};


/* ============================================================
   2. TOAST NOTIFICATIONS
   Usage: Toast.show('Message here', 'success' | 'error' | 'info')
   ============================================================ */

const Toast = (() => {

  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');

      Object.assign(container.style, {
        position:      'fixed',
        bottom:        '24px',
        right:         '24px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '10px',
        zIndex:        'var(--z-toast)',
        pointerEvents: 'none',
      });

      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');

    const icons = {
      success: '✓',
      error:   '✕',
      info:    'ℹ',
    };

    const colors = {
      success: 'var(--color-success)',
      error:   'var(--color-error)',
      info:    'var(--color-accent)',
    };

    Object.assign(toast.style, {
      display:         'flex',
      alignItems:      'center',
      gap:             '10px',
      padding:         '12px 16px',
      backgroundColor: 'var(--color-bg-tertiary)',
      border:          `1px solid var(--color-border)`,
      borderLeft:      `3px solid ${colors[type]}`,
      borderRadius:    'var(--radius-md)',
      color:           'var(--color-text-primary)',
      fontSize:        'var(--font-size-sm)',
      fontFamily:      'var(--font-family)',
      boxShadow:       'var(--shadow-lg)',
      pointerEvents:   'all',
      cursor:          'pointer',
      maxWidth:        '320px',
      opacity:         '0',
      transform:       'translateX(20px)',
      transition:      'opacity 0.3s ease, transform 0.3s ease',
    });

    toast.innerHTML = `
      <span style="color: ${colors[type]}; font-weight: 600; flex-shrink: 0;">
        ${icons[type]}
      </span>
      <span>${Utils.sanitizeHTML(message)}</span>
    `;

    // Click to dismiss
    toast.addEventListener('click', () => dismiss(toast));

    getContainer().appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateX(0)';
      });
    });

    // Auto dismiss
    const timer = setTimeout(() => dismiss(toast), duration);

    // Pause auto dismiss on hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => {
      setTimeout(() => dismiss(toast), 1500);
    });

    return toast;
  }

  function dismiss(toast) {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }

  return { show, dismiss };

})();


/* ============================================================
   3. LAZY IMAGE LOADING
   Loads images only when they enter the viewport
   Usage: <img data-src="image.jpg" class="lazy" alt="..." />
   ============================================================ */

function initLazyImages() {
  const lazyImages = Utils.$$('img[data-src]');
  if (!lazyImages.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        const src = img.dataset.src;
        if (!src) return;

        img.src = src;
        img.removeAttribute('data-src');
        img.classList.remove('lazy');
        img.classList.add('lazy--loaded');

        observer.unobserve(img);
      });
    },
    {
      rootMargin: '200px 0px',
      threshold:  0.01,
    }
  );

  lazyImages.forEach((img) => {
    img.classList.add('lazy');
    observer.observe(img);
  });
}


/* ============================================================
   4. BACK TO TOP BUTTON
   Appears after scrolling 400px, smooth scrolls to top
   ============================================================ */

function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.setAttribute('title', 'Back to top');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="18" height="18"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  `;

  Object.assign(btn.style, {
    position:        'fixed',
    bottom:          '24px',
    left:            '24px',
    width:           '40px',
    height:          '40px',
    borderRadius:    'var(--radius-full)',
    backgroundColor: 'var(--color-bg-tertiary)',
    border:          '1px solid var(--color-border)',
    color:           'var(--color-text-secondary)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    cursor:          'pointer',
    zIndex:          'var(--z-raised)',
    opacity:         '0',
    transform:       'translateY(10px)',
    transition:      'opacity 0.3s ease, transform 0.3s ease, background-color 0.15s ease',
    pointerEvents:   'none',
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = 'var(--color-bg-hover)';
    btn.style.color = 'var(--color-text-primary)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = 'var(--color-bg-tertiary)';
    btn.style.color = 'var(--color-text-secondary)';
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.body.appendChild(btn);

  // Show/hide on scroll
  const handleScroll = Utils.throttle(() => {
    if (window.scrollY > 400) {
      btn.style.opacity       = '1';
      btn.style.transform     = 'translateY(0)';
      btn.style.pointerEvents = 'all';
    } else {
      btn.style.opacity       = '0';
      btn.style.transform     = 'translateY(10px)';
      btn.style.pointerEvents = 'none';
    }
  }, 100);

  window.addEventListener('scroll', handleScroll, { passive: true });
}


/* ============================================================
   5. COPY TO CLIPBOARD
   Usage: add data-copy="text to copy" to any element
   ============================================================ */

function initCopyToClipboard() {
  document.addEventListener('click', async (e) => {
    const trigger = e.target.closest('[data-copy]');
    if (!trigger) return;

    const text = trigger.dataset.copy;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      Toast.show('Copied to clipboard', 'success', 2000);

      // Visual feedback on the element
      const original = trigger.textContent;
      trigger.textContent = 'Copied!';
      setTimeout(() => {
        trigger.textContent = original;
      }, 1500);

    } catch {
      Toast.show('Failed to copy', 'error', 2000);
    }
  });
}


/* ============================================================
   6. CODE BLOCK COPY BUTTON
   Adds a copy button to every <pre><code> block
   ============================================================ */

function initCodeBlockCopy() {
  const codeBlocks = Utils.$$('pre');
  if (!codeBlocks.length) return;

  codeBlocks.forEach((pre) => {
    // Make pre relatively positioned
    pre.style.position = 'relative';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', 'Copy code');

    Object.assign(copyBtn.style, {
      position:        'absolute',
      top:             '10px',
      right:           '10px',
      padding:         '4px 10px',
      fontSize:        'var(--font-size-xs)',
      fontFamily:      'var(--font-family)',
      backgroundColor: 'var(--color-bg-hover)',
      color:           'var(--color-text-secondary)',
      border:          '1px solid var(--color-border)',
      borderRadius:    'var(--radius-sm)',
      cursor:          'pointer',
      transition:      'all 0.15s ease',
      opacity:         '0',
    });

    // Show on pre hover
    pre.addEventListener('mouseenter', () => {
      copyBtn.style.opacity = '1';
    });

    pre.addEventListener('mouseleave', () => {
      copyBtn.style.opacity = '0';
    });

    copyBtn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      const text = code ? code.textContent : pre.textContent;

      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        copyBtn.style.color = 'var(--color-success)';
        copyBtn.style.borderColor = 'var(--color-success)';

        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.style.color = 'var(--color-text-secondary)';
          copyBtn.style.borderColor = 'var(--color-border)';
        }, 2000);

      } catch {
        copyBtn.textContent = 'Failed';
        copyBtn.style.color = 'var(--color-error)';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.style.color = 'var(--color-text-secondary)';
        }, 2000);
      }
    });

    pre.appendChild(copyBtn);
  });
}


/* ============================================================
   7. TOOLTIPS
   Usage: add data-tooltip="Tooltip text" to any element
   ============================================================ */

function initTooltips() {
  let tooltipEl = null;

  function createTooltip(text) {
    const tip = document.createElement('div');
    tip.id = 'tooltip';
    tip.textContent = text;
    tip.setAttribute('role', 'tooltip');

    Object.assign(tip.style, {
      position:        'fixed',
      backgroundColor: 'var(--color-bg-tertiary)',
      color:           'var(--color-text-primary)',
      fontSize:        'var(--font-size-xs)',
      fontFamily:      'var(--font-family)',
      padding:         '5px 10px',
      borderRadius:    'var(--radius-sm)',
      border:          '1px solid var(--color-border)',
      boxShadow:       'var(--shadow-md)',
      pointerEvents:   'none',
      zIndex:          'var(--z-toast)',
      whiteSpace:      'nowrap',
      opacity:         '0',
      transition:      'opacity 0.15s ease',
      maxWidth:        '200px',
    });

    document.body.appendChild(tip);
    return tip;
  }

  function positionTooltip(tip, trigger) {
    const rect     = trigger.getBoundingClientRect();
    const tipRect  = tip.getBoundingClientRect();

    let top  = rect.top  - tipRect.height - 8;
    let left = rect.left + (rect.width / 2) - (tipRect.width / 2);

    // Keep within viewport
    if (top < 8) top = rect.bottom + 8;
    if (left < 8) left = 8;
    if (left + tipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tipRect.width - 8;
    }

    tip.style.top  = `${top}px`;
    tip.style.left = `${left}px`;
  }

  document.addEventListener('mouseenter', (e) => {
    const trigger = e.target.closest('[data-tooltip]');
    if (!trigger) return;

    const text = trigger.dataset.tooltip;
    if (!text) return;

    tooltipEl = createTooltip(text);

    requestAnimationFrame(() => {
      positionTooltip(tooltipEl, trigger);
      tooltipEl.style.opacity = '1';
    });

  }, true);

  document.addEventListener('mouseleave', (e) => {
    const trigger = e.target.closest('[data-tooltip]');
    if (!trigger || !tooltipEl) return;

    tooltipEl.style.opacity = '0';
    setTimeout(() => {
      tooltipEl?.remove();
      tooltipEl = null;
    }, 150);

  }, true);
}


/* ============================================================
   8. EXTERNAL LINKS — open in new tab safely
   ============================================================ */

function initExternalLinks() {
  Utils.$$('a[href]').forEach((link) => {
    const href = link.getAttribute('href');

    // Check if external
    if (
      href &&
      href.startsWith('http') &&
      !href.includes(window.location.hostname)
    ) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');

      // Add visual indicator if not already present
      if (!link.querySelector('.ext-icon')) {
        const icon = document.createElement('span');
        icon.className = 'ext-icon';
        icon.setAttribute('aria-label', '(opens in new tab)');
        icon.style.cssText = `
          display: inline-block;
          margin-left: 3px;
          font-size: 0.75em;
          opacity: 0.6;
          vertical-align: middle;
        `;
        icon.textContent = '↗';
        link.appendChild(icon);
      }
    }
  });
}


/* ============================================================
   9. PAGE TRANSITIONS
   Smooth fade between page navigations
   ============================================================ */

function initPageTransitions() {
  // Fade in on load
  document.body.style.opacity    = '0';
  document.body.style.transition = 'opacity 0.3s ease';

  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });

  // Fade out on navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    // Skip: external, anchor, javascript, new tab
    if (
      !href ||
      href.startsWith('http') ||
      href.startsWith('#') ||
      href.startsWith('javascript') ||
      href.startsWith('mailto') ||
      href.startsWith('tel') ||
      link.target === '_blank' ||
      e.ctrlKey || e.metaKey || e.shiftKey
    ) return;

    e.preventDefault();

    document.body.style.opacity = '0';

    setTimeout(() => {
      window.location.href = href;
    }, 300);
  });
}


/* ============================================================
   10. KEYBOARD SHORTCUTS
   ============================================================ */

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {

    // Skip if user is typing in an input
    const tag = document.activeElement?.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;

    // '/' — open search
    if (e.key === '/') {
      e.preventDefault();
      const searchBtn = Utils.$('.navbar__search-btn');
      if (searchBtn) searchBtn.click();
    }

    // 'G' then 'H' — go home
    if (e.key === 'h' && e.altKey) {
      window.location.href = '/index.html';
    }

  });
}


/* ============================================================
   11. DYNAMIC FOOTER YEAR
   ============================================================ */

function initFooterYear() {
  const yearEl = Utils.$('#footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}


/* ============================================================
   12. GLOBAL ERROR HANDLER
   ============================================================ */

window.addEventListener('error', (e) => {
  console.error('Global error:', e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});


/* ============================================================
   13. PERFORMANCE — LOG LOAD TIME IN DEV
   ============================================================ */

function logPerformance() {
  if (
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) return;

  window.addEventListener('load', () => {
    const timing = performance.getEntriesByType('navigation')[0];
    if (!timing) return;

    console.groupCollapsed('%c⚡ The Corpus — Page Performance', 'color: #2997ff; font-weight: bold;');
    console.log(`DOM Content Loaded : ${Math.round(timing.domContentLoadedEventEnd)}ms`);
    console.log(`Page Load Complete : ${Math.round(timing.loadEventEnd)}ms`);
    console.log(`DNS Lookup         : ${Math.round(timing.domainLookupEnd - timing.domainLookupStart)}ms`);
    console.log(`Server Response    : ${Math.round(timing.responseEnd - timing.requestStart)}ms`);
    console.groupEnd();
  });
}


/* ============================================================
   14. EXPOSE GLOBALS
   Make Toast and Utils available to all page-specific JS files
   ============================================================ */

window.TC = {
  Utils,
  Toast,
};


/* ============================================================
   15. INIT
   ============================================================ */

function init() {
  initLazyImages();
  initBackToTop();
  initCopyToClipboard();
  initCodeBlockCopy();
  initTooltips();
  initExternalLinks();
  initPageTransitions();
  initKeyboardShortcuts();
  initFooterYear();
  logPerformance();
}

document.addEventListener('DOMContentLoaded', init);