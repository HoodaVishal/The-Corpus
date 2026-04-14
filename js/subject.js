/* ============================================================
   SUBJECT.JS — The Corpus
   Handles: Topic filtering, completion tracking, progress bar,
   topic search, topic reveal animations, keyboard navigation,
   sidebar stats, scroll behaviour and prefetch
   ============================================================ */


/* ============================================================
   1. DOM REFERENCES
   ============================================================ */

const subjectHero         = document.querySelector('.subject-hero');
const topicList           = document.querySelector('.topic-list');
const topicItems          = document.querySelectorAll('.topic-item');
const topicSections       = document.querySelectorAll('.topic-section');
const filterBtns          = document.querySelectorAll('.filter-btn');
const progressFill        = document.querySelector('.subject-progress__fill');
const progressCount       = document.querySelector('.subject-progress__count');
const sidebarCards        = document.querySelectorAll('.sidebar-card');
const subjectProgressBar  = document.querySelector('.subject-progress');


/* ============================================================
   2. STATE
   ============================================================ */

let currentFilter         = 'all';
let allTopicItems         = [];
let subjectKey            = '';


/* ============================================================
   3. SUBJECT KEY
   Unique key per subject for localStorage
   ============================================================ */

function getSubjectKey() {
  return `tc-subject-${window.location.pathname
    .replace(/\//g, '-')
    .replace(/^-|-$/g, '')}`;
}


/* ============================================================
   4. BUILD TOPIC ITEMS REGISTRY
   Collects all topic items with their metadata
   ============================================================ */

function buildTopicRegistry() {
  allTopicItems = [];

  topicItems.forEach((item) => {
    const href        = item.getAttribute('href') || '';
    const title       = item.querySelector('.topic-item__title')
      ?.textContent.trim() || '';
    const desc        = item.querySelector('.topic-item__desc')
      ?.textContent.trim() || '';
    const badge       = item.querySelector('.topic-item__badge')
      ?.textContent.trim().toLowerCase() || 'all';
    const numberEl    = item.querySelector('.topic-item__number');
    const number      = numberEl
      ? parseInt(numberEl.textContent.trim(), 10)
      : 0;

    // Build localStorage key for this lesson
    const lessonPath  = new URL(href, window.location.origin).pathname;
    const lessonKey   = `tc-lesson-${lessonPath
      .replace(/\//g, '-')
      .replace(/^-|-$/g, '')}`;

    const isCompleted = TC.Utils.storage.get(lessonKey) === true;

    allTopicItems.push({
      el:          item,
      href,
      title,
      desc,
      badge,
      number,
      lessonKey,
      isCompleted,
    });
  });
}


/* ============================================================
   5. COMPLETION STATE — restore from localStorage
   ============================================================ */

function restoreCompletionState() {
  allTopicItems.forEach((item) => {
    if (item.isCompleted) {
      item.el.classList.add('is-completed');

      // Update number to checkmark
      const numberEl = item.el.querySelector('.topic-item__number');
      if (numberEl) {
        numberEl.innerHTML = `
          <svg viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            width="12" height="12"
            stroke="currentColor"
            fill="none"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
        numberEl.style.color       = 'var(--color-success)';
        numberEl.style.background  = 'rgba(48, 209, 88, 0.1)';
        numberEl.style.borderColor = 'rgba(48, 209, 88, 0.3)';
      }
    }
  });
}


/* ============================================================
   6. PROGRESS BAR — calculate and render
   ============================================================ */

function updateProgressBar() {
  if (!progressFill && !progressCount) return;

  const total     = allTopicItems.length;
  if (!total) return;

  const completed = allTopicItems.filter((i) => i.isCompleted).length;
  const pct       = Math.round((completed / total) * 100);

  // Animate fill after short delay so transition is visible
  setTimeout(() => {
    if (progressFill) {
      progressFill.style.width = `${pct}%`;
    }
  }, 300);

  if (progressCount) {
    progressCount.innerHTML =
      `<strong>${completed}</strong> / ${total} completed`;
  }

  // Show progress bar only if at least one lesson started
  if (subjectProgressBar && completed > 0) {
    subjectProgressBar.style.display = 'block';
  }
}


/* ============================================================
   7. FILTER — by difficulty badge
   ============================================================ */

function applyFilter(filter) {
  currentFilter = filter;

  // Update filter button states
  filterBtns.forEach((btn) => {
    const btnFilter = btn.dataset.filter || 'all';
    btn.classList.toggle('is-active', btnFilter === filter);
  });

  let visibleCount = 0;

  allTopicItems.forEach((item) => {
    const matches =
      filter === 'all' ||
      item.badge === filter ||
      item.badge.includes(filter);

    if (matches) {
      showItem(item.el);
      visibleCount++;
    } else {
      hideItem(item.el);
    }
  });

  // Show/hide section labels based on visible items
  updateSectionVisibility();

  // Show empty state if no results
  updateEmptyState(visibleCount);
}


/* ============================================================
   8. SHOW / HIDE TOPIC ITEM — with animation
   ============================================================ */

function showItem(el) {
  el.style.display = '';

  requestAnimationFrame(() => {
    el.style.opacity   = '1';
    el.style.transform = '';
  });
}

function hideItem(el) {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(8px)';

  setTimeout(() => {
    if (el.style.opacity === '0') {
      el.style.display = 'none';
    }
  }, 250);
}


/* ============================================================
   9. SECTION VISIBILITY — hide sections with no visible items
   ============================================================ */

function updateSectionVisibility() {
  topicSections.forEach((section) => {
    const items   = section.querySelectorAll('.topic-item');
    const visible = [...items].some((item) => item.style.display !== 'none');

    section.style.display = visible ? '' : 'none';
  });
}


/* ============================================================
   10. EMPTY STATE — shown when filter returns no results
   ============================================================ */

function updateEmptyState(visibleCount) {
  let emptyEl = document.querySelector('.topic-empty-state');

  if (visibleCount === 0) {
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'topic-empty-state';

      Object.assign(emptyEl.style, {
        textAlign:  'center',
        padding:    'var(--space-16) var(--space-8)',
        color:      'var(--color-text-muted)',
        fontSize:   'var(--font-size-sm)',
        gridColumn: '1 / -1',
      });

      emptyEl.innerHTML = `
        <p style="font-size: var(--font-size-md); margin-bottom: var(--space-3);
          color: var(--color-text-secondary);">
          No topics found
        </p>
        <p>Try a different filter or
          <button
            onclick="window.TC && applyFilter('all')"
            style="color: var(--color-accent); background: none;
              border: none; cursor: pointer; font-size: inherit;
              font-family: inherit; padding: 0; text-decoration: underline;">
            view all topics
          </button>
        </p>
      `;
    }

    topicList?.appendChild(emptyEl);

  } else {
    emptyEl?.remove();
  }
}


/* ============================================================
   11. FILTER BUTTON EVENT LISTENERS
   ============================================================ */

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter || 'all';
    applyFilter(filter);
  });
});


/* ============================================================
   12. TOPIC SEARCH
   Filters topics by title or description as user types
   ============================================================ */

function initTopicSearch() {
  const searchInput = document.querySelector('.subject-search__input');
  if (!searchInput) return;

  const handleSearch = TC.Utils.debounce((query) => {
    const q = query.toLowerCase().trim();

    if (!q) {
      // Reset to current filter if search is cleared
      applyFilter(currentFilter);
      return;
    }

    // Reset filter buttons to all when searching
    filterBtns.forEach((btn) => btn.classList.remove('is-active'));

    let visibleCount = 0;

    allTopicItems.forEach((item) => {
      const matches =
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q);

      if (matches) {
        showItem(item.el);
        visibleCount++;
      } else {
        hideItem(item.el);
      }
    });

    updateSectionVisibility();
    updateEmptyState(visibleCount);

  }, 200);

  searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  // Clear on Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      applyFilter(currentFilter);
      searchInput.blur();
    }
  });
}


/* ============================================================
   13. TOPIC ITEM REVEAL — IntersectionObserver
   ============================================================ */

function initTopicReveal() {
  if (!topicItems.length) return;

  // Reset items to hidden before observing
  topicItems.forEach((item) => {
    item.style.opacity   = '0';
    item.style.transform = 'translateY(16px)';
    item.style.transition =
      'opacity 0.4s ease, transform 0.4s ease';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el    = entry.target;
        const index = [...topicItems].indexOf(el);
        const delay = Math.min(index * 40, 400);

        setTimeout(() => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        }, delay);

        observer.unobserve(el);
      });
    },
    {
      threshold:  0.05,
      rootMargin: '0px 0px -30px 0px',
    }
  );

  topicItems.forEach((item) => observer.observe(item));
}


/* ============================================================
   14. HERO PARALLAX — subtle on scroll
   ============================================================ */

let heroParallaxRAF = null;

function handleHeroParallax() {
  if (!subjectHero) return;

  if (heroParallaxRAF) return;

  heroParallaxRAF = requestAnimationFrame(() => {
    const scrollY   = window.scrollY;
    const maxScroll = subjectHero.offsetHeight;

    if (scrollY <= maxScroll) {
      const gradient = subjectHero.querySelector('.subject-hero__gradient');
      if (gradient) {
        gradient.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    }

    heroParallaxRAF = null;
  });
}


/* ============================================================
   15. PREFETCH LESSON PAGES ON HOVER
   ============================================================ */

function initPrefetch() {
  if (!document.createElement('link').relList?.supports?.('prefetch')) return;

  const prefetched = new Set();

  topicItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const href = item.getAttribute('href');
      if (!href || prefetched.has(href)) return;

      const link = document.createElement('link');
      link.rel   = 'prefetch';
      link.href  = href;
      document.head.appendChild(link);

      prefetched.add(href);
    });
  });
}


/* ============================================================
   16. KEYBOARD NAVIGATION — topic items
   ============================================================ */

function initTopicKeyboard() {
  topicItems.forEach((item) => {
    item.setAttribute('tabindex', '0');

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }

      // Arrow key navigation between items
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const visibleItems = [...topicItems].filter(
          (i) => i.style.display !== 'none'
        );
        const idx  = visibleItems.indexOf(item);
        const next = visibleItems[idx + 1];
        if (next) next.focus();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const visibleItems = [...topicItems].filter(
          (i) => i.style.display !== 'none'
        );
        const idx  = visibleItems.indexOf(item);
        const prev = visibleItems[idx - 1];
        if (prev) prev.focus();
      }
    });
  });
}


/* ============================================================
   17. SIDEBAR STATS — update dynamically
   ============================================================ */

function updateSidebarStats() {
  const total     = allTopicItems.length;
  const completed = allTopicItems.filter((i) => i.isCompleted).length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update any [data-stat] elements in sidebar
  const statTotal     = document.querySelector('[data-stat="total"]');
  const statCompleted = document.querySelector('[data-stat="completed"]');
  const statPct       = document.querySelector('[data-stat="pct"]');
  const statRemaining = document.querySelector('[data-stat="remaining"]');

  if (statTotal)     statTotal.textContent     = total;
  if (statCompleted) statCompleted.textContent = completed;
  if (statPct)       statPct.textContent       = `${pct}%`;
  if (statRemaining) statRemaining.textContent = total - completed;
}


/* ============================================================
   18. CONTINUE BUTTON — jump to first incomplete lesson
   ============================================================ */

function initContinueBtn() {
  const continueBtn = document.querySelector('[data-action="continue"]');
  if (!continueBtn) return;

  const firstIncomplete = allTopicItems.find((item) => !item.isCompleted);

  if (firstIncomplete) {
    continueBtn.setAttribute('href', firstIncomplete.href);
    continueBtn.textContent = allTopicItems.every((i) => i.isCompleted)
      ? 'Review from start'
      : 'Continue where you left off';
  } else {
    // All completed
    if (allTopicItems.length > 0) {
      continueBtn.setAttribute('href', allTopicItems[0].href);
      continueBtn.textContent = 'Review from start';
    }
  }
}


/* ============================================================
   19. START BUTTON — always goes to first lesson
   ============================================================ */

function initStartBtn() {
  const startBtn = document.querySelector('[data-action="start"]');
  if (!startBtn || !allTopicItems.length) return;

  startBtn.setAttribute('href', allTopicItems[0].href);
}


/* ============================================================
   20. SCROLL HANDLER — consolidated
   ============================================================ */

let scrollRAF = null;

function onScroll() {
  if (scrollRAF) return;

  scrollRAF = requestAnimationFrame(() => {
    handleHeroParallax();
    scrollRAF = null;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });


/* ============================================================
   21. FILTER KEYBOARD SHORTCUT
   Number keys 1-4 trigger filter buttons
   ============================================================ */

function initFilterShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Skip if typing in an input
    const tag = document.activeElement?.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;

    const filterMap = {
      '1': 'all',
      '2': 'beginner',
      '3': 'intermediate',
      '4': 'advanced',
    };

    if (filterMap[e.key]) {
      applyFilter(filterMap[e.key]);
    }
  });
}


/* ============================================================
   22. REDUCE MOTION
   ============================================================ */

function respectReducedMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    topicItems.forEach((item) => {
      item.style.transition = 'none';
      item.style.opacity    = '1';
      item.style.transform  = 'none';
    });
  }
}


/* ============================================================
   23. EXPOSE applyFilter globally
   So empty state button can call it inline
   ============================================================ */

window.applyFilter = applyFilter;


/* ============================================================
   24. INIT
   ============================================================ */

function init() {
  respectReducedMotion();
  subjectKey = getSubjectKey();

  buildTopicRegistry();
  restoreCompletionState();
  updateProgressBar();
  updateSidebarStats();
  initContinueBtn();
  initStartBtn();
  initTopicReveal();
  initTopicSearch();
  initTopicKeyboard();
  initPrefetch();
  initFilterShortcuts();

  // Set default filter to all
  applyFilter('all');
}

document.addEventListener('DOMContentLoaded', init);