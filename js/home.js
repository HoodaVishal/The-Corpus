/* ============================================================
   HOME.JS — The Corpus
   Handles: Scroll animations, topic card interactions,
   hero parallax, smooth scroll, scroll progress indicator
   ============================================================ */


/* ============================================================
   1. DOM REFERENCES
   ============================================================ */

const heroSection       = document.querySelector('.hero');
const heroContent       = document.querySelector('.hero__content');
const heroGradient      = document.querySelector('.hero__gradient');
const topicsSection     = document.querySelector('.topics');
const topicCards        = document.querySelectorAll('.topic-card');
const btnPrimary        = document.querySelector('.btn--primary');
const btnSecondary      = document.querySelector('.btn--secondary');


/* ============================================================
   2. SCROLL PROGRESS INDICATOR
   Thin line at very top of viewport showing page scroll %
   ============================================================ */

function createScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');

  Object.assign(bar.style, {
    position:        'fixed',
    top:             '0',
    left:            '0',
    height:          '2px',
    width:           '0%',
    backgroundColor: 'var(--color-accent)',
    zIndex:          '9999',
    transition:      'width 0.1s linear',
    pointerEvents:   'none',
  });

  document.body.appendChild(bar);
  return bar;
}

const scrollProgressBar = createScrollProgress();

function updateScrollProgress() {
  const scrollTop    = window.scrollY;
  const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
  const progress     = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgressBar.style.width = `${Math.min(progress, 100)}%`;
}


/* ============================================================
   3. INTERSECTION OBSERVER — REVEAL CARDS ON SCROLL
   Cards animate in when they enter the viewport
   ============================================================ */

function initCardReveal() {
  // Skip if no cards found
  if (!topicCards.length) return;

  // Only animate cards that are below the fold
  // Cards already in view on load are handled by CSS animation-delay
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Stop observing once revealed
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold:  0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  topicCards.forEach((card) => {
    observer.observe(card);
  });
}


/* ============================================================
   4. HERO PARALLAX
   Subtle parallax on hero gradient as user scrolls
   ============================================================ */

let parallaxTimer = null;

function handleHeroParallax() {
  if (!heroGradient) return;

  if (parallaxTimer) return;

  parallaxTimer = requestAnimationFrame(() => {
    const scrollY   = window.scrollY;
    const maxScroll = window.innerHeight;

    // Only apply within the hero section
    if (scrollY <= maxScroll) {
      const offset = scrollY * 0.4;
      heroGradient.style.transform = `translateY(${offset}px)`;

      // Fade out hero content on scroll
      if (heroContent) {
        const opacity = Math.max(0, 1 - (scrollY / (maxScroll * 0.6)));
        heroContent.style.opacity = opacity;
      }
    }

    parallaxTimer = null;
  });
}


/* ============================================================
   5. SMOOTH SCROLL — for anchor links like #topics
   ============================================================ */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId  = anchor.getAttribute('href');

      // Skip if just '#'
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--navbar-height'),
        10
      ) || 44;

      const targetTop = target.getBoundingClientRect().top
        + window.scrollY
        - navbarHeight
        - 20; // extra breathing room

      window.scrollTo({
        top:      targetTop,
        behavior: 'smooth',
      });
    });
  });
}


/* ============================================================
   6. TOPIC CARD — MOUSE TILT EFFECT
   Subtle 3D tilt on desktop hover
   ============================================================ */

function initCardTilt() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  topicCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect    = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top  + rect.height / 2;

      const deltaX  = (e.clientX - centerX) / (rect.width  / 2);
      const deltaY  = (e.clientY - centerY) / (rect.height / 2);

      const tiltX   = deltaY * -4; // max 4deg tilt on X axis
      const tiltY   = deltaX *  4; // max 4deg tilt on Y axis

      card.style.transform = `
        translateY(-2px)
        perspective(600px)
        rotateX(${tiltX}deg)
        rotateY(${tiltY}deg)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = `transform var(--transition-base)`;
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });
}


/* ============================================================
   7. TOPIC CARD — KEYBOARD NAVIGATION
   Enter or Space activates card link
   ============================================================ */

function initCardKeyboard() {
  topicCards.forEach((card) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'link');

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}


/* ============================================================
   8. HERO SCROLL INDICATOR — hide on scroll
   ============================================================ */

function initScrollIndicator() {
  const scrollIndicator = document.querySelector('.hero__scroll');
  if (!scrollIndicator) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      scrollIndicator.style.opacity = '0';
      scrollIndicator.style.pointerEvents = 'none';
    } else {
      scrollIndicator.style.opacity = '0.4';
      scrollIndicator.style.pointerEvents = 'auto';
    }
  }, { passive: true });
}


/* ============================================================
   9. TOPICS SECTION — STAGGER REVEAL
   Re-triggers stagger animation when topics come into view
   ============================================================ */

function initTopicsReveal() {
  if (!topicsSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          topicCards.forEach((card, index) => {
            setTimeout(() => {
              card.classList.add('is-visible');
            }, index * 60);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  observer.observe(topicsSection);
}


/* ============================================================
   10. PREFETCH TOPIC PAGES ON HOVER
   Speeds up navigation by preloading pages in background
   ============================================================ */

function initPrefetch() {
  // Only prefetch if browser supports it
  if (!document.createElement('link').relList?.supports?.('prefetch')) return;

  const prefetched = new Set();

  topicCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const href = card.getAttribute('href');
      if (!href || prefetched.has(href)) return;

      const link = document.createElement('link');
      link.rel  = 'prefetch';
      link.href = href;
      document.head.appendChild(link);

      prefetched.add(href);
    });
  });
}


/* ============================================================
   11. SCROLL EVENT HANDLER — consolidated
   All scroll-based logic in one listener for performance
   ============================================================ */

let scrollRAF = null;

function onScroll() {
  if (scrollRAF) return;

  scrollRAF = requestAnimationFrame(() => {
    updateScrollProgress();
    handleHeroParallax();
    scrollRAF = null;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });


/* ============================================================
   12. RESIZE HANDLER
   ============================================================ */

let resizeTimer = null;

function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    // Re-check touch capability on resize
    if (window.matchMedia('(hover: none)').matches) {
      topicCards.forEach((card) => {
        card.style.transform = '';
      });
    }
  }, 200);
}

window.addEventListener('resize', onResize, { passive: true });


/* ============================================================
   13. REDUCE MOTION — respect user preference
   ============================================================ */

function respectReducedMotion() {
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReduced) {
    // Remove all CSS animations
    document.documentElement.style.setProperty(
      '--transition-fast',   '0s'
    );
    document.documentElement.style.setProperty(
      '--transition-base',   '0s'
    );
    document.documentElement.style.setProperty(
      '--transition-slow',   '0s'
    );
    document.documentElement.style.setProperty(
      '--transition-slower', '0s'
    );

    // Stop parallax
    if (heroGradient) {
      heroGradient.style.transform = 'none';
    }

    // Reset hero content opacity
    if (heroContent) {
      heroContent.style.opacity = '1';
    }
  }
}


/* ============================================================
   14. INIT
   ============================================================ */

function init() {
  respectReducedMotion();
  initSmoothScroll();
  initCardReveal();
  initTopicsReveal();
  initCardTilt();
  initCardKeyboard();
  initScrollIndicator();
  initPrefetch();

  // Initial call to set progress bar on load
  updateScrollProgress();
}

document.addEventListener('DOMContentLoaded', init);