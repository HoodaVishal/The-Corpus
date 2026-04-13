/* ============================================================
   NAVBAR.JS — The Corpus
   Handles: Search overlay animation, mobile menu toggle,
   active link detection, navbar scroll behaviour,
   keyboard accessibility, outside click handling
   ============================================================ */


/* ============================================================
   1. DOM REFERENCES
   ============================================================ */

const navbar              = document.getElementById('navbar');
const searchBtn           = document.querySelector('.navbar__search-btn');
const searchOverlay       = document.querySelector('.navbar__search-overlay');
const searchInput         = document.querySelector('.navbar__search-input');
const searchCancel        = document.querySelector('.navbar__search-cancel');
const menuBtn             = document.querySelector('.navbar__menu-btn');
const mobileMenu          = document.querySelector('.navbar__mobile-menu');
const navLinks            = document.querySelectorAll('.navbar__links a');
const mobileNavLinks      = document.querySelectorAll('.navbar__mobile-menu a');


/* ============================================================
   2. STATE
   ============================================================ */

let isSearchOpen    = false;
let isMobileOpen    = false;
let lastScrollY     = window.scrollY;
let scrollTimer     = null;


/* ============================================================
   3. SEARCH — OPEN
   ============================================================ */

function openSearch() {
  isSearchOpen = true;

  // Add class to navbar to trigger CSS hiding of logo/links
  navbar.classList.add('search-active');

  // Slide in the overlay
  searchOverlay.classList.add('is-active');

  // Focus input after transition completes
  setTimeout(() => {
    searchInput.focus();
  }, 400);

  // Close mobile menu if open
  if (isMobileOpen) {
    closeMobileMenu();
  }

  // Prevent body scroll on mobile
  document.body.style.overflow = 'hidden';
}


/* ============================================================
   4. SEARCH — CLOSE
   ============================================================ */

function closeSearch() {
  isSearchOpen = false;

  // Remove active class — CSS slides overlay back out
  navbar.classList.remove('search-active');
  searchOverlay.classList.remove('is-active');

  // Clear input value
  searchInput.value = '';

  // Restore body scroll
  document.body.style.overflow = '';
}


/* ============================================================
   5. SEARCH — EVENT LISTENERS
   ============================================================ */

// Open on search button click
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    openSearch();
  });
}

// Close on cancel button click
if (searchCancel) {
  searchCancel.addEventListener('click', () => {
    closeSearch();
  });
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isSearchOpen) {
      closeSearch();
    }
    if (isMobileOpen) {
      closeMobileMenu();
    }
  }
});

// Handle search form submission (Enter key)
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        handleSearch(query);
      }
    }
  });
}


/* ============================================================
   6. SEARCH — HANDLER
   Replace this with real search logic when ready
   ============================================================ */

function handleSearch(query) {
  // TODO: Replace with real search implementation
  // e.g. filter content, redirect to search results page
  console.log('Search query:', query);

  // Example: redirect to a search results page
  // window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
}


/* ============================================================
   7. MOBILE MENU — OPEN
   ============================================================ */

function openMobileMenu() {
  isMobileOpen = true;

  menuBtn.classList.add('is-open');
  mobileMenu.classList.add('is-open');

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Update accessibility
  menuBtn.setAttribute('aria-expanded', 'true');
  mobileMenu.setAttribute('aria-hidden', 'false');
}


/* ============================================================
   8. MOBILE MENU — CLOSE
   ============================================================ */

function closeMobileMenu() {
  isMobileOpen = false;

  menuBtn.classList.remove('is-open');
  mobileMenu.classList.remove('is-open');

  // Restore body scroll
  document.body.style.overflow = '';

  // Update accessibility
  menuBtn.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
}


/* ============================================================
   9. MOBILE MENU — TOGGLE
   ============================================================ */

function toggleMobileMenu() {
  if (isMobileOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}


/* ============================================================
   10. MOBILE MENU — EVENT LISTENERS
   ============================================================ */

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    toggleMobileMenu();
  });
}

// Close mobile menu when a nav link is clicked
mobileNavLinks.forEach((link) => {
  link.addEventListener('click', () => {
    closeMobileMenu();
  });
});

// Close mobile menu on resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) {
    if (isMobileOpen) {
      closeMobileMenu();
    }
    if (isSearchOpen) {
      closeSearch();
    }
  }
});


/* ============================================================
   11. OUTSIDE CLICK — close menus when clicking outside
   ============================================================ */

document.addEventListener('click', (e) => {

  // Close mobile menu if click is outside navbar and mobile menu
  if (
    isMobileOpen &&
    !navbar.contains(e.target) &&
    !mobileMenu.contains(e.target)
  ) {
    closeMobileMenu();
  }
});


/* ============================================================
   12. ACTIVE LINK DETECTION
   Highlights the current page link in the navbar
   ============================================================ */

function setActiveLink() {
  const currentPath = window.location.pathname;

  // Normalize: remove trailing slash except for root
  const normalizePath = (path) => {
    if (path === '/') return '/';
    return path.endsWith('/') ? path.slice(0, -1) : path;
  };

  const normalizedCurrent = normalizePath(currentPath);

  // Check desktop links
  navLinks.forEach((link) => {
    const linkPath = normalizePath(
      new URL(link.href, window.location.origin).pathname
    );

    if (linkPath === normalizedCurrent) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // Check mobile links
  mobileNavLinks.forEach((link) => {
    const linkPath = normalizePath(
      new URL(link.href, window.location.origin).pathname
    );

    if (linkPath === normalizedCurrent) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}


/* ============================================================
   13. SCROLL BEHAVIOUR
   Navbar hides on scroll down, shows on scroll up
   ============================================================ */

function handleNavbarScroll() {
  const currentScrollY = window.scrollY;

  // Don't hide navbar if search or mobile menu is open
  if (isSearchOpen || isMobileOpen) {
    lastScrollY = currentScrollY;
    return;
  }

  // At top of page — always show
  if (currentScrollY <= 0) {
    navbar.style.transform = 'translateY(0)';
    lastScrollY = currentScrollY;
    return;
  }

  // Scrolling down — hide navbar
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    navbar.style.transform = `translateY(-${navbar.offsetHeight}px)`;
  }

  // Scrolling up — show navbar
  if (currentScrollY < lastScrollY) {
    navbar.style.transform = 'translateY(0)';
  }

  lastScrollY = currentScrollY;
}

// Throttle scroll event for performance
window.addEventListener('scroll', () => {
  if (scrollTimer) return;

  scrollTimer = setTimeout(() => {
    handleNavbarScroll();
    scrollTimer = null;
  }, 100);
}, { passive: true });


/* ============================================================
   14. NAVBAR SCROLL TRANSITION
   Add smooth transition only after first scroll
   (prevents flash on page load)
   ============================================================ */

window.addEventListener('scroll', () => {
  navbar.style.transition = 'transform 0.3s ease';
}, { once: true, passive: true });


/* ============================================================
   15. ACCESSIBILITY — TRAP FOCUS IN MOBILE MENU
   ============================================================ */

function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a, button, input, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable  = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab — going backwards
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab — going forwards
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}

if (mobileMenu) {
  trapFocus(mobileMenu);
}


/* ============================================================
   16. INIT
   ============================================================ */

function init() {
  // Set active link on page load
  setActiveLink();

  // Set initial ARIA attributes
  if (menuBtn) {
    menuBtn.setAttribute('aria-expanded',  'false');
    menuBtn.setAttribute('aria-controls',  'mobile-menu');
    menuBtn.setAttribute('aria-label',     'Open navigation menu');
  }

  if (mobileMenu) {
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.setAttribute('id',          'mobile-menu');
  }

  if (searchBtn) {
    searchBtn.setAttribute('aria-label',   'Open search');
  }

  if (searchOverlay) {
    searchOverlay.setAttribute('role',     'search');
    searchOverlay.setAttribute('aria-label', 'Site search');
  }
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);