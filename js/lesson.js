/* ============================================================
   LESSON.JS — The Corpus
   Handles: Reading progress, Table of contents generation,
   TOC active highlight, Mobile nav drawer, Mark as complete,
   Code block copy, Lesson progress tracking, Keyboard nav,
   Estimated read time, Scroll to heading
   ============================================================ */


/* ============================================================
   1. DOM REFERENCES
   ============================================================ */

const lessonLayout        = document.querySelector('.lesson-layout');
const lessonMain          = document.querySelector('.lesson-main');
const lessonBody          = document.querySelector('.lesson-body');
const lessonNav           = document.querySelector('.lesson-nav');
const lessonNavMobile     = document.querySelector('.lesson-nav--mobile');
const mobileNavToggle     = document.querySelector('.lesson-mobile-nav-toggle');
const tocContainer        = document.querySelector('.lesson-toc__list');
const tocCompleteBtn      = document.querySelector('.lesson-toc__complete-btn');
const progressFill        = document.querySelector('.lesson-reading-progress__fill');
const navProgressFill     = document.querySelector('.lesson-nav__progress-fill');
const navProgressPct      = document.querySelector('.lesson-nav__progress-pct');
const lessonNavItems      = document.querySelectorAll('.lesson-nav__item');


/* ============================================================
   2. STATE
   ============================================================ */

let isMobileNavOpen       = false;
let tocHeadings           = [];
let readingProgressRAF    = null;
let tocObserver           = null;
let currentLessonKey      = '';


/* ============================================================
   3. LESSON KEY
   Unique key per lesson for localStorage tracking
   ============================================================ */

function getLessonKey() {
  return `tc-lesson-${window.location.pathname
    .replace(/\//g, '-')
    .replace(/^-|-$/g, '')}`;
}


/* ============================================================
   4. READING PROGRESS BAR
   Thin colored bar below navbar showing scroll %
   ============================================================ */

function updateReadingProgress() {
  if (!progressFill) return;

  const scrollTop    = window.scrollY;
  const mainTop      = lessonMain
    ? lessonMain.getBoundingClientRect().top + window.scrollY
    : 0;
  const mainHeight   = lessonMain
    ? lessonMain.offsetHeight
    : document.documentElement.scrollHeight;
  const viewHeight   = window.innerHeight;

  const scrollable   = mainHeight - viewHeight;
  const scrolled     = scrollTop - mainTop;
  const progress     = scrollable > 0
    ? Math.min(Math.max((scrolled / scrollable) * 100, 0), 100)
    : 0;

  progressFill.style.width = `${progress}%`;
}


/* ============================================================
   5. TABLE OF CONTENTS — AUTO GENERATE
   Scans lesson body for h2 and h3 headings and builds TOC
   ============================================================ */

function generateTOC() {
  if (!tocContainer || !lessonBody) return;

  const headings = lessonBody.querySelectorAll('h2, h3');
  if (!headings.length) return;

  tocHeadings = [];
  tocContainer.innerHTML = '';

  headings.forEach((heading, index) => {
    // Generate ID if missing
    if (!heading.id) {
      heading.id = heading.textContent
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);

      // Ensure uniqueness
      if (document.querySelectorAll(`#${heading.id}`).length > 1) {
        heading.id = `${heading.id}-${index}`;
      }
    }

    tocHeadings.push({
      id:    heading.id,
      text:  heading.textContent.trim(),
      level: heading.tagName.toLowerCase(),
      el:    heading,
    });

    const link = document.createElement('a');
    link.href      = `#${heading.id}`;
    link.className = `lesson-toc__item${heading.tagName === 'H3'
      ? ' lesson-toc__item--sub'
      : ''}`;
    link.textContent = heading.textContent.trim();
    link.dataset.id  = heading.id;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToHeading(heading);
    });

    tocContainer.appendChild(link);
  });
}


/* ============================================================
   6. SCROLL TO HEADING — accounts for fixed navbar
   ============================================================ */

function scrollToHeading(heading) {
  const navbarHeight = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--navbar-height'),
    10
  ) || 44;

  const extraOffset = 24;
  const top = heading.getBoundingClientRect().top
    + window.scrollY
    - navbarHeight
    - extraOffset;

  window.scrollTo({ top, behavior: 'smooth' });
}


/* ============================================================
   7. TOC ACTIVE HIGHLIGHT — IntersectionObserver
   Highlights TOC item as its heading enters the viewport
   ============================================================ */

function initTOCObserver() {
  if (!tocHeadings.length) return;

  const tocLinks = tocContainer
    ? tocContainer.querySelectorAll('.lesson-toc__item')
    : [];

  if (!tocLinks.length) return;

  tocObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id   = entry.target.id;
        const link = tocContainer.querySelector(
          `[data-id="${id}"]`
        );

        if (!link) return;

        if (entry.isIntersecting) {
          // Remove active from all
          tocLinks.forEach((l) => l.classList.remove('is-active'));
          // Set active on current
          link.classList.add('is-active');
        }
      });
    },
    {
      rootMargin: `-${(parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--navbar-height'),
        10
      ) || 44) + 16}px 0px -70% 0px`,
      threshold: 0,
    }
  );

  tocHeadings.forEach(({ el }) => {
    tocObserver.observe(el);
  });
}


/* ============================================================
   8. MOBILE NAV DRAWER — open / close
   ============================================================ */

function openMobileNav() {
  isMobileNavOpen = true;

  if (lessonNavMobile) {
    lessonNavMobile.classList.add('is-open');
    lessonNavMobile.style.display = 'block';
  }

  if (mobileNavToggle) {
    mobileNavToggle.setAttribute('aria-expanded', 'true');
  }

  document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
  isMobileNavOpen = false;

  if (lessonNavMobile) {
    lessonNavMobile.classList.remove('is-open');
    setTimeout(() => {
      if (!isMobileNavOpen) {
        lessonNavMobile.style.display = 'none';
      }
    }, 400);
  }

  if (mobileNavToggle) {
    mobileNavToggle.setAttribute('aria-expanded', 'false');
  }

  document.body.style.overflow = '';
}

function toggleMobileNav() {
  if (isMobileNavOpen) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
}


/* ============================================================
   9. MOBILE NAV — EVENT LISTENERS
   ============================================================ */

if (mobileNavToggle) {
  mobileNavToggle.addEventListener('click', toggleMobileNav);
}

// Close on backdrop click
if (lessonNavMobile) {
  lessonNavMobile.addEventListener('click', (e) => {
    if (e.target === lessonNavMobile) {
      closeMobileNav();
    }
  });
}

// Close on nav item click
document.querySelectorAll('.lesson-nav--mobile .lesson-nav__item')
  .forEach((item) => {
    item.addEventListener('click', () => closeMobileNav());
  });


/* ============================================================
   10. ACTIVE NAV ITEM — highlight current lesson in sidebar
   ============================================================ */

function setActiveNavItem() {
  const currentPath = window.location.pathname;

  lessonNavItems.forEach((item) => {
    const href = item.getAttribute('href');
    if (!href) return;

    const itemPath = new URL(href, window.location.origin).pathname;

    if (itemPath === currentPath) {
      item.classList.add('is-active');
      item.setAttribute('aria-current', 'page');

      // Scroll active item into view in sidebar
      setTimeout(() => {
        item.scrollIntoView({
          block:    'nearest',
          behavior: 'smooth',
        });
      }, 300);
    }
  });
}


/* ============================================================
   11. MARK AS COMPLETE
   Saves completion state to localStorage
   ============================================================ */

function initMarkComplete() {
  if (!tocCompleteBtn) return;

  currentLessonKey = getLessonKey();
  const isCompleted = TC.Utils.storage.get(currentLessonKey);

  // Restore completed state on load
  if (isCompleted) {
    setCompletedState();
  }

  tocCompleteBtn.addEventListener('click', () => {
    if (tocCompleteBtn.classList.contains('is-done')) return;

    TC.Utils.storage.set(currentLessonKey, true);
    setCompletedState();
    updateSidebarCompletion();
    TC.Toast.show('Lesson marked as complete!', 'success');
  });
}

function setCompletedState() {
  if (!tocCompleteBtn) return;

  tocCompleteBtn.classList.add('is-done');
  tocCompleteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Completed
  `;
}


/* ============================================================
   12. UPDATE SIDEBAR COMPLETION
   Marks current lesson as completed in the left nav
   ============================================================ */

function updateSidebarCompletion() {
  const currentPath = window.location.pathname;

  lessonNavItems.forEach((item) => {
    const href = item.getAttribute('href');
    if (!href) return;

    const itemPath = new URL(href, window.location.origin).pathname;
    if (itemPath !== currentPath) return;

    item.classList.add('is-completed');

    // Swap number for checkmark
    const checkEl = item.querySelector('.lesson-nav__item-check');
    if (checkEl) {
      checkEl.style.opacity = '1';
    }
  });

  updateNavProgress();
}


/* ============================================================
   13. NAV PROGRESS — calculate % of subject completed
   ============================================================ */

function updateNavProgress() {
  if (!navProgressFill && !navProgressPct) return;

  const allItems    = document.querySelectorAll('.lesson-nav__item[href]');
  const totalCount  = allItems.length;
  if (!totalCount) return;

  let completedCount = 0;

  allItems.forEach((item) => {
    const href = item.getAttribute('href');
    if (!href) return;

    const itemPath = new URL(href, window.location.origin).pathname;
    const key = `tc-lesson-${itemPath
      .replace(/\//g, '-')
      .replace(/^-|-$/g, '')}`;

    if (TC.Utils.storage.get(key)) {
      completedCount++;
      item.classList.add('is-completed');

      const checkEl = item.querySelector('.lesson-nav__item-check');
      if (checkEl) checkEl.style.opacity = '1';
    }
  });

  const pct = Math.round((completedCount / totalCount) * 100);

  if (navProgressFill) {
    navProgressFill.style.width = `${pct}%`;
  }

  if (navProgressPct) {
    navProgressPct.textContent = `${pct}%`;
  }

  const progressText = document.querySelector('.lesson-nav__progress-text');
  if (progressText) {
    progressText.textContent = `${completedCount} of ${totalCount} completed`;
  }
}


/* ============================================================
   14. CODE BLOCK — COPY BUTTON
   Injects copy button into every .code-block__header
   ============================================================ */

function initCodeBlockCopy() {
  const codeBlocks = document.querySelectorAll('.code-block__copy');
  if (!codeBlocks.length) return;

  codeBlocks.forEach((copyBtn) => {
    copyBtn.addEventListener('click', async () => {
      const pre  = copyBtn.closest('pre');
      const code = pre?.querySelector('code');
      if (!code) return;

      const text = code.textContent.trim();

      try {
        await navigator.clipboard.writeText(text);

        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('is-copied');

        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('is-copied');
        }, 2000);

      } catch {
        copyBtn.textContent = 'Failed';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      }
    });
  });
}


/* ============================================================
   15. ESTIMATED READ TIME
   Calculates and injects read time into lesson header meta
   ============================================================ */

function initReadTime() {
  if (!lessonBody) return;

  const text      = lessonBody.textContent || '';
  const wordCount = text.trim().split(/\s+/).length;
  const minutes   = Math.max(1, Math.ceil(wordCount / 200));

  const readTimeEl = document.querySelector('[data-read-time]');
  if (readTimeEl) {
    readTimeEl.textContent = `${minutes} min read`;
  }
}


/* ============================================================
   16. HEADING ANCHOR LINKS
   Adds a clickable # anchor to every h2 and h3 on hover
   ============================================================ */

function initHeadingAnchors() {
  if (!lessonBody) return;

  const headings = lessonBody.querySelectorAll('h2, h3, h4');

  headings.forEach((heading) => {
    if (!heading.id) return;

    heading.style.position = 'relative';
    heading.style.cursor   = 'pointer';

    const anchor = document.createElement('a');
    anchor.href      = `#${heading.id}`;
    anchor.className = 'heading-anchor';
    anchor.setAttribute('aria-label', `Link to ${heading.textContent}`);
    anchor.textContent = '#';

    Object.assign(anchor.style, {
      position:   'absolute',
      left:       '-1.4em',
      top:        '50%',
      transform:  'translateY(-50%)',
      fontSize:   '0.8em',
      color:      'var(--color-text-muted)',
      opacity:    '0',
      transition: 'opacity 0.15s ease',
      fontWeight: '400',
      textDecoration: 'none',
    });

    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToHeading(heading);
      // Update URL hash
      history.pushState(null, null, `#${heading.id}`);
    });

    heading.appendChild(anchor);

    heading.addEventListener('mouseenter', () => {
      anchor.style.opacity = '1';
    });

    heading.addEventListener('mouseleave', () => {
      anchor.style.opacity = '0';
    });
  });
}


/* ============================================================
   17. SCROLL TO HASH — on page load
   If URL has a #hash, scroll to it after page loads
   ============================================================ */

function initScrollToHash() {
  if (!window.location.hash) return;

  const id = window.location.hash.slice(1);
  const target = document.getElementById(id);
  if (!target) return;

  // Delay to let layout settle
  setTimeout(() => {
    scrollToHeading(target);
  }, 500);
}


/* ============================================================
   18. KEYBOARD NAVIGATION
   Arrow keys navigate between prev/next lessons
   ============================================================ */

function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {

    // Skip if typing
    const tag = document.activeElement?.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;

    // Left arrow — previous lesson
    if (e.key === 'ArrowLeft' && e.altKey) {
      e.preventDefault();
      const prevBtn = document.querySelector('.lesson-nav-btn--prev');
      if (prevBtn && prevBtn.href) {
        window.location.href = prevBtn.href;
      }
    }

    // Right arrow — next lesson
    if (e.key === 'ArrowRight' && e.altKey) {
      e.preventDefault();
      const nextBtn = document.querySelector('.lesson-nav-btn--next');
      if (nextBtn && nextBtn.href) {
        window.location.href = nextBtn.href;
      }
    }

    // 'M' — toggle mobile nav
    if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
      if (window.innerWidth <= 1024) {
        toggleMobileNav();
      }
    }

    // Escape — close mobile nav
    if (e.key === 'Escape' && isMobileNavOpen) {
      closeMobileNav();
    }
  });
}


/* ============================================================
   19. SCROLL HANDLER — consolidated
   ============================================================ */

let scrollRAF = null;

function onScroll() {
  if (scrollRAF) return;

  scrollRAF = requestAnimationFrame(() => {
    updateReadingProgress();
    scrollRAF = null;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });


/* ============================================================
   20. RESIZE HANDLER
   ============================================================ */

const onResize = TC.Utils.debounce(() => {
  // Close mobile nav on resize to desktop
  if (window.innerWidth > 1024 && isMobileNavOpen) {
    closeMobileNav();
  }
}, 200);

window.addEventListener('resize', onResize, { passive: true });


/* ============================================================
   21. INJECT READING PROGRESS BAR
   Creates the thin progress bar element below the navbar
   ============================================================ */

function injectReadingProgressBar() {
  if (document.querySelector('.lesson-reading-progress')) return;

  const bar = document.createElement('div');
  bar.className = 'lesson-reading-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<div class="lesson-reading-progress__fill"></div>';
  document.body.appendChild(bar);
}


/* ============================================================
   22. LAZY LOAD IMAGES IN LESSON BODY
   ============================================================ */

function initLessonImages() {
  if (!lessonBody) return;

  const images = lessonBody.querySelectorAll('img');

  images.forEach((img) => {
    // Add loading lazy if not set
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }

    // Add decoding async
    img.setAttribute('decoding', 'async');

    // Handle broken images
    img.addEventListener('error', () => {
      img.style.display = 'none';
    });
  });
}


/* ============================================================
   23. EXTERNAL LINKS IN LESSON BODY
   Open all external links in new tab
   ============================================================ */

function initLessonLinks() {
  if (!lessonBody) return;

  lessonBody.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');

    if (
      href &&
      href.startsWith('http') &&
      !href.includes(window.location.hostname)
    ) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel',    'noopener noreferrer');
    }
  });
}


/* ============================================================
   24. REDUCE MOTION
   ============================================================ */

function respectReducedMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-fast',   '0s');
    document.documentElement.style.setProperty('--transition-base',   '0s');
    document.documentElement.style.setProperty('--transition-slow',   '0s');
    document.documentElement.style.setProperty('--transition-slower', '0s');
  }
}


/* ============================================================
   25. INIT
   ============================================================ */

function init() {
  respectReducedMotion();
  injectReadingProgressBar();
  generateTOC();
  initTOCObserver();
  setActiveNavItem();
  initMarkComplete();
  updateNavProgress();
  initCodeBlockCopy();
  initReadTime();
  initHeadingAnchors();
  initScrollToHash();
  initKeyboardNav();
  initLessonImages();
  initLessonLinks();

  // Initial reading progress
  updateReadingProgress();
}

document.addEventListener('DOMContentLoaded', init);