/**
 * BLOGGER TEMPLATE - SCRIPT.JS
 * rapspoint.github.io/tema-baru-saya/
 * TradingView Ticker | AOS | TOC | Dark Mode | AI Widget
 */

(function() {
  'use strict';

  const CONFIG = {
    TRADINGVIEW_SYMBOLS: [
      { proName: 'TVC:GOLD', title: 'GOLD' },
      { proName: 'BINANCE:BTCUSDT', title: 'BTC' },
      { proName: 'BINANCE:ETHUSDT', title: 'ETH' },
      { proName: 'BINANCE:XRPUSDT', title: 'XRP' },
      { proName: 'BINANCE:SOLUSDT', title: 'SOL' },
      { proName: 'BINANCE:USDTUSD', title: 'USDT' },
      { proName: 'BINANCE:USDCUSDT', title: 'USDC' },
      { proName: 'BINANCE:ARBUSDT', title: 'ARB' }
    ]
  };

  const state = {
    isDarkMode: false,
    tocObserver: null,
    tvScriptLoaded: false
  };

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /* ============================================ */
  /* TRADINGVIEW TICKER                           */
  /* ============================================ */
  const TradingViewTicker = {
    container: null,
    script: null,
    init() {
      this.container = document.getElementById('tradingview-ticker');
      if (!this.container) return;
      this.load();
    },
    load() {
      if (this.script) this.script.remove();
      this.container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

      const theme = state.isDarkMode ? 'dark' : 'light';
      const config = {
        symbols: CONFIG.TRADINGVIEW_SYMBOLS,
        showSymbolLogo: true,
        colorTheme: theme,
        isTransparent: true,
        displayMode: 'adaptive',
        locale: 'id'
      };

      this.script = document.createElement('script');
      this.script.type = 'text/javascript';
      this.script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      this.script.async = true;
      this.script.textContent = JSON.stringify(config);
      this.container.appendChild(this.script);
      state.tvScriptLoaded = true;
    },
    reload() {
      if (state.tvScriptLoaded) this.load();
    }
  };

  /* ============================================ */
  /* TABLE OF CONTENTS                            */
  /* ============================================ */
  const TOCGenerator = {
    container: null,
    headings: [],
    init() {
      this.container = document.getElementById('toc-container');
      if (!this.container) return;
      const articleBody = document.querySelector('.article-body') ||
                          document.querySelector('.post-body') ||
                          document.querySelector('article') ||
                          document.querySelector('.entry-content');
      if (!articleBody) {
        this.container.innerHTML = '<p class="text-sm text-gray-400 italic">Tidak ada konten artikel.</p>';
        return;
      }
      this.headings = Array.from(articleBody.querySelectorAll('h2, h3'));
      if (this.headings.length === 0) {
        this.container.innerHTML = '<p class="text-sm text-gray-400 italic">Tidak ada heading ditemukan.</p>';
        return;
      }
      this.generate();
      this.setupObserver();
      this.setupClicks();
    },
    generate() {
      const tocHTML = this.headings.map((heading, index) => {
        if (!heading.id) heading.id = 'heading-' + index;
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent.trim();
        const isH3 = level === 'h3';
        return '<a href="#' + heading.id + '" class="toc-link ' + (isH3 ? 'toc-h3' : '') + '" data-target="' + heading.id + '" title="' + text + '">' + text + '</a>';
      }).join('');
      this.container.innerHTML = tocHTML;
    },
    setupObserver() {
      const options = { root: null, rootMargin: '-100px 0px -60% 0px', threshold: 0 };
      state.tocObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) this.highlight(entry.target.id);
        });
      }, options);
      this.headings.forEach(h => state.tocObserver.observe(h));
    },
    highlight(id) {
      this.container.querySelectorAll('.toc-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === id) {
          link.classList.add('active');
          link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },
    setupClicks() {
      this.container.addEventListener('click', (e) => {
        const link = e.target.closest('.toc-link');
        if (!link) return;
        e.preventDefault();
        const target = document.getElementById(link.dataset.target);
        if (target) {
          window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
          history.pushState(null, null, '#' + link.dataset.target);
        }
      });
    },
    destroy() {
      if (state.tocObserver) state.tocObserver.disconnect();
    }
  };

  /* ============================================ */
  /* DARK MODE                                    */
  /* ============================================ */
  const DarkMode = {
    init() {
      const btn = document.getElementById('theme-toggle');
      if (!btn) return;
      const saved = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && systemDark)) this.enable();
      btn.addEventListener('click', () => this.toggle());
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) e.matches ? this.enable() : this.disable();
      });
    },
    enable() {
      document.documentElement.classList.add('dark');
      state.isDarkMode = true;
      localStorage.setItem('theme', 'dark');
      TradingViewTicker.reload();
    },
    disable() {
      document.documentElement.classList.remove('dark');
      state.isDarkMode = false;
      localStorage.setItem('theme', 'light');
      TradingViewTicker.reload();
    },
    toggle() {
      state.isDarkMode ? this.disable() : this.enable();
    }
  };

  /* ============================================ */
  /* MOBILE MENU                                  */
  /* ============================================ */
  const MobileMenu = {
    init() {
      const btn = document.getElementById('mobile-menu-btn');
      const menu = document.getElementById('mobile-menu');
      if (!btn || !menu) return;
      btn.addEventListener('click', () => {
        menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', menu.classList.contains('open'));
      });
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) menu.classList.remove('open');
      });
      window.addEventListener('resize', debounce(() => {
        if (window.innerWidth >= 768) menu.classList.remove('open');
      }, 150));
    }
  };

  /* ============================================ */
  /* HEADER SCROLL                                */
  /* ============================================ */
  const HeaderScroll = {
    init() {
      const header = document.getElementById('main-header');
      if (!header) return;
      window.addEventListener('scroll', debounce(() => {
        header.classList.toggle('scrolled', window.pageYOffset > 50);
      }, 10));
    }
  };

  /* ============================================ */
  /* AI WIDGET                                    */
  /* ============================================ */
  const AIWidget = {
    init() {
      const toggle = document.getElementById('ai-toggle-btn');
      const close = document.getElementById('ai-close-btn');
      const panel = document.getElementById('ai-chat-panel');
      if (!toggle || !panel) return;
      let isOpen = false;
      const open = () => {
        panel.classList.remove('hidden');
        requestAnimationFrame(() => panel.classList.add('open'));
        isOpen = true;
        toggle.setAttribute('aria-expanded', 'true');
      };
      const closePanel = () => {
        panel.classList.remove('open');
        setTimeout(() => panel.classList.add('hidden'), 300);
        isOpen = false;
        toggle.setAttribute('aria-expanded', 'false');
      };
      toggle.addEventListener('click', () => isOpen ? closePanel() : open());
      if (close) close.addEventListener('click', closePanel);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closePanel(); });
      document.addEventListener('click', (e) => {
        if (isOpen && !panel.contains(e.target) && !toggle.contains(e.target)) closePanel();
      });
    }
  };

  /* ============================================ */
  /* AOS INIT                                     */
  /* ============================================ */
  const AOSInit = {
    init() {
      if (typeof AOS === 'undefined') return;
      AOS.init({
        duration: 600,
        easing: 'ease-out-cubic',
        once: true,
        offset: 50,
        disable: function() { return window.innerWidth < 768; }
      });
    }
  };

  /* ============================================ */
  /* SMOOTH ANCHOR SCROLL                         */
  /* ============================================ */
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
          if (a.classList.contains('toc-link')) return;
          const href = a.getAttribute('href');
          if (!href || href === '#') return;
          const target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
        });
      });
    }
  };

  /* ============================================ */
  /* INIT ALL                                     */
  /* ============================================ */
  function init() {
    DarkMode.init();
    MobileMenu.init();
    HeaderScroll.init();
    TradingViewTicker.init();
    TOCGenerator.init();
    AIWidget.init();
    AOSInit.init();
    SmoothScroll.init();
    console.log('[Template] All modules initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', () => {
    TOCGenerator.destroy();
  });
})();
