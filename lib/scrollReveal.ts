const REVEAL_CLASSES = ['reveal', 'reveal-left', 'reveal-right', 'reveal-scale', 'reveal-stagger'];
const OBSERVER_CONFIG = { rootMargin: '0px 0px -60px 0px', threshold: 0.05 };

function init() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, OBSERVER_CONFIG);

  const scan = () => {
    document.querySelectorAll(REVEAL_CLASSES.map(c => `.${c}:not(.revealed)`).join(',')).forEach(el => observer.observe(el));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  const router = document.getElementById('root');
  if (router) {
    const mo = new MutationObserver(scan);
    mo.observe(router, { childList: true, subtree: true });
  }
}

init();
