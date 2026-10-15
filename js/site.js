// Header behavior (solid bar after scrolling, mobile menu, sticky sign-up bar) and scroll reveal.
(() => {
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.getElementById('site-menu');
  const bar = document.getElementById('site-cta-bar');
  const form = document.getElementById('unete');

  if (nav && toggle && menu && bar) {
    let scrolled = false;   // page scrolled past the top: header gets a solid background
    let pastHero = false;   // scrolled far enough, and the form isn't on screen: show the sticky bar
    let menuOpen = false;

    const render = () => {
      nav.classList.toggle('is-solid', scrolled || menuOpen);
      toggle.setAttribute('aria-expanded', String(menuOpen));
      menu.hidden = !menuOpen;
      bar.hidden = !(pastHero && !menuOpen);
    };
    const closeMenu = () => { if (menuOpen) { menuOpen = false; render(); } };

    const onScroll = () => {
      let inForm = false;
      if (form) {
        const r = form.getBoundingClientRect();
        inForm = r.top < window.innerHeight && r.bottom > 0;
      }
      const s = window.scrollY > 24, p = window.scrollY > 480 && !inForm;
      if (s !== scrolled || p !== pastHero) { scrolled = s; pastHero = p; render(); }
    };

    toggle.addEventListener('click', () => { menuOpen = !menuOpen; render(); });
    menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { closeMenu(); toggle.focus(); } });
    matchMedia('(max-width: 899.98px)').addEventListener('change', closeMenu);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    render();
  }

  // Scroll reveal: data-reveal="n" fades an element up (n * 80ms stagger); data-draw grows a line.
  if (document.documentElement.classList.contains('reveal-on')) {
    const items = document.querySelectorAll('[data-reveal], [data-draw]');
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }), { threshold: 0.1 });
    items.forEach(el => {
      el.style.setProperty('--reveal-delay', (parseInt(el.dataset.reveal, 10) || 0) * 80 + 'ms');
      io.observe(el);
    });
  }
})();
